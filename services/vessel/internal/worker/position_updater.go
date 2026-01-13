package worker

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/navo/services/vessel/internal/integration"
	"github.com/navo/services/vessel/internal/model"
	"github.com/navo/services/vessel/internal/repository"
)

// PositionUpdater periodically fetches vessel positions from AIS providers
// and updates the database and cache
type PositionUpdater struct {
	aisProvider  integration.AISProvider
	vesselRepo   *repository.VesselRepository
	positionRepo *repository.PositionRepository
	redis        *redis.Client

	// Configuration
	updateInterval time.Duration
	batchSize      int
	workspaceID    string

	// State
	running bool
	cancel  context.CancelFunc
	wg      sync.WaitGroup
	mu      sync.Mutex

	// Metrics
	lastUpdateTime time.Time
	updateCount    int64
	errorCount     int64
}

// PositionUpdaterConfig holds configuration for the updater
type PositionUpdaterConfig struct {
	UpdateInterval time.Duration
	BatchSize      int
	WorkspaceID    string // If empty, updates all workspaces
}

// DefaultConfig returns default configuration
func DefaultConfig() PositionUpdaterConfig {
	return PositionUpdaterConfig{
		UpdateInterval: 5 * time.Minute,
		BatchSize:      50,
		WorkspaceID:    "",
	}
}

// NewPositionUpdater creates a new position updater worker
func NewPositionUpdater(
	aisProvider integration.AISProvider,
	vesselRepo *repository.VesselRepository,
	positionRepo *repository.PositionRepository,
	redisClient *redis.Client,
	config PositionUpdaterConfig,
) *PositionUpdater {
	if config.UpdateInterval == 0 {
		config.UpdateInterval = 5 * time.Minute
	}
	if config.BatchSize == 0 {
		config.BatchSize = 50
	}

	return &PositionUpdater{
		aisProvider:    aisProvider,
		vesselRepo:     vesselRepo,
		positionRepo:   positionRepo,
		redis:          redisClient,
		updateInterval: config.UpdateInterval,
		batchSize:      config.BatchSize,
		workspaceID:    config.WorkspaceID,
	}
}

// Start begins the position update loop
func (u *PositionUpdater) Start(ctx context.Context) error {
	u.mu.Lock()
	if u.running {
		u.mu.Unlock()
		return nil
	}
	u.running = true
	u.mu.Unlock()

	ctx, u.cancel = context.WithCancel(ctx)

	// Run initial update
	u.runUpdate(ctx)

	// Start periodic updates
	u.wg.Add(1)
	go func() {
		defer u.wg.Done()
		ticker := time.NewTicker(u.updateInterval)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				u.runUpdate(ctx)
			}
		}
	}()

	log.Printf("[PositionUpdater] Started with interval %v", u.updateInterval)
	return nil
}

// Stop stops the position updater
func (u *PositionUpdater) Stop() {
	u.mu.Lock()
	if !u.running {
		u.mu.Unlock()
		return
	}
	u.running = false
	u.mu.Unlock()

	if u.cancel != nil {
		u.cancel()
	}
	u.wg.Wait()
	log.Println("[PositionUpdater] Stopped")
}

// runUpdate performs a single update cycle
func (u *PositionUpdater) runUpdate(ctx context.Context) {
	startTime := time.Now()
	log.Println("[PositionUpdater] Starting position update cycle")

	// Get vessels with MMSI numbers
	vessels, err := u.getVesselsToUpdate(ctx)
	if err != nil {
		log.Printf("[PositionUpdater] Error getting vessels: %v", err)
		u.errorCount++
		return
	}

	if len(vessels) == 0 {
		log.Println("[PositionUpdater] No vessels to update")
		return
	}

	// Process in batches
	updated := 0
	errors := 0

	for i := 0; i < len(vessels); i += u.batchSize {
		end := i + u.batchSize
		if end > len(vessels) {
			end = len(vessels)
		}
		batch := vessels[i:end]

		// Collect MMSIs for batch request
		mmsis := make([]string, 0, len(batch))
		mmsiToVessel := make(map[string]vesselInfo)
		for _, v := range batch {
			if v.MMSI != "" {
				mmsis = append(mmsis, v.MMSI)
				mmsiToVessel[v.MMSI] = v
			}
		}

		if len(mmsis) == 0 {
			continue
		}

		// Fetch positions from AIS provider
		positions, err := u.aisProvider.GetFleetPositions(ctx, mmsis)
		if err != nil {
			log.Printf("[PositionUpdater] Error fetching positions for batch: %v", err)
			errors += len(mmsis)
			continue
		}

		// Store positions
		for _, pos := range positions {
			vessel, ok := mmsiToVessel[pos.MMSI]
			if !ok {
				continue
			}

			if err := u.storePosition(ctx, vessel.ID, vessel.WorkspaceID, &pos); err != nil {
				log.Printf("[PositionUpdater] Error storing position for vessel %s: %v", vessel.ID, err)
				errors++
				continue
			}
			updated++
		}
	}

	duration := time.Since(startTime)
	u.lastUpdateTime = time.Now()
	u.updateCount += int64(updated)
	u.errorCount += int64(errors)

	log.Printf("[PositionUpdater] Completed: %d updated, %d errors, took %v", updated, errors, duration)
}

// vesselInfo holds minimal vessel info for updates
type vesselInfo struct {
	ID          string
	MMSI        string
	WorkspaceID string
}

// getVesselsToUpdate retrieves vessels that need position updates
func (u *PositionUpdater) getVesselsToUpdate(ctx context.Context) ([]vesselInfo, error) {
	// If workspace is specified, get only vessels in that workspace
	if u.workspaceID != "" {
		vessels, err := u.vesselRepo.GetVesselsWithMMSI(ctx, u.workspaceID)
		if err != nil {
			return nil, err
		}
		result := make([]vesselInfo, len(vessels))
		for i, v := range vessels {
			result[i] = vesselInfo{
				ID:          v.ID,
				MMSI:        v.MMSI,
				WorkspaceID: u.workspaceID,
			}
		}
		return result, nil
	}

	// Get all vessels with MMSI from all workspaces
	// This would need a different repository method
	// For now, return empty (single workspace mode)
	return nil, nil
}

// storePosition stores a position update in the database and cache
func (u *PositionUpdater) storePosition(ctx context.Context, vesselID, workspaceID string, pos *model.PositionUpdate) error {
	// Create position record
	position := model.Position{
		VesselID:  vesselID,
		Latitude:  pos.Latitude,
		Longitude: pos.Longitude,
		Heading:   pos.Heading,
		Course:    pos.Course,
		Speed:     pos.Speed,
		NavStatus: pos.NavStatus,
		Source:    pos.Source,
	}

	if pos.Destination != nil {
		position.Destination = pos.Destination
	}
	if pos.ETA != nil {
		position.ETA = pos.ETA
	}

	// Use recorded time from AIS if available
	if !pos.RecordedAt.IsZero() {
		position.RecordedAt = pos.RecordedAt
	} else {
		position.RecordedAt = time.Now().UTC()
	}

	// Store in database
	_, err := u.positionRepo.Create(ctx, position)
	if err != nil {
		return err
	}

	// Update cache with latest position
	if u.redis != nil {
		cacheKey := "vessel:position:" + vesselID
		positionJSON, err := position.MarshalJSON()
		if err == nil {
			u.redis.Set(ctx, cacheKey, positionJSON, 10*time.Minute)
		}

		// Publish position update event
		eventKey := "navo:vessels"
		u.redis.Publish(ctx, eventKey, positionJSON)
	}

	return nil
}

// Stats returns current updater statistics
func (u *PositionUpdater) Stats() map[string]interface{} {
	u.mu.Lock()
	defer u.mu.Unlock()

	return map[string]interface{}{
		"running":          u.running,
		"update_interval":  u.updateInterval.String(),
		"last_update":      u.lastUpdateTime,
		"total_updates":    u.updateCount,
		"total_errors":     u.errorCount,
		"provider":         u.aisProvider.GetProviderName(),
	}
}

// TriggerUpdate triggers an immediate position update
func (u *PositionUpdater) TriggerUpdate(ctx context.Context) {
	go u.runUpdate(ctx)
}

// UpdateVessel updates the position for a single vessel
func (u *PositionUpdater) UpdateVessel(ctx context.Context, vesselID, mmsi, workspaceID string) error {
	pos, err := u.aisProvider.GetVesselPosition(ctx, mmsi)
	if err != nil {
		return err
	}

	return u.storePosition(ctx, vesselID, workspaceID, pos)
}
