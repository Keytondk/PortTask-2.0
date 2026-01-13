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
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-redis/redis/v8"
	"github.com/navo/services/notification/internal/config"
	"github.com/navo/services/notification/internal/handler"
	"github.com/navo/services/notification/internal/repository"
	"github.com/navo/services/notification/internal/service"
	"github.com/navo/services/notification/internal/worker"
)

func main() {
	cfg := config.Load()

	// Initialize Redis
	redisClient := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := redisClient.Ping(ctx).Err(); err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	log.Println("Connected to Redis")

	// Initialize repositories
	notificationRepo := repository.NewNotificationRepository(redisClient)
	templateRepo := repository.NewTemplateRepository()

	// Initialize email service
	emailService := service.NewEmailService(service.EmailConfig{
		SMTPHost:     cfg.SMTPHost,
		SMTPPort:     cfg.SMTPPort,
		SMTPUsername: cfg.SMTPUsername,
		SMTPPassword: cfg.SMTPPassword,
		FromAddress:  cfg.FromAddress,
		FromName:     cfg.FromName,
	})

	// Initialize notification service
	notificationService := service.NewNotificationService(
		emailService,
		notificationRepo,
		templateRepo,
		redisClient,
	)

	// Initialize notification worker
	notificationWorker := worker.NewNotificationWorker(
		notificationService,
		redisClient,
	)

	// Start worker
	workerCtx, workerCancel := context.WithCancel(context.Background())
	go notificationWorker.Start(workerCtx)

	// Initialize handlers
	notificationHandler := handler.NewNotificationHandler(notificationService)

	// Setup router
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Timeout(30 * time.Second))

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"healthy","service":"notification"}`))
	})

	// API routes
	r.Route("/api/v1", func(r chi.Router) {
		r.Route("/notifications", func(r chi.Router) {
			r.Post("/", notificationHandler.Send)
			r.Post("/batch", notificationHandler.SendBatch)
			r.Get("/{id}", notificationHandler.Get)
			r.Get("/user/{userID}", notificationHandler.GetByUser)
			r.Put("/{id}/read", notificationHandler.MarkAsRead)
			r.Put("/user/{userID}/read-all", notificationHandler.MarkAllAsRead)
			r.Delete("/{id}", notificationHandler.Delete)
		})

		r.Route("/templates", func(r chi.Router) {
			r.Get("/", notificationHandler.ListTemplates)
			r.Get("/{name}", notificationHandler.GetTemplate)
			r.Post("/{name}/preview", notificationHandler.PreviewTemplate)
		})
	})

	// Start server
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("Notification service starting on port %s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down notification service...")

	workerCancel()

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("Server shutdown error: %v", err)
	}

	redisClient.Close()
	log.Println("Notification service stopped")
}
