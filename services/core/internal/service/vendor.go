package service

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/navo/services/core/internal/model"
	"github.com/navo/services/core/internal/repository"
)

// VendorService handles vendor business logic
type VendorService struct {
	repo *repository.VendorRepository
}

// NewVendorService creates a new vendor service
func NewVendorService(repo *repository.VendorRepository) *VendorService {
	return &VendorService{repo: repo}
}

// Create creates a new vendor
func (s *VendorService) Create(ctx context.Context, input model.CreateVendorInput, organizationID string) (*model.Vendor, error) {
	vendor := &model.Vendor{
		ID:                 uuid.New().String(),
		Name:               input.Name,
		OrganizationID:     organizationID,
		RegistrationNumber: input.RegistrationNumber,
		Address:            input.Address,
		Contacts:           input.Contacts,
		BankDetails:        input.BankDetails,
		ServiceTypes:       input.ServiceTypes,
		Ports:              input.Ports,
		Certifications:     []model.Certification{},
		Rating:             0,
		TotalOrders:        0,
		OnTimeDelivery:     0,
		ResponseTime:       0,
		Status:             model.VendorStatusPending,
		IsVerified:         false,
		IsCertified:        false,
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}

	if err := s.repo.Create(ctx, vendor); err != nil {
		return nil, fmt.Errorf("failed to create vendor: %w", err)
	}

	return vendor, nil
}

// GetByID retrieves a vendor by ID
func (s *VendorService) GetByID(ctx context.Context, id string) (*model.Vendor, error) {
	return s.repo.GetByID(ctx, id)
}

// Update updates a vendor
func (s *VendorService) Update(ctx context.Context, id string, input model.UpdateVendorInput) (*model.Vendor, error) {
	vendor, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("vendor not found: %w", err)
	}

	if input.Name != nil {
		vendor.Name = *input.Name
	}
	if input.RegistrationNumber != nil {
		vendor.RegistrationNumber = input.RegistrationNumber
	}
	if input.Address != nil {
		vendor.Address = *input.Address
	}
	if input.Contacts != nil {
		vendor.Contacts = input.Contacts
	}
	if input.BankDetails != nil {
		vendor.BankDetails = *input.BankDetails
	}
	if input.ServiceTypes != nil {
		vendor.ServiceTypes = input.ServiceTypes
	}
	if input.Ports != nil {
		vendor.Ports = input.Ports
	}

	if err := s.repo.Update(ctx, vendor); err != nil {
		return nil, fmt.Errorf("failed to update vendor: %w", err)
	}

	return vendor, nil
}

// List lists vendors with filters
func (s *VendorService) List(ctx context.Context, filter model.VendorFilter) (*model.VendorListResult, error) {
	return s.repo.List(ctx, filter)
}

// ListForOperator lists vendors in an operator's approved vendor list
func (s *VendorService) ListForOperator(ctx context.Context, operatorOrgID string, filter model.VendorFilter) (*model.VendorListResult, error) {
	filter.OperatorOrgID = &operatorOrgID
	return s.repo.List(ctx, filter)
}

// InviteVendor invites a vendor to an operator's network
// If the email belongs to an existing vendor, they're auto-added to the operator's list
// If not, an invitation is sent
func (s *VendorService) InviteVendor(ctx context.Context, operatorOrgID string, input model.InviteVendorInput, invitedBy string) (*model.InvitationResult, error) {
	result := &model.InvitationResult{}

	// Check if vendor with this email already exists
	existingVendor, err := s.repo.GetByEmail(ctx, input.Email)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to check existing vendor: %w", err)
	}

	if existingVendor != nil {
		// Vendor exists - check if already in operator's list
		inList, err := s.repo.IsVendorInOperatorList(ctx, operatorOrgID, existingVendor.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to check vendor list: %w", err)
		}

		if inList {
			result.Message = "Vendor is already in your vendor network"
			result.IsExistingVendor = true
			result.AutoAdded = false
			return result, nil
		}

		// Auto-add existing vendor to operator's list
		entry := &model.OperatorVendorList{
			ID:            uuid.New().String(),
			OperatorOrgID: operatorOrgID,
			VendorID:      existingVendor.ID,
			Status:        "active",
			AddedBy:       invitedBy,
			ServiceTypes:  input.ServiceTypes,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		if err := s.repo.AddToOperatorList(ctx, entry); err != nil {
			return nil, fmt.Errorf("failed to add vendor to list: %w", err)
		}

		// Create an accepted invitation record for tracking
		invitation := &model.VendorInvitation{
			ID:               uuid.New().String(),
			OperatorOrgID:    operatorOrgID,
			InvitedEmail:     input.Email,
			ExistingVendorID: &existingVendor.ID,
			Status:           model.InvitationStatusAccepted,
			Token:            uuid.New().String(),
			InvitedBy:        invitedBy,
			Message:          input.Message,
			ExpiresAt:        time.Now().Add(7 * 24 * time.Hour),
			AcceptedAt:       timePtr(time.Now()),
			ServiceTypes:     input.ServiceTypes,
			CreatedAt:        time.Now(),
			UpdatedAt:        time.Now(),
		}

		if err := s.repo.CreateInvitation(ctx, invitation); err != nil {
			// Log but don't fail - vendor was added successfully
			fmt.Printf("Warning: failed to create invitation record: %v\n", err)
		}

		invitation.ExistingVendor = existingVendor
		result.Invitation = invitation
		result.IsExistingVendor = true
		result.AutoAdded = true
		result.Message = fmt.Sprintf("Vendor '%s' has been added to your network", existingVendor.Name)

		// TODO: Send notification to vendor about being added to new operator's network

		return result, nil
	}

	// No existing vendor - create pending invitation
	invitation := &model.VendorInvitation{
		ID:            uuid.New().String(),
		OperatorOrgID: operatorOrgID,
		InvitedEmail:  input.Email,
		Status:        model.InvitationStatusPending,
		Token:         uuid.New().String(),
		InvitedBy:     invitedBy,
		Message:       input.Message,
		ExpiresAt:     time.Now().Add(7 * 24 * time.Hour), // 7 days expiry
		ServiceTypes:  input.ServiceTypes,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := s.repo.CreateInvitation(ctx, invitation); err != nil {
		return nil, fmt.Errorf("failed to create invitation: %w", err)
	}

	result.Invitation = invitation
	result.IsExistingVendor = false
	result.AutoAdded = false
	result.Message = fmt.Sprintf("Invitation sent to %s", input.Email)

	// TODO: Send invitation email with registration link

	return result, nil
}

// AcceptInvitation accepts a vendor invitation
func (s *VendorService) AcceptInvitation(ctx context.Context, token string, input model.AcceptInvitationInput, userOrgID string) (*model.Vendor, error) {
	// Get invitation by token
	invitation, err := s.repo.GetInvitationByToken(ctx, token)
	if err != nil {
		return nil, fmt.Errorf("invitation not found: %w", err)
	}

	// Validate invitation
	if invitation.Status != model.InvitationStatusPending {
		return nil, fmt.Errorf("invitation is no longer valid (status: %s)", invitation.Status)
	}

	if time.Now().After(invitation.ExpiresAt) {
		// Update status to expired
		invitation.Status = model.InvitationStatusExpired
		s.repo.UpdateInvitation(ctx, invitation)
		return nil, fmt.Errorf("invitation has expired")
	}

	var vendor *model.Vendor

	// If existing vendor in system
	if invitation.ExistingVendorID != nil {
		vendor, err = s.repo.GetByID(ctx, *invitation.ExistingVendorID)
		if err != nil {
			return nil, fmt.Errorf("vendor not found: %w", err)
		}
	} else {
		// New vendor registration required
		if input.VendorDetails == nil {
			return nil, fmt.Errorf("vendor details required for new vendor registration")
		}

		vendor, err = s.Create(ctx, *input.VendorDetails, userOrgID)
		if err != nil {
			return nil, fmt.Errorf("failed to create vendor: %w", err)
		}

		invitation.ExistingVendorID = &vendor.ID
	}

	// Add vendor to operator's list
	entry := &model.OperatorVendorList{
		ID:            uuid.New().String(),
		OperatorOrgID: invitation.OperatorOrgID,
		VendorID:      vendor.ID,
		Status:        "active",
		AddedBy:       invitation.InvitedBy,
		ServiceTypes:  invitation.ServiceTypes,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := s.repo.AddToOperatorList(ctx, entry); err != nil {
		return nil, fmt.Errorf("failed to add vendor to operator list: %w", err)
	}

	// Update invitation status
	invitation.Status = model.InvitationStatusAccepted
	invitation.AcceptedAt = timePtr(time.Now())

	if err := s.repo.UpdateInvitation(ctx, invitation); err != nil {
		// Log but don't fail
		fmt.Printf("Warning: failed to update invitation status: %v\n", err)
	}

	return vendor, nil
}

// CancelInvitation cancels a pending invitation
func (s *VendorService) CancelInvitation(ctx context.Context, invitationID, operatorOrgID string) error {
	invitation, err := s.repo.GetInvitationByID(ctx, invitationID)
	if err != nil {
		return fmt.Errorf("invitation not found: %w", err)
	}

	if invitation.OperatorOrgID != operatorOrgID {
		return fmt.Errorf("unauthorized: invitation belongs to different operator")
	}

	if invitation.Status != model.InvitationStatusPending {
		return fmt.Errorf("cannot cancel invitation with status: %s", invitation.Status)
	}

	invitation.Status = model.InvitationStatusCancelled

	return s.repo.UpdateInvitation(ctx, invitation)
}

// ListInvitations lists vendor invitations for an operator
func (s *VendorService) ListInvitations(ctx context.Context, operatorOrgID string, filter model.InvitationFilter) (*model.InvitationListResult, error) {
	filter.OperatorOrgID = &operatorOrgID
	return s.repo.ListInvitations(ctx, filter)
}

// RemoveVendorFromList removes a vendor from operator's list
func (s *VendorService) RemoveVendorFromList(ctx context.Context, operatorOrgID, vendorID string) error {
	return s.repo.RemoveFromOperatorList(ctx, operatorOrgID, vendorID)
}

// SetVerified sets the verified status of a vendor (admin only)
func (s *VendorService) SetVerified(ctx context.Context, vendorID string, verified bool) (*model.Vendor, error) {
	if err := s.repo.SetVerified(ctx, vendorID, verified); err != nil {
		return nil, fmt.Errorf("failed to update verified status: %w", err)
	}

	return s.repo.GetByID(ctx, vendorID)
}

// SetCertified sets the certified status of a vendor (admin only after document review)
func (s *VendorService) SetCertified(ctx context.Context, vendorID string, certified bool) (*model.Vendor, error) {
	if err := s.repo.SetCertified(ctx, vendorID, certified); err != nil {
		return nil, fmt.Errorf("failed to update certified status: %w", err)
	}

	return s.repo.GetByID(ctx, vendorID)
}

// SubmitCertification submits certification documents for review
func (s *VendorService) SubmitCertification(ctx context.Context, vendorID string, input model.SubmitCertificationInput) (*model.Vendor, error) {
	vendor, err := s.repo.GetByID(ctx, vendorID)
	if err != nil {
		return nil, fmt.Errorf("vendor not found: %w", err)
	}

	certification := model.Certification{
		Name:        input.Name,
		Issuer:      input.Issuer,
		DocumentURL: input.DocumentURL,
		IssuedAt:    input.IssuedAt,
		ExpiresAt:   input.ExpiresAt,
		Verified:    false, // Pending verification
	}

	vendor.Certifications = append(vendor.Certifications, certification)

	if err := s.repo.Update(ctx, vendor); err != nil {
		return nil, fmt.Errorf("failed to add certification: %w", err)
	}

	// TODO: Notify admin for review

	return vendor, nil
}

// GetBadges returns the badge status for a vendor
func (s *VendorService) GetBadges(ctx context.Context, vendorID string) (*model.VendorBadges, error) {
	vendor, err := s.repo.GetByID(ctx, vendorID)
	if err != nil {
		return nil, fmt.Errorf("vendor not found: %w", err)
	}

	return &model.VendorBadges{
		IsVerified:  vendor.IsVerified,
		VerifiedAt:  vendor.VerifiedAt,
		IsCertified: vendor.IsCertified,
		CertifiedAt: vendor.CertifiedAt,
	}, nil
}

// Activate activates a pending vendor
func (s *VendorService) Activate(ctx context.Context, vendorID string) (*model.Vendor, error) {
	vendor, err := s.repo.GetByID(ctx, vendorID)
	if err != nil {
		return nil, fmt.Errorf("vendor not found: %w", err)
	}

	vendor.Status = model.VendorStatusActive

	if err := s.repo.Update(ctx, vendor); err != nil {
		return nil, fmt.Errorf("failed to activate vendor: %w", err)
	}

	return vendor, nil
}

// Suspend suspends a vendor
func (s *VendorService) Suspend(ctx context.Context, vendorID string) (*model.Vendor, error) {
	vendor, err := s.repo.GetByID(ctx, vendorID)
	if err != nil {
		return nil, fmt.Errorf("vendor not found: %w", err)
	}

	vendor.Status = model.VendorStatusSuspended

	if err := s.repo.Update(ctx, vendor); err != nil {
		return nil, fmt.Errorf("failed to suspend vendor: %w", err)
	}

	return vendor, nil
}

// Helper function
func timePtr(t time.Time) *time.Time {
	return &t
}
