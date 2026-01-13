package handler

import (
	"io"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"

	"github.com/navo/pkg/logger"
	"github.com/navo/services/gateway/internal/config"
	"github.com/navo/services/gateway/internal/middleware"
	"go.uber.org/zap"
)

// createProxy creates a reverse proxy for a service
func createProxy(targetURL string) (*httputil.ReverseProxy, error) {
	target, err := url.Parse(targetURL)
	if err != nil {
		return nil, err
	}

	proxy := httputil.NewSingleHostReverseProxy(target)

	// Custom transport with timeouts
	proxy.Transport = &http.Transport{
		MaxIdleConns:        100,
		MaxIdleConnsPerHost: 100,
		IdleConnTimeout:     90 * time.Second,
	}

	// Custom error handler
	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		logger.Error("Proxy error",
			zap.Error(err),
			zap.String("target", targetURL),
			zap.String("path", r.URL.Path),
		)
		w.WriteHeader(http.StatusBadGateway)
		io.WriteString(w, `{"success":false,"error":{"code":"SERVICE_UNAVAILABLE","message":"Service temporarily unavailable"}}`)
	}

	// Modify request before forwarding
	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)

		// Forward user context headers
		if claims := middleware.GetClaims(req.Context()); claims != nil {
			req.Header.Set("X-User-ID", claims.UserID)
			req.Header.Set("X-Organization-ID", claims.OrganizationID)
			req.Header.Set("X-Portal-Type", claims.PortalType)
			req.Header.Set("X-User-Roles", strings.Join(claims.Roles, ","))
		}

		// Forward request ID
		if reqID := req.Header.Get("X-Request-ID"); reqID != "" {
			req.Header.Set("X-Request-ID", reqID)
		}
	}

	return proxy, nil
}

// ProxyAuth proxies requests to the auth service
func ProxyAuth(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		proxy, err := createProxy(cfg.AuthServiceURL)
		if err != nil {
			logger.Error("Failed to create auth proxy", zap.Error(err))
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
		proxy.ServeHTTP(w, r)
	}
}

// ProxyCore proxies requests to the core service
func ProxyCore(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		proxy, err := createProxy(cfg.CoreServiceURL)
		if err != nil {
			logger.Error("Failed to create core proxy", zap.Error(err))
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
		proxy.ServeHTTP(w, r)
	}
}

// ProxyVessel proxies requests to the vessel service
func ProxyVessel(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		proxy, err := createProxy(cfg.VesselServiceURL)
		if err != nil {
			logger.Error("Failed to create vessel proxy", zap.Error(err))
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
		proxy.ServeHTTP(w, r)
	}
}

// ProxyVendor proxies requests to the vendor service
func ProxyVendor(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		proxy, err := createProxy(cfg.VendorServiceURL)
		if err != nil {
			logger.Error("Failed to create vendor proxy", zap.Error(err))
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
		proxy.ServeHTTP(w, r)
	}
}

// ProxyRealtime proxies requests to the realtime service
func ProxyRealtime(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		proxy, err := createProxy(cfg.RealtimeServiceURL)
		if err != nil {
			logger.Error("Failed to create realtime proxy", zap.Error(err))
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
		proxy.ServeHTTP(w, r)
	}
}

// ProxyNotification proxies requests to the notification service
func ProxyNotification(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		proxy, err := createProxy(cfg.NotificationServiceURL)
		if err != nil {
			logger.Error("Failed to create notification proxy", zap.Error(err))
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
		proxy.ServeHTTP(w, r)
	}
}

// ProxyAnalytics proxies requests to the analytics service
func ProxyAnalytics(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		proxy, err := createProxy(cfg.AnalyticsServiceURL)
		if err != nil {
			logger.Error("Failed to create analytics proxy", zap.Error(err))
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
		proxy.ServeHTTP(w, r)
	}
}
