package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	"github.com/navo/services/realtime/internal/hub"
	"github.com/navo/services/realtime/internal/model"
)

const (
	// Time allowed to write a message to the peer
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer
	pongWait = 60 * time.Second

	// Send pings to peer with this period (must be less than pongWait)
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer
	maxMessageSize = 4096
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// TODO: Implement proper origin checking in production
		return true
	},
}

// WebSocketHandler handles WebSocket connections
type WebSocketHandler struct {
	hub *hub.Hub
}

// NewWebSocketHandler creates a new WebSocket handler
func NewWebSocketHandler(h *hub.Hub) *WebSocketHandler {
	return &WebSocketHandler{hub: h}
}

// ServeWS handles WebSocket upgrade requests
func (h *WebSocketHandler) ServeWS(w http.ResponseWriter, r *http.Request) {
	// Extract user information from context (set by auth middleware)
	userID := r.Context().Value("user_id")
	orgID := r.Context().Value("organization_id")
	workspaceID := r.Context().Value("workspace_id")

	// For development, allow query params
	if userID == nil || userID == "" {
		userID = r.URL.Query().Get("user_id")
	}
	if orgID == nil || orgID == "" {
		orgID = r.URL.Query().Get("organization_id")
	}
	if workspaceID == nil || workspaceID == "" {
		workspaceID = r.URL.Query().Get("workspace_id")
	}

	if userID == nil || userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	// Create client
	client := model.NewClient(
		conn,
		toString(userID),
		toString(orgID),
		toString(workspaceID),
	)

	// Register client with hub
	h.hub.Register(client)

	// Start read/write pumps
	go h.writePump(client)
	go h.readPump(client)

	// Send welcome message
	h.sendWelcome(client)
}

// readPump pumps messages from the WebSocket connection to the hub
func (h *WebSocketHandler) readPump(client *model.Client) {
	defer func() {
		h.hub.Unregister(client)
		client.Conn.Close()
	}()

	client.Conn.SetReadLimit(maxMessageSize)
	client.Conn.SetReadDeadline(time.Now().Add(pongWait))
	client.Conn.SetPongHandler(func(string) error {
		client.UpdatePing()
		client.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := client.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		h.handleMessage(client, message)
	}
}

// writePump pumps messages from the hub to the WebSocket connection
func (h *WebSocketHandler) writePump(client *model.Client) {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		client.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-client.Send:
			client.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Hub closed the channel
				client.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := client.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued messages to the current WebSocket message
			n := len(client.Send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-client.Send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			client.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := client.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handleMessage processes incoming client messages
func (h *WebSocketHandler) handleMessage(client *model.Client, message []byte) {
	var msg model.ClientMessage
	if err := json.Unmarshal(message, &msg); err != nil {
		h.sendError(client, "Invalid message format")
		return
	}

	switch msg.Type {
	case model.MsgTypeSubscribe:
		h.handleSubscribe(client, msg.Channel)

	case model.MsgTypeUnsubscribe:
		h.handleUnsubscribe(client, msg.Channel)

	case model.MsgTypePing:
		h.handlePing(client)

	default:
		h.sendError(client, "Unknown message type")
	}
}

// handleSubscribe processes subscription requests
func (h *WebSocketHandler) handleSubscribe(client *model.Client, channel string) {
	if channel == "" {
		h.sendError(client, "Channel required for subscription")
		return
	}

	// Validate channel access (could check permissions here)
	if !h.canSubscribe(client, channel) {
		h.sendError(client, "Not authorized to subscribe to channel")
		return
	}

	h.hub.Subscribe(client, channel)
	h.sendResponse(client, model.MsgTypeSubscribed, map[string]string{
		"channel": channel,
	})
}

// handleUnsubscribe processes unsubscription requests
func (h *WebSocketHandler) handleUnsubscribe(client *model.Client, channel string) {
	if channel == "" {
		h.sendError(client, "Channel required for unsubscription")
		return
	}

	h.hub.Unsubscribe(client, channel)
	h.sendResponse(client, model.MsgTypeUnsubscribed, map[string]string{
		"channel": channel,
	})
}

// handlePing processes ping messages
func (h *WebSocketHandler) handlePing(client *model.Client) {
	client.UpdatePing()
	h.sendResponse(client, model.MsgTypePong, map[string]interface{}{
		"timestamp": time.Now().UTC(),
	})
}

// canSubscribe checks if a client can subscribe to a channel
func (h *WebSocketHandler) canSubscribe(client *model.Client, channel string) bool {
	// TODO: Implement proper channel authorization
	// For now, allow all subscriptions within the client's org/workspace scope
	return true
}

// sendWelcome sends a welcome message to a newly connected client
func (h *WebSocketHandler) sendWelcome(client *model.Client) {
	h.sendResponse(client, "connected", map[string]interface{}{
		"client_id":       client.ID,
		"user_id":         client.UserID,
		"organization_id": client.OrganizationID,
		"workspace_id":    client.WorkspaceID,
		"connected_at":    client.ConnectedAt,
	})
}

// sendResponse sends a response message to a client
func (h *WebSocketHandler) sendResponse(client *model.Client, msgType string, data interface{}) {
	msg := model.ServerMessage{
		Type: msgType,
		Data: data,
	}

	jsonMsg, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Error marshaling response: %v", err)
		return
	}

	select {
	case client.Send <- jsonMsg:
	default:
		log.Printf("Client %s send buffer full, dropping message", client.ID)
	}
}

// sendError sends an error message to a client
func (h *WebSocketHandler) sendError(client *model.Client, errMsg string) {
	h.sendResponse(client, model.MsgTypeError, map[string]string{
		"error": errMsg,
	})
}

func toString(v interface{}) string {
	if v == nil {
		return ""
	}
	if s, ok := v.(string); ok {
		return s
	}
	return ""
}
