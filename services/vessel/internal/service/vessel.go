package service

import (
	"context"
	"fmt"

	"github.com/go-redis/redis/v8"
	"github.com/navo/services/vessel/internal/model"
	"github.com/navo/services/vessel/internal/repository"
)

// VesselService handles vessel business logic
type VesselService struct {
	repo  *repository.VesselRepository
	cache *redis.Client
}

// NewVesselService creates a new vessel service
func NewVesselService(repo *repository.VesselRepository, cache *redis.Client) *VesselService {
	return &VesselService{
		repo:  repo,
		cache: cache,
	}
}

// Create creates a new vessel
func (s *VesselService) Create(ctx context.Context, input model.CreateVesselInput) (*model.Vessel, error) {
	// Validate input
	if input.Name == "" {
		return nil, fmt.Errorf("vessel name is required")
	}
	if input.WorkspaceID == "" {
		return nil, fmt.Errorf("workspace_id is required")
	}

	// Check for duplicate IMO
	if input.IMO != nil && *input.IMO != "" {
		existing, err := s.repo.GetByIMO(ctx, *input.IMO)
		if err == nil && existing != nil {
			return nil, fmt.Errorf("vessel with IMO %s already exists", *input.IMO)
		}
	}

	vessel, err := s.repo.Create(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to create vessel: %w", err)
	}

	s.invalidateCache(ctx, input.WorkspaceID)

	return vessel, nil
}

// GetByID retrieves a vessel by ID
func (s *VesselService) GetByID(ctx context.Context, id string) (*model.Vessel, error) {
	vessel, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get vessel: %w", err)
	}
	if vessel == nil {
		return nil, fmt.Errorf("vessel not found")
	}

	return vessel, nil
}

// GetByIMO retrieves a vessel by IMO number
func (s *VesselService) GetByIMO(ctx context.Context, imo string) (*model.Vessel, error) {
	vessel, err := s.repo.GetByIMO(ctx, imo)
	if err != nil {
		return nil, fmt.Errorf("failed to get vessel: %w", err)
	}
	if vessel == nil {
		return nil, fmt.Errorf("vessel not found")
	}

	return vessel, nil
}

// List retrieves vessels with filters
func (s *VesselService) List(ctx context.Context, filter model.VesselFilter) (*model.VesselListResult, error) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.PerPage <= 0 {
		filter.PerPage = 20
	}
	if filter.PerPage > 100 {
		filter.PerPage = 100
	}

	vessels, total, err := s.repo.List(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to list vessels: %w", err)
	}

	return &model.VesselListResult{
		Vessels: vessels,
		Total:   total,
		Page:    filter.Page,
		PerPage: filter.PerPage,
	}, nil
}

// Update updates a vessel
func (s *VesselService) Update(ctx context.Context, id string, input model.UpdateVesselInput) (*model.Vessel, error) {
	existing, err := s.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Check for duplicate IMO if changing
	if input.IMO != nil && *input.IMO != "" {
		if existing.IMO == nil || *existing.IMO != *input.IMO {
			dup, err := s.repo.GetByIMO(ctx, *input.IMO)
			if err == nil && dup != nil && dup.ID != id {
				return nil, fmt.Errorf("vessel with IMO %s already exists", *input.IMO)
			}
		}
	}

	vessel, err := s.repo.Update(ctx, id, input)
	if err != nil {
		return nil, fmt.Errorf("failed to update vessel: %w", err)
	}

	s.invalidateCache(ctx, existing.WorkspaceID)

	return vessel, nil
}

// Delete deletes a vessel
func (s *VesselService) Delete(ctx context.Context, id string) error {
	existing, err := s.GetByID(ctx, id)
	if err != nil {
		return err
	}

	if err := s.repo.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete vessel: %w", err)
	}

	s.invalidateCache(ctx, existing.WorkspaceID)

	return nil
}

// GetByWorkspace retrieves all vessels for a workspace
func (s *VesselService) GetByWorkspace(ctx context.Context, workspaceID string) ([]model.Vessel, error) {
	filter := model.VesselFilter{
		WorkspaceID: &workspaceID,
		PerPage:     1000, // Get all
	}

	result, err := s.List(ctx, filter)
	if err != nil {
		return nil, err
	}

	return result.Vessels, nil
}

// GetVesselsWithMMSI retrieves all vessels with MMSI numbers for tracking
func (s *VesselService) GetVesselsWithMMSI(ctx context.Context, workspaceID string) ([]struct {
	ID   string
	MMSI string
}, error) {
	vessels, err := s.GetByWorkspace(ctx, workspaceID)
	if err != nil {
		return nil, err
	}

	result := make([]struct {
		ID   string
		MMSI string
	}, 0)

	for _, v := range vessels {
		if v.MMSI != nil && *v.MMSI != "" {
			result = append(result, struct {
				ID   string
				MMSI string
			}{
				ID:   v.ID,
				MMSI: *v.MMSI,
			})
		}
	}

	return result, nil
}

// invalidateCache invalidates cache for a workspace
func (s *VesselService) invalidateCache(ctx context.Context, workspaceID string) {
	if s.cache != nil {
		s.cache.Del(ctx, fmt.Sprintf("vessels:%s", workspaceID))
	}
}
