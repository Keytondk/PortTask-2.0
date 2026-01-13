package config

import (
	"os"
	"strconv"
)

// Config holds notification service configuration
type Config struct {
	// Server
	Port string

	// Redis
	RedisAddr     string
	RedisPassword string
	RedisDB       int

	// SMTP
	SMTPHost     string
	SMTPPort     int
	SMTPUsername string
	SMTPPassword string
	FromAddress  string
	FromName     string

	// Rate Limiting
	RateLimitPerMinute int

	// Retry Configuration
	MaxRetries    int
	RetryInterval int // seconds
}

// Load loads configuration from environment variables
func Load() *Config {
	return &Config{
		Port: getEnv("PORT", "8086"),

		RedisAddr:     getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
		RedisDB:       getEnvInt("REDIS_DB", 0),

		SMTPHost:     getEnv("SMTP_HOST", ""),
		SMTPPort:     getEnvInt("SMTP_PORT", 587),
		SMTPUsername: getEnv("SMTP_USERNAME", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		FromAddress:  getEnv("FROM_ADDRESS", "noreply@navo.io"),
		FromName:     getEnv("FROM_NAME", "Navo Maritime"),

		RateLimitPerMinute: getEnvInt("RATE_LIMIT_PER_MINUTE", 100),
		MaxRetries:         getEnvInt("MAX_RETRIES", 3),
		RetryInterval:      getEnvInt("RETRY_INTERVAL", 60),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}
