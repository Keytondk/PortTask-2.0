package model

import (
	"encoding/json"
	"time"
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
	EventRFQCreated      EventType = "rfq:created"
	EventRFQUpdated      EventType = "rfq:updated"
	EventRFQPublished    EventType = "rfq:published"
	EventRFQClosed       EventType = "rfq:closed"
	EventRFQAwarded      EventType = "rfq:awarded"
	EventQuoteReceived   EventType = "rfq:quote_received"
	EventQuoteWithdrawn  EventType = "rfq:quote_withdrawn"

	// Notification events
	EventNotificationNew  EventType = "notification:new"
	EventNotificationRead EventType = "notification:read"

	// System events
	EventSystemHeartbeat EventType = "system:heartbeat"
	EventSystemError     EventType = "system:error"
)

// Event represents a real-time event
type Event struct {
	ID        string          `json:"id"`
	Type      EventType       `json:"type"`
	Timestamp time.Time       `json:"timestamp"`
	Data      json.RawMessage `json:"data"`

	// Routing information
	OrganizationID string   `json:"organization_id,omitempty"`
	WorkspaceID    string   `json:"workspace_id,omitempty"`
	UserIDs        []string `json:"user_ids,omitempty"` // Specific users to target
	EntityID       string   `json:"entity_id,omitempty"`
	EntityType     string   `json:"entity_type,omitempty"`
}

// NewEvent creates a new event with the given type and data
func NewEvent(eventType EventType, data interface{}) (*Event, error) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	return &Event{
		ID:        generateEventID(),
		Type:      eventType,
		Timestamp: time.Now().UTC(),
		Data:      jsonData,
	}, nil
}

// WithOrganization sets the organization scope for the event
func (e *Event) WithOrganization(orgID string) *Event {
	e.OrganizationID = orgID
	return e
}

// WithWorkspace sets the workspace scope for the event
func (e *Event) WithWorkspace(workspaceID string) *Event {
	e.WorkspaceID = workspaceID
	return e
}

// WithUsers sets specific user targets for the event
func (e *Event) WithUsers(userIDs ...string) *Event {
	e.UserIDs = userIDs
	return e
}

// WithEntity sets entity information for the event
func (e *Event) WithEntity(entityType, entityID string) *Event {
	e.EntityType = entityType
	e.EntityID = entityID
	return e
}

// PortCallStatusData represents port call status change data
type PortCallStatusData struct {
	PortCallID string `json:"port_call_id"`
	OldStatus  string `json:"old_status"`
	NewStatus  string `json:"new_status"`
	ChangedBy  string `json:"changed_by"`
}

// VesselPositionData represents vessel position update data
type VesselPositionData struct {
	VesselID  string  `json:"vessel_id"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Heading   float64 `json:"heading,omitempty"`
	Speed     float64 `json:"speed,omitempty"`
	Course    float64 `json:"course,omitempty"`
	Timestamp string  `json:"timestamp"`
}

// ServiceStatusData represents service order status change data
type ServiceStatusData struct {
	ServiceOrderID string `json:"service_order_id"`
	OldStatus      string `json:"old_status"`
	NewStatus      string `json:"new_status"`
	VendorID       string `json:"vendor_id,omitempty"`
}

// QuoteReceivedData represents a new quote submission
type QuoteReceivedData struct {
	RFQID      string  `json:"rfq_id"`
	QuoteID    string  `json:"quote_id"`
	VendorID   string  `json:"vendor_id"`
	VendorName string  `json:"vendor_name"`
	TotalPrice float64 `json:"total_price"`
	Currency   string  `json:"currency"`
}

// NotificationData represents a notification event
type NotificationData struct {
	NotificationID string `json:"notification_id"`
	Title          string `json:"title"`
	Message        string `json:"message"`
	Priority       string `json:"priority"`
	ActionURL      string `json:"action_url,omitempty"`
}

// Helper to generate unique event IDs
func generateEventID() string {
	return time.Now().UnixNano()/int64(time.Microsecond)>>8&0xFFFFFF | int64(time.Now().UnixNano())&0xFFFFFFFFFF<<24
	// Note: In production, use xid or uuid
}
