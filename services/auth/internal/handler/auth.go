package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/navo/services/auth/internal/model"
	"github.com/navo/services/auth/internal/service"
)

// AuthHandler handles authentication HTTP requests
type AuthHandler struct {
	svc *service.AuthService
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(svc *service.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc}
}

// RegisterRoutes registers auth routes
func (h *AuthHandler) RegisterRoutes(r chi.Router) {
	r.Post("/login", h.Login)
	r.Post("/logout", h.Logout)
	r.Post("/refresh", h.RefreshToken)
	r.Post("/forgot-password", h.ForgotPassword)
	r.Post("/reset-password", h.ResetPassword)
	r.Post("/validate", h.ValidateToken)

	// Protected routes (require auth)
	r.Group(func(r chi.Router) {
		r.Use(h.AuthMiddleware)
		r.Get("/me", h.GetMe)
		r.Put("/profile", h.UpdateProfile)
		r.Put("/password", h.ChangePassword)
		r.Post("/logout-all", h.LogoutAll)
	})
}

// Login handles POST /auth/login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var input model.LoginInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if input.Email == "" || input.Password == "" {
		respondError(w, http.StatusBadRequest, "email and password are required")
		return
	}

	ipAddress := getIPAddress(r)
	userAgent := r.UserAgent()

	response, err := h.svc.Login(r.Context(), input, ipAddress, userAgent)
	if err != nil {
		respondError(w, http.StatusUnauthorized, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, response)
}

// Logout handles POST /auth/logout
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	var input struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.svc.Logout(r.Context(), input.RefreshToken); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to logout")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "logged out successfully"})
}

// LogoutAll handles POST /auth/logout-all
func (h *AuthHandler) LogoutAll(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)

	if err := h.svc.LogoutAll(r.Context(), userID); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to logout from all devices")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "logged out from all devices"})
}

// RefreshToken handles POST /auth/refresh
func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var input model.RefreshTokenInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if input.RefreshToken == "" {
		respondError(w, http.StatusBadRequest, "refresh_token is required")
		return
	}

	response, err := h.svc.RefreshToken(r.Context(), input.RefreshToken)
	if err != nil {
		respondError(w, http.StatusUnauthorized, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, response)
}

// GetMe handles GET /auth/me
func (h *AuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)

	user, err := h.svc.GetMe(r.Context(), userID)
	if err != nil {
		respondError(w, http.StatusNotFound, "user not found")
		return
	}

	respondJSON(w, http.StatusOK, user)
}

// UpdateProfile handles PUT /auth/profile
func (h *AuthHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)

	var input model.UpdateProfileInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if input.Name == "" {
		respondError(w, http.StatusBadRequest, "name is required")
		return
	}

	user, err := h.svc.UpdateProfile(r.Context(), userID, input)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, user)
}

// ChangePassword handles PUT /auth/password
func (h *AuthHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)

	var input model.ChangePasswordInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if input.CurrentPassword == "" || input.NewPassword == "" {
		respondError(w, http.StatusBadRequest, "current_password and new_password are required")
		return
	}

	if err := h.svc.ChangePassword(r.Context(), userID, input); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "password changed successfully"})
}

// ForgotPassword handles POST /auth/forgot-password
func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var input model.ForgotPasswordInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if input.Email == "" {
		respondError(w, http.StatusBadRequest, "email is required")
		return
	}

	// Always return success to prevent email enumeration
	h.svc.ForgotPassword(r.Context(), input)

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "if an account exists with that email, a reset link has been sent",
	})
}

// ResetPassword handles POST /auth/reset-password
func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var input model.ResetPasswordInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if input.Token == "" || input.NewPassword == "" {
		respondError(w, http.StatusBadRequest, "token and new_password are required")
		return
	}

	if err := h.svc.ResetPassword(r.Context(), input); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "password reset successfully"})
}

// ValidateToken handles POST /auth/validate
func (h *AuthHandler) ValidateToken(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Token string `json:"token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if input.Token == "" {
		respondError(w, http.StatusBadRequest, "token is required")
		return
	}

	validation, err := h.svc.ValidateToken(r.Context(), input.Token)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to validate token")
		return
	}

	respondJSON(w, http.StatusOK, validation)
}

// AuthMiddleware validates the access token from Authorization header
func (h *AuthHandler) AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			respondError(w, http.StatusUnauthorized, "authorization header required")
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			respondError(w, http.StatusUnauthorized, "invalid authorization header format")
			return
		}

		token := parts[1]
		validation, _ := h.svc.ValidateToken(r.Context(), token)

		if !validation.Valid {
			respondError(w, http.StatusUnauthorized, "invalid or expired token")
			return
		}

		// Add user info to context
		ctx := r.Context()
		ctx = contextWithValue(ctx, "user_id", validation.UserID)
		ctx = contextWithValue(ctx, "organization_id", validation.OrganizationID)
		ctx = contextWithValue(ctx, "email", validation.Email)
		ctx = contextWithValue(ctx, "roles", validation.Roles)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// Helper functions

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}

func getIPAddress(r *http.Request) string {
	// Check X-Forwarded-For header (for proxies)
	xff := r.Header.Get("X-Forwarded-For")
	if xff != "" {
		ips := strings.Split(xff, ",")
		return strings.TrimSpace(ips[0])
	}

	// Check X-Real-IP header
	xri := r.Header.Get("X-Real-IP")
	if xri != "" {
		return xri
	}

	// Fall back to RemoteAddr
	return strings.Split(r.RemoteAddr, ":")[0]
}

type contextKey string

func contextWithValue(ctx interface{ Value(any) any }, key string, value interface{}) interface{ Value(any) any } {
	type setter interface {
		Value(any) any
	}
	// Type assertion to get the underlying context
	if c, ok := ctx.(interface {
		Value(any) any
		Done() <-chan struct{}
		Err() error
		Deadline() (deadline interface{}, ok bool)
	}); ok {
		return &contextWithKey{c, contextKey(key), value}
	}
	return ctx
}

type contextWithKey struct {
	parent interface {
		Value(any) any
		Done() <-chan struct{}
		Err() error
		Deadline() (deadline interface{}, ok bool)
	}
	key   contextKey
	value interface{}
}

func (c *contextWithKey) Value(key any) any {
	if k, ok := key.(contextKey); ok && k == c.key {
		return c.value
	}
	if k, ok := key.(string); ok && contextKey(k) == c.key {
		return c.value
	}
	return c.parent.Value(key)
}

func (c *contextWithKey) Done() <-chan struct{}                       { return c.parent.Done() }
func (c *contextWithKey) Err() error                                  { return c.parent.Err() }
func (c *contextWithKey) Deadline() (deadline interface{}, ok bool) { return c.parent.Deadline() }
