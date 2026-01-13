package model

import "time"

// DashboardMetrics represents high-level dashboard metrics
type DashboardMetrics struct {
	// Port Calls
	ActivePortCalls    int     `json:"active_port_calls"`
	PortCallsThisMonth int     `json:"port_calls_this_month"`
	PortCallsChange    float64 `json:"port_calls_change"` // Percentage change from last month

	// Vessels
	TotalVessels   int `json:"total_vessels"`
	VesselsAtSea   int `json:"vessels_at_sea"`
	VesselsInPort  int `json:"vessels_in_port"`

	// Services
	ActiveServices    int     `json:"active_services"`
	PendingApprovals  int     `json:"pending_approvals"`
	AvgServiceCost    float64 `json:"avg_service_cost"`

	// RFQs
	OpenRFQs        int     `json:"open_rfqs"`
	QuotesPending   int     `json:"quotes_pending"`
	AvgQuotesPerRFQ float64 `json:"avg_quotes_per_rfq"`

	// Vendors
	TotalVendors    int     `json:"total_vendors"`
	ActiveVendors   int     `json:"active_vendors"`
	AvgVendorRating float64 `json:"avg_vendor_rating"`

	GeneratedAt time.Time `json:"generated_at"`
}

// PortCallAnalytics represents port call analytics
type PortCallAnalytics struct {
	// Summary
	Total         int            `json:"total"`
	ByStatus      map[string]int `json:"by_status"`
	ByPort        []PortStat     `json:"by_port"`
	ByVessel      []VesselStat   `json:"by_vessel"`

	// Time metrics
	AvgPortStayHours float64 `json:"avg_port_stay_hours"`
	AvgTurnaroundHours float64 `json:"avg_turnaround_hours"`

	// Trends
	MonthlyTrend []MonthlyCount `json:"monthly_trend"`
}

// PortStat represents statistics for a port
type PortStat struct {
	PortID     string  `json:"port_id"`
	PortName   string  `json:"port_name"`
	Country    string  `json:"country"`
	CallCount  int     `json:"call_count"`
	AvgStayHrs float64 `json:"avg_stay_hours"`
}

// VesselStat represents statistics for a vessel
type VesselStat struct {
	VesselID   string `json:"vessel_id"`
	VesselName string `json:"vessel_name"`
	IMO        string `json:"imo"`
	CallCount  int    `json:"call_count"`
}

// MonthlyCount represents a monthly count
type MonthlyCount struct {
	Month string `json:"month"` // YYYY-MM format
	Count int    `json:"count"`
}

// CostAnalytics represents cost analytics
type CostAnalytics struct {
	TotalCost      float64           `json:"total_cost"`
	AvgCostPerCall float64           `json:"avg_cost_per_call"`
	ByServiceType  []ServiceTypeCost `json:"by_service_type"`
	ByPort         []PortCost        `json:"by_port"`
	ByVessel       []VesselCost      `json:"by_vessel"`
	MonthlyTrend   []MonthlyCost     `json:"monthly_trend"`
	Currency       string            `json:"currency"`
}

// ServiceTypeCost represents cost by service type
type ServiceTypeCost struct {
	ServiceTypeID   string  `json:"service_type_id"`
	ServiceTypeName string  `json:"service_type_name"`
	TotalCost       float64 `json:"total_cost"`
	OrderCount      int     `json:"order_count"`
	AvgCost         float64 `json:"avg_cost"`
}

// PortCost represents cost by port
type PortCost struct {
	PortID    string  `json:"port_id"`
	PortName  string  `json:"port_name"`
	TotalCost float64 `json:"total_cost"`
	CallCount int     `json:"call_count"`
	AvgCost   float64 `json:"avg_cost"`
}

// VesselCost represents cost by vessel
type VesselCost struct {
	VesselID   string  `json:"vessel_id"`
	VesselName string  `json:"vessel_name"`
	TotalCost  float64 `json:"total_cost"`
	CallCount  int     `json:"call_count"`
	AvgCost    float64 `json:"avg_cost"`
}

// MonthlyCost represents monthly cost
type MonthlyCost struct {
	Month string  `json:"month"`
	Cost  float64 `json:"cost"`
}

// VendorAnalytics represents vendor performance analytics
type VendorAnalytics struct {
	TotalVendors     int             `json:"total_vendors"`
	VerifiedVendors  int             `json:"verified_vendors"`
	CertifiedVendors int             `json:"certified_vendors"`
	AvgRating        float64         `json:"avg_rating"`
	TopVendors       []VendorRanking `json:"top_vendors"`
	ByServiceType    []VendorByType  `json:"by_service_type"`
}

// VendorRanking represents a vendor in ranking
type VendorRanking struct {
	VendorID        string  `json:"vendor_id"`
	VendorName      string  `json:"vendor_name"`
	Rating          float64 `json:"rating"`
	TotalOrders     int     `json:"total_orders"`
	OnTimeDelivery  float64 `json:"on_time_delivery"`
	ResponseTimeHrs float64 `json:"response_time_hours"`
	IsVerified      bool    `json:"is_verified"`
	IsCertified     bool    `json:"is_certified"`
}

// VendorByType represents vendor count by service type
type VendorByType struct {
	ServiceType string `json:"service_type"`
	VendorCount int    `json:"vendor_count"`
}

// RFQAnalytics represents RFQ analytics
type RFQAnalytics struct {
	TotalRFQs       int            `json:"total_rfqs"`
	ByStatus        map[string]int `json:"by_status"`
	AvgQuotesPerRFQ float64        `json:"avg_quotes_per_rfq"`
	AvgTimeToAward  float64        `json:"avg_time_to_award_hours"`
	WinRateByVendor []VendorWinRate `json:"win_rate_by_vendor"`
	MonthlyTrend    []MonthlyCount  `json:"monthly_trend"`
}

// VendorWinRate represents vendor RFQ win rate
type VendorWinRate struct {
	VendorID   string  `json:"vendor_id"`
	VendorName string  `json:"vendor_name"`
	QuoteCount int     `json:"quote_count"`
	WinCount   int     `json:"win_count"`
	WinRate    float64 `json:"win_rate"`
}

// TimeRange represents a time range for queries
type TimeRange struct {
	Start time.Time `json:"start"`
	End   time.Time `json:"end"`
}

// AnalyticsFilter represents filters for analytics queries
type AnalyticsFilter struct {
	OrganizationID string    `json:"organization_id"`
	WorkspaceID    string    `json:"workspace_id"`
	StartDate      time.Time `json:"start_date"`
	EndDate        time.Time `json:"end_date"`
	PortIDs        []string  `json:"port_ids"`
	VesselIDs      []string  `json:"vessel_ids"`
	ServiceTypeIDs []string  `json:"service_type_ids"`
}
