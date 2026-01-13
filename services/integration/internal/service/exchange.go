package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/navo/services/integration/internal/model"
	"go.uber.org/zap"
)

// ExchangeRateService provides currency exchange rate functionality
type ExchangeRateService struct {
	apiKey     string
	httpClient *http.Client
	logger     *zap.Logger
	cache      *exchangeRateCache
	mu         sync.RWMutex
}

type exchangeRateCache struct {
	rates     map[string]float64
	base      string
	updatedAt time.Time
}

// NewExchangeRateService creates a new exchange rate service
func NewExchangeRateService(apiKey string, logger *zap.Logger) *ExchangeRateService {
	return &ExchangeRateService{
		apiKey: apiKey,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		logger: logger,
		cache:  nil,
	}
}

// GetRates fetches current exchange rates
func (s *ExchangeRateService) GetRates(ctx context.Context, baseCurrency string) (*model.ExchangeRates, error) {
	s.mu.RLock()
	// Check cache (valid for 1 hour)
	if s.cache != nil && s.cache.base == baseCurrency && time.Since(s.cache.updatedAt) < time.Hour {
		s.mu.RUnlock()
		return &model.ExchangeRates{
			BaseCurrency: s.cache.base,
			Rates:        s.cache.rates,
			Timestamp:    s.cache.updatedAt,
		}, nil
	}
	s.mu.RUnlock()

	// If no API key, return mock rates
	if s.apiKey == "" {
		return s.getMockRates(baseCurrency), nil
	}

	// Call exchange rate API
	url := fmt.Sprintf("https://api.exchangerate-api.com/v4/latest/%s", baseCurrency)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		s.logger.Warn("Exchange rate API request failed, using mock data", zap.Error(err))
		return s.getMockRates(baseCurrency), nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		s.logger.Warn("Exchange rate API returned non-200 status", zap.Int("status", resp.StatusCode))
		return s.getMockRates(baseCurrency), nil
	}

	var apiResp exchangeRateAPIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	rates := &model.ExchangeRates{
		BaseCurrency: apiResp.Base,
		Rates:        apiResp.Rates,
		Timestamp:    time.Unix(apiResp.TimeLastUpdated, 0),
	}

	// Update cache
	s.mu.Lock()
	s.cache = &exchangeRateCache{
		rates:     rates.Rates,
		base:      rates.BaseCurrency,
		updatedAt: time.Now(),
	}
	s.mu.Unlock()

	return rates, nil
}

// Convert converts an amount from one currency to another
func (s *ExchangeRateService) Convert(ctx context.Context, from, to string, amount float64) (*model.CurrencyConversion, error) {
	rates, err := s.GetRates(ctx, from)
	if err != nil {
		return nil, err
	}

	rate, ok := rates.Rates[to]
	if !ok {
		return nil, fmt.Errorf("unknown currency: %s", to)
	}

	return &model.CurrencyConversion{
		FromCurrency: from,
		ToCurrency:   to,
		Amount:       amount,
		Result:       amount * rate,
		Rate:         rate,
		Timestamp:    time.Now().UTC(),
	}, nil
}

// GetRate gets the exchange rate between two currencies
func (s *ExchangeRateService) GetRate(ctx context.Context, from, to string) (float64, error) {
	rates, err := s.GetRates(ctx, from)
	if err != nil {
		return 0, err
	}

	rate, ok := rates.Rates[to]
	if !ok {
		return 0, fmt.Errorf("unknown currency: %s", to)
	}

	return rate, nil
}

// GetSupportedCurrencies returns list of supported currencies
func (s *ExchangeRateService) GetSupportedCurrencies() []string {
	return []string{
		"USD", "EUR", "GBP", "JPY", "CNY", "SGD", "AUD", "CAD", "CHF", "HKD",
		"NOK", "SEK", "DKK", "NZD", "MXN", "ZAR", "BRL", "INR", "RUB", "KRW",
		"AED", "SAR", "MYR", "THB", "IDR", "PHP", "VND", "PLN", "TRY", "CZK",
	}
}

// getMockRates returns mock exchange rates for development
func (s *ExchangeRateService) getMockRates(baseCurrency string) *model.ExchangeRates {
	// Mock rates based on USD
	usdRates := map[string]float64{
		"USD": 1.0,
		"EUR": 0.92,
		"GBP": 0.79,
		"JPY": 149.50,
		"CNY": 7.24,
		"SGD": 1.34,
		"AUD": 1.53,
		"CAD": 1.36,
		"CHF": 0.88,
		"HKD": 7.82,
		"NOK": 10.65,
		"SEK": 10.45,
		"DKK": 6.88,
		"NZD": 1.63,
		"MXN": 17.15,
		"ZAR": 18.75,
		"BRL": 4.97,
		"INR": 83.12,
		"AED": 3.67,
		"SAR": 3.75,
		"MYR": 4.72,
		"THB": 35.85,
	}

	// If base is not USD, convert all rates
	rates := make(map[string]float64)
	baseRate := usdRates[baseCurrency]
	if baseRate == 0 {
		baseRate = 1.0
	}

	for currency, rate := range usdRates {
		rates[currency] = rate / baseRate
	}

	return &model.ExchangeRates{
		BaseCurrency: baseCurrency,
		Rates:        rates,
		Timestamp:    time.Now().UTC(),
	}
}

type exchangeRateAPIResponse struct {
	Base            string             `json:"base"`
	Rates           map[string]float64 `json:"rates"`
	TimeLastUpdated int64              `json:"time_last_updated"`
}
