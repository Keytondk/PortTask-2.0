package database

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/navo/pkg/logger"
	"go.uber.org/zap"
)

var Pool *pgxpool.Pool

// Config holds database configuration
type Config struct {
	Host        string
	Port        string
	User        string
	Password    string
	Database    string
	SSLMode     string // require, verify-full, verify-ca, prefer, allow, disable
	MaxConns    int32
	MinConns    int32
	MaxConnLife time.Duration
	MaxConnIdle time.Duration
	HealthCheck time.Duration
}

// DefaultConfig returns default database configuration
// SSL mode defaults to "require" for production security.
// Set DB_SSL_MODE=disable only for local development.
func DefaultConfig() *Config {
	// Default to require for security - disable only explicitly for local dev
	sslMode := getEnv("DB_SSL_MODE", "require")

	return &Config{
		Host:        getEnv("DB_HOST", "localhost"),
		Port:        getEnv("DB_PORT", "5432"),
		User:        getEnv("DB_USER", "postgres"),
		Password:    getEnv("DB_PASSWORD", "postgres"),
		Database:    getEnv("DB_NAME", "navo"),
		SSLMode:     sslMode,
		MaxConns:    50,
		MinConns:    10,
		MaxConnLife: time.Hour,
		MaxConnIdle: time.Minute * 30,
		HealthCheck: time.Minute,
	}
}

// Connect establishes a connection pool to PostgreSQL
func Connect(ctx context.Context, cfg *Config) (*pgxpool.Pool, error) {
	// Validate SSL mode
	validSSLModes := map[string]bool{
		"disable":     true,
		"allow":       true,
		"prefer":      true,
		"require":     true,
		"verify-ca":   true,
		"verify-full": true,
	}
	if !validSSLModes[cfg.SSLMode] {
		return nil, fmt.Errorf("invalid SSL mode: %s (valid: disable, allow, prefer, require, verify-ca, verify-full)", cfg.SSLMode)
	}

	// Log warning if SSL is disabled in non-development environment
	if cfg.SSLMode == "disable" {
		goEnv := os.Getenv("GO_ENV")
		if goEnv == "production" || goEnv == "staging" {
			logger.Warn("Database SSL is disabled in production/staging environment - this is a security risk",
				zap.String("ssl_mode", cfg.SSLMode),
				zap.String("go_env", goEnv),
			)
		}
	}

	dsn := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s",
		cfg.User,
		cfg.Password,
		cfg.Host,
		cfg.Port,
		cfg.Database,
		cfg.SSLMode,
	)

	poolConfig, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database config: %w", err)
	}

	poolConfig.MaxConns = cfg.MaxConns
	poolConfig.MinConns = cfg.MinConns
	poolConfig.MaxConnLifetime = cfg.MaxConnLife
	poolConfig.MaxConnIdleTime = cfg.MaxConnIdle
	poolConfig.HealthCheckPeriod = cfg.HealthCheck

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Test connection
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	logger.Info("Connected to PostgreSQL",
		zap.String("host", cfg.Host),
		zap.String("database", cfg.Database),
		zap.String("ssl_mode", cfg.SSLMode),
	)

	Pool = pool
	return pool, nil
}

// Close closes the database connection pool
func Close() {
	if Pool != nil {
		Pool.Close()
		logger.Info("Database connection closed")
	}
}

// Health checks database health
func Health(ctx context.Context) error {
	if Pool == nil {
		return fmt.Errorf("database pool not initialized")
	}
	return Pool.Ping(ctx)
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// GetStdLib returns a *sql.DB from the connection pool
// This is required for compatibility with libraries expecting database/sql interfaces
// and for legacy code using *sql.DB/Tx
func GetStdLib(pool *pgxpool.Pool) *sql.DB {
	return stdlib.OpenDBFromPool(pool)
}
