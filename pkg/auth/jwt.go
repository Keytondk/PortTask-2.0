package auth

import (
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

const (
	// MinSecretLength is the minimum required length for JWT secret (32 bytes = 256 bits)
	MinSecretLength = 32
)

var (
	jwtSecret          []byte
	jwtInitialized     bool
	accessTokenExpiry  = 15 * time.Minute
	refreshTokenExpiry = 7 * 24 * time.Hour
)

// Initialize sets up the JWT secret from environment variables.
// This must be called before any token operations.
// Panics if JWT_SECRET is not set or is too short (minimum 32 bytes).
func Initialize() {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		panic("FATAL: JWT_SECRET environment variable is required but not set. " +
			"Set a secure random string of at least 32 characters.")
	}

	if len(secret) < MinSecretLength {
		panic(fmt.Sprintf("FATAL: JWT_SECRET must be at least %d characters long (current: %d). "+
			"Use a cryptographically secure random string.", MinSecretLength, len(secret)))
	}

	jwtSecret = []byte(secret)
	jwtInitialized = true
}

// MustBeInitialized panics if Initialize() has not been called
func MustBeInitialized() {
	if !jwtInitialized {
		panic("FATAL: auth.Initialize() must be called before using JWT functions")
	}
}

// TokenType represents the type of token
type TokenType string

const (
	AccessToken  TokenType = "access"
	RefreshToken TokenType = "refresh"
)

// Claims represents JWT claims
type Claims struct {
	UserID         string   `json:"user_id"`
	OrganizationID string   `json:"organization_id"`
	Email          string   `json:"email"`
	Roles          []string `json:"roles"`
	Permissions    []string `json:"permissions"`
	WorkspaceIDs   []string `json:"workspace_ids"` // Workspaces user has access to
	PortalType     string   `json:"portal_type"`
	TokenType      string   `json:"token_type"`
	jwt.RegisteredClaims
}

// TokenPair represents access and refresh tokens
type TokenPair struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    time.Time `json:"expires_at"`
}

// GenerateTokenPair generates both access and refresh tokens.
// Panics if Initialize() has not been called.
func GenerateTokenPair(userID, orgID, email, portalType string, roles, permissions, workspaceIDs []string) (*TokenPair, error) {
	MustBeInitialized()

	accessToken, accessExp, err := generateToken(userID, orgID, email, portalType, roles, permissions, workspaceIDs, AccessToken)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, _, err := generateToken(userID, orgID, email, portalType, roles, permissions, workspaceIDs, RefreshToken)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    accessExp,
	}, nil
}

// generateToken generates a single token
func generateToken(userID, orgID, email, portalType string, roles, permissions, workspaceIDs []string, tokenType TokenType) (string, time.Time, error) {
	var expiry time.Duration
	if tokenType == AccessToken {
		expiry = accessTokenExpiry
	} else {
		expiry = refreshTokenExpiry
	}

	expiresAt := time.Now().Add(expiry)

	claims := &Claims{
		UserID:         userID,
		OrganizationID: orgID,
		Email:          email,
		Roles:          roles,
		Permissions:    permissions,
		WorkspaceIDs:   workspaceIDs,
		PortalType:     portalType,
		TokenType:      string(tokenType),
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        uuid.New().String(),
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			Issuer:    "navo",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", time.Time{}, err
	}

	return signedToken, expiresAt, nil
}

// ValidateToken validates a JWT token and returns claims.
// Panics if Initialize() has not been called.
func ValidateToken(tokenString string) (*Claims, error) {
	MustBeInitialized()

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	return claims, nil
}

// RefreshAccessToken generates a new access token from a refresh token
func RefreshAccessToken(refreshTokenString string) (*TokenPair, error) {
	claims, err := ValidateToken(refreshTokenString)
	if err != nil {
		return nil, err
	}

	if claims.TokenType != string(RefreshToken) {
		return nil, fmt.Errorf("invalid token type")
	}

	return GenerateTokenPair(
		claims.UserID,
		claims.OrganizationID,
		claims.Email,
		claims.PortalType,
		claims.Roles,
		claims.Permissions,
		claims.WorkspaceIDs,
	)
}

// HasWorkspaceAccess checks if claims allow access to a specific workspace
func HasWorkspaceAccess(claims *Claims, workspaceID string) bool {
	if claims == nil || workspaceID == "" {
		return false
	}

	// Admin users have access to all workspaces in their org
	if HasRole(claims, "admin") {
		return true
	}

	// Check if workspace is in user's allowed workspaces
	for _, wsID := range claims.WorkspaceIDs {
		if wsID == workspaceID {
			return true
		}
	}

	return false
}

// HasPermission checks if claims have a specific permission
func HasPermission(claims *Claims, permission string) bool {
	for _, p := range claims.Permissions {
		if p == permission || p == "*" {
			return true
		}
	}
	return false
}

// HasRole checks if claims have a specific role
func HasRole(claims *Claims, role string) bool {
	for _, r := range claims.Roles {
		if r == role {
			return true
		}
	}
	return false
}
