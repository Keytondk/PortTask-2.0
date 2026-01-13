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

// RFQService handles RFQ business logic
type RFQService struct {
	repo        *repository.RFQRepository
	cache       *redis.Client
	auditLogger audit.Logger
}

// NewRFQService creates a new RFQ service
func NewRFQService(repo *repository.RFQRepository, cache *redis.Client) *RFQService {
	return &RFQService{
		repo:  repo,
		cache: cache,
	}
}

// WithAuditLogger sets the audit logger
func (s *RFQService) WithAuditLogger(logger audit.Logger) *RFQService {
	s.auditLogger = logger
	return s
}

// Create creates a new RFQ
func (s *RFQService) Create(ctx context.Context, input model.CreateRFQInput, userID, orgID string) (*model.RFQ, error) {
	// Validate input
	if input.ServiceTypeID == "" {
		return nil, fmt.Errorf("service_type_id is required")
	}
	if input.PortCallID == "" {
		return nil, fmt.Errorf("port_call_id is required")
	}
	if input.Deadline.IsZero() {
		return nil, fmt.Errorf("deadline is required")
	}
	if input.Deadline.Before(time.Now()) {
		return nil, fmt.Errorf("deadline must be in the future")
	}

	rfq, err := s.repo.Create(ctx, input, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to create RFQ: %w", err)
	}

	// Audit log
	if s.auditLogger != nil {
		event := audit.NewBuilder().
			WithUser(userID, orgID).
			WithAction(audit.ActionCreate).
			WithEntity(audit.EntityRFQ, rfq.ID).
			WithNewValue(rfq).
			WithRequestContext(ctx).
			Build()
		s.auditLogger.LogAsync(ctx, event)
	}

	return rfq, nil
}

// GetByID retrieves an RFQ by ID
func (s *RFQService) GetByID(ctx context.Context, id string) (*model.RFQ, error) {
	rfq, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get RFQ: %w", err)
	}
	if rfq == nil {
		return nil, fmt.Errorf("RFQ not found")
	}

	return rfq, nil
}

// GetByReference retrieves an RFQ by reference
func (s *RFQService) GetByReference(ctx context.Context, reference string) (*model.RFQ, error) {
	rfq, err := s.repo.GetByReference(ctx, reference)
	if err != nil {
		return nil, fmt.Errorf("failed to get RFQ: %w", err)
	}
	if rfq == nil {
		return nil, fmt.Errorf("RFQ not found")
	}

	return rfq, nil
}

// List retrieves RFQs with filters
func (s *RFQService) List(ctx context.Context, filter model.RFQFilter) (*model.RFQListResult, error) {
	rfqs, total, err := s.repo.List(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to list RFQs: %w", err)
	}

	return &model.RFQListResult{
		RFQs:    rfqs,
		Total:   total,
		Page:    filter.Page,
		PerPage: filter.PerPage,
	}, nil
}

// Update updates an RFQ
func (s *RFQService) Update(ctx context.Context, id string, input model.UpdateRFQInput, userID, orgID string) (*model.RFQ, error) {
	existing, err := s.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Can only update draft RFQs
	if existing.Status != model.RFQStatusDraft {
		return nil, fmt.Errorf("can only update RFQs in draft status")
	}

	rfq, err := s.repo.Update(ctx, id, input)
	if err != nil {
		return nil, fmt.Errorf("failed to update RFQ: %w", err)
	}

	// Audit log
	if s.auditLogger != nil {
		event := audit.NewBuilder().
			WithUser(userID, orgID).
			WithAction(audit.ActionUpdate).
			WithEntity(audit.EntityRFQ, rfq.ID).
			WithOldValue(existing).
			WithNewValue(rfq).
			WithRequestContext(ctx).
			Build()
		s.auditLogger.LogAsync(ctx, event)
	}

	return rfq, nil
}

// Publish publishes an RFQ (opens it for quotes)
func (s *RFQService) Publish(ctx context.Context, id string, userID, orgID string) (*model.RFQ, error) {
	existing, err := s.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if existing.Status != model.RFQStatusDraft {
		return nil, fmt.Errorf("can only publish RFQs in draft status")
	}

	if len(existing.InvitedVendors) == 0 {
		return nil, fmt.Errorf("at least one vendor must be invited")
	}

	if existing.Deadline.Before(time.Now()) {
		return nil, fmt.Errorf("deadline has passed, cannot publish")
	}

	if err := s.repo.UpdateStatus(ctx, id, model.RFQStatusOpen); err != nil {
		return nil, fmt.Errorf("failed to publish RFQ: %w", err)
	}

	rfq, _ := s.GetByID(ctx, id)

	// Audit log
	if s.auditLogger != nil {
		event := audit.NewBuilder().
			WithUser(userID, orgID).
			WithAction(audit.ActionUpdate).
			WithEntity(audit.EntityRFQ, id).
			WithMetadata("action", "publish").
			WithMetadata("invited_vendors", existing.InvitedVendors).
			WithRequestContext(ctx).
			Build()
		s.auditLogger.LogAsync(ctx, event)
	}

	// TODO: Send notifications to invited vendors

	return rfq, nil
}

// Close closes an RFQ (stops accepting quotes)
func (s *RFQService) Close(ctx context.Context, id string, userID, orgID string) (*model.RFQ, error) {
	existing, err := s.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if existing.Status != model.RFQStatusOpen {
		return nil, fmt.Errorf("can only close RFQs in open status")
	}

	if err := s.repo.UpdateStatus(ctx, id, model.RFQStatusClosed); err != nil {
		return nil, fmt.Errorf("failed to close RFQ: %w", err)
	}

	rfq, _ := s.GetByID(ctx, id)

	// Audit log
	if s.auditLogger != nil {
		event := audit.NewBuilder().
			WithUser(userID, orgID).
			WithAction(audit.ActionUpdate).
			WithEntity(audit.EntityRFQ, id).
			WithMetadata("action", "close").
			WithRequestContext(ctx).
			Build()
		s.auditLogger.LogAsync(ctx, event)
	}

	return rfq, nil
}

// Cancel cancels an RFQ
func (s *RFQService) Cancel(ctx context.Context, id string, reason string, userID, orgID string) (*model.RFQ, error) {
	existing, err := s.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if existing.Status == model.RFQStatusAwarded || existing.Status == model.RFQStatusCancelled {
		return nil, fmt.Errorf("cannot cancel RFQ in %s status", existing.Status)
	}

	if err := s.repo.UpdateStatus(ctx, id, model.RFQStatusCancelled); err != nil {
		return nil, fmt.Errorf("failed to cancel RFQ: %w", err)
	}

	rfq, _ := s.GetByID(ctx, id)

	// Audit log
	if s.auditLogger != nil {
		event := audit.NewBuilder().
			WithUser(userID, orgID).
			WithAction(audit.ActionUpdate).
			WithEntity(audit.EntityRFQ, id).
			WithMetadata("action", "cancel").
			WithMetadata("reason", reason).
			WithRequestContext(ctx).
			Build()
		s.auditLogger.LogAsync(ctx, event)
	}

	return rfq, nil
}

// SubmitQuote submits a quote for an RFQ
func (s *RFQService) SubmitQuote(ctx context.Context, rfqID, vendorID string, input model.SubmitQuoteInput, userID, orgID string) (*model.Quote, error) {
	rfq, err := s.GetByID(ctx, rfqID)
	if err != nil {
		return nil, err
	}

	// Validate RFQ is open
	if rfq.Status != model.RFQStatusOpen {
		return nil, fmt.Errorf("RFQ is not open for quotes")
	}

	// Check if deadline has passed
	if rfq.Deadline.Before(time.Now()) {
		return nil, fmt.Errorf("RFQ deadline has passed")
	}

	// Check if vendor is invited
	isInvited := false
	for _, v := range rfq.InvitedVendors {
		if v == vendorID {
			isInvited = true
			break
		}
	}
	if !isInvited {
		return nil, fmt.Errorf("vendor is not invited to this RFQ")
	}

	// Check if vendor has already submitted a quote
	existingQuote, err := s.repo.GetQuoteByVendor(ctx, rfqID, vendorID)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing quote: %w", err)
	}
	if existingQuote != nil {
		return nil, fmt.Errorf("vendor has already submitted a quote")
	}

	// Validate quote input
	if input.UnitPrice <= 0 {
		return nil, fmt.Errorf("unit_price must be greater than 0")
	}
	if input.TotalPrice <= 0 {
		return nil, fmt.Errorf("total_price must be greater than 0")
	}
	if input.Currency == "" {
		input.Currency = "USD"
	}

	quote, err := s.repo.SubmitQuote(ctx, rfqID, vendorID, input)
	if err != nil {
		return nil, fmt.Errorf("failed to submit quote: %w", err)
	}

	// Audit log
	if s.auditLogger != nil {
		event := audit.NewBuilder().
			WithUser(userID, orgID).
			WithAction(audit.ActionCreate).
			WithEntity(audit.EntityQuote, quote.ID).
			WithNewValue(quote).
			WithMetadata("rfq_id", rfqID).
			WithMetadata("vendor_id", vendorID).
			WithRequestContext(ctx).
			Build()
		s.auditLogger.LogAsync(ctx, event)
	}

	return quote, nil
}

// GetQuotes retrieves all quotes for an RFQ
func (s *RFQService) GetQuotes(ctx context.Context, rfqID string) ([]model.Quote, error) {
	quotes, err := s.repo.GetQuotesByRFQ(ctx, rfqID)
	if err != nil {
		return nil, fmt.Errorf("failed to get quotes: %w", err)
	}
	return quotes, nil
}

// CompareQuotes returns a comparison of quotes for an RFQ
func (s *RFQService) CompareQuotes(ctx context.Context, rfqID string) (*model.QuoteComparison, error) {
	quotes, err := s.GetQuotes(ctx, rfqID)
	if err != nil {
		return nil, err
	}

	comparison := &model.QuoteComparison{
		RFQID:      rfqID,
		Quotes:     quotes,
		QuoteCount: len(quotes),
	}

	if len(quotes) > 0 {
		var total float64
		comparison.LowestPrice = quotes[0].TotalPrice
		comparison.HighestPrice = quotes[0].TotalPrice

		for _, q := range quotes {
			total += q.TotalPrice
			if q.TotalPrice < comparison.LowestPrice {
				comparison.LowestPrice = q.TotalPrice
			}
			if q.TotalPrice > comparison.HighestPrice {
				comparison.HighestPrice = q.TotalPrice
			}
		}

		comparison.AveragePrice = total / float64(len(quotes))
	}

	return comparison, nil
}

// AwardQuote awards the RFQ to a specific quote
func (s *RFQService) AwardQuote(ctx context.Context, rfqID, quoteID string, userID, orgID string) (*model.RFQ, error) {
	rfq, err := s.GetByID(ctx, rfqID)
	if err != nil {
		return nil, err
	}

	// Can only award open or closed RFQs
	if rfq.Status != model.RFQStatusOpen && rfq.Status != model.RFQStatusClosed {
		return nil, fmt.Errorf("can only award RFQs in open or closed status")
	}

	// Get the quote
	quote, err := s.repo.GetQuote(ctx, quoteID)
	if err != nil {
		return nil, fmt.Errorf("failed to get quote: %w", err)
	}
	if quote == nil {
		return nil, fmt.Errorf("quote not found")
	}
	if quote.RFQID != rfqID {
		return nil, fmt.Errorf("quote does not belong to this RFQ")
	}

	// Update quote status to accepted
	if err := s.repo.UpdateQuoteStatus(ctx, quoteID, model.QuoteStatusAccepted); err != nil {
		return nil, fmt.Errorf("failed to accept quote: %w", err)
	}

	// Reject all other quotes
	quotes, _ := s.GetQuotes(ctx, rfqID)
	for _, q := range quotes {
		if q.ID != quoteID && q.Status == model.QuoteStatusSubmitted {
			s.repo.UpdateQuoteStatus(ctx, q.ID, model.QuoteStatusRejected)
		}
	}

	// Award the RFQ
	if err := s.repo.Award(ctx, rfqID, quoteID); err != nil {
		return nil, fmt.Errorf("failed to award RFQ: %w", err)
	}

	awardedRFQ, _ := s.GetByID(ctx, rfqID)

	// Audit log
	if s.auditLogger != nil {
		event := audit.NewBuilder().
			WithUser(userID, orgID).
			WithAction(audit.ActionApprove).
			WithEntity(audit.EntityRFQ, rfqID).
			WithMetadata("action", "award").
			WithMetadata("awarded_quote_id", quoteID).
			WithMetadata("vendor_id", quote.VendorID).
			WithMetadata("total_price", quote.TotalPrice).
			WithRequestContext(ctx).
			Build()
		s.auditLogger.LogAsync(ctx, event)
	}

	return awardedRFQ, nil
}

// GetQuote retrieves a quote by ID
func (s *RFQService) GetQuote(ctx context.Context, id string) (*model.Quote, error) {
	quote, err := s.repo.GetQuote(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get quote: %w", err)
	}
	if quote == nil {
		return nil, fmt.Errorf("quote not found")
	}
	return quote, nil
}

// WithdrawQuote allows a vendor to withdraw their quote
func (s *RFQService) WithdrawQuote(ctx context.Context, quoteID string, userID, orgID string) (*model.Quote, error) {
	quote, err := s.GetQuote(ctx, quoteID)
	if err != nil {
		return nil, err
	}

	if quote.Status != model.QuoteStatusSubmitted {
		return nil, fmt.Errorf("can only withdraw submitted quotes")
	}

	// Check if RFQ is still open
	rfq, err := s.GetByID(ctx, quote.RFQID)
	if err != nil {
		return nil, err
	}
	if rfq.Status != model.RFQStatusOpen {
		return nil, fmt.Errorf("cannot withdraw quote - RFQ is no longer open")
	}

	if err := s.repo.UpdateQuoteStatus(ctx, quoteID, model.QuoteStatusWithdrawn); err != nil {
		return nil, fmt.Errorf("failed to withdraw quote: %w", err)
	}

	withdrawnQuote, _ := s.GetQuote(ctx, quoteID)

	// Audit log
	if s.auditLogger != nil {
		event := audit.NewBuilder().
			WithUser(userID, orgID).
			WithAction(audit.ActionUpdate).
			WithEntity(audit.EntityQuote, quoteID).
			WithMetadata("action", "withdraw").
			WithRequestContext(ctx).
			Build()
		s.auditLogger.LogAsync(ctx, event)
	}

	return withdrawnQuote, nil
}

// GetRFQsForVendor retrieves RFQs where a vendor is invited
func (s *RFQService) GetRFQsForVendor(ctx context.Context, vendorID string, page, perPage int) (*model.RFQListResult, error) {
	filter := model.RFQFilter{
		VendorID: &vendorID,
		Page:     page,
		PerPage:  perPage,
	}

	return s.List(ctx, filter)
}

// CheckExpiredRFQs checks and marks expired RFQs
func (s *RFQService) CheckExpiredRFQs(ctx context.Context) (int, error) {
	// Get open RFQs with passed deadlines
	filter := model.RFQFilter{
		Status:  ptrRFQStatus(model.RFQStatusOpen),
		PerPage: 1000,
	}

	result, err := s.List(ctx, filter)
	if err != nil {
		return 0, err
	}

	expired := 0
	now := time.Now()
	for _, rfq := range result.RFQs {
		if rfq.Deadline.Before(now) {
			if err := s.repo.UpdateStatus(ctx, rfq.ID, model.RFQStatusExpired); err == nil {
				expired++
			}
		}
	}

	return expired, nil
}

func ptrRFQStatus(s model.RFQStatus) *model.RFQStatus {
	return &s
}
