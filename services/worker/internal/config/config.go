package config

import (
	"os"
	"strconv"
	"time"
)

// Config holds worker service configuration
type Config struct {
	// Environment
	Environment string

	// Database
	DatabaseURL string

	// Redis (for job queue and caching)
	RedisURL string

	// Job intervals
	SessionCleanupInterval   time.Duration
	PositionUpdateInterval   time.Duration
	NotificationCheckInterval time.Duration
	ReportGenerationTime     string // Cron format: "0 6 * * *" for 6 AM daily
	DataAggregationTime      string // Cron format

	// AIS Configuration
	AISProviderURL string
	AISAPIKey      string
	AISSyncEnabled bool

	// Notification Configuration
	SMTPHost     string
	SMTPPort     int
	SMTPUser     string
	SMTPPassword string
	FromEmail    string
	FromName     string

	// Worker Configuration
	MaxConcurrentJobs int
	JobTimeout        time.Duration
}

// Load loads configuration from environment variables
func Load() *Config {
	return &Config{
		Environment: getEnv("GO_ENV", "development"),

		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/navo?sslmode=disable"),
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379"),

		SessionCleanupInterval:   getDuration("SESSION_CLEANUP_INTERVAL", 1*time.Hour),
		PositionUpdateInterval:   getDuration("POSITION_UPDATE_INTERVAL", 5*time.Minute),
		NotificationCheckInterval: getDuration("NOTIFICATION_CHECK_INTERVAL", 30*time.Second),
		ReportGenerationTime:     getEnv("REPORT_GENERATION_TIME", "0 6 * * *"),   // 6 AM daily
		DataAggregationTime:      getEnv("DATA_AGGREGATION_TIME", "0 0 * * *"),    // Midnight daily

		AISProviderURL: getEnv("AIS_PROVIDER_URL", ""),
		AISAPIKey:      getEnv("AIS_API_KEY", ""),
		AISSyncEnabled: getBool("AIS_SYNC_ENABLED", false),

		SMTPHost:     getEnv("SMTP_HOST", ""),
		SMTPPort:     getInt("SMTP_PORT", 587),
		SMTPUser:     getEnv("SMTP_USER", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		FromEmail:    getEnv("FROM_EMAIL", "noreply@navo.io"),
		FromName:     getEnv("FROM_NAME", "Navo"),

		MaxConcurrentJobs: getInt("MAX_CONCURRENT_JOBS", 10),
		JobTimeout:        getDuration("JOB_TIMEOUT", 5*time.Minute),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if i, err := strconv.Atoi(value); err == nil {
			return i
		}
	}
	return defaultValue
}

func getBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		return value == "true" || value == "1"
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
