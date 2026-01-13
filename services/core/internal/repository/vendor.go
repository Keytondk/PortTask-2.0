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

// VendorRepository handles vendor database operations
type VendorRepository struct {
	db *sql.DB
}

// NewVendorRepository creates a new vendor repository
func NewVendorRepository(db *sql.DB) *VendorRepository {
	return &VendorRepository{db: db}
}

// Create creates a new vendor
func (r *VendorRepository) Create(ctx context.Context, vendor *model.Vendor) error {
	addressJSON, _ := json.Marshal(vendor.Address)
	contactsJSON, _ := json.Marshal(vendor.Contacts)
	bankDetailsJSON, _ := json.Marshal(vendor.BankDetails)
	certificationsJSON, _ := json.Marshal(vendor.Certifications)

	query := `
		INSERT INTO vendors (
			id, name, organization_id, registration_number,
			address, contacts, bank_details, certifications,
			service_types, ports, rating, total_orders,
			on_time_delivery, response_time, status,
			is_verified, verified_at, is_certified, certified_at,
			created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
			$11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
		)
	`

	_, err := r.db.ExecContext(ctx, query,
		vendor.ID, vendor.Name, vendor.OrganizationID, vendor.RegistrationNumber,
		addressJSON, contactsJSON, bankDetailsJSON, certificationsJSON,
		vendor.ServiceTypes, vendor.Ports, vendor.Rating, vendor.TotalOrders,
		vendor.OnTimeDelivery, vendor.ResponseTime, vendor.Status,
		vendor.IsVerified, vendor.VerifiedAt, vendor.IsCertified, vendor.CertifiedAt,
		vendor.CreatedAt, vendor.UpdatedAt,
	)
	return err
}

// GetByID retrieves a vendor by ID
func (r *VendorRepository) GetByID(ctx context.Context, id string) (*model.Vendor, error) {
	query := `
		SELECT id, name, organization_id, registration_number,
			address, contacts, bank_details, certifications,
			service_types, ports, rating, total_orders,
			on_time_delivery, response_time, status,
			is_verified, verified_at, is_certified, certified_at,
			created_at, updated_at
		FROM vendors WHERE id = $1
	`

	var vendor model.Vendor
	var addressJSON, contactsJSON, bankDetailsJSON, certificationsJSON []byte

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&vendor.ID, &vendor.Name, &vendor.OrganizationID, &vendor.RegistrationNumber,
		&addressJSON, &contactsJSON, &bankDetailsJSON, &certificationsJSON,
		&vendor.ServiceTypes, &vendor.Ports, &vendor.Rating, &vendor.TotalOrders,
		&vendor.OnTimeDelivery, &vendor.ResponseTime, &vendor.Status,
		&vendor.IsVerified, &vendor.VerifiedAt, &vendor.IsCertified, &vendor.CertifiedAt,
		&vendor.CreatedAt, &vendor.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	json.Unmarshal(addressJSON, &vendor.Address)
	json.Unmarshal(contactsJSON, &vendor.Contacts)
	json.Unmarshal(bankDetailsJSON, &vendor.BankDetails)
	json.Unmarshal(certificationsJSON, &vendor.Certifications)

	return &vendor, nil
}

// GetByEmail finds a vendor by primary contact email
func (r *VendorRepository) GetByEmail(ctx context.Context, email string) (*model.Vendor, error) {
	// Search in contacts JSON array for the email
	query := `
		SELECT id, name, organization_id, registration_number,
			address, contacts, bank_details, certifications,
			service_types, ports, rating, total_orders,
			on_time_delivery, response_time, status,
			is_verified, verified_at, is_certified, certified_at,
			created_at, updated_at
		FROM vendors
		WHERE contacts @> $1::jsonb
	`

	emailJSON := fmt.Sprintf(`[{"email": "%s"}]`, email)

	var vendor model.Vendor
	var addressJSON, contactsJSON, bankDetailsJSON, certificationsJSON []byte

	err := r.db.QueryRowContext(ctx, query, emailJSON).Scan(
		&vendor.ID, &vendor.Name, &vendor.OrganizationID, &vendor.RegistrationNumber,
		&addressJSON, &contactsJSON, &bankDetailsJSON, &certificationsJSON,
		&vendor.ServiceTypes, &vendor.Ports, &vendor.Rating, &vendor.TotalOrders,
		&vendor.OnTimeDelivery, &vendor.ResponseTime, &vendor.Status,
		&vendor.IsVerified, &vendor.VerifiedAt, &vendor.IsCertified, &vendor.CertifiedAt,
		&vendor.CreatedAt, &vendor.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	json.Unmarshal(addressJSON, &vendor.Address)
	json.Unmarshal(contactsJSON, &vendor.Contacts)
	json.Unmarshal(bankDetailsJSON, &vendor.BankDetails)
	json.Unmarshal(certificationsJSON, &vendor.Certifications)

	return &vendor, nil
}

// Update updates a vendor
func (r *VendorRepository) Update(ctx context.Context, vendor *model.Vendor) error {
	addressJSON, _ := json.Marshal(vendor.Address)
	contactsJSON, _ := json.Marshal(vendor.Contacts)
	bankDetailsJSON, _ := json.Marshal(vendor.BankDetails)
	certificationsJSON, _ := json.Marshal(vendor.Certifications)

	query := `
		UPDATE vendors SET
			name = $1, registration_number = $2, address = $3,
			contacts = $4, bank_details = $5, certifications = $6,
			service_types = $7, ports = $8, status = $9,
			is_verified = $10, verified_at = $11, is_certified = $12, certified_at = $13,
			updated_at = $14
		WHERE id = $15
	`

	_, err := r.db.ExecContext(ctx, query,
		vendor.Name, vendor.RegistrationNumber, addressJSON,
		contactsJSON, bankDetailsJSON, certificationsJSON,
		vendor.ServiceTypes, vendor.Ports, vendor.Status,
		vendor.IsVerified, vendor.VerifiedAt, vendor.IsCertified, vendor.CertifiedAt,
		time.Now(), vendor.ID,
	)
	return err
}

// List lists vendors with filters
func (r *VendorRepository) List(ctx context.Context, filter model.VendorFilter) (*model.VendorListResult, error) {
	var conditions []string
	var args []interface{}
	argIndex := 1

	baseQuery := `
		SELECT v.id, v.name, v.organization_id, v.registration_number,
			v.address, v.contacts, v.bank_details, v.certifications,
			v.service_types, v.ports, v.rating, v.total_orders,
			v.on_time_delivery, v.response_time, v.status,
			v.is_verified, v.verified_at, v.is_certified, v.certified_at,
			v.created_at, v.updated_at
		FROM vendors v
	`

	// If filtering by operator, join with operator_vendor_lists
	if filter.OperatorOrgID != nil {
		baseQuery = `
			SELECT v.id, v.name, v.organization_id, v.registration_number,
				v.address, v.contacts, v.bank_details, v.certifications,
				v.service_types, v.ports, v.rating, v.total_orders,
				v.on_time_delivery, v.response_time, v.status,
				v.is_verified, v.verified_at, v.is_certified, v.certified_at,
				v.created_at, v.updated_at
			FROM vendors v
			INNER JOIN operator_vendor_lists ovl ON v.id = ovl.vendor_id
		`
		conditions = append(conditions, fmt.Sprintf("ovl.operator_org_id = $%d", argIndex))
		args = append(args, *filter.OperatorOrgID)
		argIndex++
		conditions = append(conditions, "ovl.status = 'active'")
	}

	if filter.Status != nil {
		conditions = append(conditions, fmt.Sprintf("v.status = $%d", argIndex))
		args = append(args, *filter.Status)
		argIndex++
	}

	if filter.IsVerified != nil {
		conditions = append(conditions, fmt.Sprintf("v.is_verified = $%d", argIndex))
		args = append(args, *filter.IsVerified)
		argIndex++
	}

	if filter.IsCertified != nil {
		conditions = append(conditions, fmt.Sprintf("v.is_certified = $%d", argIndex))
		args = append(args, *filter.IsCertified)
		argIndex++
	}

	if filter.Search != nil && *filter.Search != "" {
		conditions = append(conditions, fmt.Sprintf("v.name ILIKE $%d", argIndex))
		args = append(args, "%"+*filter.Search+"%")
		argIndex++
	}

	// Build WHERE clause
	whereClause := ""
	if len(conditions) > 0 {
		whereClause = " WHERE " + strings.Join(conditions, " AND ")
	}

	// Count total
	countQuery := "SELECT COUNT(*) FROM vendors v"
	if filter.OperatorOrgID != nil {
		countQuery = "SELECT COUNT(*) FROM vendors v INNER JOIN operator_vendor_lists ovl ON v.id = ovl.vendor_id"
	}
	countQuery += whereClause

	var total int
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, err
	}

	// Get page
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PerPage < 1 || filter.PerPage > 100 {
		filter.PerPage = 20
	}

	offset := (filter.Page - 1) * filter.PerPage
	query := baseQuery + whereClause + fmt.Sprintf(" ORDER BY v.name ASC LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
	args = append(args, filter.PerPage, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var vendors []model.Vendor
	for rows.Next() {
		var vendor model.Vendor
		var addressJSON, contactsJSON, bankDetailsJSON, certificationsJSON []byte

		err := rows.Scan(
			&vendor.ID, &vendor.Name, &vendor.OrganizationID, &vendor.RegistrationNumber,
			&addressJSON, &contactsJSON, &bankDetailsJSON, &certificationsJSON,
			&vendor.ServiceTypes, &vendor.Ports, &vendor.Rating, &vendor.TotalOrders,
			&vendor.OnTimeDelivery, &vendor.ResponseTime, &vendor.Status,
			&vendor.IsVerified, &vendor.VerifiedAt, &vendor.IsCertified, &vendor.CertifiedAt,
			&vendor.CreatedAt, &vendor.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		json.Unmarshal(addressJSON, &vendor.Address)
		json.Unmarshal(contactsJSON, &vendor.Contacts)
		json.Unmarshal(bankDetailsJSON, &vendor.BankDetails)
		json.Unmarshal(certificationsJSON, &vendor.Certifications)

		vendors = append(vendors, vendor)
	}

	return &model.VendorListResult{
		Vendors: vendors,
		Total:   total,
		Page:    filter.Page,
		PerPage: filter.PerPage,
	}, nil
}

// SetVerified sets the verified status of a vendor
func (r *VendorRepository) SetVerified(ctx context.Context, vendorID string, verified bool) error {
	var verifiedAt *time.Time
	if verified {
		now := time.Now()
		verifiedAt = &now
	}

	query := `UPDATE vendors SET is_verified = $1, verified_at = $2, updated_at = $3 WHERE id = $4`
	_, err := r.db.ExecContext(ctx, query, verified, verifiedAt, time.Now(), vendorID)
	return err
}

// SetCertified sets the certified status of a vendor
func (r *VendorRepository) SetCertified(ctx context.Context, vendorID string, certified bool) error {
	var certifiedAt *time.Time
	if certified {
		now := time.Now()
		certifiedAt = &now
	}

	query := `UPDATE vendors SET is_certified = $1, certified_at = $2, updated_at = $3 WHERE id = $4`
	_, err := r.db.ExecContext(ctx, query, certified, certifiedAt, time.Now(), vendorID)
	return err
}

// CreateInvitation creates a vendor invitation
func (r *VendorRepository) CreateInvitation(ctx context.Context, inv *model.VendorInvitation) error {
	query := `
		INSERT INTO vendor_invitations (
			id, operator_org_id, invited_email, existing_vendor_id,
			status, token, invited_by, message, expires_at,
			accepted_at, service_types, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
		)
	`

	_, err := r.db.ExecContext(ctx, query,
		inv.ID, inv.OperatorOrgID, inv.InvitedEmail, inv.ExistingVendorID,
		inv.Status, inv.Token, inv.InvitedBy, inv.Message, inv.ExpiresAt,
		inv.AcceptedAt, inv.ServiceTypes, inv.CreatedAt, inv.UpdatedAt,
	)
	return err
}

// GetInvitationByToken retrieves an invitation by token
func (r *VendorRepository) GetInvitationByToken(ctx context.Context, token string) (*model.VendorInvitation, error) {
	query := `
		SELECT id, operator_org_id, invited_email, existing_vendor_id,
			status, token, invited_by, message, expires_at,
			accepted_at, service_types, created_at, updated_at
		FROM vendor_invitations
		WHERE token = $1
	`

	var inv model.VendorInvitation
	err := r.db.QueryRowContext(ctx, query, token).Scan(
		&inv.ID, &inv.OperatorOrgID, &inv.InvitedEmail, &inv.ExistingVendorID,
		&inv.Status, &inv.Token, &inv.InvitedBy, &inv.Message, &inv.ExpiresAt,
		&inv.AcceptedAt, &inv.ServiceTypes, &inv.CreatedAt, &inv.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &inv, nil
}

// GetInvitationByID retrieves an invitation by ID
func (r *VendorRepository) GetInvitationByID(ctx context.Context, id string) (*model.VendorInvitation, error) {
	query := `
		SELECT id, operator_org_id, invited_email, existing_vendor_id,
			status, token, invited_by, message, expires_at,
			accepted_at, service_types, created_at, updated_at
		FROM vendor_invitations
		WHERE id = $1
	`

	var inv model.VendorInvitation
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&inv.ID, &inv.OperatorOrgID, &inv.InvitedEmail, &inv.ExistingVendorID,
		&inv.Status, &inv.Token, &inv.InvitedBy, &inv.Message, &inv.ExpiresAt,
		&inv.AcceptedAt, &inv.ServiceTypes, &inv.CreatedAt, &inv.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &inv, nil
}

// UpdateInvitation updates an invitation
func (r *VendorRepository) UpdateInvitation(ctx context.Context, inv *model.VendorInvitation) error {
	query := `
		UPDATE vendor_invitations SET
			status = $1, existing_vendor_id = $2, accepted_at = $3, updated_at = $4
		WHERE id = $5
	`

	_, err := r.db.ExecContext(ctx, query,
		inv.Status, inv.ExistingVendorID, inv.AcceptedAt, time.Now(), inv.ID,
	)
	return err
}

// ListInvitations lists vendor invitations with filters
func (r *VendorRepository) ListInvitations(ctx context.Context, filter model.InvitationFilter) (*model.InvitationListResult, error) {
	var conditions []string
	var args []interface{}
	argIndex := 1

	if filter.OperatorOrgID != nil {
		conditions = append(conditions, fmt.Sprintf("operator_org_id = $%d", argIndex))
		args = append(args, *filter.OperatorOrgID)
		argIndex++
	}

	if filter.Status != nil {
		conditions = append(conditions, fmt.Sprintf("status = $%d", argIndex))
		args = append(args, *filter.Status)
		argIndex++
	}

	if filter.Email != nil {
		conditions = append(conditions, fmt.Sprintf("invited_email = $%d", argIndex))
		args = append(args, *filter.Email)
		argIndex++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = " WHERE " + strings.Join(conditions, " AND ")
	}

	// Count
	countQuery := "SELECT COUNT(*) FROM vendor_invitations" + whereClause
	var total int
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, err
	}

	// Pagination
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PerPage < 1 || filter.PerPage > 100 {
		filter.PerPage = 20
	}

	offset := (filter.Page - 1) * filter.PerPage
	query := `
		SELECT id, operator_org_id, invited_email, existing_vendor_id,
			status, token, invited_by, message, expires_at,
			accepted_at, service_types, created_at, updated_at
		FROM vendor_invitations
	` + whereClause + fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
	args = append(args, filter.PerPage, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invitations []model.VendorInvitation
	for rows.Next() {
		var inv model.VendorInvitation
		err := rows.Scan(
			&inv.ID, &inv.OperatorOrgID, &inv.InvitedEmail, &inv.ExistingVendorID,
			&inv.Status, &inv.Token, &inv.InvitedBy, &inv.Message, &inv.ExpiresAt,
			&inv.AcceptedAt, &inv.ServiceTypes, &inv.CreatedAt, &inv.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		invitations = append(invitations, inv)
	}

	return &model.InvitationListResult{
		Invitations: invitations,
		Total:       total,
		Page:        filter.Page,
		PerPage:     filter.PerPage,
	}, nil
}

// AddToOperatorList adds a vendor to an operator's vendor list
func (r *VendorRepository) AddToOperatorList(ctx context.Context, entry *model.OperatorVendorList) error {
	query := `
		INSERT INTO operator_vendor_lists (
			id, operator_org_id, vendor_id, status, added_by,
			notes, preference_rank, service_types, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10
		)
		ON CONFLICT (operator_org_id, vendor_id) DO UPDATE SET
			status = EXCLUDED.status,
			service_types = EXCLUDED.service_types,
			updated_at = EXCLUDED.updated_at
	`

	_, err := r.db.ExecContext(ctx, query,
		entry.ID, entry.OperatorOrgID, entry.VendorID, entry.Status, entry.AddedBy,
		entry.Notes, entry.PreferenceRank, entry.ServiceTypes, entry.CreatedAt, entry.UpdatedAt,
	)
	return err
}

// IsVendorInOperatorList checks if a vendor is already in an operator's list
func (r *VendorRepository) IsVendorInOperatorList(ctx context.Context, operatorOrgID, vendorID string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM operator_vendor_lists WHERE operator_org_id = $1 AND vendor_id = $2 AND status = 'active')`
	var exists bool
	err := r.db.QueryRowContext(ctx, query, operatorOrgID, vendorID).Scan(&exists)
	return exists, err
}

// GetOperatorVendorEntry gets a specific entry from operator's vendor list
func (r *VendorRepository) GetOperatorVendorEntry(ctx context.Context, operatorOrgID, vendorID string) (*model.OperatorVendorList, error) {
	query := `
		SELECT id, operator_org_id, vendor_id, status, added_by,
			notes, preference_rank, service_types, created_at, updated_at
		FROM operator_vendor_lists
		WHERE operator_org_id = $1 AND vendor_id = $2
	`

	var entry model.OperatorVendorList
	err := r.db.QueryRowContext(ctx, query, operatorOrgID, vendorID).Scan(
		&entry.ID, &entry.OperatorOrgID, &entry.VendorID, &entry.Status, &entry.AddedBy,
		&entry.Notes, &entry.PreferenceRank, &entry.ServiceTypes, &entry.CreatedAt, &entry.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &entry, nil
}

// RemoveFromOperatorList removes a vendor from an operator's list (soft delete)
func (r *VendorRepository) RemoveFromOperatorList(ctx context.Context, operatorOrgID, vendorID string) error {
	query := `UPDATE operator_vendor_lists SET status = 'removed', updated_at = $1 WHERE operator_org_id = $2 AND vendor_id = $3`
	_, err := r.db.ExecContext(ctx, query, time.Now(), operatorOrgID, vendorID)
	return err
}
