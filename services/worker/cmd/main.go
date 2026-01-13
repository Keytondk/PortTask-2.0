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
	_ "github.com/lib/pq"
	"github.com/navo/pkg/logger"
	"github.com/navo/services/worker/internal/config"
	"github.com/navo/services/worker/internal/jobs"
	"github.com/navo/services/worker/internal/scheduler"
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

	// Create scheduler
	sched := scheduler.NewScheduler(cfg.MaxConcurrentJobs, cfg.JobTimeout)

	// Register jobs
	registerJobs(sched, db, cfg)

	// Start scheduler
	sched.Start()

	// Create HTTP server for health checks and job management
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "healthy",
			"service": "worker",
		})
	})

	// Job status endpoint
	r.Get("/jobs", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(sched.GetJobStatus())
	})

	// Trigger job manually
	r.Post("/jobs/{name}/run", func(w http.ResponseWriter, r *http.Request) {
		name := chi.URLParam(r, "name")
		if err := sched.RunNow(name); err != nil {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "job not found"})
			return
		}
		json.NewEncoder(w).Encode(map[string]string{"message": "job triggered"})
	})

	// Start HTTP server
	server := &http.Server{
		Addr:    ":8085",
		Handler: r,
	}

	go func() {
		logger.Info("Worker HTTP server starting", zap.String("port", "8085"))
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("HTTP server error", zap.Error(err))
		}
	}()

	logger.Info("Worker service started")

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down worker service...")

	// Stop scheduler first
	sched.Stop()

	// Then stop HTTP server
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	server.Shutdown(ctx)

	fmt.Println("Worker service stopped")
}

func registerJobs(sched *scheduler.Scheduler, db *sql.DB, cfg *config.Config) {
	// Session cleanup - runs hourly
	sched.RegisterJob(
		jobs.NewSessionCleanupJob(db),
		cfg.SessionCleanupInterval,
	)

	// Notification sender - runs every 30 seconds
	sched.RegisterJob(
		jobs.NewNotificationSenderJob(db, jobs.NotificationSenderConfig{
			SMTPHost:     cfg.SMTPHost,
			SMTPPort:     cfg.SMTPPort,
			SMTPUser:     cfg.SMTPUser,
			SMTPPassword: cfg.SMTPPassword,
			FromEmail:    cfg.FromEmail,
			FromName:     cfg.FromName,
		}),
		cfg.NotificationCheckInterval,
	)

	// Data aggregation - runs daily at midnight
	sched.RegisterJob(
		jobs.NewDataAggregationJob(db),
		24*time.Hour,
	)

	logger.Info("Registered all jobs",
		zap.Duration("session_cleanup", cfg.SessionCleanupInterval),
		zap.Duration("notification_check", cfg.NotificationCheckInterval),
	)
}
