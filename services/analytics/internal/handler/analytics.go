package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/navo/services/analytics/internal/service"
)

// AnalyticsHandler handles analytics HTTP requests
type AnalyticsHandler struct {
	svc *service.AnalyticsService
}

// NewAnalyticsHandler creates a new analytics handler
func NewAnalyticsHandler(svc *service.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{svc: svc}
}

// RegisterRoutes registers analytics routes
func (h *AnalyticsHandler) RegisterRoutes(r chi.Router) {
	r.Get("/dashboard", h.GetDashboard)
	r.Get("/port-calls", h.GetPortCallAnalytics)
	r.Get("/costs", h.GetCostAnalytics)
	r.Get("/vendors", h.GetVendorAnalytics)
	r.Get("/rfqs", h.GetRFQAnalytics)
}

// GetDashboard handles GET /api/v1/analytics/dashboard
func (h *AnalyticsHandler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	orgID := r.Header.Get("X-Organization-ID")
	if orgID == "" {
		respondError(w, http.StatusBadRequest, "organization ID required")
		return
	}

	metrics, err := h.svc.GetDashboardMetrics(r.Context(), orgID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to get dashboard metrics")
		return
	}

	respondJSON(w, http.StatusOK, metrics)
}

// GetPortCallAnalytics handles GET /api/v1/analytics/port-calls
func (h *AnalyticsHandler) GetPortCallAnalytics(w http.ResponseWriter, r *http.Request) {
	orgID := r.Header.Get("X-Organization-ID")
	if orgID == "" {
		respondError(w, http.StatusBadRequest, "organization ID required")
		return
	}

	startStr := r.URL.Query().Get("start_date")
	endStr := r.URL.Query().Get("end_date")
	start, end := h.svc.ParseDateRange(startStr, endStr)

	analytics, err := h.svc.GetPortCallAnalytics(r.Context(), orgID, start, end)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to get port call analytics")
		return
	}

	respondJSON(w, http.StatusOK, analytics)
}

// GetCostAnalytics handles GET /api/v1/analytics/costs
func (h *AnalyticsHandler) GetCostAnalytics(w http.ResponseWriter, r *http.Request) {
	orgID := r.Header.Get("X-Organization-ID")
	if orgID == "" {
		respondError(w, http.StatusBadRequest, "organization ID required")
		return
	}

	startStr := r.URL.Query().Get("start_date")
	endStr := r.URL.Query().Get("end_date")
	start, end := h.svc.ParseDateRange(startStr, endStr)

	analytics, err := h.svc.GetCostAnalytics(r.Context(), orgID, start, end)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to get cost analytics")
		return
	}

	respondJSON(w, http.StatusOK, analytics)
}

// GetVendorAnalytics handles GET /api/v1/analytics/vendors
func (h *AnalyticsHandler) GetVendorAnalytics(w http.ResponseWriter, r *http.Request) {
	orgID := r.Header.Get("X-Organization-ID")
	if orgID == "" {
		respondError(w, http.StatusBadRequest, "organization ID required")
		return
	}

	analytics, err := h.svc.GetVendorAnalytics(r.Context(), orgID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to get vendor analytics")
		return
	}

	respondJSON(w, http.StatusOK, analytics)
}

// GetRFQAnalytics handles GET /api/v1/analytics/rfqs
func (h *AnalyticsHandler) GetRFQAnalytics(w http.ResponseWriter, r *http.Request) {
	orgID := r.Header.Get("X-Organization-ID")
	if orgID == "" {
		respondError(w, http.StatusBadRequest, "organization ID required")
		return
	}

	startStr := r.URL.Query().Get("start_date")
	endStr := r.URL.Query().Get("end_date")
	start, end := h.svc.ParseDateRange(startStr, endStr)

	analytics, err := h.svc.GetRFQAnalytics(r.Context(), orgID, start, end)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to get RFQ analytics")
		return
	}

	respondJSON(w, http.StatusOK, analytics)
}

// Helper functions

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}
