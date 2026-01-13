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

// VendorHandler handles vendor HTTP requests
type VendorHandler struct {
	svc *service.VendorService
}

// NewVendorHandler creates a new vendor handler
func NewVendorHandler(svc *service.VendorService) *VendorHandler {
	return &VendorHandler{svc: svc}
}

// List handles GET /api/v1/vendors
func (h *VendorHandler) List(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	filter := model.VendorFilter{
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
	if status := r.URL.Query().Get("status"); status != "" {
		s := model.VendorStatus(status)
		filter.Status = &s
	}
	if verified := r.URL.Query().Get("is_verified"); verified != "" {
		v := verified == "true"
		filter.IsVerified = &v
	}
	if certified := r.URL.Query().Get("is_certified"); certified != "" {
		c := certified == "true"
		filter.IsCertified = &c
	}
	if search := r.URL.Query().Get("search"); search != "" {
		filter.Search = &search
	}

	result, err := h.svc.List(ctx, filter)
	if err != nil {
		response.InternalError(w, err)
		return
	}

	response.JSONWithMeta(w, http.StatusOK, result.Vendors, &response.Meta{
		Page:    result.Page,
		PerPage: result.PerPage,
		Total:   int64(result.Total),
	})
}

// ListForOperator handles GET /api/v1/operators/{org_id}/vendors
// Lists vendors in an operator's approved network
func (h *VendorHandler) ListForOperator(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	operatorOrgID := chi.URLParam(r, "org_id")

	// Verify user belongs to this organization
	userOrgID := middleware.GetOrganizationID(ctx)
	if userOrgID != operatorOrgID {
		response.Error(w, errors.NewForbidden("access denied"))
		return
	}

	filter := model.VendorFilter{
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
	if search := r.URL.Query().Get("search"); search != "" {
		filter.Search = &search
	}

	result, err := h.svc.ListForOperator(ctx, operatorOrgID, filter)
	if err != nil {
		response.InternalError(w, err)
		return
	}

	response.JSONWithMeta(w, http.StatusOK, result.Vendors, &response.Meta{
		Page:    result.Page,
		PerPage: result.PerPage,
		Total:   int64(result.Total),
	})
}

// Get handles GET /api/v1/vendors/{id}
func (h *VendorHandler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	vendor, err := h.svc.GetByID(ctx, id)
	if err != nil {
		response.NotFound(w, "vendor")
		return
	}

	response.OK(w, vendor)
}

// Create handles POST /api/v1/vendors
func (h *VendorHandler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var input model.CreateVendorInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	orgID := middleware.GetOrganizationID(ctx)
	if orgID == "" {
		response.Error(w, errors.NewUnauthorized("user not authenticated"))
		return
	}

	vendor, err := h.svc.Create(ctx, input, orgID)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.Created(w, vendor)
}

// Update handles PUT /api/v1/vendors/{id}
func (h *VendorHandler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	var input model.UpdateVendorInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	vendor, err := h.svc.Update(ctx, id, input)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.OK(w, vendor)
}

// GetBadges handles GET /api/v1/vendors/{id}/badges
func (h *VendorHandler) GetBadges(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	badges, err := h.svc.GetBadges(ctx, id)
	if err != nil {
		response.NotFound(w, "vendor")
		return
	}

	response.OK(w, badges)
}

// SetVerified handles POST /api/v1/vendors/{id}/verify
// Admin endpoint to set vendor verified status
func (h *VendorHandler) SetVerified(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	var input struct {
		Verified bool `json:"verified"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	// TODO: Check if user is admin

	vendor, err := h.svc.SetVerified(ctx, id, input.Verified)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.OK(w, vendor)
}

// SetCertified handles POST /api/v1/vendors/{id}/certify
// Admin endpoint to set vendor certified status after document review
func (h *VendorHandler) SetCertified(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	var input struct {
		Certified bool `json:"certified"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	// TODO: Check if user is admin

	vendor, err := h.svc.SetCertified(ctx, id, input.Certified)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.OK(w, vendor)
}

// SubmitCertification handles POST /api/v1/vendors/{id}/certifications
func (h *VendorHandler) SubmitCertification(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	var input model.SubmitCertificationInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	vendor, err := h.svc.SubmitCertification(ctx, id, input)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.OK(w, vendor)
}

// Activate handles POST /api/v1/vendors/{id}/activate
func (h *VendorHandler) Activate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	vendor, err := h.svc.Activate(ctx, id)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.OK(w, vendor)
}

// Suspend handles POST /api/v1/vendors/{id}/suspend
func (h *VendorHandler) Suspend(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	vendor, err := h.svc.Suspend(ctx, id)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.OK(w, vendor)
}

// InviteVendor handles POST /api/v1/vendors/invite
func (h *VendorHandler) InviteVendor(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var input model.InviteVendorInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	userID := middleware.GetUserID(ctx)
	orgID := middleware.GetOrganizationID(ctx)
	if userID == "" || orgID == "" {
		response.Error(w, errors.NewUnauthorized("user not authenticated"))
		return
	}

	result, err := h.svc.InviteVendor(ctx, orgID, input, userID)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	if result.AutoAdded {
		response.OK(w, result)
	} else {
		response.Created(w, result)
	}
}

// AcceptInvitation handles POST /api/v1/vendors/invitations/accept
func (h *VendorHandler) AcceptInvitation(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var input model.AcceptInvitationInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.BadRequest(w, "invalid request body")
		return
	}

	orgID := middleware.GetOrganizationID(ctx)

	vendor, err := h.svc.AcceptInvitation(ctx, input.Token, input, orgID)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.OK(w, vendor)
}

// ListInvitations handles GET /api/v1/vendors/invitations
func (h *VendorHandler) ListInvitations(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	orgID := middleware.GetOrganizationID(ctx)
	if orgID == "" {
		response.Error(w, errors.NewUnauthorized("user not authenticated"))
		return
	}

	filter := model.InvitationFilter{
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
	if status := r.URL.Query().Get("status"); status != "" {
		s := model.InvitationStatus(status)
		filter.Status = &s
	}

	result, err := h.svc.ListInvitations(ctx, orgID, filter)
	if err != nil {
		response.InternalError(w, err)
		return
	}

	response.JSONWithMeta(w, http.StatusOK, result.Invitations, &response.Meta{
		Page:    result.Page,
		PerPage: result.PerPage,
		Total:   int64(result.Total),
	})
}

// CancelInvitation handles POST /api/v1/vendors/invitations/{id}/cancel
func (h *VendorHandler) CancelInvitation(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := chi.URLParam(r, "id")

	orgID := middleware.GetOrganizationID(ctx)
	if orgID == "" {
		response.Error(w, errors.NewUnauthorized("user not authenticated"))
		return
	}

	err := h.svc.CancelInvitation(ctx, id, orgID)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.OK(w, map[string]string{"message": "invitation cancelled"})
}

// RemoveFromList handles DELETE /api/v1/operators/{org_id}/vendors/{vendor_id}
func (h *VendorHandler) RemoveFromList(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	operatorOrgID := chi.URLParam(r, "org_id")
	vendorID := chi.URLParam(r, "vendor_id")

	// Verify user belongs to this organization
	userOrgID := middleware.GetOrganizationID(ctx)
	if userOrgID != operatorOrgID {
		response.Error(w, errors.NewForbidden("access denied"))
		return
	}

	err := h.svc.RemoveVendorFromList(ctx, operatorOrgID, vendorID)
	if err != nil {
		response.Error(w, errors.NewBadRequest(err.Error()))
		return
	}

	response.OK(w, map[string]string{"message": "vendor removed from list"})
}
