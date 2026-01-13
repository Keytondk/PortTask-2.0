package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/navo/services/integration/internal/model"
	"github.com/navo/services/integration/internal/service"
	"go.uber.org/zap"
)

// WebhookHandler handles webhook HTTP endpoints
type WebhookHandler struct {
	service *service.WebhookService
	logger  *zap.Logger
}

// NewWebhookHandler creates a new webhook handler
func NewWebhookHandler(svc *service.WebhookService, logger *zap.Logger) *WebhookHandler {
	return &WebhookHandler{
		service: svc,
		logger:  logger,
	}
}

// RegisterRoutes registers webhook routes
func (h *WebhookHandler) RegisterRoutes(r chi.Router) {
	r.Route("/webhooks", func(r chi.Router) {
		r.Get("/", h.ListWebhooks)
		r.Post("/", h.CreateWebhook)
		r.Get("/{id}", h.GetWebhook)
		r.Put("/{id}", h.UpdateWebhook)
		r.Delete("/{id}", h.DeleteWebhook)
		r.Post("/{id}/test", h.TestWebhook)
		r.Post("/{id}/regenerate-secret", h.RegenerateSecret)
		r.Get("/{id}/deliveries", h.GetDeliveries)
	})

	r.Get("/webhook-events", h.GetEventTypes)
}

// CreateWebhook creates a new webhook
func (h *WebhookHandler) CreateWebhook(w http.ResponseWriter, r *http.Request) {
	orgID := r.Header.Get("X-Organization-ID")
	if orgID == "" {
		h.errorResponse(w, http.StatusUnauthorized, "organization ID required")
		return
	}

	var req model.CreateWebhookRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.errorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	webhook, err := h.service.CreateWebhook(r.Context(), orgID, &req)
	if err != nil {
		h.logger.Error("Failed to create webhook", zap.Error(err))
		h.errorResponse(w, http.StatusInternalServerError, "failed to create webhook")
		return
	}

	h.jsonResponse(w, http.StatusCreated, webhook)
}

// GetWebhook retrieves a webhook
func (h *WebhookHandler) GetWebhook(w http.ResponseWriter, r *http.Request) {
	orgID := r.Header.Get("X-Organization-ID")
	webhookID := chi.URLParam(r, "id")

	webhook, err := h.service.GetWebhook(r.Context(), orgID, webhookID)
	if err != nil {
		h.errorResponse(w, http.StatusNotFound, "webhook not found")
		return
	}

	h.jsonResponse(w, http.StatusOK, webhook)
}

// ListWebhooks lists webhooks for an organization
func (h *WebhookHandler) ListWebhooks(w http.ResponseWriter, r *http.Request) {
	orgID := r.Header.Get("X-Organization-ID")
	if orgID == "" {
		h.errorResponse(w, http.StatusUnauthorized, "organization ID required")
		return
	}

	page := h.getIntParam(r, "page", 1)
	pageSize := h.getIntParam(r, "page_size", 20)

	result, err := h.service.ListWebhooks(r.Context(), orgID, page, pageSize)
	if err != nil {
		h.logger.Error("Failed to list webhooks", zap.Error(err))
		h.errorResponse(w, http.StatusInternalServerError, "failed to list webhooks")
		return
	}

	h.jsonResponse(w, http.StatusOK, result)
}

// UpdateWebhook updates a webhook
func (h *WebhookHandler) UpdateWebhook(w http.ResponseWriter, r *http.Request) {
	orgID := r.Header.Get("X-Organization-ID")
	webhookID := chi.URLParam(r, "id")

	var req model.UpdateWebhookRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.errorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	webhook, err := h.service.UpdateWebhook(r.Context(), orgID, webhookID, &req)
	if err != nil {
		h.logger.Error("Failed to update webhook", zap.Error(err))
		h.errorResponse(w, http.StatusInternalServerError, "failed to update webhook")
		return
	}

	h.jsonResponse(w, http.StatusOK, webhook)
}

// DeleteWebhook deletes a webhook
func (h *WebhookHandler) DeleteWebhook(w http.ResponseWriter, r *http.Request) {
	orgID := r.Header.Get("X-Organization-ID")
	webhookID := chi.URLParam(r, "id")

	if err := h.service.DeleteWebhook(r.Context(), orgID, webhookID); err != nil {
		h.logger.Error("Failed to delete webhook", zap.Error(err))
		h.errorResponse(w, http.StatusInternalServerError, "failed to delete webhook")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// TestWebhook sends a test event to a webhook
func (h *WebhookHandler) TestWebhook(w http.ResponseWriter, r *http.Request) {
	orgID := r.Header.Get("X-Organization-ID")
	webhookID := chi.URLParam(r, "id")

	delivery, err := h.service.TestWebhook(r.Context(), orgID, webhookID)
	if err != nil {
		h.logger.Error("Failed to test webhook", zap.Error(err))
		h.errorResponse(w, http.StatusInternalServerError, "failed to test webhook")
		return
	}

	h.jsonResponse(w, http.StatusOK, delivery)
}

// RegenerateSecret regenerates the webhook secret
func (h *WebhookHandler) RegenerateSecret(w http.ResponseWriter, r *http.Request) {
	orgID := r.Header.Get("X-Organization-ID")
	webhookID := chi.URLParam(r, "id")

	webhook, err := h.service.RegenerateSecret(r.Context(), orgID, webhookID)
	if err != nil {
		h.logger.Error("Failed to regenerate secret", zap.Error(err))
		h.errorResponse(w, http.StatusInternalServerError, "failed to regenerate secret")
		return
	}

	// Return the new secret (only time it's visible)
	h.jsonResponse(w, http.StatusOK, map[string]interface{}{
		"webhook": webhook,
		"secret":  webhook.Secret,
	})
}

// GetDeliveries retrieves webhook delivery history
func (h *WebhookHandler) GetDeliveries(w http.ResponseWriter, r *http.Request) {
	orgID := r.Header.Get("X-Organization-ID")
	webhookID := chi.URLParam(r, "id")
	page := h.getIntParam(r, "page", 1)
	pageSize := h.getIntParam(r, "page_size", 20)

	result, err := h.service.GetDeliveries(r.Context(), orgID, webhookID, page, pageSize)
	if err != nil {
		h.logger.Error("Failed to get deliveries", zap.Error(err))
		h.errorResponse(w, http.StatusInternalServerError, "failed to get deliveries")
		return
	}

	h.jsonResponse(w, http.StatusOK, result)
}

// GetEventTypes returns available webhook event types
func (h *WebhookHandler) GetEventTypes(w http.ResponseWriter, r *http.Request) {
	events := []map[string]string{
		{"type": string(model.EventPortCallCreated), "description": "Port call created"},
		{"type": string(model.EventPortCallUpdated), "description": "Port call updated"},
		{"type": string(model.EventPortCallStatusChanged), "description": "Port call status changed"},
		{"type": string(model.EventPortCallDeleted), "description": "Port call deleted"},
		{"type": string(model.EventServiceOrderCreated), "description": "Service order created"},
		{"type": string(model.EventServiceOrderUpdated), "description": "Service order updated"},
		{"type": string(model.EventServiceOrderAssigned), "description": "Service order assigned to vendor"},
		{"type": string(model.EventRFQCreated), "description": "RFQ created"},
		{"type": string(model.EventRFQClosed), "description": "RFQ closed"},
		{"type": string(model.EventQuoteReceived), "description": "Quote received for RFQ"},
		{"type": string(model.EventRFQAwarded), "description": "RFQ awarded to vendor"},
		{"type": string(model.EventVesselPositionUpdated), "description": "Vessel position updated"},
		{"type": string(model.EventVesselArrived), "description": "Vessel arrived at port"},
		{"type": string(model.EventVesselDeparted), "description": "Vessel departed from port"},
		{"type": string(model.EventDocumentUploaded), "description": "Document uploaded"},
		{"type": string(model.EventIncidentCreated), "description": "Incident reported"},
	}

	h.jsonResponse(w, http.StatusOK, map[string]interface{}{
		"events": events,
	})
}

func (h *WebhookHandler) jsonResponse(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func (h *WebhookHandler) errorResponse(w http.ResponseWriter, status int, message string) {
	h.jsonResponse(w, status, map[string]string{"error": message})
}

func (h *WebhookHandler) getIntParam(r *http.Request, name string, defaultValue int) int {
	val := r.URL.Query().Get(name)
	if val == "" {
		return defaultValue
	}
	i, err := strconv.Atoi(val)
	if err != nil {
		return defaultValue
	}
	return i
}
