package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/navo/pkg/database"
	"github.com/navo/pkg/redis"
	"github.com/navo/pkg/response"
)

// HealthResponse represents health check response
type HealthResponse struct {
	Status    string            `json:"status"`
	Timestamp string            `json:"timestamp"`
	Services  map[string]string `json:"services,omitempty"`
}

// Health handles health check requests
func Health(w http.ResponseWriter, r *http.Request) {
	response.OK(w, HealthResponse{
		Status:    "healthy",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

// Ready handles readiness check requests
func Ready(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	services := make(map[string]string)
	allHealthy := true

	// Check database
	if err := database.Health(ctx); err != nil {
		services["database"] = "unhealthy"
		allHealthy = false
	} else {
		services["database"] = "healthy"
	}

	// Check Redis
	if err := redis.Health(ctx); err != nil {
		services["redis"] = "unhealthy"
		allHealthy = false
	} else {
		services["redis"] = "healthy"
	}

	status := "ready"
	statusCode := http.StatusOK
	if !allHealthy {
		status = "not_ready"
		statusCode = http.StatusServiceUnavailable
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response.JSON(w, statusCode, HealthResponse{
		Status:    status,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Services:  services,
	})
}
