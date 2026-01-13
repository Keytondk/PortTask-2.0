package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/navo/services/integration/internal/model"
	"go.uber.org/zap"
)

// WeatherService provides weather data from external APIs
type WeatherService struct {
	apiKey     string
	baseURL    string
	httpClient *http.Client
	logger     *zap.Logger
	cache      map[string]*cachedWeather
}

type cachedWeather struct {
	data      *model.WeatherData
	expiresAt time.Time
}

// NewWeatherService creates a new weather service
func NewWeatherService(apiKey, baseURL string, logger *zap.Logger) *WeatherService {
	return &WeatherService{
		apiKey:  apiKey,
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		logger: logger,
		cache:  make(map[string]*cachedWeather),
	}
}

// GetWeatherByCoordinates fetches weather for a specific location
func (s *WeatherService) GetWeatherByCoordinates(ctx context.Context, lat, lon float64) (*model.WeatherData, error) {
	cacheKey := fmt.Sprintf("%.4f,%.4f", lat, lon)

	// Check cache
	if cached, ok := s.cache[cacheKey]; ok && time.Now().Before(cached.expiresAt) {
		return cached.data, nil
	}

	// If no API key, return mock data
	if s.apiKey == "" {
		return s.getMockWeather(lat, lon), nil
	}

	// Call OpenWeatherMap API
	url := fmt.Sprintf("%s/weather?lat=%.6f&lon=%.6f&appid=%s&units=metric",
		s.baseURL, lat, lon, s.apiKey)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		s.logger.Warn("Weather API request failed, using mock data",
			zap.Error(err),
			zap.Float64("lat", lat),
			zap.Float64("lon", lon),
		)
		return s.getMockWeather(lat, lon), nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		s.logger.Warn("Weather API returned non-200 status",
			zap.Int("status", resp.StatusCode),
		)
		return s.getMockWeather(lat, lon), nil
	}

	var owmResp openWeatherMapResponse
	if err := json.NewDecoder(resp.Body).Decode(&owmResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	weather := s.transformOWMResponse(&owmResp, lat, lon)

	// Cache for 10 minutes
	s.cache[cacheKey] = &cachedWeather{
		data:      weather,
		expiresAt: time.Now().Add(10 * time.Minute),
	}

	return weather, nil
}

// GetWeatherForPort fetches weather for a port
func (s *WeatherService) GetWeatherForPort(ctx context.Context, portID string, lat, lon float64) (*model.WeatherData, error) {
	weather, err := s.GetWeatherByCoordinates(ctx, lat, lon)
	if err != nil {
		return nil, err
	}
	weather.PortID = &portID
	return weather, nil
}

// GetForecast fetches weather forecast for a location
func (s *WeatherService) GetForecast(ctx context.Context, lat, lon float64, days int) ([]model.WeatherForecast, error) {
	if s.apiKey == "" {
		return s.getMockForecast(days), nil
	}

	url := fmt.Sprintf("%s/forecast?lat=%.6f&lon=%.6f&appid=%s&units=metric&cnt=%d",
		s.baseURL, lat, lon, s.apiKey, days*8) // 8 entries per day (3-hour intervals)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return s.getMockForecast(days), nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return s.getMockForecast(days), nil
	}

	var forecastResp openWeatherMapForecastResponse
	if err := json.NewDecoder(resp.Body).Decode(&forecastResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	forecasts := make([]model.WeatherForecast, 0, len(forecastResp.List))
	for _, item := range forecastResp.List {
		forecasts = append(forecasts, model.WeatherForecast{
			DateTime:      time.Unix(item.Dt, 0),
			Temperature:   item.Main.Temp,
			FeelsLike:     item.Main.FeelsLike,
			Humidity:      item.Main.Humidity,
			WindSpeed:     item.Wind.Speed,
			WindDirection: int(item.Wind.Deg),
			Precipitation: item.Pop * 100,
			Description:   item.Weather[0].Description,
			Icon:          item.Weather[0].Icon,
		})
	}

	return forecasts, nil
}

// getMockWeather returns mock weather data for development
func (s *WeatherService) getMockWeather(lat, lon float64) *model.WeatherData {
	now := time.Now().UTC()
	return &model.WeatherData{
		Latitude:     lat,
		Longitude:    lon,
		LocationName: fmt.Sprintf("Location %.2f, %.2f", lat, lon),
		Temperature:  22.5,
		FeelsLike:    23.0,
		Humidity:     65,
		Pressure:     1013,
		WindSpeed:    5.5,
		WindDirection: 180,
		Visibility:   10000,
		CloudCover:   40,
		Description:  "Partly cloudy",
		Icon:         "03d",
		RecordedAt:   now,
		SunriseAt:    now.Truncate(24 * time.Hour).Add(6 * time.Hour),
		SunsetAt:     now.Truncate(24 * time.Hour).Add(18 * time.Hour),
		FetchedAt:    now,
	}
}

// getMockForecast returns mock forecast data
func (s *WeatherService) getMockForecast(days int) []model.WeatherForecast {
	forecasts := make([]model.WeatherForecast, 0, days*8)
	now := time.Now().UTC()

	for i := 0; i < days*8; i++ {
		forecasts = append(forecasts, model.WeatherForecast{
			DateTime:      now.Add(time.Duration(i*3) * time.Hour),
			Temperature:   20.0 + float64(i%10),
			FeelsLike:     21.0 + float64(i%10),
			Humidity:      60 + i%20,
			WindSpeed:     4.0 + float64(i%5),
			WindDirection: (90 * i) % 360,
			Precipitation: float64(i % 30),
			Description:   "Partly cloudy",
			Icon:          "03d",
		})
	}

	return forecasts
}

func (s *WeatherService) transformOWMResponse(resp *openWeatherMapResponse, lat, lon float64) *model.WeatherData {
	now := time.Now().UTC()

	weather := &model.WeatherData{
		Latitude:      lat,
		Longitude:     lon,
		LocationName:  resp.Name,
		Temperature:   resp.Main.Temp,
		FeelsLike:     resp.Main.FeelsLike,
		Humidity:      resp.Main.Humidity,
		Pressure:      resp.Main.Pressure,
		WindSpeed:     resp.Wind.Speed,
		WindDirection: int(resp.Wind.Deg),
		Visibility:    resp.Visibility,
		CloudCover:    resp.Clouds.All,
		RecordedAt:    time.Unix(resp.Dt, 0),
		SunriseAt:     time.Unix(resp.Sys.Sunrise, 0),
		SunsetAt:      time.Unix(resp.Sys.Sunset, 0),
		FetchedAt:     now,
	}

	if len(resp.Weather) > 0 {
		weather.Description = resp.Weather[0].Description
		weather.Icon = resp.Weather[0].Icon
	}

	if resp.Wind.Gust > 0 {
		weather.WindGust = &resp.Wind.Gust
	}

	return weather
}

// OpenWeatherMap response structures
type openWeatherMapResponse struct {
	Coord struct {
		Lon float64 `json:"lon"`
		Lat float64 `json:"lat"`
	} `json:"coord"`
	Weather []struct {
		ID          int    `json:"id"`
		Main        string `json:"main"`
		Description string `json:"description"`
		Icon        string `json:"icon"`
	} `json:"weather"`
	Main struct {
		Temp      float64 `json:"temp"`
		FeelsLike float64 `json:"feels_like"`
		TempMin   float64 `json:"temp_min"`
		TempMax   float64 `json:"temp_max"`
		Pressure  int     `json:"pressure"`
		Humidity  int     `json:"humidity"`
	} `json:"main"`
	Visibility int `json:"visibility"`
	Wind       struct {
		Speed float64 `json:"speed"`
		Deg   float64 `json:"deg"`
		Gust  float64 `json:"gust"`
	} `json:"wind"`
	Clouds struct {
		All int `json:"all"`
	} `json:"clouds"`
	Dt   int64  `json:"dt"`
	Sys  struct {
		Country string `json:"country"`
		Sunrise int64  `json:"sunrise"`
		Sunset  int64  `json:"sunset"`
	} `json:"sys"`
	Name string `json:"name"`
}

type openWeatherMapForecastResponse struct {
	List []struct {
		Dt   int64 `json:"dt"`
		Main struct {
			Temp      float64 `json:"temp"`
			FeelsLike float64 `json:"feels_like"`
			Humidity  int     `json:"humidity"`
		} `json:"main"`
		Weather []struct {
			Description string `json:"description"`
			Icon        string `json:"icon"`
		} `json:"weather"`
		Wind struct {
			Speed float64 `json:"speed"`
			Deg   float64 `json:"deg"`
		} `json:"wind"`
		Pop float64 `json:"pop"` // Probability of precipitation
	} `json:"list"`
}
