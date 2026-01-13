package model

import (
	"time"
)

// VendorStatus represents the status of a vendor
type VendorStatus string

const (
	VendorStatusPending   VendorStatus = "pending"
	VendorStatusActive    VendorStatus = "active"
	VendorStatusSuspended VendorStatus = "suspended"
)

// InvitationStatus represents the status of a vendor invitation
type InvitationStatus string

const (
	InvitationStatusPending   InvitationStatus = "pending"
	InvitationStatusAccepted  InvitationStatus = "accepted"
	InvitationStatusExpired   InvitationStatus = "expired"
	InvitationStatusCancelled InvitationStatus = "cancelled"
)

// Vendor represents a service vendor
type Vendor struct {
	ID                 string       `json:"id" db:"id"`
	Name               string       `json:"name" db:"name"`
	OrganizationID     string       `json:"organization_id" db:"organization_id"`
	RegistrationNumber *string      `json:"registration_number,omitempty" db:"registration_number"`
	Address            Address      `json:"address" db:"address"`
	Contacts           []Contact    `json:"contacts" db:"contacts"`
	BankDetails        BankDetails  `json:"bank_details" db:"bank_details"`
	ServiceTypes       []string     `json:"service_types" db:"service_types"`
	Ports              []string     `json:"ports" db:"ports"`
	Certifications     []Certification `json:"certifications" db:"certifications"`

	// Performance metrics
	Rating         float64 `json:"rating" db:"rating"`
	TotalOrders    int     `json:"total_orders" db:"total_orders"`
	OnTimeDelivery float64 `json:"on_time_delivery" db:"on_time_delivery"`
	ResponseTime   float64 `json:"response_time" db:"response_time"`

	Status VendorStatus `json:"status" db:"status"`

	// Badge system
	IsVerified  bool       `json:"is_verified" db:"is_verified"`
	VerifiedAt  *time.Time `json:"verified_at,omitempty" db:"verified_at"`
	IsCertified bool       `json:"is_certified" db:"is_certified"`
	CertifiedAt *time.Time `json:"certified_at,omitempty" db:"certified_at"`

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// Address represents a physical address
type Address struct {
	Street     string `json:"street,omitempty"`
	City       string `json:"city,omitempty"`
	State      string `json:"state,omitempty"`
	PostalCode string `json:"postal_code,omitempty"`
	Country    string `json:"country,omitempty"`
}

// Contact represents a contact person
type Contact struct {
	Name     string `json:"name"`
	Role     string `json:"role,omitempty"`
	Email    string `json:"email"`
	Phone    string `json:"phone,omitempty"`
	IsPrimary bool  `json:"is_primary,omitempty"`
}

// BankDetails represents banking information
type BankDetails struct {
	BankName      string `json:"bank_name,omitempty"`
	AccountName   string `json:"account_name,omitempty"`
	AccountNumber string `json:"account_number,omitempty"`
	RoutingNumber string `json:"routing_number,omitempty"`
	SwiftCode     string `json:"swift_code,omitempty"`
	IBAN          string `json:"iban,omitempty"`
}

// Certification represents a vendor certification document
type Certification struct {
	Name        string     `json:"name"`
	Issuer      string     `json:"issuer,omitempty"`
	DocumentURL string     `json:"document_url,omitempty"`
	IssuedAt    *time.Time `json:"issued_at,omitempty"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
	Verified    bool       `json:"verified"`
	VerifiedAt  *time.Time `json:"verified_at,omitempty"`
}

// VendorInvitation represents an invitation sent to a vendor
type VendorInvitation struct {
	ID               string           `json:"id" db:"id"`
	OperatorOrgID    string           `json:"operator_org_id" db:"operator_org_id"`
	InvitedEmail     string           `json:"invited_email" db:"invited_email"`
	ExistingVendorID *string          `json:"existing_vendor_id,omitempty" db:"existing_vendor_id"`
	Status           InvitationStatus `json:"status" db:"status"`
	Token            string           `json:"token" db:"token"`
	InvitedBy        string           `json:"invited_by" db:"invited_by"`
	Message          *string          `json:"message,omitempty" db:"message"`
	ExpiresAt        time.Time        `json:"expires_at" db:"expires_at"`
	AcceptedAt       *time.Time       `json:"accepted_at,omitempty" db:"accepted_at"`
	ServiceTypes     []string         `json:"service_types" db:"service_types"`
	CreatedAt        time.Time        `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time        `json:"updated_at" db:"updated_at"`

	// Relations
	Inviter        *User    `json:"inviter,omitempty"`
	ExistingVendor *Vendor  `json:"existing_vendor,omitempty"`
	OperatorOrg    *Organization `json:"operator_org,omitempty"`
}

// OperatorVendorList represents an operator's approved vendor entry
type OperatorVendorList struct {
	ID             string   `json:"id" db:"id"`
	OperatorOrgID  string   `json:"operator_org_id" db:"operator_org_id"`
	VendorID       string   `json:"vendor_id" db:"vendor_id"`
	Status         string   `json:"status" db:"status"`
	AddedBy        string   `json:"added_by" db:"added_by"`
	Notes          *string  `json:"notes,omitempty" db:"notes"`
	PreferenceRank *int     `json:"preference_rank,omitempty" db:"preference_rank"`
	ServiceTypes   []string `json:"service_types" db:"service_types"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`

	// Relations
	Vendor *Vendor `json:"vendor,omitempty"`
}

// User represents a basic user (for relations)
type User struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

// Organization represents a basic organization (for relations)
type Organization struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Type string `json:"type"`
}

// CreateVendorInput represents input for creating a vendor
type CreateVendorInput struct {
	Name               string       `json:"name" validate:"required"`
	RegistrationNumber *string      `json:"registration_number"`
	Address            Address      `json:"address"`
	Contacts           []Contact    `json:"contacts" validate:"required,min=1"`
	BankDetails        BankDetails  `json:"bank_details"`
	ServiceTypes       []string     `json:"service_types"`
	Ports              []string     `json:"ports"`
}

// UpdateVendorInput represents input for updating a vendor
type UpdateVendorInput struct {
	Name               *string      `json:"name"`
	RegistrationNumber *string      `json:"registration_number"`
	Address            *Address     `json:"address"`
	Contacts           []Contact    `json:"contacts"`
	BankDetails        *BankDetails `json:"bank_details"`
	ServiceTypes       []string     `json:"service_types"`
	Ports              []string     `json:"ports"`
}

// InviteVendorInput represents input for inviting a vendor
type InviteVendorInput struct {
	Email        string   `json:"email" validate:"required,email"`
	Message      *string  `json:"message"`
	ServiceTypes []string `json:"service_types"`
}

// AcceptInvitationInput represents input for accepting an invitation
type AcceptInvitationInput struct {
	Token string `json:"token" validate:"required"`

	// If new vendor registration is needed
	VendorDetails *CreateVendorInput `json:"vendor_details,omitempty"`
}

// SubmitCertificationInput represents input for submitting certification documents
type SubmitCertificationInput struct {
	Name        string     `json:"name" validate:"required"`
	Issuer      string     `json:"issuer"`
	DocumentURL string     `json:"document_url" validate:"required,url"`
	IssuedAt    *time.Time `json:"issued_at"`
	ExpiresAt   *time.Time `json:"expires_at"`
}

// VendorFilter represents filters for listing vendors
type VendorFilter struct {
	OperatorOrgID *string       `json:"operator_org_id"`
	ServiceTypes  []string      `json:"service_types"`
	Ports         []string      `json:"ports"`
	Status        *VendorStatus `json:"status"`
	IsVerified    *bool         `json:"is_verified"`
	IsCertified   *bool         `json:"is_certified"`
	Search        *string       `json:"search"`
	Page          int           `json:"page"`
	PerPage       int           `json:"per_page"`
}

// VendorListResult represents paginated vendor results
type VendorListResult struct {
	Vendors []Vendor `json:"vendors"`
	Total   int      `json:"total"`
	Page    int      `json:"page"`
	PerPage int      `json:"per_page"`
}

// InvitationFilter represents filters for listing invitations
type InvitationFilter struct {
	OperatorOrgID *string           `json:"operator_org_id"`
	Status        *InvitationStatus `json:"status"`
	Email         *string           `json:"email"`
	Page          int               `json:"page"`
	PerPage       int               `json:"per_page"`
}

// InvitationListResult represents paginated invitation results
type InvitationListResult struct {
	Invitations []VendorInvitation `json:"invitations"`
	Total       int                `json:"total"`
	Page        int                `json:"page"`
	PerPage     int                `json:"per_page"`
}

// VendorBadges represents the badge status of a vendor
type VendorBadges struct {
	IsVerified  bool       `json:"is_verified"`
	VerifiedAt  *time.Time `json:"verified_at,omitempty"`
	IsCertified bool       `json:"is_certified"`
	CertifiedAt *time.Time `json:"certified_at,omitempty"`
}

// InvitationResult represents the result of sending an invitation
type InvitationResult struct {
	Invitation       *VendorInvitation `json:"invitation"`
	IsExistingVendor bool              `json:"is_existing_vendor"`
	AutoAdded        bool              `json:"auto_added"` // True if vendor was auto-added to operator's list
	Message          string            `json:"message"`
}
