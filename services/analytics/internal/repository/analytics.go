package repository

import (
	"context"
	"database/sql"
	"time"

	"github.com/navo/services/analytics/internal/model"
)

// AnalyticsRepository handles analytics database queries
type AnalyticsRepository struct {
	db *sql.DB
}

// NewAnalyticsRepository creates a new analytics repository
func NewAnalyticsRepository(db *sql.DB) *AnalyticsRepository {
	return &AnalyticsRepository{db: db}
}

// GetDashboardMetrics retrieves high-level dashboard metrics
func (r *AnalyticsRepository) GetDashboardMetrics(ctx context.Context, orgID string) (*model.DashboardMetrics, error) {
	metrics := &model.DashboardMetrics{
		GeneratedAt: time.Now(),
	}

	// Active port calls
	r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM port_calls pc
		JOIN workspaces w ON pc.workspace_id = w.id
		WHERE w.organization_id = $1
		AND pc.status IN ('confirmed', 'arrived', 'alongside')
	`, orgID).Scan(&metrics.ActivePortCalls)

	// Port calls this month
	startOfMonth := time.Now().AddDate(0, 0, -time.Now().Day()+1)
	r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM port_calls pc
		JOIN workspaces w ON pc.workspace_id = w.id
		WHERE w.organization_id = $1
		AND pc.created_at >= $2
	`, orgID, startOfMonth).Scan(&metrics.PortCallsThisMonth)

	// Port calls last month for change calculation
	startOfLastMonth := startOfMonth.AddDate(0, -1, 0)
	var lastMonthCount int
	r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM port_calls pc
		JOIN workspaces w ON pc.workspace_id = w.id
		WHERE w.organization_id = $1
		AND pc.created_at >= $2 AND pc.created_at < $3
	`, orgID, startOfLastMonth, startOfMonth).Scan(&lastMonthCount)

	if lastMonthCount > 0 {
		metrics.PortCallsChange = float64(metrics.PortCallsThisMonth-lastMonthCount) / float64(lastMonthCount) * 100
	}

	// Vessel counts
	r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM vessels v
		JOIN workspaces w ON v.workspace_id = w.id
		WHERE w.organization_id = $1 AND v.status = 'active'
	`, orgID).Scan(&metrics.TotalVessels)

	// Open RFQs
	r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM rfqs r
		JOIN port_calls pc ON r.port_call_id = pc.id
		JOIN workspaces w ON pc.workspace_id = w.id
		WHERE w.organization_id = $1
		AND r.status = 'open'
	`, orgID).Scan(&metrics.OpenRFQs)

	// Active services
	r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM service_orders so
		JOIN port_calls pc ON so.port_call_id = pc.id
		JOIN workspaces w ON pc.workspace_id = w.id
		WHERE w.organization_id = $1
		AND so.status IN ('confirmed', 'in_progress')
	`, orgID).Scan(&metrics.ActiveServices)

	// Pending approvals
	r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM service_orders so
		JOIN port_calls pc ON so.port_call_id = pc.id
		JOIN workspaces w ON pc.workspace_id = w.id
		WHERE w.organization_id = $1
		AND so.status = 'pending_approval'
	`, orgID).Scan(&metrics.PendingApprovals)

	return metrics, nil
}

// GetPortCallAnalytics retrieves port call analytics
func (r *AnalyticsRepository) GetPortCallAnalytics(ctx context.Context, filter model.AnalyticsFilter) (*model.PortCallAnalytics, error) {
	analytics := &model.PortCallAnalytics{
		ByStatus: make(map[string]int),
	}

	// Total and by status
	rows, err := r.db.QueryContext(ctx, `
		SELECT status, COUNT(*) FROM port_calls pc
		JOIN workspaces w ON pc.workspace_id = w.id
		WHERE w.organization_id = $1
		AND pc.created_at >= $2 AND pc.created_at <= $3
		GROUP BY status
	`, filter.OrganizationID, filter.StartDate, filter.EndDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var status string
		var count int
		rows.Scan(&status, &count)
		analytics.ByStatus[status] = count
		analytics.Total += count
	}

	// By port
	rows, err = r.db.QueryContext(ctx, `
		SELECT p.id, p.name, p.country, COUNT(*) as count,
			   AVG(EXTRACT(EPOCH FROM (COALESCE(pc.atd, NOW()) - pc.ata)) / 3600) as avg_stay
		FROM port_calls pc
		JOIN ports p ON pc.port_id = p.id
		JOIN workspaces w ON pc.workspace_id = w.id
		WHERE w.organization_id = $1
		AND pc.created_at >= $2 AND pc.created_at <= $3
		GROUP BY p.id, p.name, p.country
		ORDER BY count DESC
		LIMIT 10
	`, filter.OrganizationID, filter.StartDate, filter.EndDate)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var stat model.PortStat
			var avgStay sql.NullFloat64
			rows.Scan(&stat.PortID, &stat.PortName, &stat.Country, &stat.CallCount, &avgStay)
			if avgStay.Valid {
				stat.AvgStayHrs = avgStay.Float64
			}
			analytics.ByPort = append(analytics.ByPort, stat)
		}
	}

	// Monthly trend
	rows, err = r.db.QueryContext(ctx, `
		SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*)
		FROM port_calls pc
		JOIN workspaces w ON pc.workspace_id = w.id
		WHERE w.organization_id = $1
		AND pc.created_at >= $2 AND pc.created_at <= $3
		GROUP BY month
		ORDER BY month
	`, filter.OrganizationID, filter.StartDate, filter.EndDate)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var mc model.MonthlyCount
			rows.Scan(&mc.Month, &mc.Count)
			analytics.MonthlyTrend = append(analytics.MonthlyTrend, mc)
		}
	}

	return analytics, nil
}

// GetCostAnalytics retrieves cost analytics
func (r *AnalyticsRepository) GetCostAnalytics(ctx context.Context, filter model.AnalyticsFilter) (*model.CostAnalytics, error) {
	analytics := &model.CostAnalytics{
		Currency: "USD",
	}

	// Total cost
	r.db.QueryRowContext(ctx, `
		SELECT COALESCE(SUM(final_price), 0) FROM service_orders so
		JOIN port_calls pc ON so.port_call_id = pc.id
		JOIN workspaces w ON pc.workspace_id = w.id
		WHERE w.organization_id = $1
		AND so.status = 'completed'
		AND so.completed_date >= $2 AND so.completed_date <= $3
	`, filter.OrganizationID, filter.StartDate, filter.EndDate).Scan(&analytics.TotalCost)

	// By service type
	rows, err := r.db.QueryContext(ctx, `
		SELECT st.id, st.name,
			   COALESCE(SUM(so.final_price), 0) as total,
			   COUNT(*) as count
		FROM service_orders so
		JOIN service_types st ON so.service_type_id = st.id
		JOIN port_calls pc ON so.port_call_id = pc.id
		JOIN workspaces w ON pc.workspace_id = w.id
		WHERE w.organization_id = $1
		AND so.status = 'completed'
		AND so.completed_date >= $2 AND so.completed_date <= $3
		GROUP BY st.id, st.name
		ORDER BY total DESC
	`, filter.OrganizationID, filter.StartDate, filter.EndDate)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var stc model.ServiceTypeCost
			rows.Scan(&stc.ServiceTypeID, &stc.ServiceTypeName, &stc.TotalCost, &stc.OrderCount)
			if stc.OrderCount > 0 {
				stc.AvgCost = stc.TotalCost / float64(stc.OrderCount)
			}
			analytics.ByServiceType = append(analytics.ByServiceType, stc)
		}
	}

	// Monthly trend
	rows, err = r.db.QueryContext(ctx, `
		SELECT TO_CHAR(so.completed_date, 'YYYY-MM') as month,
			   COALESCE(SUM(so.final_price), 0) as cost
		FROM service_orders so
		JOIN port_calls pc ON so.port_call_id = pc.id
		JOIN workspaces w ON pc.workspace_id = w.id
		WHERE w.organization_id = $1
		AND so.status = 'completed'
		AND so.completed_date >= $2 AND so.completed_date <= $3
		GROUP BY month
		ORDER BY month
	`, filter.OrganizationID, filter.StartDate, filter.EndDate)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var mc model.MonthlyCost
			rows.Scan(&mc.Month, &mc.Cost)
			analytics.MonthlyTrend = append(analytics.MonthlyTrend, mc)
		}
	}

	return analytics, nil
}

// GetVendorAnalytics retrieves vendor analytics
func (r *AnalyticsRepository) GetVendorAnalytics(ctx context.Context, orgID string) (*model.VendorAnalytics, error) {
	analytics := &model.VendorAnalytics{}

	// Counts
	r.db.QueryRowContext(ctx, `
		SELECT
			COUNT(*),
			COUNT(*) FILTER (WHERE is_verified = true),
			COUNT(*) FILTER (WHERE is_certified = true),
			AVG(rating)
		FROM vendors v
		JOIN operator_vendor_lists ovl ON v.id = ovl.vendor_id
		WHERE ovl.operator_org_id = $1 AND ovl.status = 'active'
	`, orgID).Scan(&analytics.TotalVendors, &analytics.VerifiedVendors,
		&analytics.CertifiedVendors, &analytics.AvgRating)

	// Top vendors
	rows, err := r.db.QueryContext(ctx, `
		SELECT v.id, v.name, v.rating, v.total_orders, v.on_time_delivery,
			   v.response_time, v.is_verified, v.is_certified
		FROM vendors v
		JOIN operator_vendor_lists ovl ON v.id = ovl.vendor_id
		WHERE ovl.operator_org_id = $1 AND ovl.status = 'active'
		ORDER BY v.rating DESC, v.total_orders DESC
		LIMIT 10
	`, orgID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var vr model.VendorRanking
			rows.Scan(&vr.VendorID, &vr.VendorName, &vr.Rating, &vr.TotalOrders,
				&vr.OnTimeDelivery, &vr.ResponseTimeHrs, &vr.IsVerified, &vr.IsCertified)
			analytics.TopVendors = append(analytics.TopVendors, vr)
		}
	}

	return analytics, nil
}

// GetRFQAnalytics retrieves RFQ analytics
func (r *AnalyticsRepository) GetRFQAnalytics(ctx context.Context, filter model.AnalyticsFilter) (*model.RFQAnalytics, error) {
	analytics := &model.RFQAnalytics{
		ByStatus: make(map[string]int),
	}

	// By status
	rows, err := r.db.QueryContext(ctx, `
		SELECT status, COUNT(*) FROM rfqs r
		JOIN port_calls pc ON r.port_call_id = pc.id
		JOIN workspaces w ON pc.workspace_id = w.id
		WHERE w.organization_id = $1
		AND r.created_at >= $2 AND r.created_at <= $3
		GROUP BY status
	`, filter.OrganizationID, filter.StartDate, filter.EndDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var status string
		var count int
		rows.Scan(&status, &count)
		analytics.ByStatus[status] = count
		analytics.TotalRFQs += count
	}

	// Average quotes per RFQ
	r.db.QueryRowContext(ctx, `
		SELECT AVG(quote_count) FROM (
			SELECT r.id, COUNT(q.id) as quote_count
			FROM rfqs r
			LEFT JOIN quotes q ON r.id = q.rfq_id
			JOIN port_calls pc ON r.port_call_id = pc.id
			JOIN workspaces w ON pc.workspace_id = w.id
			WHERE w.organization_id = $1
			AND r.created_at >= $2 AND r.created_at <= $3
			GROUP BY r.id
		) sub
	`, filter.OrganizationID, filter.StartDate, filter.EndDate).Scan(&analytics.AvgQuotesPerRFQ)

	return analytics, nil
}
