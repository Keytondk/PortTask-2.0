package model

import (
	"time"
)

// NavigationStatus represents AIS navigation status
type NavigationStatus int

const (
	NavStatusUnderWay      NavigationStatus = 0
	NavStatusAtAnchor      NavigationStatus = 1
	NavStatusNotUnderCmd   NavigationStatus = 2
	NavStatusRestrictedMan NavigationStatus = 3
	NavStatusConstrained   NavigationStatus = 4
	NavStatusMoored        NavigationStatus = 5
	NavStatusAground       NavigationStatus = 6
	NavStatusFishing       NavigationStatus = 7
	NavStatusSailing       NavigationStatus = 8
)

// Position represents a vessel position record
type Position struct {
	ID               string           `json:"id" db:"id"`
	VesselID         string           `json:"vessel_id" db:"vessel_id"`
	Latitude         float64          `json:"latitude" db:"latitude"`
	Longitude        float64          `json:"longitude" db:"longitude"`
	Heading          *float64         `json:"heading,omitempty" db:"heading"`
	Course           *float64         `json:"course,omitempty" db:"course"`
	Speed            *float64         `json:"speed,omitempty" db:"speed"` // Speed in knots
	Destination      *string          `json:"destination,omitempty" db:"destination"`
	ETA              *time.Time       `json:"eta,omitempty" db:"eta"`
	NavigationStatus *NavigationStatus `json:"navigation_status,omitempty" db:"navigation_status"`
	Source           string           `json:"source" db:"source"` // ais, manual, gps
	RecordedAt       time.Time        `json:"recorded_at" db:"recorded_at"`
	CreatedAt        time.Time        `json:"created_at" db:"created_at"`
}

// Track represents a series of positions for a vessel
type Track struct {
	VesselID   string     `json:"vessel_id"`
	VesselName string     `json:"vessel_name"`
	Positions  []Position `json:"positions"`
	StartTime  time.Time  `json:"start_time"`
	EndTime    time.Time  `json:"end_time"`
	Distance   float64    `json:"distance_nm"` // Total distance in nautical miles
}

// FleetPosition represents the current position of a fleet vessel
type FleetPosition struct {
	VesselID         string    `json:"vessel_id"`
	VesselName       string    `json:"vessel_name"`
	VesselType       string    `json:"vessel_type"`
	Latitude         float64   `json:"latitude"`
	Longitude        float64   `json:"longitude"`
	Heading          *float64  `json:"heading,omitempty"`
	Speed            *float64  `json:"speed,omitempty"`
	Destination      *string   `json:"destination,omitempty"`
	ETA              *time.Time `json:"eta,omitempty"`
	LastUpdatedAt    time.Time `json:"last_updated_at"`
	Status           string    `json:"status"` // moving, stopped, anchored, moored
}

// PositionFilter represents filters for listing positions
type PositionFilter struct {
	VesselID  string    `json:"vessel_id"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
	Limit     int       `json:"limit"`
}

// PositionUpdate represents a position update from AIS or other sources
type PositionUpdate struct {
	VesselID         string           `json:"vessel_id"`
	MMSI             string           `json:"mmsi"`
	IMO              string           `json:"imo"`
	Latitude         float64          `json:"latitude"`
	Longitude        float64          `json:"longitude"`
	Heading          *float64         `json:"heading,omitempty"`
	Course           *float64         `json:"course,omitempty"`
	Speed            *float64         `json:"speed,omitempty"`
	Destination      *string          `json:"destination,omitempty"`
	ETA              *time.Time       `json:"eta,omitempty"`
	NavigationStatus *NavigationStatus `json:"navigation_status,omitempty"`
	Source           string           `json:"source"`
	RecordedAt       time.Time        `json:"recorded_at"`
}

// GeoPoint represents a geographic point
type GeoPoint struct {
	Latitude  float64 `json:"lat"`
	Longitude float64 `json:"lng"`
}

// GeoBounds represents a geographic bounding box
type GeoBounds struct {
	NorthEast GeoPoint `json:"ne"`
	SouthWest GeoPoint `json:"sw"`
}

// DistanceResult represents the result of a distance calculation
type DistanceResult struct {
	FromPosition Position `json:"from"`
	ToPosition   Position `json:"to"`
	DistanceNM   float64  `json:"distance_nm"`
	BearingDeg   float64  `json:"bearing_deg"`
	DurationHrs  float64  `json:"duration_hours"`
}

// VoyageProgress represents the progress of a voyage
type VoyageProgress struct {
	VesselID         string    `json:"vessel_id"`
	Destination      string    `json:"destination"`
	DistanceToGo     float64   `json:"distance_to_go_nm"`
	DistanceTraveled float64   `json:"distance_traveled_nm"`
	PercentComplete  float64   `json:"percent_complete"`
	ETA              time.Time `json:"eta"`
	ETAVariance      string    `json:"eta_variance"` // on_time, delayed, ahead
}
