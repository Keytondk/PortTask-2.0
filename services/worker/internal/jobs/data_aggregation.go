package jobs

import (
	"context"
	"database/sql"
	"time"

	"github.com/navo/pkg/logger"
	"go.uber.org/zap"
)

// DataAggregationJob aggregates operational data for analytics
type DataAggregationJob struct {
	db *sql.DB
}

// NewDataAggregationJob creates a new data aggregation job
func NewDataAggregationJob(db *sql.DB) *DataAggregationJob {
	return &DataAggregationJob{db: db}
}

// Name returns the job name
func (j *DataAggregationJob) Name() string {
	return "data_aggregation"
}

// Run executes the data aggregation
func (j *DataAggregationJob) Run(ctx context.Context) error {
	logger.Info("Starting data aggregation")
	start := time.Now()

	// Aggregate port call statistics by organization
	if err := j.aggregatePortCallStats(ctx); err != nil {
		logger.Error("Failed to aggregate port call stats", zap.Error(err))
	}

	// Aggregate vendor performance metrics
	if err := j.aggregateVendorMetrics(ctx); err != nil {
		logger.Error("Failed to aggregate vendor metrics", zap.Error(err))
	}

	// Aggregate RFQ statistics
	if err := j.aggregateRFQStats(ctx); err != nil {
		logger.Error("Failed to aggregate RFQ stats", zap.Error(err))
	}

	logger.Info("Data aggregation completed", zap.Duration("duration", time.Since(start)))
	return nil
}

// aggregatePortCallStats aggregates port call statistics
func (j *DataAggregationJob) aggregatePortCallStats(ctx context.Context) error {
	// Update port call counts and average durations by workspace
	_, err := j.db.ExecContext(ctx, `
		INSERT INTO workspace_stats (workspace_id, date, port_calls_total, port_calls_completed, avg_port_stay_hours)
		SELECT
			workspace_id,
			CURRENT_DATE as date,
			COUNT(*) as port_calls_total,
			COUNT(*) FILTER (WHERE status = 'completed') as port_calls_completed,
			AVG(EXTRACT(EPOCH FROM (COALESCE(atd, NOW()) - ata)) / 3600)
				FILTER (WHERE ata IS NOT NULL) as avg_port_stay_hours
		FROM port_calls
		WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
		GROUP BY workspace_id
		ON CONFLICT (workspace_id, date) DO UPDATE SET
			port_calls_total = EXCLUDED.port_calls_total,
			port_calls_completed = EXCLUDED.port_calls_completed,
			avg_port_stay_hours = EXCLUDED.avg_port_stay_hours,
			updated_at = NOW()
	`)
	return err
}

// aggregateVendorMetrics aggregates vendor performance metrics
func (j *DataAggregationJob) aggregateVendorMetrics(ctx context.Context) error {
	// Update vendor metrics based on completed service orders
	_, err := j.db.ExecContext(ctx, `
		WITH vendor_stats AS (
			SELECT
				vendor_id,
				COUNT(*) as total_orders,
				AVG(CASE WHEN completed_date <= requested_date THEN 1 ELSE 0 END) * 100 as on_time_pct,
				AVG(rating) as avg_rating
			FROM service_orders
			WHERE vendor_id IS NOT NULL
			AND status = 'completed'
			AND completed_date >= CURRENT_DATE - INTERVAL '90 days'
			GROUP BY vendor_id
		)
		UPDATE vendors v
		SET
			total_orders = COALESCE(vs.total_orders, v.total_orders),
			on_time_delivery = COALESCE(vs.on_time_pct, v.on_time_delivery),
			rating = COALESCE(vs.avg_rating, v.rating),
			updated_at = NOW()
		FROM vendor_stats vs
		WHERE v.id = vs.vendor_id
	`)
	return err
}

// aggregateRFQStats aggregates RFQ statistics
func (j *DataAggregationJob) aggregateRFQStats(ctx context.Context) error {
	// Calculate vendor response times and win rates
	_, err := j.db.ExecContext(ctx, `
		WITH quote_stats AS (
			SELECT
				q.vendor_id,
				AVG(EXTRACT(EPOCH FROM (q.submitted_at - r.created_at)) / 3600) as avg_response_hours,
				COUNT(*) as total_quotes,
				COUNT(*) FILTER (WHERE q.status = 'accepted') as won_quotes
			FROM quotes q
			JOIN rfqs r ON q.rfq_id = r.id
			WHERE q.submitted_at >= CURRENT_DATE - INTERVAL '90 days'
			GROUP BY q.vendor_id
		)
		UPDATE vendors v
		SET
			response_time = COALESCE(qs.avg_response_hours, v.response_time),
			updated_at = NOW()
		FROM quote_stats qs
		WHERE v.id = qs.vendor_id
	`)
	return err
}
