package integration

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/navo/services/vessel/internal/model"
)

// MarineTrafficClient implements the full MarineTraffic API integration
type MarineTrafficClient struct {
	apiKey     string
	baseURL    string
	httpClient *http.Client
}

// NewMarineTrafficClient creates a new MarineTraffic API client
func NewMarineTrafficClient(apiKey string) *MarineTrafficClient {
	return &MarineTrafficClient{
		apiKey:  apiKey,
		baseURL: "https://services.marinetraffic.com/api",
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// MarineTraffic API response structures
type mtVesselPosition struct {
	MMSI        string  `json:"MMSI"`
	IMO         string  `json:"IMO"`
	ShipName    string  `json:"SHIPNAME"`
	LAT         string  `json:"LAT"`
	LON         string  `json:"LON"`
	Speed       string  `json:"SPEED"`
	Heading     string  `json:"HEADING"`
	Course      string  `json:"COURSE"`
	Status      string  `json:"STATUS"`
	Destination string  `json:"DESTINATION"`
	ETA         string  `json:"ETA"`
	Timestamp   string  `json:"TIMESTAMP"`
}

type mtVesselTrack struct {
	LAT       string `json:"LAT"`
	LON       string `json:"LON"`
	Speed     string `json:"SPEED"`
	Course    string `json:"COURSE"`
	Heading   string `json:"HEADING"`
	Timestamp string `json:"TIMESTAMP"`
}

// GetProviderName returns the provider name
func (c *MarineTrafficClient) GetProviderName() string {
	return "marinetraffic"
}

// HealthCheck verifies the API connection
func (c *MarineTrafficClient) HealthCheck(ctx context.Context) error {
	if c.apiKey == "" {
		return fmt.Errorf("marinetraffic: API key not configured")
	}

	// Test with a simple API call
	_, err := c.makeRequest(ctx, "exportvessels", url.Values{
		"v":         {"8"},
		"protocol":  {"jsono"},
		"msgtype":   {"simple"},
		"shipid":    {"0"}, // Invalid ID just to test connectivity
	})
	// We expect an error for invalid ship, but no network error
	if err != nil && err.Error() != "marinetraffic: no data found" {
		return err
	}
	return nil
}

// GetVesselPosition retrieves current position by MMSI
func (c *MarineTrafficClient) GetVesselPosition(ctx context.Context, mmsi string) (*model.PositionUpdate, error) {
	params := url.Values{
		"v":         {"8"},
		"protocol":  {"jsono"},
		"msgtype":   {"simple"},
		"mmsi":      {mmsi},
	}

	data, err := c.makeRequest(ctx, "exportvessel", params)
	if err != nil {
		return nil, err
	}

	var positions []mtVesselPosition
	if err := json.Unmarshal(data, &positions); err != nil {
		return nil, fmt.Errorf("marinetraffic: failed to parse response: %w", err)
	}

	if len(positions) == 0 {
		return nil, fmt.Errorf("marinetraffic: no position data for MMSI %s", mmsi)
	}

	return c.convertPosition(&positions[0])
}

// GetVesselPositionByIMO retrieves current position by IMO number
func (c *MarineTrafficClient) GetVesselPositionByIMO(ctx context.Context, imo string) (*model.PositionUpdate, error) {
	params := url.Values{
		"v":         {"8"},
		"protocol":  {"jsono"},
		"msgtype":   {"simple"},
		"imo":       {imo},
	}

	data, err := c.makeRequest(ctx, "exportvessel", params)
	if err != nil {
		return nil, err
	}

	var positions []mtVesselPosition
	if err := json.Unmarshal(data, &positions); err != nil {
		return nil, fmt.Errorf("marinetraffic: failed to parse response: %w", err)
	}

	if len(positions) == 0 {
		return nil, fmt.Errorf("marinetraffic: no position data for IMO %s", imo)
	}

	return c.convertPosition(&positions[0])
}

// GetVesselTrack retrieves historical track data
func (c *MarineTrafficClient) GetVesselTrack(ctx context.Context, mmsi string, from, to time.Time) ([]model.PositionUpdate, error) {
	// Calculate days for the API (MarineTraffic uses days parameter)
	days := int(to.Sub(from).Hours()/24) + 1
	if days < 1 {
		days = 1
	}
	if days > 90 {
		days = 90 // API limit
	}

	params := url.Values{
		"v":         {"2"},
		"protocol":  {"jsono"},
		"mmsi":      {mmsi},
		"days":      {strconv.Itoa(days)},
	}

	data, err := c.makeRequest(ctx, "exportvesseltrack", params)
	if err != nil {
		return nil, err
	}

	var tracks []mtVesselTrack
	if err := json.Unmarshal(data, &tracks); err != nil {
		return nil, fmt.Errorf("marinetraffic: failed to parse track response: %w", err)
	}

	positions := make([]model.PositionUpdate, 0, len(tracks))
	for _, t := range tracks {
		pos, err := c.convertTrackPoint(mmsi, &t)
		if err != nil {
			continue // Skip invalid points
		}

		// Filter by time range
		if pos.RecordedAt.Before(from) || pos.RecordedAt.After(to) {
			continue
		}

		positions = append(positions, *pos)
	}

	return positions, nil
}

// GetFleetPositions retrieves positions for multiple vessels
func (c *MarineTrafficClient) GetFleetPositions(ctx context.Context, mmsis []string) ([]model.PositionUpdate, error) {
	positions := make([]model.PositionUpdate, 0, len(mmsis))

	// MarineTraffic API doesn't support batch requests in basic plans
	// We need to make individual requests
	for _, mmsi := range mmsis {
		pos, err := c.GetVesselPosition(ctx, mmsi)
		if err != nil {
			// Log error but continue with other vessels
			continue
		}
		positions = append(positions, *pos)
	}

	return positions, nil
}

// SubscribeVesselUpdates is not supported for MarineTraffic basic API
func (c *MarineTrafficClient) SubscribeVesselUpdates(ctx context.Context, mmsis []string) (<-chan model.PositionUpdate, error) {
	// MarineTraffic requires premium subscription for real-time data
	// Implement polling as a workaround
	ch := make(chan model.PositionUpdate, len(mmsis))

	go func() {
		defer close(ch)
		ticker := time.NewTicker(5 * time.Minute) // Poll every 5 minutes
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				positions, err := c.GetFleetPositions(ctx, mmsis)
				if err != nil {
					continue
				}
				for _, pos := range positions {
					select {
					case ch <- pos:
					case <-ctx.Done():
						return
					}
				}
			}
		}
	}()

	return ch, nil
}

// makeRequest performs an HTTP request to the MarineTraffic API
func (c *MarineTrafficClient) makeRequest(ctx context.Context, endpoint string, params url.Values) ([]byte, error) {
	// Build URL with API key
	reqURL := fmt.Sprintf("%s/%s/%s", c.baseURL, endpoint, c.apiKey)

	// Add query parameters
	if len(params) > 0 {
		reqURL += "/?" + params.Encode()
	}

	req, err := http.NewRequestWithContext(ctx, "GET", reqURL, nil)
	if err != nil {
		return nil, fmt.Errorf("marinetraffic: failed to create request: %w", err)
	}

	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("marinetraffic: request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("marinetraffic: no data found")
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("marinetraffic: API returned status %d", resp.StatusCode)
	}

	var result json.RawMessage
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("marinetraffic: failed to decode response: %w", err)
	}

	return result, nil
}

// convertPosition converts MarineTraffic position to our model
func (c *MarineTrafficClient) convertPosition(p *mtVesselPosition) (*model.PositionUpdate, error) {
	lat, err := strconv.ParseFloat(p.LAT, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid latitude: %w", err)
	}

	lon, err := strconv.ParseFloat(p.LON, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid longitude: %w", err)
	}

	pos := &model.PositionUpdate{
		MMSI:        p.MMSI,
		IMO:         p.IMO,
		Latitude:    lat,
		Longitude:   lon,
		Destination: stringPtr(p.Destination),
		NavStatus:   stringPtr(p.Status),
		Source:      "marinetraffic",
	}

	if speed, err := strconv.ParseFloat(p.Speed, 64); err == nil {
		// MarineTraffic returns speed in tenths of knots
		speedKnots := speed / 10.0
		pos.Speed = &speedKnots
	}

	if heading, err := strconv.ParseFloat(p.Heading, 64); err == nil {
		pos.Heading = &heading
	}

	if course, err := strconv.ParseFloat(p.Course, 64); err == nil {
		pos.Course = &course
	}

	// Parse timestamp (format: 2006-01-02T15:04:05)
	if ts, err := time.Parse("2006-01-02T15:04:05", p.Timestamp); err == nil {
		pos.RecordedAt = ts
	} else {
		pos.RecordedAt = time.Now().UTC()
	}

	// Parse ETA
	if p.ETA != "" {
		if eta, err := time.Parse("2006-01-02T15:04:05", p.ETA); err == nil {
			pos.ETA = &eta
		}
	}

	return pos, nil
}

// convertTrackPoint converts MarineTraffic track point to our model
func (c *MarineTrafficClient) convertTrackPoint(mmsi string, t *mtVesselTrack) (*model.PositionUpdate, error) {
	lat, err := strconv.ParseFloat(t.LAT, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid latitude: %w", err)
	}

	lon, err := strconv.ParseFloat(t.LON, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid longitude: %w", err)
	}

	pos := &model.PositionUpdate{
		MMSI:      mmsi,
		Latitude:  lat,
		Longitude: lon,
		Source:    "marinetraffic",
	}

	if speed, err := strconv.ParseFloat(t.Speed, 64); err == nil {
		speedKnots := speed / 10.0
		pos.Speed = &speedKnots
	}

	if heading, err := strconv.ParseFloat(t.Heading, 64); err == nil {
		pos.Heading = &heading
	}

	if course, err := strconv.ParseFloat(t.Course, 64); err == nil {
		pos.Course = &course
	}

	// Parse timestamp
	if ts, err := time.Parse("2006-01-02T15:04:05", t.Timestamp); err == nil {
		pos.RecordedAt = ts
	} else {
		pos.RecordedAt = time.Now().UTC()
	}

	return pos, nil
}

func stringPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
