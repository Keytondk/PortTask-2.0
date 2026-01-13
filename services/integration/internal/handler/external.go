package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/navo/services/integration/internal/service"
	"go.uber.org/zap"
)

// ExternalHandler handles external API endpoints
type ExternalHandler struct {
	weather  *service.WeatherService
	exchange *service.ExchangeRateService
	logger   *zap.Logger
}

// NewExternalHandler creates a new external handler
func NewExternalHandler(weather *service.WeatherService, exchange *service.ExchangeRateService, logger *zap.Logger) *ExternalHandler {
	return &ExternalHandler{
		weather:  weather,
		exchange: exchange,
		logger:   logger,
	}
}

// RegisterRoutes registers external API routes
func (h *ExternalHandler) RegisterRoutes(r chi.Router) {
	// Weather endpoints
	r.Route("/weather", func(r chi.Router) {
		r.Get("/", h.GetWeather)
		r.Get("/forecast", h.GetForecast)
	})

	// Currency/Exchange endpoints
	r.Route("/currency", func(r chi.Router) {
		r.Get("/rates", h.GetExchangeRates)
		r.Get("/convert", h.ConvertCurrency)
		r.Get("/supported", h.GetSupportedCurrencies)
	})
}

// GetWeather retrieves weather for coordinates
func (h *ExternalHandler) GetWeather(w http.ResponseWriter, r *http.Request) {
	lat, err := strconv.ParseFloat(r.URL.Query().Get("lat"), 64)
	if err != nil {
		h.errorResponse(w, http.StatusBadRequest, "invalid latitude")
		return
	}

	lon, err := strconv.ParseFloat(r.URL.Query().Get("lon"), 64)
	if err != nil {
		h.errorResponse(w, http.StatusBadRequest, "invalid longitude")
		return
	}

	weather, err := h.weather.GetWeatherByCoordinates(r.Context(), lat, lon)
	if err != nil {
		h.logger.Error("Failed to get weather", zap.Error(err))
		h.errorResponse(w, http.StatusInternalServerError, "failed to get weather data")
		return
	}

	h.jsonResponse(w, http.StatusOK, weather)
}

// GetForecast retrieves weather forecast
func (h *ExternalHandler) GetForecast(w http.ResponseWriter, r *http.Request) {
	lat, err := strconv.ParseFloat(r.URL.Query().Get("lat"), 64)
	if err != nil {
		h.errorResponse(w, http.StatusBadRequest, "invalid latitude")
		return
	}

	lon, err := strconv.ParseFloat(r.URL.Query().Get("lon"), 64)
	if err != nil {
		h.errorResponse(w, http.StatusBadRequest, "invalid longitude")
		return
	}

	days := 5
	if d := r.URL.Query().Get("days"); d != "" {
		if parsed, err := strconv.Atoi(d); err == nil && parsed > 0 && parsed <= 7 {
			days = parsed
		}
	}

	forecast, err := h.weather.GetForecast(r.Context(), lat, lon, days)
	if err != nil {
		h.logger.Error("Failed to get forecast", zap.Error(err))
		h.errorResponse(w, http.StatusInternalServerError, "failed to get forecast data")
		return
	}

	h.jsonResponse(w, http.StatusOK, map[string]interface{}{
		"location": map[string]float64{"lat": lat, "lon": lon},
		"days":     days,
		"forecast": forecast,
	})
}

// GetExchangeRates retrieves current exchange rates
func (h *ExternalHandler) GetExchangeRates(w http.ResponseWriter, r *http.Request) {
	base := r.URL.Query().Get("base")
	if base == "" {
		base = "USD"
	}

	rates, err := h.exchange.GetRates(r.Context(), base)
	if err != nil {
		h.logger.Error("Failed to get exchange rates", zap.Error(err))
		h.errorResponse(w, http.StatusInternalServerError, "failed to get exchange rates")
		return
	}

	h.jsonResponse(w, http.StatusOK, rates)
}

// ConvertCurrency converts an amount between currencies
func (h *ExternalHandler) ConvertCurrency(w http.ResponseWriter, r *http.Request) {
	from := r.URL.Query().Get("from")
	to := r.URL.Query().Get("to")
	amountStr := r.URL.Query().Get("amount")

	if from == "" || to == "" || amountStr == "" {
		h.errorResponse(w, http.StatusBadRequest, "from, to, and amount parameters required")
		return
	}

	amount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil {
		h.errorResponse(w, http.StatusBadRequest, "invalid amount")
		return
	}

	result, err := h.exchange.Convert(r.Context(), from, to, amount)
	if err != nil {
		h.logger.Error("Failed to convert currency", zap.Error(err))
		h.errorResponse(w, http.StatusInternalServerError, "failed to convert currency")
		return
	}

	h.jsonResponse(w, http.StatusOK, result)
}

// GetSupportedCurrencies returns list of supported currencies
func (h *ExternalHandler) GetSupportedCurrencies(w http.ResponseWriter, r *http.Request) {
	currencies := h.exchange.GetSupportedCurrencies()
	h.jsonResponse(w, http.StatusOK, map[string]interface{}{
		"currencies": currencies,
	})
}

func (h *ExternalHandler) jsonResponse(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func (h *ExternalHandler) errorResponse(w http.ResponseWriter, status int, message string) {
	h.jsonResponse(w, status, map[string]string{"error": message})
}
