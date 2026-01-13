package service

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/navo/services/integration/internal/model"
	"github.com/navo/services/integration/internal/repository"
	"go.uber.org/zap"
)

// WebhookService handles webhook operations
type WebhookService struct {
	repo       *repository.WebhookRepository
	httpClient *http.Client
	logger     *zap.Logger
	config     WebhookConfig
}

// WebhookConfig holds webhook service configuration
type WebhookConfig struct {
	Timeout      time.Duration
	RetryCount   int
	RetryDelay   time.Duration
	MaxBatchSize int
}

// NewWebhookService creates a new webhook service
func NewWebhookService(repo *repository.WebhookRepository, logger *zap.Logger, config WebhookConfig) *WebhookService {
	return &WebhookService{
		repo: repo,
		httpClient: &http.Client{
			Timeout: config.Timeout,
		},
		logger: logger,
		config: config,
	}
}

// CreateWebhook creates a new webhook
func (s *WebhookService) CreateWebhook(ctx context.Context, orgID string, req *model.CreateWebhookRequest) (*model.Webhook, error) {
	// Generate secret for signing
	secret := generateSecret()

	webhook := &model.Webhook{
		ID:             uuid.New().String(),
		OrganizationID: orgID,
		WorkspaceID:    req.WorkspaceID,
		Name:           req.Name,
		URL:            req.URL,
		Secret:         secret,
		Events:         req.Events,
		IsActive:       true,
		Headers:        req.Headers,
		CreatedAt:      time.Now().UTC(),
		UpdatedAt:      time.Now().UTC(),
		FailureCount:   0,
	}

	if err := s.repo.Create(ctx, webhook); err != nil {
		return nil, fmt.Errorf("failed to create webhook: %w", err)
	}

	s.logger.Info("Webhook created",
		zap.String("webhook_id", webhook.ID),
		zap.String("organization_id", orgID),
		zap.String("url", webhook.URL),
	)

	return webhook, nil
}

// GetWebhook retrieves a webhook by ID
func (s *WebhookService) GetWebhook(ctx context.Context, orgID, webhookID string) (*model.Webhook, error) {
	webhook, err := s.repo.GetByID(ctx, webhookID)
	if err != nil {
		return nil, err
	}

	if webhook.OrganizationID != orgID {
		return nil, fmt.Errorf("webhook not found")
	}

	return webhook, nil
}

// ListWebhooks lists webhooks for an organization
func (s *WebhookService) ListWebhooks(ctx context.Context, orgID string, page, pageSize int) (*model.WebhookListResponse, error) {
	webhooks, total, err := s.repo.ListByOrganization(ctx, orgID, page, pageSize)
	if err != nil {
		return nil, err
	}

	return &model.WebhookListResponse{
		Webhooks:   webhooks,
		TotalCount: total,
		Page:       page,
		PageSize:   pageSize,
	}, nil
}

// UpdateWebhook updates a webhook
func (s *WebhookService) UpdateWebhook(ctx context.Context, orgID, webhookID string, req *model.UpdateWebhookRequest) (*model.Webhook, error) {
	webhook, err := s.GetWebhook(ctx, orgID, webhookID)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		webhook.Name = *req.Name
	}
	if req.URL != nil {
		webhook.URL = *req.URL
	}
	if req.Events != nil {
		webhook.Events = req.Events
	}
	if req.IsActive != nil {
		webhook.IsActive = *req.IsActive
	}
	if req.Headers != nil {
		webhook.Headers = req.Headers
	}

	webhook.UpdatedAt = time.Now().UTC()

	if err := s.repo.Update(ctx, webhook); err != nil {
		return nil, fmt.Errorf("failed to update webhook: %w", err)
	}

	return webhook, nil
}

// DeleteWebhook deletes a webhook
func (s *WebhookService) DeleteWebhook(ctx context.Context, orgID, webhookID string) error {
	webhook, err := s.GetWebhook(ctx, orgID, webhookID)
	if err != nil {
		return err
	}

	return s.repo.Delete(ctx, webhook.ID)
}

// RegenerateSecret regenerates the webhook secret
func (s *WebhookService) RegenerateSecret(ctx context.Context, orgID, webhookID string) (*model.Webhook, error) {
	webhook, err := s.GetWebhook(ctx, orgID, webhookID)
	if err != nil {
		return nil, err
	}

	webhook.Secret = generateSecret()
	webhook.UpdatedAt = time.Now().UTC()

	if err := s.repo.Update(ctx, webhook); err != nil {
		return nil, fmt.Errorf("failed to regenerate secret: %w", err)
	}

	return webhook, nil
}

// DispatchEvent dispatches an event to all matching webhooks
func (s *WebhookService) DispatchEvent(ctx context.Context, event *model.WebhookEvent) error {
	// Find all webhooks that subscribe to this event type
	webhooks, err := s.repo.FindByEvent(ctx, event.OrganizationID, event.Type)
	if err != nil {
		return fmt.Errorf("failed to find webhooks: %w", err)
	}

	for _, webhook := range webhooks {
		if !webhook.IsActive {
			continue
		}

		// Filter by workspace if specified
		if event.WorkspaceID != nil && webhook.WorkspaceID != nil && *webhook.WorkspaceID != *event.WorkspaceID {
			continue
		}

		go s.deliverWebhook(context.Background(), &webhook, event)
	}

	return nil
}

// deliverWebhook delivers a webhook with retries
func (s *WebhookService) deliverWebhook(ctx context.Context, webhook *model.Webhook, event *model.WebhookEvent) {
	delivery := &model.WebhookDelivery{
		ID:        uuid.New().String(),
		WebhookID: webhook.ID,
		EventType: event.Type,
		Status:    model.DeliveryPending,
		Attempts:  0,
		CreatedAt: time.Now().UTC(),
	}

	// Prepare payload
	payload := map[string]interface{}{
		"id":           event.ID,
		"type":         event.Type,
		"resource_type": event.ResourceType,
		"resource_id":  event.ResourceID,
		"data":         event.Data,
		"metadata":     event.Metadata,
		"timestamp":    event.Timestamp,
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		s.logger.Error("Failed to marshal webhook payload",
			zap.Error(err),
			zap.String("webhook_id", webhook.ID),
		)
		return
	}
	delivery.Payload = payloadBytes

	// Create signature
	signature := s.signPayload(payloadBytes, webhook.Secret)

	// Attempt delivery with retries
	var lastError error
	for attempt := 1; attempt <= s.config.RetryCount; attempt++ {
		delivery.Attempts = attempt

		req, err := http.NewRequestWithContext(ctx, http.MethodPost, webhook.URL, bytes.NewReader(payloadBytes))
		if err != nil {
			lastError = err
			continue
		}

		// Set headers
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Navo-Signature", signature)
		req.Header.Set("X-Navo-Event", string(event.Type))
		req.Header.Set("X-Navo-Delivery-ID", delivery.ID)
		req.Header.Set("X-Navo-Timestamp", event.Timestamp.Format(time.RFC3339))
		req.Header.Set("User-Agent", "Navo-Webhook/1.0")

		// Add custom headers
		for key, value := range webhook.Headers {
			req.Header.Set(key, value)
		}

		resp, err := s.httpClient.Do(req)
		if err != nil {
			lastError = err
			s.logger.Warn("Webhook delivery attempt failed",
				zap.Error(err),
				zap.String("webhook_id", webhook.ID),
				zap.Int("attempt", attempt),
			)
			time.Sleep(s.config.RetryDelay * time.Duration(attempt))
			continue
		}

		bodyBytes, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		delivery.ResponseCode = &resp.StatusCode
		bodyStr := string(bodyBytes)
		delivery.ResponseBody = &bodyStr

		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			delivery.Status = model.DeliverySuccess
			now := time.Now().UTC()
			delivery.DeliveredAt = &now

			s.logger.Info("Webhook delivered successfully",
				zap.String("webhook_id", webhook.ID),
				zap.String("delivery_id", delivery.ID),
				zap.Int("status_code", resp.StatusCode),
			)

			// Update webhook last triggered
			webhook.LastTriggeredAt = &now
			webhook.FailureCount = 0
			s.repo.Update(ctx, webhook)
			s.repo.SaveDelivery(ctx, delivery)
			return
		}

		lastError = fmt.Errorf("received status code %d", resp.StatusCode)
		time.Sleep(s.config.RetryDelay * time.Duration(attempt))
	}

	// All retries failed
	delivery.Status = model.DeliveryFailed
	if lastError != nil {
		errMsg := lastError.Error()
		delivery.ErrorMessage = &errMsg
	}

	s.logger.Error("Webhook delivery failed after all retries",
		zap.String("webhook_id", webhook.ID),
		zap.String("delivery_id", delivery.ID),
		zap.Error(lastError),
	)

	// Update failure count
	webhook.FailureCount++
	s.repo.Update(ctx, webhook)
	s.repo.SaveDelivery(ctx, delivery)
}

// GetDeliveries retrieves webhook delivery history
func (s *WebhookService) GetDeliveries(ctx context.Context, orgID, webhookID string, page, pageSize int) (*model.DeliveryListResponse, error) {
	// Verify ownership
	if _, err := s.GetWebhook(ctx, orgID, webhookID); err != nil {
		return nil, err
	}

	deliveries, total, err := s.repo.ListDeliveries(ctx, webhookID, page, pageSize)
	if err != nil {
		return nil, err
	}

	return &model.DeliveryListResponse{
		Deliveries: deliveries,
		TotalCount: total,
		Page:       page,
		PageSize:   pageSize,
	}, nil
}

// TestWebhook sends a test event to a webhook
func (s *WebhookService) TestWebhook(ctx context.Context, orgID, webhookID string) (*model.WebhookDelivery, error) {
	webhook, err := s.GetWebhook(ctx, orgID, webhookID)
	if err != nil {
		return nil, err
	}

	testEvent := &model.WebhookEvent{
		ID:             uuid.New().String(),
		Type:           "webhook.test",
		OrganizationID: orgID,
		ResourceType:   "webhook",
		ResourceID:     webhookID,
		Data: map[string]interface{}{
			"message": "This is a test webhook delivery from Navo",
		},
		Timestamp: time.Now().UTC(),
	}

	delivery := &model.WebhookDelivery{
		ID:        uuid.New().String(),
		WebhookID: webhook.ID,
		EventType: "webhook.test",
		Status:    model.DeliveryPending,
		Attempts:  1,
		CreatedAt: time.Now().UTC(),
	}

	payload, _ := json.Marshal(testEvent)
	delivery.Payload = payload
	signature := s.signPayload(payload, webhook.Secret)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, webhook.URL, bytes.NewReader(payload))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Navo-Signature", signature)
	req.Header.Set("X-Navo-Event", "webhook.test")
	req.Header.Set("X-Navo-Delivery-ID", delivery.ID)
	req.Header.Set("User-Agent", "Navo-Webhook/1.0")

	for key, value := range webhook.Headers {
		req.Header.Set(key, value)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		errMsg := err.Error()
		delivery.ErrorMessage = &errMsg
		delivery.Status = model.DeliveryFailed
		return delivery, nil
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	delivery.ResponseCode = &resp.StatusCode
	bodyStr := string(bodyBytes)
	delivery.ResponseBody = &bodyStr

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		delivery.Status = model.DeliverySuccess
		now := time.Now().UTC()
		delivery.DeliveredAt = &now
	} else {
		delivery.Status = model.DeliveryFailed
	}

	return delivery, nil
}

// signPayload creates an HMAC-SHA256 signature
func (s *WebhookService) signPayload(payload []byte, secret string) string {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(payload)
	return "sha256=" + hex.EncodeToString(h.Sum(nil))
}

// generateSecret generates a random secret for webhook signing
func generateSecret() string {
	return "whsec_" + uuid.New().String()
}
