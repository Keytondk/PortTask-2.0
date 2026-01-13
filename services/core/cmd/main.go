package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/navo/pkg/auth"
	"github.com/navo/pkg/database"
	"github.com/navo/pkg/logger"
	"github.com/navo/pkg/redis"
	"github.com/navo/services/core/internal/handler"
	"github.com/navo/services/core/internal/middleware"
	"github.com/navo/services/core/internal/repository"
	"github.com/navo/services/core/internal/service"
	"go.uber.org/zap"
)

func main() {
	log := logger.NewLogger()
	defer log.Sync()

	port := os.Getenv("PORT")
	if port == "" {
		port = "4002"
	}

	log.Info("Starting Core Service", zap.String("port", port))

	// Initialize authentication - panics if JWT_SECRET not set
	auth.Initialize()
	log.Info("Authentication initialized")

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Connect to PostgreSQL (returns *pgxpool.Pool)
	pool, err := database.Connect(ctx, database.DefaultConfig())
	if err != nil {
		log.Fatal("Failed to connect to database", zap.Error(err))
	}
	defer database.Close()

	// Convert to *sql.DB for repositories and RLS
	db := database.GetStdLib(pool)

	// Connect to Redis
	redisClient, err := redis.Connect(ctx, redis.DefaultConfig())
	if err != nil {
		log.Fatal("Failed to connect to Redis", zap.Error(err))
	}
	defer redis.Close()

	// Initialize repositories
	portCallRepo := repository.NewPortCallRepository(db)
	serviceOrderRepo := repository.NewServiceOrderRepository(db)
	rfqRepo := repository.NewRFQRepository(db)
	workspaceRepo := repository.NewWorkspaceRepository(db)

	// Initialize services
	portCallSvc := service.NewPortCallService(portCallRepo, redisClient)
	serviceOrderSvc := service.NewServiceOrderService(serviceOrderRepo, redisClient)
	rfqSvc := service.NewRFQService(rfqRepo, redisClient)
	workspaceSvc := service.NewWorkspaceService(workspaceRepo, redisClient)

	// Initialize handlers
	portCallHandler := handler.NewPortCallHandler(portCallSvc)
	serviceOrderHandler := handler.NewServiceOrderHandler(serviceOrderSvc)
	rfqHandler := handler.NewRFQHandler(rfqSvc)
	workspaceHandler := handler.NewWorkspaceHandler(workspaceSvc)

	// Setup router
	r := chi.NewRouter()
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.Recoverer)
	r.Use(middleware.ExtractUserContext)   // Extract user context from gateway headers
	r.Use(middleware.TransactionalRLS(db)) // Enforce RLS via transaction

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy"}`))
	})

	// API routes
	r.Route("/api/v1", func(r chi.Router) {
		// Workspaces
		r.Route("/workspaces", func(r chi.Router) {
			r.Get("/", workspaceHandler.List)
			r.Post("/", workspaceHandler.Create)
			r.Get("/{id}", workspaceHandler.Get)
			r.Put("/{id}", workspaceHandler.Update)
			r.Delete("/{id}", workspaceHandler.Delete)
		})

		// Port Calls
		r.Route("/port-calls", func(r chi.Router) {
			r.Get("/", portCallHandler.List)
			r.Post("/", portCallHandler.Create)
			r.Get("/{id}", portCallHandler.Get)
			r.Put("/{id}", portCallHandler.Update)
			r.Delete("/{id}", portCallHandler.Delete)
			r.Get("/{id}/services", portCallHandler.ListServices)
			r.Post("/{id}/services", serviceOrderHandler.Create)
			r.Get("/{id}/timeline", portCallHandler.Timeline)
		})

		// Service Orders
		r.Route("/service-orders", func(r chi.Router) {
			r.Get("/", serviceOrderHandler.List)
			r.Get("/{id}", serviceOrderHandler.Get)
			r.Put("/{id}", serviceOrderHandler.Update)
			r.Delete("/{id}", serviceOrderHandler.Delete)
			r.Post("/{id}/confirm", serviceOrderHandler.Confirm)
			r.Post("/{id}/complete", serviceOrderHandler.Complete)
		})

		// RFQs
		r.Route("/rfqs", func(r chi.Router) {
			r.Get("/", rfqHandler.List)
			r.Post("/", rfqHandler.Create)
			r.Get("/{id}", rfqHandler.Get)
			r.Put("/{id}", rfqHandler.Update)
			r.Delete("/{id}", rfqHandler.Delete)
			r.Post("/{id}/send", rfqHandler.Send)
			r.Get("/{id}/quotes", rfqHandler.ListQuotes)
			r.Post("/{id}/award/{quoteId}", rfqHandler.Award)
		})
	})

	// Create server
	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server
	go func() {
		log.Info("Core service listening", zap.String("port", port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Server failed", zap.Error(err))
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("Shutting down server...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatal("Server forced to shutdown", zap.Error(err))
	}

	log.Info("Server exited properly")
}
