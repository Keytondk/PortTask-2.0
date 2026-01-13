package model

import (
	"time"
)

// RFQStatus represents the status of an RFQ
type RFQStatus string

const (
	RFQStatusDraft     RFQStatus = "draft"
	RFQStatusOpen      RFQStatus = "open"
	RFQStatusClosed    RFQStatus = "closed"
	RFQStatusAwarded   RFQStatus = "awarded"
	RFQStatusCancelled RFQStatus = "cancelled"
	RFQStatusExpired   RFQStatus = "expired"
)

// QuoteStatus represents the status of a quote
type QuoteStatus string

const (
	QuoteStatusSubmitted QuoteStatus = "submitted"
	QuoteStatusAccepted  QuoteStatus = "accepted"
	QuoteStatusRejected  QuoteStatus = "rejected"
	QuoteStatusWithdrawn QuoteStatus = "withdrawn"
)

// RFQ represents a Request for Quote
type RFQ struct {
	ID             string         `json:"id" db:"id"`
	Reference      string         `json:"reference" db:"reference"`
	ServiceTypeID  string         `json:"service_type_id" db:"service_type_id"`
	PortCallID     string         `json:"port_call_id" db:"port_call_id"`
	Status         RFQStatus      `json:"status" db:"status"`
	Description    *string        `json:"description,omitempty" db:"description"`
	Quantity       *float64       `json:"quantity,omitempty" db:"quantity"`
	Unit           *string        `json:"unit,omitempty" db:"unit"`
	Specifications map[string]any `json:"specifications" db:"specifications"`
	DeliveryDate   *time.Time     `json:"delivery_date,omitempty" db:"delivery_date"`
	Deadline       time.Time      `json:"deadline" db:"deadline"`
	InvitedVendors []string       `json:"invited_vendors" db:"invited_vendors"`
	AwardedQuoteID *string        `json:"awarded_quote_id,omitempty" db:"awarded_quote_id"`
	AwardedAt      *time.Time     `json:"awarded_at,omitempty" db:"awarded_at"`
	CreatedBy      string         `json:"created_by" db:"created_by"`
	CreatedAt      time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at" db:"updated_at"`

	// Relations
	ServiceType *ServiceType `json:"service_type,omitempty"`
	Quotes      []Quote      `json:"quotes,omitempty"`
	QuoteCount  int          `json:"quote_count,omitempty"`
}

// Quote represents a vendor quote for an RFQ
type Quote struct {
	ID           string      `json:"id" db:"id"`
	RFQID        string      `json:"rfq_id" db:"rfq_id"`
	VendorID     string      `json:"vendor_id" db:"vendor_id"`
	Status       QuoteStatus `json:"status" db:"status"`
	UnitPrice    float64     `json:"unit_price" db:"unit_price"`
	TotalPrice   float64     `json:"total_price" db:"total_price"`
	Currency     string      `json:"currency" db:"currency"`
	PaymentTerms *string     `json:"payment_terms,omitempty" db:"payment_terms"`
	DeliveryDate *time.Time  `json:"delivery_date,omitempty" db:"delivery_date"`
	ValidUntil   *time.Time  `json:"valid_until,omitempty" db:"valid_until"`
	Notes        *string     `json:"notes,omitempty" db:"notes"`
	Attachments  []string    `json:"attachments" db:"attachments"`
	SubmittedAt  time.Time   `json:"submitted_at" db:"submitted_at"`

	// Relations
	Vendor *Vendor `json:"vendor,omitempty"`
}

// CreateRFQInput represents input for creating an RFQ
type CreateRFQInput struct {
	ServiceTypeID  string         `json:"service_type_id" validate:"required"`
	PortCallID     string         `json:"port_call_id" validate:"required"`
	Description    *string        `json:"description"`
	Quantity       *float64       `json:"quantity"`
	Unit           *string        `json:"unit"`
	Specifications map[string]any `json:"specifications"`
	DeliveryDate   *time.Time     `json:"delivery_date"`
	Deadline       time.Time      `json:"deadline" validate:"required"`
	InvitedVendors []string       `json:"invited_vendors"`
}

// UpdateRFQInput represents input for updating an RFQ
type UpdateRFQInput struct {
	Description    *string        `json:"description"`
	Quantity       *float64       `json:"quantity"`
	Unit           *string        `json:"unit"`
	Specifications map[string]any `json:"specifications"`
	DeliveryDate   *time.Time     `json:"delivery_date"`
	Deadline       *time.Time     `json:"deadline"`
	InvitedVendors []string       `json:"invited_vendors"`
}

// SubmitQuoteInput represents input for submitting a quote
type SubmitQuoteInput struct {
	UnitPrice    float64    `json:"unit_price" validate:"required,gt=0"`
	TotalPrice   float64    `json:"total_price" validate:"required,gt=0"`
	Currency     string     `json:"currency" validate:"required"`
	PaymentTerms *string    `json:"payment_terms"`
	DeliveryDate *time.Time `json:"delivery_date"`
	ValidUntil   *time.Time `json:"valid_until"`
	Notes        *string    `json:"notes"`
	Attachments  []string   `json:"attachments"`
}

// RFQFilter represents filters for listing RFQs
type RFQFilter struct {
	PortCallID    *string    `json:"port_call_id"`
	ServiceTypeID *string    `json:"service_type_id"`
	Status        *RFQStatus `json:"status"`
	VendorID      *string    `json:"vendor_id"` // Filter by invited vendor
	Page          int        `json:"page"`
	PerPage       int        `json:"per_page"`
}

// RFQListResult represents paginated RFQ results
type RFQListResult struct {
	RFQs    []RFQ `json:"rfqs"`
	Total   int   `json:"total"`
	Page    int   `json:"page"`
	PerPage int   `json:"per_page"`
}

// QuoteComparison represents a comparison of quotes for an RFQ
type QuoteComparison struct {
	RFQID         string         `json:"rfq_id"`
	Quotes        []Quote        `json:"quotes"`
	LowestPrice   float64        `json:"lowest_price"`
	HighestPrice  float64        `json:"highest_price"`
	AveragePrice  float64        `json:"average_price"`
	QuoteCount    int            `json:"quote_count"`
	Recommendation *string       `json:"recommendation,omitempty"`
}

// RFQSummary represents a summary view of an RFQ
type RFQSummary struct {
	ID           string    `json:"id"`
	Reference    string    `json:"reference"`
	ServiceType  string    `json:"service_type"`
	Status       RFQStatus `json:"status"`
	Deadline     time.Time `json:"deadline"`
	QuoteCount   int       `json:"quote_count"`
	LowestQuote  *float64  `json:"lowest_quote,omitempty"`
	IsAwarded    bool      `json:"is_awarded"`
}
