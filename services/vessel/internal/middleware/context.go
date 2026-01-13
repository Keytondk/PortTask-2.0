package middleware

import (
	"context"
	"net/http"
	"strings"
)

// ContextKey is a type for context keys
type ContextKey string

const (
	// UserIDKey is the context key for user ID
	UserIDKey ContextKey = "user_id"
	// OrganizationIDKey is the context key for organization ID
	OrganizationIDKey ContextKey = "organization_id"
	// PortalTypeKey is the context key for portal type
	PortalTypeKey ContextKey = "portal_type"
	// UserRolesKey is the context key for user roles
	UserRolesKey ContextKey = "user_roles"
	// WorkspaceIDKey is the context key for workspace ID
	WorkspaceIDKey ContextKey = "workspace_id"
)

// ExtractUserContext middleware extracts user context from headers
// forwarded by the gateway service.
func ExtractUserContext(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		// Extract user ID
		if userID := r.Header.Get("X-User-ID"); userID != "" {
			ctx = context.WithValue(ctx, UserIDKey, userID)
		}

		// Extract organization ID (tenant)
		if orgID := r.Header.Get("X-Organization-ID"); orgID != "" {
			ctx = context.WithValue(ctx, OrganizationIDKey, orgID)
		}

		// Extract portal type
		if portalType := r.Header.Get("X-Portal-Type"); portalType != "" {
			ctx = context.WithValue(ctx, PortalTypeKey, portalType)
		}

		// Extract user roles
		if rolesHeader := r.Header.Get("X-User-Roles"); rolesHeader != "" {
			roles := strings.Split(rolesHeader, ",")
			for i, role := range roles {
				roles[i] = strings.TrimSpace(role)
			}
			ctx = context.WithValue(ctx, UserRolesKey, roles)
		}

		// Extract workspace ID
		if wsID := r.Header.Get("X-Workspace-ID"); wsID != "" {
			ctx = context.WithValue(ctx, WorkspaceIDKey, wsID)
		}

		next.ServeHTTP(w, r.WithContext(ctx))
	})
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

// GetUserRoles retrieves user roles from context
func GetUserRoles(ctx context.Context) []string {
	roles, ok := ctx.Value(UserRolesKey).([]string)
	if !ok {
		return nil
	}
	return roles
}
