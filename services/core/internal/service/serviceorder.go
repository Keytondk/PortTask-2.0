package service

import (
	"context"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/navo/pkg/audit"
	"github.com/navo/services/core/internal/model"
	"github.com/navo/services/core/internal/repository"
)

// ServiceOrderService handles service order business logic
type ServiceOrderService struct {
	repo        *repository.ServiceOrderRepository
	cache       *redis.Client
	auditLogger audit.Logger
}

// NewServiceOrderService creates a new service order service
func NewServiceOrderService(repo *repository.ServiceOrderRepository, cache *redis.Client) *ServiceOrderService {
	return &ServiceOrderService{
		repo:  repo,
		cache: cache,
	}
}

// WithAuditLogger sets the audit logger
func (s *ServiceOrderService) WithAuditLogger(logger audit.Logger) *ServiceOrderService {
	s.auditLogger = logger
	return s
}

// Create creates a new service order
func (s *ServiceOrderService) Create(ctx context.Context, input model.CreateServiceOrderInput, userID, orgID string) (*model.ServiceOrder, error) {
	// Validate input
	if input.PortCallID == "" {
		return nil, fmt.Errorf("port_call_id is required")
	}
	if input.ServiceTypeID == "" {
		return nil, fmt.Errorf("service_type_id is required")
	}

	order, err := s.repo.Create(ctx, input, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to create service order: %w", err)
	}

	// Audit log
	if s.auditLogger != nil {
		event := audit.NewBuilder().
			WithUser(userID, orgID).
			WithAction(audit.ActionCreate).
			WithEntity(audit.EntityServiceOrder, order.ID).
			WithNewValue(order).
			WithRequestContext(ctx).
			Build()
		s.auditLogger.LogAsync(ctx, event)
	}

	return order, nil
}

// GetByID retrieves a service order by ID
func (s *ServiceOrderService) GetByID(ctx context.Context, id string) (*model.ServiceOrder, error) {
	order, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get service order: %w", err)
	}
	if order == nil {
		return nil, fmt.Errorf("service order not found")
	}

	return order, nil
}

// List retrieves service orders with filters
func (s *ServiceOrderService) List(ctx context.Context, filter model.ServiceOrderFilter) (*ServiceOrderListResult, error) {
	orders, total, err := s.repo.List(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to list service orders: %w", err)
	}

	return &ServiceOrderListResult{
		ServiceOrders: orders,
		Total:         total,
		Page:          filter.Page,
		PerPage:       filter.PerPage,
	}, nil
}

// Update updates a service order
func (s *ServiceOrderService) Update(ctx context.Context, id string, input model.UpdateServiceOrderInput, userID, orgID string) (*model.ServiceOrder, error) {
	// Get existing order
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get service order: %w", err)
	}
	if existing == nil {
		return nil, fmt.Errorf("service order not found")
	}

	// Validate status transitions
	if input.Status != nil {
		if err := s.validateStatusTransition(existing.Status, *input.Status); err != nil {
			return nil, err
		}
	}

	order, err := s.repo.Update(ctx, id, input)
	if err != nil {
		return nil, fmt.Errorf("failed to update service order: %w", err)
	}

	// Audit log
	if s.auditLogger != nil {
		event := audit.NewBuilder().
			WithUser(userID, orgID).
			WithAction(audit.ActionUpdate).
			WithEntity(audit.EntityServiceOrder, order.ID).
			WithOldValue(existing).
			WithNewValue(order).
			WithRequestContext(ctx).
			Build()
		s.auditLogger.LogAsync(ctx, event)
	}

	return order, nil
}

// Delete deletes a service order
func (s *ServiceOrderService) Delete(ctx context.Context, id string, userID, orgID string) error {
	// Get existing order
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to get service order: %w", err)
	}
	if existing == nil {
		return fmt.Errorf("service order not found")
	}

	// Only allow deleting draft or requested orders
	if existing.Status != model.ServiceOrderStatusDraft && existing.Status != model.ServiceOrderStatusRequested {
		return fmt.Errorf("can only delete service orders in draft or requested status")
	}

	if err := s.repo.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete service order: %w", err)
	}

	// Audit log
	if s.auditLogger != nil {
		event := audit.NewBuilder().
			WithUser(userID, orgID).
			WithAction(audit.ActionDelete).
			WithEntity(audit.EntityServiceOrder, id).
			WithOldValue(existing).
			WithRequestContext(ctx).
			Build()
		s.auditLogger.LogAsync(ctx, event)
	}

	return nil
}

// Confirm confirms a service order with vendor and price
func (s *ServiceOrderService) Confirm(ctx context.Context, id string, vendorID string, quotedPrice float64, userID, orgID string) (*model.ServiceOrder, error) {
	// Get existing order
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get service order: %w", err)
	}
	if existing == nil {
		return nil, fmt.Errorf("service order not found")
	}

	// Validate status - can confirm from draft, requested, or quoted status
	validStatuses := []model.ServiceOrderStatus{
		model.ServiceOrderStatusDraft,
		model.ServiceOrderStatusRequested,
		model.ServiceOrderStatusQuoted,
		model.ServiceOrderStatusRFQSent,
	}
	isValid := false
	for _, status := range validStatuses {
		if existing.Status == status {
			isValid = true
			break
		}
	}
	if !isValid {
		return nil, fmt.Errorf("cannot confirm service order in %s status", existing.Status)
	}

	if vendorID == "" {
		return nil, fmt.Errorf("vendor_id is required to confirm")
	}
	if quotedPrice <= 0 {
		return nil, fmt.Errorf("quoted_price must be greater than 0")
	}

	order, err := s.repo.Confirm(ctx, id, vendorID, quotedPrice)
	if err != nil {
		return nil, fmt.Errorf("failed to confirm service order: %w", err)
	}

	// Audit log
	if s.auditLogger != nil {
		event := audit.NewBuilder().
			WithUser(userID, orgID).
			WithAction(audit.ActionUpdate).
			WithEntity(audit.EntityServiceOrder, order.ID).
			WithOldValue(existing).
			WithNewValue(order).
			WithMetadata("action", "confirm").
			WithMetadata("vendor_id", vendorID).
			WithMetadata("quoted_price", quotedPrice).
			WithRequestContext(ctx).
			Build()
		s.auditLogger.LogAsync(ctx, event)
	}

	return order, nil
}

// Complete completes a service order
func (s *ServiceOrderService) Complete(ctx context.Context, id string, finalPrice *float64, userID, orgID string) (*model.ServiceOrder, error) {
	// Get existing order
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get service order: %w", err)
	}
	if existing == nil {
		return nil, fmt.Errorf("service order not found")
	}

	// Must be confirmed or in_progress to complete
	if existing.Status != model.ServiceOrderStatusConfirmed && existing.Status != model.ServiceOrderStatusInProgress {
		return nil, fmt.Errorf("cannot complete service order in %s status", existing.Status)
	}

	order, err := s.repo.Complete(ctx, id, finalPrice)
	if err != nil {
		return nil, fmt.Errorf("failed to complete service order: %w", err)
	}

	// Audit log
	if s.auditLogger != nil {
		event := audit.NewBuilder().
			WithUser(userID, orgID).
			WithAction(audit.ActionUpdate).
			WithEntity(audit.EntityServiceOrder, order.ID).
			WithMetadata("action", "complete").
			WithMetadata("final_price", order.FinalPrice).
			WithMetadata("completed_at", time.Now().UTC()).
			WithRequestContext(ctx).
			Build()
		s.auditLogger.LogAsync(ctx, event)
	}

	return order, nil
}

// AssignVendor assigns a vendor to a service order
func (s *ServiceOrderService) AssignVendor(ctx context.Context, id string, vendorID string, userID, orgID string) (*model.ServiceOrder, error) {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get service order: %w", err)
	}
	if existing == nil {
		return nil, fmt.Errorf("service order not found")
	}

	// Can only assign vendor before confirmation
	if existing.Status == model.ServiceOrderStatusConfirmed ||
		existing.Status == model.ServiceOrderStatusInProgress ||
		existing.Status == model.ServiceOrderStatusCompleted {
		return nil, fmt.Errorf("cannot change vendor for order in %s status", existing.Status)
	}

	input := model.UpdateServiceOrderInput{
		VendorID: &vendorID,
	}

	order, err := s.repo.Update(ctx, id, input)
	if err != nil {
		return nil, fmt.Errorf("failed to assign vendor: %w", err)
	}

	// Audit log
	if s.auditLogger != nil {
		event := audit.NewBuilder().
			WithUser(userID, orgID).
			WithAction(audit.ActionUpdate).
			WithEntity(audit.EntityServiceOrder, order.ID).
			WithMetadata("action", "assign_vendor").
			WithMetadata("vendor_id", vendorID).
			WithMetadata("previous_vendor_id", existing.VendorID).
			WithRequestContext(ctx).
			Build()
		s.auditLogger.LogAsync(ctx, event)
	}

	return order, nil
}

// StartWork transitions a service order to in_progress
func (s *ServiceOrderService) StartWork(ctx context.Context, id string, userID, orgID string) (*model.ServiceOrder, error) {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get service order: %w", err)
	}
	if existing == nil {
		return nil, fmt.Errorf("service order not found")
	}

	if existing.Status != model.ServiceOrderStatusConfirmed {
		return nil, fmt.Errorf("can only start work on confirmed orders")
	}

	status := model.ServiceOrderStatusInProgress
	input := model.UpdateServiceOrderInput{
		Status: &status,
	}

	order, err := s.repo.Update(ctx, id, input)
	if err != nil {
		return nil, fmt.Errorf("failed to start work: %w", err)
	}

	// Audit log
	if s.auditLogger != nil {
		event := audit.NewBuilder().
			WithUser(userID, orgID).
			WithAction(audit.ActionUpdate).
			WithEntity(audit.EntityServiceOrder, order.ID).
			WithMetadata("action", "start_work").
			WithMetadata("old_status", string(existing.Status)).
			WithMetadata("new_status", string(order.Status)).
			WithRequestContext(ctx).
			Build()
		s.auditLogger.LogAsync(ctx, event)
	}

	return order, nil
}

// Cancel cancels a service order
func (s *ServiceOrderService) Cancel(ctx context.Context, id string, reason string, userID, orgID string) (*model.ServiceOrder, error) {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get service order: %w", err)
	}
	if existing == nil {
		return nil, fmt.Errorf("service order not found")
	}

	// Cannot cancel completed orders
	if existing.Status == model.ServiceOrderStatusCompleted {
		return nil, fmt.Errorf("cannot cancel completed orders")
	}
	if existing.Status == model.ServiceOrderStatusCancelled {
		return nil, fmt.Errorf("order is already cancelled")
	}

	status := model.ServiceOrderStatusCancelled
	input := model.UpdateServiceOrderInput{
		Status: &status,
	}

	order, err := s.repo.Update(ctx, id, input)
	if err != nil {
		return nil, fmt.Errorf("failed to cancel order: %w", err)
	}

	// Audit log
	if s.auditLogger != nil {
		event := audit.NewBuilder().
			WithUser(userID, orgID).
			WithAction(audit.ActionUpdate).
			WithEntity(audit.EntityServiceOrder, order.ID).
			WithMetadata("action", "cancel").
			WithMetadata("reason", reason).
			WithMetadata("old_status", string(existing.Status)).
			WithRequestContext(ctx).
			Build()
		s.auditLogger.LogAsync(ctx, event)
	}

	return order, nil
}

// GetByPortCall retrieves all service orders for a port call
func (s *ServiceOrderService) GetByPortCall(ctx context.Context, portCallID string) ([]model.ServiceOrder, error) {
	filter := model.ServiceOrderFilter{
		PortCallID: &portCallID,
		PerPage:    1000,
	}

	result, err := s.List(ctx, filter)
	if err != nil {
		return nil, err
	}

	return result.ServiceOrders, nil
}

// GetStats returns service order statistics for a port call
func (s *ServiceOrderService) GetStats(ctx context.Context, portCallID string) (*ServiceOrderStats, error) {
	orders, err := s.GetByPortCall(ctx, portCallID)
	if err != nil {
		return nil, err
	}

	stats := &ServiceOrderStats{
		ByStatus: make(map[string]int),
	}

	for _, order := range orders {
		stats.Total++
		stats.ByStatus[string(order.Status)]++

		if order.QuotedPrice != nil {
			stats.TotalQuoted += *order.QuotedPrice
		}
		if order.FinalPrice != nil {
			stats.TotalFinal += *order.FinalPrice
		}
	}

	return stats, nil
}

// validateStatusTransition validates service order status transitions
func (s *ServiceOrderService) validateStatusTransition(from, to model.ServiceOrderStatus) error {
	validTransitions := map[model.ServiceOrderStatus][]model.ServiceOrderStatus{
		model.ServiceOrderStatusDraft:      {model.ServiceOrderStatusRequested, model.ServiceOrderStatusCancelled},
		model.ServiceOrderStatusRequested:  {model.ServiceOrderStatusRFQSent, model.ServiceOrderStatusQuoted, model.ServiceOrderStatusConfirmed, model.ServiceOrderStatusCancelled},
		model.ServiceOrderStatusRFQSent:    {model.ServiceOrderStatusQuoted, model.ServiceOrderStatusCancelled},
		model.ServiceOrderStatusQuoted:     {model.ServiceOrderStatusConfirmed, model.ServiceOrderStatusCancelled},
		model.ServiceOrderStatusConfirmed:  {model.ServiceOrderStatusInProgress, model.ServiceOrderStatusCancelled},
		model.ServiceOrderStatusInProgress: {model.ServiceOrderStatusCompleted, model.ServiceOrderStatusCancelled},
		model.ServiceOrderStatusCompleted:  {},
		model.ServiceOrderStatusCancelled:  {},
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

// ServiceOrderListResult represents paginated service order results
type ServiceOrderListResult struct {
	ServiceOrders []model.ServiceOrder `json:"service_orders"`
	Total         int                  `json:"total"`
	Page          int                  `json:"page"`
	PerPage       int                  `json:"per_page"`
}

// ServiceOrderStats represents service order statistics
type ServiceOrderStats struct {
	Total       int            `json:"total"`
	ByStatus    map[string]int `json:"by_status"`
	TotalQuoted float64        `json:"total_quoted"`
	TotalFinal  float64        `json:"total_final"`
}
