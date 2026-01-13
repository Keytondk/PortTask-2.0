package hub

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/navo/services/realtime/internal/model"
)

// Hub maintains the set of active clients and broadcasts messages
type Hub struct {
	// Registered clients by ID
	clients map[string]*model.Client

	// Clients indexed by user ID
	userClients map[string]map[string]*model.Client

	// Clients indexed by organization ID
	orgClients map[string]map[string]*model.Client

	// Clients indexed by workspace ID
	workspaceClients map[string]map[string]*model.Client

	// Channel subscriptions: channel -> client IDs
	channels map[string]map[string]bool

	// Register requests from clients
	register chan *model.Client

	// Unregister requests from clients
	unregister chan *model.Client

	// Broadcast events to appropriate clients
	broadcast chan *model.Event

	// Mutex for safe access
	mu sync.RWMutex

	// Metrics
	totalConnections    int64
	totalMessages       int64
	totalBroadcasts     int64
	activeSubscriptions int64
}

// NewHub creates a new Hub instance
func NewHub() *Hub {
	return &Hub{
		clients:          make(map[string]*model.Client),
		userClients:      make(map[string]map[string]*model.Client),
		orgClients:       make(map[string]map[string]*model.Client),
		workspaceClients: make(map[string]map[string]*model.Client),
		channels:         make(map[string]map[string]bool),
		register:         make(chan *model.Client),
		unregister:       make(chan *model.Client),
		broadcast:        make(chan *model.Event, 256),
	}
}

// Run starts the hub's main loop
func (h *Hub) Run(ctx context.Context) {
	// Start heartbeat ticker
	heartbeatTicker := time.NewTicker(30 * time.Second)
	defer heartbeatTicker.Stop()

	// Start cleanup ticker for stale connections
	cleanupTicker := time.NewTicker(60 * time.Second)
	defer cleanupTicker.Stop()

	for {
		select {
		case <-ctx.Done():
			h.shutdown()
			return

		case client := <-h.register:
			h.registerClient(client)

		case client := <-h.unregister:
			h.unregisterClient(client)

		case event := <-h.broadcast:
			h.broadcastEvent(event)

		case <-heartbeatTicker.C:
			h.sendHeartbeats()

		case <-cleanupTicker.C:
			h.cleanupStaleConnections()
		}
	}
}

// Register adds a client to the hub
func (h *Hub) Register(client *model.Client) {
	h.register <- client
}

// Unregister removes a client from the hub
func (h *Hub) Unregister(client *model.Client) {
	h.unregister <- client
}

// Broadcast sends an event to appropriate clients
func (h *Hub) Broadcast(event *model.Event) {
	h.broadcast <- event
}

func (h *Hub) registerClient(client *model.Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	// Add to main clients map
	h.clients[client.ID] = client
	client.SetState(model.ClientStateConnected)

	// Index by user ID
	if h.userClients[client.UserID] == nil {
		h.userClients[client.UserID] = make(map[string]*model.Client)
	}
	h.userClients[client.UserID][client.ID] = client

	// Index by organization ID
	if client.OrganizationID != "" {
		if h.orgClients[client.OrganizationID] == nil {
			h.orgClients[client.OrganizationID] = make(map[string]*model.Client)
		}
		h.orgClients[client.OrganizationID][client.ID] = client
	}

	// Index by workspace ID
	if client.WorkspaceID != "" {
		if h.workspaceClients[client.WorkspaceID] == nil {
			h.workspaceClients[client.WorkspaceID] = make(map[string]*model.Client)
		}
		h.workspaceClients[client.WorkspaceID][client.ID] = client
	}

	h.totalConnections++
	log.Printf("Client registered: %s (user: %s, org: %s, workspace: %s)",
		client.ID, client.UserID, client.OrganizationID, client.WorkspaceID)
}

func (h *Hub) unregisterClient(client *model.Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.clients[client.ID]; !ok {
		return
	}

	client.SetState(model.ClientStateDisconnected)

	// Remove from all channel subscriptions
	for channel := range client.Subscriptions {
		if h.channels[channel] != nil {
			delete(h.channels[channel], client.ID)
			if len(h.channels[channel]) == 0 {
				delete(h.channels, channel)
			}
			h.activeSubscriptions--
		}
	}

	// Remove from indexes
	delete(h.clients, client.ID)
	if h.userClients[client.UserID] != nil {
		delete(h.userClients[client.UserID], client.ID)
		if len(h.userClients[client.UserID]) == 0 {
			delete(h.userClients, client.UserID)
		}
	}
	if h.orgClients[client.OrganizationID] != nil {
		delete(h.orgClients[client.OrganizationID], client.ID)
		if len(h.orgClients[client.OrganizationID]) == 0 {
			delete(h.orgClients, client.OrganizationID)
		}
	}
	if h.workspaceClients[client.WorkspaceID] != nil {
		delete(h.workspaceClients[client.WorkspaceID], client.ID)
		if len(h.workspaceClients[client.WorkspaceID]) == 0 {
			delete(h.workspaceClients, client.WorkspaceID)
		}
	}

	// Close send channel
	close(client.Send)

	log.Printf("Client unregistered: %s (user: %s)", client.ID, client.UserID)
}

func (h *Hub) broadcastEvent(event *model.Event) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	h.totalBroadcasts++
	targets := h.findTargetClients(event)

	message, err := json.Marshal(model.ServerMessage{
		Type:  model.MsgTypeEvent,
		Event: event,
	})
	if err != nil {
		log.Printf("Error marshaling event: %v", err)
		return
	}

	for _, client := range targets {
		h.sendToClient(client, message)
	}
}

// findTargetClients determines which clients should receive an event
func (h *Hub) findTargetClients(event *model.Event) []*model.Client {
	clientSet := make(map[string]*model.Client)

	// Target specific users if specified
	if len(event.UserIDs) > 0 {
		for _, userID := range event.UserIDs {
			if clients, ok := h.userClients[userID]; ok {
				for _, client := range clients {
					clientSet[client.ID] = client
				}
			}
		}
		return mapValues(clientSet)
	}

	// Target by workspace
	if event.WorkspaceID != "" {
		if clients, ok := h.workspaceClients[event.WorkspaceID]; ok {
			for _, client := range clients {
				clientSet[client.ID] = client
			}
		}
	} else if event.OrganizationID != "" {
		// Target by organization
		if clients, ok := h.orgClients[event.OrganizationID]; ok {
			for _, client := range clients {
				clientSet[client.ID] = client
			}
		}
	}

	// Also check channel subscriptions
	channel := string(event.Type)
	if subscribers, ok := h.channels[channel]; ok {
		for clientID := range subscribers {
			if client, ok := h.clients[clientID]; ok {
				// Only add if in same org/workspace scope
				if event.OrganizationID == "" || client.OrganizationID == event.OrganizationID {
					if event.WorkspaceID == "" || client.WorkspaceID == event.WorkspaceID {
						clientSet[client.ID] = client
					}
				}
			}
		}
	}

	// Entity-specific subscriptions
	if event.EntityType != "" && event.EntityID != "" {
		entityChannel := event.EntityType + ":" + event.EntityID
		if subscribers, ok := h.channels[entityChannel]; ok {
			for clientID := range subscribers {
				if client, ok := h.clients[clientID]; ok {
					if event.OrganizationID == "" || client.OrganizationID == event.OrganizationID {
						clientSet[client.ID] = client
					}
				}
			}
		}
	}

	return mapValues(clientSet)
}

func (h *Hub) sendToClient(client *model.Client, message []byte) {
	select {
	case client.Send <- message:
		h.totalMessages++
	default:
		// Client's send buffer is full, close connection
		go func() {
			h.Unregister(client)
		}()
	}
}

// Subscribe adds a client subscription to a channel
func (h *Hub) Subscribe(client *model.Client, channel string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.channels[channel] == nil {
		h.channels[channel] = make(map[string]bool)
	}
	h.channels[channel][client.ID] = true
	client.Subscribe(channel)
	h.activeSubscriptions++

	log.Printf("Client %s subscribed to channel: %s", client.ID, channel)
}

// Unsubscribe removes a client subscription from a channel
func (h *Hub) Unsubscribe(client *model.Client, channel string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.channels[channel] != nil {
		delete(h.channels[channel], client.ID)
		if len(h.channels[channel]) == 0 {
			delete(h.channels, channel)
		}
	}
	client.Unsubscribe(channel)
	h.activeSubscriptions--

	log.Printf("Client %s unsubscribed from channel: %s", client.ID, channel)
}

func (h *Hub) sendHeartbeats() {
	h.mu.RLock()
	defer h.mu.RUnlock()

	message, _ := json.Marshal(model.ServerMessage{
		Type: model.MsgTypeHeartbeat,
		Data: map[string]interface{}{
			"timestamp": time.Now().UTC(),
		},
	})

	for _, client := range h.clients {
		h.sendToClient(client, message)
	}
}

func (h *Hub) cleanupStaleConnections() {
	h.mu.RLock()
	staleClients := make([]*model.Client, 0)
	threshold := time.Now().Add(-2 * time.Minute)

	for _, client := range h.clients {
		if client.LastPing.Before(threshold) {
			staleClients = append(staleClients, client)
		}
	}
	h.mu.RUnlock()

	for _, client := range staleClients {
		log.Printf("Removing stale client: %s", client.ID)
		h.Unregister(client)
	}
}

func (h *Hub) shutdown() {
	h.mu.Lock()
	defer h.mu.Unlock()

	log.Println("Shutting down hub...")
	for _, client := range h.clients {
		close(client.Send)
	}
	h.clients = make(map[string]*model.Client)
}

// Stats returns current hub statistics
func (h *Hub) Stats() map[string]interface{} {
	h.mu.RLock()
	defer h.mu.RUnlock()

	return map[string]interface{}{
		"active_connections":   len(h.clients),
		"total_connections":    h.totalConnections,
		"total_messages":       h.totalMessages,
		"total_broadcasts":     h.totalBroadcasts,
		"active_subscriptions": h.activeSubscriptions,
		"channels":             len(h.channels),
	}
}

// GetClient returns a client by ID
func (h *Hub) GetClient(id string) (*model.Client, bool) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	client, ok := h.clients[id]
	return client, ok
}

// GetClientsByUser returns all clients for a user
func (h *Hub) GetClientsByUser(userID string) []*model.Client {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if clients, ok := h.userClients[userID]; ok {
		return mapValues(clients)
	}
	return nil
}

func mapValues[K comparable, V any](m map[K]V) []V {
	values := make([]V, 0, len(m))
	for _, v := range m {
		values = append(values, v)
	}
	return values
}
