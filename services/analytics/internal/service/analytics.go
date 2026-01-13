package service

import (
	"context"
	"time"

	"github.com/navo/services/analytics/internal/model"
	"github.com/navo/services/analytics/internal/repository"
)

// AnalyticsService handles analytics business logic
type AnalyticsService struct {
	repo *repository.AnalyticsRepository
}

// NewAnalyticsService creates a new analytics service
func NewAnalyticsService(repo *repository.AnalyticsRepository) *AnalyticsService {
	return &AnalyticsService{repo: repo}
}

// GetDashboardMetrics returns dashboard metrics for an organization
func (s *AnalyticsService) GetDashboardMetrics(ctx context.Context, orgID string) (*model.DashboardMetrics, error) {
	return s.repo.GetDashboardMetrics(ctx, orgID)
}

// GetPortCallAnalytics returns port call analytics
func (s *AnalyticsService) GetPortCallAnalytics(ctx context.Context, orgID string, startDate, endDate time.Time) (*model.PortCallAnalytics, error) {
	filter := model.AnalyticsFilter{
		OrganizationID: orgID,
		StartDate:      startDate,
		EndDate:        endDate,
	}
	return s.repo.GetPortCallAnalytics(ctx, filter)
}

// GetCostAnalytics returns cost analytics
func (s *AnalyticsService) GetCostAnalytics(ctx context.Context, orgID string, startDate, endDate time.Time) (*model.CostAnalytics, error) {
	filter := model.AnalyticsFilter{
		OrganizationID: orgID,
		StartDate:      startDate,
		EndDate:        endDate,
	}
	return s.repo.GetCostAnalytics(ctx, filter)
}

// GetVendorAnalytics returns vendor analytics
func (s *AnalyticsService) GetVendorAnalytics(ctx context.Context, orgID string) (*model.VendorAnalytics, error) {
	return s.repo.GetVendorAnalytics(ctx, orgID)
}

// GetRFQAnalytics returns RFQ analytics
func (s *AnalyticsService) GetRFQAnalytics(ctx context.Context, orgID string, startDate, endDate time.Time) (*model.RFQAnalytics, error) {
	filter := model.AnalyticsFilter{
		OrganizationID: orgID,
		StartDate:      startDate,
		EndDate:        endDate,
	}
	return s.repo.GetRFQAnalytics(ctx, filter)
}

// GetDefaultDateRange returns default date range (last 30 days)
func (s *AnalyticsService) GetDefaultDateRange() (time.Time, time.Time) {
	end := time.Now()
	start := end.AddDate(0, 0, -30)
	return start, end
}

// ParseDateRange parses date range from strings with defaults
func (s *AnalyticsService) ParseDateRange(startStr, endStr string) (time.Time, time.Time) {
	layout := "2006-01-02"

	end := time.Now()
	start := end.AddDate(0, 0, -30)

	if startStr != "" {
		if t, err := time.Parse(layout, startStr); err == nil {
			start = t
		}
	}

	if endStr != "" {
		if t, err := time.Parse(layout, endStr); err == nil {
			end = t
		}
	}

	return start, end
}
