package router

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-chi/httprate"
	"github.com/navo/pkg/response"
	"github.com/navo/services/gateway/internal/config"
	"github.com/navo/services/gateway/internal/handler"
	"github.com/navo/services/gateway/internal/middleware"
)

// Setup creates and configures the router
func Setup(cfg *config.Config) *chi.Mux {
	r := chi.NewRouter()

	// Global middleware
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Compress(5))

	// CORS
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Request-ID", "X-Workspace-ID"},
		ExposedHeaders:   []string{"Link", "X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Security headers (XSS, clickjacking, MIME sniffing protection)
	r.Use(middleware.SecurityHeaders)

	// Rate limiting
	r.Use(httprate.LimitByIP(100, time.Minute))

	// Health check (no auth required)
	r.Get("/health", handler.Health)
	r.Get("/ready", handler.Ready)

	// API v1 routes
	r.Route("/api/v1", func(r chi.Router) {
		// Public routes (no auth)
		r.Group(func(r chi.Router) {
			r.Post("/auth/login", handler.ProxyAuth(cfg))
			r.Post("/auth/register", handler.ProxyAuth(cfg))
			r.Post("/auth/forgot-password", handler.ProxyAuth(cfg))
			r.Post("/auth/reset-password", handler.ProxyAuth(cfg))
			r.Post("/auth/refresh", handler.ProxyAuth(cfg))
		})

		// Protected routes (auth required)
		r.Group(func(r chi.Router) {
			r.Use(middleware.Authenticate)

			// Auth routes
			r.Route("/auth", func(r chi.Router) {
				r.Get("/me", handler.ProxyAuth(cfg))
				r.Post("/logout", handler.ProxyAuth(cfg))
				r.Put("/profile", handler.ProxyAuth(cfg))
				r.Put("/password", handler.ProxyAuth(cfg))
			})

			// Workspaces
			r.Route("/workspaces", func(r chi.Router) {
				r.Get("/", handler.ProxyCore(cfg))
				r.Post("/", handler.ProxyCore(cfg))
				r.Get("/{id}", handler.ProxyCore(cfg))
				r.Put("/{id}", handler.ProxyCore(cfg))
				r.Delete("/{id}", handler.ProxyCore(cfg))
			})

			// Vessels
			r.Route("/vessels", func(r chi.Router) {
				r.Get("/", handler.ProxyVessel(cfg))
				r.Post("/", handler.ProxyVessel(cfg))
				r.Get("/{id}", handler.ProxyVessel(cfg))
				r.Put("/{id}", handler.ProxyVessel(cfg))
				r.Delete("/{id}", handler.ProxyVessel(cfg))
				r.Get("/{id}/position", handler.ProxyVessel(cfg))
				r.Get("/{id}/track", handler.ProxyVessel(cfg))
			})

			// Port Calls
			r.Route("/port-calls", func(r chi.Router) {
				r.Get("/", handler.ProxyCore(cfg))
				r.Post("/", handler.ProxyCore(cfg))
				r.Get("/{id}", handler.ProxyCore(cfg))
				r.Put("/{id}", handler.ProxyCore(cfg))
				r.Delete("/{id}", handler.ProxyCore(cfg))
				r.Get("/{id}/services", handler.ProxyCore(cfg))
				r.Post("/{id}/services", handler.ProxyCore(cfg))
				r.Get("/{id}/documents", handler.ProxyCore(cfg))
				r.Get("/{id}/timeline", handler.ProxyCore(cfg))
			})

			// Service Orders
			r.Route("/service-orders", func(r chi.Router) {
				r.Get("/", handler.ProxyCore(cfg))
				r.Post("/", handler.ProxyCore(cfg))
				r.Get("/{id}", handler.ProxyCore(cfg))
				r.Put("/{id}", handler.ProxyCore(cfg))
				r.Delete("/{id}", handler.ProxyCore(cfg))
				r.Post("/{id}/confirm", handler.ProxyCore(cfg))
				r.Post("/{id}/complete", handler.ProxyCore(cfg))
			})

			// RFQs
			r.Route("/rfqs", func(r chi.Router) {
				r.Get("/", handler.ProxyCore(cfg))
				r.Post("/", handler.ProxyCore(cfg))
				r.Get("/{id}", handler.ProxyCore(cfg))
				r.Put("/{id}", handler.ProxyCore(cfg))
				r.Delete("/{id}", handler.ProxyCore(cfg))
				r.Post("/{id}/send", handler.ProxyCore(cfg))
				r.Get("/{id}/quotes", handler.ProxyCore(cfg))
				r.Post("/{id}/quotes", handler.ProxyVendor(cfg)) // Vendor submits quote
				r.Post("/{id}/award/{quoteId}", handler.ProxyCore(cfg))
			})

			// Vendors
			r.Route("/vendors", func(r chi.Router) {
				r.Get("/", handler.ProxyVendor(cfg))
				r.Post("/", handler.ProxyVendor(cfg))
				r.Get("/{id}", handler.ProxyVendor(cfg))
				r.Put("/{id}", handler.ProxyVendor(cfg))
				r.Delete("/{id}", handler.ProxyVendor(cfg))
				r.Get("/{id}/performance", handler.ProxyVendor(cfg))
				r.Post("/{id}/verify", handler.ProxyVendor(cfg))
			})

			// Analytics
			r.Route("/analytics", func(r chi.Router) {
				r.Get("/overview", handler.ProxyAnalytics(cfg))
				r.Get("/sla", handler.ProxyAnalytics(cfg))
				r.Get("/vendor-performance", handler.ProxyAnalytics(cfg))
				r.Get("/vessel-performance", handler.ProxyAnalytics(cfg))
				r.Get("/cost-analysis", handler.ProxyAnalytics(cfg))
			})

			// Notifications
			r.Route("/notifications", func(r chi.Router) {
				r.Get("/", handler.ProxyNotification(cfg))
				r.Put("/{id}/read", handler.ProxyNotification(cfg))
				r.Post("/read-all", handler.ProxyNotification(cfg))
			})
		})
	})

	// 404 handler
	r.NotFound(func(w http.ResponseWriter, r *http.Request) {
		response.NotFound(w, "Route")
	})

	// 405 handler
	r.MethodNotAllowed(func(w http.ResponseWriter, r *http.Request) {
		response.BadRequest(w, "Method not allowed")
	})

	return r
}
