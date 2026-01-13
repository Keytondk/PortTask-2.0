package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/lib/pq"
	"github.com/navo/services/core/internal/model"
)

// RFQRepository handles RFQ database operations
type RFQRepository struct {
	db *sql.DB
}

// NewRFQRepository creates a new RFQ repository
func NewRFQRepository(db *sql.DB) *RFQRepository {
	return &RFQRepository{db: db}
}

// Create creates a new RFQ
func (r *RFQRepository) Create(ctx context.Context, input model.CreateRFQInput, createdBy string) (*model.RFQ, error) {
	id := generateCUID()
	reference := generateReference("RFQ")
	now := time.Now()

	specs, _ := json.Marshal(input.Specifications)
	if input.Specifications == nil {
		specs = []byte("{}")
	}

	query := `
		INSERT INTO rfqs (id, reference, service_type_id, port_call_id, status,
			description, quantity, unit, specifications, delivery_date, deadline,
			invited_vendors, created_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
		RETURNING id`

	err := r.db.QueryRowContext(ctx, query,
		id, reference, input.ServiceTypeID, input.PortCallID, model.RFQStatusDraft,
		input.Description, input.Quantity, input.Unit, specs, input.DeliveryDate,
		input.Deadline, pq.Array(input.InvitedVendors), createdBy, now, now,
	).Scan(&id)

	if err != nil {
		return nil, fmt.Errorf("failed to create RFQ: %w", err)
	}

	return r.GetByID(ctx, id)
}

// GetByID retrieves an RFQ by ID
func (r *RFQRepository) GetByID(ctx context.Context, id string) (*model.RFQ, error) {
	query := `
		SELECT r.id, r.reference, r.service_type_id, r.port_call_id, r.status,
			r.description, r.quantity, r.unit, r.specifications, r.delivery_date,
			r.deadline, r.invited_vendors, r.awarded_quote_id, r.awarded_at,
			r.created_by, r.created_at, r.updated_at,
			st.id, st.name, st.category, st.description,
			(SELECT COUNT(*) FROM quotes WHERE rfq_id = r.id) as quote_count
		FROM rfqs r
		LEFT JOIN service_types st ON r.service_type_id = st.id
		WHERE r.id = $1`

	rfq := &model.RFQ{
		ServiceType: &model.ServiceType{},
	}
	var specs []byte
	var invitedVendors pq.StringArray

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&rfq.ID, &rfq.Reference, &rfq.ServiceTypeID, &rfq.PortCallID, &rfq.Status,
		&rfq.Description, &rfq.Quantity, &rfq.Unit, &specs, &rfq.DeliveryDate,
		&rfq.Deadline, &invitedVendors, &rfq.AwardedQuoteID, &rfq.AwardedAt,
		&rfq.CreatedBy, &rfq.CreatedAt, &rfq.UpdatedAt,
		&rfq.ServiceType.ID, &rfq.ServiceType.Name, &rfq.ServiceType.Category,
		&rfq.ServiceType.Description, &rfq.QuoteCount,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get RFQ: %w", err)
	}

	if specs != nil {
		json.Unmarshal(specs, &rfq.Specifications)
	}
	rfq.InvitedVendors = []string(invitedVendors)

	return rfq, nil
}

// GetByReference retrieves an RFQ by reference
func (r *RFQRepository) GetByReference(ctx context.Context, reference string) (*model.RFQ, error) {
	query := `SELECT id FROM rfqs WHERE reference = $1`
	var id string
	err := r.db.QueryRowContext(ctx, query, reference).Scan(&id)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get RFQ by reference: %w", err)
	}
	return r.GetByID(ctx, id)
}

// List retrieves RFQs with filters
func (r *RFQRepository) List(ctx context.Context, filter model.RFQFilter) ([]model.RFQ, int, error) {
	var conditions []string
	var args []interface{}
	argNum := 1

	if filter.PortCallID != nil {
		conditions = append(conditions, fmt.Sprintf("r.port_call_id = $%d", argNum))
		args = append(args, *filter.PortCallID)
		argNum++
	}
	if filter.ServiceTypeID != nil {
		conditions = append(conditions, fmt.Sprintf("r.service_type_id = $%d", argNum))
		args = append(args, *filter.ServiceTypeID)
		argNum++
	}
	if filter.Status != nil {
		conditions = append(conditions, fmt.Sprintf("r.status = $%d", argNum))
		args = append(args, *filter.Status)
		argNum++
	}
	if filter.VendorID != nil {
		conditions = append(conditions, fmt.Sprintf("$%d = ANY(r.invited_vendors)", argNum))
		args = append(args, *filter.VendorID)
		argNum++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// Count query
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM rfqs r %s", whereClause)
	var total int
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count RFQs: %w", err)
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
		SELECT r.id, r.reference, r.service_type_id, r.port_call_id, r.status,
			r.description, r.quantity, r.unit, r.specifications, r.delivery_date,
			r.deadline, r.invited_vendors, r.awarded_quote_id, r.awarded_at,
			r.created_by, r.created_at, r.updated_at,
			st.id, st.name, st.category, st.description,
			(SELECT COUNT(*) FROM quotes WHERE rfq_id = r.id) as quote_count
		FROM rfqs r
		LEFT JOIN service_types st ON r.service_type_id = st.id
		%s
		ORDER BY r.deadline ASC, r.created_at DESC
		LIMIT $%d OFFSET $%d`, whereClause, argNum, argNum+1)

	args = append(args, filter.PerPage, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list RFQs: %w", err)
	}
	defer rows.Close()

	var rfqs []model.RFQ
	for rows.Next() {
		rfq := model.RFQ{
			ServiceType: &model.ServiceType{},
		}
		var specs []byte
		var invitedVendors pq.StringArray

		err := rows.Scan(
			&rfq.ID, &rfq.Reference, &rfq.ServiceTypeID, &rfq.PortCallID, &rfq.Status,
			&rfq.Description, &rfq.Quantity, &rfq.Unit, &specs, &rfq.DeliveryDate,
			&rfq.Deadline, &invitedVendors, &rfq.AwardedQuoteID, &rfq.AwardedAt,
			&rfq.CreatedBy, &rfq.CreatedAt, &rfq.UpdatedAt,
			&rfq.ServiceType.ID, &rfq.ServiceType.Name, &rfq.ServiceType.Category,
			&rfq.ServiceType.Description, &rfq.QuoteCount,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan RFQ: %w", err)
		}
		if specs != nil {
			json.Unmarshal(specs, &rfq.Specifications)
		}
		rfq.InvitedVendors = []string(invitedVendors)
		rfqs = append(rfqs, rfq)
	}

	return rfqs, total, nil
}

// Update updates an RFQ
func (r *RFQRepository) Update(ctx context.Context, id string, input model.UpdateRFQInput) (*model.RFQ, error) {
	var sets []string
	var args []interface{}
	argNum := 1

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
	if input.DeliveryDate != nil {
		sets = append(sets, fmt.Sprintf("delivery_date = $%d", argNum))
		args = append(args, *input.DeliveryDate)
		argNum++
	}
	if input.Deadline != nil {
		sets = append(sets, fmt.Sprintf("deadline = $%d", argNum))
		args = append(args, *input.Deadline)
		argNum++
	}
	if input.InvitedVendors != nil {
		sets = append(sets, fmt.Sprintf("invited_vendors = $%d", argNum))
		args = append(args, pq.Array(input.InvitedVendors))
		argNum++
	}

	if len(sets) == 0 {
		return r.GetByID(ctx, id)
	}

	sets = append(sets, fmt.Sprintf("updated_at = $%d", argNum))
	args = append(args, time.Now())
	argNum++

	args = append(args, id)

	query := fmt.Sprintf(`UPDATE rfqs SET %s WHERE id = $%d`, strings.Join(sets, ", "), argNum)
	_, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to update RFQ: %w", err)
	}

	return r.GetByID(ctx, id)
}

// UpdateStatus updates the RFQ status
func (r *RFQRepository) UpdateStatus(ctx context.Context, id string, status model.RFQStatus) error {
	query := `UPDATE rfqs SET status = $1, updated_at = $2 WHERE id = $3`
	_, err := r.db.ExecContext(ctx, query, status, time.Now(), id)
	if err != nil {
		return fmt.Errorf("failed to update RFQ status: %w", err)
	}
	return nil
}

// Award awards the RFQ to a quote
func (r *RFQRepository) Award(ctx context.Context, rfqID, quoteID string) error {
	now := time.Now()
	query := `UPDATE rfqs SET status = $1, awarded_quote_id = $2, awarded_at = $3, updated_at = $4 WHERE id = $5`
	_, err := r.db.ExecContext(ctx, query, model.RFQStatusAwarded, quoteID, now, now, rfqID)
	if err != nil {
		return fmt.Errorf("failed to award RFQ: %w", err)
	}
	return nil
}

// Delete deletes an RFQ
func (r *RFQRepository) Delete(ctx context.Context, id string) error {
	query := "DELETE FROM rfqs WHERE id = $1"
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete RFQ: %w", err)
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("RFQ not found")
	}

	return nil
}

// SubmitQuote submits a quote for an RFQ
func (r *RFQRepository) SubmitQuote(ctx context.Context, rfqID, vendorID string, input model.SubmitQuoteInput) (*model.Quote, error) {
	id := generateCUID()
	now := time.Now()

	attachments, _ := json.Marshal(input.Attachments)
	if input.Attachments == nil {
		attachments = []byte("[]")
	}

	query := `
		INSERT INTO quotes (id, rfq_id, vendor_id, status, unit_price, total_price,
			currency, payment_terms, delivery_date, valid_until, notes, attachments, submitted_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id`

	err := r.db.QueryRowContext(ctx, query,
		id, rfqID, vendorID, model.QuoteStatusSubmitted, input.UnitPrice, input.TotalPrice,
		input.Currency, input.PaymentTerms, input.DeliveryDate, input.ValidUntil,
		input.Notes, attachments, now,
	).Scan(&id)

	if err != nil {
		return nil, fmt.Errorf("failed to submit quote: %w", err)
	}

	return r.GetQuote(ctx, id)
}

// GetQuote retrieves a quote by ID
func (r *RFQRepository) GetQuote(ctx context.Context, id string) (*model.Quote, error) {
	query := `
		SELECT q.id, q.rfq_id, q.vendor_id, q.status, q.unit_price, q.total_price,
			q.currency, q.payment_terms, q.delivery_date, q.valid_until, q.notes,
			q.attachments, q.submitted_at,
			v.id, v.name
		FROM quotes q
		LEFT JOIN vendors v ON q.vendor_id = v.id
		WHERE q.id = $1`

	quote := &model.Quote{
		Vendor: &model.Vendor{},
	}
	var attachments []byte

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&quote.ID, &quote.RFQID, &quote.VendorID, &quote.Status, &quote.UnitPrice,
		&quote.TotalPrice, &quote.Currency, &quote.PaymentTerms, &quote.DeliveryDate,
		&quote.ValidUntil, &quote.Notes, &attachments, &quote.SubmittedAt,
		&quote.Vendor.ID, &quote.Vendor.Name,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get quote: %w", err)
	}

	if attachments != nil {
		json.Unmarshal(attachments, &quote.Attachments)
	}

	return quote, nil
}

// GetQuotesByRFQ retrieves all quotes for an RFQ
func (r *RFQRepository) GetQuotesByRFQ(ctx context.Context, rfqID string) ([]model.Quote, error) {
	query := `
		SELECT q.id, q.rfq_id, q.vendor_id, q.status, q.unit_price, q.total_price,
			q.currency, q.payment_terms, q.delivery_date, q.valid_until, q.notes,
			q.attachments, q.submitted_at,
			v.id, v.name
		FROM quotes q
		LEFT JOIN vendors v ON q.vendor_id = v.id
		WHERE q.rfq_id = $1
		ORDER BY q.total_price ASC`

	rows, err := r.db.QueryContext(ctx, query, rfqID)
	if err != nil {
		return nil, fmt.Errorf("failed to get quotes: %w", err)
	}
	defer rows.Close()

	var quotes []model.Quote
	for rows.Next() {
		quote := model.Quote{
			Vendor: &model.Vendor{},
		}
		var attachments []byte

		err := rows.Scan(
			&quote.ID, &quote.RFQID, &quote.VendorID, &quote.Status, &quote.UnitPrice,
			&quote.TotalPrice, &quote.Currency, &quote.PaymentTerms, &quote.DeliveryDate,
			&quote.ValidUntil, &quote.Notes, &attachments, &quote.SubmittedAt,
			&quote.Vendor.ID, &quote.Vendor.Name,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan quote: %w", err)
		}
		if attachments != nil {
			json.Unmarshal(attachments, &quote.Attachments)
		}
		quotes = append(quotes, quote)
	}

	return quotes, nil
}

// UpdateQuoteStatus updates a quote's status
func (r *RFQRepository) UpdateQuoteStatus(ctx context.Context, id string, status model.QuoteStatus) error {
	query := `UPDATE quotes SET status = $1 WHERE id = $2`
	_, err := r.db.ExecContext(ctx, query, status, id)
	if err != nil {
		return fmt.Errorf("failed to update quote status: %w", err)
	}
	return nil
}

// GetQuoteByVendor retrieves a quote by RFQ and vendor
func (r *RFQRepository) GetQuoteByVendor(ctx context.Context, rfqID, vendorID string) (*model.Quote, error) {
	query := `SELECT id FROM quotes WHERE rfq_id = $1 AND vendor_id = $2`
	var id string
	err := r.db.QueryRowContext(ctx, query, rfqID, vendorID).Scan(&id)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get quote by vendor: %w", err)
	}
	return r.GetQuote(ctx, id)
}

// generateReference generates a unique reference for an RFQ
func generateReference(prefix string) string {
	now := time.Now()
	return fmt.Sprintf("%s-%s-%04d", prefix, now.Format("20060102"), now.UnixNano()%10000)
}
