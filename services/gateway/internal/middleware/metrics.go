package middleware

import (
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	// HTTP metrics
	httpRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "navo",
			Subsystem: "gateway",
			Name:      "http_requests_total",
			Help:      "Total number of HTTP requests processed by the gateway",
		},
		[]string{"method", "path", "status"},
	)

	httpRequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Namespace: "navo",
			Subsystem: "gateway",
			Name:      "http_request_duration_seconds",
			Help:      "HTTP request duration in seconds",
			Buckets:   []float64{.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10},
		},
		[]string{"method", "path"},
	)

	httpActiveRequests = promauto.NewGauge(
		prometheus.GaugeOpts{
			Namespace: "navo",
			Subsystem: "gateway",
			Name:      "http_active_requests",
			Help:      "Number of active HTTP requests being processed",
		},
	)

	httpRequestSize = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Namespace: "navo",
			Subsystem: "gateway",
			Name:      "http_request_size_bytes",
			Help:      "HTTP request size in bytes",
			Buckets:   prometheus.ExponentialBuckets(100, 10, 7),
		},
		[]string{"method"},
	)

	httpResponseSize = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Namespace: "navo",
			Subsystem: "gateway",
			Name:      "http_response_size_bytes",
			Help:      "HTTP response size in bytes",
			Buckets:   prometheus.ExponentialBuckets(100, 10, 7),
		},
		[]string{"method"},
	)

	// Upstream metrics
	upstreamRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "navo",
			Subsystem: "gateway",
			Name:      "upstream_requests_total",
			Help:      "Total number of requests to upstream services",
		},
		[]string{"service", "status"},
	)

	upstreamRequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Namespace: "navo",
			Subsystem: "gateway",
			Name:      "upstream_request_duration_seconds",
			Help:      "Upstream request duration in seconds",
			Buckets:   []float64{.01, .05, .1, .25, .5, 1, 2.5, 5, 10, 30},
		},
		[]string{"service"},
	)

	// Authentication metrics
	authRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "navo",
			Subsystem: "gateway",
			Name:      "auth_requests_total",
			Help:      "Total number of authentication requests",
		},
		[]string{"status"},
	)

	// Rate limiting metrics
	rateLimitHits = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "navo",
			Subsystem: "gateway",
			Name:      "rate_limit_hits_total",
			Help:      "Total number of rate limit hits",
		},
		[]string{"limit_type"},
	)
)

// UUID regex for path normalization
var uuidRegex = regexp.MustCompile(`[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}`)
var numericIDRegex = regexp.MustCompile(`/\d+`)

// Metrics returns a middleware that records Prometheus metrics
func Metrics(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		httpActiveRequests.Inc()
		defer httpActiveRequests.Dec()

		// Record request size
		if r.ContentLength > 0 {
			httpRequestSize.WithLabelValues(r.Method).Observe(float64(r.ContentLength))
		}

		// Wrap response writer
		wrapped := &metricsResponseWriter{ResponseWriter: w, status: 200}

		next.ServeHTTP(wrapped, r)

		// Calculate duration
		duration := time.Since(start).Seconds()

		// Normalize path for metrics (replace IDs with placeholders)
		path := normalizePath(r.URL.Path)

		// Record metrics
		httpRequestsTotal.WithLabelValues(r.Method, path, strconv.Itoa(wrapped.status)).Inc()
		httpRequestDuration.WithLabelValues(r.Method, path).Observe(duration)
		httpResponseSize.WithLabelValues(r.Method).Observe(float64(wrapped.size))
	})
}

// metricsResponseWriter wraps http.ResponseWriter to capture response details
type metricsResponseWriter struct {
	http.ResponseWriter
	status int
	size   int
}

func (w *metricsResponseWriter) WriteHeader(status int) {
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}

func (w *metricsResponseWriter) Write(b []byte) (int, error) {
	size, err := w.ResponseWriter.Write(b)
	w.size += size
	return size, err
}

// Flush implements http.Flusher
func (w *metricsResponseWriter) Flush() {
	if flusher, ok := w.ResponseWriter.(http.Flusher); ok {
		flusher.Flush()
	}
}

// normalizePath normalizes API paths for metrics labels
// Replaces UUIDs and numeric IDs with placeholders to prevent high cardinality
func normalizePath(path string) string {
	// Replace UUIDs
	path = uuidRegex.ReplaceAllString(path, ":id")

	// Replace numeric IDs (e.g., /users/123 -> /users/:id)
	path = numericIDRegex.ReplaceAllString(path, "/:id")

	// Truncate if too long
	if len(path) > 60 {
		path = path[:60]
	}

	return path
}

// RecordUpstreamRequest records metrics for upstream service calls
func RecordUpstreamRequest(service string, duration time.Duration, statusCode int) {
	status := "success"
	if statusCode >= 400 {
		status = "error"
	}
	upstreamRequestsTotal.WithLabelValues(service, status).Inc()
	upstreamRequestDuration.WithLabelValues(service).Observe(duration.Seconds())
}

// RecordAuthRequest records authentication request metrics
func RecordAuthRequest(success bool) {
	status := "success"
	if !success {
		status = "failure"
	}
	authRequestsTotal.WithLabelValues(status).Inc()
}

// RecordRateLimitHit records a rate limit hit
func RecordRateLimitHit(limitType string) {
	rateLimitHits.WithLabelValues(limitType).Inc()
}

// ServiceHealth tracks health status of upstream services
type ServiceHealth struct {
	healthy   prometheus.Gauge
	lastCheck prometheus.Gauge
}

var serviceHealthMetrics = make(map[string]*ServiceHealth)

// RegisterServiceHealth registers health metrics for a service
func RegisterServiceHealth(serviceName string) *ServiceHealth {
	health := &ServiceHealth{
		healthy: promauto.NewGauge(prometheus.GaugeOpts{
			Namespace:   "navo",
			Subsystem:   "gateway",
			Name:        "upstream_service_healthy",
			Help:        "Whether the upstream service is healthy (1) or not (0)",
			ConstLabels: prometheus.Labels{"service": serviceName},
		}),
		lastCheck: promauto.NewGauge(prometheus.GaugeOpts{
			Namespace:   "navo",
			Subsystem:   "gateway",
			Name:        "upstream_service_last_check_timestamp",
			Help:        "Unix timestamp of the last health check",
			ConstLabels: prometheus.Labels{"service": serviceName},
		}),
	}
	serviceHealthMetrics[serviceName] = health
	return health
}

// SetHealthy sets the service health status
func (h *ServiceHealth) SetHealthy(healthy bool) {
	if healthy {
		h.healthy.Set(1)
	} else {
		h.healthy.Set(0)
	}
	h.lastCheck.SetToCurrentTime()
}

// GetServicePath extracts the service name from the request path
func GetServicePath(path string) string {
	parts := strings.Split(strings.TrimPrefix(path, "/"), "/")
	if len(parts) >= 3 && parts[0] == "api" && parts[1] == "v1" {
		return parts[2]
	}
	return "unknown"
}
