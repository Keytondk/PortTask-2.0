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

// VesselFinderClient implements the full VesselFinder API integration
type VesselFinderClient struct {
	apiKey     string
	baseURL    string
	httpClient *http.Client
}

// NewVesselFinderClient creates a new VesselFinder API client
func NewVesselFinderClient(apiKey string) *VesselFinderClient {
	return &VesselFinderClient{
		apiKey:  apiKey,
		baseURL: "https://api.vesselfinder.com",
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// VesselFinder API response structures
type vfVesselResponse struct {
	MMSI        int     `json:"MMSI"`
	IMO         int     `json:"IMO"`
	Name        string  `json:"NAME"`
	Lat         float64 `json:"LAT"`
	Lon         float64 `json:"LON"`
	Speed       float64 `json:"SPEED"`
	Heading     int     `json:"HEADING"`
	Course      float64 `json:"COURSE"`
	NavStatus   int     `json:"NAVSTAT"`
	Destination string  `json:"DEST"`
	ETA         string  `json:"ETA"`
	AISType     string  `json:"A"`
	Timestamp   int64   `json:"TIMESTAMP"`
}

type vfAPIResponse struct {
	AIS []vfVesselResponse `json:"AIS"`
}

type vfErrorResponse struct {
	Error string `json:"error"`
}

// Navigation status mapping
var navStatusMap = map[int]string{
	0:  "Under way using engine",
	1:  "At anchor",
	2:  "Not under command",
	3:  "Restricted manoeuvrability",
	4:  "Constrained by her draught",
	5:  "Moored",
	6:  "Aground",
	7:  "Engaged in Fishing",
	8:  "Under way sailing",
	9:  "Reserved for future amendment",
	10: "Reserved for future amendment",
	11: "Power-driven vessel towing astern",
	12: "Power-driven vessel pushing ahead or towing alongside",
	13: "Reserved for future use",
	14: "AIS-SART is active",
	15: "Not defined",
}

// GetProviderName returns the provider name
func (c *VesselFinderClient) GetProviderName() string {
	return "vesselfinder"
}

// HealthCheck verifies the API connection
func (c *VesselFinderClient) HealthCheck(ctx context.Context) error {
	if c.apiKey == "" {
		return fmt.Errorf("vesselfinder: API key not configured")
	}

	// Make a test request with minimal params
	params := url.Values{
		"userkey": {c.apiKey},
		"mmsi":    {"0"}, // Invalid MMSI to test connectivity
	}

	_, err := c.makeRequest(ctx, "/vessels", params)
	// We expect an error for invalid MMSI, but verify it's not an auth error
	if err != nil && err.Error() == "vesselfinder: invalid API key" {
		return err
	}
	return nil
}

// GetVesselPosition retrieves current position by MMSI
func (c *VesselFinderClient) GetVesselPosition(ctx context.Context, mmsi string) (*model.PositionUpdate, error) {
	params := url.Values{
		"userkey": {c.apiKey},
		"mmsi":    {mmsi},
		"format":  {"json"},
	}

	data, err := c.makeRequest(ctx, "/vessels", params)
	if err != nil {
		return nil, err
	}

	var resp vfAPIResponse
	if err := json.Unmarshal(data, &resp); err != nil {
		return nil, fmt.Errorf("vesselfinder: failed to parse response: %w", err)
	}

	if len(resp.AIS) == 0 {
		return nil, fmt.Errorf("vesselfinder: no position data for MMSI %s", mmsi)
	}

	return c.convertPosition(&resp.AIS[0])
}

// GetVesselPositionByIMO retrieves current position by IMO number
func (c *VesselFinderClient) GetVesselPositionByIMO(ctx context.Context, imo string) (*model.PositionUpdate, error) {
	params := url.Values{
		"userkey": {c.apiKey},
		"imo":     {imo},
		"format":  {"json"},
	}

	data, err := c.makeRequest(ctx, "/vessels", params)
	if err != nil {
		return nil, err
	}

	var resp vfAPIResponse
	if err := json.Unmarshal(data, &resp); err != nil {
		return nil, fmt.Errorf("vesselfinder: failed to parse response: %w", err)
	}

	if len(resp.AIS) == 0 {
		return nil, fmt.Errorf("vesselfinder: no position data for IMO %s", imo)
	}

	return c.convertPosition(&resp.AIS[0])
}

// GetVesselTrack retrieves historical track data
func (c *VesselFinderClient) GetVesselTrack(ctx context.Context, mmsi string, from, to time.Time) ([]model.PositionUpdate, error) {
	// VesselFinder track API uses period parameter
	period := int(to.Sub(from).Hours())
	if period < 1 {
		period = 1
	}
	if period > 720 { // 30 days max
		period = 720
	}

	params := url.Values{
		"userkey": {c.apiKey},
		"mmsi":    {mmsi},
		"period":  {strconv.Itoa(period)},
		"format":  {"json"},
	}

	data, err := c.makeRequest(ctx, "/track", params)
	if err != nil {
		return nil, err
	}

	// Track response is an array of positions
	var tracks []struct {
		Lat       float64 `json:"LAT"`
		Lon       float64 `json:"LON"`
		Speed     float64 `json:"SPEED"`
		Course    float64 `json:"COURSE"`
		Heading   int     `json:"HEADING"`
		Timestamp int64   `json:"TIMESTAMP"`
	}

	if err := json.Unmarshal(data, &tracks); err != nil {
		return nil, fmt.Errorf("vesselfinder: failed to parse track response: %w", err)
	}

	positions := make([]model.PositionUpdate, 0, len(tracks))
	for _, t := range tracks {
		recordedAt := time.Unix(t.Timestamp, 0).UTC()

		// Filter by time range
		if recordedAt.Before(from) || recordedAt.After(to) {
			continue
		}

		heading := float64(t.Heading)
		pos := model.PositionUpdate{
			MMSI:       mmsi,
			Latitude:   t.Lat,
			Longitude:  t.Lon,
			Speed:      &t.Speed,
			Course:     &t.Course,
			Heading:    &heading,
			Source:     "vesselfinder",
			RecordedAt: recordedAt,
		}
		positions = append(positions, pos)
	}

	return positions, nil
}

// GetFleetPositions retrieves positions for multiple vessels
func (c *VesselFinderClient) GetFleetPositions(ctx context.Context, mmsis []string) ([]model.PositionUpdate, error) {
	if len(mmsis) == 0 {
		return []model.PositionUpdate{}, nil
	}

	// VesselFinder supports comma-separated MMSIs
	mmsiList := ""
	for i, m := range mmsis {
		if i > 0 {
			mmsiList += ","
		}
		mmsiList += m
	}

	params := url.Values{
		"userkey": {c.apiKey},
		"mmsi":    {mmsiList},
		"format":  {"json"},
	}

	data, err := c.makeRequest(ctx, "/vessels", params)
	if err != nil {
		return nil, err
	}

	var resp vfAPIResponse
	if err := json.Unmarshal(data, &resp); err != nil {
		return nil, fmt.Errorf("vesselfinder: failed to parse response: %w", err)
	}

	positions := make([]model.PositionUpdate, 0, len(resp.AIS))
	for i := range resp.AIS {
		pos, err := c.convertPosition(&resp.AIS[i])
		if err != nil {
			continue
		}
		positions = append(positions, *pos)
	}

	return positions, nil
}

// SubscribeVesselUpdates implements polling-based updates
func (c *VesselFinderClient) SubscribeVesselUpdates(ctx context.Context, mmsis []string) (<-chan model.PositionUpdate, error) {
	ch := make(chan model.PositionUpdate, len(mmsis)*2)

	go func() {
		defer close(ch)
		ticker := time.NewTicker(3 * time.Minute) // VesselFinder data updates every few minutes
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

// makeRequest performs an HTTP request to the VesselFinder API
func (c *VesselFinderClient) makeRequest(ctx context.Context, endpoint string, params url.Values) ([]byte, error) {
	reqURL := fmt.Sprintf("%s%s?%s", c.baseURL, endpoint, params.Encode())

	req, err := http.NewRequestWithContext(ctx, "GET", reqURL, nil)
	if err != nil {
		return nil, fmt.Errorf("vesselfinder: failed to create request: %w", err)
	}

	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("vesselfinder: request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized {
		return nil, fmt.Errorf("vesselfinder: invalid API key")
	}

	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("vesselfinder: no data found")
	}

	if resp.StatusCode != http.StatusOK {
		// Try to parse error response
		var errResp vfErrorResponse
		if err := json.NewDecoder(resp.Body).Decode(&errResp); err == nil && errResp.Error != "" {
			return nil, fmt.Errorf("vesselfinder: %s", errResp.Error)
		}
		return nil, fmt.Errorf("vesselfinder: API returned status %d", resp.StatusCode)
	}

	var result json.RawMessage
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("vesselfinder: failed to decode response: %w", err)
	}

	return result, nil
}

// convertPosition converts VesselFinder position to our model
func (c *VesselFinderClient) convertPosition(p *vfVesselResponse) (*model.PositionUpdate, error) {
	heading := float64(p.Heading)

	pos := &model.PositionUpdate{
		MMSI:      strconv.Itoa(p.MMSI),
		IMO:       strconv.Itoa(p.IMO),
		Latitude:  p.Lat,
		Longitude: p.Lon,
		Speed:     &p.Speed,
		Course:    &p.Course,
		Heading:   &heading,
		Source:    "vesselfinder",
	}

	// Set navigation status
	if status, ok := navStatusMap[p.NavStatus]; ok {
		pos.NavStatus = &status
	}

	// Set destination
	if p.Destination != "" {
		pos.Destination = &p.Destination
	}

	// Parse timestamp (Unix timestamp)
	if p.Timestamp > 0 {
		pos.RecordedAt = time.Unix(p.Timestamp, 0).UTC()
	} else {
		pos.RecordedAt = time.Now().UTC()
	}

	// Parse ETA (format varies)
	if p.ETA != "" {
		// Try common formats
		formats := []string{
			"01-02 15:04",
			"2006-01-02 15:04",
			"2006-01-02T15:04:05Z",
		}
		for _, format := range formats {
			if eta, err := time.Parse(format, p.ETA); err == nil {
				// If year is missing, assume current/next occurrence
				if eta.Year() == 0 {
					now := time.Now().UTC()
					eta = time.Date(now.Year(), eta.Month(), eta.Day(), eta.Hour(), eta.Minute(), 0, 0, time.UTC)
					if eta.Before(now) {
						eta = eta.AddDate(1, 0, 0)
					}
				}
				pos.ETA = &eta
				break
			}
		}
	}

	return pos, nil
}
