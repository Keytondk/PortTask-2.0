package main

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	_ "github.com/lib/pq"
	"github.com/navo/pkg/auth"
	"github.com/navo/pkg/logger"
	"github.com/navo/services/auth/internal/config"
	"github.com/navo/services/auth/internal/handler"
	"github.com/navo/services/auth/internal/repository"
	"github.com/navo/services/auth/internal/service"
	"go.uber.org/zap"
)

func main() {
	// Initialize logger
	logger.Initialize()
	defer logger.Sync()

	// Load configuration
	cfg := config.Load()

	// Initialize JWT
	auth.Initialize()

	// Connect to database
	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}
	defer db.Close()

	// Configure connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Test connection
	if err := db.Ping(); err != nil {
		logger.Fatal("Failed to ping database", zap.Error(err))
	}
	logger.Info("Connected to database")

	// Initialize repository
	userRepo := repository.NewUserRepository(db)

	// Ensure required tables exist
	if err := userRepo.EnsureTablesExist(context.Background()); err != nil {
		logger.Fatal("Failed to ensure tables exist", zap.Error(err))
	}

	// Initialize service
	authService := service.NewAuthService(userRepo, cfg)

	// Initialize handler
	authHandler := handler.NewAuthHandler(authService)

	// Create router
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))

	// CORS
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"}, // Configure properly in production
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Request-ID"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy","service":"auth"}`))
	})

	// Auth routes
	r.Route("/auth", func(r chi.Router) {
		authHandler.RegisterRoutes(r)
	})

	// API v1 alias
	r.Route("/api/v1/auth", func(r chi.Router) {
		authHandler.RegisterRoutes(r)
	})

	// Create server
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in goroutine
	go func() {
		logger.Info("Auth service starting", zap.String("port", cfg.Port))
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Failed to start server", zap.Error(err))
		}
	}()

	// Start session cleanup worker
	go func() {
		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()

		for range ticker.C {
			count, err := authService.CleanupExpiredSessions(context.Background())
			if err != nil {
				logger.Error("Failed to cleanup expired sessions", zap.Error(err))
			} else if count > 0 {
				logger.Info("Cleaned up expired sessions", zap.Int64("count", count))
			}
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down auth service...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logger.Fatal("Server forced to shutdown", zap.Error(err))
	}

	fmt.Println("Auth service stopped")
}
