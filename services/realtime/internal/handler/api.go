package handler

import (
	"encoding/json"
	"net/http"

	"github.com/navo/services/realtime/internal/hub"
	"github.com/navo/services/realtime/internal/model"
	"github.com/navo/services/realtime/internal/subscription"
)

// APIHandler handles REST API endpoints for the realtime service
type APIHandler struct {
	hub     *hub.Hub
	subMgr  *subscription.Manager
}

// NewAPIHandler creates a new API handler
func NewAPIHandler(h *hub.Hub, subMgr *subscription.Manager) *APIHandler {
	return &APIHandler{
		hub:    h,
		subMgr: subMgr,
	}
}

// Health returns service health status
func (h *APIHandler) Health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "healthy",
		"service": "realtime",
	})
}

// Stats returns hub and subscription statistics
func (h *APIHandler) Stats(w http.ResponseWriter, r *http.Request) {
	hubStats := h.hub.Stats()

	stats := map[string]interface{}{
		"hub": hubStats,
	}

	if h.subMgr != nil {
		stats["subscriptions"] = h.subMgr.ChannelStats()
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// PublishEvent handles manual event publishing (for testing/admin)
func (h *APIHandler) PublishEvent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Type           string      `json:"type"`
		Data           interface{} `json:"data"`
		OrganizationID string      `json:"organization_id"`
		WorkspaceID    string      `json:"workspace_id"`
		UserIDs        []string    `json:"user_ids,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	event, err := model.NewEvent(model.EventType(req.Type), req.Data)
	if err != nil {
		http.Error(w, "Failed to create event", http.StatusInternalServerError)
		return
	}

	event.WithOrganization(req.OrganizationID)
	event.WithWorkspace(req.WorkspaceID)
	if len(req.UserIDs) > 0 {
		event.WithUsers(req.UserIDs...)
	}

	// Publish via subscription manager if available (distributed)
	if h.subMgr != nil {
		if err := h.subMgr.Publish(r.Context(), event); err != nil {
			http.Error(w, "Failed to publish event", http.StatusInternalServerError)
			return
		}
	} else {
		// Direct broadcast to local hub
		h.hub.Broadcast(event)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":   "published",
		"event_id": event.ID,
	})
}

// GetConnections returns active connection information
func (h *APIHandler) GetConnections(w http.ResponseWriter, r *http.Request) {
	stats := h.hub.Stats()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"active_connections": stats["active_connections"],
		"total_connections":  stats["total_connections"],
	})
}

// DisconnectUser disconnects all connections for a specific user
func (h *APIHandler) DisconnectUser(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		http.Error(w, "user_id required", http.StatusBadRequest)
		return
	}

	clients := h.hub.GetClientsByUser(userID)
	for _, client := range clients {
		h.hub.Unregister(client)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":       "disconnected",
		"user_id":      userID,
		"disconnected": len(clients),
	})
}
