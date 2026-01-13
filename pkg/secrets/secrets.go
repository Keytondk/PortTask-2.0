// Package secrets provides utilities for secure secrets management.
// It validates required secrets at startup and provides helpers for
// working with secrets from various sources.
package secrets

import (
	"fmt"
	"os"
	"strings"
)

// Config holds the configuration for secrets management
type Config struct {
	// Required secrets that must be set
	Required []SecretSpec
	// Optional secrets with default values
	Optional []SecretSpec
}

// SecretSpec defines a secret specification
type SecretSpec struct {
	// EnvVar is the environment variable name
	EnvVar string
	// MinLength is the minimum required length (0 = no minimum)
	MinLength int
	// Description describes what the secret is used for
	Description string
	// DefaultValue is used only for optional secrets in development
	DefaultValue string
}

// ValidationError represents a secret validation error
type ValidationError struct {
	Missing  []string
	TooShort []string
}

func (e *ValidationError) Error() string {
	var parts []string
	if len(e.Missing) > 0 {
		parts = append(parts, fmt.Sprintf("missing: %s", strings.Join(e.Missing, ", ")))
	}
	if len(e.TooShort) > 0 {
		parts = append(parts, fmt.Sprintf("too short: %s", strings.Join(e.TooShort, ", ")))
	}
	return fmt.Sprintf("secret validation failed: %s", strings.Join(parts, "; "))
}

// DefaultConfig returns the default secrets configuration for Navo services
func DefaultConfig() *Config {
	return &Config{
		Required: []SecretSpec{
			{
				EnvVar:      "JWT_SECRET",
				MinLength:   32,
				Description: "JWT signing secret for authentication tokens",
			},
			{
				EnvVar:      "DATABASE_URL",
				MinLength:   10,
				Description: "PostgreSQL connection string",
			},
		},
		Optional: []SecretSpec{
			{
				EnvVar:       "REDIS_URL",
				Description:  "Redis connection string for caching",
				DefaultValue: "redis://localhost:6379",
			},
			{
				EnvVar:       "SMTP_PASSWORD",
				Description:  "SMTP password for email notifications",
				DefaultValue: "",
			},
			{
				EnvVar:       "AIS_API_KEY",
				Description:  "AIS provider API key for vessel tracking",
				DefaultValue: "",
			},
		},
	}
}

// Validate checks that all required secrets are present and meet minimum requirements.
// Returns an error if validation fails.
func Validate(cfg *Config) error {
	if cfg == nil {
		cfg = DefaultConfig()
	}

	var verr ValidationError

	for _, spec := range cfg.Required {
		value := os.Getenv(spec.EnvVar)
		if value == "" {
			verr.Missing = append(verr.Missing, spec.EnvVar)
		} else if spec.MinLength > 0 && len(value) < spec.MinLength {
			verr.TooShort = append(verr.TooShort, fmt.Sprintf("%s (min %d chars)", spec.EnvVar, spec.MinLength))
		}
	}

	if len(verr.Missing) > 0 || len(verr.TooShort) > 0 {
		return &verr
	}

	return nil
}

// MustValidate validates secrets and panics if validation fails.
// Use this at application startup to fail fast.
func MustValidate(cfg *Config) {
	if err := Validate(cfg); err != nil {
		panic(fmt.Sprintf("FATAL: %v\n\nEnsure all required secrets are set. "+
			"See docs/deployment/secrets-management.md for details.", err))
	}
}

// Get retrieves a secret value from the environment.
// Returns the value or empty string if not set.
func Get(name string) string {
	return os.Getenv(name)
}

// GetWithDefault retrieves a secret value or returns the default if not set.
// Only use defaults for non-sensitive configuration in development.
func GetWithDefault(name, defaultValue string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return defaultValue
}

// MustGet retrieves a secret value and panics if not set.
// Use this for secrets that must be present at runtime.
func MustGet(name string) string {
	value := os.Getenv(name)
	if value == "" {
		panic(fmt.Sprintf("FATAL: required secret %s is not set", name))
	}
	return value
}

// IsProduction returns true if the application is running in production mode.
// Checks GO_ENV, NODE_ENV, and APP_ENV environment variables.
func IsProduction() bool {
	for _, envVar := range []string{"GO_ENV", "NODE_ENV", "APP_ENV"} {
		if env := os.Getenv(envVar); env == "production" {
			return true
		}
	}
	return false
}

// WarnIfInsecure logs warnings for potentially insecure configurations.
// Should be called at startup to alert operators to security issues.
func WarnIfInsecure() []string {
	var warnings []string

	// Check for weak JWT secret
	jwtSecret := os.Getenv("JWT_SECRET")
	if strings.Contains(strings.ToLower(jwtSecret), "dev") ||
		strings.Contains(strings.ToLower(jwtSecret), "test") ||
		strings.Contains(strings.ToLower(jwtSecret), "secret") {
		warnings = append(warnings, "JWT_SECRET appears to be a development/test value")
	}

	// Check for disabled SSL in production
	dbURL := os.Getenv("DATABASE_URL")
	if IsProduction() && strings.Contains(dbURL, "sslmode=disable") {
		warnings = append(warnings, "DATABASE_URL has SSL disabled in production")
	}

	// Check for default Redis password
	redisURL := os.Getenv("REDIS_URL")
	if IsProduction() && redisURL != "" && !strings.Contains(redisURL, "@") {
		warnings = append(warnings, "REDIS_URL does not appear to use authentication")
	}

	return warnings
}

// Redact replaces sensitive parts of a string for safe logging.
// Keeps first 4 characters and replaces rest with asterisks.
func Redact(value string) string {
	if len(value) <= 4 {
		return "****"
	}
	return value[:4] + strings.Repeat("*", len(value)-4)
}

// RedactURL redacts password from a connection URL for safe logging.
func RedactURL(url string) string {
	// Simple redaction - find :password@ pattern and redact password
	if idx := strings.Index(url, "://"); idx != -1 {
		rest := url[idx+3:]
		if atIdx := strings.Index(rest, "@"); atIdx != -1 {
			userPass := rest[:atIdx]
			if colonIdx := strings.Index(userPass, ":"); colonIdx != -1 {
				user := userPass[:colonIdx]
				return url[:idx+3] + user + ":****@" + rest[atIdx+1:]
			}
		}
	}
	return url
}
