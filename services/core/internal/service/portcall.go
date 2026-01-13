package service

import (
	"context"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/navo/pkg/audit"
	"github.com/navo/pkg/logger"
	"github.com/navo/services/core/internal/model"
	"github.com/navo/services/core/internal/repository"
	"go.uber.org/zap"
)

// PortCallService handles port call business logic
type PortCallService struct {
	repo        *repository.PortCallRepository
	cache       *redis.Client
	auditLogger audit.Logger
}

// PortCallServiceConfig holds configuration for the port call service
type PortCallServiceConfig struct {
	AuditLogger audit.Logger
}

// NewPortCallService creates a new port call service
func NewPortCallService(repo *repository.PortCallRepository, cache *redis.Client) *PortCallService {
	return &PortCallService{
		repo:  repo,
		cache: cache,
	}
}

// NewPortCallServiceWithConfig creates a new port call service with configuration
func NewPortCallServiceWithConfig(repo *repository.PortCallRepository, cache *redis.Client, cfg *PortCallServiceConfig) *PortCallService {
	svc := &PortCallService{
		repo:  repo,
		cache: cache,
	}
	if cfg != nil {
		svc.auditLogger = cfg.AuditLogger
	}
	return svc
}

// Create creates a new port call
func (s *PortCallService) Create(ctx context.Context, input model.CreatePortCallInput, userID string) (*model.PortCall, error) {
	// Validate input
	if input.VesselID == "" {
		return nil, fmt.Errorf("vessel_id is required")
	}
	if input.PortID == "" {
		return nil, fmt.Errorf("port_id is required")
	}
	if input.WorkspaceID == "" {
		return nil, fmt.Errorf("workspace_id is required")
	}

	// Validate ETA/ETD
	if input.ETA != nil && input.ETD != nil {
		if input.ETD.Before(*input.ETA) {
			return nil, fmt.Errorf("ETD cannot be before ETA")
		}
	}

	portCall, err := s.repo.Create(ctx, input, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to create port call: %w", err)
	}

	// Create timeline event for creation
	timelineEvent := model.TimelineEvent{
		PortCallID:  portCall.ID,
		EventType:   model.TimelineEventCreated,
		Title:       "Port call created",
		Description: fmt.Sprintf("Port call %s created", portCall.Reference),
		CreatedBy:   userID,
		CreatedAt:   time.Now().UTC(),
	}
	if err := s.repo.CreateTimelineEvent(ctx, timelineEvent); err != nil {
		logger.Warn("Failed to create timeline event", zap.Error(err))
	}

	// Audit log
	s.logAudit(ctx, audit.ActionCreate, audit.EntityPortCall, portCall.ID, nil, portCall, userID)

	// Invalidate cache if needed
	s.invalidateCache(ctx, input.WorkspaceID)

	return portCall, nil
}

// GetByID retrieves a port call by ID
func (s *PortCallService) GetByID(ctx context.Context, id string) (*model.PortCall, error) {
	portCall, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get port call: %w", err)
	}
	if portCall == nil {
		return nil, fmt.Errorf("port call not found")
	}

	return portCall, nil
}

// List retrieves port calls with filters
func (s *PortCallService) List(ctx context.Context, filter model.PortCallFilter) (*PortCallListResult, error) {
	portCalls, total, err := s.repo.List(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to list port calls: %w", err)
	}

	return &PortCallListResult{
		PortCalls: portCalls,
		Total:     total,
		Page:      filter.Page,
		PerPage:   filter.PerPage,
	}, nil
}

// Update updates a port call
func (s *PortCallService) Update(ctx context.Context, id string, input model.UpdatePortCallInput) (*model.PortCall, error) {
	return s.UpdateWithUser(ctx, id, input, "system")
}

// UpdateWithUser updates a port call with user context for audit
func (s *PortCallService) UpdateWithUser(ctx context.Context, id string, input model.UpdatePortCallInput, userID string) (*model.PortCall, error) {
	// Get existing port call
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get port call: %w", err)
	}
	if existing == nil {
		return nil, fmt.Errorf("port call not found")
	}

	// Validate status transitions
	if input.Status != nil {
		if err := s.validateStatusTransition(existing.Status, *input.Status); err != nil {
			return nil, err
		}
	}

	portCall, err := s.repo.Update(ctx, id, input)
	if err != nil {
		return nil, fmt.Errorf("failed to update port call: %w", err)
	}

	// Create timeline events for significant changes
	s.createUpdateTimelineEvents(ctx, existing, portCall, input, userID)

	// Audit log
	s.logAudit(ctx, audit.ActionUpdate, audit.EntityPortCall, portCall.ID, existing, portCall, userID)

	s.invalidateCache(ctx, existing.WorkspaceID)

	return portCall, nil
}

// createUpdateTimelineEvents creates timeline events for port call updates
func (s *PortCallService) createUpdateTimelineEvents(ctx context.Context, old, new *model.PortCall, input model.UpdatePortCallInput, userID string) {
	// Status change
	if input.Status != nil && old.Status != new.Status {
		oldStatus := string(old.Status)
		newStatus := string(new.Status)
		event := model.TimelineEvent{
			PortCallID:  new.ID,
			EventType:   model.TimelineEventStatusChanged,
			Title:       fmt.Sprintf("Status changed to %s", new.Status),
			Description: fmt.Sprintf("Status changed from %s to %s", old.Status, new.Status),
			OldValue:    &oldStatus,
			NewValue:    &newStatus,
			CreatedBy:   userID,
			CreatedAt:   time.Now().UTC(),
		}
		if err := s.repo.CreateTimelineEvent(ctx, event); err != nil {
			logger.Warn("Failed to create timeline event", zap.Error(err))
		}
	}

	// Berth confirmed
	if input.BerthName != nil && old.BerthName == nil && new.BerthName != nil {
		event := model.TimelineEvent{
			PortCallID:  new.ID,
			EventType:   model.TimelineEventBerthConfirmed,
			Title:       "Berth confirmed",
			Description: fmt.Sprintf("Berth assigned: %s", *new.BerthName),
			NewValue:    new.BerthName,
			CreatedBy:   userID,
			CreatedAt:   time.Now().UTC(),
		}
		if err := s.repo.CreateTimelineEvent(ctx, event); err != nil {
			logger.Warn("Failed to create timeline event", zap.Error(err))
		}
	}

	// ETA updated
	if input.ETA != nil && (old.ETA == nil || !old.ETA.Equal(*new.ETA)) {
		var oldValue, newValue *string
		if old.ETA != nil {
			v := old.ETA.Format(time.RFC3339)
			oldValue = &v
		}
		if new.ETA != nil {
			v := new.ETA.Format(time.RFC3339)
			newValue = &v
		}
		event := model.TimelineEvent{
			PortCallID:  new.ID,
			EventType:   model.TimelineEventETAUpdated,
			Title:       "ETA updated",
			Description: "Estimated time of arrival was updated",
			OldValue:    oldValue,
			NewValue:    newValue,
			CreatedBy:   userID,
			CreatedAt:   time.Now().UTC(),
		}
		if err := s.repo.CreateTimelineEvent(ctx, event); err != nil {
			logger.Warn("Failed to create timeline event", zap.Error(err))
		}
	}

	// Agent assigned
	if input.AgentID != nil && old.AgentID == nil && new.AgentID != nil {
		event := model.TimelineEvent{
			PortCallID:  new.ID,
			EventType:   model.TimelineEventAgentAssigned,
			Title:       "Agent assigned",
			Description: "Port agent has been assigned",
			NewValue:    new.AgentID,
			CreatedBy:   userID,
			CreatedAt:   time.Now().UTC(),
		}
		if err := s.repo.CreateTimelineEvent(ctx, event); err != nil {
			logger.Warn("Failed to create timeline event", zap.Error(err))
		}
	}
}

// Delete deletes a port call
func (s *PortCallService) Delete(ctx context.Context, id string) error {
	// Get existing port call
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to get port call: %w", err)
	}
	if existing == nil {
		return fmt.Errorf("port call not found")
	}

	// Only allow deleting draft port calls
	if existing.Status != model.PortCallStatusDraft {
		return fmt.Errorf("can only delete port calls in draft status")
	}

	if err := s.repo.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete port call: %w", err)
	}

	s.invalidateCache(ctx, existing.WorkspaceID)

	return nil
}

// GetServices retrieves service orders for a port call
func (s *PortCallService) GetServices(ctx context.Context, portCallID string) ([]model.ServiceOrder, error) {
	// Verify port call exists
	if _, err := s.GetByID(ctx, portCallID); err != nil {
		return nil, err
	}

	services, err := s.repo.GetServiceOrders(ctx, portCallID)
	if err != nil {
		return nil, fmt.Errorf("failed to get services: %w", err)
	}

	return services, nil
}

// GetTimeline retrieves timeline events for a port call from the database
func (s *PortCallService) GetTimeline(ctx context.Context, portCallID string) ([]model.TimelineEvent, error) {
	// Verify port call exists
	if _, err := s.GetByID(ctx, portCallID); err != nil {
		return nil, err
	}

	// Get timeline events from repository
	events, err := s.repo.GetTimelineEvents(ctx, portCallID)
	if err != nil {
		return nil, fmt.Errorf("failed to get timeline events: %w", err)
	}

	return events, nil
}

// AddTimelineNote adds a note to the port call timeline
func (s *PortCallService) AddTimelineNote(ctx context.Context, portCallID, note, userID string) (*model.TimelineEvent, error) {
	// Verify port call exists
	if _, err := s.GetByID(ctx, portCallID); err != nil {
		return nil, err
	}

	event := model.TimelineEvent{
		PortCallID:  portCallID,
		EventType:   model.TimelineEventNoteAdded,
		Title:       "Note added",
		Description: note,
		CreatedBy:   userID,
		CreatedAt:   time.Now().UTC(),
	}

	if err := s.repo.CreateTimelineEvent(ctx, event); err != nil {
		return nil, fmt.Errorf("failed to create timeline event: %w", err)
	}

	return &event, nil
}

// validateStatusTransition validates port call status transitions
func (s *PortCallService) validateStatusTransition(from, to model.PortCallStatus) error {
	validTransitions := map[model.PortCallStatus][]model.PortCallStatus{
		model.PortCallStatusDraft:     {model.PortCallStatusPlanned, model.PortCallStatusCancelled},
		model.PortCallStatusPlanned:   {model.PortCallStatusConfirmed, model.PortCallStatusCancelled},
		model.PortCallStatusConfirmed: {model.PortCallStatusArrived, model.PortCallStatusCancelled},
		model.PortCallStatusArrived:   {model.PortCallStatusAlongside, model.PortCallStatusCancelled},
		model.PortCallStatusAlongside: {model.PortCallStatusDeparted, model.PortCallStatusCancelled},
		model.PortCallStatusDeparted:  {model.PortCallStatusCompleted},
		model.PortCallStatusCompleted: {},
		model.PortCallStatusCancelled: {},
	}

	allowed, ok := validTransitions[from]
	if !ok {
		return fmt.Errorf("invalid current status: %s", from)
	}

	for _, status := range allowed {
		if status == to {
			return nil
		}
	}

	return fmt.Errorf("cannot transition from %s to %s", from, to)
}

// invalidateCache invalidates cache for a workspace
func (s *PortCallService) invalidateCache(ctx context.Context, workspaceID string) {
	if s.cache != nil {
		s.cache.Del(ctx, fmt.Sprintf("portcalls:%s", workspaceID))
	}
}

// logAudit logs an audit event if the audit logger is configured
func (s *PortCallService) logAudit(ctx context.Context, action audit.Action, entityType audit.EntityType, entityID string, oldValue, newValue any, userID string) {
	if s.auditLogger == nil {
		return
	}

	event := audit.NewBuilder().
		WithUser(userID, ""). // Org ID would be extracted from context in production
		WithAction(action).
		WithEntity(entityType, entityID).
		WithOldValue(oldValue).
		WithNewValue(newValue).
		WithRequestContext(ctx).
		Build()

	s.auditLogger.LogAsync(ctx, event)
}

// ChangeStatus changes the status of a port call with validation
func (s *PortCallService) ChangeStatus(ctx context.Context, id string, newStatus model.PortCallStatus, userID string) (*model.PortCall, error) {
	input := model.UpdatePortCallInput{
		Status: &newStatus,
	}

	// Handle special status transitions that require additional data
	now := time.Now().UTC()
	switch newStatus {
	case model.PortCallStatusArrived:
		input.ATA = &now
	case model.PortCallStatusDeparted:
		input.ATD = &now
	}

	return s.UpdateWithUser(ctx, id, input, userID)
}

// ConfirmBerth confirms the berth assignment for a port call
func (s *PortCallService) ConfirmBerth(ctx context.Context, id string, berthName, berthTerminal string, userID string) (*model.PortCall, error) {
	input := model.UpdatePortCallInput{
		BerthName:     &berthName,
		BerthTerminal: &berthTerminal,
	}
	return s.UpdateWithUser(ctx, id, input, userID)
}

// AssignAgent assigns an agent to a port call
func (s *PortCallService) AssignAgent(ctx context.Context, id string, agentID string, userID string) (*model.PortCall, error) {
	input := model.UpdatePortCallInput{
		AgentID: &agentID,
	}
	return s.UpdateWithUser(ctx, id, input, userID)
}

// PortCallListResult represents paginated port call results
type PortCallListResult struct {
	PortCalls []model.PortCall `json:"port_calls"`
	Total     int              `json:"total"`
	Page      int              `json:"page"`
	PerPage   int              `json:"per_page"`
}
