package main

import (
	"context"
	"database/sql"
	"encoding/json"
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
	"github.com/navo/pkg/logger"
	"github.com/navo/services/integration/internal/config"
	"github.com/navo/services/integration/internal/handler"
	"github.com/navo/services/integration/internal/repository"
	"github.com/navo/services/integration/internal/service"
	"go.uber.org/zap"
)

func main() {
	// Initialize logger
	logger.Initialize()
	defer logger.Sync()

	// Load configuration
	cfg := config.Load()

	// Connect to database
	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}
	defer db.Close()

	// Configure connection pool
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Test connection
	if err := db.Ping(); err != nil {
		logger.Fatal("Failed to ping database", zap.Error(err))
	}
	logger.Info("Connected to database")

	// Initialize schema
	webhookRepo := repository.NewWebhookRepository(db)
	if err := webhookRepo.InitSchema(context.Background()); err != nil {
		logger.Warn("Failed to initialize schema (may already exist)", zap.Error(err))
	}

	// Initialize services
	webhookSvc := service.NewWebhookService(
		webhookRepo,
		zap.L(),
		service.WebhookConfig{
			Timeout:      cfg.WebhookTimeout,
			RetryCount:   cfg.WebhookRetryCount,
			RetryDelay:   cfg.WebhookRetryDelay,
			MaxBatchSize: cfg.WebhookMaxBatchSize,
		},
	)

	weatherSvc := service.NewWeatherService(
		cfg.WeatherAPIKey,
		cfg.WeatherAPIBaseURL,
		zap.L(),
	)

	exchangeSvc := service.NewExchangeRateService(
		cfg.ExchangeRateAPI,
		zap.L(),
	)

	// Initialize handlers
	webhookHandler := handler.NewWebhookHandler(webhookSvc, zap.L())
	externalHandler := handler.NewExternalHandler(weatherSvc, exchangeSvc, zap.L())

	// Create router
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	// CORS
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Organization-ID", "X-Workspace-ID"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "healthy",
			"service": "integration",
		})
	})

	// API routes
	r.Route("/api/v1", func(r chi.Router) {
		webhookHandler.RegisterRoutes(r)
		externalHandler.RegisterRoutes(r)
	})

	// Sync status endpoint
	r.Get("/api/v1/sync-status", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"weather": map[string]interface{}{
				"status":        "active",
				"sync_interval": cfg.WeatherSyncInterval.String(),
			},
			"exchange_rates": map[string]interface{}{
				"status":        "active",
				"sync_interval": cfg.ExchangeRateSyncInterval.String(),
			},
			"port_info": map[string]interface{}{
				"status":        "inactive",
				"sync_interval": cfg.PortInfoSyncInterval.String(),
			},
		})
	})

	// Start HTTP server
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		logger.Info("Integration service starting", zap.String("port", cfg.Port))
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("HTTP server error", zap.Error(err))
		}
	}()

	logger.Info("Integration service started")

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down integration service...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logger.Error("Server forced to shutdown", zap.Error(err))
	}

	fmt.Println("Integration service stopped")
}
