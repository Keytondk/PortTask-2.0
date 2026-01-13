package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/navo/services/vessel/internal/model"
	"github.com/rs/xid"
)

// VesselRepository handles vessel data persistence
type VesselRepository struct {
	pool *pgxpool.Pool
}

// NewVesselRepository creates a new vessel repository
func NewVesselRepository(pool *pgxpool.Pool) *VesselRepository {
	return &VesselRepository{pool: pool}
}

// Create creates a new vessel
func (r *VesselRepository) Create(ctx context.Context, input model.CreateVesselInput) (*model.Vessel, error) {
	id := xid.New().String()
	now := time.Now().UTC()

	details, err := json.Marshal(input.Details)
	if err != nil {
		details = []byte("{}")
	}

	query := `
		INSERT INTO vessels (
			id, name, imo, mmsi, flag, type, details,
			workspace_id, status, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, name, imo, mmsi, flag, type, details,
			workspace_id, status, created_at, updated_at
	`

	vessel := &model.Vessel{}
	var detailsJSON []byte

	err = r.pool.QueryRow(ctx, query,
		id,
		input.Name,
		input.IMO,
		input.MMSI,
		input.Flag,
		input.Type,
		details,
		input.WorkspaceID,
		model.VesselStatusActive,
		now,
		now,
	).Scan(
		&vessel.ID,
		&vessel.Name,
		&vessel.IMO,
		&vessel.MMSI,
		&vessel.Flag,
		&vessel.Type,
		&detailsJSON,
		&vessel.WorkspaceID,
		&vessel.Status,
		&vessel.CreatedAt,
		&vessel.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create vessel: %w", err)
	}

	if len(detailsJSON) > 0 {
		json.Unmarshal(detailsJSON, &vessel.Details)
	}

	return vessel, nil
}

// GetByID retrieves a vessel by ID
func (r *VesselRepository) GetByID(ctx context.Context, id string) (*model.Vessel, error) {
	query := `
		SELECT id, name, imo, mmsi, flag, type, details,
			workspace_id, status, created_at, updated_at
		FROM vessels
		WHERE id = $1
	`

	vessel := &model.Vessel{}
	var detailsJSON []byte

	err := r.pool.QueryRow(ctx, query, id).Scan(
		&vessel.ID,
		&vessel.Name,
		&vessel.IMO,
		&vessel.MMSI,
		&vessel.Flag,
		&vessel.Type,
		&detailsJSON,
		&vessel.WorkspaceID,
		&vessel.Status,
		&vessel.CreatedAt,
		&vessel.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get vessel: %w", err)
	}

	if len(detailsJSON) > 0 {
		json.Unmarshal(detailsJSON, &vessel.Details)
	}

	return vessel, nil
}

// GetByIMO retrieves a vessel by IMO number
func (r *VesselRepository) GetByIMO(ctx context.Context, imo string) (*model.Vessel, error) {
	query := `
		SELECT id, name, imo, mmsi, flag, type, details,
			workspace_id, status, created_at, updated_at
		FROM vessels
		WHERE imo = $1
	`

	vessel := &model.Vessel{}
	var detailsJSON []byte

	err := r.pool.QueryRow(ctx, query, imo).Scan(
		&vessel.ID,
		&vessel.Name,
		&vessel.IMO,
		&vessel.MMSI,
		&vessel.Flag,
		&vessel.Type,
		&detailsJSON,
		&vessel.WorkspaceID,
		&vessel.Status,
		&vessel.CreatedAt,
		&vessel.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get vessel by IMO: %w", err)
	}

	if len(detailsJSON) > 0 {
		json.Unmarshal(detailsJSON, &vessel.Details)
	}

	return vessel, nil
}

// GetByMMSI retrieves a vessel by MMSI number
func (r *VesselRepository) GetByMMSI(ctx context.Context, mmsi string) (*model.Vessel, error) {
	query := `
		SELECT id, name, imo, mmsi, flag, type, details,
			workspace_id, status, created_at, updated_at
		FROM vessels
		WHERE mmsi = $1
	`

	vessel := &model.Vessel{}
	var detailsJSON []byte

	err := r.pool.QueryRow(ctx, query, mmsi).Scan(
		&vessel.ID,
		&vessel.Name,
		&vessel.IMO,
		&vessel.MMSI,
		&vessel.Flag,
		&vessel.Type,
		&detailsJSON,
		&vessel.WorkspaceID,
		&vessel.Status,
		&vessel.CreatedAt,
		&vessel.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get vessel by MMSI: %w", err)
	}

	if len(detailsJSON) > 0 {
		json.Unmarshal(detailsJSON, &vessel.Details)
	}

	return vessel, nil
}

// List retrieves vessels with filters
func (r *VesselRepository) List(ctx context.Context, filter model.VesselFilter) ([]model.Vessel, int, error) {
	var conditions []string
	var args []any
	argIndex := 1

	// Build WHERE clause
	if filter.WorkspaceID != nil && *filter.WorkspaceID != "" {
		conditions = append(conditions, fmt.Sprintf("workspace_id = $%d", argIndex))
		args = append(args, *filter.WorkspaceID)
		argIndex++
	}

	if filter.Type != nil {
		conditions = append(conditions, fmt.Sprintf("type = $%d", argIndex))
		args = append(args, *filter.Type)
		argIndex++
	}

	if filter.Status != nil {
		conditions = append(conditions, fmt.Sprintf("status = $%d", argIndex))
		args = append(args, *filter.Status)
		argIndex++
	}

	if filter.Search != nil && *filter.Search != "" {
		searchPattern := "%" + *filter.Search + "%"
		conditions = append(conditions, fmt.Sprintf(
			"(name ILIKE $%d OR imo ILIKE $%d OR mmsi ILIKE $%d)",
			argIndex, argIndex, argIndex,
		))
		args = append(args, searchPattern)
		argIndex++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// Count total
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM vessels %s", whereClause)
	var total int
	if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count vessels: %w", err)
	}

	// Apply pagination
	offset := (filter.Page - 1) * filter.PerPage
	query := fmt.Sprintf(`
		SELECT id, name, imo, mmsi, flag, type, details,
			workspace_id, status, created_at, updated_at
		FROM vessels
		%s
		ORDER BY name ASC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIndex, argIndex+1)

	args = append(args, filter.PerPage, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list vessels: %w", err)
	}
	defer rows.Close()

	var vessels []model.Vessel
	for rows.Next() {
		var vessel model.Vessel
		var detailsJSON []byte

		err := rows.Scan(
			&vessel.ID,
			&vessel.Name,
			&vessel.IMO,
			&vessel.MMSI,
			&vessel.Flag,
			&vessel.Type,
			&detailsJSON,
			&vessel.WorkspaceID,
			&vessel.Status,
			&vessel.CreatedAt,
			&vessel.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan vessel: %w", err)
		}

		if len(detailsJSON) > 0 {
			json.Unmarshal(detailsJSON, &vessel.Details)
		}

		vessels = append(vessels, vessel)
	}

	return vessels, total, nil
}

// Update updates a vessel
func (r *VesselRepository) Update(ctx context.Context, id string, input model.UpdateVesselInput) (*model.Vessel, error) {
	var setClauses []string
	var args []any
	argIndex := 1

	if input.Name != nil {
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", argIndex))
		args = append(args, *input.Name)
		argIndex++
	}

	if input.IMO != nil {
		setClauses = append(setClauses, fmt.Sprintf("imo = $%d", argIndex))
		args = append(args, *input.IMO)
		argIndex++
	}

	if input.MMSI != nil {
		setClauses = append(setClauses, fmt.Sprintf("mmsi = $%d", argIndex))
		args = append(args, *input.MMSI)
		argIndex++
	}

	if input.Flag != nil {
		setClauses = append(setClauses, fmt.Sprintf("flag = $%d", argIndex))
		args = append(args, *input.Flag)
		argIndex++
	}

	if input.Type != nil {
		setClauses = append(setClauses, fmt.Sprintf("type = $%d", argIndex))
		args = append(args, *input.Type)
		argIndex++
	}

	if input.Details != nil {
		details, _ := json.Marshal(input.Details)
		setClauses = append(setClauses, fmt.Sprintf("details = $%d", argIndex))
		args = append(args, details)
		argIndex++
	}

	if input.Status != nil {
		setClauses = append(setClauses, fmt.Sprintf("status = $%d", argIndex))
		args = append(args, *input.Status)
		argIndex++
	}

	if len(setClauses) == 0 {
		return r.GetByID(ctx, id)
	}

	setClauses = append(setClauses, fmt.Sprintf("updated_at = $%d", argIndex))
	args = append(args, time.Now().UTC())
	argIndex++

	args = append(args, id)

	query := fmt.Sprintf(`
		UPDATE vessels
		SET %s
		WHERE id = $%d
		RETURNING id, name, imo, mmsi, flag, type, details,
			workspace_id, status, created_at, updated_at
	`, strings.Join(setClauses, ", "), argIndex)

	vessel := &model.Vessel{}
	var detailsJSON []byte

	err := r.pool.QueryRow(ctx, query, args...).Scan(
		&vessel.ID,
		&vessel.Name,
		&vessel.IMO,
		&vessel.MMSI,
		&vessel.Flag,
		&vessel.Type,
		&detailsJSON,
		&vessel.WorkspaceID,
		&vessel.Status,
		&vessel.CreatedAt,
		&vessel.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update vessel: %w", err)
	}

	if len(detailsJSON) > 0 {
		json.Unmarshal(detailsJSON, &vessel.Details)
	}

	return vessel, nil
}

// Delete deletes a vessel
func (r *VesselRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM vessels WHERE id = $1`
	result, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete vessel: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("vessel not found")
	}

	return nil
}

// GetVesselsByWorkspace retrieves all vessels for a workspace
func (r *VesselRepository) GetVesselsByWorkspace(ctx context.Context, workspaceID string) ([]model.Vessel, error) {
	query := `
		SELECT id, name, imo, mmsi, flag, type, details,
			workspace_id, status, created_at, updated_at
		FROM vessels
		WHERE workspace_id = $1 AND status != 'archived'
		ORDER BY name ASC
	`

	rows, err := r.pool.Query(ctx, query, workspaceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get vessels by workspace: %w", err)
	}
	defer rows.Close()

	var vessels []model.Vessel
	for rows.Next() {
		var vessel model.Vessel
		var detailsJSON []byte

		err := rows.Scan(
			&vessel.ID,
			&vessel.Name,
			&vessel.IMO,
			&vessel.MMSI,
			&vessel.Flag,
			&vessel.Type,
			&detailsJSON,
			&vessel.WorkspaceID,
			&vessel.Status,
			&vessel.CreatedAt,
			&vessel.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan vessel: %w", err)
		}

		if len(detailsJSON) > 0 {
			json.Unmarshal(detailsJSON, &vessel.Details)
		}

		vessels = append(vessels, vessel)
	}

	return vessels, nil
}

// GetVesselsWithMMSI retrieves vessels that have MMSI for tracking
func (r *VesselRepository) GetVesselsWithMMSI(ctx context.Context, workspaceID string) ([]struct {
	ID   string
	MMSI string
}, error) {
	query := `
		SELECT id, mmsi
		FROM vessels
		WHERE workspace_id = $1
			AND mmsi IS NOT NULL
			AND mmsi != ''
			AND status = 'active'
	`

	rows, err := r.pool.Query(ctx, query, workspaceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get vessels with MMSI: %w", err)
	}
	defer rows.Close()

	var result []struct {
		ID   string
		MMSI string
	}

	for rows.Next() {
		var item struct {
			ID   string
			MMSI string
		}
		if err := rows.Scan(&item.ID, &item.MMSI); err != nil {
			return nil, fmt.Errorf("failed to scan vessel MMSI: %w", err)
		}
		result = append(result, item)
	}

	return result, nil
}

// GetAllActiveVesselsWithMMSI retrieves all active vessels with MMSI across all workspaces
func (r *VesselRepository) GetAllActiveVesselsWithMMSI(ctx context.Context) ([]struct {
	ID          string
	MMSI        string
	WorkspaceID string
}, error) {
	query := `
		SELECT id, mmsi, workspace_id
		FROM vessels
		WHERE mmsi IS NOT NULL
			AND mmsi != ''
			AND status = 'active'
	`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get all vessels with MMSI: %w", err)
	}
	defer rows.Close()

	var result []struct {
		ID          string
		MMSI        string
		WorkspaceID string
	}

	for rows.Next() {
		var item struct {
			ID          string
			MMSI        string
			WorkspaceID string
		}
		if err := rows.Scan(&item.ID, &item.MMSI, &item.WorkspaceID); err != nil {
			return nil, fmt.Errorf("failed to scan vessel: %w", err)
		}
		result = append(result, item)
	}

	return result, nil
}
