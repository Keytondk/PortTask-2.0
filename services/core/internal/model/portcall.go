package model

import (
	"time"
)

// PortCallStatus represents the status of a port call
type PortCallStatus string

const (
	PortCallStatusDraft     PortCallStatus = "draft"
	PortCallStatusPlanned   PortCallStatus = "planned"
	PortCallStatusConfirmed PortCallStatus = "confirmed"
	PortCallStatusArrived   PortCallStatus = "arrived"
	PortCallStatusAlongside PortCallStatus = "alongside"
	PortCallStatusDeparted  PortCallStatus = "departed"
	PortCallStatusCompleted PortCallStatus = "completed"
	PortCallStatusCancelled PortCallStatus = "cancelled"
)

// PortCall represents a port call entity
type PortCall struct {
	ID             string         `json:"id" db:"id"`
	Reference      string         `json:"reference" db:"reference"`
	VesselID       string         `json:"vessel_id" db:"vessel_id"`
	PortID         string         `json:"port_id" db:"port_id"`
	WorkspaceID    string         `json:"workspace_id" db:"workspace_id"`
	Status         PortCallStatus `json:"status" db:"status"`
	ETA            *time.Time     `json:"eta,omitempty" db:"eta"`
	ETD            *time.Time     `json:"etd,omitempty" db:"etd"`
	ATA            *time.Time     `json:"ata,omitempty" db:"ata"`
	ATD            *time.Time     `json:"atd,omitempty" db:"atd"`
	BerthName      *string        `json:"berth_name,omitempty" db:"berth_name"`
	BerthTerminal  *string        `json:"berth_terminal,omitempty" db:"berth_terminal"`
	BerthConfirmed *time.Time     `json:"berth_confirmed_at,omitempty" db:"berth_confirmed_at"`
	AgentID        *string        `json:"agent_id,omitempty" db:"agent_id"`
	CreatedBy      string         `json:"created_by" db:"created_by"`
	CreatedAt      time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at" db:"updated_at"`

	// Relations (populated when needed)
	Vessel        *Vessel        `json:"vessel,omitempty"`
	Port          *Port          `json:"port,omitempty"`
	ServiceOrders []ServiceOrder `json:"service_orders,omitempty"`
}

// CreatePortCallInput represents input for creating a port call
type CreatePortCallInput struct {
	VesselID      string     `json:"vessel_id" validate:"required,uuid"`
	PortID        string     `json:"port_id" validate:"required,uuid"`
	WorkspaceID   string     `json:"workspace_id" validate:"required,uuid"`
	ETA           *time.Time `json:"eta"`
	ETD           *time.Time `json:"etd"`
	BerthName     *string    `json:"berth_name"`
	BerthTerminal *string    `json:"berth_terminal"`
	AgentID       *string    `json:"agent_id"`
}

// UpdatePortCallInput represents input for updating a port call
type UpdatePortCallInput struct {
	Status        *PortCallStatus `json:"status"`
	ETA           *time.Time      `json:"eta"`
	ETD           *time.Time      `json:"etd"`
	ATA           *time.Time      `json:"ata"`
	ATD           *time.Time      `json:"atd"`
	BerthName     *string         `json:"berth_name"`
	BerthTerminal *string         `json:"berth_terminal"`
	AgentID       *string         `json:"agent_id"`
}

// PortCallFilter represents filters for listing port calls
type PortCallFilter struct {
	WorkspaceID *string         `json:"workspace_id"`
	VesselID    *string         `json:"vessel_id"`
	PortID      *string         `json:"port_id"`
	Status      *PortCallStatus `json:"status"`
	ETAFrom     *time.Time      `json:"eta_from"`
	ETATo       *time.Time      `json:"eta_to"`
	Page        int             `json:"page"`
	PerPage     int             `json:"per_page"`
}

// Vessel represents a vessel (minimal for port call context)
type Vessel struct {
	ID   string `json:"id" db:"id"`
	Name string `json:"name" db:"name"`
	IMO  string `json:"imo" db:"imo"`
	Flag string `json:"flag" db:"flag"`
	Type string `json:"type" db:"type"`
}

// Port represents a port (minimal for port call context)
type Port struct {
	ID       string `json:"id" db:"id"`
	Name     string `json:"name" db:"name"`
	UNLOCODE string `json:"unlocode" db:"unlocode"`
	Country  string `json:"country" db:"country"`
}

// TimelineEventType represents the type of timeline event
type TimelineEventType string

const (
	TimelineEventCreated        TimelineEventType = "created"
	TimelineEventStatusChanged  TimelineEventType = "status_changed"
	TimelineEventBerthConfirmed TimelineEventType = "berth_confirmed"
	TimelineEventBerthChanged   TimelineEventType = "berth_changed"
	TimelineEventETAUpdated     TimelineEventType = "eta_updated"
	TimelineEventETDUpdated     TimelineEventType = "etd_updated"
	TimelineEventAgentAssigned  TimelineEventType = "agent_assigned"
	TimelineEventServiceAdded   TimelineEventType = "service_added"
	TimelineEventDocumentAdded  TimelineEventType = "document_added"
	TimelineEventNoteAdded      TimelineEventType = "note_added"
)

// TimelineEvent represents a timeline event for a port call
type TimelineEvent struct {
	ID          string            `json:"id" db:"id"`
	PortCallID  string            `json:"port_call_id" db:"port_call_id"`
	EventType   TimelineEventType `json:"event_type" db:"event_type"`
	Title       string            `json:"title" db:"title"`
	Description string            `json:"description,omitempty" db:"description"`
	OldValue    *string           `json:"old_value,omitempty" db:"old_value"`
	NewValue    *string           `json:"new_value,omitempty" db:"new_value"`
	Metadata    map[string]any    `json:"metadata,omitempty" db:"metadata"`
	CreatedBy   string            `json:"created_by" db:"created_by"`
	CreatedAt   time.Time         `json:"created_at" db:"created_at"`
}

// StatusTransitionResult contains the result of a status transition
type StatusTransitionResult struct {
	PortCall      *PortCall
	TimelineEvent *TimelineEvent
	OldStatus     PortCallStatus
	NewStatus     PortCallStatus
}

// PortCallStats represents statistics for port calls
type PortCallStats struct {
	TotalCalls      int            `json:"total_calls"`
	ByStatus        map[string]int `json:"by_status"`
	AvgTimeInPort   float64        `json:"avg_time_in_port_hours"`
	UpcomingCalls   int            `json:"upcoming_calls"`
	ActiveCalls     int            `json:"active_calls"`
	CompletedCalls  int            `json:"completed_calls"`
	CancelledCalls  int            `json:"cancelled_calls"`
}

// PortCallSummary represents a summary view of a port call
type PortCallSummary struct {
	ID            string         `json:"id"`
	Reference     string         `json:"reference"`
	VesselName    string         `json:"vessel_name"`
	PortName      string         `json:"port_name"`
	Status        PortCallStatus `json:"status"`
	ETA           *time.Time     `json:"eta,omitempty"`
	ETD           *time.Time     `json:"etd,omitempty"`
	ServiceCount  int            `json:"service_count"`
	PendingQuotes int            `json:"pending_quotes"`
}
