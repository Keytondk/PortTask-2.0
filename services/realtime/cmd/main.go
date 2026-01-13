package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-redis/redis/v8"
	"github.com/navo/pkg/auth"
	"github.com/navo/services/realtime/internal/config"
	"github.com/navo/services/realtime/internal/handler"
	"github.com/navo/services/realtime/internal/hub"
	"github.com/navo/services/realtime/internal/middleware"
	"github.com/navo/services/realtime/internal/subscription"
)

func main() {
	// Load configuration
	cfg := config.Load()
	if err := cfg.Validate(); err != nil {
		log.Fatalf("Invalid configuration: %v", err)
	}

	// Initialize Redis client
	redisClient := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisURL,
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	})

	// Test Redis connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	if err := redisClient.Ping(ctx).Err(); err != nil {
		log.Printf("Warning: Redis connection failed: %v", err)
		log.Println("Running without Redis pub/sub support (single instance mode)")
		redisClient = nil
	}
	cancel()

	// Initialize JWT service for authentication
	var jwtService *auth.JWTService
	if cfg.JWTSecret != "" {
		jwtService = auth.NewJWTService(cfg.JWTSecret, 24*time.Hour)
	} else {
		log.Println("Warning: JWT_SECRET not set, authentication disabled")
	}

	// Create hub
	h := hub.NewHub()

	// Start hub in background
	hubCtx, hubCancel := context.WithCancel(context.Background())
	go h.Run(hubCtx)

	// Create subscription manager (if Redis available)
	var subMgr *subscription.Manager
	if redisClient != nil {
		subMgr = subscription.NewManager(redisClient, h)
		if err := subMgr.Start(); err != nil {
			log.Printf("Warning: Failed to start subscription manager: %v", err)
			subMgr = nil
		}
	}

	// Create handlers
	wsHandler := handler.NewWebSocketHandler(h)
	apiHandler := handler.NewAPIHandler(h, subMgr)

	// Setup router
	r := chi.NewRouter()

	// Global middleware
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.RequestID)
	r.Use(middleware.CORS(cfg.AllowedOrigins))

	// Health check (no auth required)
	r.Get("/health", apiHandler.Health)
	r.Get("/ready", apiHandler.Health)

	// WebSocket endpoint
	r.Group(func(r chi.Router) {
		// Optional auth for WebSocket (can also auth via query param)
		if jwtService != nil {
			r.Use(middleware.NewOptionalAuthMiddleware(jwtService).Handler)
		}
		r.Get("/ws", wsHandler.ServeWS)
	})

	// API endpoints (admin/internal)
	r.Route("/api/v1", func(r chi.Router) {
		// Stats endpoint (could be protected in production)
		r.Get("/stats", apiHandler.Stats)
		r.Get("/connections", apiHandler.GetConnections)

		// Protected admin endpoints
		r.Group(func(r chi.Router) {
			if jwtService != nil {
				r.Use(middleware.NewAuthMiddleware(jwtService).Handler)
			}
			r.Post("/events", apiHandler.PublishEvent)
			r.Post("/disconnect", apiHandler.DisconnectUser)
		})
	})

	// Create HTTP server
	server := &http.Server{
		Addr:         cfg.Host + ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
	}

	// Start server in background
	go func() {
		log.Printf("Realtime service starting on %s:%s", cfg.Host, cfg.Port)
		var err error
		if cfg.EnableTLS && cfg.TLSCert != "" && cfg.TLSKey != "" {
			err = server.ListenAndServeTLS(cfg.TLSCert, cfg.TLSKey)
		} else {
			err = server.ListenAndServe()
		}
		if err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down realtime service...")

	// Create shutdown context with timeout
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
	defer shutdownCancel()

	// Shutdown subscription manager
	if subMgr != nil {
		if err := subMgr.Stop(); err != nil {
			log.Printf("Error stopping subscription manager: %v", err)
		}
	}

	// Stop hub
	hubCancel()

	// Close Redis connection
	if redisClient != nil {
		if err := redisClient.Close(); err != nil {
			log.Printf("Error closing Redis connection: %v", err)
		}
	}

	// Shutdown HTTP server
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("Server shutdown error: %v", err)
	}

	log.Println("Realtime service stopped")
}
