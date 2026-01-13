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

// ServiceOrderRepository handles service order database operations
type ServiceOrderRepository struct {
	db *sql.DB
}

// NewServiceOrderRepository creates a new service order repository
func NewServiceOrderRepository(db *sql.DB) *ServiceOrderRepository {
	return &ServiceOrderRepository{db: db}
}

// Create creates a new service order
func (r *ServiceOrderRepository) Create(ctx context.Context, input model.CreateServiceOrderInput, createdBy string) (*model.ServiceOrder, error) {
	id := generateCUID()
	now := time.Now()

	specs, _ := json.Marshal(input.Specifications)
	if input.Specifications == nil {
		specs = []byte("{}")
	}

	query := `
		INSERT INTO service_orders (id, port_call_id, service_type_id, status, description,
			quantity, unit, specifications, requested_date, currency, created_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id, port_call_id, service_type_id, status, description, quantity, unit,
			specifications, requested_date, confirmed_date, completed_date, vendor_id,
			quoted_price, final_price, currency, rfq_id, created_by, created_at, updated_at`

	order := &model.ServiceOrder{}
	var specsBytes []byte
	err := GetDB(ctx, r.db).QueryRowContext(ctx, query,
		id, input.PortCallID, input.ServiceTypeID, model.ServiceOrderStatusDraft,
		input.Description, input.Quantity, input.Unit, specs, input.RequestedDate,
		"USD", createdBy, now, now,
	).Scan(
		&order.ID, &order.PortCallID, &order.ServiceTypeID, &order.Status,
		&order.Description, &order.Quantity, &order.Unit, &specsBytes,
		&order.RequestedDate, &order.ConfirmedDate, &order.CompletedDate,
		&order.VendorID, &order.QuotedPrice, &order.FinalPrice, &order.Currency,
		&order.RFQID, &order.CreatedBy, &order.CreatedAt, &order.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create service order: %w", err)
	}

	if specsBytes != nil {
		json.Unmarshal(specsBytes, &order.Specifications)
	}

	return order, nil
}

// GetByID retrieves a service order by ID
func (r *ServiceOrderRepository) GetByID(ctx context.Context, id string) (*model.ServiceOrder, error) {
	query := `
		SELECT so.id, so.port_call_id, so.service_type_id, so.status, so.description,
			so.quantity, so.unit, so.specifications, so.requested_date, so.confirmed_date,
			so.completed_date, so.vendor_id, so.quoted_price, so.final_price, so.currency,
			so.rfq_id, so.created_by, so.created_at, so.updated_at,
			st.id, st.name, st.category, st.description
		FROM service_orders so
		LEFT JOIN service_types st ON so.service_type_id = st.id
		WHERE so.id = $1`

	order := &model.ServiceOrder{
		ServiceType: &model.ServiceType{},
	}
	var specs []byte

	err := GetDB(ctx, r.db).QueryRowContext(ctx, query, id).Scan(
		&order.ID, &order.PortCallID, &order.ServiceTypeID, &order.Status,
		&order.Description, &order.Quantity, &order.Unit, &specs,
		&order.RequestedDate, &order.ConfirmedDate, &order.CompletedDate,
		&order.VendorID, &order.QuotedPrice, &order.FinalPrice, &order.Currency,
		&order.RFQID, &order.CreatedBy, &order.CreatedAt, &order.UpdatedAt,
		&order.ServiceType.ID, &order.ServiceType.Name, &order.ServiceType.Category,
		&order.ServiceType.Description,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get service order: %w", err)
	}

	if specs != nil {
		json.Unmarshal(specs, &order.Specifications)
	}

	return order, nil
}

// List retrieves service orders with filters
func (r *ServiceOrderRepository) List(ctx context.Context, filter model.ServiceOrderFilter) ([]model.ServiceOrder, int, error) {
	var conditions []string
	var args []interface{}
	argNum := 1

	if filter.PortCallID != nil {
		conditions = append(conditions, fmt.Sprintf("so.port_call_id = $%d", argNum))
		args = append(args, *filter.PortCallID)
		argNum++
	}
	if filter.VendorID != nil {
		conditions = append(conditions, fmt.Sprintf("so.vendor_id = $%d", argNum))
		args = append(args, *filter.VendorID)
		argNum++
	}
	if filter.ServiceTypeID != nil {
		conditions = append(conditions, fmt.Sprintf("so.service_type_id = $%d", argNum))
		args = append(args, *filter.ServiceTypeID)
		argNum++
	}
	if filter.Status != nil {
		conditions = append(conditions, fmt.Sprintf("so.status = $%d", argNum))
		args = append(args, *filter.Status)
		argNum++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// Count query
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM service_orders so %s", whereClause)
	var total int
	if err := GetDB(ctx, r.db).QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count service orders: %w", err)
	}

	// Pagination
	if filter.PerPage <= 0 {
		filter.PerPage = 20
	}
	if filter.Page <= 0 {
		filter.Page = 1
	}
	offset := (filter.Page - 1) * filter.PerPage

	query := fmt.Sprintf(`
		SELECT so.id, so.port_call_id, so.service_type_id, so.status, so.description,
			so.quantity, so.unit, so.specifications, so.requested_date, so.confirmed_date,
			so.completed_date, so.vendor_id, so.quoted_price, so.final_price, so.currency,
			so.rfq_id, so.created_by, so.created_at, so.updated_at,
			st.id, st.name, st.category, st.description
		FROM service_orders so
		LEFT JOIN service_types st ON so.service_type_id = st.id
		%s
		ORDER BY so.created_at DESC
		LIMIT $%d OFFSET $%d`, whereClause, argNum, argNum+1)

	args = append(args, filter.PerPage, offset)

	rows, err := GetDB(ctx, r.db).QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list service orders: %w", err)
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
			return nil, 0, fmt.Errorf("failed to scan service order: %w", err)
		}
		if specs != nil {
			json.Unmarshal(specs, &so.Specifications)
		}
		orders = append(orders, so)
	}

	return orders, total, nil
}

// Update updates a service order
func (r *ServiceOrderRepository) Update(ctx context.Context, id string, input model.UpdateServiceOrderInput) (*model.ServiceOrder, error) {
	var sets []string
	var args []interface{}
	argNum := 1

	if input.Status != nil {
		sets = append(sets, fmt.Sprintf("status = $%d", argNum))
		args = append(args, *input.Status)
		argNum++
	}
	if input.Description != nil {
		sets = append(sets, fmt.Sprintf("description = $%d", argNum))
		args = append(args, *input.Description)
		argNum++
	}
	if input.Quantity != nil {
		sets = append(sets, fmt.Sprintf("quantity = $%d", argNum))
		args = append(args, *input.Quantity)
		argNum++
	}
	if input.Unit != nil {
		sets = append(sets, fmt.Sprintf("unit = $%d", argNum))
		args = append(args, *input.Unit)
		argNum++
	}
	if input.Specifications != nil {
		specs, _ := json.Marshal(input.Specifications)
		sets = append(sets, fmt.Sprintf("specifications = $%d", argNum))
		args = append(args, specs)
		argNum++
	}
	if input.RequestedDate != nil {
		sets = append(sets, fmt.Sprintf("requested_date = $%d", argNum))
		args = append(args, *input.RequestedDate)
		argNum++
	}
	if input.VendorID != nil {
		sets = append(sets, fmt.Sprintf("vendor_id = $%d", argNum))
		args = append(args, *input.VendorID)
		argNum++
	}
	if input.QuotedPrice != nil {
		sets = append(sets, fmt.Sprintf("quoted_price = $%d", argNum))
		args = append(args, *input.QuotedPrice)
		argNum++
	}
	if input.FinalPrice != nil {
		sets = append(sets, fmt.Sprintf("final_price = $%d", argNum))
		args = append(args, *input.FinalPrice)
		argNum++
	}
	if input.Currency != nil {
		sets = append(sets, fmt.Sprintf("currency = $%d", argNum))
		args = append(args, *input.Currency)
		argNum++
	}

	if len(sets) == 0 {
		return r.GetByID(ctx, id)
	}

	sets = append(sets, fmt.Sprintf("updated_at = $%d", argNum))
	args = append(args, time.Now())
	argNum++

	args = append(args, id)

	query := fmt.Sprintf(`UPDATE service_orders SET %s WHERE id = $%d`, strings.Join(sets, ", "), argNum)
	_, err := GetDB(ctx, r.db).ExecContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to update service order: %w", err)
	}

	return r.GetByID(ctx, id)
}

// Delete deletes a service order
func (r *ServiceOrderRepository) Delete(ctx context.Context, id string) error {
	query := "DELETE FROM service_orders WHERE id = $1"
	result, err := GetDB(ctx, r.db).ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete service order: %w", err)
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("service order not found")
	}

	return nil
}

// Confirm confirms a service order
func (r *ServiceOrderRepository) Confirm(ctx context.Context, id string, vendorID string, quotedPrice float64) (*model.ServiceOrder, error) {
	now := time.Now()
	query := `
		UPDATE service_orders
		SET status = $1, vendor_id = $2, quoted_price = $3, confirmed_date = $4, updated_at = $5
		WHERE id = $6`

	_, err := GetDB(ctx, r.db).ExecContext(ctx, query, model.ServiceOrderStatusConfirmed, vendorID, quotedPrice, now, now, id)
	if err != nil {
		return nil, fmt.Errorf("failed to confirm service order: %w", err)
	}

	return r.GetByID(ctx, id)
}

// Complete completes a service order
func (r *ServiceOrderRepository) Complete(ctx context.Context, id string, finalPrice *float64) (*model.ServiceOrder, error) {
	now := time.Now()

	var query string
	var args []interface{}

	if finalPrice != nil {
		query = `UPDATE service_orders SET status = $1, final_price = $2, completed_date = $3, updated_at = $4 WHERE id = $5`
		args = []interface{}{model.ServiceOrderStatusCompleted, *finalPrice, now, now, id}
	} else {
		query = `UPDATE service_orders SET status = $1, final_price = quoted_price, completed_date = $2, updated_at = $3 WHERE id = $4`
		args = []interface{}{model.ServiceOrderStatusCompleted, now, now, id}
	}

	_, err := GetDB(ctx, r.db).ExecContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to complete service order: %w", err)
	}

	return r.GetByID(ctx, id)
}
