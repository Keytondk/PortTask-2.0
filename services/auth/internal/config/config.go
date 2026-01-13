package config

import (
	"os"
	"strconv"
	"time"
)

// Config holds auth service configuration
type Config struct {
	// Server settings
	Port        string
	Environment string

	// Database
	DatabaseURL string

	// Redis (for session/token blacklist)
	RedisURL string

	// Security
	JWTSecret           string
	AccessTokenExpiry   time.Duration
	RefreshTokenExpiry  time.Duration
	PasswordMinLength   int
	MaxLoginAttempts    int
	LockoutDuration     time.Duration
	RateLimitPerMinute  int

	// Password hashing
	BcryptCost int

	// Email (for password reset)
	SMTPHost     string
	SMTPPort     int
	SMTPUser     string
	SMTPPassword string
	FromEmail    string
	FromName     string

	// Frontend URLs (for email links)
	FrontendURL      string
	PasswordResetURL string
}

// Load loads configuration from environment variables
func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "8081"),
		Environment: getEnv("GO_ENV", "development"),

		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/navo?sslmode=disable"),
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379"),

		JWTSecret:           mustGetEnv("JWT_SECRET"),
		AccessTokenExpiry:   getDuration("ACCESS_TOKEN_EXPIRY", 15*time.Minute),
		RefreshTokenExpiry:  getDuration("REFRESH_TOKEN_EXPIRY", 7*24*time.Hour),
		PasswordMinLength:   getInt("PASSWORD_MIN_LENGTH", 12),
		MaxLoginAttempts:    getInt("MAX_LOGIN_ATTEMPTS", 5),
		LockoutDuration:     getDuration("LOCKOUT_DURATION", 15*time.Minute),
		RateLimitPerMinute:  getInt("RATE_LIMIT_PER_MINUTE", 60),

		BcryptCost: getInt("BCRYPT_COST", 12),

		SMTPHost:     getEnv("SMTP_HOST", ""),
		SMTPPort:     getInt("SMTP_PORT", 587),
		SMTPUser:     getEnv("SMTP_USER", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		FromEmail:    getEnv("FROM_EMAIL", "noreply@navo.io"),
		FromName:     getEnv("FROM_NAME", "Navo"),

		FrontendURL:      getEnv("FRONTEND_URL", "http://localhost:3000"),
		PasswordResetURL: getEnv("PASSWORD_RESET_URL", "http://localhost:3000/reset-password"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func mustGetEnv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		panic("required environment variable not set: " + key)
	}
	return value
}

func getInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if i, err := strconv.Atoi(value); err == nil {
			return i
		}
	}
	return defaultValue
}

func getDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if d, err := time.ParseDuration(value); err == nil {
			return d
		}
	}
	return defaultValue
}
