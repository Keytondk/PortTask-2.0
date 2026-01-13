package service

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"regexp"
	"time"
	"unicode"

	"github.com/google/uuid"
	"github.com/navo/pkg/auth"
	"github.com/navo/services/auth/internal/config"
	"github.com/navo/services/auth/internal/model"
	"github.com/navo/services/auth/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

// AuthService handles authentication business logic
type AuthService struct {
	repo   *repository.UserRepository
	config *config.Config
}

// NewAuthService creates a new auth service
func NewAuthService(repo *repository.UserRepository, cfg *config.Config) *AuthService {
	return &AuthService{
		repo:   repo,
		config: cfg,
	}
}

// Login authenticates a user and returns tokens
func (s *AuthService) Login(ctx context.Context, input model.LoginInput, ipAddress, userAgent string) (*model.AuthResponse, error) {
	// Check rate limiting (failed attempts)
	since := time.Now().Add(-s.config.LockoutDuration)
	failedAttempts, _ := s.repo.GetRecentFailedAttempts(ctx, input.Email, since)

	if failedAttempts >= s.config.MaxLoginAttempts {
		s.recordLoginAttempt(ctx, "", input.Email, ipAddress, userAgent, false, "account_locked")
		return nil, fmt.Errorf("account temporarily locked due to too many failed attempts")
	}

	// Get user by email
	user, err := s.repo.GetByEmail(ctx, input.Email)
	if err != nil {
		if err == sql.ErrNoRows {
			s.recordLoginAttempt(ctx, "", input.Email, ipAddress, userAgent, false, "user_not_found")
			return nil, fmt.Errorf("invalid email or password")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Check user status
	if user.Status != model.UserStatusActive {
		s.recordLoginAttempt(ctx, user.ID, input.Email, ipAddress, userAgent, false, "account_inactive")
		return nil, fmt.Errorf("account is not active")
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		s.recordLoginAttempt(ctx, user.ID, input.Email, ipAddress, userAgent, false, "invalid_password")
		return nil, fmt.Errorf("invalid email or password")
	}

	// Generate tokens
	tokens, err := auth.GenerateTokenPair(
		user.ID,
		user.OrganizationID,
		user.Email,
		user.Organization.Type,
		user.Roles,
		[]string{}, // Permissions can be derived from roles
	)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	// Create session
	session := &model.Session{
		ID:           uuid.New().String(),
		UserID:       user.ID,
		RefreshToken: tokens.RefreshToken,
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
		ExpiresAt:    time.Now().Add(s.config.RefreshTokenExpiry),
		CreatedAt:    time.Now(),
	}

	if err := s.repo.CreateSession(ctx, session); err != nil {
		// Log but don't fail - tokens are still valid
		fmt.Printf("Warning: failed to create session: %v\n", err)
	}

	// Update last login
	s.repo.UpdateLastLogin(ctx, user.ID)

	// Record successful login
	s.recordLoginAttempt(ctx, user.ID, input.Email, ipAddress, userAgent, true, "")

	// Clear password hash before returning
	user.PasswordHash = ""

	return &model.AuthResponse{
		User:         user,
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		ExpiresAt:    tokens.ExpiresAt.Unix(),
	}, nil
}

// Logout invalidates a user's session
func (s *AuthService) Logout(ctx context.Context, refreshToken string) error {
	session, err := s.repo.GetSessionByRefreshToken(ctx, refreshToken)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil // Session already gone
		}
		return fmt.Errorf("failed to get session: %w", err)
	}

	return s.repo.DeleteSession(ctx, session.ID)
}

// LogoutAll invalidates all sessions for a user
func (s *AuthService) LogoutAll(ctx context.Context, userID string) error {
	return s.repo.DeleteUserSessions(ctx, userID)
}

// RefreshToken generates new tokens from a refresh token
func (s *AuthService) RefreshToken(ctx context.Context, refreshToken string) (*model.AuthResponse, error) {
	// Validate refresh token
	claims, err := auth.ValidateToken(refreshToken)
	if err != nil {
		return nil, fmt.Errorf("invalid refresh token")
	}

	// Check session exists
	session, err := s.repo.GetSessionByRefreshToken(ctx, refreshToken)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("session not found or expired")
		}
		return nil, fmt.Errorf("failed to get session: %w", err)
	}

	// Get fresh user data
	user, err := s.repo.GetByID(ctx, claims.UserID)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}

	// Check user still active
	if user.Status != model.UserStatusActive {
		s.repo.DeleteSession(ctx, session.ID)
		return nil, fmt.Errorf("account is not active")
	}

	// Generate new tokens
	tokens, err := auth.GenerateTokenPair(
		user.ID,
		user.OrganizationID,
		user.Email,
		user.Organization.Type,
		user.Roles,
		[]string{},
	)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	// Delete old session
	s.repo.DeleteSession(ctx, session.ID)

	// Create new session
	newSession := &model.Session{
		ID:           uuid.New().String(),
		UserID:       user.ID,
		RefreshToken: tokens.RefreshToken,
		IPAddress:    session.IPAddress,
		UserAgent:    session.UserAgent,
		ExpiresAt:    time.Now().Add(s.config.RefreshTokenExpiry),
		CreatedAt:    time.Now(),
	}
	s.repo.CreateSession(ctx, newSession)

	user.PasswordHash = ""

	return &model.AuthResponse{
		User:         user,
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		ExpiresAt:    tokens.ExpiresAt.Unix(),
	}, nil
}

// GetMe returns the current user's profile
func (s *AuthService) GetMe(ctx context.Context, userID string) (*model.User, error) {
	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}

	user.PasswordHash = ""
	return user, nil
}

// UpdateProfile updates the user's profile
func (s *AuthService) UpdateProfile(ctx context.Context, userID string, input model.UpdateProfileInput) (*model.User, error) {
	if err := s.repo.UpdateProfile(ctx, userID, input.Name); err != nil {
		return nil, fmt.Errorf("failed to update profile: %w", err)
	}

	return s.GetMe(ctx, userID)
}

// ChangePassword changes the user's password
func (s *AuthService) ChangePassword(ctx context.Context, userID string, input model.ChangePasswordInput) error {
	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("user not found")
	}

	// Verify current password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.CurrentPassword)); err != nil {
		return fmt.Errorf("current password is incorrect")
	}

	// Validate new password
	if err := s.validatePassword(input.NewPassword); err != nil {
		return err
	}

	// Hash new password
	hash, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), s.config.BcryptCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Update password
	if err := s.repo.UpdatePassword(ctx, userID, string(hash)); err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	// Invalidate all sessions except current (optional - uncomment if desired)
	// s.repo.DeleteUserSessions(ctx, userID)

	return nil
}

// ForgotPassword initiates password reset process
func (s *AuthService) ForgotPassword(ctx context.Context, input model.ForgotPasswordInput) error {
	user, err := s.repo.GetByEmail(ctx, input.Email)
	if err != nil {
		// Don't reveal if email exists
		return nil
	}

	// Generate secure token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return fmt.Errorf("failed to generate token")
	}
	token := hex.EncodeToString(tokenBytes)

	// Save reset token
	resetToken := &model.PasswordResetToken{
		ID:        uuid.New().String(),
		UserID:    user.ID,
		Token:     token,
		ExpiresAt: time.Now().Add(1 * time.Hour), // 1 hour expiry
		CreatedAt: time.Now(),
	}

	if err := s.repo.CreatePasswordResetToken(ctx, resetToken); err != nil {
		return fmt.Errorf("failed to create reset token: %w", err)
	}

	// TODO: Send email with reset link
	// resetLink := fmt.Sprintf("%s?token=%s", s.config.PasswordResetURL, token)
	// s.emailService.SendPasswordReset(user.Email, user.Name, resetLink)

	return nil
}

// ResetPassword resets the password using a reset token
func (s *AuthService) ResetPassword(ctx context.Context, input model.ResetPasswordInput) error {
	// Get and validate token
	resetToken, err := s.repo.GetPasswordResetToken(ctx, input.Token)
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("invalid or expired reset token")
		}
		return fmt.Errorf("failed to validate token: %w", err)
	}

	// Validate new password
	if err := s.validatePassword(input.NewPassword); err != nil {
		return err
	}

	// Hash new password
	hash, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), s.config.BcryptCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Update password
	if err := s.repo.UpdatePassword(ctx, resetToken.UserID, string(hash)); err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	// Mark token as used
	s.repo.MarkPasswordResetTokenUsed(ctx, resetToken.ID)

	// Invalidate all sessions
	s.repo.DeleteUserSessions(ctx, resetToken.UserID)

	return nil
}

// ValidateToken validates an access token and returns user info
func (s *AuthService) ValidateToken(ctx context.Context, tokenString string) (*model.TokenValidation, error) {
	claims, err := auth.ValidateToken(tokenString)
	if err != nil {
		return &model.TokenValidation{
			Valid: false,
			Error: err.Error(),
		}, nil
	}

	return &model.TokenValidation{
		Valid:          true,
		UserID:         claims.UserID,
		OrganizationID: claims.OrganizationID,
		Email:          claims.Email,
		Roles:          claims.Roles,
	}, nil
}

// validatePassword validates password strength
func (s *AuthService) validatePassword(password string) error {
	if len(password) < s.config.PasswordMinLength {
		return fmt.Errorf("password must be at least %d characters", s.config.PasswordMinLength)
	}

	var hasUpper, hasLower, hasNumber, hasSpecial bool

	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsNumber(char):
			hasNumber = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	if !hasUpper {
		return fmt.Errorf("password must contain at least one uppercase letter")
	}
	if !hasLower {
		return fmt.Errorf("password must contain at least one lowercase letter")
	}
	if !hasNumber {
		return fmt.Errorf("password must contain at least one number")
	}
	if !hasSpecial {
		return fmt.Errorf("password must contain at least one special character")
	}

	// Check for common patterns
	commonPatterns := []string{
		`(?i)password`,
		`(?i)123456`,
		`(?i)qwerty`,
	}
	for _, pattern := range commonPatterns {
		if matched, _ := regexp.MatchString(pattern, password); matched {
			return fmt.Errorf("password is too common")
		}
	}

	return nil
}

// recordLoginAttempt records a login attempt for security monitoring
func (s *AuthService) recordLoginAttempt(ctx context.Context, userID, email, ipAddress, userAgent string, success bool, failReason string) {
	attempt := &model.LoginAttempt{
		ID:         uuid.New().String(),
		UserID:     userID,
		Email:      email,
		IPAddress:  ipAddress,
		UserAgent:  userAgent,
		Success:    success,
		FailReason: failReason,
		CreatedAt:  time.Now(),
	}

	// Fire and forget - don't block on this
	go func() {
		s.repo.RecordLoginAttempt(context.Background(), attempt)
	}()
}

// CleanupExpiredSessions cleans up expired sessions (called by worker)
func (s *AuthService) CleanupExpiredSessions(ctx context.Context) (int64, error) {
	return s.repo.DeleteExpiredSessions(ctx)
}
