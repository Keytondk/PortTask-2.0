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

// RFQHandler handles RFQ HTTP requests
type RFQHandler struct {
	svc *service.RFQService
}

// NewRFQHandler creates a new RFQ handler
func NewRFQHandler(svc *service.RFQService) *RFQHandler {
	return &RFQHandler{svc: svc}
}

// List handles GET /api/v1/rfqs
func (h *RFQHandler) List(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	filter := model.RFQFilter{
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
	if serviceTypeID := r.URL.Query().Get("service_type_id"); serviceTypeID != "" {
		filter.ServiceTypeID = &serviceTypeID
	}
	if status := r.URL.Query().Get("status"); status != "" {
		s := model.RFQStatus(status)
		filter.Status = &s
	}

	result, err := h.svc.List(ctx, filter)
	if err != nil {
		response.InternalError(w, err)
		return
	}

	response.JSONWithMeta(w, http.StatusOK, result.RFQs, &response.Meta{
		Page:    result.Page,
		PerPage: result.PerPage,
		Total:   int64(result.Total),
	})
}

// Create handles POST /api/v1/rfqs
func (h *RFQHandler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var input model.CreateRFQInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	userID := middleware.GetUserID(ctx)
	orgID := middleware.GetOrganizationID(ctx)
	if userID == "" {
		response.Error(w, errors.NewUnauthorized("user not authenticated"))
		return
	}

	rfq, err := h.svc.Create(ctx, input, userID, orgID)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.Created(w, rfq)
}

// Get handles GET /api/v1/rfqs/{id}
func (h *RFQHandler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	rfq, err := h.svc.GetByID(ctx, id)
	if err != nil {
		response.NotFound(w, "RFQ")
		return
	}

	response.OK(w, rfq)
}

// Update handles PUT /api/v1/rfqs/{id}
func (h *RFQHandler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	var input model.UpdateRFQInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	userID := middleware.GetUserID(ctx)
	orgID := middleware.GetOrganizationID(ctx)
	if userID == "" {
		response.Error(w, errors.NewUnauthorized("user not authenticated"))
		return
	}

	rfq, err := h.svc.Update(ctx, id, input, userID, orgID)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.OK(w, rfq)
}

// Publish handles POST /api/v1/rfqs/{id}/publish
func (h *RFQHandler) Publish(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	userID := middleware.GetUserID(ctx)
	orgID := middleware.GetOrganizationID(ctx)
	if userID == "" {
		response.Error(w, errors.NewUnauthorized("user not authenticated"))
		return
	}

	rfq, err := h.svc.Publish(ctx, id, userID, orgID)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.OK(w, rfq)
}

// Close handles POST /api/v1/rfqs/{id}/close
func (h *RFQHandler) Close(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	userID := middleware.GetUserID(ctx)
	orgID := middleware.GetOrganizationID(ctx)
	if userID == "" {
		response.Error(w, errors.NewUnauthorized("user not authenticated"))
		return
	}

	rfq, err := h.svc.Close(ctx, id, userID, orgID)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.OK(w, rfq)
}

// Cancel handles POST /api/v1/rfqs/{id}/cancel
func (h *RFQHandler) Cancel(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	var input struct {
		Reason string `json:"reason"`
	}
	json.NewDecoder(r.Body).Decode(&input)

	userID := middleware.GetUserID(ctx)
	orgID := middleware.GetOrganizationID(ctx)
	if userID == "" {
		response.Error(w, errors.NewUnauthorized("user not authenticated"))
		return
	}

	rfq, err := h.svc.Cancel(ctx, id, input.Reason, userID, orgID)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.OK(w, rfq)
}

// GetQuotes handles GET /api/v1/rfqs/{id}/quotes
func (h *RFQHandler) GetQuotes(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	quotes, err := h.svc.GetQuotes(ctx, id)
	if err != nil {
		response.InternalError(w, err)
		return
	}

	response.OK(w, quotes)
}

// CompareQuotes handles GET /api/v1/rfqs/{id}/compare
func (h *RFQHandler) CompareQuotes(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	comparison, err := h.svc.CompareQuotes(ctx, id)
	if err != nil {
		response.InternalError(w, err)
		return
	}

	response.OK(w, comparison)
}

// SubmitQuote handles POST /api/v1/rfqs/{id}/quotes
func (h *RFQHandler) SubmitQuote(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	rfqID := chi.URLParam(r, "id")

	var input model.SubmitQuoteInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	userID := middleware.GetUserID(ctx)
	orgID := middleware.GetOrganizationID(ctx)
	if userID == "" {
		response.Error(w, errors.NewUnauthorized("user not authenticated"))
		return
	}

	// Get vendor ID from request body or context
	var vendorInput struct {
		VendorID string `json:"vendor_id"`
	}
	// Re-parse to get vendor_id (in real app, would get from vendor auth context)
	json.NewDecoder(r.Body).Decode(&vendorInput)

	if vendorInput.VendorID == "" {
		response.BadRequest(w, "vendor_id is required")
		return
	}

	quote, err := h.svc.SubmitQuote(ctx, rfqID, vendorInput.VendorID, input, userID, orgID)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.Created(w, quote)
}

// AwardQuote handles POST /api/v1/rfqs/{id}/award
func (h *RFQHandler) AwardQuote(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	rfqID := chi.URLParam(r, "id")

	var input struct {
		QuoteID string `json:"quote_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	if input.QuoteID == "" {
		response.BadRequest(w, "quote_id is required")
		return
	}

	userID := middleware.GetUserID(ctx)
	orgID := middleware.GetOrganizationID(ctx)
	if userID == "" {
		response.Error(w, errors.NewUnauthorized("user not authenticated"))
		return
	}

	rfq, err := h.svc.AwardQuote(ctx, rfqID, input.QuoteID, userID, orgID)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.OK(w, rfq)
}

// GetQuote handles GET /api/v1/quotes/{id}
func (h *RFQHandler) GetQuote(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	quote, err := h.svc.GetQuote(ctx, id)
	if err != nil {
		response.NotFound(w, "quote")
		return
	}

	response.OK(w, quote)
}

// WithdrawQuote handles POST /api/v1/quotes/{id}/withdraw
func (h *RFQHandler) WithdrawQuote(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	userID := middleware.GetUserID(ctx)
	orgID := middleware.GetOrganizationID(ctx)
	if userID == "" {
		response.Error(w, errors.NewUnauthorized("user not authenticated"))
		return
	}

	quote, err := h.svc.WithdrawQuote(ctx, id, userID, orgID)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.OK(w, quote)
}

// GetVendorRFQs handles GET /api/v1/vendors/{id}/rfqs
func (h *RFQHandler) GetVendorRFQs(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vendorID := chi.URLParam(r, "id")

	page := 1
	perPage := 20

	if p := r.URL.Query().Get("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}
	if pp := r.URL.Query().Get("per_page"); pp != "" {
		if parsed, err := strconv.Atoi(pp); err == nil && parsed > 0 && parsed <= 100 {
			perPage = parsed
		}
	}

	result, err := h.svc.GetRFQsForVendor(ctx, vendorID, page, perPage)
	if err != nil {
		response.InternalError(w, err)
		return
	}

	response.JSONWithMeta(w, http.StatusOK, result.RFQs, &response.Meta{
		Page:    result.Page,
		PerPage: result.PerPage,
		Total:   int64(result.Total),
	})
}
