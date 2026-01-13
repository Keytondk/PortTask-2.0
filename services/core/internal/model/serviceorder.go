package model

import (
	"time"
)

// ServiceOrderStatus represents the status of a service order
type ServiceOrderStatus string

const (
	ServiceOrderStatusDraft      ServiceOrderStatus = "draft"
	ServiceOrderStatusRequested  ServiceOrderStatus = "requested"
	ServiceOrderStatusRFQSent    ServiceOrderStatus = "rfq_sent"
	ServiceOrderStatusQuoted     ServiceOrderStatus = "quoted"
	ServiceOrderStatusConfirmed  ServiceOrderStatus = "confirmed"
	ServiceOrderStatusInProgress ServiceOrderStatus = "in_progress"
	ServiceOrderStatusCompleted  ServiceOrderStatus = "completed"
	ServiceOrderStatusCancelled  ServiceOrderStatus = "cancelled"
)

// ServiceOrder represents a service order entity
type ServiceOrder struct {
	ID             string             `json:"id" db:"id"`
	PortCallID     string             `json:"port_call_id" db:"port_call_id"`
	ServiceTypeID  string             `json:"service_type_id" db:"service_type_id"`
	Status         ServiceOrderStatus `json:"status" db:"status"`
	Description    *string            `json:"description,omitempty" db:"description"`
	Quantity       *float64           `json:"quantity,omitempty" db:"quantity"`
	Unit           *string            `json:"unit,omitempty" db:"unit"`
	Specifications map[string]any     `json:"specifications" db:"specifications"`
	RequestedDate  *time.Time         `json:"requested_date,omitempty" db:"requested_date"`
	ConfirmedDate  *time.Time         `json:"confirmed_date,omitempty" db:"confirmed_date"`
	CompletedDate  *time.Time         `json:"completed_date,omitempty" db:"completed_date"`
	VendorID       *string            `json:"vendor_id,omitempty" db:"vendor_id"`
	QuotedPrice    *float64           `json:"quoted_price,omitempty" db:"quoted_price"`
	FinalPrice     *float64           `json:"final_price,omitempty" db:"final_price"`
	Currency       string             `json:"currency" db:"currency"`
	RFQID          *string            `json:"rfq_id,omitempty" db:"rfq_id"`
	CreatedBy      string             `json:"created_by" db:"created_by"`
	CreatedAt      time.Time          `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time          `json:"updated_at" db:"updated_at"`

	// Relations
	ServiceType *ServiceType `json:"service_type,omitempty"`
	Vendor      *Vendor      `json:"vendor,omitempty"`
}

// CreateServiceOrderInput represents input for creating a service order
type CreateServiceOrderInput struct {
	PortCallID     string         `json:"port_call_id" validate:"required"`
	ServiceTypeID  string         `json:"service_type_id" validate:"required"`
	Description    *string        `json:"description"`
	Quantity       *float64       `json:"quantity"`
	Unit           *string        `json:"unit"`
	Specifications map[string]any `json:"specifications"`
	RequestedDate  *time.Time     `json:"requested_date"`
}

// UpdateServiceOrderInput represents input for updating a service order
type UpdateServiceOrderInput struct {
	Status         *ServiceOrderStatus `json:"status"`
	Description    *string             `json:"description"`
	Quantity       *float64            `json:"quantity"`
	Unit           *string             `json:"unit"`
	Specifications map[string]any      `json:"specifications"`
	RequestedDate  *time.Time          `json:"requested_date"`
	VendorID       *string             `json:"vendor_id"`
	QuotedPrice    *float64            `json:"quoted_price"`
	FinalPrice     *float64            `json:"final_price"`
	Currency       *string             `json:"currency"`
}

// ServiceOrderFilter represents filters for listing service orders
type ServiceOrderFilter struct {
	PortCallID    *string             `json:"port_call_id"`
	VendorID      *string             `json:"vendor_id"`
	ServiceTypeID *string             `json:"service_type_id"`
	Status        *ServiceOrderStatus `json:"status"`
	Page          int                 `json:"page"`
	PerPage       int                 `json:"per_page"`
}

// ServiceType represents a service type
type ServiceType struct {
	ID          string `json:"id" db:"id"`
	Name        string `json:"name" db:"name"`
	Category    string `json:"category" db:"category"`
	Description string `json:"description" db:"description"`
}

// Vendor represents a vendor (minimal)
type Vendor struct {
	ID   string `json:"id" db:"id"`
	Name string `json:"name" db:"name"`
}
