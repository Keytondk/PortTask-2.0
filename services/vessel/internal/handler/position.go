package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/navo/services/vessel/internal/middleware"
	"github.com/navo/services/vessel/internal/model"
	"github.com/navo/services/vessel/internal/service"
)

// PositionHandler handles vessel position HTTP requests
type PositionHandler struct {
	trackingService *service.TrackingService
	vesselService   *service.VesselService
}

// NewPositionHandler creates a new position handler
func NewPositionHandler(trackingSvc *service.TrackingService) *PositionHandler {
	return &PositionHandler{trackingService: trackingSvc}
}

// NewPositionHandlerWithVessel creates a position handler with vessel service for refresh
func NewPositionHandlerWithVessel(trackingSvc *service.TrackingService, vesselSvc *service.VesselService) *PositionHandler {
	return &PositionHandler{
		trackingService: trackingSvc,
		vesselService:   vesselSvc,
	}
}

// RegisterRoutes registers position routes
func (h *PositionHandler) RegisterRoutes(r chi.Router) {
	r.Route("/positions", func(r chi.Router) {
		r.Get("/fleet", h.GetFleetPositions)
		r.Get("/{vesselId}", h.GetLatest)
		r.Get("/{vesselId}/history", h.GetHistory)
		r.Get("/{vesselId}/track", h.GetTrack)
		r.Post("/{vesselId}", h.RecordPosition)
	})
}

// GetFleetPositions handles GET /positions/fleet
func (h *PositionHandler) GetFleetPositions(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	workspaceID := middleware.GetWorkspaceID(ctx)
	if workspaceID == "" {
		respondError(w, http.StatusBadRequest, "workspace_id is required")
		return
	}

	positions, err := h.trackingService.GetFleetPositions(ctx, workspaceID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]any{
		"positions": positions,
		"count":     len(positions),
		"timestamp": time.Now().UTC(),
	})
}

// GetLatest handles GET /positions/{vesselId}
func (h *PositionHandler) GetLatest(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vesselID := chi.URLParam(r, "vesselId")

	position, err := h.trackingService.GetLatestPosition(ctx, vesselID)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, position)
}

// GetHistory handles GET /positions/{vesselId}/history
func (h *PositionHandler) GetHistory(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vesselID := chi.URLParam(r, "vesselId")

	// Parse time range from query params
	startTime := time.Now().UTC().Add(-24 * time.Hour) // Default: last 24 hours
	endTime := time.Now().UTC()
	limit := 1000

	if v := r.URL.Query().Get("start"); v != "" {
		if t, err := time.Parse(time.RFC3339, v); err == nil {
			startTime = t
		}
	}
	if v := r.URL.Query().Get("end"); v != "" {
		if t, err := time.Parse(time.RFC3339, v); err == nil {
			endTime = t
		}
	}
	if v := r.URL.Query().Get("limit"); v != "" {
		if n := parseInt(v); n > 0 && n <= 10000 {
			limit = n
		}
	}

	filter := model.PositionFilter{
		VesselID:  vesselID,
		StartTime: startTime,
		EndTime:   endTime,
		Limit:     limit,
	}

	positions, err := h.trackingService.GetPositionHistory(ctx, filter)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]any{
		"vessel_id":  vesselID,
		"positions":  positions,
		"count":      len(positions),
		"start_time": startTime,
		"end_time":   endTime,
	})
}

// GetTrack handles GET /positions/{vesselId}/track
func (h *PositionHandler) GetTrack(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vesselID := chi.URLParam(r, "vesselId")

	// Parse time range from query params
	startTime := time.Now().UTC().Add(-24 * time.Hour) // Default: last 24 hours
	endTime := time.Now().UTC()

	if v := r.URL.Query().Get("start"); v != "" {
		if t, err := time.Parse(time.RFC3339, v); err == nil {
			startTime = t
		}
	}
	if v := r.URL.Query().Get("end"); v != "" {
		if t, err := time.Parse(time.RFC3339, v); err == nil {
			endTime = t
		}
	}

	track, err := h.trackingService.GetVesselTrack(ctx, vesselID, startTime, endTime)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, track)
}

// RecordPosition handles POST /positions/{vesselId}
func (h *PositionHandler) RecordPosition(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vesselID := chi.URLParam(r, "vesselId")

	var input struct {
		Latitude    float64    `json:"latitude"`
		Longitude   float64    `json:"longitude"`
		Heading     *float64   `json:"heading,omitempty"`
		Course      *float64   `json:"course,omitempty"`
		Speed       *float64   `json:"speed,omitempty"`
		Destination *string    `json:"destination,omitempty"`
		ETA         *time.Time `json:"eta,omitempty"`
		Source      string     `json:"source"`
		RecordedAt  *time.Time `json:"recorded_at,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Validate coordinates
	if input.Latitude < -90 || input.Latitude > 90 {
		respondError(w, http.StatusBadRequest, "latitude must be between -90 and 90")
		return
	}
	if input.Longitude < -180 || input.Longitude > 180 {
		respondError(w, http.StatusBadRequest, "longitude must be between -180 and 180")
		return
	}

	recordedAt := time.Now().UTC()
	if input.RecordedAt != nil {
		recordedAt = *input.RecordedAt
	}

	source := input.Source
	if source == "" {
		source = "manual"
	}

	update := model.PositionUpdate{
		VesselID:    vesselID,
		Latitude:    input.Latitude,
		Longitude:   input.Longitude,
		Heading:     input.Heading,
		Course:      input.Course,
		Speed:       input.Speed,
		Destination: input.Destination,
		ETA:         input.ETA,
		Source:      source,
		RecordedAt:  recordedAt,
	}

	position, err := h.trackingService.RecordPosition(ctx, update)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, position)
}

// GetPositionsInBounds handles GET /positions/bounds
func (h *PositionHandler) GetPositionsInBounds(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Parse bounds from query params
	neLat := parseFloat(r.URL.Query().Get("ne_lat"))
	neLng := parseFloat(r.URL.Query().Get("ne_lng"))
	swLat := parseFloat(r.URL.Query().Get("sw_lat"))
	swLng := parseFloat(r.URL.Query().Get("sw_lng"))

	if neLat == 0 && neLng == 0 && swLat == 0 && swLng == 0 {
		respondError(w, http.StatusBadRequest, "bounds parameters required (ne_lat, ne_lng, sw_lat, sw_lng)")
		return
	}

	bounds := model.GeoBounds{
		NorthEast: model.GeoPoint{Latitude: neLat, Longitude: neLng},
		SouthWest: model.GeoPoint{Latitude: swLat, Longitude: swLng},
	}

	since := time.Now().UTC().Add(-1 * time.Hour) // Default: last hour
	if v := r.URL.Query().Get("since"); v != "" {
		if t, err := time.Parse(time.RFC3339, v); err == nil {
			since = t
		}
	}

	positions, err := h.trackingService.GetPositionsInBounds(ctx, bounds, since)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]any{
		"positions": positions,
		"count":     len(positions),
		"bounds":    bounds,
		"since":     since,
	})
}

// RefreshPositions handles POST /fleet/refresh
func (h *PositionHandler) RefreshPositions(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	workspaceID := middleware.GetWorkspaceID(ctx)
	if workspaceID == "" {
		respondError(w, http.StatusBadRequest, "workspace_id is required")
		return
	}

	// Get vessels with MMSI for the workspace
	if h.vesselService == nil {
		respondError(w, http.StatusInternalServerError, "vessel service not configured")
		return
	}

	vessels, err := h.vesselService.GetVesselsWithMMSI(ctx, workspaceID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if len(vessels) == 0 {
		respondJSON(w, http.StatusOK, map[string]any{
			"refreshed": 0,
			"message":   "no vessels with MMSI found in workspace",
		})
		return
	}

	// Refresh positions from AIS
	count, err := h.trackingService.RefreshFleetPositions(ctx, vessels)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]any{
		"refreshed":     count,
		"total_vessels": len(vessels),
		"timestamp":     time.Now().UTC(),
	})
}

// parseFloat parses a string to float64, returns 0 on error
func parseFloat(s string) float64 {
	if s == "" {
		return 0
	}

	var result float64
	var decimal float64 = 1
	var isDecimal bool
	var isNegative bool

	for i, c := range s {
		if i == 0 && c == '-' {
			isNegative = true
			continue
		}
		if c == '.' {
			isDecimal = true
			continue
		}
		if c >= '0' && c <= '9' {
			if isDecimal {
				decimal *= 10
				result += float64(c-'0') / decimal
			} else {
				result = result*10 + float64(c-'0')
			}
		}
	}

	if isNegative {
		result = -result
	}

	return result
}
