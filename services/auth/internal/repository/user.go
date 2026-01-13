package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/navo/services/auth/internal/model"
)

// UserRepository handles user database operations
type UserRepository struct {
	db *sql.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

// GetByID retrieves a user by ID
func (r *UserRepository) GetByID(ctx context.Context, id string) (*model.User, error) {
	query := `
		SELECT u.id, u.email, u.password_hash, u.name, u.organization_id,
			   u.roles, u.status, u.last_login_at, u.created_at, u.updated_at,
			   o.id, o.name, o.type
		FROM users u
		LEFT JOIN organizations o ON u.organization_id = o.id
		WHERE u.id = $1
	`

	var user model.User
	var org model.Organization
	var rolesJSON []byte
	var lastLoginAt sql.NullTime

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.OrganizationID,
		&rolesJSON, &user.Status, &lastLoginAt, &user.CreatedAt, &user.UpdatedAt,
		&org.ID, &org.Name, &org.Type,
	)
	if err != nil {
		return nil, err
	}

	json.Unmarshal(rolesJSON, &user.Roles)
	if lastLoginAt.Valid {
		user.LastLoginAt = &lastLoginAt.Time
	}
	user.Organization = &org

	return &user, nil
}

// GetByEmail retrieves a user by email
func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*model.User, error) {
	query := `
		SELECT u.id, u.email, u.password_hash, u.name, u.organization_id,
			   u.roles, u.status, u.last_login_at, u.created_at, u.updated_at,
			   o.id, o.name, o.type
		FROM users u
		LEFT JOIN organizations o ON u.organization_id = o.id
		WHERE LOWER(u.email) = LOWER($1)
	`

	var user model.User
	var org model.Organization
	var rolesJSON []byte
	var lastLoginAt sql.NullTime

	err := r.db.QueryRowContext(ctx, query, email).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.OrganizationID,
		&rolesJSON, &user.Status, &lastLoginAt, &user.CreatedAt, &user.UpdatedAt,
		&org.ID, &org.Name, &org.Type,
	)
	if err != nil {
		return nil, err
	}

	json.Unmarshal(rolesJSON, &user.Roles)
	if lastLoginAt.Valid {
		user.LastLoginAt = &lastLoginAt.Time
	}
	user.Organization = &org

	return &user, nil
}

// Create creates a new user
func (r *UserRepository) Create(ctx context.Context, user *model.User) error {
	rolesJSON, _ := json.Marshal(user.Roles)

	query := `
		INSERT INTO users (id, email, password_hash, name, organization_id, roles, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`

	_, err := r.db.ExecContext(ctx, query,
		user.ID, user.Email, user.PasswordHash, user.Name, user.OrganizationID,
		rolesJSON, user.Status, user.CreatedAt, user.UpdatedAt,
	)
	return err
}

// UpdatePassword updates a user's password
func (r *UserRepository) UpdatePassword(ctx context.Context, userID, passwordHash string) error {
	query := `UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3`
	_, err := r.db.ExecContext(ctx, query, passwordHash, time.Now(), userID)
	return err
}

// UpdateLastLogin updates the user's last login time
func (r *UserRepository) UpdateLastLogin(ctx context.Context, userID string) error {
	query := `UPDATE users SET last_login_at = $1, updated_at = $1 WHERE id = $2`
	_, err := r.db.ExecContext(ctx, query, time.Now(), userID)
	return err
}

// UpdateStatus updates a user's status
func (r *UserRepository) UpdateStatus(ctx context.Context, userID string, status model.UserStatus) error {
	query := `UPDATE users SET status = $1, updated_at = $2 WHERE id = $3`
	_, err := r.db.ExecContext(ctx, query, status, time.Now(), userID)
	return err
}

// UpdateProfile updates a user's profile
func (r *UserRepository) UpdateProfile(ctx context.Context, userID string, name string) error {
	query := `UPDATE users SET name = $1, updated_at = $2 WHERE id = $3`
	_, err := r.db.ExecContext(ctx, query, name, time.Now(), userID)
	return err
}

// RecordLoginAttempt records a login attempt
func (r *UserRepository) RecordLoginAttempt(ctx context.Context, attempt *model.LoginAttempt) error {
	query := `
		INSERT INTO login_attempts (id, user_id, email, ip_address, user_agent, success, fail_reason, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`

	_, err := r.db.ExecContext(ctx, query,
		attempt.ID, attempt.UserID, attempt.Email, attempt.IPAddress,
		attempt.UserAgent, attempt.Success, attempt.FailReason, attempt.CreatedAt,
	)
	return err
}

// GetRecentFailedAttempts gets the count of recent failed login attempts
func (r *UserRepository) GetRecentFailedAttempts(ctx context.Context, email string, since time.Time) (int, error) {
	query := `
		SELECT COUNT(*) FROM login_attempts
		WHERE LOWER(email) = LOWER($1) AND success = false AND created_at > $2
	`

	var count int
	err := r.db.QueryRowContext(ctx, query, email, since).Scan(&count)
	return count, err
}

// CreatePasswordResetToken creates a password reset token
func (r *UserRepository) CreatePasswordResetToken(ctx context.Context, token *model.PasswordResetToken) error {
	// Invalidate existing tokens for this user
	_, _ = r.db.ExecContext(ctx,
		`UPDATE password_reset_tokens SET used_at = $1 WHERE user_id = $2 AND used_at IS NULL`,
		time.Now(), token.UserID,
	)

	query := `
		INSERT INTO password_reset_tokens (id, user_id, token, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`

	_, err := r.db.ExecContext(ctx, query,
		token.ID, token.UserID, token.Token, token.ExpiresAt, token.CreatedAt,
	)
	return err
}

// GetPasswordResetToken retrieves a password reset token
func (r *UserRepository) GetPasswordResetToken(ctx context.Context, token string) (*model.PasswordResetToken, error) {
	query := `
		SELECT id, user_id, token, expires_at, used_at, created_at
		FROM password_reset_tokens
		WHERE token = $1 AND used_at IS NULL AND expires_at > $2
	`

	var prt model.PasswordResetToken
	var usedAt sql.NullTime

	err := r.db.QueryRowContext(ctx, query, token, time.Now()).Scan(
		&prt.ID, &prt.UserID, &prt.Token, &prt.ExpiresAt, &usedAt, &prt.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	if usedAt.Valid {
		prt.UsedAt = &usedAt.Time
	}

	return &prt, nil
}

// MarkPasswordResetTokenUsed marks a password reset token as used
func (r *UserRepository) MarkPasswordResetTokenUsed(ctx context.Context, tokenID string) error {
	query := `UPDATE password_reset_tokens SET used_at = $1 WHERE id = $2`
	_, err := r.db.ExecContext(ctx, query, time.Now(), tokenID)
	return err
}

// CreateSession creates a new session
func (r *UserRepository) CreateSession(ctx context.Context, session *model.Session) error {
	query := `
		INSERT INTO sessions (id, user_id, refresh_token, ip_address, user_agent, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`

	_, err := r.db.ExecContext(ctx, query,
		session.ID, session.UserID, session.RefreshToken, session.IPAddress,
		session.UserAgent, session.ExpiresAt, session.CreatedAt,
	)
	return err
}

// GetSessionByRefreshToken retrieves a session by refresh token
func (r *UserRepository) GetSessionByRefreshToken(ctx context.Context, refreshToken string) (*model.Session, error) {
	query := `
		SELECT id, user_id, refresh_token, ip_address, user_agent, expires_at, created_at
		FROM sessions
		WHERE refresh_token = $1 AND expires_at > $2
	`

	var session model.Session
	err := r.db.QueryRowContext(ctx, query, refreshToken, time.Now()).Scan(
		&session.ID, &session.UserID, &session.RefreshToken, &session.IPAddress,
		&session.UserAgent, &session.ExpiresAt, &session.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &session, nil
}

// DeleteSession deletes a session
func (r *UserRepository) DeleteSession(ctx context.Context, sessionID string) error {
	query := `DELETE FROM sessions WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, sessionID)
	return err
}

// DeleteUserSessions deletes all sessions for a user
func (r *UserRepository) DeleteUserSessions(ctx context.Context, userID string) error {
	query := `DELETE FROM sessions WHERE user_id = $1`
	_, err := r.db.ExecContext(ctx, query, userID)
	return err
}

// DeleteExpiredSessions cleans up expired sessions
func (r *UserRepository) DeleteExpiredSessions(ctx context.Context) (int64, error) {
	result, err := r.db.ExecContext(ctx, `DELETE FROM sessions WHERE expires_at < $1`, time.Now())
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}

// EnsureTablesExist creates the required tables if they don't exist
func (r *UserRepository) EnsureTablesExist(ctx context.Context) error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS login_attempts (
			id VARCHAR(255) PRIMARY KEY,
			user_id VARCHAR(255),
			email VARCHAR(255) NOT NULL,
			ip_address VARCHAR(45),
			user_agent TEXT,
			success BOOLEAN NOT NULL DEFAULT false,
			fail_reason VARCHAR(255),
			created_at TIMESTAMP NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_login_attempts_email_created ON login_attempts(email, created_at)`,

		`CREATE TABLE IF NOT EXISTS password_reset_tokens (
			id VARCHAR(255) PRIMARY KEY,
			user_id VARCHAR(255) NOT NULL,
			token VARCHAR(255) NOT NULL UNIQUE,
			expires_at TIMESTAMP NOT NULL,
			used_at TIMESTAMP,
			created_at TIMESTAMP NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token)`,

		`CREATE TABLE IF NOT EXISTS sessions (
			id VARCHAR(255) PRIMARY KEY,
			user_id VARCHAR(255) NOT NULL,
			refresh_token VARCHAR(512) NOT NULL,
			ip_address VARCHAR(45),
			user_agent TEXT,
			expires_at TIMESTAMP NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token)`,
	}

	for _, query := range queries {
		if _, err := r.db.ExecContext(ctx, query); err != nil {
			return fmt.Errorf("failed to create table: %w", err)
		}
	}

	return nil
}
