package model

import (
	"encoding/json"
	"time"
)

// NotificationType represents the type of notification
type NotificationType string

const (
	NotificationTypeEmail  NotificationType = "email"
	NotificationTypePush   NotificationType = "push"
	NotificationTypeInApp  NotificationType = "in_app"
	NotificationTypeSMS    NotificationType = "sms"
	NotificationTypeSlack  NotificationType = "slack"
)

// NotificationStatus represents the status of a notification
type NotificationStatus string

const (
	NotificationStatusPending   NotificationStatus = "pending"
	NotificationStatusQueued    NotificationStatus = "queued"
	NotificationStatusSending   NotificationStatus = "sending"
	NotificationStatusSent      NotificationStatus = "sent"
	NotificationStatusDelivered NotificationStatus = "delivered"
	NotificationStatusFailed    NotificationStatus = "failed"
	NotificationStatusRead      NotificationStatus = "read"
)

// NotificationPriority represents the priority level
type NotificationPriority string

const (
	NotificationPriorityLow      NotificationPriority = "low"
	NotificationPriorityNormal   NotificationPriority = "normal"
	NotificationPriorityHigh     NotificationPriority = "high"
	NotificationPriorityCritical NotificationPriority = "critical"
)

// NotificationCategory for grouping notifications
type NotificationCategory string

const (
	CategoryPortCall    NotificationCategory = "port_call"
	CategoryServiceOrder NotificationCategory = "service_order"
	CategoryRFQ         NotificationCategory = "rfq"
	CategoryVessel      NotificationCategory = "vessel"
	CategoryDocument    NotificationCategory = "document"
	CategorySystem      NotificationCategory = "system"
	CategoryApproval    NotificationCategory = "approval"
)

// Notification represents a notification entity
type Notification struct {
	ID             string               `json:"id"`
	Type           NotificationType     `json:"type"`
	Category       NotificationCategory `json:"category"`
	Priority       NotificationPriority `json:"priority"`
	Status         NotificationStatus   `json:"status"`

	// Recipient Information
	UserID         string   `json:"user_id"`
	OrganizationID string   `json:"organization_id"`
	WorkspaceID    string   `json:"workspace_id,omitempty"`
	Email          string   `json:"email,omitempty"`
	Phone          string   `json:"phone,omitempty"`

	// Content
	Subject        string            `json:"subject"`
	Title          string            `json:"title"`
	Body           string            `json:"body"`
	HTMLBody       string            `json:"html_body,omitempty"`
	TemplateName   string            `json:"template_name,omitempty"`
	TemplateData   map[string]any    `json:"template_data,omitempty"`

	// Context
	EntityType     string            `json:"entity_type,omitempty"`
	EntityID       string            `json:"entity_id,omitempty"`
	ActionURL      string            `json:"action_url,omitempty"`
	Metadata       map[string]string `json:"metadata,omitempty"`

	// Tracking
	ReadAt         *time.Time `json:"read_at,omitempty"`
	SentAt         *time.Time `json:"sent_at,omitempty"`
	DeliveredAt    *time.Time `json:"delivered_at,omitempty"`
	FailedAt       *time.Time `json:"failed_at,omitempty"`
	FailureReason  string     `json:"failure_reason,omitempty"`
	RetryCount     int        `json:"retry_count"`

	// Timestamps
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	ScheduledFor   *time.Time `json:"scheduled_for,omitempty"`
	ExpiresAt      *time.Time `json:"expires_at,omitempty"`
}

// SendNotificationRequest represents a request to send a notification
type SendNotificationRequest struct {
	Type         NotificationType     `json:"type" validate:"required"`
	Category     NotificationCategory `json:"category" validate:"required"`
	Priority     NotificationPriority `json:"priority"`
	UserID       string               `json:"user_id" validate:"required"`
	Email        string               `json:"email,omitempty"`
	Subject      string               `json:"subject,omitempty"`
	Title        string               `json:"title" validate:"required"`
	Body         string               `json:"body" validate:"required"`
	TemplateName string               `json:"template_name,omitempty"`
	TemplateData map[string]any       `json:"template_data,omitempty"`
	EntityType   string               `json:"entity_type,omitempty"`
	EntityID     string               `json:"entity_id,omitempty"`
	ActionURL    string               `json:"action_url,omitempty"`
	Metadata     map[string]string    `json:"metadata,omitempty"`
	ScheduledFor *time.Time           `json:"scheduled_for,omitempty"`
}

// BatchNotificationRequest represents a batch notification request
type BatchNotificationRequest struct {
	Notifications []SendNotificationRequest `json:"notifications" validate:"required,min=1,max=100"`
}

// NotificationEvent represents an event published to Redis
type NotificationEvent struct {
	Type           string         `json:"type"`
	NotificationID string         `json:"notification_id"`
	UserID         string         `json:"user_id"`
	Category       string         `json:"category"`
	Title          string         `json:"title"`
	Body           string         `json:"body"`
	ActionURL      string         `json:"action_url,omitempty"`
	Timestamp      time.Time      `json:"timestamp"`
}

// EmailMessage represents an email to be sent
type EmailMessage struct {
	To          []string          `json:"to"`
	CC          []string          `json:"cc,omitempty"`
	BCC         []string          `json:"bcc,omitempty"`
	Subject     string            `json:"subject"`
	TextBody    string            `json:"text_body"`
	HTMLBody    string            `json:"html_body"`
	ReplyTo     string            `json:"reply_to,omitempty"`
	Headers     map[string]string `json:"headers,omitempty"`
	Attachments []EmailAttachment `json:"attachments,omitempty"`
}

// EmailAttachment represents an email attachment
type EmailAttachment struct {
	Filename    string `json:"filename"`
	ContentType string `json:"content_type"`
	Content     []byte `json:"content"`
}

// Template represents an email template
type Template struct {
	Name        string            `json:"name"`
	Subject     string            `json:"subject"`
	HTMLBody    string            `json:"html_body"`
	TextBody    string            `json:"text_body"`
	Category    NotificationCategory `json:"category"`
	Variables   []TemplateVariable `json:"variables"`
	Description string            `json:"description"`
}

// TemplateVariable represents a variable in a template
type TemplateVariable struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Required    bool   `json:"required"`
	Default     string `json:"default,omitempty"`
}

// MarshalJSON implements json.Marshaler
func (n *Notification) MarshalJSON() ([]byte, error) {
	type Alias Notification
	return json.Marshal(&struct {
		*Alias
	}{
		Alias: (*Alias)(n),
	})
}

// UserNotificationPreferences represents user notification preferences
type UserNotificationPreferences struct {
	UserID         string                        `json:"user_id"`
	EmailEnabled   bool                          `json:"email_enabled"`
	PushEnabled    bool                          `json:"push_enabled"`
	InAppEnabled   bool                          `json:"in_app_enabled"`
	SMSEnabled     bool                          `json:"sms_enabled"`
	CategoryPrefs  map[NotificationCategory]bool `json:"category_prefs"`
	QuietHoursStart *int                          `json:"quiet_hours_start,omitempty"` // 0-23
	QuietHoursEnd   *int                          `json:"quiet_hours_end,omitempty"`   // 0-23
	Timezone       string                        `json:"timezone"`
}
