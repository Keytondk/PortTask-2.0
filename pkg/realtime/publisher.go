package realtime

import (
	"context"
	"encoding/json"
	"time"

	"github.com/go-redis/redis/v8"
)

// EventType represents different types of real-time events
type EventType string

const (
	// Port Call events
	EventPortCallCreated       EventType = "port_call:created"
	EventPortCallUpdated       EventType = "port_call:updated"
	EventPortCallStatusChanged EventType = "port_call:status_changed"
	EventPortCallDeleted       EventType = "port_call:deleted"

	// Vessel events
	EventVesselPositionUpdated EventType = "vessel:position_updated"
	EventVesselCreated         EventType = "vessel:created"
	EventVesselUpdated         EventType = "vessel:updated"

	// Service Order events
	EventServiceCreated       EventType = "service:created"
	EventServiceUpdated       EventType = "service:updated"
	EventServiceStatusChanged EventType = "service:status_changed"

	// RFQ events
	EventRFQCreated     EventType = "rfq:created"
	EventRFQUpdated     EventType = "rfq:updated"
	EventRFQPublished   EventType = "rfq:published"
	EventRFQClosed      EventType = "rfq:closed"
	EventRFQAwarded     EventType = "rfq:awarded"
	EventQuoteReceived  EventType = "rfq:quote_received"
	EventQuoteWithdrawn EventType = "rfq:quote_withdrawn"

	// Notification events
	EventNotificationNew  EventType = "notification:new"
	EventNotificationRead EventType = "notification:read"
)

// Redis channels
const (
	ChannelEvents        = "navo:events"
	ChannelPortCalls     = "navo:port_calls"
	ChannelVessels       = "navo:vessels"
	ChannelServices      = "navo:services"
	ChannelRFQs          = "navo:rfqs"
	ChannelNotifications = "navo:notifications"
)

// Event represents a real-time event
type Event struct {
	ID             string          `json:"id"`
	Type           EventType       `json:"type"`
	Timestamp      time.Time       `json:"timestamp"`
	Data           json.RawMessage `json:"data"`
	OrganizationID string          `json:"organization_id,omitempty"`
	WorkspaceID    string          `json:"workspace_id,omitempty"`
	UserIDs        []string        `json:"user_ids,omitempty"`
	EntityID       string          `json:"entity_id,omitempty"`
	EntityType     string          `json:"entity_type,omitempty"`
}

// Publisher publishes events to the realtime service via Redis
type Publisher struct {
	redis *redis.Client
}

// NewPublisher creates a new event publisher
func NewPublisher(redisClient *redis.Client) *Publisher {
	return &Publisher{
		redis: redisClient,
	}
}

// Publish publishes an event to the appropriate Redis channel
func (p *Publisher) Publish(ctx context.Context, eventType EventType, data interface{}, opts ...EventOption) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	event := &Event{
		ID:        generateEventID(),
		Type:      eventType,
		Timestamp: time.Now().UTC(),
		Data:      jsonData,
	}

	// Apply options
	for _, opt := range opts {
		opt(event)
	}

	// Marshal full event
	eventJSON, err := json.Marshal(event)
	if err != nil {
		return err
	}

	// Determine channel
	channel := getChannelForEvent(eventType)

	return p.redis.Publish(ctx, channel, eventJSON).Err()
}

// EventOption configures event properties
type EventOption func(*Event)

// WithOrganization sets the organization scope
func WithOrganization(orgID string) EventOption {
	return func(e *Event) {
		e.OrganizationID = orgID
	}
}

// WithWorkspace sets the workspace scope
func WithWorkspace(workspaceID string) EventOption {
	return func(e *Event) {
		e.WorkspaceID = workspaceID
	}
}

// WithUsers sets specific user targets
func WithUsers(userIDs ...string) EventOption {
	return func(e *Event) {
		e.UserIDs = userIDs
	}
}

// WithEntity sets entity information
func WithEntity(entityType, entityID string) EventOption {
	return func(e *Event) {
		e.EntityType = entityType
		e.EntityID = entityID
	}
}

// Helper functions for common event types

// PublishPortCallCreated publishes a port call created event
func (p *Publisher) PublishPortCallCreated(ctx context.Context, portCall interface{}, orgID, workspaceID string) error {
	return p.Publish(ctx, EventPortCallCreated, portCall,
		WithOrganization(orgID),
		WithWorkspace(workspaceID),
	)
}

// PublishPortCallStatusChanged publishes a port call status change event
func (p *Publisher) PublishPortCallStatusChanged(ctx context.Context, portCallID, oldStatus, newStatus, changedBy, orgID, workspaceID string) error {
	return p.Publish(ctx, EventPortCallStatusChanged, map[string]string{
		"port_call_id": portCallID,
		"old_status":   oldStatus,
		"new_status":   newStatus,
		"changed_by":   changedBy,
	},
		WithOrganization(orgID),
		WithWorkspace(workspaceID),
		WithEntity("port_call", portCallID),
	)
}

// PublishVesselPosition publishes a vessel position update
func (p *Publisher) PublishVesselPosition(ctx context.Context, vesselID string, lat, lon, heading, speed float64, orgID, workspaceID string) error {
	return p.Publish(ctx, EventVesselPositionUpdated, map[string]interface{}{
		"vessel_id": vesselID,
		"latitude":  lat,
		"longitude": lon,
		"heading":   heading,
		"speed":     speed,
		"timestamp": time.Now().UTC(),
	},
		WithOrganization(orgID),
		WithWorkspace(workspaceID),
		WithEntity("vessel", vesselID),
	)
}

// PublishServiceStatusChanged publishes a service order status change
func (p *Publisher) PublishServiceStatusChanged(ctx context.Context, serviceOrderID, oldStatus, newStatus, vendorID, orgID, workspaceID string) error {
	return p.Publish(ctx, EventServiceStatusChanged, map[string]string{
		"service_order_id": serviceOrderID,
		"old_status":       oldStatus,
		"new_status":       newStatus,
		"vendor_id":        vendorID,
	},
		WithOrganization(orgID),
		WithWorkspace(workspaceID),
		WithEntity("service_order", serviceOrderID),
	)
}

// PublishQuoteReceived publishes a new quote notification
func (p *Publisher) PublishQuoteReceived(ctx context.Context, rfqID, quoteID, vendorID, vendorName string, totalPrice float64, currency, orgID, workspaceID string) error {
	return p.Publish(ctx, EventQuoteReceived, map[string]interface{}{
		"rfq_id":      rfqID,
		"quote_id":    quoteID,
		"vendor_id":   vendorID,
		"vendor_name": vendorName,
		"total_price": totalPrice,
		"currency":    currency,
	},
		WithOrganization(orgID),
		WithWorkspace(workspaceID),
		WithEntity("rfq", rfqID),
	)
}

// PublishNotification publishes a notification to specific users
func (p *Publisher) PublishNotification(ctx context.Context, title, message, priority string, userIDs []string, orgID string) error {
	return p.Publish(ctx, EventNotificationNew, map[string]string{
		"title":    title,
		"message":  message,
		"priority": priority,
	},
		WithOrganization(orgID),
		WithUsers(userIDs...),
	)
}

func getChannelForEvent(eventType EventType) string {
	switch eventType {
	case EventPortCallCreated, EventPortCallUpdated,
		EventPortCallStatusChanged, EventPortCallDeleted:
		return ChannelPortCalls

	case EventVesselPositionUpdated, EventVesselCreated, EventVesselUpdated:
		return ChannelVessels

	case EventServiceCreated, EventServiceUpdated, EventServiceStatusChanged:
		return ChannelServices

	case EventRFQCreated, EventRFQUpdated, EventRFQPublished,
		EventRFQClosed, EventRFQAwarded, EventQuoteReceived, EventQuoteWithdrawn:
		return ChannelRFQs

	case EventNotificationNew, EventNotificationRead:
		return ChannelNotifications

	default:
		return ChannelEvents
	}
}

func generateEventID() string {
	return time.Now().Format("20060102150405.000000")
}
