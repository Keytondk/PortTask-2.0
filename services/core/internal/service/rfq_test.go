package service

import (
	"context"
	"testing"
	"time"

	"github.com/navo/services/core/internal/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockRFQRepository is a mock implementation of the RFQ repository
type MockRFQRepository struct {
	mock.Mock
}

func (m *MockRFQRepository) Create(ctx context.Context, input model.CreateRFQInput, userID string) (*model.RFQ, error) {
	args := m.Called(ctx, input, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.RFQ), args.Error(1)
}

func (m *MockRFQRepository) GetByID(ctx context.Context, id string) (*model.RFQ, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.RFQ), args.Error(1)
}

func (m *MockRFQRepository) GetByReference(ctx context.Context, reference string) (*model.RFQ, error) {
	args := m.Called(ctx, reference)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.RFQ), args.Error(1)
}

func (m *MockRFQRepository) List(ctx context.Context, filter model.RFQFilter) ([]model.RFQ, int, error) {
	args := m.Called(ctx, filter)
	return args.Get(0).([]model.RFQ), args.Int(1), args.Error(2)
}

func (m *MockRFQRepository) Update(ctx context.Context, id string, input model.UpdateRFQInput) (*model.RFQ, error) {
	args := m.Called(ctx, id, input)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.RFQ), args.Error(1)
}

func (m *MockRFQRepository) UpdateStatus(ctx context.Context, id string, status model.RFQStatus) error {
	args := m.Called(ctx, id, status)
	return args.Error(0)
}

func (m *MockRFQRepository) GetQuotesByRFQ(ctx context.Context, rfqID string) ([]model.Quote, error) {
	args := m.Called(ctx, rfqID)
	return args.Get(0).([]model.Quote), args.Error(1)
}

func (m *MockRFQRepository) GetQuoteByVendor(ctx context.Context, rfqID, vendorID string) (*model.Quote, error) {
	args := m.Called(ctx, rfqID, vendorID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Quote), args.Error(1)
}

func (m *MockRFQRepository) GetQuote(ctx context.Context, id string) (*model.Quote, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Quote), args.Error(1)
}

func (m *MockRFQRepository) SubmitQuote(ctx context.Context, rfqID, vendorID string, input model.SubmitQuoteInput) (*model.Quote, error) {
	args := m.Called(ctx, rfqID, vendorID, input)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Quote), args.Error(1)
}

func (m *MockRFQRepository) UpdateQuoteStatus(ctx context.Context, id string, status model.QuoteStatus) error {
	args := m.Called(ctx, id, status)
	return args.Error(0)
}

func (m *MockRFQRepository) Award(ctx context.Context, rfqID, quoteID string) error {
	args := m.Called(ctx, rfqID, quoteID)
	return args.Error(0)
}

func TestRFQService_Create_Validation(t *testing.T) {
	ctx := context.Background()

	tests := []struct {
		name    string
		input   model.CreateRFQInput
		wantErr string
	}{
		{
			name:    "missing service_type_id",
			input:   model.CreateRFQInput{PortCallID: "pc-1", Deadline: time.Now().Add(24 * time.Hour)},
			wantErr: "service_type_id is required",
		},
		{
			name:    "missing port_call_id",
			input:   model.CreateRFQInput{ServiceTypeID: "svc-1", Deadline: time.Now().Add(24 * time.Hour)},
			wantErr: "port_call_id is required",
		},
		{
			name:    "missing deadline",
			input:   model.CreateRFQInput{ServiceTypeID: "svc-1", PortCallID: "pc-1"},
			wantErr: "deadline is required",
		},
		{
			name: "deadline in the past",
			input: model.CreateRFQInput{
				ServiceTypeID: "svc-1",
				PortCallID:    "pc-1",
				Deadline:      time.Now().Add(-1 * time.Hour),
			},
			wantErr: "deadline must be in the future",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := &RFQService{}
			_, err := svc.Create(ctx, tt.input, "user-1", "org-1")
			assert.Error(t, err)
			assert.Contains(t, err.Error(), tt.wantErr)
		})
	}
}

func TestRFQService_Create_Success(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockRFQRepository)

	now := time.Now().UTC()
	deadline := now.Add(48 * time.Hour)

	input := model.CreateRFQInput{
		ServiceTypeID:  "svc-1",
		PortCallID:     "pc-1",
		Deadline:       deadline,
		InvitedVendors: []string{"vendor-1", "vendor-2"},
	}

	expectedRFQ := &model.RFQ{
		ID:             "rfq-1",
		Reference:      "RFQ-2024-001",
		ServiceTypeID:  "svc-1",
		PortCallID:     "pc-1",
		Status:         model.RFQStatusDraft,
		Deadline:       deadline,
		InvitedVendors: []string{"vendor-1", "vendor-2"},
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	mockRepo.On("Create", ctx, input, "user-1").Return(expectedRFQ, nil)

	svc := NewRFQService(mockRepo, nil)
	result, err := svc.Create(ctx, input, "user-1", "org-1")

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, expectedRFQ.ID, result.ID)
	assert.Equal(t, model.RFQStatusDraft, result.Status)

	mockRepo.AssertExpectations(t)
}

func TestRFQService_GetByID(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockRFQRepository)

	t.Run("found", func(t *testing.T) {
		expectedRFQ := &model.RFQ{
			ID:        "rfq-1",
			Reference: "RFQ-2024-001",
			Status:    model.RFQStatusDraft,
		}

		mockRepo.On("GetByID", ctx, "rfq-1").Return(expectedRFQ, nil).Once()

		svc := NewRFQService(mockRepo, nil)
		result, err := svc.GetByID(ctx, "rfq-1")

		assert.NoError(t, err)
		assert.Equal(t, expectedRFQ.ID, result.ID)
	})

	t.Run("not found", func(t *testing.T) {
		mockRepo.On("GetByID", ctx, "rfq-999").Return(nil, nil).Once()

		svc := NewRFQService(mockRepo, nil)
		result, err := svc.GetByID(ctx, "rfq-999")

		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "not found")
	})
}

func TestRFQService_Update_DraftOnly(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockRFQRepository)

	t.Run("update draft RFQ", func(t *testing.T) {
		existingRFQ := &model.RFQ{
			ID:     "rfq-1",
			Status: model.RFQStatusDraft,
		}
		newDescription := "Updated description"
		updatedRFQ := &model.RFQ{
			ID:          "rfq-1",
			Status:      model.RFQStatusDraft,
			Description: &newDescription,
		}

		mockRepo.On("GetByID", ctx, "rfq-1").Return(existingRFQ, nil).Once()
		mockRepo.On("Update", ctx, "rfq-1", mock.AnythingOfType("model.UpdateRFQInput")).Return(updatedRFQ, nil).Once()

		svc := NewRFQService(mockRepo, nil)
		input := model.UpdateRFQInput{Description: &newDescription}
		result, err := svc.Update(ctx, "rfq-1", input, "user-1", "org-1")

		assert.NoError(t, err)
		assert.Equal(t, newDescription, *result.Description)
	})

	t.Run("cannot update open RFQ", func(t *testing.T) {
		existingRFQ := &model.RFQ{
			ID:     "rfq-2",
			Status: model.RFQStatusOpen,
		}

		mockRepo.On("GetByID", ctx, "rfq-2").Return(existingRFQ, nil).Once()

		svc := NewRFQService(mockRepo, nil)
		input := model.UpdateRFQInput{}
		_, err := svc.Update(ctx, "rfq-2", input, "user-1", "org-1")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "draft status")
	})
}

func TestRFQService_Publish(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockRFQRepository)

	deadline := time.Now().Add(48 * time.Hour)

	t.Run("publish draft RFQ", func(t *testing.T) {
		existingRFQ := &model.RFQ{
			ID:             "rfq-1",
			Status:         model.RFQStatusDraft,
			Deadline:       deadline,
			InvitedVendors: []string{"vendor-1"},
		}
		publishedRFQ := &model.RFQ{
			ID:             "rfq-1",
			Status:         model.RFQStatusOpen,
			Deadline:       deadline,
			InvitedVendors: []string{"vendor-1"},
		}

		mockRepo.On("GetByID", ctx, "rfq-1").Return(existingRFQ, nil).Once()
		mockRepo.On("UpdateStatus", ctx, "rfq-1", model.RFQStatusOpen).Return(nil).Once()
		mockRepo.On("GetByID", ctx, "rfq-1").Return(publishedRFQ, nil).Once()

		svc := NewRFQService(mockRepo, nil)
		result, err := svc.Publish(ctx, "rfq-1", "user-1", "org-1")

		assert.NoError(t, err)
		assert.Equal(t, model.RFQStatusOpen, result.Status)
	})

	t.Run("cannot publish open RFQ", func(t *testing.T) {
		existingRFQ := &model.RFQ{
			ID:     "rfq-2",
			Status: model.RFQStatusOpen,
		}

		mockRepo.On("GetByID", ctx, "rfq-2").Return(existingRFQ, nil).Once()

		svc := NewRFQService(mockRepo, nil)
		_, err := svc.Publish(ctx, "rfq-2", "user-1", "org-1")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "draft status")
	})

	t.Run("cannot publish without vendors", func(t *testing.T) {
		existingRFQ := &model.RFQ{
			ID:             "rfq-3",
			Status:         model.RFQStatusDraft,
			Deadline:       deadline,
			InvitedVendors: []string{},
		}

		mockRepo.On("GetByID", ctx, "rfq-3").Return(existingRFQ, nil).Once()

		svc := NewRFQService(mockRepo, nil)
		_, err := svc.Publish(ctx, "rfq-3", "user-1", "org-1")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "at least one vendor")
	})

	t.Run("cannot publish with past deadline", func(t *testing.T) {
		existingRFQ := &model.RFQ{
			ID:             "rfq-4",
			Status:         model.RFQStatusDraft,
			Deadline:       time.Now().Add(-1 * time.Hour),
			InvitedVendors: []string{"vendor-1"},
		}

		mockRepo.On("GetByID", ctx, "rfq-4").Return(existingRFQ, nil).Once()

		svc := NewRFQService(mockRepo, nil)
		_, err := svc.Publish(ctx, "rfq-4", "user-1", "org-1")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "deadline has passed")
	})
}

func TestRFQService_Close(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockRFQRepository)

	t.Run("close open RFQ", func(t *testing.T) {
		existingRFQ := &model.RFQ{
			ID:     "rfq-1",
			Status: model.RFQStatusOpen,
		}
		closedRFQ := &model.RFQ{
			ID:     "rfq-1",
			Status: model.RFQStatusClosed,
		}

		mockRepo.On("GetByID", ctx, "rfq-1").Return(existingRFQ, nil).Once()
		mockRepo.On("UpdateStatus", ctx, "rfq-1", model.RFQStatusClosed).Return(nil).Once()
		mockRepo.On("GetByID", ctx, "rfq-1").Return(closedRFQ, nil).Once()

		svc := NewRFQService(mockRepo, nil)
		result, err := svc.Close(ctx, "rfq-1", "user-1", "org-1")

		assert.NoError(t, err)
		assert.Equal(t, model.RFQStatusClosed, result.Status)
	})

	t.Run("cannot close draft RFQ", func(t *testing.T) {
		existingRFQ := &model.RFQ{
			ID:     "rfq-2",
			Status: model.RFQStatusDraft,
		}

		mockRepo.On("GetByID", ctx, "rfq-2").Return(existingRFQ, nil).Once()

		svc := NewRFQService(mockRepo, nil)
		_, err := svc.Close(ctx, "rfq-2", "user-1", "org-1")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "open status")
	})
}

func TestRFQService_Cancel(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockRFQRepository)

	t.Run("cancel draft RFQ", func(t *testing.T) {
		existingRFQ := &model.RFQ{
			ID:     "rfq-1",
			Status: model.RFQStatusDraft,
		}
		cancelledRFQ := &model.RFQ{
			ID:     "rfq-1",
			Status: model.RFQStatusCancelled,
		}

		mockRepo.On("GetByID", ctx, "rfq-1").Return(existingRFQ, nil).Once()
		mockRepo.On("UpdateStatus", ctx, "rfq-1", model.RFQStatusCancelled).Return(nil).Once()
		mockRepo.On("GetByID", ctx, "rfq-1").Return(cancelledRFQ, nil).Once()

		svc := NewRFQService(mockRepo, nil)
		result, err := svc.Cancel(ctx, "rfq-1", "No longer needed", "user-1", "org-1")

		assert.NoError(t, err)
		assert.Equal(t, model.RFQStatusCancelled, result.Status)
	})

	t.Run("cannot cancel awarded RFQ", func(t *testing.T) {
		existingRFQ := &model.RFQ{
			ID:     "rfq-2",
			Status: model.RFQStatusAwarded,
		}

		mockRepo.On("GetByID", ctx, "rfq-2").Return(existingRFQ, nil).Once()

		svc := NewRFQService(mockRepo, nil)
		_, err := svc.Cancel(ctx, "rfq-2", "reason", "user-1", "org-1")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "cannot cancel")
	})
}

func TestRFQService_SubmitQuote(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockRFQRepository)

	deadline := time.Now().Add(48 * time.Hour)

	t.Run("submit valid quote", func(t *testing.T) {
		existingRFQ := &model.RFQ{
			ID:             "rfq-1",
			Status:         model.RFQStatusOpen,
			Deadline:       deadline,
			InvitedVendors: []string{"vendor-1", "vendor-2"},
		}
		input := model.SubmitQuoteInput{
			UnitPrice:  100.00,
			TotalPrice: 1000.00,
			Currency:   "USD",
		}
		expectedQuote := &model.Quote{
			ID:         "quote-1",
			RFQID:      "rfq-1",
			VendorID:   "vendor-1",
			Status:     model.QuoteStatusSubmitted,
			UnitPrice:  100.00,
			TotalPrice: 1000.00,
			Currency:   "USD",
		}

		mockRepo.On("GetByID", ctx, "rfq-1").Return(existingRFQ, nil).Once()
		mockRepo.On("GetQuoteByVendor", ctx, "rfq-1", "vendor-1").Return(nil, nil).Once()
		mockRepo.On("SubmitQuote", ctx, "rfq-1", "vendor-1", input).Return(expectedQuote, nil).Once()

		svc := NewRFQService(mockRepo, nil)
		result, err := svc.SubmitQuote(ctx, "rfq-1", "vendor-1", input, "user-1", "org-1")

		assert.NoError(t, err)
		assert.Equal(t, expectedQuote.ID, result.ID)
		assert.Equal(t, model.QuoteStatusSubmitted, result.Status)
	})

	t.Run("cannot submit to closed RFQ", func(t *testing.T) {
		existingRFQ := &model.RFQ{
			ID:     "rfq-2",
			Status: model.RFQStatusClosed,
		}

		mockRepo.On("GetByID", ctx, "rfq-2").Return(existingRFQ, nil).Once()

		svc := NewRFQService(mockRepo, nil)
		input := model.SubmitQuoteInput{UnitPrice: 100.00, TotalPrice: 1000.00, Currency: "USD"}
		_, err := svc.SubmitQuote(ctx, "rfq-2", "vendor-1", input, "user-1", "org-1")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "not open for quotes")
	})

	t.Run("cannot submit after deadline", func(t *testing.T) {
		existingRFQ := &model.RFQ{
			ID:       "rfq-3",
			Status:   model.RFQStatusOpen,
			Deadline: time.Now().Add(-1 * time.Hour),
		}

		mockRepo.On("GetByID", ctx, "rfq-3").Return(existingRFQ, nil).Once()

		svc := NewRFQService(mockRepo, nil)
		input := model.SubmitQuoteInput{UnitPrice: 100.00, TotalPrice: 1000.00, Currency: "USD"}
		_, err := svc.SubmitQuote(ctx, "rfq-3", "vendor-1", input, "user-1", "org-1")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "deadline has passed")
	})

	t.Run("uninvited vendor cannot submit", func(t *testing.T) {
		existingRFQ := &model.RFQ{
			ID:             "rfq-4",
			Status:         model.RFQStatusOpen,
			Deadline:       deadline,
			InvitedVendors: []string{"vendor-1", "vendor-2"},
		}

		mockRepo.On("GetByID", ctx, "rfq-4").Return(existingRFQ, nil).Once()

		svc := NewRFQService(mockRepo, nil)
		input := model.SubmitQuoteInput{UnitPrice: 100.00, TotalPrice: 1000.00, Currency: "USD"}
		_, err := svc.SubmitQuote(ctx, "rfq-4", "vendor-3", input, "user-1", "org-1")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "not invited")
	})

	t.Run("vendor cannot submit twice", func(t *testing.T) {
		existingRFQ := &model.RFQ{
			ID:             "rfq-5",
			Status:         model.RFQStatusOpen,
			Deadline:       deadline,
			InvitedVendors: []string{"vendor-1"},
		}
		existingQuote := &model.Quote{
			ID:       "quote-1",
			VendorID: "vendor-1",
		}

		mockRepo.On("GetByID", ctx, "rfq-5").Return(existingRFQ, nil).Once()
		mockRepo.On("GetQuoteByVendor", ctx, "rfq-5", "vendor-1").Return(existingQuote, nil).Once()

		svc := NewRFQService(mockRepo, nil)
		input := model.SubmitQuoteInput{UnitPrice: 100.00, TotalPrice: 1000.00, Currency: "USD"}
		_, err := svc.SubmitQuote(ctx, "rfq-5", "vendor-1", input, "user-1", "org-1")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "already submitted")
	})

	t.Run("invalid price validation", func(t *testing.T) {
		existingRFQ := &model.RFQ{
			ID:             "rfq-6",
			Status:         model.RFQStatusOpen,
			Deadline:       deadline,
			InvitedVendors: []string{"vendor-1"},
		}

		mockRepo.On("GetByID", ctx, "rfq-6").Return(existingRFQ, nil).Twice()
		mockRepo.On("GetQuoteByVendor", ctx, "rfq-6", "vendor-1").Return(nil, nil).Twice()

		svc := NewRFQService(mockRepo, nil)

		// Zero unit price
		input := model.SubmitQuoteInput{UnitPrice: 0, TotalPrice: 1000.00, Currency: "USD"}
		_, err := svc.SubmitQuote(ctx, "rfq-6", "vendor-1", input, "user-1", "org-1")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "unit_price must be greater than 0")

		// Zero total price
		input = model.SubmitQuoteInput{UnitPrice: 100.00, TotalPrice: 0, Currency: "USD"}
		_, err = svc.SubmitQuote(ctx, "rfq-6", "vendor-1", input, "user-1", "org-1")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "total_price must be greater than 0")
	})
}

func TestRFQService_AwardQuote(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockRFQRepository)

	t.Run("award quote successfully", func(t *testing.T) {
		existingRFQ := &model.RFQ{
			ID:     "rfq-1",
			Status: model.RFQStatusOpen,
		}
		quote := &model.Quote{
			ID:         "quote-1",
			RFQID:      "rfq-1",
			VendorID:   "vendor-1",
			Status:     model.QuoteStatusSubmitted,
			TotalPrice: 1000.00,
		}
		allQuotes := []model.Quote{*quote}
		awardedRFQ := &model.RFQ{
			ID:             "rfq-1",
			Status:         model.RFQStatusAwarded,
			AwardedQuoteID: strPtr("quote-1"),
		}

		mockRepo.On("GetByID", ctx, "rfq-1").Return(existingRFQ, nil).Once()
		mockRepo.On("GetQuote", ctx, "quote-1").Return(quote, nil).Once()
		mockRepo.On("UpdateQuoteStatus", ctx, "quote-1", model.QuoteStatusAccepted).Return(nil).Once()
		mockRepo.On("GetQuotesByRFQ", ctx, "rfq-1").Return(allQuotes, nil).Once()
		mockRepo.On("Award", ctx, "rfq-1", "quote-1").Return(nil).Once()
		mockRepo.On("GetByID", ctx, "rfq-1").Return(awardedRFQ, nil).Once()

		svc := NewRFQService(mockRepo, nil)
		result, err := svc.AwardQuote(ctx, "rfq-1", "quote-1", "user-1", "org-1")

		assert.NoError(t, err)
		assert.Equal(t, model.RFQStatusAwarded, result.Status)
		assert.Equal(t, "quote-1", *result.AwardedQuoteID)
	})

	t.Run("cannot award draft RFQ", func(t *testing.T) {
		existingRFQ := &model.RFQ{
			ID:     "rfq-2",
			Status: model.RFQStatusDraft,
		}

		mockRepo.On("GetByID", ctx, "rfq-2").Return(existingRFQ, nil).Once()

		svc := NewRFQService(mockRepo, nil)
		_, err := svc.AwardQuote(ctx, "rfq-2", "quote-1", "user-1", "org-1")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "can only award")
	})

	t.Run("quote not found", func(t *testing.T) {
		existingRFQ := &model.RFQ{
			ID:     "rfq-3",
			Status: model.RFQStatusOpen,
		}

		mockRepo.On("GetByID", ctx, "rfq-3").Return(existingRFQ, nil).Once()
		mockRepo.On("GetQuote", ctx, "quote-999").Return(nil, nil).Once()

		svc := NewRFQService(mockRepo, nil)
		_, err := svc.AwardQuote(ctx, "rfq-3", "quote-999", "user-1", "org-1")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "quote not found")
	})

	t.Run("quote belongs to different RFQ", func(t *testing.T) {
		existingRFQ := &model.RFQ{
			ID:     "rfq-4",
			Status: model.RFQStatusOpen,
		}
		quote := &model.Quote{
			ID:       "quote-1",
			RFQID:    "rfq-other",
			VendorID: "vendor-1",
		}

		mockRepo.On("GetByID", ctx, "rfq-4").Return(existingRFQ, nil).Once()
		mockRepo.On("GetQuote", ctx, "quote-1").Return(quote, nil).Once()

		svc := NewRFQService(mockRepo, nil)
		_, err := svc.AwardQuote(ctx, "rfq-4", "quote-1", "user-1", "org-1")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "does not belong to this RFQ")
	})
}

func TestRFQService_CompareQuotes(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockRFQRepository)

	t.Run("compare multiple quotes", func(t *testing.T) {
		existingRFQ := &model.RFQ{
			ID:     "rfq-1",
			Status: model.RFQStatusOpen,
		}
		quotes := []model.Quote{
			{ID: "quote-1", TotalPrice: 1000.00},
			{ID: "quote-2", TotalPrice: 800.00},
			{ID: "quote-3", TotalPrice: 1200.00},
		}

		mockRepo.On("GetByID", ctx, "rfq-1").Return(existingRFQ, nil).Once()
		mockRepo.On("GetQuotesByRFQ", ctx, "rfq-1").Return(quotes, nil).Once()

		svc := NewRFQService(mockRepo, nil)
		comparison, err := svc.CompareQuotes(ctx, "rfq-1")

		assert.NoError(t, err)
		assert.Equal(t, 3, comparison.QuoteCount)
		assert.Equal(t, 800.00, comparison.LowestPrice)
		assert.Equal(t, 1200.00, comparison.HighestPrice)
		assert.Equal(t, 1000.00, comparison.AveragePrice)
	})

	t.Run("no quotes yet", func(t *testing.T) {
		existingRFQ := &model.RFQ{
			ID:     "rfq-2",
			Status: model.RFQStatusOpen,
		}
		quotes := []model.Quote{}

		mockRepo.On("GetByID", ctx, "rfq-2").Return(existingRFQ, nil).Once()
		mockRepo.On("GetQuotesByRFQ", ctx, "rfq-2").Return(quotes, nil).Once()

		svc := NewRFQService(mockRepo, nil)
		comparison, err := svc.CompareQuotes(ctx, "rfq-2")

		assert.NoError(t, err)
		assert.Equal(t, 0, comparison.QuoteCount)
		assert.Equal(t, 0.0, comparison.LowestPrice)
		assert.Equal(t, 0.0, comparison.HighestPrice)
	})
}

func TestRFQService_WithdrawQuote(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockRFQRepository)

	t.Run("withdraw submitted quote", func(t *testing.T) {
		existingQuote := &model.Quote{
			ID:       "quote-1",
			RFQID:    "rfq-1",
			VendorID: "vendor-1",
			Status:   model.QuoteStatusSubmitted,
		}
		existingRFQ := &model.RFQ{
			ID:     "rfq-1",
			Status: model.RFQStatusOpen,
		}
		withdrawnQuote := &model.Quote{
			ID:       "quote-1",
			RFQID:    "rfq-1",
			VendorID: "vendor-1",
			Status:   model.QuoteStatusWithdrawn,
		}

		mockRepo.On("GetQuote", ctx, "quote-1").Return(existingQuote, nil).Once()
		mockRepo.On("GetByID", ctx, "rfq-1").Return(existingRFQ, nil).Once()
		mockRepo.On("UpdateQuoteStatus", ctx, "quote-1", model.QuoteStatusWithdrawn).Return(nil).Once()
		mockRepo.On("GetQuote", ctx, "quote-1").Return(withdrawnQuote, nil).Once()

		svc := NewRFQService(mockRepo, nil)
		result, err := svc.WithdrawQuote(ctx, "quote-1", "user-1", "org-1")

		assert.NoError(t, err)
		assert.Equal(t, model.QuoteStatusWithdrawn, result.Status)
	})

	t.Run("cannot withdraw accepted quote", func(t *testing.T) {
		existingQuote := &model.Quote{
			ID:     "quote-2",
			Status: model.QuoteStatusAccepted,
		}

		mockRepo.On("GetQuote", ctx, "quote-2").Return(existingQuote, nil).Once()

		svc := NewRFQService(mockRepo, nil)
		_, err := svc.WithdrawQuote(ctx, "quote-2", "user-1", "org-1")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "can only withdraw submitted quotes")
	})

	t.Run("cannot withdraw from closed RFQ", func(t *testing.T) {
		existingQuote := &model.Quote{
			ID:     "quote-3",
			RFQID:  "rfq-3",
			Status: model.QuoteStatusSubmitted,
		}
		existingRFQ := &model.RFQ{
			ID:     "rfq-3",
			Status: model.RFQStatusClosed,
		}

		mockRepo.On("GetQuote", ctx, "quote-3").Return(existingQuote, nil).Once()
		mockRepo.On("GetByID", ctx, "rfq-3").Return(existingRFQ, nil).Once()

		svc := NewRFQService(mockRepo, nil)
		_, err := svc.WithdrawQuote(ctx, "quote-3", "user-1", "org-1")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "no longer open")
	})
}

func TestRFQService_List(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockRFQRepository)

	filter := model.RFQFilter{
		Page:    1,
		PerPage: 10,
	}

	rfqs := []model.RFQ{
		{ID: "rfq-1", Reference: "RFQ-001", Status: model.RFQStatusDraft},
		{ID: "rfq-2", Reference: "RFQ-002", Status: model.RFQStatusOpen},
	}

	mockRepo.On("List", ctx, filter).Return(rfqs, 2, nil)

	svc := NewRFQService(mockRepo, nil)
	result, err := svc.List(ctx, filter)

	assert.NoError(t, err)
	assert.Equal(t, 2, result.Total)
	assert.Len(t, result.RFQs, 2)
	assert.Equal(t, 1, result.Page)
	assert.Equal(t, 10, result.PerPage)
}
