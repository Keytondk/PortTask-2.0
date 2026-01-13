package config

import (
	"os"
	"strconv"
	"time"
)

// Config holds vessel service configuration
type Config struct {
	Port                  string
	Env                   string
	AISProviderType       string        // marinetraffic, vesselfinder
	AISProviderAPIKey     string
	EnablePositionPolling bool
	PollingInterval       time.Duration
	PositionCacheTTL      time.Duration
}

// Load loads configuration from environment variables
func Load() *Config {
	pollingEnabled, _ := strconv.ParseBool(getEnv("VESSEL_POLLING_ENABLED", "true"))
	pollingInterval, _ := strconv.Atoi(getEnv("VESSEL_POLLING_INTERVAL_SECONDS", "300"))
	cacheTTL, _ := strconv.Atoi(getEnv("VESSEL_POSITION_CACHE_TTL_SECONDS", "60"))

	return &Config{
		Port:                  getEnv("PORT", "4003"),
		Env:                   getEnv("GO_ENV", "development"),
		AISProviderType:       getEnv("AIS_PROVIDER_TYPE", "marinetraffic"),
		AISProviderAPIKey:     getEnv("AIS_PROVIDER_API_KEY", ""),
		EnablePositionPolling: pollingEnabled,
		PollingInterval:       time.Duration(pollingInterval) * time.Second,
		PositionCacheTTL:      time.Duration(cacheTTL) * time.Second,
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
