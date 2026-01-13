package config

import (
	"os"
)

// Config holds gateway configuration
type Config struct {
	Env     string
	Port    string
	Version string

	// Service URLs
	AuthServiceURL         string
	CoreServiceURL         string
	VesselServiceURL       string
	VendorServiceURL       string
	RealtimeServiceURL     string
	NotificationServiceURL string
	AnalyticsServiceURL    string

	// CORS
	AllowedOrigins []string

	// Rate limiting
	RateLimit    int
	RateLimitTTL int
}

// Load returns configuration from environment variables
func Load() *Config {
	return &Config{
		Env:     getEnv("ENV", "development"),
		Port:    getEnv("PORT", "4000"),
		Version: getEnv("VERSION", "0.1.0"),

		AuthServiceURL:         getEnv("AUTH_SERVICE_URL", "http://localhost:4001"),
		CoreServiceURL:         getEnv("CORE_SERVICE_URL", "http://localhost:4002"),
		VesselServiceURL:       getEnv("VESSEL_SERVICE_URL", "http://localhost:4003"),
		VendorServiceURL:       getEnv("VENDOR_SERVICE_URL", "http://localhost:4004"),
		RealtimeServiceURL:     getEnv("REALTIME_SERVICE_URL", "http://localhost:4005"),
		NotificationServiceURL: getEnv("NOTIFICATION_SERVICE_URL", "http://localhost:4006"),
		AnalyticsServiceURL:    getEnv("ANALYTICS_SERVICE_URL", "http://localhost:4007"),

		AllowedOrigins: []string{
			"http://localhost:3000",
			"http://localhost:3001",
			"http://localhost:3002",
			getEnv("KEY_APP_URL", ""),
			getEnv("PORTAL_APP_URL", ""),
			getEnv("VENDOR_APP_URL", ""),
		},

		RateLimit:    100,
		RateLimitTTL: 60,
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
