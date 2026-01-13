package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/navo/pkg/auth"
	"github.com/navo/pkg/response"
)

// ContextKey is a type for context keys
type ContextKey string

const (
	// ClaimsKey is the context key for JWT claims
	ClaimsKey ContextKey = "claims"
	// UserIDKey is the context key for user ID
	UserIDKey ContextKey = "user_id"
	// OrganizationIDKey is the context key for organization ID
	OrganizationIDKey ContextKey = "organization_id"
	// WorkspaceIDKey is the context key for the current workspace
	WorkspaceIDKey ContextKey = "workspace_id"
)

// Authenticate validates JWT token and adds claims to context
func Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			response.Unauthorized(w, "Missing authorization header")
			return
		}

		// Check Bearer prefix
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			response.Unauthorized(w, "Invalid authorization header format")
			return
		}

		tokenString := parts[1]

		// Validate token
		claims, err := auth.ValidateToken(tokenString)
		if err != nil {
			response.Unauthorized(w, "Invalid or expired token")
			return
		}

		// Check token type
		if claims.TokenType != string(auth.AccessToken) {
			response.Unauthorized(w, "Invalid token type")
			return
		}

		// Add claims to context
		ctx := context.WithValue(r.Context(), ClaimsKey, claims)
		ctx = context.WithValue(ctx, UserIDKey, claims.UserID)
		ctx = context.WithValue(ctx, OrganizationIDKey, claims.OrganizationID)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequirePermission checks if user has required permission
func RequirePermission(permission string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := r.Context().Value(ClaimsKey).(*auth.Claims)
			if !ok {
				response.Unauthorized(w, "No claims in context")
				return
			}

			if !auth.HasPermission(claims, permission) {
				response.Forbidden(w, "Insufficient permissions")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// RequireRole checks if user has required role
func RequireRole(role string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := r.Context().Value(ClaimsKey).(*auth.Claims)
			if !ok {
				response.Unauthorized(w, "No claims in context")
				return
			}

			if !auth.HasRole(claims, role) {
				response.Forbidden(w, "Insufficient role")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// GetClaims retrieves claims from context
func GetClaims(ctx context.Context) *auth.Claims {
	claims, ok := ctx.Value(ClaimsKey).(*auth.Claims)
	if !ok {
		return nil
	}
	return claims
}

// GetUserID retrieves user ID from context
func GetUserID(ctx context.Context) string {
	userID, ok := ctx.Value(UserIDKey).(string)
	if !ok {
		return ""
	}
	return userID
}

// GetOrganizationID retrieves organization ID from context
func GetOrganizationID(ctx context.Context) string {
	orgID, ok := ctx.Value(OrganizationIDKey).(string)
	if !ok {
		return ""
	}
	return orgID
}

// GetWorkspaceID retrieves workspace ID from context
func GetWorkspaceID(ctx context.Context) string {
	wsID, ok := ctx.Value(WorkspaceIDKey).(string)
	if !ok {
		return ""
	}
	return wsID
}

// WorkspaceValidator is a function that validates if a user can access a workspace
// Returns true if access is allowed, false otherwise
type WorkspaceValidator func(ctx context.Context, orgID, workspaceID string) bool

// RequireWorkspaceAccess validates workspace access for requests.
// It extracts workspace_id from query params, path params, or request body
// and validates the user has access to that workspace.
// The validator function should check if the workspace belongs to the user's organization.
func RequireWorkspaceAccess(validator WorkspaceValidator) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims := GetClaims(r.Context())
			if claims == nil {
				response.Unauthorized(w, "No claims in context")
				return
			}

			// Try to get workspace ID from multiple sources
			workspaceID := extractWorkspaceID(r)

			// If no workspace ID found, let the handler deal with it
			// Some endpoints may not require a workspace
			if workspaceID == "" {
				next.ServeHTTP(w, r)
				return
			}

			// Validate workspace access using the provided validator
			if !validator(r.Context(), claims.OrganizationID, workspaceID) {
				response.Forbidden(w, "Access denied to this workspace")
				return
			}

			// Add workspace ID to context for downstream handlers
			ctx := context.WithValue(r.Context(), WorkspaceIDKey, workspaceID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// extractWorkspaceID attempts to extract workspace_id from various request sources
func extractWorkspaceID(r *http.Request) string {
	// 1. Check query parameters
	if wsID := r.URL.Query().Get("workspace_id"); wsID != "" {
		return wsID
	}

	// 2. Check X-Workspace-ID header (for API clients)
	if wsID := r.Header.Get("X-Workspace-ID"); wsID != "" {
		return wsID
	}

	// Note: Path parameters and request body extraction would require
	// additional integration with the router (chi's URL params) or
	// body parsing. For now, we rely on query params and headers.
	// The handler can also set workspace context explicitly.

	return ""
}

// SetWorkspaceContext is a helper for handlers to set the workspace context
// after extracting workspace_id from path params or request body
func SetWorkspaceContext(ctx context.Context, workspaceID string) context.Context {
	return context.WithValue(ctx, WorkspaceIDKey, workspaceID)
}

// ValidateWorkspaceInOrg checks if claims allow access to a workspace.
// Uses the workspace IDs embedded in JWT claims for fast validation.
// Admin users have access to all workspaces in their organization.
func ValidateWorkspaceInOrg(claims *auth.Claims, workspaceID string) bool {
	return auth.HasWorkspaceAccess(claims, workspaceID)
}

// WorkspaceIDsContextKey is the key for storing workspace IDs in context
const WorkspaceIDsContextKey ContextKey = "workspace_ids"

// GetWorkspaceIDs retrieves the list of workspace IDs the user has access to
func GetWorkspaceIDs(ctx context.Context) []string {
	claims := GetClaims(ctx)
	if claims == nil {
		return nil
	}
	return claims.WorkspaceIDs
}

// CanAccessWorkspace checks if the current user can access a specific workspace
func CanAccessWorkspace(ctx context.Context, workspaceID string) bool {
	claims := GetClaims(ctx)
	if claims == nil {
		return false
	}
	return auth.HasWorkspaceAccess(claims, workspaceID)
}

// DefaultWorkspaceValidator returns a WorkspaceValidator that uses JWT claims
// to validate workspace access without requiring database queries.
func DefaultWorkspaceValidator() WorkspaceValidator {
	return func(ctx context.Context, orgID, workspaceID string) bool {
		claims := GetClaims(ctx)
		if claims == nil {
			return false
		}
		// Verify the workspace belongs to the same organization
		if claims.OrganizationID != orgID {
			return false
		}
		return auth.HasWorkspaceAccess(claims, workspaceID)
	}
}
