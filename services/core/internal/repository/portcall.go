package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/navo/services/core/internal/model"
)

// PortCallRepository handles port call database operations
type PortCallRepository struct {
	db *sql.DB
}

// NewPortCallRepository creates a new port call repository
func NewPortCallRepository(db *sql.DB) *PortCallRepository {
	return &PortCallRepository{db: db}
}

// generateReference generates a unique port call reference
func (r *PortCallRepository) generateReference(ctx context.Context) (string, error) {
	year := time.Now().Format("06")
	prefix := fmt.Sprintf("PC-%s-", year)

	var maxNum int
	query := `SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'PC-\d{2}-(\d+)') AS INTEGER)), 0)
			  FROM port_calls WHERE reference LIKE $1`
	err := GetDB(ctx, r.db).QueryRowContext(ctx, query, prefix+"%").Scan(&maxNum)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("%s%04d", prefix, maxNum+1), nil
}

// Create creates a new port call
func (r *PortCallRepository) Create(ctx context.Context, input model.CreatePortCallInput, createdBy string) (*model.PortCall, error) {
	reference, err := r.generateReference(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to generate reference: %w", err)
	}

	id := generateCUID()
	now := time.Now()

	query := `
		INSERT INTO port_calls (id, reference, vessel_id, port_id, workspace_id, status,
			eta, etd, berth_name, berth_terminal, agent_id, created_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		RETURNING id, reference, vessel_id, port_id, workspace_id, status, eta, etd,
			ata, atd, berth_name, berth_terminal, berth_confirmed_at, agent_id,
			created_by, created_at, updated_at`

	portCall := &model.PortCall{}
	err = GetDB(ctx, r.db).QueryRowContext(ctx, query,
		id, reference, input.VesselID, input.PortID, input.WorkspaceID, model.PortCallStatusDraft,
		input.ETA, input.ETD, input.BerthName, input.BerthTerminal, input.AgentID,
		createdBy, now, now,
	).Scan(
		&portCall.ID, &portCall.Reference, &portCall.VesselID, &portCall.PortID,
		&portCall.WorkspaceID, &portCall.Status, &portCall.ETA, &portCall.ETD,
		&portCall.ATA, &portCall.ATD, &portCall.BerthName, &portCall.BerthTerminal,
		&portCall.BerthConfirmed, &portCall.AgentID, &portCall.CreatedBy,
		&portCall.CreatedAt, &portCall.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create port call: %w", err)
	}

	return portCall, nil
}

// GetByID retrieves a port call by ID with relations
func (r *PortCallRepository) GetByID(ctx context.Context, id string) (*model.PortCall, error) {
	query := `
		SELECT pc.id, pc.reference, pc.vessel_id, pc.port_id, pc.workspace_id, pc.status,
			pc.eta, pc.etd, pc.ata, pc.atd, pc.berth_name, pc.berth_terminal,
			pc.berth_confirmed_at, pc.agent_id, pc.created_by, pc.created_at, pc.updated_at,
			v.id, v.name, v.imo, v.flag, v.type,
			p.id, p.name, p.unlocode, p.country
		FROM port_calls pc
		LEFT JOIN vessels v ON pc.vessel_id = v.id
		LEFT JOIN ports p ON pc.port_id = p.id
		WHERE pc.id = $1`

	portCall := &model.PortCall{
		Vessel: &model.Vessel{},
		Port:   &model.Port{},
	}

	err := GetDB(ctx, r.db).QueryRowContext(ctx, query, id).Scan(
		&portCall.ID, &portCall.Reference, &portCall.VesselID, &portCall.PortID,
		&portCall.WorkspaceID, &portCall.Status, &portCall.ETA, &portCall.ETD,
		&portCall.ATA, &portCall.ATD, &portCall.BerthName, &portCall.BerthTerminal,
		&portCall.BerthConfirmed, &portCall.AgentID, &portCall.CreatedBy,
		&portCall.CreatedAt, &portCall.UpdatedAt,
		&portCall.Vessel.ID, &portCall.Vessel.Name, &portCall.Vessel.IMO,
		&portCall.Vessel.Flag, &portCall.Vessel.Type,
		&portCall.Port.ID, &portCall.Port.Name, &portCall.Port.UNLOCODE,
		&portCall.Port.Country,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get port call: %w", err)
	}

	return portCall, nil
}

// List retrieves port calls with filters
func (r *PortCallRepository) List(ctx context.Context, filter model.PortCallFilter) ([]model.PortCall, int, error) {
	var conditions []string
	var args []interface{}
	argNum := 1

	if filter.WorkspaceID != nil {
		conditions = append(conditions, fmt.Sprintf("pc.workspace_id = $%d", argNum))
		args = append(args, *filter.WorkspaceID)
		argNum++
	}
	if filter.VesselID != nil {
		conditions = append(conditions, fmt.Sprintf("pc.vessel_id = $%d", argNum))
		args = append(args, *filter.VesselID)
		argNum++
	}
	if filter.PortID != nil {
		conditions = append(conditions, fmt.Sprintf("pc.port_id = $%d", argNum))
		args = append(args, *filter.PortID)
		argNum++
	}
	if filter.Status != nil {
		conditions = append(conditions, fmt.Sprintf("pc.status = $%d", argNum))
		args = append(args, *filter.Status)
		argNum++
	}
	if filter.ETAFrom != nil {
		conditions = append(conditions, fmt.Sprintf("pc.eta >= $%d", argNum))
		args = append(args, *filter.ETAFrom)
		argNum++
	}
	if filter.ETATo != nil {
		conditions = append(conditions, fmt.Sprintf("pc.eta <= $%d", argNum))
		args = append(args, *filter.ETATo)
		argNum++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// Count query
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM port_calls pc %s", whereClause)
	var total int
	if err := GetDB(ctx, r.db).QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count port calls: %w", err)
	}

	// Pagination
	if filter.PerPage <= 0 {
		filter.PerPage = 20
	}
	if filter.Page <= 0 {
		filter.Page = 1
	}
	offset := (filter.Page - 1) * filter.PerPage

	// List query
	query := fmt.Sprintf(`
		SELECT pc.id, pc.reference, pc.vessel_id, pc.port_id, pc.workspace_id, pc.status,
			pc.eta, pc.etd, pc.ata, pc.atd, pc.berth_name, pc.berth_terminal,
			pc.berth_confirmed_at, pc.agent_id, pc.created_by, pc.created_at, pc.updated_at,
			v.id, v.name, v.imo, v.flag, v.type,
			p.id, p.name, p.unlocode, p.country
		FROM port_calls pc
		LEFT JOIN vessels v ON pc.vessel_id = v.id
		LEFT JOIN ports p ON pc.port_id = p.id
		%s
		ORDER BY pc.eta ASC NULLS LAST, pc.created_at DESC
		LIMIT $%d OFFSET $%d`, whereClause, argNum, argNum+1)

	args = append(args, filter.PerPage, offset)

	rows, err := GetDB(ctx, r.db).QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list port calls: %w", err)
	}
	defer rows.Close()

	var portCalls []model.PortCall
	for rows.Next() {
		pc := model.PortCall{
			Vessel: &model.Vessel{},
			Port:   &model.Port{},
		}
		err := rows.Scan(
			&pc.ID, &pc.Reference, &pc.VesselID, &pc.PortID, &pc.WorkspaceID,
			&pc.Status, &pc.ETA, &pc.ETD, &pc.ATA, &pc.ATD, &pc.BerthName,
			&pc.BerthTerminal, &pc.BerthConfirmed, &pc.AgentID, &pc.CreatedBy,
			&pc.CreatedAt, &pc.UpdatedAt,
			&pc.Vessel.ID, &pc.Vessel.Name, &pc.Vessel.IMO, &pc.Vessel.Flag, &pc.Vessel.Type,
			&pc.Port.ID, &pc.Port.Name, &pc.Port.UNLOCODE, &pc.Port.Country,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan port call: %w", err)
		}
		portCalls = append(portCalls, pc)
	}

	return portCalls, total, nil
}

// Update updates a port call
func (r *PortCallRepository) Update(ctx context.Context, id string, input model.UpdatePortCallInput) (*model.PortCall, error) {
	var sets []string
	var args []interface{}
	argNum := 1

	if input.Status != nil {
		sets = append(sets, fmt.Sprintf("status = $%d", argNum))
		args = append(args, *input.Status)
		argNum++
	}
	if input.ETA != nil {
		sets = append(sets, fmt.Sprintf("eta = $%d", argNum))
		args = append(args, *input.ETA)
		argNum++
	}
	if input.ETD != nil {
		sets = append(sets, fmt.Sprintf("etd = $%d", argNum))
		args = append(args, *input.ETD)
		argNum++
	}
	if input.ATA != nil {
		sets = append(sets, fmt.Sprintf("ata = $%d", argNum))
		args = append(args, *input.ATA)
		argNum++
	}
	if input.ATD != nil {
		sets = append(sets, fmt.Sprintf("atd = $%d", argNum))
		args = append(args, *input.ATD)
		argNum++
	}
	if input.BerthName != nil {
		sets = append(sets, fmt.Sprintf("berth_name = $%d", argNum))
		args = append(args, *input.BerthName)
		argNum++
	}
	if input.BerthTerminal != nil {
		sets = append(sets, fmt.Sprintf("berth_terminal = $%d", argNum))
		args = append(args, *input.BerthTerminal)
		argNum++
	}
	if input.AgentID != nil {
		sets = append(sets, fmt.Sprintf("agent_id = $%d", argNum))
		args = append(args, *input.AgentID)
		argNum++
	}

	if len(sets) == 0 {
		return r.GetByID(ctx, id)
	}

	sets = append(sets, fmt.Sprintf("updated_at = $%d", argNum))
	args = append(args, time.Now())
	argNum++

	args = append(args, id)

	query := fmt.Sprintf(`UPDATE port_calls SET %s WHERE id = $%d`, strings.Join(sets, ", "), argNum)
	_, err := GetDB(ctx, r.db).ExecContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to update port call: %w", err)
	}

	return r.GetByID(ctx, id)
}

// Delete deletes a port call
func (r *PortCallRepository) Delete(ctx context.Context, id string) error {
	query := "DELETE FROM port_calls WHERE id = $1"
	result, err := GetDB(ctx, r.db).ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete port call: %w", err)
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("port call not found")
	}

	return nil
}

// GetServiceOrders retrieves service orders for a port call
func (r *PortCallRepository) GetServiceOrders(ctx context.Context, portCallID string) ([]model.ServiceOrder, error) {
	query := `
		SELECT so.id, so.port_call_id, so.service_type_id, so.status, so.description,
			so.quantity, so.unit, so.specifications, so.requested_date, so.confirmed_date,
			so.completed_date, so.vendor_id, so.quoted_price, so.final_price, so.currency,
			so.rfq_id, so.created_by, so.created_at, so.updated_at,
			st.id, st.name, st.category, st.description
		FROM service_orders so
		LEFT JOIN service_types st ON so.service_type_id = st.id
		WHERE so.port_call_id = $1
		ORDER BY so.created_at DESC`

	rows, err := GetDB(ctx, r.db).QueryContext(ctx, query, portCallID)
	if err != nil {
		return nil, fmt.Errorf("failed to get service orders: %w", err)
	}
	defer rows.Close()

	var orders []model.ServiceOrder
	for rows.Next() {
		so := model.ServiceOrder{
			ServiceType: &model.ServiceType{},
		}
		var specs []byte
		err := rows.Scan(
			&so.ID, &so.PortCallID, &so.ServiceTypeID, &so.Status, &so.Description,
			&so.Quantity, &so.Unit, &specs, &so.RequestedDate, &so.ConfirmedDate,
			&so.CompletedDate, &so.VendorID, &so.QuotedPrice, &so.FinalPrice, &so.Currency,
			&so.RFQID, &so.CreatedBy, &so.CreatedAt, &so.UpdatedAt,
			&so.ServiceType.ID, &so.ServiceType.Name, &so.ServiceType.Category,
			&so.ServiceType.Description,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan service order: %w", err)
		}
		if specs != nil {
			json.Unmarshal(specs, &so.Specifications)
		}
		orders = append(orders, so)
	}

	return orders, nil
}

// generateCUID generates a unique identifier (simplified)
func generateCUID() string {
	return fmt.Sprintf("c%d", time.Now().UnixNano())
}
