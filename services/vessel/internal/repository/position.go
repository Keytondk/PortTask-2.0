package repository

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/navo/services/vessel/internal/model"
	"github.com/rs/xid"
)

// PositionRepository handles vessel position data persistence
type PositionRepository struct {
	pool *pgxpool.Pool
}

// NewPositionRepository creates a new position repository
func NewPositionRepository(pool *pgxpool.Pool) *PositionRepository {
	return &PositionRepository{pool: pool}
}

// Create creates a new position record
func (r *PositionRepository) Create(ctx context.Context, position model.Position) (*model.Position, error) {
	if position.ID == "" {
		position.ID = xid.New().String()
	}
	if position.CreatedAt.IsZero() {
		position.CreatedAt = time.Now().UTC()
	}
	if position.RecordedAt.IsZero() {
		position.RecordedAt = time.Now().UTC()
	}

	query := `
		INSERT INTO vessel_positions (
			id, vessel_id, latitude, longitude, heading, speed,
			destination, eta, recorded_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, vessel_id, latitude, longitude, heading, speed,
			destination, eta, recorded_at
	`

	result := &model.Position{}
	err := r.pool.QueryRow(ctx, query,
		position.ID,
		position.VesselID,
		position.Latitude,
		position.Longitude,
		position.Heading,
		position.Speed,
		position.Destination,
		position.ETA,
		position.RecordedAt,
	).Scan(
		&result.ID,
		&result.VesselID,
		&result.Latitude,
		&result.Longitude,
		&result.Heading,
		&result.Speed,
		&result.Destination,
		&result.ETA,
		&result.RecordedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create position: %w", err)
	}

	result.Source = position.Source
	result.Course = position.Course
	result.NavigationStatus = position.NavigationStatus
	result.CreatedAt = position.CreatedAt

	return result, nil
}

// CreateBatch creates multiple position records in a batch
func (r *PositionRepository) CreateBatch(ctx context.Context, positions []model.Position) error {
	if len(positions) == 0 {
		return nil
	}

	batch := &pgx.Batch{}

	for _, pos := range positions {
		if pos.ID == "" {
			pos.ID = xid.New().String()
		}
		if pos.RecordedAt.IsZero() {
			pos.RecordedAt = time.Now().UTC()
		}

		query := `
			INSERT INTO vessel_positions (
				id, vessel_id, latitude, longitude, heading, speed,
				destination, eta, recorded_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		`
		batch.Queue(query,
			pos.ID,
			pos.VesselID,
			pos.Latitude,
			pos.Longitude,
			pos.Heading,
			pos.Speed,
			pos.Destination,
			pos.ETA,
			pos.RecordedAt,
		)
	}

	results := r.pool.SendBatch(ctx, batch)
	defer results.Close()

	for i := 0; i < len(positions); i++ {
		if _, err := results.Exec(); err != nil {
			return fmt.Errorf("failed to insert position %d: %w", i, err)
		}
	}

	return nil
}

// GetLatest retrieves the latest position for a vessel
func (r *PositionRepository) GetLatest(ctx context.Context, vesselID string) (*model.Position, error) {
	query := `
		SELECT id, vessel_id, latitude, longitude, heading, speed,
			destination, eta, recorded_at
		FROM vessel_positions
		WHERE vessel_id = $1
		ORDER BY recorded_at DESC
		LIMIT 1
	`

	position := &model.Position{}
	err := r.pool.QueryRow(ctx, query, vesselID).Scan(
		&position.ID,
		&position.VesselID,
		&position.Latitude,
		&position.Longitude,
		&position.Heading,
		&position.Speed,
		&position.Destination,
		&position.ETA,
		&position.RecordedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get latest position: %w", err)
	}

	return position, nil
}

// GetHistory retrieves position history for a vessel
func (r *PositionRepository) GetHistory(ctx context.Context, filter model.PositionFilter) ([]model.Position, error) {
	query := `
		SELECT id, vessel_id, latitude, longitude, heading, speed,
			destination, eta, recorded_at
		FROM vessel_positions
		WHERE vessel_id = $1
			AND recorded_at >= $2
			AND recorded_at <= $3
		ORDER BY recorded_at DESC
		LIMIT $4
	`

	limit := filter.Limit
	if limit <= 0 {
		limit = 1000
	}

	rows, err := r.pool.Query(ctx, query,
		filter.VesselID,
		filter.StartTime,
		filter.EndTime,
		limit,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get position history: %w", err)
	}
	defer rows.Close()

	var positions []model.Position
	for rows.Next() {
		var pos model.Position
		err := rows.Scan(
			&pos.ID,
			&pos.VesselID,
			&pos.Latitude,
			&pos.Longitude,
			&pos.Heading,
			&pos.Speed,
			&pos.Destination,
			&pos.ETA,
			&pos.RecordedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan position: %w", err)
		}
		positions = append(positions, pos)
	}

	return positions, nil
}

// GetLatestForVessels retrieves the latest position for multiple vessels
func (r *PositionRepository) GetLatestForVessels(ctx context.Context, vesselIDs []string) (map[string]*model.Position, error) {
	if len(vesselIDs) == 0 {
		return make(map[string]*model.Position), nil
	}

	query := `
		SELECT DISTINCT ON (vessel_id)
			id, vessel_id, latitude, longitude, heading, speed,
			destination, eta, recorded_at
		FROM vessel_positions
		WHERE vessel_id = ANY($1)
		ORDER BY vessel_id, recorded_at DESC
	`

	rows, err := r.pool.Query(ctx, query, vesselIDs)
	if err != nil {
		return nil, fmt.Errorf("failed to get latest positions: %w", err)
	}
	defer rows.Close()

	result := make(map[string]*model.Position)
	for rows.Next() {
		pos := &model.Position{}
		err := rows.Scan(
			&pos.ID,
			&pos.VesselID,
			&pos.Latitude,
			&pos.Longitude,
			&pos.Heading,
			&pos.Speed,
			&pos.Destination,
			&pos.ETA,
			&pos.RecordedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan position: %w", err)
		}
		result[pos.VesselID] = pos
	}

	return result, nil
}

// DeleteOlderThan deletes positions older than the specified duration
func (r *PositionRepository) DeleteOlderThan(ctx context.Context, olderThan time.Duration) (int64, error) {
	cutoff := time.Now().UTC().Add(-olderThan)

	query := `DELETE FROM vessel_positions WHERE recorded_at < $1`
	result, err := r.pool.Exec(ctx, query, cutoff)
	if err != nil {
		return 0, fmt.Errorf("failed to delete old positions: %w", err)
	}

	return result.RowsAffected(), nil
}

// GetPositionsInBounds retrieves positions within geographic bounds
func (r *PositionRepository) GetPositionsInBounds(ctx context.Context, bounds model.GeoBounds, since time.Time) ([]model.Position, error) {
	query := `
		SELECT DISTINCT ON (vessel_id)
			id, vessel_id, latitude, longitude, heading, speed,
			destination, eta, recorded_at
		FROM vessel_positions
		WHERE latitude >= $1 AND latitude <= $2
			AND longitude >= $3 AND longitude <= $4
			AND recorded_at >= $5
		ORDER BY vessel_id, recorded_at DESC
	`

	rows, err := r.pool.Query(ctx, query,
		bounds.SouthWest.Latitude,
		bounds.NorthEast.Latitude,
		bounds.SouthWest.Longitude,
		bounds.NorthEast.Longitude,
		since,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get positions in bounds: %w", err)
	}
	defer rows.Close()

	var positions []model.Position
	for rows.Next() {
		var pos model.Position
		err := rows.Scan(
			&pos.ID,
			&pos.VesselID,
			&pos.Latitude,
			&pos.Longitude,
			&pos.Heading,
			&pos.Speed,
			&pos.Destination,
			&pos.ETA,
			&pos.RecordedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan position: %w", err)
		}
		positions = append(positions, pos)
	}

	return positions, nil
}

// GetTrack retrieves a vessel track for a time range
func (r *PositionRepository) GetTrack(ctx context.Context, vesselID string, start, end time.Time) (*model.Track, error) {
	// First get vessel name
	vesselQuery := `SELECT name FROM vessels WHERE id = $1`
	var vesselName string
	err := r.pool.QueryRow(ctx, vesselQuery, vesselID).Scan(&vesselName)
	if err != nil && err != pgx.ErrNoRows {
		return nil, fmt.Errorf("failed to get vessel name: %w", err)
	}

	// Get positions
	positions, err := r.GetHistory(ctx, model.PositionFilter{
		VesselID:  vesselID,
		StartTime: start,
		EndTime:   end,
		Limit:     10000,
	})
	if err != nil {
		return nil, err
	}

	// Calculate total distance
	var totalDistance float64
	for i := 1; i < len(positions); i++ {
		totalDistance += haversineDistance(
			positions[i-1].Latitude, positions[i-1].Longitude,
			positions[i].Latitude, positions[i].Longitude,
		)
	}

	return &model.Track{
		VesselID:   vesselID,
		VesselName: vesselName,
		Positions:  positions,
		StartTime:  start,
		EndTime:    end,
		Distance:   totalDistance,
	}, nil
}

// CountByVessel returns the count of positions for a vessel
func (r *PositionRepository) CountByVessel(ctx context.Context, vesselID string) (int64, error) {
	query := `SELECT COUNT(*) FROM vessel_positions WHERE vessel_id = $1`
	var count int64
	err := r.pool.QueryRow(ctx, query, vesselID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count positions: %w", err)
	}
	return count, nil
}

// haversineDistance calculates distance between two points in nautical miles
func haversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadiusNM = 3440.065 // Earth radius in nautical miles

	lat1Rad := lat1 * 0.0174533
	lat2Rad := lat2 * 0.0174533
	deltaLat := (lat2 - lat1) * 0.0174533
	deltaLon := (lon2 - lon1) * 0.0174533

	a := math.Sin(deltaLat/2)*math.Sin(deltaLat/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*math.Sin(deltaLon/2)*math.Sin(deltaLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadiusNM * c
}
