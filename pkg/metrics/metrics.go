package metrics

import (
	"net/http"
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// Metrics holds all application metrics
type Metrics struct {
	// HTTP Metrics
	HTTPRequestsTotal   *prometheus.CounterVec
	HTTPRequestDuration *prometheus.HistogramVec
	HTTPRequestSize     *prometheus.HistogramVec
	HTTPResponseSize    *prometheus.HistogramVec
	HTTPActiveRequests  prometheus.Gauge

	// Business Metrics
	PortCallsTotal       *prometheus.CounterVec
	ServiceOrdersTotal   *prometheus.CounterVec
	RFQsTotal            *prometheus.CounterVec
	QuotesTotal          *prometheus.CounterVec
	NotificationsTotal   *prometheus.CounterVec
	DocumentUploadsTotal *prometheus.CounterVec

	// Database Metrics
	DBQueryDuration *prometheus.HistogramVec
	DBQueryTotal    *prometheus.CounterVec
	DBConnectionsActive prometheus.Gauge
	DBConnectionsIdle   prometheus.Gauge

	// Cache Metrics
	CacheHits   *prometheus.CounterVec
	CacheMisses *prometheus.CounterVec
	CacheSize   *prometheus.GaugeVec

	// External API Metrics
	ExternalAPIRequests *prometheus.CounterVec
	ExternalAPIDuration *prometheus.HistogramVec

	// WebSocket Metrics
	WebSocketConnections    prometheus.Gauge
	WebSocketMessagesTotal  *prometheus.CounterVec
	WebSocketSubscriptions  prometheus.Gauge

	// AIS Metrics
	AISPositionUpdates *prometheus.CounterVec
	AISAPIRequests     *prometheus.CounterVec
	AISAPIErrors       *prometheus.CounterVec

	// Worker Metrics
	WorkerJobsTotal      *prometheus.CounterVec
	WorkerJobDuration    *prometheus.HistogramVec
	WorkerJobsInProgress *prometheus.GaugeVec
}

// Config holds metrics configuration
type Config struct {
	Namespace string
	Subsystem string
}

// New creates a new Metrics instance with all metrics registered
func New(cfg Config) *Metrics {
	if cfg.Namespace == "" {
		cfg.Namespace = "navo"
	}

	m := &Metrics{}

	// HTTP Metrics
	m.HTTPRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: cfg.Namespace,
			Subsystem: cfg.Subsystem,
			Name:      "http_requests_total",
			Help:      "Total number of HTTP requests",
		},
		[]string{"method", "path", "status"},
	)

	m.HTTPRequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Namespace: cfg.Namespace,
			Subsystem: cfg.Subsystem,
			Name:      "http_request_duration_seconds",
			Help:      "HTTP request duration in seconds",
			Buckets:   []float64{.001, .005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10},
		},
		[]string{"method", "path"},
	)

	m.HTTPRequestSize = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Namespace: cfg.Namespace,
			Subsystem: cfg.Subsystem,
			Name:      "http_request_size_bytes",
			Help:      "HTTP request size in bytes",
			Buckets:   prometheus.ExponentialBuckets(100, 10, 8),
		},
		[]string{"method", "path"},
	)

	m.HTTPResponseSize = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Namespace: cfg.Namespace,
			Subsystem: cfg.Subsystem,
			Name:      "http_response_size_bytes",
			Help:      "HTTP response size in bytes",
			Buckets:   prometheus.ExponentialBuckets(100, 10, 8),
		},
		[]string{"method", "path"},
	)

	m.HTTPActiveRequests = promauto.NewGauge(
		prometheus.GaugeOpts{
			Namespace: cfg.Namespace,
			Subsystem: cfg.Subsystem,
			Name:      "http_active_requests",
			Help:      "Number of active HTTP requests",
		},
	)

	// Business Metrics
	m.PortCallsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: cfg.Namespace,
			Name:      "port_calls_total",
			Help:      "Total number of port calls by status",
		},
		[]string{"status", "organization_id"},
	)

	m.ServiceOrdersTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: cfg.Namespace,
			Name:      "service_orders_total",
			Help:      "Total number of service orders by status",
		},
		[]string{"status", "service_type", "organization_id"},
	)

	m.RFQsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: cfg.Namespace,
			Name:      "rfqs_total",
			Help:      "Total number of RFQs by status",
		},
		[]string{"status", "organization_id"},
	)

	m.QuotesTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: cfg.Namespace,
			Name:      "quotes_total",
			Help:      "Total number of quotes by status",
		},
		[]string{"status", "organization_id"},
	)

	m.NotificationsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: cfg.Namespace,
			Name:      "notifications_total",
			Help:      "Total number of notifications by type and status",
		},
		[]string{"type", "status", "category"},
	)

	m.DocumentUploadsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: cfg.Namespace,
			Name:      "document_uploads_total",
			Help:      "Total number of document uploads",
		},
		[]string{"type", "content_type", "organization_id"},
	)

	// Database Metrics
	m.DBQueryDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Namespace: cfg.Namespace,
			Name:      "db_query_duration_seconds",
			Help:      "Database query duration in seconds",
			Buckets:   []float64{.001, .005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5},
		},
		[]string{"operation", "table"},
	)

	m.DBQueryTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: cfg.Namespace,
			Name:      "db_queries_total",
			Help:      "Total number of database queries",
		},
		[]string{"operation", "table", "status"},
	)

	m.DBConnectionsActive = promauto.NewGauge(
		prometheus.GaugeOpts{
			Namespace: cfg.Namespace,
			Name:      "db_connections_active",
			Help:      "Number of active database connections",
		},
	)

	m.DBConnectionsIdle = promauto.NewGauge(
		prometheus.GaugeOpts{
			Namespace: cfg.Namespace,
			Name:      "db_connections_idle",
			Help:      "Number of idle database connections",
		},
	)

	// Cache Metrics
	m.CacheHits = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: cfg.Namespace,
			Name:      "cache_hits_total",
			Help:      "Total number of cache hits",
		},
		[]string{"cache_name"},
	)

	m.CacheMisses = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: cfg.Namespace,
			Name:      "cache_misses_total",
			Help:      "Total number of cache misses",
		},
		[]string{"cache_name"},
	)

	m.CacheSize = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Namespace: cfg.Namespace,
			Name:      "cache_size_bytes",
			Help:      "Current cache size in bytes",
		},
		[]string{"cache_name"},
	)

	// External API Metrics
	m.ExternalAPIRequests = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: cfg.Namespace,
			Name:      "external_api_requests_total",
			Help:      "Total number of external API requests",
		},
		[]string{"provider", "endpoint", "status"},
	)

	m.ExternalAPIDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Namespace: cfg.Namespace,
			Name:      "external_api_duration_seconds",
			Help:      "External API request duration in seconds",
			Buckets:   []float64{.1, .25, .5, 1, 2.5, 5, 10, 30},
		},
		[]string{"provider", "endpoint"},
	)

	// WebSocket Metrics
	m.WebSocketConnections = promauto.NewGauge(
		prometheus.GaugeOpts{
			Namespace: cfg.Namespace,
			Name:      "websocket_connections",
			Help:      "Number of active WebSocket connections",
		},
	)

	m.WebSocketMessagesTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: cfg.Namespace,
			Name:      "websocket_messages_total",
			Help:      "Total number of WebSocket messages",
		},
		[]string{"direction", "type"},
	)

	m.WebSocketSubscriptions = promauto.NewGauge(
		prometheus.GaugeOpts{
			Namespace: cfg.Namespace,
			Name:      "websocket_subscriptions",
			Help:      "Number of active WebSocket subscriptions",
		},
	)

	// AIS Metrics
	m.AISPositionUpdates = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: cfg.Namespace,
			Name:      "ais_position_updates_total",
			Help:      "Total number of AIS position updates processed",
		},
		[]string{"provider"},
	)

	m.AISAPIRequests = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: cfg.Namespace,
			Name:      "ais_api_requests_total",
			Help:      "Total number of AIS API requests",
		},
		[]string{"provider", "endpoint"},
	)

	m.AISAPIErrors = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: cfg.Namespace,
			Name:      "ais_api_errors_total",
			Help:      "Total number of AIS API errors",
		},
		[]string{"provider", "error_type"},
	)

	// Worker Metrics
	m.WorkerJobsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: cfg.Namespace,
			Name:      "worker_jobs_total",
			Help:      "Total number of worker jobs processed",
		},
		[]string{"worker", "status"},
	)

	m.WorkerJobDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Namespace: cfg.Namespace,
			Name:      "worker_job_duration_seconds",
			Help:      "Worker job duration in seconds",
			Buckets:   []float64{.01, .05, .1, .5, 1, 5, 10, 30, 60},
		},
		[]string{"worker"},
	)

	m.WorkerJobsInProgress = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Namespace: cfg.Namespace,
			Name:      "worker_jobs_in_progress",
			Help:      "Number of worker jobs currently in progress",
		},
		[]string{"worker"},
	)

	return m
}

// Handler returns the Prometheus HTTP handler
func Handler() http.Handler {
	return promhttp.Handler()
}

// HTTPMiddleware returns a middleware that records HTTP metrics
func (m *Metrics) HTTPMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		m.HTTPActiveRequests.Inc()
		defer m.HTTPActiveRequests.Dec()

		// Wrap response writer to capture status and size
		wrapped := &responseWriter{ResponseWriter: w, status: 200}

		next.ServeHTTP(wrapped, r)

		duration := time.Since(start).Seconds()
		path := sanitizePath(r.URL.Path)

		m.HTTPRequestsTotal.WithLabelValues(r.Method, path, strconv.Itoa(wrapped.status)).Inc()
		m.HTTPRequestDuration.WithLabelValues(r.Method, path).Observe(duration)
		m.HTTPRequestSize.WithLabelValues(r.Method, path).Observe(float64(r.ContentLength))
		m.HTTPResponseSize.WithLabelValues(r.Method, path).Observe(float64(wrapped.size))
	})
}

// responseWriter wraps http.ResponseWriter to capture status and size
type responseWriter struct {
	http.ResponseWriter
	status int
	size   int
}

func (w *responseWriter) WriteHeader(status int) {
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}

func (w *responseWriter) Write(b []byte) (int, error) {
	size, err := w.ResponseWriter.Write(b)
	w.size += size
	return size, err
}

// sanitizePath normalizes paths for metric labels
func sanitizePath(path string) string {
	// Replace UUIDs and IDs with placeholders
	// This prevents high cardinality in metrics
	// Example: /api/v1/port-calls/123e4567-e89b-12d3-a456-426614174000 -> /api/v1/port-calls/:id

	// For simplicity, just return the path as-is for now
	// In production, implement proper path normalization
	if len(path) > 50 {
		return path[:50]
	}
	return path
}

// RecordDBQuery records database query metrics
func (m *Metrics) RecordDBQuery(operation, table string, duration time.Duration, err error) {
	status := "success"
	if err != nil {
		status = "error"
	}
	m.DBQueryTotal.WithLabelValues(operation, table, status).Inc()
	m.DBQueryDuration.WithLabelValues(operation, table).Observe(duration.Seconds())
}

// RecordExternalAPICall records external API call metrics
func (m *Metrics) RecordExternalAPICall(provider, endpoint string, duration time.Duration, status int) {
	statusStr := strconv.Itoa(status)
	m.ExternalAPIRequests.WithLabelValues(provider, endpoint, statusStr).Inc()
	m.ExternalAPIDuration.WithLabelValues(provider, endpoint).Observe(duration.Seconds())
}

// RecordCacheHit records a cache hit
func (m *Metrics) RecordCacheHit(cacheName string) {
	m.CacheHits.WithLabelValues(cacheName).Inc()
}

// RecordCacheMiss records a cache miss
func (m *Metrics) RecordCacheMiss(cacheName string) {
	m.CacheMisses.WithLabelValues(cacheName).Inc()
}

// RecordNotification records a notification metric
func (m *Metrics) RecordNotification(notifType, status, category string) {
	m.NotificationsTotal.WithLabelValues(notifType, status, category).Inc()
}

// RecordAISUpdate records an AIS position update
func (m *Metrics) RecordAISUpdate(provider string) {
	m.AISPositionUpdates.WithLabelValues(provider).Inc()
}

// StartWorkerJob starts timing a worker job and returns a done function
func (m *Metrics) StartWorkerJob(worker string) func(err error) {
	start := time.Now()
	m.WorkerJobsInProgress.WithLabelValues(worker).Inc()

	return func(err error) {
		status := "success"
		if err != nil {
			status = "error"
		}
		m.WorkerJobsTotal.WithLabelValues(worker, status).Inc()
		m.WorkerJobDuration.WithLabelValues(worker).Observe(time.Since(start).Seconds())
		m.WorkerJobsInProgress.WithLabelValues(worker).Dec()
	}
}
