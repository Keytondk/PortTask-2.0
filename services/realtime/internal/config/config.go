package config

import (
	"os"
	"strconv"
	"time"
)

// Config holds configuration for the realtime service
type Config struct {
	// Server configuration
	Port            string
	Host            string
	ReadTimeout     time.Duration
	WriteTimeout    time.Duration
	ShutdownTimeout time.Duration

	// WebSocket configuration
	MaxMessageSize     int64
	WriteBufferSize    int
	ReadBufferSize     int
	HandshakeTimeout   time.Duration
	PingInterval       time.Duration
	PongTimeout        time.Duration
	AllowedOrigins     []string
	EnableCompression  bool

	// Redis configuration
	RedisURL      string
	RedisPassword string
	RedisDB       int

	// Hub configuration
	ClientBufferSize   int
	HeartbeatInterval  time.Duration
	CleanupInterval    time.Duration
	StaleTimeout       time.Duration

	// Security
	JWTSecret string
	EnableTLS bool
	TLSCert   string
	TLSKey    string
}

// Load loads configuration from environment variables
func Load() *Config {
	return &Config{
		// Server
		Port:            getEnv("PORT", "8084"),
		Host:            getEnv("HOST", "0.0.0.0"),
		ReadTimeout:     getDurationEnv("READ_TIMEOUT", 15*time.Second),
		WriteTimeout:    getDurationEnv("WRITE_TIMEOUT", 15*time.Second),
		ShutdownTimeout: getDurationEnv("SHUTDOWN_TIMEOUT", 30*time.Second),

		// WebSocket
		MaxMessageSize:    getIntEnv("WS_MAX_MESSAGE_SIZE", 4096),
		WriteBufferSize:   int(getIntEnv("WS_WRITE_BUFFER_SIZE", 1024)),
		ReadBufferSize:    int(getIntEnv("WS_READ_BUFFER_SIZE", 1024)),
		HandshakeTimeout:  getDurationEnv("WS_HANDSHAKE_TIMEOUT", 10*time.Second),
		PingInterval:      getDurationEnv("WS_PING_INTERVAL", 30*time.Second),
		PongTimeout:       getDurationEnv("WS_PONG_TIMEOUT", 60*time.Second),
		AllowedOrigins:    getEnvSlice("WS_ALLOWED_ORIGINS", []string{"*"}),
		EnableCompression: getBoolEnv("WS_ENABLE_COMPRESSION", false),

		// Redis
		RedisURL:      getEnv("REDIS_URL", "localhost:6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
		RedisDB:       int(getIntEnv("REDIS_DB", 0)),

		// Hub
		ClientBufferSize:  int(getIntEnv("CLIENT_BUFFER_SIZE", 256)),
		HeartbeatInterval: getDurationEnv("HEARTBEAT_INTERVAL", 30*time.Second),
		CleanupInterval:   getDurationEnv("CLEANUP_INTERVAL", 60*time.Second),
		StaleTimeout:      getDurationEnv("STALE_TIMEOUT", 120*time.Second),

		// Security
		JWTSecret: getEnv("JWT_SECRET", ""),
		EnableTLS: getBoolEnv("ENABLE_TLS", false),
		TLSCert:   getEnv("TLS_CERT", ""),
		TLSKey:    getEnv("TLS_KEY", ""),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getIntEnv(key string, defaultValue int64) int64 {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.ParseInt(value, 10, 64); err == nil {
			return intVal
		}
	}
	return defaultValue
}

func getBoolEnv(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolVal, err := strconv.ParseBool(value); err == nil {
			return boolVal
		}
	}
	return defaultValue
}

func getDurationEnv(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}

func getEnvSlice(key string, defaultValue []string) []string {
	if value := os.Getenv(key); value != "" {
		// Simple comma-separated parsing
		var result []string
		current := ""
		for _, c := range value {
			if c == ',' {
				if current != "" {
					result = append(result, current)
					current = ""
				}
			} else {
				current += string(c)
			}
		}
		if current != "" {
			result = append(result, current)
		}
		return result
	}
	return defaultValue
}

// Validate validates the configuration
func (c *Config) Validate() error {
	// Add validation logic as needed
	return nil
}
