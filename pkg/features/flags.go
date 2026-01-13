// Package features provides a feature flag system for tenant-based
// feature customization and gradual rollouts.
package features

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/navo/pkg/logger"
	"github.com/navo/pkg/redis"
	"go.uber.org/zap"
)

// Flag represents a feature flag configuration
type Flag struct {
	Key          string   `json:"key"`
	Name         string   `json:"name"`
	Description  string   `json:"description,omitempty"`
	DefaultValue bool     `json:"default_value"`
	// Organizations with override (opposite of default)
	EnabledOrganizations  []string `json:"enabled_organizations,omitempty"`
	DisabledOrganizations []string `json:"disabled_organizations,omitempty"`
	// Workspaces with override (opposite of default)
	EnabledWorkspaces  []string `json:"enabled_workspaces,omitempty"`
	DisabledWorkspaces []string `json:"disabled_workspaces,omitempty"`
}

// Well-known feature flag keys
const (
	// FlagRFQEnabled enables RFQ/quoting workflow
	FlagRFQEnabled = "rfq_enabled"
	// FlagVesselTrackingEnabled enables AIS integration
	FlagVesselTrackingEnabled = "vessel_tracking_enabled"
	// FlagAutomationEnabled enables automation rules
	FlagAutomationEnabled = "automation_enabled"
	// FlagAnalyticsEnabled enables analytics dashboard
	FlagAnalyticsEnabled = "analytics_enabled"
	// FlagDocumentStorageEnabled enables document uploads
	FlagDocumentStorageEnabled = "document_storage_enabled"
	// FlagRealTimeEnabled enables real-time updates
	FlagRealTimeEnabled = "realtime_enabled"
	// FlagIncidentTrackingEnabled enables incident tracking
	FlagIncidentTrackingEnabled = "incident_tracking_enabled"
)

// Service provides feature flag functionality
type Service interface {
	// IsEnabled checks if a feature is enabled for the given context
	IsEnabled(ctx context.Context, key string, orgID, workspaceID string) bool

	// GetAll returns all feature flag states for the given context
	GetAll(ctx context.Context, orgID, workspaceID string) map[string]bool

	// GetFlag retrieves a flag definition
	GetFlag(ctx context.Context, key string) (*Flag, error)

	// SetFlag creates or updates a feature flag
	SetFlag(ctx context.Context, flag Flag) error

	// InvalidateCache clears the cache for a specific flag
	InvalidateCache(ctx context.Context, key string) error
}

// DBService implements Service using PostgreSQL and Redis caching
type DBService struct {
	pool        *pgxpool.Pool
	redis       *redis.Client
	cache       sync.Map
	cacheTTL    time.Duration
	refreshChan chan string
}

// DBServiceConfig holds configuration for DBService
type DBServiceConfig struct {
	CacheTTL time.Duration
}

// DefaultDBServiceConfig returns default configuration
func DefaultDBServiceConfig() *DBServiceConfig {
	return &DBServiceConfig{
		CacheTTL: 5 * time.Minute,
	}
}

// NewDBService creates a new database-backed feature flag service
func NewDBService(pool *pgxpool.Pool, redisClient *redis.Client, cfg *DBServiceConfig) *DBService {
	if cfg == nil {
		cfg = DefaultDBServiceConfig()
	}

	svc := &DBService{
		pool:        pool,
		redis:       redisClient,
		cacheTTL:    cfg.CacheTTL,
		refreshChan: make(chan string, 100),
	}

	// Start background cache refresher
	go svc.backgroundRefresh()

	return svc
}

// backgroundRefresh handles cache refresh requests
func (s *DBService) backgroundRefresh() {
	for key := range s.refreshChan {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		if flag, err := s.loadFromDB(ctx, key); err == nil {
			s.cache.Store(key, cachedFlag{flag: flag, loadedAt: time.Now()})
		}
		cancel()
	}
}

type cachedFlag struct {
	flag     *Flag
	loadedAt time.Time
}

// IsEnabled checks if a feature is enabled for the given context
func (s *DBService) IsEnabled(ctx context.Context, key string, orgID, workspaceID string) bool {
	flag, err := s.GetFlag(ctx, key)
	if err != nil {
		logger.Debug("Feature flag not found, using default false",
			zap.String("key", key),
			zap.Error(err),
		)
		return false
	}

	return evaluateFlag(flag, orgID, workspaceID)
}

// evaluateFlag determines if a flag is enabled for the given context
func evaluateFlag(flag *Flag, orgID, workspaceID string) bool {
	// Check workspace-level overrides first (most specific)
	if workspaceID != "" {
		// If in enabled workspaces, return true
		for _, ws := range flag.EnabledWorkspaces {
			if ws == workspaceID {
				return true
			}
		}
		// If in disabled workspaces, return false
		for _, ws := range flag.DisabledWorkspaces {
			if ws == workspaceID {
				return false
			}
		}
	}

	// Check organization-level overrides
	if orgID != "" {
		// If in enabled organizations, return true
		for _, org := range flag.EnabledOrganizations {
			if org == orgID {
				return true
			}
		}
		// If in disabled organizations, return false
		for _, org := range flag.DisabledOrganizations {
			if org == orgID {
				return false
			}
		}
	}

	// Fall back to default value
	return flag.DefaultValue
}

// GetAll returns all feature flag states for the given context
func (s *DBService) GetAll(ctx context.Context, orgID, workspaceID string) map[string]bool {
	result := make(map[string]bool)

	// Load all flags from database
	flags, err := s.loadAllFromDB(ctx)
	if err != nil {
		logger.Error("Failed to load feature flags", zap.Error(err))
		return result
	}

	// Evaluate each flag
	for _, flag := range flags {
		result[flag.Key] = evaluateFlag(&flag, orgID, workspaceID)
	}

	return result
}

// GetFlag retrieves a flag definition
func (s *DBService) GetFlag(ctx context.Context, key string) (*Flag, error) {
	// Check local cache first
	if cached, ok := s.cache.Load(key); ok {
		cf := cached.(cachedFlag)
		if time.Since(cf.loadedAt) < s.cacheTTL {
			return cf.flag, nil
		}
		// Cache expired, trigger background refresh
		select {
		case s.refreshChan <- key:
		default:
		}
		// Return stale data while refreshing
		return cf.flag, nil
	}

	// Load from database
	flag, err := s.loadFromDB(ctx, key)
	if err != nil {
		return nil, err
	}

	// Cache it
	s.cache.Store(key, cachedFlag{flag: flag, loadedAt: time.Now()})

	return flag, nil
}

// loadFromDB loads a single flag from the database
func (s *DBService) loadFromDB(ctx context.Context, key string) (*Flag, error) {
	query := `
		SELECT key, name, description, default_value,
			enabled_organizations, disabled_organizations,
			enabled_workspaces, disabled_workspaces
		FROM feature_flags
		WHERE key = $1
	`

	var flag Flag
	var description *string

	err := s.pool.QueryRow(ctx, query, key).Scan(
		&flag.Key,
		&flag.Name,
		&description,
		&flag.DefaultValue,
		&flag.EnabledOrganizations,
		&flag.DisabledOrganizations,
		&flag.EnabledWorkspaces,
		&flag.DisabledWorkspaces,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load feature flag %s: %w", key, err)
	}

	if description != nil {
		flag.Description = *description
	}

	return &flag, nil
}

// loadAllFromDB loads all flags from the database
func (s *DBService) loadAllFromDB(ctx context.Context) ([]Flag, error) {
	query := `
		SELECT key, name, description, default_value,
			enabled_organizations, disabled_organizations,
			enabled_workspaces, disabled_workspaces
		FROM feature_flags
	`

	rows, err := s.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to load feature flags: %w", err)
	}
	defer rows.Close()

	var flags []Flag
	for rows.Next() {
		var flag Flag
		var description *string

		err := rows.Scan(
			&flag.Key,
			&flag.Name,
			&description,
			&flag.DefaultValue,
			&flag.EnabledOrganizations,
			&flag.DisabledOrganizations,
			&flag.EnabledWorkspaces,
			&flag.DisabledWorkspaces,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan feature flag: %w", err)
		}

		if description != nil {
			flag.Description = *description
		}

		flags = append(flags, flag)
	}

	return flags, nil
}

// SetFlag creates or updates a feature flag
func (s *DBService) SetFlag(ctx context.Context, flag Flag) error {
	query := `
		INSERT INTO feature_flags (
			key, name, description, default_value,
			enabled_organizations, disabled_organizations,
			enabled_workspaces, disabled_workspaces,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
		ON CONFLICT (key) DO UPDATE SET
			name = EXCLUDED.name,
			description = EXCLUDED.description,
			default_value = EXCLUDED.default_value,
			enabled_organizations = EXCLUDED.enabled_organizations,
			disabled_organizations = EXCLUDED.disabled_organizations,
			enabled_workspaces = EXCLUDED.enabled_workspaces,
			disabled_workspaces = EXCLUDED.disabled_workspaces,
			updated_at = NOW()
	`

	_, err := s.pool.Exec(ctx, query,
		flag.Key,
		flag.Name,
		nullableString(flag.Description),
		flag.DefaultValue,
		flag.EnabledOrganizations,
		flag.DisabledOrganizations,
		flag.EnabledWorkspaces,
		flag.DisabledWorkspaces,
	)
	if err != nil {
		return fmt.Errorf("failed to set feature flag: %w", err)
	}

	// Invalidate cache
	s.cache.Delete(flag.Key)

	return nil
}

// InvalidateCache clears the cache for a specific flag
func (s *DBService) InvalidateCache(ctx context.Context, key string) error {
	s.cache.Delete(key)
	return nil
}

// nullableString returns nil for empty strings
func nullableString(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// InitializeDefaultFlags creates the default set of feature flags if they don't exist
func InitializeDefaultFlags(ctx context.Context, svc Service) error {
	defaults := []Flag{
		{
			Key:          FlagRFQEnabled,
			Name:         "RFQ/Quoting Workflow",
			Description:  "Enable request for quote and vendor quoting workflow",
			DefaultValue: true,
		},
		{
			Key:          FlagVesselTrackingEnabled,
			Name:         "Vessel Tracking",
			Description:  "Enable AIS integration and real-time vessel tracking",
			DefaultValue: true,
		},
		{
			Key:          FlagAutomationEnabled,
			Name:         "Automation Rules",
			Description:  "Enable custom automation rules and triggers",
			DefaultValue: false,
		},
		{
			Key:          FlagAnalyticsEnabled,
			Name:         "Analytics Dashboard",
			Description:  "Enable analytics and reporting features",
			DefaultValue: true,
		},
		{
			Key:          FlagDocumentStorageEnabled,
			Name:         "Document Storage",
			Description:  "Enable document upload and storage",
			DefaultValue: true,
		},
		{
			Key:          FlagRealTimeEnabled,
			Name:         "Real-Time Updates",
			Description:  "Enable WebSocket real-time notifications",
			DefaultValue: true,
		},
		{
			Key:          FlagIncidentTrackingEnabled,
			Name:         "Incident Tracking",
			Description:  "Enable incident reporting and tracking",
			DefaultValue: false,
		},
	}

	for _, flag := range defaults {
		if err := svc.SetFlag(ctx, flag); err != nil {
			return fmt.Errorf("failed to initialize flag %s: %w", flag.Key, err)
		}
	}

	return nil
}
