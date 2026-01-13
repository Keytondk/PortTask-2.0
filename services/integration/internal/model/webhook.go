package model

import (
	"encoding/json"
	"time"
)

// WebhookEventType represents types of events that can trigger webhooks
type WebhookEventType string

const (
	EventPortCallCreated       WebhookEventType = "port_call.created"
	EventPortCallUpdated       WebhookEventType = "port_call.updated"
	EventPortCallStatusChanged WebhookEventType = "port_call.status_changed"
	EventPortCallDeleted       WebhookEventType = "port_call.deleted"

	EventServiceOrderCreated  WebhookEventType = "service_order.created"
	EventServiceOrderUpdated  WebhookEventType = "service_order.updated"
	EventServiceOrderAssigned WebhookEventType = "service_order.assigned"

	EventRFQCreated    WebhookEventType = "rfq.created"
	EventRFQClosed     WebhookEventType = "rfq.closed"
	EventQuoteReceived WebhookEventType = "rfq.quote_received"
	EventRFQAwarded    WebhookEventType = "rfq.awarded"

	EventVesselPositionUpdated WebhookEventType = "vessel.position_updated"
	EventVesselArrived         WebhookEventType = "vessel.arrived"
	EventVesselDeparted        WebhookEventType = "vessel.departed"

	EventDocumentUploaded WebhookEventType = "document.uploaded"
	EventIncidentCreated  WebhookEventType = "incident.created"
)

// Webhook represents a registered webhook endpoint
type Webhook struct {
	ID             string             `json:"id"`
	OrganizationID string             `json:"organization_id"`
	WorkspaceID    *string            `json:"workspace_id,omitempty"`
	Name           string             `json:"name"`
	URL            string             `json:"url"`
	Secret         string             `json:"-"` // Used for signing payloads
	Events         []WebhookEventType `json:"events"`
	IsActive       bool               `json:"is_active"`
	Headers        map[string]string  `json:"headers,omitempty"`
	CreatedAt      time.Time          `json:"created_at"`
	UpdatedAt      time.Time          `json:"updated_at"`
	LastTriggeredAt *time.Time        `json:"last_triggered_at,omitempty"`
	FailureCount   int                `json:"failure_count"`
}

// WebhookDelivery represents a single webhook delivery attempt
type WebhookDelivery struct {
	ID            string          `json:"id"`
	WebhookID     string          `json:"webhook_id"`
	EventType     WebhookEventType `json:"event_type"`
	Payload       json.RawMessage `json:"payload"`
	ResponseCode  *int            `json:"response_code,omitempty"`
	ResponseBody  *string         `json:"response_body,omitempty"`
	ErrorMessage  *string         `json:"error_message,omitempty"`
	Attempts      int             `json:"attempts"`
	Status        DeliveryStatus  `json:"status"`
	CreatedAt     time.Time       `json:"created_at"`
	DeliveredAt   *time.Time      `json:"delivered_at,omitempty"`
	NextRetryAt   *time.Time      `json:"next_retry_at,omitempty"`
}

// DeliveryStatus represents the status of a webhook delivery
type DeliveryStatus string

const (
	DeliveryPending   DeliveryStatus = "pending"
	DeliverySuccess   DeliveryStatus = "success"
	DeliveryFailed    DeliveryStatus = "failed"
	DeliveryRetrying  DeliveryStatus = "retrying"
)

// WebhookEvent represents an event to be sent via webhooks
type WebhookEvent struct {
	ID             string           `json:"id"`
	Type           WebhookEventType `json:"type"`
	OrganizationID string           `json:"organization_id"`
	WorkspaceID    *string          `json:"workspace_id,omitempty"`
	ResourceType   string           `json:"resource_type"`
	ResourceID     string           `json:"resource_id"`
	Data           interface{}      `json:"data"`
	Metadata       map[string]string `json:"metadata,omitempty"`
	Timestamp      time.Time        `json:"timestamp"`
}

// CreateWebhookRequest represents a request to create a webhook
type CreateWebhookRequest struct {
	Name        string             `json:"name" validate:"required,min=1,max=100"`
	URL         string             `json:"url" validate:"required,url"`
	Events      []WebhookEventType `json:"events" validate:"required,min=1"`
	WorkspaceID *string            `json:"workspace_id,omitempty"`
	Headers     map[string]string  `json:"headers,omitempty"`
}

// UpdateWebhookRequest represents a request to update a webhook
type UpdateWebhookRequest struct {
	Name     *string            `json:"name,omitempty"`
	URL      *string            `json:"url,omitempty"`
	Events   []WebhookEventType `json:"events,omitempty"`
	IsActive *bool              `json:"is_active,omitempty"`
	Headers  map[string]string  `json:"headers,omitempty"`
}

// WebhookListResponse represents a paginated list of webhooks
type WebhookListResponse struct {
	Webhooks   []Webhook `json:"webhooks"`
	TotalCount int       `json:"total_count"`
	Page       int       `json:"page"`
	PageSize   int       `json:"page_size"`
}

// DeliveryListResponse represents a paginated list of webhook deliveries
type DeliveryListResponse struct {
	Deliveries []WebhookDelivery `json:"deliveries"`
	TotalCount int               `json:"total_count"`
	Page       int               `json:"page"`
	PageSize   int               `json:"page_size"`
}
