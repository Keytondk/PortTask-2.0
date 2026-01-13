package model

import "time"

// WeatherData represents weather information for a location
type WeatherData struct {
	ID          string    `json:"id"`
	PortID      *string   `json:"port_id,omitempty"`
	Latitude    float64   `json:"latitude"`
	Longitude   float64   `json:"longitude"`
	LocationName string   `json:"location_name"`

	// Current conditions
	Temperature    float64 `json:"temperature"`     // Celsius
	FeelsLike      float64 `json:"feels_like"`      // Celsius
	Humidity       int     `json:"humidity"`        // Percentage
	Pressure       int     `json:"pressure"`        // hPa
	WindSpeed      float64 `json:"wind_speed"`      // m/s
	WindDirection  int     `json:"wind_direction"`  // Degrees
	WindGust       *float64 `json:"wind_gust,omitempty"` // m/s
	Visibility     int     `json:"visibility"`      // Meters
	CloudCover     int     `json:"cloud_cover"`     // Percentage
	Description    string  `json:"description"`
	Icon           string  `json:"icon"`

	// Sea conditions (if available)
	WaveHeight     *float64 `json:"wave_height,omitempty"`     // Meters
	WavePeriod     *float64 `json:"wave_period,omitempty"`     // Seconds
	WaveDirection  *int     `json:"wave_direction,omitempty"`  // Degrees
	SeaTemperature *float64 `json:"sea_temperature,omitempty"` // Celsius

	// Alerts
	Alerts []WeatherAlert `json:"alerts,omitempty"`

	// Timestamps
	RecordedAt time.Time `json:"recorded_at"`
	SunriseAt  time.Time `json:"sunrise_at"`
	SunsetAt   time.Time `json:"sunset_at"`
	FetchedAt  time.Time `json:"fetched_at"`
}

// WeatherAlert represents a weather warning or alert
type WeatherAlert struct {
	Event       string    `json:"event"`
	Sender      string    `json:"sender"`
	Description string    `json:"description"`
	Severity    string    `json:"severity"` // minor, moderate, severe, extreme
	StartAt     time.Time `json:"start_at"`
	EndAt       time.Time `json:"end_at"`
}

// WeatherForecast represents a weather forecast entry
type WeatherForecast struct {
	DateTime       time.Time `json:"datetime"`
	Temperature    float64   `json:"temperature"`
	FeelsLike      float64   `json:"feels_like"`
	Humidity       int       `json:"humidity"`
	WindSpeed      float64   `json:"wind_speed"`
	WindDirection  int       `json:"wind_direction"`
	Precipitation  float64   `json:"precipitation"` // mm
	Description    string    `json:"description"`
	Icon           string    `json:"icon"`
}

// PortInfo represents detailed information about a port
type PortInfo struct {
	ID        string `json:"id"`
	UNLocode  string `json:"un_locode"`
	Name      string `json:"name"`
	Country   string `json:"country"`
	CountryCode string `json:"country_code"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Timezone  string  `json:"timezone"`

	// Port characteristics
	PortType       string   `json:"port_type"` // seaport, river_port, dry_port
	PortSize       string   `json:"port_size"` // small, medium, large, very_large
	MaxDraft       *float64 `json:"max_draft,omitempty"` // Meters
	MaxLOA         *float64 `json:"max_loa,omitempty"`   // Meters (Length Overall)
	TidalRange     *float64 `json:"tidal_range,omitempty"` // Meters

	// Facilities
	HasContainerTerminal bool `json:"has_container_terminal"`
	HasBulkTerminal      bool `json:"has_bulk_terminal"`
	HasTankerTerminal    bool `json:"has_tanker_terminal"`
	HasRoRoTerminal      bool `json:"has_roro_terminal"`
	HasCruiseTerminal    bool `json:"has_cruise_terminal"`
	HasDrydock           bool `json:"has_drydock"`
	HasBunkering         bool `json:"has_bunkering"`
	HasFreshWater        bool `json:"has_fresh_water"`
	HasProvisions        bool `json:"has_provisions"`
	HasRepairFacilities  bool `json:"has_repair_facilities"`

	// Services
	PilotageRequired   bool   `json:"pilotage_required"`
	TugAssistAvailable bool   `json:"tug_assist_available"`
	AnchorageAvailable bool   `json:"anchorage_available"`
	QuarantineRequired bool   `json:"quarantine_required"`

	// Contact
	Website       *string `json:"website,omitempty"`
	Phone         *string `json:"phone,omitempty"`
	Email         *string `json:"email,omitempty"`
	VHFChannel    *string `json:"vhf_channel,omitempty"`

	// Traffic
	AnnualTEUs       *int `json:"annual_teus,omitempty"`
	AnnualTonnage    *int `json:"annual_tonnage,omitempty"`
	AverageWaitTime  *int `json:"average_wait_time,omitempty"` // Hours
	CurrentCongestion string `json:"current_congestion,omitempty"` // low, moderate, high

	// Timestamps
	UpdatedAt time.Time `json:"updated_at"`
	FetchedAt time.Time `json:"fetched_at"`
}

// ExchangeRate represents a currency exchange rate
type ExchangeRate struct {
	ID           string    `json:"id"`
	BaseCurrency string    `json:"base_currency"`
	Currency     string    `json:"currency"`
	Rate         float64   `json:"rate"`
	InverseRate  float64   `json:"inverse_rate"`
	Source       string    `json:"source"`
	ValidFrom    time.Time `json:"valid_from"`
	ValidTo      time.Time `json:"valid_to"`
	FetchedAt    time.Time `json:"fetched_at"`
}

// ExchangeRates represents a collection of exchange rates with a base currency
type ExchangeRates struct {
	BaseCurrency string                 `json:"base_currency"`
	Rates        map[string]float64     `json:"rates"`
	Timestamp    time.Time              `json:"timestamp"`
}

// CurrencyConversion represents a currency conversion request/response
type CurrencyConversion struct {
	FromCurrency string    `json:"from_currency"`
	ToCurrency   string    `json:"to_currency"`
	Amount       float64   `json:"amount"`
	Result       float64   `json:"result"`
	Rate         float64   `json:"rate"`
	Timestamp    time.Time `json:"timestamp"`
}

// SyncStatus represents the status of external data synchronization
type SyncStatus struct {
	ID          string     `json:"id"`
	DataType    string     `json:"data_type"` // weather, port_info, exchange_rates
	LastSyncAt  *time.Time `json:"last_sync_at,omitempty"`
	NextSyncAt  time.Time  `json:"next_sync_at"`
	Status      string     `json:"status"` // idle, running, failed
	RecordCount int        `json:"record_count"`
	ErrorMessage *string   `json:"error_message,omitempty"`
	Duration    *int       `json:"duration_ms,omitempty"`
}
