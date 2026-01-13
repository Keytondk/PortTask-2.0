package subscription

import (
	"context"
	"encoding/json"
	"log"
	"sync"

	"github.com/go-redis/redis/v8"
	"github.com/navo/services/realtime/internal/hub"
	"github.com/navo/services/realtime/internal/model"
)

// Redis channels for pub/sub
const (
	ChannelEvents       = "navo:events"
	ChannelPortCalls    = "navo:port_calls"
	ChannelVessels      = "navo:vessels"
	ChannelServices     = "navo:services"
	ChannelRFQs         = "navo:rfqs"
	ChannelNotifications = "navo:notifications"
)

// Manager handles Redis pub/sub subscriptions and distributes events to the hub
type Manager struct {
	redis  *redis.Client
	hub    *hub.Hub
	pubsub *redis.PubSub
	ctx    context.Context
	cancel context.CancelFunc
	mu     sync.Mutex
}

// NewManager creates a new subscription manager
func NewManager(redisClient *redis.Client, h *hub.Hub) *Manager {
	ctx, cancel := context.WithCancel(context.Background())
	return &Manager{
		redis:  redisClient,
		hub:    h,
		ctx:    ctx,
		cancel: cancel,
	}
}

// Start begins listening for Redis pub/sub messages
func (m *Manager) Start() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Subscribe to all event channels
	m.pubsub = m.redis.Subscribe(m.ctx,
		ChannelEvents,
		ChannelPortCalls,
		ChannelVessels,
		ChannelServices,
		ChannelRFQs,
		ChannelNotifications,
	)

	// Wait for subscription confirmation
	_, err := m.pubsub.Receive(m.ctx)
	if err != nil {
		return err
	}

	// Start message listener
	go m.listen()

	log.Println("Subscription manager started")
	return nil
}

// Stop shuts down the subscription manager
func (m *Manager) Stop() error {
	m.cancel()
	if m.pubsub != nil {
		return m.pubsub.Close()
	}
	return nil
}

// listen processes incoming Redis messages
func (m *Manager) listen() {
	ch := m.pubsub.Channel()

	for {
		select {
		case <-m.ctx.Done():
			return
		case msg := <-ch:
			m.handleMessage(msg)
		}
	}
}

// handleMessage processes a single Redis message
func (m *Manager) handleMessage(msg *redis.Message) {
	if msg == nil {
		return
	}

	var event model.Event
	if err := json.Unmarshal([]byte(msg.Payload), &event); err != nil {
		log.Printf("Error unmarshaling event from channel %s: %v", msg.Channel, err)
		return
	}

	// Broadcast to connected clients via the hub
	m.hub.Broadcast(&event)
}

// Publish sends an event to Redis for distribution
func (m *Manager) Publish(ctx context.Context, event *model.Event) error {
	data, err := json.Marshal(event)
	if err != nil {
		return err
	}

	// Determine the appropriate channel based on event type
	channel := m.getChannelForEvent(event.Type)

	return m.redis.Publish(ctx, channel, data).Err()
}

// PublishToChannel publishes an event to a specific channel
func (m *Manager) PublishToChannel(ctx context.Context, channel string, event *model.Event) error {
	data, err := json.Marshal(event)
	if err != nil {
		return err
	}

	return m.redis.Publish(ctx, channel, data).Err()
}

// getChannelForEvent returns the Redis channel for an event type
func (m *Manager) getChannelForEvent(eventType model.EventType) string {
	switch eventType {
	case model.EventPortCallCreated, model.EventPortCallUpdated,
		model.EventPortCallStatusChanged, model.EventPortCallDeleted:
		return ChannelPortCalls

	case model.EventVesselPositionUpdated, model.EventVesselCreated, model.EventVesselUpdated:
		return ChannelVessels

	case model.EventServiceCreated, model.EventServiceUpdated, model.EventServiceStatusChanged:
		return ChannelServices

	case model.EventRFQCreated, model.EventRFQUpdated, model.EventRFQPublished,
		model.EventRFQClosed, model.EventRFQAwarded, model.EventQuoteReceived, model.EventQuoteWithdrawn:
		return ChannelRFQs

	case model.EventNotificationNew, model.EventNotificationRead:
		return ChannelNotifications

	default:
		return ChannelEvents
	}
}

// PublishPortCallEvent publishes a port call event
func (m *Manager) PublishPortCallEvent(ctx context.Context, eventType model.EventType, data interface{}, orgID, workspaceID string) error {
	event, err := model.NewEvent(eventType, data)
	if err != nil {
		return err
	}
	event.WithOrganization(orgID).WithWorkspace(workspaceID)
	return m.Publish(ctx, event)
}

// PublishVesselPosition publishes a vessel position update
func (m *Manager) PublishVesselPosition(ctx context.Context, data model.VesselPositionData, orgID, workspaceID string) error {
	event, err := model.NewEvent(model.EventVesselPositionUpdated, data)
	if err != nil {
		return err
	}
	event.WithOrganization(orgID).WithWorkspace(workspaceID).WithEntity("vessel", data.VesselID)
	return m.Publish(ctx, event)
}

// PublishServiceEvent publishes a service order event
func (m *Manager) PublishServiceEvent(ctx context.Context, eventType model.EventType, data interface{}, orgID, workspaceID string) error {
	event, err := model.NewEvent(eventType, data)
	if err != nil {
		return err
	}
	event.WithOrganization(orgID).WithWorkspace(workspaceID)
	return m.Publish(ctx, event)
}

// PublishRFQEvent publishes an RFQ event
func (m *Manager) PublishRFQEvent(ctx context.Context, eventType model.EventType, data interface{}, orgID, workspaceID string) error {
	event, err := model.NewEvent(eventType, data)
	if err != nil {
		return err
	}
	event.WithOrganization(orgID).WithWorkspace(workspaceID)
	return m.Publish(ctx, event)
}

// PublishNotification publishes a notification to specific users
func (m *Manager) PublishNotification(ctx context.Context, data model.NotificationData, userIDs []string, orgID string) error {
	event, err := model.NewEvent(model.EventNotificationNew, data)
	if err != nil {
		return err
	}
	event.WithOrganization(orgID).WithUsers(userIDs...)
	return m.Publish(ctx, event)
}

// ChannelStats returns subscription statistics
func (m *Manager) ChannelStats() map[string]interface{} {
	stats := m.pubsub.PoolStats()
	return map[string]interface{}{
		"hits":     stats.Hits,
		"misses":   stats.Misses,
		"timeouts": stats.Timeouts,
	}
}
