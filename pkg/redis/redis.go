package redis

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/navo/pkg/logger"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

var Client *redis.Client

// Config holds Redis configuration
type Config struct {
	Host     string
	Port     string
	Password string
	DB       int
}

// DefaultConfig returns default Redis configuration
func DefaultConfig() *Config {
	return &Config{
		Host:     getEnv("REDIS_HOST", "localhost"),
		Port:     getEnv("REDIS_PORT", "6379"),
		Password: getEnv("REDIS_PASSWORD", ""),
		DB:       0,
	}
}

// Connect establishes a connection to Redis
func Connect(ctx context.Context, cfg *Config) (*redis.Client, error) {
	client := redis.NewClient(&redis.Options{
		Addr:         fmt.Sprintf("%s:%s", cfg.Host, cfg.Port),
		Password:     cfg.Password,
		DB:           cfg.DB,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
		PoolSize:     100,
		MinIdleConns: 10,
	})

	// Test connection
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	logger.Info("Connected to Redis",
		zap.String("host", cfg.Host),
		zap.String("port", cfg.Port),
	)

	Client = client
	return client, nil
}

// Close closes the Redis connection
func Close() error {
	if Client != nil {
		logger.Info("Redis connection closed")
		return Client.Close()
	}
	return nil
}

// Health checks Redis health
func Health(ctx context.Context) error {
	if Client == nil {
		return fmt.Errorf("redis client not initialized")
	}
	return Client.Ping(ctx).Err()
}

// Set stores a key-value pair with expiration
func Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	return Client.Set(ctx, key, value, expiration).Err()
}

// Get retrieves a value by key
func Get(ctx context.Context, key string) (string, error) {
	return Client.Get(ctx, key).Result()
}

// Delete removes a key
func Delete(ctx context.Context, keys ...string) error {
	return Client.Del(ctx, keys...).Err()
}

// Publish publishes a message to a channel
func Publish(ctx context.Context, channel string, message interface{}) error {
	return Client.Publish(ctx, channel, message).Err()
}

// Subscribe subscribes to a channel
func Subscribe(ctx context.Context, channels ...string) *redis.PubSub {
	return Client.Subscribe(ctx, channels...)
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
