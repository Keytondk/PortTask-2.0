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
	"github.com/navo/services/vessel/internal/config"
	"github.com/navo/services/vessel/internal/handler"
	"github.com/navo/services/vessel/internal/integration"
	"github.com/navo/services/vessel/internal/middleware"
	"github.com/navo/services/vessel/internal/repository"
	"github.com/navo/services/vessel/internal/service"
	"go.uber.org/zap"
)

func main() {
	log := logger.NewLogger()
	defer log.Sync()

	// Load configuration
	cfg := config.Load()

	log.Info("Starting Vessel Service",
		zap.String("port", cfg.Port),
		zap.String("env", cfg.Env),
	)

	// Initialize authentication - panics if JWT_SECRET not set
	auth.Initialize()
	log.Info("Authentication initialized")

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Connect to PostgreSQL
	db, err := database.Connect(ctx, database.DefaultConfig())
	if err != nil {
		log.Fatal("Failed to connect to database", zap.Error(err))
	}
	defer database.Close()

	// Connect to Redis
	redisClient, err := redis.Connect(ctx, redis.DefaultConfig())
	if err != nil {
		log.Fatal("Failed to connect to Redis", zap.Error(err))
	}
	defer redis.Close()

	// Initialize AIS provider
	aisProvider := integration.NewAISProvider(cfg.AISProviderAPIKey, cfg.AISProviderType)

	// Initialize repositories
	vesselRepo := repository.NewVesselRepository(db)
	positionRepo := repository.NewPositionRepository(db)

	// Initialize services
	vesselSvc := service.NewVesselService(vesselRepo, redisClient)
	trackingSvc := service.NewTrackingService(positionRepo, redisClient, aisProvider)

	// Initialize handlers
	vesselHandler := handler.NewVesselHandler(vesselSvc)
	positionHandler := handler.NewPositionHandlerWithVessel(trackingSvc, vesselSvc)

	// Start background position update worker if enabled
	if cfg.EnablePositionPolling {
		go trackingSvc.StartPositionPolling(ctx, cfg.PollingInterval)
	}

	// Setup router
	r := chi.NewRouter()
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.Recoverer)
	r.Use(middleware.ExtractUserContext)

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy","service":"vessel"}`))
	})

	// API routes
	r.Route("/api/v1", func(r chi.Router) {
		// Vessels
		r.Route("/vessels", func(r chi.Router) {
			r.Get("/", vesselHandler.List)
			r.Post("/", vesselHandler.Create)
			r.Get("/{id}", vesselHandler.GetByID)
			r.Put("/{id}", vesselHandler.Update)
			r.Delete("/{id}", vesselHandler.Delete)
			r.Get("/imo/{imo}", vesselHandler.GetByIMO)
			r.Get("/{id}/position", positionHandler.GetLatest)
			r.Get("/{id}/track", positionHandler.GetTrack)
			r.Get("/{id}/positions", positionHandler.GetHistory)
			r.Post("/{id}/position", positionHandler.RecordPosition)
		})

		// Fleet operations
		r.Route("/fleet", func(r chi.Router) {
			r.Get("/positions", positionHandler.GetFleetPositions)
			r.Get("/bounds", positionHandler.GetPositionsInBounds)
			r.Post("/refresh", positionHandler.RefreshPositions)
		})
	})

	// Create server
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server
	go func() {
		log.Info("Vessel service listening", zap.String("port", cfg.Port))
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
