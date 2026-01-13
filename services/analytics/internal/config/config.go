package config

import (
	"os"
	"strconv"
	"time"
)

// Config holds analytics service configuration
type Config struct {
	// Server settings
	Port        string
	Environment string

	// Database
	DatabaseURL string

	// Redis (for caching)
	RedisURL     string
	CacheTTL     time.Duration
	CacheEnabled bool
}

// Load loads configuration from environment variables
func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "8084"),
		Environment: getEnv("GO_ENV", "development"),

		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/navo?sslmode=disable"),

		RedisURL:     getEnv("REDIS_URL", "redis://localhost:6379"),
		CacheTTL:     getDuration("ANALYTICS_CACHE_TTL", 5*time.Minute),
		CacheEnabled: getBool("ANALYTICS_CACHE_ENABLED", true),
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
