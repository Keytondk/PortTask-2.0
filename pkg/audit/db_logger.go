package audit

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/navo/pkg/logger"
	"go.uber.org/zap"
)

// DBLogger implements Logger interface using PostgreSQL
type DBLogger struct {
	pool        *pgxpool.Pool
	asyncChan   chan Event
	wg          sync.WaitGroup
	closeOnce   sync.Once
	closeChan   chan struct{}
	bufferSize  int
	flushPeriod time.Duration
}

// DBLoggerConfig holds configuration for DBLogger
type DBLoggerConfig struct {
	// BufferSize is the size of the async event buffer
	BufferSize int
	// FlushPeriod is how often to flush buffered events
	FlushPeriod time.Duration
	// Workers is the number of async workers
	Workers int
}

// DefaultDBLoggerConfig returns default configuration
func DefaultDBLoggerConfig() *DBLoggerConfig {
	return &DBLoggerConfig{
		BufferSize:  1000,
		FlushPeriod: time.Second * 5,
		Workers:     2,
	}
}

// NewDBLogger creates a new database-backed audit logger
func NewDBLogger(pool *pgxpool.Pool, cfg *DBLoggerConfig) *DBLogger {
	if cfg == nil {
		cfg = DefaultDBLoggerConfig()
	}

	l := &DBLogger{
		pool:        pool,
		asyncChan:   make(chan Event, cfg.BufferSize),
		closeChan:   make(chan struct{}),
		bufferSize:  cfg.BufferSize,
		flushPeriod: cfg.FlushPeriod,
	}

	// Start async workers
	for i := 0; i < cfg.Workers; i++ {
		l.wg.Add(1)
		go l.worker()
	}

	return l
}

// worker processes events from the async channel
func (l *DBLogger) worker() {
	defer l.wg.Done()

	for {
		select {
		case event := <-l.asyncChan:
			if err := l.insertEvent(context.Background(), event); err != nil {
				logger.Error("Failed to insert audit event",
					zap.String("entity_type", string(event.EntityType)),
					zap.String("action", string(event.Action)),
					zap.Error(err),
				)
			}
		case <-l.closeChan:
			// Drain remaining events
			for {
				select {
				case event := <-l.asyncChan:
					if err := l.insertEvent(context.Background(), event); err != nil {
						logger.Error("Failed to insert audit event during shutdown",
							zap.Error(err),
						)
					}
				default:
					return
				}
			}
		}
	}
}

// Log records an audit event synchronously
func (l *DBLogger) Log(ctx context.Context, event Event) error {
	return l.insertEvent(ctx, event)
}

// LogAsync records an audit event asynchronously (non-blocking)
func (l *DBLogger) LogAsync(ctx context.Context, event Event) {
	select {
	case l.asyncChan <- event:
		// Event queued successfully
	default:
		// Buffer full, log warning and try sync insert
		logger.Warn("Audit log buffer full, falling back to sync insert",
			zap.String("entity_type", string(event.EntityType)),
		)
		go func() {
			if err := l.insertEvent(context.Background(), event); err != nil {
				logger.Error("Failed to insert audit event",
					zap.Error(err),
				)
			}
		}()
	}
}

// insertEvent inserts an event into the database
func (l *DBLogger) insertEvent(ctx context.Context, event Event) error {
	if event.ID == "" {
		event.ID = uuid.New().String()
	}
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now().UTC()
	}

	query := `
		INSERT INTO audit_logs (
			id, timestamp, user_id, organization_id, workspace_id,
			action, entity_type, entity_id, old_value, new_value,
			metadata, ip_address, user_agent, request_id, status, error_message
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
		)
	`

	_, err := l.pool.Exec(ctx, query,
		event.ID,
		event.Timestamp,
		event.UserID,
		event.OrganizationID,
		nullableString(event.WorkspaceID),
		event.Action,
		event.EntityType,
		event.EntityID,
		event.OldValue,
		event.NewValue,
		event.Metadata,
		nullableString(event.IPAddress),
		nullableString(event.UserAgent),
		nullableString(event.RequestID),
		event.Status,
		nullableString(event.ErrorMessage),
	)

	if err != nil {
		return fmt.Errorf("failed to insert audit event: %w", err)
	}

	return nil
}

// Query retrieves audit events matching the filter
func (l *DBLogger) Query(ctx context.Context, filter Filter) (*Result, error) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.PerPage <= 0 || filter.PerPage > 100 {
		filter.PerPage = 20
	}

	// Build WHERE clause
	conditions := []string{}
	args := []interface{}{}
	argNum := 1

	if filter.OrganizationID != "" {
		conditions = append(conditions, fmt.Sprintf("organization_id = $%d", argNum))
		args = append(args, filter.OrganizationID)
		argNum++
	}
	if filter.UserID != "" {
		conditions = append(conditions, fmt.Sprintf("user_id = $%d", argNum))
		args = append(args, filter.UserID)
		argNum++
	}
	if filter.WorkspaceID != "" {
		conditions = append(conditions, fmt.Sprintf("workspace_id = $%d", argNum))
		args = append(args, filter.WorkspaceID)
		argNum++
	}
	if filter.Action != "" {
		conditions = append(conditions, fmt.Sprintf("action = $%d", argNum))
		args = append(args, filter.Action)
		argNum++
	}
	if filter.EntityType != "" {
		conditions = append(conditions, fmt.Sprintf("entity_type = $%d", argNum))
		args = append(args, filter.EntityType)
		argNum++
	}
	if filter.EntityID != "" {
		conditions = append(conditions, fmt.Sprintf("entity_id = $%d", argNum))
		args = append(args, filter.EntityID)
		argNum++
	}
	if !filter.StartTime.IsZero() {
		conditions = append(conditions, fmt.Sprintf("timestamp >= $%d", argNum))
		args = append(args, filter.StartTime)
		argNum++
	}
	if !filter.EndTime.IsZero() {
		conditions = append(conditions, fmt.Sprintf("timestamp <= $%d", argNum))
		args = append(args, filter.EndTime)
		argNum++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + conditions[0]
		for i := 1; i < len(conditions); i++ {
			whereClause += " AND " + conditions[i]
		}
	}

	// Count total
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM audit_logs %s", whereClause)
	var total int64
	if err := l.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, fmt.Errorf("failed to count audit events: %w", err)
	}

	// Query events
	offset := (filter.Page - 1) * filter.PerPage
	args = append(args, filter.PerPage, offset)

	query := fmt.Sprintf(`
		SELECT id, timestamp, user_id, organization_id, workspace_id,
			action, entity_type, entity_id, old_value, new_value,
			metadata, ip_address, user_agent, request_id, status, error_message
		FROM audit_logs
		%s
		ORDER BY timestamp DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argNum, argNum+1)

	rows, err := l.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query audit events: %w", err)
	}
	defer rows.Close()

	events := []Event{}
	for rows.Next() {
		var event Event
		var workspaceID, ipAddress, userAgent, requestID, errorMessage *string

		err := rows.Scan(
			&event.ID,
			&event.Timestamp,
			&event.UserID,
			&event.OrganizationID,
			&workspaceID,
			&event.Action,
			&event.EntityType,
			&event.EntityID,
			&event.OldValue,
			&event.NewValue,
			&event.Metadata,
			&ipAddress,
			&userAgent,
			&requestID,
			&event.Status,
			&errorMessage,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan audit event: %w", err)
		}

		if workspaceID != nil {
			event.WorkspaceID = *workspaceID
		}
		if ipAddress != nil {
			event.IPAddress = *ipAddress
		}
		if userAgent != nil {
			event.UserAgent = *userAgent
		}
		if requestID != nil {
			event.RequestID = *requestID
		}
		if errorMessage != nil {
			event.ErrorMessage = *errorMessage
		}

		events = append(events, event)
	}

	return &Result{
		Events:  events,
		Total:   total,
		Page:    filter.Page,
		PerPage: filter.PerPage,
	}, nil
}

// GetByID retrieves a specific audit event
func (l *DBLogger) GetByID(ctx context.Context, id string) (*Event, error) {
	query := `
		SELECT id, timestamp, user_id, organization_id, workspace_id,
			action, entity_type, entity_id, old_value, new_value,
			metadata, ip_address, user_agent, request_id, status, error_message
		FROM audit_logs
		WHERE id = $1
	`

	var event Event
	var workspaceID, ipAddress, userAgent, requestID, errorMessage *string

	err := l.pool.QueryRow(ctx, query, id).Scan(
		&event.ID,
		&event.Timestamp,
		&event.UserID,
		&event.OrganizationID,
		&workspaceID,
		&event.Action,
		&event.EntityType,
		&event.EntityID,
		&event.OldValue,
		&event.NewValue,
		&event.Metadata,
		&ipAddress,
		&userAgent,
		&requestID,
		&event.Status,
		&errorMessage,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get audit event: %w", err)
	}

	if workspaceID != nil {
		event.WorkspaceID = *workspaceID
	}
	if ipAddress != nil {
		event.IPAddress = *ipAddress
	}
	if userAgent != nil {
		event.UserAgent = *userAgent
	}
	if requestID != nil {
		event.RequestID = *requestID
	}
	if errorMessage != nil {
		event.ErrorMessage = *errorMessage
	}

	return &event, nil
}

// Close closes the logger and flushes any pending events
func (l *DBLogger) Close() error {
	l.closeOnce.Do(func() {
		close(l.closeChan)
		l.wg.Wait()
	})
	return nil
}

// nullableString returns nil for empty strings
func nullableString(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
