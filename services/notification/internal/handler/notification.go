package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/navo/services/notification/internal/model"
	"github.com/navo/services/notification/internal/service"
)

// NotificationHandler handles HTTP requests for notifications
type NotificationHandler struct {
	notificationService *service.NotificationService
}

// NewNotificationHandler creates a new notification handler
func NewNotificationHandler(notificationService *service.NotificationService) *NotificationHandler {
	return &NotificationHandler{
		notificationService: notificationService,
	}
}

// Send handles sending a single notification
func (h *NotificationHandler) Send(w http.ResponseWriter, r *http.Request) {
	var req model.SendNotificationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	notification, err := h.notificationService.Send(r.Context(), &req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, notification)
}

// SendBatch handles sending multiple notifications
func (h *NotificationHandler) SendBatch(w http.ResponseWriter, r *http.Request) {
	var req model.BatchNotificationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if len(req.Notifications) == 0 {
		writeError(w, http.StatusBadRequest, "No notifications provided")
		return
	}

	if len(req.Notifications) > 100 {
		writeError(w, http.StatusBadRequest, "Maximum 100 notifications per batch")
		return
	}

	notifications, err := h.notificationService.SendBatch(r.Context(), &req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"sent":  len(notifications),
		"items": notifications,
	})
}

// Get retrieves a notification by ID
func (h *NotificationHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "Notification ID is required")
		return
	}

	notification, err := h.notificationService.Get(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusNotFound, "Notification not found")
		return
	}

	writeJSON(w, http.StatusOK, notification)
}

// GetByUser retrieves notifications for a user
func (h *NotificationHandler) GetByUser(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userID")
	if userID == "" {
		writeError(w, http.StatusBadRequest, "User ID is required")
		return
	}

	limit := 20
	offset := 0

	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	if o := r.URL.Query().Get("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	notifications, err := h.notificationService.GetByUser(r.Context(), userID, limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"items":  notifications,
		"limit":  limit,
		"offset": offset,
	})
}

// MarkAsRead marks a notification as read
func (h *NotificationHandler) MarkAsRead(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "Notification ID is required")
		return
	}

	if err := h.notificationService.MarkAsRead(r.Context(), id); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "marked as read"})
}

// MarkAllAsRead marks all notifications for a user as read
func (h *NotificationHandler) MarkAllAsRead(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userID")
	if userID == "" {
		writeError(w, http.StatusBadRequest, "User ID is required")
		return
	}

	if err := h.notificationService.MarkAllAsRead(r.Context(), userID); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "all marked as read"})
}

// Delete deletes a notification
func (h *NotificationHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "Notification ID is required")
		return
	}

	if err := h.notificationService.Delete(r.Context(), id); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ListTemplates lists all available templates
func (h *NotificationHandler) ListTemplates(w http.ResponseWriter, r *http.Request) {
	templates := h.notificationService.ListTemplates()
	writeJSON(w, http.StatusOK, templates)
}

// GetTemplate retrieves a template by name
func (h *NotificationHandler) GetTemplate(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")
	if name == "" {
		writeError(w, http.StatusBadRequest, "Template name is required")
		return
	}

	template, err := h.notificationService.GetTemplate(name)
	if err != nil {
		writeError(w, http.StatusNotFound, "Template not found")
		return
	}

	writeJSON(w, http.StatusOK, template)
}

// PreviewTemplate previews a rendered template
func (h *NotificationHandler) PreviewTemplate(w http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "name")
	if name == "" {
		writeError(w, http.StatusBadRequest, "Template name is required")
		return
	}

	var data map[string]any
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		data = make(map[string]any)
	}

	emailMsg, err := h.notificationService.PreviewTemplate(name, data)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"subject":   emailMsg.Subject,
		"html_body": emailMsg.HTMLBody,
		"text_body": emailMsg.TextBody,
	})
}

// Helper functions

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
