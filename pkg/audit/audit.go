// Package audit provides audit logging capabilities for tracking
// user actions and system events for compliance and security.
package audit

import (
	"context"
	"encoding/json"
	"time"
)

// Action represents the type of action being audited
type Action string

const (
	// ActionCreate represents a create operation
	ActionCreate Action = "CREATE"
	// ActionRead represents a read operation
	ActionRead Action = "READ"
	// ActionUpdate represents an update operation
	ActionUpdate Action = "UPDATE"
	// ActionDelete represents a delete operation
	ActionDelete Action = "DELETE"
	// ActionLogin represents a login event
	ActionLogin Action = "LOGIN"
	// ActionLogout represents a logout event
	ActionLogout Action = "LOGOUT"
	// ActionAccessDenied represents an access denied event
	ActionAccessDenied Action = "ACCESS_DENIED"
	// ActionExport represents a data export event
	ActionExport Action = "EXPORT"
	// ActionApprove represents an approval action
	ActionApprove Action = "APPROVE"
	// ActionReject represents a rejection action
	ActionReject Action = "REJECT"
)

// EntityType represents the type of entity being audited
type EntityType string

const (
	EntityUser         EntityType = "user"
	EntityOrganization EntityType = "organization"
	EntityWorkspace    EntityType = "workspace"
	EntityVessel       EntityType = "vessel"
	EntityPort         EntityType = "port"
	EntityPortCall     EntityType = "port_call"
	EntityServiceOrder EntityType = "service_order"
	EntityRFQ          EntityType = "rfq"
	EntityQuote        EntityType = "quote"
	EntityVendor       EntityType = "vendor"
	EntityAgent        EntityType = "agent"
	EntityDocument     EntityType = "document"
	EntityNotification EntityType = "notification"
)

// Event represents a single audit log entry
type Event struct {
	ID             string          `json:"id"`
	Timestamp      time.Time       `json:"timestamp"`
	UserID         string          `json:"user_id"`
	OrganizationID string          `json:"organization_id"`
	WorkspaceID    string          `json:"workspace_id,omitempty"`
	Action         Action          `json:"action"`
	EntityType     EntityType      `json:"entity_type"`
	EntityID       string          `json:"entity_id"`
	OldValue       json.RawMessage `json:"old_value,omitempty"`
	NewValue       json.RawMessage `json:"new_value,omitempty"`
	Metadata       map[string]any  `json:"metadata,omitempty"`
	IPAddress      string          `json:"ip_address,omitempty"`
	UserAgent      string          `json:"user_agent,omitempty"`
	RequestID      string          `json:"request_id,omitempty"`
	Status         string          `json:"status"` // success, failure
	ErrorMessage   string          `json:"error_message,omitempty"`
}

// Filter for querying audit logs
type Filter struct {
	UserID         string
	OrganizationID string
	WorkspaceID    string
	Action         Action
	EntityType     EntityType
	EntityID       string
	StartTime      time.Time
	EndTime        time.Time
	Page           int
	PerPage        int
}

// Result is the result of an audit log query
type Result struct {
	Events  []Event `json:"events"`
	Total   int64   `json:"total"`
	Page    int     `json:"page"`
	PerPage int     `json:"per_page"`
}

// Logger is the interface for audit logging
type Logger interface {
	// Log records an audit event
	Log(ctx context.Context, event Event) error

	// LogAsync records an audit event asynchronously (non-blocking)
	LogAsync(ctx context.Context, event Event)

	// Query retrieves audit events matching the filter
	Query(ctx context.Context, filter Filter) (*Result, error)

	// GetByID retrieves a specific audit event
	GetByID(ctx context.Context, id string) (*Event, error)

	// Close closes the logger and flushes any pending events
	Close() error
}

// Builder helps construct audit events
type Builder struct {
	event Event
}

// NewBuilder creates a new audit event builder
func NewBuilder() *Builder {
	return &Builder{
		event: Event{
			Timestamp: time.Now().UTC(),
			Status:    "success",
			Metadata:  make(map[string]any),
		},
	}
}

// WithUser sets the user context
func (b *Builder) WithUser(userID, orgID string) *Builder {
	b.event.UserID = userID
	b.event.OrganizationID = orgID
	return b
}

// WithWorkspace sets the workspace context
func (b *Builder) WithWorkspace(workspaceID string) *Builder {
	b.event.WorkspaceID = workspaceID
	return b
}

// WithAction sets the action type
func (b *Builder) WithAction(action Action) *Builder {
	b.event.Action = action
	return b
}

// WithEntity sets the entity being audited
func (b *Builder) WithEntity(entityType EntityType, entityID string) *Builder {
	b.event.EntityType = entityType
	b.event.EntityID = entityID
	return b
}

// WithOldValue sets the previous value (for updates)
func (b *Builder) WithOldValue(value any) *Builder {
	if data, err := json.Marshal(value); err == nil {
		b.event.OldValue = data
	}
	return b
}

// WithNewValue sets the new value (for creates/updates)
func (b *Builder) WithNewValue(value any) *Builder {
	if data, err := json.Marshal(value); err == nil {
		b.event.NewValue = data
	}
	return b
}

// WithRequest sets the request context
func (b *Builder) WithRequest(requestID, ipAddress, userAgent string) *Builder {
	b.event.RequestID = requestID
	b.event.IPAddress = ipAddress
	b.event.UserAgent = userAgent
	return b
}

// WithMetadata adds custom metadata
func (b *Builder) WithMetadata(key string, value any) *Builder {
	if b.event.Metadata == nil {
		b.event.Metadata = make(map[string]any)
	}
	b.event.Metadata[key] = value
	return b
}

// WithFailure marks the event as a failure
func (b *Builder) WithFailure(errMessage string) *Builder {
	b.event.Status = "failure"
	b.event.ErrorMessage = errMessage
	return b
}

// Build returns the constructed event
func (b *Builder) Build() Event {
	return b.event
}

// ContextKey type for audit context values
type ContextKey string

const (
	// RequestIDKey is the context key for request ID
	RequestIDKey ContextKey = "audit_request_id"
	// IPAddressKey is the context key for IP address
	IPAddressKey ContextKey = "audit_ip_address"
	// UserAgentKey is the context key for user agent
	UserAgentKey ContextKey = "audit_user_agent"
)

// WithRequestContext adds request context to the event from context
func (b *Builder) WithRequestContext(ctx context.Context) *Builder {
	if requestID, ok := ctx.Value(RequestIDKey).(string); ok {
		b.event.RequestID = requestID
	}
	if ipAddress, ok := ctx.Value(IPAddressKey).(string); ok {
		b.event.IPAddress = ipAddress
	}
	if userAgent, ok := ctx.Value(UserAgentKey).(string); ok {
		b.event.UserAgent = userAgent
	}
	return b
}

// SetRequestContext adds audit context values to a context
func SetRequestContext(ctx context.Context, requestID, ipAddress, userAgent string) context.Context {
	ctx = context.WithValue(ctx, RequestIDKey, requestID)
	ctx = context.WithValue(ctx, IPAddressKey, ipAddress)
	ctx = context.WithValue(ctx, UserAgentKey, userAgent)
	return ctx
}
