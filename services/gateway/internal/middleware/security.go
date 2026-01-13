package middleware

import (
	"net/http"
	"os"
)

// SecurityHeaders adds security-related HTTP headers to all responses.
// These headers help protect against common web vulnerabilities.
func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Prevent MIME type sniffing
		w.Header().Set("X-Content-Type-Options", "nosniff")

		// Prevent clickjacking by disallowing framing
		w.Header().Set("X-Frame-Options", "DENY")

		// Enable XSS protection in older browsers
		w.Header().Set("X-XSS-Protection", "1; mode=block")

		// Enforce HTTPS (1 year, include subdomains)
		// Only set in production to avoid issues during development
		if os.Getenv("GO_ENV") == "production" {
			w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
		}

		// Control what the browser is allowed to load
		// This is a restrictive policy - adjust based on your needs
		w.Header().Set("Content-Security-Policy", buildCSP())

		// Control Referrer header information sent with requests
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")

		// Opt-out of Google FLoC (now Topics)
		w.Header().Set("Permissions-Policy", "interest-cohort=()")

		// Prevent cross-origin information leakage
		w.Header().Set("Cross-Origin-Opener-Policy", "same-origin")
		w.Header().Set("Cross-Origin-Resource-Policy", "same-origin")

		// Cache control for API responses
		w.Header().Set("Cache-Control", "no-store, max-age=0")

		next.ServeHTTP(w, r)
	})
}

// buildCSP constructs the Content-Security-Policy header value
func buildCSP() string {
	// Base CSP for API-only gateway
	// This is restrictive by default - frontends have their own CSP
	csp := "default-src 'self'; " +
		"frame-ancestors 'none'; " +
		"base-uri 'self'; " +
		"form-action 'self'"

	return csp
}

// SecurityHeadersConfig allows customization of security headers
type SecurityHeadersConfig struct {
	// EnableHSTS enables Strict-Transport-Security header
	EnableHSTS bool
	// HSTSMaxAge is the max-age directive in seconds (default 1 year)
	HSTSMaxAge int
	// HSTSIncludeSubdomains includes subdomains in HSTS
	HSTSIncludeSubdomains bool
	// HSTSPreload enables HSTS preload
	HSTSPreload bool
	// FrameOptions controls X-Frame-Options (DENY, SAMEORIGIN)
	FrameOptions string
	// ContentSecurityPolicy custom CSP
	ContentSecurityPolicy string
	// ReferrerPolicy controls Referrer-Policy
	ReferrerPolicy string
}

// DefaultSecurityHeadersConfig returns the default security headers configuration
func DefaultSecurityHeadersConfig() *SecurityHeadersConfig {
	return &SecurityHeadersConfig{
		EnableHSTS:            os.Getenv("GO_ENV") == "production",
		HSTSMaxAge:            31536000, // 1 year
		HSTSIncludeSubdomains: true,
		HSTSPreload:           true,
		FrameOptions:          "DENY",
		ContentSecurityPolicy: buildCSP(),
		ReferrerPolicy:        "strict-origin-when-cross-origin",
	}
}

// SecurityHeadersWithConfig adds security headers with custom configuration
func SecurityHeadersWithConfig(cfg *SecurityHeadersConfig) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Prevent MIME type sniffing
			w.Header().Set("X-Content-Type-Options", "nosniff")

			// Prevent clickjacking
			if cfg.FrameOptions != "" {
				w.Header().Set("X-Frame-Options", cfg.FrameOptions)
			}

			// Enable XSS protection in older browsers
			w.Header().Set("X-XSS-Protection", "1; mode=block")

			// HSTS
			if cfg.EnableHSTS {
				hstsValue := "max-age=" + string(rune(cfg.HSTSMaxAge))
				if cfg.HSTSIncludeSubdomains {
					hstsValue += "; includeSubDomains"
				}
				if cfg.HSTSPreload {
					hstsValue += "; preload"
				}
				w.Header().Set("Strict-Transport-Security", hstsValue)
			}

			// CSP
			if cfg.ContentSecurityPolicy != "" {
				w.Header().Set("Content-Security-Policy", cfg.ContentSecurityPolicy)
			}

			// Referrer Policy
			if cfg.ReferrerPolicy != "" {
				w.Header().Set("Referrer-Policy", cfg.ReferrerPolicy)
			}

			// Additional security headers
			w.Header().Set("Permissions-Policy", "interest-cohort=()")
			w.Header().Set("Cross-Origin-Opener-Policy", "same-origin")
			w.Header().Set("Cross-Origin-Resource-Policy", "same-origin")
			w.Header().Set("Cache-Control", "no-store, max-age=0")

			next.ServeHTTP(w, r)
		})
	}
}
