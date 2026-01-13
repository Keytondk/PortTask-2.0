package jobs

import (
	"context"
	"database/sql"

	"github.com/navo/pkg/logger"
	"go.uber.org/zap"
)

// SessionCleanupJob cleans up expired sessions
type SessionCleanupJob struct {
	db *sql.DB
}

// NewSessionCleanupJob creates a new session cleanup job
func NewSessionCleanupJob(db *sql.DB) *SessionCleanupJob {
	return &SessionCleanupJob{db: db}
}

// Name returns the job name
func (j *SessionCleanupJob) Name() string {
	return "session_cleanup"
}

// Run executes the session cleanup
func (j *SessionCleanupJob) Run(ctx context.Context) error {
	// Delete expired sessions
	result, err := j.db.ExecContext(ctx, `
		DELETE FROM sessions WHERE expires_at < NOW()
	`)
	if err != nil {
		return err
	}

	count, _ := result.RowsAffected()
	if count > 0 {
		logger.Info("Cleaned up expired sessions", zap.Int64("count", count))
	}

	// Delete old password reset tokens (expired + older than 7 days)
	result, err = j.db.ExecContext(ctx, `
		DELETE FROM password_reset_tokens
		WHERE expires_at < NOW() OR created_at < NOW() - INTERVAL '7 days'
	`)
	if err != nil {
		return err
	}

	count, _ = result.RowsAffected()
	if count > 0 {
		logger.Info("Cleaned up old password reset tokens", zap.Int64("count", count))
	}

	// Delete old login attempts (older than 30 days)
	result, err = j.db.ExecContext(ctx, `
		DELETE FROM login_attempts WHERE created_at < NOW() - INTERVAL '30 days'
	`)
	if err != nil {
		return err
	}

	count, _ = result.RowsAffected()
	if count > 0 {
		logger.Info("Cleaned up old login attempts", zap.Int64("count", count))
	}

	return nil
}
