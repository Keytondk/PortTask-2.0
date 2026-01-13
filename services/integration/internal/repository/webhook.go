package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/lib/pq"
	"github.com/navo/services/integration/internal/model"
)

// WebhookRepository handles webhook data persistence
type WebhookRepository struct {
	db *sql.DB
}

// NewWebhookRepository creates a new webhook repository
func NewWebhookRepository(db *sql.DB) *WebhookRepository {
	return &WebhookRepository{db: db}
}

// Create creates a new webhook
func (r *WebhookRepository) Create(ctx context.Context, webhook *model.Webhook) error {
	eventsJSON, err := json.Marshal(webhook.Events)
	if err != nil {
		return fmt.Errorf("failed to marshal events: %w", err)
	}

	headersJSON, err := json.Marshal(webhook.Headers)
	if err != nil {
		return fmt.Errorf("failed to marshal headers: %w", err)
	}

	query := `
		INSERT INTO webhooks (
			id, organization_id, workspace_id, name, url, secret,
			events, is_active, headers, created_at, updated_at, failure_count
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`

	_, err = r.db.ExecContext(ctx, query,
		webhook.ID,
		webhook.OrganizationID,
		webhook.WorkspaceID,
		webhook.Name,
		webhook.URL,
		webhook.Secret,
		eventsJSON,
		webhook.IsActive,
		headersJSON,
		webhook.CreatedAt,
		webhook.UpdatedAt,
		webhook.FailureCount,
	)

	return err
}

// GetByID retrieves a webhook by ID
func (r *WebhookRepository) GetByID(ctx context.Context, id string) (*model.Webhook, error) {
	query := `
		SELECT id, organization_id, workspace_id, name, url, secret,
			   events, is_active, headers, created_at, updated_at,
			   last_triggered_at, failure_count
		FROM webhooks WHERE id = $1
	`

	webhook := &model.Webhook{}
	var eventsJSON, headersJSON []byte

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&webhook.ID,
		&webhook.OrganizationID,
		&webhook.WorkspaceID,
		&webhook.Name,
		&webhook.URL,
		&webhook.Secret,
		&eventsJSON,
		&webhook.IsActive,
		&headersJSON,
		&webhook.CreatedAt,
		&webhook.UpdatedAt,
		&webhook.LastTriggeredAt,
		&webhook.FailureCount,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("webhook not found")
	}
	if err != nil {
		return nil, err
	}

	if err := json.Unmarshal(eventsJSON, &webhook.Events); err != nil {
		return nil, fmt.Errorf("failed to unmarshal events: %w", err)
	}

	if len(headersJSON) > 0 {
		if err := json.Unmarshal(headersJSON, &webhook.Headers); err != nil {
			return nil, fmt.Errorf("failed to unmarshal headers: %w", err)
		}
	}

	return webhook, nil
}

// ListByOrganization lists webhooks for an organization
func (r *WebhookRepository) ListByOrganization(ctx context.Context, orgID string, page, pageSize int) ([]model.Webhook, int, error) {
	countQuery := `SELECT COUNT(*) FROM webhooks WHERE organization_id = $1`
	var total int
	if err := r.db.QueryRowContext(ctx, countQuery, orgID).Scan(&total); err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	query := `
		SELECT id, organization_id, workspace_id, name, url,
			   events, is_active, headers, created_at, updated_at,
			   last_triggered_at, failure_count
		FROM webhooks
		WHERE organization_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.QueryContext(ctx, query, orgID, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var webhooks []model.Webhook
	for rows.Next() {
		var w model.Webhook
		var eventsJSON, headersJSON []byte

		err := rows.Scan(
			&w.ID,
			&w.OrganizationID,
			&w.WorkspaceID,
			&w.Name,
			&w.URL,
			&eventsJSON,
			&w.IsActive,
			&headersJSON,
			&w.CreatedAt,
			&w.UpdatedAt,
			&w.LastTriggeredAt,
			&w.FailureCount,
		)
		if err != nil {
			return nil, 0, err
		}

		json.Unmarshal(eventsJSON, &w.Events)
		if len(headersJSON) > 0 {
			json.Unmarshal(headersJSON, &w.Headers)
		}

		webhooks = append(webhooks, w)
	}

	return webhooks, total, nil
}

// Update updates a webhook
func (r *WebhookRepository) Update(ctx context.Context, webhook *model.Webhook) error {
	eventsJSON, err := json.Marshal(webhook.Events)
	if err != nil {
		return fmt.Errorf("failed to marshal events: %w", err)
	}

	headersJSON, err := json.Marshal(webhook.Headers)
	if err != nil {
		return fmt.Errorf("failed to marshal headers: %w", err)
	}

	query := `
		UPDATE webhooks SET
			name = $2,
			url = $3,
			secret = $4,
			events = $5,
			is_active = $6,
			headers = $7,
			updated_at = $8,
			last_triggered_at = $9,
			failure_count = $10
		WHERE id = $1
	`

	_, err = r.db.ExecContext(ctx, query,
		webhook.ID,
		webhook.Name,
		webhook.URL,
		webhook.Secret,
		eventsJSON,
		webhook.IsActive,
		headersJSON,
		webhook.UpdatedAt,
		webhook.LastTriggeredAt,
		webhook.FailureCount,
	)

	return err
}

// Delete deletes a webhook
func (r *WebhookRepository) Delete(ctx context.Context, id string) error {
	// Delete deliveries first
	_, err := r.db.ExecContext(ctx, "DELETE FROM webhook_deliveries WHERE webhook_id = $1", id)
	if err != nil {
		return err
	}

	_, err = r.db.ExecContext(ctx, "DELETE FROM webhooks WHERE id = $1", id)
	return err
}

// FindByEvent finds webhooks subscribed to a specific event type
func (r *WebhookRepository) FindByEvent(ctx context.Context, orgID string, eventType model.WebhookEventType) ([]model.Webhook, error) {
	query := `
		SELECT id, organization_id, workspace_id, name, url, secret,
			   events, is_active, headers, created_at, updated_at,
			   last_triggered_at, failure_count
		FROM webhooks
		WHERE organization_id = $1
		  AND is_active = true
		  AND events @> $2::jsonb
	`

	eventJSON, _ := json.Marshal([]string{string(eventType)})

	rows, err := r.db.QueryContext(ctx, query, orgID, eventJSON)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var webhooks []model.Webhook
	for rows.Next() {
		var w model.Webhook
		var eventsJSON, headersJSON []byte

		err := rows.Scan(
			&w.ID,
			&w.OrganizationID,
			&w.WorkspaceID,
			&w.Name,
			&w.URL,
			&w.Secret,
			&eventsJSON,
			&w.IsActive,
			&headersJSON,
			&w.CreatedAt,
			&w.UpdatedAt,
			&w.LastTriggeredAt,
			&w.FailureCount,
		)
		if err != nil {
			return nil, err
		}

		json.Unmarshal(eventsJSON, &w.Events)
		if len(headersJSON) > 0 {
			json.Unmarshal(headersJSON, &w.Headers)
		}

		webhooks = append(webhooks, w)
	}

	return webhooks, nil
}

// SaveDelivery saves a webhook delivery record
func (r *WebhookRepository) SaveDelivery(ctx context.Context, delivery *model.WebhookDelivery) error {
	query := `
		INSERT INTO webhook_deliveries (
			id, webhook_id, event_type, payload, response_code,
			response_body, error_message, attempts, status,
			created_at, delivered_at, next_retry_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		ON CONFLICT (id) DO UPDATE SET
			response_code = $5,
			response_body = $6,
			error_message = $7,
			attempts = $8,
			status = $9,
			delivered_at = $11,
			next_retry_at = $12
	`

	_, err := r.db.ExecContext(ctx, query,
		delivery.ID,
		delivery.WebhookID,
		delivery.EventType,
		delivery.Payload,
		delivery.ResponseCode,
		delivery.ResponseBody,
		delivery.ErrorMessage,
		delivery.Attempts,
		delivery.Status,
		delivery.CreatedAt,
		delivery.DeliveredAt,
		delivery.NextRetryAt,
	)

	return err
}

// ListDeliveries lists webhook deliveries
func (r *WebhookRepository) ListDeliveries(ctx context.Context, webhookID string, page, pageSize int) ([]model.WebhookDelivery, int, error) {
	countQuery := `SELECT COUNT(*) FROM webhook_deliveries WHERE webhook_id = $1`
	var total int
	if err := r.db.QueryRowContext(ctx, countQuery, webhookID).Scan(&total); err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	query := `
		SELECT id, webhook_id, event_type, payload, response_code,
			   response_body, error_message, attempts, status,
			   created_at, delivered_at, next_retry_at
		FROM webhook_deliveries
		WHERE webhook_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.QueryContext(ctx, query, webhookID, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var deliveries []model.WebhookDelivery
	for rows.Next() {
		var d model.WebhookDelivery
		err := rows.Scan(
			&d.ID,
			&d.WebhookID,
			&d.EventType,
			&d.Payload,
			&d.ResponseCode,
			&d.ResponseBody,
			&d.ErrorMessage,
			&d.Attempts,
			&d.Status,
			&d.CreatedAt,
			&d.DeliveredAt,
			&d.NextRetryAt,
		)
		if err != nil {
			return nil, 0, err
		}
		deliveries = append(deliveries, d)
	}

	return deliveries, total, nil
}

// InitSchema creates the webhook tables if they don't exist
func (r *WebhookRepository) InitSchema(ctx context.Context) error {
	schema := `
		CREATE TABLE IF NOT EXISTS webhooks (
			id TEXT PRIMARY KEY,
			organization_id TEXT NOT NULL,
			workspace_id TEXT,
			name TEXT NOT NULL,
			url TEXT NOT NULL,
			secret TEXT NOT NULL,
			events JSONB NOT NULL DEFAULT '[]',
			is_active BOOLEAN NOT NULL DEFAULT true,
			headers JSONB DEFAULT '{}',
			created_at TIMESTAMP WITH TIME ZONE NOT NULL,
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
			last_triggered_at TIMESTAMP WITH TIME ZONE,
			failure_count INTEGER NOT NULL DEFAULT 0
		);

		CREATE INDEX IF NOT EXISTS idx_webhooks_org ON webhooks(organization_id);
		CREATE INDEX IF NOT EXISTS idx_webhooks_events ON webhooks USING GIN(events);

		CREATE TABLE IF NOT EXISTS webhook_deliveries (
			id TEXT PRIMARY KEY,
			webhook_id TEXT NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
			event_type TEXT NOT NULL,
			payload JSONB NOT NULL,
			response_code INTEGER,
			response_body TEXT,
			error_message TEXT,
			attempts INTEGER NOT NULL DEFAULT 0,
			status TEXT NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL,
			delivered_at TIMESTAMP WITH TIME ZONE,
			next_retry_at TIMESTAMP WITH TIME ZONE
		);

		CREATE INDEX IF NOT EXISTS idx_deliveries_webhook ON webhook_deliveries(webhook_id);
		CREATE INDEX IF NOT EXISTS idx_deliveries_status ON webhook_deliveries(status);
	`

	_, err := r.db.ExecContext(ctx, schema)
	return err
}
