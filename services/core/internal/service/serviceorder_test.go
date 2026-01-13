package service

import (
	"context"
	"testing"
	"time"

	"github.com/navo/services/core/internal/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockServiceOrderRepository is a mock implementation of the service order repository
type MockServiceOrderRepository struct {
	mock.Mock
}

func (m *MockServiceOrderRepository) Create(ctx context.Context, input model.CreateServiceOrderInput, userID string) (*model.ServiceOrder, error) {
	args := m.Called(ctx, input, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.ServiceOrder), args.Error(1)
}

func (m *MockServiceOrderRepository) GetByID(ctx context.Context, id string) (*model.ServiceOrder, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.ServiceOrder), args.Error(1)
}

func (m *MockServiceOrderRepository) List(ctx context.Context, filter model.ServiceOrderFilter) ([]model.ServiceOrder, int, error) {
	args := m.Called(ctx, filter)
	return args.Get(0).([]model.ServiceOrder), args.Int(1), args.Error(2)
}

func (m *MockServiceOrderRepository) Update(ctx context.Context, id string, input model.UpdateServiceOrderInput) (*model.ServiceOrder, error) {
	args := m.Called(ctx, id, input)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.ServiceOrder), args.Error(1)
}

func (m *MockServiceOrderRepository) Delete(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockServiceOrderRepository) Confirm(ctx context.Context, id string, vendorID string, quotedPrice float64) (*model.ServiceOrder, error) {
	args := m.Called(ctx, id, vendorID, quotedPrice)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.ServiceOrder), args.Error(1)
}

func (m *MockServiceOrderRepository) Complete(ctx context.Context, id string, finalPrice *float64) (*model.ServiceOrder, error) {
	args := m.Called(ctx, id, finalPrice)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.ServiceOrder), args.Error(1)
}

func TestServiceOrderService_ValidateStatusTransition(t *testing.T) {
	svc := &ServiceOrderService{}

	tests := []struct {
		name    string
		from    model.ServiceOrderStatus
		to      model.ServiceOrderStatus
		wantErr bool
	}{
		// Valid transitions
		{"draft to requested", model.ServiceOrderStatusDraft, model.ServiceOrderStatusRequested, false},
		{"draft to cancelled", model.ServiceOrderStatusDraft, model.ServiceOrderStatusCancelled, false},
		{"requested to rfq_sent", model.ServiceOrderStatusRequested, model.ServiceOrderStatusRFQSent, false},
		{"requested to quoted", model.ServiceOrderStatusRequested, model.ServiceOrderStatusQuoted, false},
		{"requested to confirmed", model.ServiceOrderStatusRequested, model.ServiceOrderStatusConfirmed, false},
		{"rfq_sent to quoted", model.ServiceOrderStatusRFQSent, model.ServiceOrderStatusQuoted, false},
		{"quoted to confirmed", model.ServiceOrderStatusQuoted, model.ServiceOrderStatusConfirmed, false},
		{"confirmed to in_progress", model.ServiceOrderStatusConfirmed, model.ServiceOrderStatusInProgress, false},
		{"in_progress to completed", model.ServiceOrderStatusInProgress, model.ServiceOrderStatusCompleted, false},

		// Invalid transitions
		{"draft to completed", model.ServiceOrderStatusDraft, model.ServiceOrderStatusCompleted, true},
		{"completed to draft", model.ServiceOrderStatusCompleted, model.ServiceOrderStatusDraft, true},
		{"cancelled to requested", model.ServiceOrderStatusCancelled, model.ServiceOrderStatusRequested, true},
		{"in_progress to draft", model.ServiceOrderStatusInProgress, model.ServiceOrderStatusDraft, true},
		{"quoted to draft", model.ServiceOrderStatusQuoted, model.ServiceOrderStatusDraft, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := svc.validateStatusTransition(tt.from, tt.to)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestServiceOrderService_Create_Validation(t *testing.T) {
	ctx := context.Background()

	tests := []struct {
		name    string
		input   model.CreateServiceOrderInput
		wantErr string
	}{
		{
			name:    "missing port_call_id",
			input:   model.CreateServiceOrderInput{ServiceTypeID: "svc-1"},
			wantErr: "port_call_id is required",
		},
		{
			name:    "missing service_type_id",
			input:   model.CreateServiceOrderInput{PortCallID: "pc-1"},
			wantErr: "service_type_id is required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := &ServiceOrderService{}
			_, err := svc.Create(ctx, tt.input, "user-1", "org-1")
			assert.Error(t, err)
			assert.Contains(t, err.Error(), tt.wantErr)
		})
	}
}

func TestServiceOrderService_Create_Success(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockServiceOrderRepository)

	now := time.Now().UTC()
	input := model.CreateServiceOrderInput{
		PortCallID:    "pc-1",
		ServiceTypeID: "svc-1",
	}

	expectedOrder := &model.ServiceOrder{
		ID:            "so-1",
		PortCallID:    "pc-1",
		ServiceTypeID: "svc-1",
		Status:        model.ServiceOrderStatusDraft,
		Currency:      "USD",
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	mockRepo.On("Create", ctx, input, "user-1").Return(expectedOrder, nil)

	svc := NewServiceOrderService(mockRepo, nil)
	result, err := svc.Create(ctx, input, "user-1", "org-1")

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, expectedOrder.ID, result.ID)
	assert.Equal(t, model.ServiceOrderStatusDraft, result.Status)

	mockRepo.AssertExpectations(t)
}

func TestServiceOrderService_GetByID(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockServiceOrderRepository)

	t.Run("found", func(t *testing.T) {
		expectedOrder := &model.ServiceOrder{
			ID:     "so-1",
			Status: model.ServiceOrderStatusDraft,
		}

		mockRepo.On("GetByID", ctx, "so-1").Return(expectedOrder, nil).Once()

		svc := NewServiceOrderService(mockRepo, nil)
		result, err := svc.GetByID(ctx, "so-1")

		assert.NoError(t, err)
		assert.Equal(t, expectedOrder.ID, result.ID)
	})

	t.Run("not found", func(t *testing.T) {
		mockRepo.On("GetByID", ctx, "so-999").Return(nil, nil).Once()

		svc := NewServiceOrderService(mockRepo, nil)
		result, err := svc.GetByID(ctx, "so-999")

		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "not found")
	})
}

func TestServiceOrderService_Delete(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockServiceOrderRepository)

	t.Run("delete draft order", func(t *testing.T) {
		existingOrder := &model.ServiceOrder{
			ID:     "so-1",
			Status: model.ServiceOrderStatusDraft,
		}

		mockRepo.On("GetByID", ctx, "so-1").Return(existingOrder, nil).Once()
		mockRepo.On("Delete", ctx, "so-1").Return(nil).Once()

		svc := NewServiceOrderService(mockRepo, nil)
		err := svc.Delete(ctx, "so-1", "user-1", "org-1")

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("delete requested order", func(t *testing.T) {
		existingOrder := &model.ServiceOrder{
			ID:     "so-2",
			Status: model.ServiceOrderStatusRequested,
		}

		mockRepo.On("GetByID", ctx, "so-2").Return(existingOrder, nil).Once()
		mockRepo.On("Delete", ctx, "so-2").Return(nil).Once()

		svc := NewServiceOrderService(mockRepo, nil)
		err := svc.Delete(ctx, "so-2", "user-1", "org-1")

		assert.NoError(t, err)
	})

	t.Run("cannot delete confirmed order", func(t *testing.T) {
		existingOrder := &model.ServiceOrder{
			ID:     "so-3",
			Status: model.ServiceOrderStatusConfirmed,
		}

		mockRepo.On("GetByID", ctx, "so-3").Return(existingOrder, nil).Once()

		svc := NewServiceOrderService(mockRepo, nil)
		err := svc.Delete(ctx, "so-3", "user-1", "org-1")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "draft or requested status")
	})
}

func TestServiceOrderService_Confirm(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockServiceOrderRepository)

	t.Run("confirm from draft", func(t *testing.T) {
		existingOrder := &model.ServiceOrder{
			ID:     "so-1",
			Status: model.ServiceOrderStatusDraft,
		}
		confirmedOrder := &model.ServiceOrder{
			ID:          "so-1",
			Status:      model.ServiceOrderStatusConfirmed,
			VendorID:    strPtr("vendor-1"),
			QuotedPrice: floatPtr(1000.00),
		}

		mockRepo.On("GetByID", ctx, "so-1").Return(existingOrder, nil).Once()
		mockRepo.On("Confirm", ctx, "so-1", "vendor-1", 1000.00).Return(confirmedOrder, nil).Once()

		svc := NewServiceOrderService(mockRepo, nil)
		result, err := svc.Confirm(ctx, "so-1", "vendor-1", 1000.00, "user-1", "org-1")

		assert.NoError(t, err)
		assert.Equal(t, model.ServiceOrderStatusConfirmed, result.Status)
		assert.Equal(t, 1000.00, *result.QuotedPrice)
	})

	t.Run("missing vendor_id", func(t *testing.T) {
		existingOrder := &model.ServiceOrder{
			ID:     "so-1",
			Status: model.ServiceOrderStatusDraft,
		}

		mockRepo.On("GetByID", ctx, "so-1").Return(existingOrder, nil).Once()

		svc := NewServiceOrderService(mockRepo, nil)
		_, err := svc.Confirm(ctx, "so-1", "", 1000.00, "user-1", "org-1")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "vendor_id is required")
	})

	t.Run("invalid price", func(t *testing.T) {
		existingOrder := &model.ServiceOrder{
			ID:     "so-1",
			Status: model.ServiceOrderStatusDraft,
		}

		mockRepo.On("GetByID", ctx, "so-1").Return(existingOrder, nil).Once()

		svc := NewServiceOrderService(mockRepo, nil)
		_, err := svc.Confirm(ctx, "so-1", "vendor-1", 0, "user-1", "org-1")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "quoted_price must be greater than 0")
	})

	t.Run("cannot confirm completed order", func(t *testing.T) {
		existingOrder := &model.ServiceOrder{
			ID:     "so-1",
			Status: model.ServiceOrderStatusCompleted,
		}

		mockRepo.On("GetByID", ctx, "so-1").Return(existingOrder, nil).Once()

		svc := NewServiceOrderService(mockRepo, nil)
		_, err := svc.Confirm(ctx, "so-1", "vendor-1", 1000.00, "user-1", "org-1")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "cannot confirm")
	})
}

func TestServiceOrderService_Complete(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockServiceOrderRepository)

	t.Run("complete confirmed order", func(t *testing.T) {
		existingOrder := &model.ServiceOrder{
			ID:     "so-1",
			Status: model.ServiceOrderStatusConfirmed,
		}
		completedOrder := &model.ServiceOrder{
			ID:         "so-1",
			Status:     model.ServiceOrderStatusCompleted,
			FinalPrice: floatPtr(1000.00),
		}

		mockRepo.On("GetByID", ctx, "so-1").Return(existingOrder, nil).Once()
		mockRepo.On("Complete", ctx, "so-1", (*float64)(nil)).Return(completedOrder, nil).Once()

		svc := NewServiceOrderService(mockRepo, nil)
		result, err := svc.Complete(ctx, "so-1", nil, "user-1", "org-1")

		assert.NoError(t, err)
		assert.Equal(t, model.ServiceOrderStatusCompleted, result.Status)
	})

	t.Run("complete in_progress order", func(t *testing.T) {
		existingOrder := &model.ServiceOrder{
			ID:     "so-2",
			Status: model.ServiceOrderStatusInProgress,
		}
		finalPrice := 1200.00
		completedOrder := &model.ServiceOrder{
			ID:         "so-2",
			Status:     model.ServiceOrderStatusCompleted,
			FinalPrice: &finalPrice,
		}

		mockRepo.On("GetByID", ctx, "so-2").Return(existingOrder, nil).Once()
		mockRepo.On("Complete", ctx, "so-2", &finalPrice).Return(completedOrder, nil).Once()

		svc := NewServiceOrderService(mockRepo, nil)
		result, err := svc.Complete(ctx, "so-2", &finalPrice, "user-1", "org-1")

		assert.NoError(t, err)
		assert.Equal(t, 1200.00, *result.FinalPrice)
	})

	t.Run("cannot complete draft order", func(t *testing.T) {
		existingOrder := &model.ServiceOrder{
			ID:     "so-3",
			Status: model.ServiceOrderStatusDraft,
		}

		mockRepo.On("GetByID", ctx, "so-3").Return(existingOrder, nil).Once()

		svc := NewServiceOrderService(mockRepo, nil)
		_, err := svc.Complete(ctx, "so-3", nil, "user-1", "org-1")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "cannot complete")
	})
}

func TestServiceOrderService_StartWork(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockServiceOrderRepository)

	t.Run("start work on confirmed order", func(t *testing.T) {
		existingOrder := &model.ServiceOrder{
			ID:     "so-1",
			Status: model.ServiceOrderStatusConfirmed,
		}
		inProgressOrder := &model.ServiceOrder{
			ID:     "so-1",
			Status: model.ServiceOrderStatusInProgress,
		}

		mockRepo.On("GetByID", ctx, "so-1").Return(existingOrder, nil).Once()
		mockRepo.On("Update", ctx, "so-1", mock.AnythingOfType("model.UpdateServiceOrderInput")).Return(inProgressOrder, nil).Once()

		svc := NewServiceOrderService(mockRepo, nil)
		result, err := svc.StartWork(ctx, "so-1", "user-1", "org-1")

		assert.NoError(t, err)
		assert.Equal(t, model.ServiceOrderStatusInProgress, result.Status)
	})

	t.Run("cannot start work on draft", func(t *testing.T) {
		existingOrder := &model.ServiceOrder{
			ID:     "so-2",
			Status: model.ServiceOrderStatusDraft,
		}

		mockRepo.On("GetByID", ctx, "so-2").Return(existingOrder, nil).Once()

		svc := NewServiceOrderService(mockRepo, nil)
		_, err := svc.StartWork(ctx, "so-2", "user-1", "org-1")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "can only start work on confirmed orders")
	})
}

func TestServiceOrderService_Cancel(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockServiceOrderRepository)

	t.Run("cancel draft order", func(t *testing.T) {
		existingOrder := &model.ServiceOrder{
			ID:     "so-1",
			Status: model.ServiceOrderStatusDraft,
		}
		cancelledOrder := &model.ServiceOrder{
			ID:     "so-1",
			Status: model.ServiceOrderStatusCancelled,
		}

		mockRepo.On("GetByID", ctx, "so-1").Return(existingOrder, nil).Once()
		mockRepo.On("Update", ctx, "so-1", mock.AnythingOfType("model.UpdateServiceOrderInput")).Return(cancelledOrder, nil).Once()

		svc := NewServiceOrderService(mockRepo, nil)
		result, err := svc.Cancel(ctx, "so-1", "No longer needed", "user-1", "org-1")

		assert.NoError(t, err)
		assert.Equal(t, model.ServiceOrderStatusCancelled, result.Status)
	})

	t.Run("cannot cancel completed order", func(t *testing.T) {
		existingOrder := &model.ServiceOrder{
			ID:     "so-2",
			Status: model.ServiceOrderStatusCompleted,
		}

		mockRepo.On("GetByID", ctx, "so-2").Return(existingOrder, nil).Once()

		svc := NewServiceOrderService(mockRepo, nil)
		_, err := svc.Cancel(ctx, "so-2", "reason", "user-1", "org-1")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "cannot cancel completed orders")
	})

	t.Run("cannot cancel already cancelled order", func(t *testing.T) {
		existingOrder := &model.ServiceOrder{
			ID:     "so-3",
			Status: model.ServiceOrderStatusCancelled,
		}

		mockRepo.On("GetByID", ctx, "so-3").Return(existingOrder, nil).Once()

		svc := NewServiceOrderService(mockRepo, nil)
		_, err := svc.Cancel(ctx, "so-3", "reason", "user-1", "org-1")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "already cancelled")
	})
}

func TestServiceOrderService_List(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockServiceOrderRepository)

	filter := model.ServiceOrderFilter{
		Page:    1,
		PerPage: 10,
	}

	orders := []model.ServiceOrder{
		{ID: "so-1", Status: model.ServiceOrderStatusDraft},
		{ID: "so-2", Status: model.ServiceOrderStatusConfirmed},
	}

	mockRepo.On("List", ctx, filter).Return(orders, 2, nil)

	svc := NewServiceOrderService(mockRepo, nil)
	result, err := svc.List(ctx, filter)

	assert.NoError(t, err)
	assert.Equal(t, 2, result.Total)
	assert.Len(t, result.ServiceOrders, 2)
	assert.Equal(t, 1, result.Page)
	assert.Equal(t, 10, result.PerPage)
}

func TestServiceOrderService_AssignVendor(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockServiceOrderRepository)

	t.Run("assign vendor to draft order", func(t *testing.T) {
		existingOrder := &model.ServiceOrder{
			ID:     "so-1",
			Status: model.ServiceOrderStatusDraft,
		}
		updatedOrder := &model.ServiceOrder{
			ID:       "so-1",
			Status:   model.ServiceOrderStatusDraft,
			VendorID: strPtr("vendor-1"),
		}

		mockRepo.On("GetByID", ctx, "so-1").Return(existingOrder, nil).Once()
		mockRepo.On("Update", ctx, "so-1", mock.AnythingOfType("model.UpdateServiceOrderInput")).Return(updatedOrder, nil).Once()

		svc := NewServiceOrderService(mockRepo, nil)
		result, err := svc.AssignVendor(ctx, "so-1", "vendor-1", "user-1", "org-1")

		assert.NoError(t, err)
		assert.Equal(t, "vendor-1", *result.VendorID)
	})

	t.Run("cannot assign vendor to confirmed order", func(t *testing.T) {
		existingOrder := &model.ServiceOrder{
			ID:     "so-2",
			Status: model.ServiceOrderStatusConfirmed,
		}

		mockRepo.On("GetByID", ctx, "so-2").Return(existingOrder, nil).Once()

		svc := NewServiceOrderService(mockRepo, nil)
		_, err := svc.AssignVendor(ctx, "so-2", "vendor-1", "user-1", "org-1")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "cannot change vendor")
	})
}

// Helper functions
func strPtr(s string) *string {
	return &s
}

func floatPtr(f float64) *float64 {
	return &f
}
