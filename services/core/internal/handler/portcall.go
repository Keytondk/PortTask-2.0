package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/navo/pkg/errors"
	"github.com/navo/pkg/response"
	"github.com/navo/services/core/internal/middleware"
	"github.com/navo/services/core/internal/model"
	"github.com/navo/services/core/internal/service"
)

// PortCallHandler handles port call HTTP requests
type PortCallHandler struct {
	svc *service.PortCallService
}

// NewPortCallHandler creates a new port call handler
func NewPortCallHandler(svc *service.PortCallService) *PortCallHandler {
	return &PortCallHandler{svc: svc}
}

// List handles GET /api/v1/port-calls
func (h *PortCallHandler) List(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Parse query parameters
	filter := model.PortCallFilter{
		Page:    1,
		PerPage: 20,
	}

	if page := r.URL.Query().Get("page"); page != "" {
		if p, err := strconv.Atoi(page); err == nil && p > 0 {
			filter.Page = p
		}
	}
	if perPage := r.URL.Query().Get("per_page"); perPage != "" {
		if pp, err := strconv.Atoi(perPage); err == nil && pp > 0 && pp <= 100 {
			filter.PerPage = pp
		}
	}
	if workspaceID := r.URL.Query().Get("workspace_id"); workspaceID != "" {
		filter.WorkspaceID = &workspaceID
	}
	if vesselID := r.URL.Query().Get("vessel_id"); vesselID != "" {
		filter.VesselID = &vesselID
	}
	if portID := r.URL.Query().Get("port_id"); portID != "" {
		filter.PortID = &portID
	}
	if status := r.URL.Query().Get("status"); status != "" {
		s := model.PortCallStatus(status)
		filter.Status = &s
	}

	result, err := h.svc.List(ctx, filter)
	if err != nil {
		response.InternalError(w, err)
		return
	}

	response.JSONWithMeta(w, http.StatusOK, result.PortCalls, &response.Meta{
		Page:    result.Page,
		PerPage: result.PerPage,
		Total:   int64(result.Total),
	})
}

// Create handles POST /api/v1/port-calls
func (h *PortCallHandler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var input model.CreatePortCallInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	// Get user ID from auth context (forwarded by gateway)
	userID := middleware.GetUserID(ctx)
	if userID == "" {
		response.Unauthorized(w, "user context not found")
		return
	}

	// Get organization ID for tenant isolation
	orgID := middleware.GetOrganizationID(ctx)
	if orgID == "" {
		response.Unauthorized(w, "organization context not found")
		return
	}

	portCall, err := h.svc.Create(ctx, input, userID)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.Created(w, portCall)
}

// Get handles GET /api/v1/port-calls/{id}
func (h *PortCallHandler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	portCall, err := h.svc.GetByID(ctx, id)
	if err != nil {
		response.NotFound(w, "port call")
		return
	}

	response.OK(w, portCall)
}

// Update handles PUT /api/v1/port-calls/{id}
func (h *PortCallHandler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	var input model.UpdatePortCallInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	portCall, err := h.svc.Update(ctx, id, input)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.OK(w, portCall)
}

// Delete handles DELETE /api/v1/port-calls/{id}
func (h *PortCallHandler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	if err := h.svc.Delete(ctx, id); err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.OK(w, map[string]string{"message": "port call deleted"})
}

// ListServices handles GET /api/v1/port-calls/{id}/services
func (h *PortCallHandler) ListServices(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	services, err := h.svc.GetServices(ctx, id)
	if err != nil {
		response.NotFound(w, "port call")
		return
	}

	response.OK(w, services)
}

// Timeline handles GET /api/v1/port-calls/{id}/timeline
func (h *PortCallHandler) Timeline(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	events, err := h.svc.GetTimeline(ctx, id)
	if err != nil {
		response.NotFound(w, "port call")
		return
	}

	response.OK(w, events)
}
