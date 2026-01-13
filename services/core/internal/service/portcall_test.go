package service

import (
	"context"
	"testing"
	"time"

	"github.com/navo/services/core/internal/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockPortCallRepository is a mock implementation of the port call repository
type MockPortCallRepository struct {
	mock.Mock
}

func (m *MockPortCallRepository) Create(ctx context.Context, input model.CreatePortCallInput, userID string) (*model.PortCall, error) {
	args := m.Called(ctx, input, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.PortCall), args.Error(1)
}

func (m *MockPortCallRepository) GetByID(ctx context.Context, id string) (*model.PortCall, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.PortCall), args.Error(1)
}

func (m *MockPortCallRepository) List(ctx context.Context, filter model.PortCallFilter) ([]model.PortCall, int, error) {
	args := m.Called(ctx, filter)
	return args.Get(0).([]model.PortCall), args.Int(1), args.Error(2)
}

func (m *MockPortCallRepository) Update(ctx context.Context, id string, input model.UpdatePortCallInput) (*model.PortCall, error) {
	args := m.Called(ctx, id, input)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.PortCall), args.Error(1)
}

func (m *MockPortCallRepository) Delete(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockPortCallRepository) GetServiceOrders(ctx context.Context, portCallID string) ([]model.ServiceOrder, error) {
	args := m.Called(ctx, portCallID)
	return args.Get(0).([]model.ServiceOrder), args.Error(1)
}

func (m *MockPortCallRepository) GetTimelineEvents(ctx context.Context, portCallID string) ([]model.TimelineEvent, error) {
	args := m.Called(ctx, portCallID)
	return args.Get(0).([]model.TimelineEvent), args.Error(1)
}

func (m *MockPortCallRepository) CreateTimelineEvent(ctx context.Context, event model.TimelineEvent) error {
	args := m.Called(ctx, event)
	return args.Error(0)
}

func TestPortCallService_ValidateStatusTransition(t *testing.T) {
	svc := &PortCallService{}

	tests := []struct {
		name    string
		from    model.PortCallStatus
		to      model.PortCallStatus
		wantErr bool
	}{
		// Valid transitions
		{"draft to planned", model.PortCallStatusDraft, model.PortCallStatusPlanned, false},
		{"draft to cancelled", model.PortCallStatusDraft, model.PortCallStatusCancelled, false},
		{"planned to confirmed", model.PortCallStatusPlanned, model.PortCallStatusConfirmed, false},
		{"planned to cancelled", model.PortCallStatusPlanned, model.PortCallStatusCancelled, false},
		{"confirmed to arrived", model.PortCallStatusConfirmed, model.PortCallStatusArrived, false},
		{"arrived to alongside", model.PortCallStatusArrived, model.PortCallStatusAlongside, false},
		{"alongside to departed", model.PortCallStatusAlongside, model.PortCallStatusDeparted, false},
		{"departed to completed", model.PortCallStatusDeparted, model.PortCallStatusCompleted, false},

		// Invalid transitions
		{"draft to completed", model.PortCallStatusDraft, model.PortCallStatusCompleted, true},
		{"completed to draft", model.PortCallStatusCompleted, model.PortCallStatusDraft, true},
		{"cancelled to planned", model.PortCallStatusCancelled, model.PortCallStatusPlanned, true},
		{"arrived to planned", model.PortCallStatusArrived, model.PortCallStatusPlanned, true},
		{"draft to arrived", model.PortCallStatusDraft, model.PortCallStatusArrived, true},
		{"departed to arrived", model.PortCallStatusDeparted, model.PortCallStatusArrived, true},
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

func TestPortCallService_Create_Validation(t *testing.T) {
	ctx := context.Background()

	tests := []struct {
		name    string
		input   model.CreatePortCallInput
		wantErr string
	}{
		{
			name:    "missing vessel_id",
			input:   model.CreatePortCallInput{PortID: "port-1", WorkspaceID: "ws-1"},
			wantErr: "vessel_id is required",
		},
		{
			name:    "missing port_id",
			input:   model.CreatePortCallInput{VesselID: "vessel-1", WorkspaceID: "ws-1"},
			wantErr: "port_id is required",
		},
		{
			name:    "missing workspace_id",
			input:   model.CreatePortCallInput{VesselID: "vessel-1", PortID: "port-1"},
			wantErr: "workspace_id is required",
		},
		{
			name: "ETD before ETA",
			input: model.CreatePortCallInput{
				VesselID:    "vessel-1",
				PortID:      "port-1",
				WorkspaceID: "ws-1",
				ETA:         timePtr(time.Now().Add(48 * time.Hour)),
				ETD:         timePtr(time.Now().Add(24 * time.Hour)),
			},
			wantErr: "ETD cannot be before ETA",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Service with nil repo will fail on repo call but validation should fail first
			svc := &PortCallService{}
			_, err := svc.Create(ctx, tt.input, "user-1")
			assert.Error(t, err)
			assert.Contains(t, err.Error(), tt.wantErr)
		})
	}
}

func TestPortCallService_Create_Success(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockPortCallRepository)

	now := time.Now().UTC()
	eta := now.Add(24 * time.Hour)
	etd := now.Add(48 * time.Hour)

	input := model.CreatePortCallInput{
		VesselID:    "vessel-1",
		PortID:      "port-1",
		WorkspaceID: "ws-1",
		ETA:         &eta,
		ETD:         &etd,
	}

	expectedPortCall := &model.PortCall{
		ID:          "pc-1",
		Reference:   "PC-2024-001",
		VesselID:    "vessel-1",
		PortID:      "port-1",
		WorkspaceID: "ws-1",
		Status:      model.PortCallStatusDraft,
		ETA:         &eta,
		ETD:         &etd,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	mockRepo.On("Create", ctx, input, "user-1").Return(expectedPortCall, nil)
	mockRepo.On("CreateTimelineEvent", ctx, mock.AnythingOfType("model.TimelineEvent")).Return(nil)

	svc := NewPortCallService(mockRepo, nil)
	result, err := svc.Create(ctx, input, "user-1")

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, expectedPortCall.ID, result.ID)
	assert.Equal(t, expectedPortCall.Reference, result.Reference)
	assert.Equal(t, model.PortCallStatusDraft, result.Status)

	mockRepo.AssertExpectations(t)
}

func TestPortCallService_GetByID(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockPortCallRepository)

	t.Run("found", func(t *testing.T) {
		expectedPortCall := &model.PortCall{
			ID:        "pc-1",
			Reference: "PC-2024-001",
			Status:    model.PortCallStatusPlanned,
		}

		mockRepo.On("GetByID", ctx, "pc-1").Return(expectedPortCall, nil).Once()

		svc := NewPortCallService(mockRepo, nil)
		result, err := svc.GetByID(ctx, "pc-1")

		assert.NoError(t, err)
		assert.Equal(t, expectedPortCall.ID, result.ID)
	})

	t.Run("not found", func(t *testing.T) {
		mockRepo.On("GetByID", ctx, "pc-999").Return(nil, nil).Once()

		svc := NewPortCallService(mockRepo, nil)
		result, err := svc.GetByID(ctx, "pc-999")

		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "not found")
	})
}

func TestPortCallService_Delete(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockPortCallRepository)

	t.Run("delete draft", func(t *testing.T) {
		existingPortCall := &model.PortCall{
			ID:          "pc-1",
			Status:      model.PortCallStatusDraft,
			WorkspaceID: "ws-1",
		}

		mockRepo.On("GetByID", ctx, "pc-1").Return(existingPortCall, nil).Once()
		mockRepo.On("Delete", ctx, "pc-1").Return(nil).Once()

		svc := NewPortCallService(mockRepo, nil)
		err := svc.Delete(ctx, "pc-1")

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("cannot delete non-draft", func(t *testing.T) {
		existingPortCall := &model.PortCall{
			ID:     "pc-2",
			Status: model.PortCallStatusPlanned,
		}

		mockRepo.On("GetByID", ctx, "pc-2").Return(existingPortCall, nil).Once()

		svc := NewPortCallService(mockRepo, nil)
		err := svc.Delete(ctx, "pc-2")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "draft status")
	})
}

func TestPortCallService_List(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockPortCallRepository)

	filter := model.PortCallFilter{
		WorkspaceID: "ws-1",
		Page:        1,
		PerPage:     10,
	}

	portCalls := []model.PortCall{
		{ID: "pc-1", Reference: "PC-001"},
		{ID: "pc-2", Reference: "PC-002"},
	}

	mockRepo.On("List", ctx, filter).Return(portCalls, 2, nil)

	svc := NewPortCallService(mockRepo, nil)
	result, err := svc.List(ctx, filter)

	assert.NoError(t, err)
	assert.Equal(t, 2, result.Total)
	assert.Len(t, result.PortCalls, 2)
	assert.Equal(t, 1, result.Page)
	assert.Equal(t, 10, result.PerPage)
}

func TestPortCallService_ChangeStatus(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockPortCallRepository)

	existingPortCall := &model.PortCall{
		ID:          "pc-1",
		Status:      model.PortCallStatusConfirmed,
		WorkspaceID: "ws-1",
	}

	updatedPortCall := &model.PortCall{
		ID:          "pc-1",
		Status:      model.PortCallStatusArrived,
		WorkspaceID: "ws-1",
	}

	mockRepo.On("GetByID", ctx, "pc-1").Return(existingPortCall, nil).Once()
	mockRepo.On("Update", ctx, "pc-1", mock.AnythingOfType("model.UpdatePortCallInput")).Return(updatedPortCall, nil).Once()
	mockRepo.On("CreateTimelineEvent", ctx, mock.AnythingOfType("model.TimelineEvent")).Return(nil)

	svc := NewPortCallService(mockRepo, nil)
	result, err := svc.ChangeStatus(ctx, "pc-1", model.PortCallStatusArrived, "user-1")

	assert.NoError(t, err)
	assert.Equal(t, model.PortCallStatusArrived, result.Status)
}

func TestPortCallService_ConfirmBerth(t *testing.T) {
	ctx := context.Background()
	mockRepo := new(MockPortCallRepository)

	existingPortCall := &model.PortCall{
		ID:          "pc-1",
		Status:      model.PortCallStatusPlanned,
		WorkspaceID: "ws-1",
	}

	berthName := "Berth A"
	berthTerminal := "Terminal 1"
	updatedPortCall := &model.PortCall{
		ID:            "pc-1",
		Status:        model.PortCallStatusPlanned,
		BerthName:     &berthName,
		BerthTerminal: &berthTerminal,
		WorkspaceID:   "ws-1",
	}

	mockRepo.On("GetByID", ctx, "pc-1").Return(existingPortCall, nil).Once()
	mockRepo.On("Update", ctx, "pc-1", mock.AnythingOfType("model.UpdatePortCallInput")).Return(updatedPortCall, nil).Once()
	mockRepo.On("CreateTimelineEvent", ctx, mock.AnythingOfType("model.TimelineEvent")).Return(nil)

	svc := NewPortCallService(mockRepo, nil)
	result, err := svc.ConfirmBerth(ctx, "pc-1", berthName, berthTerminal, "user-1")

	assert.NoError(t, err)
	assert.Equal(t, berthName, *result.BerthName)
	assert.Equal(t, berthTerminal, *result.BerthTerminal)
}

func timePtr(t time.Time) *time.Time {
	return &t
}
