package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/navo/pkg/auth"
)

type contextKey string

const (
	UserIDKey         contextKey = "user_id"
	OrganizationIDKey contextKey = "organization_id"
	WorkspaceIDKey    contextKey = "workspace_id"
	RoleKey           contextKey = "role"
)

// AuthMiddleware handles JWT authentication for HTTP requests
type AuthMiddleware struct {
	jwtService *auth.JWTService
	optional   bool
}

// NewAuthMiddleware creates a new authentication middleware
func NewAuthMiddleware(jwtService *auth.JWTService) *AuthMiddleware {
	return &AuthMiddleware{
		jwtService: jwtService,
		optional:   false,
	}
}

// NewOptionalAuthMiddleware creates auth middleware that doesn't require authentication
func NewOptionalAuthMiddleware(jwtService *auth.JWTService) *AuthMiddleware {
	return &AuthMiddleware{
		jwtService: jwtService,
		optional:   true,
	}
}

// Handler wraps an http.Handler with authentication
func (m *AuthMiddleware) Handler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		// Extract token from Authorization header or query param (for WebSocket)
		token := extractToken(r)

		if token == "" {
			if m.optional {
				next.ServeHTTP(w, r)
				return
			}
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Validate token
		claims, err := m.jwtService.ValidateToken(token)
		if err != nil {
			if m.optional {
				next.ServeHTTP(w, r)
				return
			}
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		// Add claims to context
		ctx = context.WithValue(ctx, UserIDKey, claims.UserID)
		ctx = context.WithValue(ctx, OrganizationIDKey, claims.OrganizationID)
		ctx = context.WithValue(ctx, WorkspaceIDKey, claims.WorkspaceID)
		ctx = context.WithValue(ctx, RoleKey, claims.Role)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// extractToken extracts the JWT token from the request
func extractToken(r *http.Request) string {
	// Check Authorization header first
	authHeader := r.Header.Get("Authorization")
	if authHeader != "" {
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
			return parts[1]
		}
	}

	// Check query parameter (useful for WebSocket connections)
	if token := r.URL.Query().Get("token"); token != "" {
		return token
	}

	// Check cookie
	if cookie, err := r.Cookie("access_token"); err == nil {
		return cookie.Value
	}

	return ""
}

// GetUserID retrieves the user ID from context
func GetUserID(ctx context.Context) string {
	if val := ctx.Value(UserIDKey); val != nil {
		if userID, ok := val.(string); ok {
			return userID
		}
	}
	return ""
}

// GetOrganizationID retrieves the organization ID from context
func GetOrganizationID(ctx context.Context) string {
	if val := ctx.Value(OrganizationIDKey); val != nil {
		if orgID, ok := val.(string); ok {
			return orgID
		}
	}
	return ""
}

// GetWorkspaceID retrieves the workspace ID from context
func GetWorkspaceID(ctx context.Context) string {
	if val := ctx.Value(WorkspaceIDKey); val != nil {
		if wsID, ok := val.(string); ok {
			return wsID
		}
	}
	return ""
}

// GetRole retrieves the role from context
func GetRole(ctx context.Context) string {
	if val := ctx.Value(RoleKey); val != nil {
		if role, ok := val.(string); ok {
			return role
		}
	}
	return ""
}

// CORS middleware for handling cross-origin requests
func CORS(allowedOrigins []string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")

			// Check if origin is allowed
			allowed := false
			for _, o := range allowedOrigins {
				if o == "*" || o == origin {
					allowed = true
					break
				}
			}

			if allowed {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, X-Workspace-ID")
				w.Header().Set("Access-Control-Allow-Credentials", "true")
				w.Header().Set("Access-Control-Max-Age", "86400")
			}

			// Handle preflight requests
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// RequestID middleware adds a request ID to the context
func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestID := r.Header.Get("X-Request-ID")
		if requestID == "" {
			requestID = generateRequestID()
		}

		w.Header().Set("X-Request-ID", requestID)
		ctx := context.WithValue(r.Context(), "request_id", requestID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func generateRequestID() string {
	// Simple request ID generation
	return "req-" + strings.Replace(
		strings.Replace(
			strings.Replace(
				strings.ToLower(
					strings.TrimPrefix(
						strings.TrimPrefix(
							strings.TrimPrefix(
								strings.TrimPrefix(
									strings.TrimSpace(
										strings.ReplaceAll(
											strings.ReplaceAll(
												strings.ReplaceAll(
													strings.ReplaceAll(
														strings.ReplaceAll(
															http.TimeFormat,
															" ", ""),
														"-", ""),
													":", ""),
												"T", ""),
											"Z", "")),
									"Mon"),
								"Tue"),
							"Wed"),
						"Thu"),
					"Fri"),
				"Sat"),
			"Sun"),
		"", "")
	// Note: Use proper UUID generation in production
}
