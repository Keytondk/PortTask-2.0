package model

import (
	"time"
)

// VesselStatus represents the status of a vessel
type VesselStatus string

const (
	VesselStatusActive   VesselStatus = "active"
	VesselStatusInactive VesselStatus = "inactive"
	VesselStatusArchived VesselStatus = "archived"
)

// VesselType represents the type of vessel
type VesselType string

const (
	VesselTypeBulkCarrier    VesselType = "bulk_carrier"
	VesselTypeTanker         VesselType = "tanker"
	VesselTypeContainer      VesselType = "container"
	VesselTypeGeneral        VesselType = "general_cargo"
	VesselTypeRoRo           VesselType = "ro_ro"
	VesselTypeCruise         VesselType = "cruise"
	VesselTypeTug            VesselType = "tug"
	VesselTypeOffshore       VesselType = "offshore"
	VesselTypeOther          VesselType = "other"
)

// Vessel represents a vessel entity
type Vessel struct {
	ID          string            `json:"id" db:"id"`
	Name        string            `json:"name" db:"name"`
	IMO         *string           `json:"imo,omitempty" db:"imo"`
	MMSI        *string           `json:"mmsi,omitempty" db:"mmsi"`
	Flag        *string           `json:"flag,omitempty" db:"flag"`
	Type        VesselType        `json:"type" db:"type"`
	Details     map[string]any    `json:"details,omitempty" db:"details"`
	WorkspaceID string            `json:"workspace_id" db:"workspace_id"`
	Status      VesselStatus      `json:"status" db:"status"`
	CreatedAt   time.Time         `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at" db:"updated_at"`

	// Relations
	CurrentPosition *Position `json:"current_position,omitempty"`
}

// VesselDetails contains additional vessel information
type VesselDetails struct {
	Deadweight     float64 `json:"deadweight,omitempty"`
	GrossTonnage   float64 `json:"gross_tonnage,omitempty"`
	NetTonnage     float64 `json:"net_tonnage,omitempty"`
	Length         float64 `json:"length,omitempty"`
	Beam           float64 `json:"beam,omitempty"`
	Draft          float64 `json:"draft,omitempty"`
	YearBuilt      int     `json:"year_built,omitempty"`
	Builder        string  `json:"builder,omitempty"`
	Owner          string  `json:"owner,omitempty"`
	Manager        string  `json:"manager,omitempty"`
	ClassSociety   string  `json:"class_society,omitempty"`
	CallSign       string  `json:"call_sign,omitempty"`
}

// CreateVesselInput represents input for creating a vessel
type CreateVesselInput struct {
	Name        string         `json:"name" validate:"required,min=1,max=255"`
	IMO         *string        `json:"imo" validate:"omitempty,len=7"`
	MMSI        *string        `json:"mmsi" validate:"omitempty,len=9"`
	Flag        *string        `json:"flag" validate:"omitempty,len=2"`
	Type        VesselType     `json:"type" validate:"required"`
	Details     map[string]any `json:"details"`
	WorkspaceID string         `json:"workspace_id" validate:"required"`
}

// UpdateVesselInput represents input for updating a vessel
type UpdateVesselInput struct {
	Name    *string        `json:"name" validate:"omitempty,min=1,max=255"`
	IMO     *string        `json:"imo" validate:"omitempty,len=7"`
	MMSI    *string        `json:"mmsi" validate:"omitempty,len=9"`
	Flag    *string        `json:"flag" validate:"omitempty,len=2"`
	Type    *VesselType    `json:"type"`
	Details map[string]any `json:"details"`
	Status  *VesselStatus  `json:"status"`
}

// VesselFilter represents filters for listing vessels
type VesselFilter struct {
	WorkspaceID *string       `json:"workspace_id"`
	Type        *VesselType   `json:"type"`
	Status      *VesselStatus `json:"status"`
	Search      *string       `json:"search"` // Search by name, IMO, or MMSI
	Page        int           `json:"page"`
	PerPage     int           `json:"per_page"`
}

// VesselListResult represents paginated vessel results
type VesselListResult struct {
	Vessels []Vessel `json:"vessels"`
	Total   int      `json:"total"`
	Page    int      `json:"page"`
	PerPage int      `json:"per_page"`
}

// VesselSummary represents a summary view of a vessel
type VesselSummary struct {
	ID              string       `json:"id"`
	Name            string       `json:"name"`
	IMO             *string      `json:"imo,omitempty"`
	Type            VesselType   `json:"type"`
	Status          VesselStatus `json:"status"`
	LastPositionAt  *time.Time   `json:"last_position_at,omitempty"`
	CurrentLocation *string      `json:"current_location,omitempty"`
	Destination     *string      `json:"destination,omitempty"`
	ETA             *time.Time   `json:"eta,omitempty"`
}
