package observability

import (
	"net/http"
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	// HTTP metrics
	httpRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "navo_http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "path", "status"},
	)

	httpRequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "navo_http_request_duration_seconds",
			Help:    "HTTP request duration in seconds",
			Buckets: []float64{.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10},
		},
		[]string{"method", "path"},
	)

	// Business metrics
	portCallsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "navo_port_calls_total",
			Help: "Total number of port calls created",
		},
		[]string{"status", "port"},
	)

	serviceOrdersTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "navo_service_orders_total",
			Help: "Total number of service orders",
		},
		[]string{"status", "category"},
	)

	rfqsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "navo_rfqs_total",
			Help: "Total number of RFQs",
		},
		[]string{"status"},
	)

	activeVessels = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "navo_active_vessels",
			Help: "Number of currently tracked vessels",
		},
	)

	websocketConnections = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "navo_websocket_connections",
			Help: "Current number of WebSocket connections",
		},
	)
)

// MetricsMiddleware records HTTP metrics
func MetricsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		wrapped := &responseWriter{ResponseWriter: w, statusCode: 200}

		next.ServeHTTP(wrapped, r)

		duration := time.Since(start).Seconds()
		status := strconv.Itoa(wrapped.statusCode)
		path := normalizePath(r.URL.Path)

		httpRequestsTotal.WithLabelValues(r.Method, path, status).Inc()
		httpRequestDuration.WithLabelValues(r.Method, path).Observe(duration)
	})
}

// MetricsHandler returns the Prometheus metrics handler
func MetricsHandler() http.Handler {
	return promhttp.Handler()
}

// Business metric helpers
func RecordPortCall(status, port string) {
	portCallsTotal.WithLabelValues(status, port).Inc()
}

func RecordServiceOrder(status, category string) {
	serviceOrdersTotal.WithLabelValues(status, category).Inc()
}

func RecordRFQ(status string) {
	rfqsTotal.WithLabelValues(status).Inc()
}

func SetActiveVessels(count int) {
	activeVessels.Set(float64(count))
}

func IncrementWebSocketConnections() {
	websocketConnections.Inc()
}

func DecrementWebSocketConnections() {
	websocketConnections.Dec()
}

// normalizePath reduces cardinality by removing IDs
func normalizePath(path string) string {
	// Simple normalization - in production use a proper router-aware solution
	// /port-calls/abc123 -> /port-calls/:id
	return path
}
