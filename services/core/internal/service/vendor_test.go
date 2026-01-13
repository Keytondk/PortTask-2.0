package service

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"github.com/navo/services/core/internal/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockVendorRepository is a mock implementation of the vendor repository
type MockVendorRepository struct {
	mock.Mock
}

func (m *MockVendorRepository) Create(ctx context.Context, vendor *model.Vendor) error {
	args := m.Called(ctx, vendor)
	return args.Error(0)
}

func (m *MockVendorRepository) GetByID(ctx context.Context, id string) (*model.Vendor, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Vendor), args.Error(1)
}

func (m *MockVendorRepository) GetByEmail(ctx context.Context, email string) (*model.Vendor, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Vendor), args.Error(1)
}

func (m *MockVendorRepository) Update(ctx context.Context, vendor *model.Vendor) error {
	args := m.Called(ctx, vendor)
	return args.Error(0)
}

func (m *MockVendorRepository) List(ctx context.Context, filter model.VendorFilter) (*model.VendorListResult, error) {
	args := m.Called(ctx, filter)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.VendorListResult), args.Error(1)
}

func (m *MockVendorRepository) IsVendorInOperatorList(ctx context.Context, operatorOrgID, vendorID string) (bool, error) {
	args := m.Called(ctx, operatorOrgID, vendorID)
	return args.Bool(0), args.Error(1)
}

func (m *MockVendorRepository) AddToOperatorList(ctx context.Context, entry *model.OperatorVendorList) error {
	args := m.Called(ctx, entry)
	return args.Error(0)
}

func (m *MockVendorRepository) RemoveFromOperatorList(ctx context.Context, operatorOrgID, vendorID string) error {
	args := m.Called(ctx, operatorOrgID, vendorID)
	return args.Error(0)
}

func (m *MockVendorRepository) CreateInvitation(ctx context.Context, invitation *model.VendorInvitation) error {
	args := m.Called(ctx, invitation)
	return args.Error(0)
}

func (m *MockVendorRepository) GetInvitationByToken(ctx context.Context, token string) (*model.VendorInvitation, error) {
	args := m.Called(ctx, token)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.VendorInvitation), args.Error(1)
}

func (m *MockVendorRepository) GetInvitationByID(ctx context.Context, id string) (*model.VendorInvitation, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.VendorInvitation), args.Error(1)
}

func (m *MockVendorRepository) UpdateInvitation(ctx context.Context, invitation *model.VendorInvitation) error {
	args := m.Called(ctx, invitation)
	return args.Error(0)
}

func (m *MockVendorRepository) ListInvitations(ctx context.Context, filter model.InvitationFilter) (*model.InvitationListResult, error) {
	args := m.Called(ctx, filter)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.InvitationListResult), args.Error(1)
}

func (m *MockVendorRepository) SetVerified(ctx context.Context, vendorID string, verified bool) error {
	args := m.Called(ctx, vendorID, verified)
	return args.Error(0)
}

func (m *MockVendorRepository) SetCertified(ctx context.Context, vendorID string, certified bool) error {
	args := m.Called(ctx, vendorID, certified)
	return args.Error(0)
}

func TestVendorService_Create(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockVendorRepository)

	input := model.CreateVendorInput{
		Name: "Test Vendor",
		Address: model.Address{
			City:    "Singapore",
			Country: "Singapore",
		},
		Contacts: []model.Contact{
			{Name: "John Doe", Email: "john@vendor.com", IsPrimary: true},
		},
		ServiceTypes: []string{"bunkering", "provisions"},
		Ports:        []string{"SGSIN", "NLRTM"},
	}

	mockRepo.On("Create", ctx, mock.AnythingOfType("*model.Vendor")).Return(nil).Once()

	svc := NewVendorService(mockRepo)
	result, err := svc.Create(ctx, input, "org-1")

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "Test Vendor", result.Name)
	assert.Equal(t, "org-1", result.OrganizationID)
	assert.Equal(t, model.VendorStatusPending, result.Status)
	assert.False(t, result.IsVerified)
	assert.False(t, result.IsCertified)
	assert.NotEmpty(t, result.ID)

	mockRepo.AssertExpectations(t)
}

func TestVendorService_GetByID(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockVendorRepository)

	t.Run("found", func(t *testing.T) {
		expectedVendor := &model.Vendor{
			ID:     "vendor-1",
			Name:   "Test Vendor",
			Status: model.VendorStatusActive,
		}

		mockRepo.On("GetByID", ctx, "vendor-1").Return(expectedVendor, nil).Once()

		svc := NewVendorService(mockRepo)
		result, err := svc.GetByID(ctx, "vendor-1")

		assert.NoError(t, err)
		assert.Equal(t, expectedVendor.ID, result.ID)
		assert.Equal(t, expectedVendor.Name, result.Name)
	})

	t.Run("not found", func(t *testing.T) {
		mockRepo.On("GetByID", ctx, "vendor-999").Return(nil, sql.ErrNoRows).Once()

		svc := NewVendorService(mockRepo)
		result, err := svc.GetByID(ctx, "vendor-999")

		assert.Error(t, err)
		assert.Nil(t, result)
	})
}

func TestVendorService_Update(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockVendorRepository)

	existingVendor := &model.Vendor{
		ID:           "vendor-1",
		Name:         "Old Name",
		ServiceTypes: []string{"bunkering"},
	}

	newName := "New Name"
	input := model.UpdateVendorInput{
		Name:         &newName,
		ServiceTypes: []string{"bunkering", "provisions"},
	}

	mockRepo.On("GetByID", ctx, "vendor-1").Return(existingVendor, nil).Once()
	mockRepo.On("Update", ctx, mock.AnythingOfType("*model.Vendor")).Return(nil).Once()

	svc := NewVendorService(mockRepo)
	result, err := svc.Update(ctx, "vendor-1", input)

	assert.NoError(t, err)
	assert.Equal(t, "New Name", result.Name)
	assert.Contains(t, result.ServiceTypes, "provisions")

	mockRepo.AssertExpectations(t)
}

func TestVendorService_List(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockVendorRepository)

	filter := model.VendorFilter{
		Page:    1,
		PerPage: 10,
	}

	expectedResult := &model.VendorListResult{
		Vendors: []model.Vendor{
			{ID: "vendor-1", Name: "Vendor A"},
			{ID: "vendor-2", Name: "Vendor B"},
		},
		Total:   2,
		Page:    1,
		PerPage: 10,
	}

	mockRepo.On("List", ctx, filter).Return(expectedResult, nil)

	svc := NewVendorService(mockRepo)
	result, err := svc.List(ctx, filter)

	assert.NoError(t, err)
	assert.Equal(t, 2, result.Total)
	assert.Len(t, result.Vendors, 2)
}

func TestVendorService_InviteVendor(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockVendorRepository)

	t.Run("invite new vendor", func(t *testing.T) {
		input := model.InviteVendorInput{
			Email:        "new@vendor.com",
			ServiceTypes: []string{"bunkering"},
		}

		mockRepo.On("GetByEmail", ctx, "new@vendor.com").Return(nil, sql.ErrNoRows).Once()
		mockRepo.On("CreateInvitation", ctx, mock.AnythingOfType("*model.VendorInvitation")).Return(nil).Once()

		svc := NewVendorService(mockRepo)
		result, err := svc.InviteVendor(ctx, "op-org-1", input, "user-1")

		assert.NoError(t, err)
		assert.False(t, result.IsExistingVendor)
		assert.False(t, result.AutoAdded)
		assert.Contains(t, result.Message, "Invitation sent")
		assert.NotNil(t, result.Invitation)
		assert.Equal(t, model.InvitationStatusPending, result.Invitation.Status)
	})

	t.Run("auto-add existing vendor", func(t *testing.T) {
		existingVendor := &model.Vendor{
			ID:   "vendor-1",
			Name: "Existing Vendor",
		}

		input := model.InviteVendorInput{
			Email:        "existing@vendor.com",
			ServiceTypes: []string{"bunkering"},
		}

		mockRepo.On("GetByEmail", ctx, "existing@vendor.com").Return(existingVendor, nil).Once()
		mockRepo.On("IsVendorInOperatorList", ctx, "op-org-1", "vendor-1").Return(false, nil).Once()
		mockRepo.On("AddToOperatorList", ctx, mock.AnythingOfType("*model.OperatorVendorList")).Return(nil).Once()
		mockRepo.On("CreateInvitation", ctx, mock.AnythingOfType("*model.VendorInvitation")).Return(nil).Once()

		svc := NewVendorService(mockRepo)
		result, err := svc.InviteVendor(ctx, "op-org-1", input, "user-1")

		assert.NoError(t, err)
		assert.True(t, result.IsExistingVendor)
		assert.True(t, result.AutoAdded)
		assert.Contains(t, result.Message, "has been added")
	})

	t.Run("vendor already in network", func(t *testing.T) {
		existingVendor := &model.Vendor{
			ID:   "vendor-1",
			Name: "Existing Vendor",
		}

		input := model.InviteVendorInput{
			Email:        "existing@vendor.com",
			ServiceTypes: []string{"bunkering"},
		}

		mockRepo.On("GetByEmail", ctx, "existing@vendor.com").Return(existingVendor, nil).Once()
		mockRepo.On("IsVendorInOperatorList", ctx, "op-org-1", "vendor-1").Return(true, nil).Once()

		svc := NewVendorService(mockRepo)
		result, err := svc.InviteVendor(ctx, "op-org-1", input, "user-1")

		assert.NoError(t, err)
		assert.True(t, result.IsExistingVendor)
		assert.False(t, result.AutoAdded)
		assert.Contains(t, result.Message, "already in your vendor network")
	})
}

func TestVendorService_AcceptInvitation(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockVendorRepository)

	t.Run("accept invitation for new vendor", func(t *testing.T) {
		invitation := &model.VendorInvitation{
			ID:            "inv-1",
			OperatorOrgID: "op-org-1",
			Status:        model.InvitationStatusPending,
			Token:         "valid-token",
			ExpiresAt:     time.Now().Add(24 * time.Hour),
			ServiceTypes:  []string{"bunkering"},
			InvitedBy:     "user-1",
		}

		vendorDetails := &model.CreateVendorInput{
			Name: "New Vendor",
			Contacts: []model.Contact{
				{Name: "Contact", Email: "contact@vendor.com"},
			},
		}

		input := model.AcceptInvitationInput{
			Token:         "valid-token",
			VendorDetails: vendorDetails,
		}

		mockRepo.On("GetInvitationByToken", ctx, "valid-token").Return(invitation, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*model.Vendor")).Return(nil).Once()
		mockRepo.On("AddToOperatorList", ctx, mock.AnythingOfType("*model.OperatorVendorList")).Return(nil).Once()
		mockRepo.On("UpdateInvitation", ctx, mock.AnythingOfType("*model.VendorInvitation")).Return(nil).Once()

		svc := NewVendorService(mockRepo)
		result, err := svc.AcceptInvitation(ctx, "valid-token", input, "new-vendor-org")

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, "New Vendor", result.Name)
	})

	t.Run("accept invitation for existing vendor", func(t *testing.T) {
		vendorID := "vendor-1"
		invitation := &model.VendorInvitation{
			ID:               "inv-2",
			OperatorOrgID:    "op-org-1",
			Status:           model.InvitationStatusPending,
			Token:            "existing-vendor-token",
			ExpiresAt:        time.Now().Add(24 * time.Hour),
			ExistingVendorID: &vendorID,
			InvitedBy:        "user-1",
		}
		existingVendor := &model.Vendor{
			ID:   vendorID,
			Name: "Existing Vendor",
		}

		mockRepo.On("GetInvitationByToken", ctx, "existing-vendor-token").Return(invitation, nil).Once()
		mockRepo.On("GetByID", ctx, vendorID).Return(existingVendor, nil).Once()
		mockRepo.On("AddToOperatorList", ctx, mock.AnythingOfType("*model.OperatorVendorList")).Return(nil).Once()
		mockRepo.On("UpdateInvitation", ctx, mock.AnythingOfType("*model.VendorInvitation")).Return(nil).Once()

		svc := NewVendorService(mockRepo)
		input := model.AcceptInvitationInput{Token: "existing-vendor-token"}
		result, err := svc.AcceptInvitation(ctx, "existing-vendor-token", input, "vendor-org")

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, "Existing Vendor", result.Name)
	})

	t.Run("expired invitation", func(t *testing.T) {
		invitation := &model.VendorInvitation{
			ID:        "inv-3",
			Status:    model.InvitationStatusPending,
			Token:     "expired-token",
			ExpiresAt: time.Now().Add(-24 * time.Hour),
		}

		mockRepo.On("GetInvitationByToken", ctx, "expired-token").Return(invitation, nil).Once()
		mockRepo.On("UpdateInvitation", ctx, mock.AnythingOfType("*model.VendorInvitation")).Return(nil).Once()

		svc := NewVendorService(mockRepo)
		input := model.AcceptInvitationInput{Token: "expired-token"}
		_, err := svc.AcceptInvitation(ctx, "expired-token", input, "org")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "expired")
	})

	t.Run("already accepted invitation", func(t *testing.T) {
		invitation := &model.VendorInvitation{
			ID:        "inv-4",
			Status:    model.InvitationStatusAccepted,
			Token:     "accepted-token",
			ExpiresAt: time.Now().Add(24 * time.Hour),
		}

		mockRepo.On("GetInvitationByToken", ctx, "accepted-token").Return(invitation, nil).Once()

		svc := NewVendorService(mockRepo)
		input := model.AcceptInvitationInput{Token: "accepted-token"}
		_, err := svc.AcceptInvitation(ctx, "accepted-token", input, "org")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "no longer valid")
	})

	t.Run("new vendor without details", func(t *testing.T) {
		invitation := &model.VendorInvitation{
			ID:        "inv-5",
			Status:    model.InvitationStatusPending,
			Token:     "needs-details-token",
			ExpiresAt: time.Now().Add(24 * time.Hour),
		}

		mockRepo.On("GetInvitationByToken", ctx, "needs-details-token").Return(invitation, nil).Once()

		svc := NewVendorService(mockRepo)
		input := model.AcceptInvitationInput{Token: "needs-details-token"}
		_, err := svc.AcceptInvitation(ctx, "needs-details-token", input, "org")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "vendor details required")
	})
}

func TestVendorService_CancelInvitation(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockVendorRepository)

	t.Run("cancel pending invitation", func(t *testing.T) {
		invitation := &model.VendorInvitation{
			ID:            "inv-1",
			OperatorOrgID: "op-org-1",
			Status:        model.InvitationStatusPending,
		}

		mockRepo.On("GetInvitationByID", ctx, "inv-1").Return(invitation, nil).Once()
		mockRepo.On("UpdateInvitation", ctx, mock.AnythingOfType("*model.VendorInvitation")).Return(nil).Once()

		svc := NewVendorService(mockRepo)
		err := svc.CancelInvitation(ctx, "inv-1", "op-org-1")

		assert.NoError(t, err)
	})

	t.Run("unauthorized cancellation", func(t *testing.T) {
		invitation := &model.VendorInvitation{
			ID:            "inv-2",
			OperatorOrgID: "op-org-1",
			Status:        model.InvitationStatusPending,
		}

		mockRepo.On("GetInvitationByID", ctx, "inv-2").Return(invitation, nil).Once()

		svc := NewVendorService(mockRepo)
		err := svc.CancelInvitation(ctx, "inv-2", "op-org-other")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "unauthorized")
	})

	t.Run("cannot cancel accepted invitation", func(t *testing.T) {
		invitation := &model.VendorInvitation{
			ID:            "inv-3",
			OperatorOrgID: "op-org-1",
			Status:        model.InvitationStatusAccepted,
		}

		mockRepo.On("GetInvitationByID", ctx, "inv-3").Return(invitation, nil).Once()

		svc := NewVendorService(mockRepo)
		err := svc.CancelInvitation(ctx, "inv-3", "op-org-1")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "cannot cancel")
	})
}

func TestVendorService_Activate(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockVendorRepository)

	existingVendor := &model.Vendor{
		ID:     "vendor-1",
		Status: model.VendorStatusPending,
	}

	mockRepo.On("GetByID", ctx, "vendor-1").Return(existingVendor, nil).Once()
	mockRepo.On("Update", ctx, mock.AnythingOfType("*model.Vendor")).Return(nil).Once()

	svc := NewVendorService(mockRepo)
	result, err := svc.Activate(ctx, "vendor-1")

	assert.NoError(t, err)
	assert.Equal(t, model.VendorStatusActive, result.Status)

	mockRepo.AssertExpectations(t)
}

func TestVendorService_Suspend(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockVendorRepository)

	existingVendor := &model.Vendor{
		ID:     "vendor-1",
		Status: model.VendorStatusActive,
	}

	mockRepo.On("GetByID", ctx, "vendor-1").Return(existingVendor, nil).Once()
	mockRepo.On("Update", ctx, mock.AnythingOfType("*model.Vendor")).Return(nil).Once()

	svc := NewVendorService(mockRepo)
	result, err := svc.Suspend(ctx, "vendor-1")

	assert.NoError(t, err)
	assert.Equal(t, model.VendorStatusSuspended, result.Status)

	mockRepo.AssertExpectations(t)
}

func TestVendorService_SetVerified(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockVendorRepository)

	verifiedVendor := &model.Vendor{
		ID:         "vendor-1",
		IsVerified: true,
	}

	mockRepo.On("SetVerified", ctx, "vendor-1", true).Return(nil).Once()
	mockRepo.On("GetByID", ctx, "vendor-1").Return(verifiedVendor, nil).Once()

	svc := NewVendorService(mockRepo)
	result, err := svc.SetVerified(ctx, "vendor-1", true)

	assert.NoError(t, err)
	assert.True(t, result.IsVerified)

	mockRepo.AssertExpectations(t)
}

func TestVendorService_SetCertified(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockVendorRepository)

	certifiedVendor := &model.Vendor{
		ID:          "vendor-1",
		IsCertified: true,
	}

	mockRepo.On("SetCertified", ctx, "vendor-1", true).Return(nil).Once()
	mockRepo.On("GetByID", ctx, "vendor-1").Return(certifiedVendor, nil).Once()

	svc := NewVendorService(mockRepo)
	result, err := svc.SetCertified(ctx, "vendor-1", true)

	assert.NoError(t, err)
	assert.True(t, result.IsCertified)

	mockRepo.AssertExpectations(t)
}

func TestVendorService_SubmitCertification(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockVendorRepository)

	existingVendor := &model.Vendor{
		ID:             "vendor-1",
		Certifications: []model.Certification{},
	}

	input := model.SubmitCertificationInput{
		Name:        "ISO 9001",
		Issuer:      "ISO",
		DocumentURL: "https://example.com/cert.pdf",
	}

	mockRepo.On("GetByID", ctx, "vendor-1").Return(existingVendor, nil).Once()
	mockRepo.On("Update", ctx, mock.AnythingOfType("*model.Vendor")).Return(nil).Once()

	svc := NewVendorService(mockRepo)
	result, err := svc.SubmitCertification(ctx, "vendor-1", input)

	assert.NoError(t, err)
	assert.Len(t, result.Certifications, 1)
	assert.Equal(t, "ISO 9001", result.Certifications[0].Name)
	assert.False(t, result.Certifications[0].Verified) // Pending verification

	mockRepo.AssertExpectations(t)
}

func TestVendorService_GetBadges(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockVendorRepository)

	verifiedAt := time.Now().Add(-30 * 24 * time.Hour)
	certifiedAt := time.Now().Add(-15 * 24 * time.Hour)

	vendor := &model.Vendor{
		ID:          "vendor-1",
		IsVerified:  true,
		VerifiedAt:  &verifiedAt,
		IsCertified: true,
		CertifiedAt: &certifiedAt,
	}

	mockRepo.On("GetByID", ctx, "vendor-1").Return(vendor, nil).Once()

	svc := NewVendorService(mockRepo)
	badges, err := svc.GetBadges(ctx, "vendor-1")

	assert.NoError(t, err)
	assert.True(t, badges.IsVerified)
	assert.True(t, badges.IsCertified)
	assert.NotNil(t, badges.VerifiedAt)
	assert.NotNil(t, badges.CertifiedAt)

	mockRepo.AssertExpectations(t)
}

func TestVendorService_RemoveVendorFromList(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockVendorRepository)

	mockRepo.On("RemoveFromOperatorList", ctx, "op-org-1", "vendor-1").Return(nil).Once()

	svc := NewVendorService(mockRepo)
	err := svc.RemoveVendorFromList(ctx, "op-org-1", "vendor-1")

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestVendorService_ListForOperator(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockVendorRepository)

	operatorOrgID := "op-org-1"
	filter := model.VendorFilter{
		Page:    1,
		PerPage: 10,
	}

	expectedResult := &model.VendorListResult{
		Vendors: []model.Vendor{
			{ID: "vendor-1", Name: "Vendor A"},
		},
		Total:   1,
		Page:    1,
		PerPage: 10,
	}

	// The filter should have OperatorOrgID set
	mockRepo.On("List", ctx, mock.MatchedBy(func(f model.VendorFilter) bool {
		return f.OperatorOrgID != nil && *f.OperatorOrgID == operatorOrgID
	})).Return(expectedResult, nil).Once()

	svc := NewVendorService(mockRepo)
	result, err := svc.ListForOperator(ctx, operatorOrgID, filter)

	assert.NoError(t, err)
	assert.Equal(t, 1, result.Total)

	mockRepo.AssertExpectations(t)
}

func TestVendorService_ListInvitations(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockVendorRepository)

	filter := model.InvitationFilter{
		Page:    1,
		PerPage: 10,
	}

	expectedResult := &model.InvitationListResult{
		Invitations: []model.VendorInvitation{
			{ID: "inv-1", InvitedEmail: "vendor1@example.com"},
			{ID: "inv-2", InvitedEmail: "vendor2@example.com"},
		},
		Total:   2,
		Page:    1,
		PerPage: 10,
	}

	mockRepo.On("ListInvitations", ctx, mock.MatchedBy(func(f model.InvitationFilter) bool {
		return f.OperatorOrgID != nil && *f.OperatorOrgID == "op-org-1"
	})).Return(expectedResult, nil).Once()

	svc := NewVendorService(mockRepo)
	result, err := svc.ListInvitations(ctx, "op-org-1", filter)

	assert.NoError(t, err)
	assert.Equal(t, 2, result.Total)
	assert.Len(t, result.Invitations, 2)

	mockRepo.AssertExpectations(t)
}
