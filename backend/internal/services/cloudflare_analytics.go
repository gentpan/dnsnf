package services

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"giantaccel/internal/models"
)

type TrafficBaselineStore interface {
	GetTrafficStatsCursor(ctx context.Context) (models.TrafficStatsCursor, error)
	UpdateTrafficStatsCursor(ctx context.Context, checkedAt time.Time, totalRequests int64) error
}

type TrafficCache interface {
	Get(ctx context.Context, key string, out any) error
	Set(ctx context.Context, key string, payload any, ttl time.Duration) error
}

type CloudflareAnalyticsConfig struct {
	Email  string
	APIKey string
	ZoneID string
}

type CloudflareAnalyticsService struct {
	cfg        CloudflareAnalyticsConfig
	httpClient *http.Client
	cache      TrafficCache
	baseline   TrafficBaselineStore
}

func NewCloudflareAnalyticsService(cfg CloudflareAnalyticsConfig, cache TrafficCache, baseline TrafficBaselineStore) *CloudflareAnalyticsService {
	return &CloudflareAnalyticsService{
		cfg: cfg,
		httpClient: &http.Client{
			Timeout: 8 * time.Second,
		},
		cache:    cache,
		baseline: baseline,
	}
}

func (s *CloudflareAnalyticsService) TrafficStats(ctx context.Context, trafficRange string) (models.TrafficStats, error) {
	if trafficRange == "" {
		trafficRange = "24h"
	}
	if trafficRange != "24h" && trafficRange != "7d" && trafficRange != "30d" && trafficRange != "total" {
		return models.TrafficStats{}, fmt.Errorf("unsupported range: %s", trafficRange)
	}
	if s.cfg.Email == "" || s.cfg.APIKey == "" || s.cfg.ZoneID == "" {
		return models.TrafficStats{}, errors.New("cloudflare analytics is not configured")
	}

	cacheKey := "traffic:cloudflare:" + trafficRange
	var cached models.TrafficStats
	if s.cache != nil && s.cache.Get(ctx, cacheKey, &cached) == nil {
		return cached, nil
	}

	stats, err := s.fetchTrafficStats(ctx, trafficRange)
	if err != nil {
		return models.TrafficStats{}, err
	}
	if s.cache != nil {
		_ = s.cache.Set(ctx, cacheKey, stats, 5*time.Minute)
	}
	return stats, nil
}

func (s *CloudflareAnalyticsService) fetchTrafficStats(ctx context.Context, trafficRange string) (models.TrafficStats, error) {
	now := time.Now().UTC()
	if trafficRange == "24h" {
		since := now.Add(-23*time.Hour - 55*time.Minute)
		return s.queryHourly(ctx, trafficRange, since, now)
	}
	if trafficRange == "7d" || trafficRange == "30d" {
		days := 7
		if trafficRange == "30d" {
			days = 30
		}
		since := now.AddDate(0, 0, -days)
		return s.queryDaily(ctx, trafficRange, since, now, true)
	}

	if s.baseline == nil {
		return models.TrafficStats{}, errors.New("traffic baseline store is not configured")
	}
	cursor, err := s.baseline.GetTrafficStatsCursor(ctx)
	if err != nil {
		return models.TrafficStats{}, fmt.Errorf("get traffic baseline: %w", err)
	}
	if cursor.LastCheckedAt.After(now) {
		cursor.LastCheckedAt = now
	}
	delta, err := s.queryAdaptiveRequests(ctx, cursor.LastCheckedAt, now)
	if err != nil {
		return models.TrafficStats{}, err
	}
	total := cursor.TotalRequests + delta
	if err := s.baseline.UpdateTrafficStatsCursor(ctx, now, total); err != nil {
		return models.TrafficStats{}, fmt.Errorf("update traffic baseline: %w", err)
	}
	return models.TrafficStats{
		Range:     trafficRange,
		Requests:  total,
		UpdatedAt: now,
	}, nil
}

func (s *CloudflareAnalyticsService) queryAdaptiveRequests(ctx context.Context, since time.Time, now time.Time) (int64, error) {
	if !since.Before(now) {
		return 0, nil
	}
	const maxWindow = 23*time.Hour + 55*time.Minute
	var total int64
	windowStart := since
	for windowStart.Before(now) {
		windowEnd := windowStart.Add(maxWindow)
		if windowEnd.After(now) {
			windowEnd = now
		}
		count, err := s.queryAdaptiveWindow(ctx, windowStart, windowEnd)
		if err != nil {
			return 0, err
		}
		total += count
		windowStart = windowEnd
	}
	return total, nil
}

func (s *CloudflareAnalyticsService) queryAdaptiveWindow(ctx context.Context, since time.Time, until time.Time) (int64, error) {
	const query = `query($zoneTag: string!, $since: Time!, $until: Time!) {
  viewer {
    zones(filter: {zoneTag: $zoneTag}) {
      httpRequestsAdaptiveGroups(limit: 1, filter: {datetime_geq: $since, datetime_leq: $until}) {
        count
      }
    }
  }
}`
	var out trafficGraphQLResponse
	if err := s.graphql(ctx, query, map[string]any{
		"zoneTag": s.cfg.ZoneID,
		"since":   since.Format(time.RFC3339),
		"until":   until.Format(time.RFC3339),
	}, &out); err != nil {
		return 0, err
	}
	if len(out.Viewer.Zones) == 0 || len(out.Viewer.Zones[0].HTTPRequestsAdaptiveGroups) == 0 {
		return 0, nil
	}
	return out.Viewer.Zones[0].HTTPRequestsAdaptiveGroups[0].Count, nil
}

func (s *CloudflareAnalyticsService) queryHourly(ctx context.Context, trafficRange string, since time.Time, now time.Time) (models.TrafficStats, error) {
	const query = `query($zoneTag: string!, $since: Time!) {
  viewer {
    zones(filter: {zoneTag: $zoneTag}) {
      httpRequests1hGroups(limit: 100, filter: {datetime_geq: $since}) {
        sum { requests }
        uniq { uniques }
      }
    }
  }
}`
	var out trafficGraphQLResponse
	if err := s.graphql(ctx, query, map[string]any{
		"zoneTag": s.cfg.ZoneID,
		"since":   since.Format(time.RFC3339),
	}, &out); err != nil {
		return models.TrafficStats{}, err
	}
	return reduceTrafficGroups(trafficRange, now, out.Viewer.Zones, true), nil
}

func (s *CloudflareAnalyticsService) queryDaily(ctx context.Context, trafficRange string, since time.Time, now time.Time, includeVisitors bool) (models.TrafficStats, error) {
	const query = `query($zoneTag: string!, $since: Date!) {
  viewer {
    zones(filter: {zoneTag: $zoneTag}) {
      httpRequests1dGroups(limit: 40, filter: {date_geq: $since}) {
        sum { requests }
        uniq { uniques }
      }
    }
  }
}`
	var out trafficGraphQLResponse
	if err := s.graphql(ctx, query, map[string]any{
		"zoneTag": s.cfg.ZoneID,
		"since":   since.Format("2006-01-02"),
	}, &out); err != nil {
		return models.TrafficStats{}, err
	}
	return reduceTrafficGroups(trafficRange, now, out.Viewer.Zones, includeVisitors), nil
}

func (s *CloudflareAnalyticsService) graphql(ctx context.Context, query string, variables map[string]any, out any) error {
	payload, err := json.Marshal(map[string]any{
		"query":     query,
		"variables": variables,
	})
	if err != nil {
		return fmt.Errorf("marshal cloudflare query: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.cloudflare.com/client/v4/graphql", bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("create cloudflare request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Auth-Email", s.cfg.Email)
	req.Header.Set("X-Auth-Key", s.cfg.APIKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("cloudflare request failed: %w", err)
	}
	defer resp.Body.Close()

	var envelope cloudflareGraphQLEnvelope
	if err := json.NewDecoder(resp.Body).Decode(&envelope); err != nil {
		return fmt.Errorf("decode cloudflare response: %w", err)
	}
	if resp.StatusCode >= 400 {
		return fmt.Errorf("cloudflare returned status %d", resp.StatusCode)
	}
	if len(envelope.Errors) > 0 {
		return fmt.Errorf("cloudflare query failed: %s", envelope.Errors[0].Message)
	}
	if len(envelope.Data) == 0 {
		return errors.New("cloudflare returned empty analytics data")
	}
	if err := json.Unmarshal(envelope.Data, out); err != nil {
		return fmt.Errorf("decode cloudflare analytics data: %w", err)
	}
	return nil
}

func reduceTrafficGroups(trafficRange string, updatedAt time.Time, zones []trafficZone, includeVisitors bool) models.TrafficStats {
	stats := models.TrafficStats{
		Range:     trafficRange,
		UpdatedAt: updatedAt,
	}
	if len(zones) == 0 {
		return stats
	}
	for _, group := range zones[0].HTTPRequests1HGroups {
		stats.Requests += group.Sum.Requests
		if includeVisitors {
			stats.Visitors += group.Uniq.Uniques
		}
	}
	for _, group := range zones[0].HTTPRequests1DGroups {
		stats.Requests += group.Sum.Requests
		if includeVisitors {
			stats.Visitors += group.Uniq.Uniques
		}
	}
	return stats
}

type cloudflareGraphQLEnvelope struct {
	Data   json.RawMessage          `json:"data"`
	Errors []cloudflareGraphQLError `json:"errors"`
}

type cloudflareGraphQLError struct {
	Message string `json:"message"`
}

type trafficGraphQLResponse struct {
	Viewer struct {
		Zones []trafficZone `json:"zones"`
	} `json:"viewer"`
}

type trafficZone struct {
	HTTPRequestsAdaptiveGroups []trafficGroup `json:"httpRequestsAdaptiveGroups"`
	HTTPRequests1HGroups       []trafficGroup `json:"httpRequests1hGroups"`
	HTTPRequests1DGroups       []trafficGroup `json:"httpRequests1dGroups"`
}

type trafficGroup struct {
	Count int64 `json:"count"`
	Sum   struct {
		Requests int64 `json:"requests"`
	} `json:"sum"`
	Uniq struct {
		Uniques int64 `json:"uniques"`
	} `json:"uniq"`
}
