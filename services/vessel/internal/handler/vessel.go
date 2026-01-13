package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/navo/services/vessel/internal/middleware"
	"github.com/navo/services/vessel/internal/model"
	"github.com/navo/services/vessel/internal/service"
)

// VesselHandler handles vessel HTTP requests
type VesselHandler struct {
	service *service.VesselService
}

// NewVesselHandler creates a new vessel handler
func NewVesselHandler(svc *service.VesselService) *VesselHandler {
	return &VesselHandler{service: svc}
}

// RegisterRoutes registers vessel routes
func (h *VesselHandler) RegisterRoutes(r chi.Router) {
	r.Route("/vessels", func(r chi.Router) {
		r.Get("/", h.List)
		r.Post("/", h.Create)
		r.Get("/{id}", h.GetByID)
		r.Put("/{id}", h.Update)
		r.Delete("/{id}", h.Delete)
		r.Get("/imo/{imo}", h.GetByIMO)
	})
}

// List handles GET /vessels
func (h *VesselHandler) List(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	workspaceID := middleware.GetWorkspaceID(ctx)
	if workspaceID == "" {
		respondError(w, http.StatusBadRequest, "workspace_id is required")
		return
	}

	filter := model.VesselFilter{
		WorkspaceID: &workspaceID,
		Page:        1,
		PerPage:     20,
	}

	// Parse query parameters
	if v := r.URL.Query().Get("page"); v != "" {
		if page := parseInt(v); page > 0 {
			filter.Page = page
		}
	}
	if v := r.URL.Query().Get("per_page"); v != "" {
		if perPage := parseInt(v); perPage > 0 && perPage <= 100 {
			filter.PerPage = perPage
		}
	}
	if v := r.URL.Query().Get("type"); v != "" {
		vesselType := model.VesselType(v)
		filter.Type = &vesselType
	}
	if v := r.URL.Query().Get("status"); v != "" {
		status := model.VesselStatus(v)
		filter.Status = &status
	}
	if v := r.URL.Query().Get("search"); v != "" {
		filter.Search = &v
	}

	result, err := h.service.List(ctx, filter)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, result)
}

// Create handles POST /vessels
func (h *VesselHandler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	workspaceID := middleware.GetWorkspaceID(ctx)
	if workspaceID == "" {
		respondError(w, http.StatusBadRequest, "workspace_id is required")
		return
	}

	var input model.CreateVesselInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Override workspace ID from context
	input.WorkspaceID = workspaceID

	vessel, err := h.service.Create(ctx, input)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, vessel)
}

// GetByID handles GET /vessels/{id}
func (h *VesselHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	vessel, err := h.service.GetByID(ctx, id)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, vessel)
}

// GetByIMO handles GET /vessels/imo/{imo}
func (h *VesselHandler) GetByIMO(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	imo := chi.URLParam(r, "imo")

	vessel, err := h.service.GetByIMO(ctx, imo)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, vessel)
}

// Update handles PUT /vessels/{id}
func (h *VesselHandler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	var input model.UpdateVesselInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	vessel, err := h.service.Update(ctx, id, input)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, vessel)
}

// Delete handles DELETE /vessels/{id}
func (h *VesselHandler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	if err := h.service.Delete(ctx, id); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// parseInt parses a string to int, returns 0 on error
func parseInt(s string) int {
	var n int
	for _, c := range s {
		if c >= '0' && c <= '9' {
			n = n*10 + int(c-'0')
		} else {
			return 0
		}
	}
	return n
}

// respondJSON sends a JSON response
func respondJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// respondError sends an error response
func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}
