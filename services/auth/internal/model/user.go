package model

import (
	"time"
)

// User represents a user in the system
type User struct {
	ID             string     `json:"id" db:"id"`
	Email          string     `json:"email" db:"email"`
	PasswordHash   string     `json:"-" db:"password_hash"`
	Name           string     `json:"name" db:"name"`
	OrganizationID string     `json:"organization_id" db:"organization_id"`
	Roles          []string   `json:"roles" db:"roles"`
	Status         UserStatus `json:"status" db:"status"`
	LastLoginAt    *time.Time `json:"last_login_at,omitempty" db:"last_login_at"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at" db:"updated_at"`

	// Relations
	Organization *Organization `json:"organization,omitempty"`
}

// UserStatus represents the status of a user
type UserStatus string

const (
	UserStatusActive    UserStatus = "active"
	UserStatusInactive  UserStatus = "inactive"
	UserStatusLocked    UserStatus = "locked"
	UserStatusPending   UserStatus = "pending"
)

// Organization represents a basic organization
type Organization struct {
	ID   string `json:"id" db:"id"`
	Name string `json:"name" db:"name"`
	Type string `json:"type" db:"type"`
}

// LoginAttempt tracks failed login attempts
type LoginAttempt struct {
	ID        string    `json:"id" db:"id"`
	UserID    string    `json:"user_id" db:"user_id"`
	Email     string    `json:"email" db:"email"`
	IPAddress string    `json:"ip_address" db:"ip_address"`
	UserAgent string    `json:"user_agent" db:"user_agent"`
	Success   bool      `json:"success" db:"success"`
	FailReason string   `json:"fail_reason,omitempty" db:"fail_reason"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// PasswordResetToken represents a password reset token
type PasswordResetToken struct {
	ID        string    `json:"id" db:"id"`
	UserID    string    `json:"user_id" db:"user_id"`
	Token     string    `json:"token" db:"token"`
	ExpiresAt time.Time `json:"expires_at" db:"expires_at"`
	UsedAt    *time.Time `json:"used_at,omitempty" db:"used_at"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// Session represents an active user session
type Session struct {
	ID           string    `json:"id" db:"id"`
	UserID       string    `json:"user_id" db:"user_id"`
	RefreshToken string    `json:"-" db:"refresh_token"`
	IPAddress    string    `json:"ip_address" db:"ip_address"`
	UserAgent    string    `json:"user_agent" db:"user_agent"`
	ExpiresAt    time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

// LoginInput represents login request input
type LoginInput struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// RegisterInput represents registration request input
type RegisterInput struct {
	Email          string `json:"email" validate:"required,email"`
	Password       string `json:"password" validate:"required,min=12"`
	Name           string `json:"name" validate:"required"`
	OrganizationID string `json:"organization_id" validate:"required"`
}

// ChangePasswordInput represents change password request input
type ChangePasswordInput struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=12"`
}

// ForgotPasswordInput represents forgot password request input
type ForgotPasswordInput struct {
	Email string `json:"email" validate:"required,email"`
}

// ResetPasswordInput represents reset password request input
type ResetPasswordInput struct {
	Token       string `json:"token" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=12"`
}

// UpdateProfileInput represents update profile request input
type UpdateProfileInput struct {
	Name string `json:"name" validate:"required"`
}

// AuthResponse represents the response after successful authentication
type AuthResponse struct {
	User         *User  `json:"user"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresAt    int64  `json:"expires_at"` // Unix timestamp
}

// RefreshTokenInput represents refresh token request input
type RefreshTokenInput struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// TokenValidation represents the result of validating a token
type TokenValidation struct {
	Valid          bool   `json:"valid"`
	UserID         string `json:"user_id,omitempty"`
	OrganizationID string `json:"organization_id,omitempty"`
	Email          string `json:"email,omitempty"`
	Roles          []string `json:"roles,omitempty"`
	Error          string `json:"error,omitempty"`
}
