package model

import (
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// ClientState represents the connection state of a client
type ClientState int

const (
	ClientStateConnecting ClientState = iota
	ClientStateConnected
	ClientStateDisconnecting
	ClientStateDisconnected
)

// Client represents a WebSocket client connection
type Client struct {
	ID             string
	UserID         string
	OrganizationID string
	WorkspaceID    string
	Conn           *websocket.Conn
	Send           chan []byte
	State          ClientState
	ConnectedAt    time.Time
	LastPing       time.Time
	Subscriptions  map[string]bool // Set of subscribed channels/topics
	mu             sync.RWMutex
}

// NewClient creates a new WebSocket client
func NewClient(conn *websocket.Conn, userID, orgID, workspaceID string) *Client {
	return &Client{
		ID:             generateClientID(),
		UserID:         userID,
		OrganizationID: orgID,
		WorkspaceID:    workspaceID,
		Conn:           conn,
		Send:           make(chan []byte, 256),
		State:          ClientStateConnecting,
		ConnectedAt:    time.Now().UTC(),
		LastPing:       time.Now().UTC(),
		Subscriptions:  make(map[string]bool),
	}
}

// Subscribe adds a subscription for the client
func (c *Client) Subscribe(channel string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.Subscriptions[channel] = true
}

// Unsubscribe removes a subscription from the client
func (c *Client) Unsubscribe(channel string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.Subscriptions, channel)
}

// IsSubscribed checks if client is subscribed to a channel
func (c *Client) IsSubscribed(channel string) bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.Subscriptions[channel]
}

// GetSubscriptions returns a copy of client subscriptions
func (c *Client) GetSubscriptions() []string {
	c.mu.RLock()
	defer c.mu.RUnlock()

	subs := make([]string, 0, len(c.Subscriptions))
	for channel := range c.Subscriptions {
		subs = append(subs, channel)
	}
	return subs
}

// UpdatePing updates the last ping time
func (c *Client) UpdatePing() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.LastPing = time.Now().UTC()
}

// SetState updates the client state
func (c *Client) SetState(state ClientState) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.State = state
}

// GetState returns the current client state
func (c *Client) GetState() ClientState {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.State
}

// Helper to generate unique client IDs
func generateClientID() string {
	return time.Now().Format("20060102150405") + "-" + randomString(8)
}

func randomString(n int) string {
	const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[time.Now().UnixNano()%int64(len(letters))]
	}
	return string(b)
}

// ClientMessage represents a message from a client
type ClientMessage struct {
	Type    string `json:"type"`
	Channel string `json:"channel,omitempty"`
	Data    any    `json:"data,omitempty"`
}

// Message types from clients
const (
	MsgTypeSubscribe   = "subscribe"
	MsgTypeUnsubscribe = "unsubscribe"
	MsgTypePing        = "ping"
	MsgTypePong        = "pong"
)

// ServerMessage represents a message to a client
type ServerMessage struct {
	Type    string `json:"type"`
	Event   *Event `json:"event,omitempty"`
	Channel string `json:"channel,omitempty"`
	Error   string `json:"error,omitempty"`
	Data    any    `json:"data,omitempty"`
}

// Message types to clients
const (
	MsgTypeEvent        = "event"
	MsgTypeSubscribed   = "subscribed"
	MsgTypeUnsubscribed = "unsubscribed"
	MsgTypeError        = "error"
	MsgTypeHeartbeat    = "heartbeat"
)
