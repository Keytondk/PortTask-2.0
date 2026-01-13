package config

import (
	"os"
	"strconv"
	"time"
)

// Config holds the configuration for the integration service
type Config struct {
	// Server
	Port string

	// Database
	DatabaseURL string

	// Redis
	RedisURL string

	// JWT
	JWTSecret string

	// Webhook settings
	WebhookTimeout      time.Duration
	WebhookRetryCount   int
	WebhookRetryDelay   time.Duration
	WebhookMaxBatchSize int

	// External APIs
	WeatherAPIKey     string
	WeatherAPIBaseURL string
	PortInfoAPIKey    string
	PortInfoAPIURL    string
	ExchangeRateAPI   string

	// AIS Providers (delegated to vessel service, but we coordinate)
	AISProviderType string
	AISAPIKey       string

	// Rate limiting
	RateLimitRequests int
	RateLimitWindow   time.Duration

	// Sync intervals
	WeatherSyncInterval      time.Duration
	PortInfoSyncInterval     time.Duration
	ExchangeRateSyncInterval time.Duration
}

// Load loads configuration from environment variables
func Load() *Config {
	return &Config{
		Port: getEnv("PORT", "8086"),

		DatabaseURL: getEnv("DATABASE_URL", ""),
		RedisURL:    getEnv("REDIS_URL", ""),
		JWTSecret:   getEnv("JWT_SECRET", ""),

		WebhookTimeout:      getDuration("WEBHOOK_TIMEOUT", 30*time.Second),
		WebhookRetryCount:   getInt("WEBHOOK_RETRY_COUNT", 3),
		WebhookRetryDelay:   getDuration("WEBHOOK_RETRY_DELAY", 5*time.Second),
		WebhookMaxBatchSize: getInt("WEBHOOK_MAX_BATCH_SIZE", 100),

		WeatherAPIKey:     getEnv("WEATHER_API_KEY", ""),
		WeatherAPIBaseURL: getEnv("WEATHER_API_URL", "https://api.openweathermap.org/data/2.5"),
		PortInfoAPIKey:    getEnv("PORT_INFO_API_KEY", ""),
		PortInfoAPIURL:    getEnv("PORT_INFO_API_URL", ""),
		ExchangeRateAPI:   getEnv("EXCHANGE_RATE_API_KEY", ""),

		AISProviderType: getEnv("AIS_PROVIDER", "mock"),
		AISAPIKey:       getEnv("AIS_API_KEY", ""),

		RateLimitRequests: getInt("RATE_LIMIT_REQUESTS", 100),
		RateLimitWindow:   getDuration("RATE_LIMIT_WINDOW", time.Minute),

		WeatherSyncInterval:      getDuration("WEATHER_SYNC_INTERVAL", 30*time.Minute),
		PortInfoSyncInterval:     getDuration("PORT_INFO_SYNC_INTERVAL", 24*time.Hour),
		ExchangeRateSyncInterval: getDuration("EXCHANGE_RATE_SYNC_INTERVAL", 6*time.Hour),
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

func getDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if d, err := time.ParseDuration(value); err == nil {
			return d
		}
	}
	return defaultValue
}
