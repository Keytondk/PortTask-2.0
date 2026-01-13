package service

import (
	"context"
	"fmt"
	"math"
	"sync"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/navo/pkg/logger"
	"github.com/navo/services/vessel/internal/integration"
	"github.com/navo/services/vessel/internal/model"
	"github.com/navo/services/vessel/internal/repository"
	"go.uber.org/zap"
)

// TrackingService handles vessel position tracking
type TrackingService struct {
	positionRepo *repository.PositionRepository
	cache        *redis.Client
	aisProvider  integration.AISProvider
	mu           sync.RWMutex
	activeFleet  map[string]bool // MMSI -> tracked
}

// NewTrackingService creates a new tracking service
func NewTrackingService(
	positionRepo *repository.PositionRepository,
	cache *redis.Client,
	aisProvider integration.AISProvider,
) *TrackingService {
	return &TrackingService{
		positionRepo: positionRepo,
		cache:        cache,
		aisProvider:  aisProvider,
		activeFleet:  make(map[string]bool),
	}
}

// GetLatestPosition retrieves the latest position for a vessel
func (s *TrackingService) GetLatestPosition(ctx context.Context, vesselID string) (*model.Position, error) {
	// Try cache first
	cacheKey := fmt.Sprintf("vessel:position:%s", vesselID)
	if s.cache != nil {
		// TODO: Implement cache lookup
		_ = cacheKey
	}

	// Get from database
	position, err := s.positionRepo.GetLatest(ctx, vesselID)
	if err != nil {
		return nil, fmt.Errorf("failed to get current position: %w", err)
	}
	if position == nil {
		return nil, fmt.Errorf("no position found for vessel")
	}

	return position, nil
}

// GetPositionHistory retrieves historical positions for a vessel
func (s *TrackingService) GetPositionHistory(ctx context.Context, filter model.PositionFilter) ([]model.Position, error) {
	if filter.Limit <= 0 {
		filter.Limit = 100
	}
	if filter.Limit > 1000 {
		filter.Limit = 1000
	}

	positions, err := s.positionRepo.GetHistory(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to get position history: %w", err)
	}

	return positions, nil
}

// GetVesselTrack retrieves a track (positions with metadata) for a vessel
func (s *TrackingService) GetVesselTrack(ctx context.Context, vesselID string, startTime, endTime time.Time) (*model.Track, error) {
	filter := model.PositionFilter{
		VesselID:  vesselID,
		StartTime: startTime,
		EndTime:   endTime,
		Limit:     1000,
	}
	positions, err := s.GetPositionHistory(ctx, filter)
	if err != nil {
		return nil, err
	}

	if len(positions) == 0 {
		return nil, fmt.Errorf("no positions found for vessel")
	}

	// Calculate total distance
	totalDistance := 0.0
	for i := 1; i < len(positions); i++ {
		totalDistance += calculateDistance(
			positions[i-1].Latitude, positions[i-1].Longitude,
			positions[i].Latitude, positions[i].Longitude,
		)
	}

	track := &model.Track{
		VesselID:  vesselID,
		Positions: positions,
		StartTime: positions[len(positions)-1].RecordedAt, // Oldest
		EndTime:   positions[0].RecordedAt,                 // Newest
		Distance:  totalDistance,
	}

	return track, nil
}

// GetFleetPositions retrieves current positions for all vessels in a workspace
func (s *TrackingService) GetFleetPositions(ctx context.Context, workspaceID string) ([]model.FleetPosition, error) {
	// Get vessels for workspace from vessel service (injected via vesselRepo)
	// For now, return empty if we don't have fleet data
	// In production, this would join with vessels table
	return []model.FleetPosition{}, nil
}

// GetPositionsInBounds retrieves positions within geographic bounds
func (s *TrackingService) GetPositionsInBounds(ctx context.Context, bounds model.GeoBounds, since time.Time) ([]model.Position, error) {
	positions, err := s.positionRepo.GetPositionsInBounds(ctx, bounds, since)
	if err != nil {
		return nil, fmt.Errorf("failed to get positions in bounds: %w", err)
	}
	return positions, nil
}

// RecordPosition records a new position for a vessel
func (s *TrackingService) RecordPosition(ctx context.Context, update model.PositionUpdate) (*model.Position, error) {
	position := model.Position{
		VesselID:         update.VesselID,
		Latitude:         update.Latitude,
		Longitude:        update.Longitude,
		Heading:          update.Heading,
		Course:           update.Course,
		Speed:            update.Speed,
		Destination:      update.Destination,
		ETA:              update.ETA,
		NavigationStatus: update.NavigationStatus,
		Source:           update.Source,
		RecordedAt:       update.RecordedAt,
	}

	created, err := s.positionRepo.Create(ctx, position)
	if err != nil {
		return nil, fmt.Errorf("failed to record position: %w", err)
	}

	// Update cache
	if s.cache != nil {
		cacheKey := fmt.Sprintf("vessel:position:%s", update.VesselID)
		// TODO: Set cached position with TTL
		_ = cacheKey
	}

	return created, nil
}

// RefreshVesselPosition fetches and records fresh position from AIS provider
func (s *TrackingService) RefreshVesselPosition(ctx context.Context, mmsi string, vesselID string) (*model.Position, error) {
	if s.aisProvider == nil {
		return nil, fmt.Errorf("AIS provider not configured")
	}

	update, err := s.aisProvider.GetVesselPosition(ctx, mmsi)
	if err != nil {
		return nil, fmt.Errorf("failed to get position from AIS: %w", err)
	}

	update.VesselID = vesselID

	position, err := s.RecordPosition(ctx, *update)
	if err != nil {
		return nil, err
	}

	return position, nil
}

// RefreshFleetPositions fetches and records fresh positions for all tracked vessels
func (s *TrackingService) RefreshFleetPositions(ctx context.Context, vessels []struct {
	ID   string
	MMSI string
}) (int, error) {
	if s.aisProvider == nil {
		return 0, fmt.Errorf("AIS provider not configured")
	}

	// Collect MMSIs
	mmsis := make([]string, 0, len(vessels))
	mmsiToVessel := make(map[string]string) // MMSI -> VesselID
	for _, v := range vessels {
		if v.MMSI != "" {
			mmsis = append(mmsis, v.MMSI)
			mmsiToVessel[v.MMSI] = v.ID
		}
	}

	if len(mmsis) == 0 {
		return 0, nil
	}

	// Get positions from provider
	updates, err := s.aisProvider.GetFleetPositions(ctx, mmsis)
	if err != nil {
		return 0, fmt.Errorf("failed to get fleet positions from AIS: %w", err)
	}

	// Record positions
	recorded := 0
	for _, update := range updates {
		if vesselID, ok := mmsiToVessel[update.MMSI]; ok {
			update.VesselID = vesselID
			if _, err := s.RecordPosition(ctx, update); err != nil {
				logger.Warn("Failed to record position",
					zap.String("vessel_id", vesselID),
					zap.Error(err),
				)
				continue
			}
			recorded++
		}
	}

	return recorded, nil
}

// StartPositionPolling starts background position polling
func (s *TrackingService) StartPositionPolling(ctx context.Context, interval time.Duration) {
	logger.Info("Starting position polling",
		zap.Duration("interval", interval),
		zap.String("provider", s.aisProvider.GetProviderName()),
	)

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			logger.Info("Stopping position polling")
			return
		case <-ticker.C:
			s.pollPositions(ctx)
		}
	}
}

func (s *TrackingService) pollPositions(ctx context.Context) {
	// Get list of active vessels to track
	// TODO: Get from database based on active workspaces

	logger.Debug("Polling positions for fleet")

	// For now, just log that we're polling
	// In production, this would fetch from the vessel repository
	// and call RefreshFleetPositions
}

// AddToActiveFleet adds a vessel to the active tracking fleet
func (s *TrackingService) AddToActiveFleet(mmsi string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.activeFleet[mmsi] = true
}

// RemoveFromActiveFleet removes a vessel from active tracking
func (s *TrackingService) RemoveFromActiveFleet(mmsi string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.activeFleet, mmsi)
}

// calculateDistance calculates the distance between two points in nautical miles
// using the Haversine formula
func calculateDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadiusNM = 3440.065 // Earth radius in nautical miles

	// Convert to radians
	lat1Rad := lat1 * math.Pi / 180
	lat2Rad := lat2 * math.Pi / 180
	deltaLat := (lat2 - lat1) * math.Pi / 180
	deltaLon := (lon2 - lon1) * math.Pi / 180

	// Haversine formula
	a := math.Sin(deltaLat/2)*math.Sin(deltaLat/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*
			math.Sin(deltaLon/2)*math.Sin(deltaLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadiusNM * c
}
