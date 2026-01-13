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

// ServiceOrderHandler handles service order HTTP requests
type ServiceOrderHandler struct {
	svc *service.ServiceOrderService
}

// NewServiceOrderHandler creates a new service order handler
func NewServiceOrderHandler(svc *service.ServiceOrderService) *ServiceOrderHandler {
	return &ServiceOrderHandler{svc: svc}
}

// List handles GET /api/v1/service-orders
func (h *ServiceOrderHandler) List(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Parse query parameters
	filter := model.ServiceOrderFilter{
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
	if portCallID := r.URL.Query().Get("port_call_id"); portCallID != "" {
		filter.PortCallID = &portCallID
	}
	if vendorID := r.URL.Query().Get("vendor_id"); vendorID != "" {
		filter.VendorID = &vendorID
	}
	if serviceTypeID := r.URL.Query().Get("service_type_id"); serviceTypeID != "" {
		filter.ServiceTypeID = &serviceTypeID
	}
	if status := r.URL.Query().Get("status"); status != "" {
		s := model.ServiceOrderStatus(status)
		filter.Status = &s
	}

	result, err := h.svc.List(ctx, filter)
	if err != nil {
		response.InternalError(w, err)
		return
	}

	response.JSONWithMeta(w, http.StatusOK, result.ServiceOrders, &response.Meta{
		Page:    result.Page,
		PerPage: result.PerPage,
		Total:   int64(result.Total),
	})
}

// Create handles POST /api/v1/port-calls/{id}/services
func (h *ServiceOrderHandler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	portCallID := chi.URLParam(r, "id")

	var input model.CreateServiceOrderInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	// Set port call ID from URL
	input.PortCallID = portCallID

	// Get user context
	userID := middleware.GetUserID(ctx)
	orgID := middleware.GetOrganizationID(ctx)
	if userID == "" {
		response.Error(w, errors.NewUnauthorized("user not authenticated"))
		return
	}

	order, err := h.svc.Create(ctx, input, userID, orgID)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.Created(w, order)
}

// Get handles GET /api/v1/service-orders/{id}
func (h *ServiceOrderHandler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	order, err := h.svc.GetByID(ctx, id)
	if err != nil {
		response.NotFound(w, "service order")
		return
	}

	response.OK(w, order)
}

// Update handles PUT /api/v1/service-orders/{id}
func (h *ServiceOrderHandler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	var input model.UpdateServiceOrderInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	// Get user context
	userID := middleware.GetUserID(ctx)
	orgID := middleware.GetOrganizationID(ctx)
	if userID == "" {
		response.Error(w, errors.NewUnauthorized("user not authenticated"))
		return
	}

	order, err := h.svc.Update(ctx, id, input, userID, orgID)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.OK(w, order)
}

// Delete handles DELETE /api/v1/service-orders/{id}
func (h *ServiceOrderHandler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	// Get user context
	userID := middleware.GetUserID(ctx)
	orgID := middleware.GetOrganizationID(ctx)
	if userID == "" {
		response.Error(w, errors.NewUnauthorized("user not authenticated"))
		return
	}

	if err := h.svc.Delete(ctx, id, userID, orgID); err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.OK(w, map[string]string{"message": "service order deleted"})
}

// Confirm handles POST /api/v1/service-orders/{id}/confirm
func (h *ServiceOrderHandler) Confirm(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	var input struct {
		VendorID    string  `json:"vendor_id"`
		QuotedPrice float64 `json:"quoted_price"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	// Get user context
	userID := middleware.GetUserID(ctx)
	orgID := middleware.GetOrganizationID(ctx)
	if userID == "" {
		response.Error(w, errors.NewUnauthorized("user not authenticated"))
		return
	}

	order, err := h.svc.Confirm(ctx, id, input.VendorID, input.QuotedPrice, userID, orgID)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.OK(w, order)
}

// Complete handles POST /api/v1/service-orders/{id}/complete
func (h *ServiceOrderHandler) Complete(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	var input struct {
		FinalPrice *float64 `json:"final_price"`
	}
	json.NewDecoder(r.Body).Decode(&input) // Optional body

	// Get user context
	userID := middleware.GetUserID(ctx)
	orgID := middleware.GetOrganizationID(ctx)
	if userID == "" {
		response.Error(w, errors.NewUnauthorized("user not authenticated"))
		return
	}

	order, err := h.svc.Complete(ctx, id, input.FinalPrice, userID, orgID)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.OK(w, order)
}

// AssignVendor handles POST /api/v1/service-orders/{id}/assign-vendor
func (h *ServiceOrderHandler) AssignVendor(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	var input struct {
		VendorID string `json:"vendor_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	if input.VendorID == "" {
		response.BadRequest(w, "vendor_id is required")
		return
	}

	// Get user context
	userID := middleware.GetUserID(ctx)
	orgID := middleware.GetOrganizationID(ctx)
	if userID == "" {
		response.Error(w, errors.NewUnauthorized("user not authenticated"))
		return
	}

	order, err := h.svc.AssignVendor(ctx, id, input.VendorID, userID, orgID)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.OK(w, order)
}

// StartWork handles POST /api/v1/service-orders/{id}/start
func (h *ServiceOrderHandler) StartWork(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	// Get user context
	userID := middleware.GetUserID(ctx)
	orgID := middleware.GetOrganizationID(ctx)
	if userID == "" {
		response.Error(w, errors.NewUnauthorized("user not authenticated"))
		return
	}

	order, err := h.svc.StartWork(ctx, id, userID, orgID)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.OK(w, order)
}

// Cancel handles POST /api/v1/service-orders/{id}/cancel
func (h *ServiceOrderHandler) Cancel(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	var input struct {
		Reason string `json:"reason"`
	}
	json.NewDecoder(r.Body).Decode(&input) // Optional reason

	// Get user context
	userID := middleware.GetUserID(ctx)
	orgID := middleware.GetOrganizationID(ctx)
	if userID == "" {
		response.Error(w, errors.NewUnauthorized("user not authenticated"))
		return
	}

	order, err := h.svc.Cancel(ctx, id, input.Reason, userID, orgID)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.OK(w, order)
}

// GetStats handles GET /api/v1/port-calls/{id}/services/stats
func (h *ServiceOrderHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	portCallID := chi.URLParam(r, "id")

	stats, err := h.svc.GetStats(ctx, portCallID)
	if err != nil {
		response.InternalError(w, err)
		return
	}

	response.OK(w, stats)
}
