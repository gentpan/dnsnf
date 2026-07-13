package services

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"giantaccel/internal/models"
)

func TestCloudflareGraphQLUsesBearerToken(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get("Authorization"); got != "Bearer scoped-token" {
			t.Errorf("Authorization header = %q", got)
		}
		if got := r.Header.Get("X-Auth-Key"); got != "" {
			t.Errorf("X-Auth-Key should be empty, got %q", got)
		}
		writeCloudflareTestResponse(t, w)
	}))
	defer server.Close()

	service := NewCloudflareAnalyticsService(CloudflareAnalyticsConfig{
		APIToken: "scoped-token",
		ZoneID:   "zone-id",
	}, nil, nil)
	service.graphqlEndpoint = server.URL

	var out trafficGraphQLResponse
	if err := service.graphql(context.Background(), "query { viewer { zones { zoneTag } } }", nil, &out); err != nil {
		t.Fatalf("graphql returned error: %v", err)
	}
}

func TestCloudflareGraphQLSupportsLegacyGlobalKey(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get("Authorization"); got != "" {
			t.Errorf("Authorization should be empty, got %q", got)
		}
		if got := r.Header.Get("X-Auth-Email"); got != "admin@example.com" {
			t.Errorf("X-Auth-Email header = %q", got)
		}
		if got := r.Header.Get("X-Auth-Key"); got != "global-key" {
			t.Errorf("X-Auth-Key header = %q", got)
		}
		writeCloudflareTestResponse(t, w)
	}))
	defer server.Close()

	service := NewCloudflareAnalyticsService(CloudflareAnalyticsConfig{
		Email:  "admin@example.com",
		APIKey: "global-key",
		ZoneID: "zone-id",
	}, nil, nil)
	service.graphqlEndpoint = server.URL

	var out trafficGraphQLResponse
	if err := service.graphql(context.Background(), "query { viewer { zones { zoneTag } } }", nil, &out); err != nil {
		t.Fatalf("graphql returned error: %v", err)
	}
}

func writeCloudflareTestResponse(t *testing.T, w http.ResponseWriter) {
	t.Helper()
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(map[string]any{
		"data": map[string]any{
			"viewer": map[string]any{
				"zones": []any{},
			},
		},
	}); err != nil {
		t.Errorf("encode response: %v", err)
	}
}

func TestInclusiveDayRangeStart(t *testing.T) {
	now := time.Date(2026, time.July, 13, 18, 0, 0, 0, time.UTC)

	if got, want := inclusiveDayRangeStart(now, 7), time.Date(2026, time.July, 7, 0, 0, 0, 0, time.UTC); !got.Equal(want) {
		t.Fatalf("7d start = %s, want %s", got, want)
	}
	if got, want := inclusiveDayRangeStart(now, 30), time.Date(2026, time.June, 14, 0, 0, 0, 0, time.UTC); !got.Equal(want) {
		t.Fatalf("30d start = %s, want %s", got, want)
	}
}

func TestTotalTrafficReconcilesCloudflareBackfills(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var request struct {
			Variables struct {
				Since string `json:"since"`
				Until string `json:"until"`
			} `json:"variables"`
		}
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			t.Fatalf("decode request: %v", err)
		}

		var requests, visitors int64
		switch {
		case request.Variables.Since == "2026-06-07" && request.Variables.Until == "2026-07-12":
			requests, visitors = 104734, 5649
		case request.Variables.Since == "2026-07-13" && request.Variables.Until == "2026-07-13":
			requests, visitors = 2317, 195
		default:
			t.Fatalf("unexpected range %s..%s", request.Variables.Since, request.Variables.Until)
		}

		if err := json.NewEncoder(w).Encode(map[string]any{
			"data": map[string]any{
				"viewer": map[string]any{
					"zones": []any{map[string]any{
						"httpRequests1dGroups": []any{map[string]any{
							"sum":  map[string]any{"requests": requests},
							"uniq": map[string]any{"uniques": visitors},
						}},
					}},
				},
			},
		}); err != nil {
			t.Fatalf("encode response: %v", err)
		}
	}))
	defer server.Close()

	started := time.Date(2026, time.June, 7, 0, 0, 0, 0, time.UTC)
	baseline := &recordingTrafficBaseline{
		cursor: models.TrafficStatsCursor{
			TotalRequests:    89533,
			TotalVisitors:    2351,
			TotalStartedDate: started,
			TotalThroughDate: time.Date(2026, time.July, 12, 0, 0, 0, 0, time.UTC),
			SeededFrom30D:    true,
		},
	}
	service := NewCloudflareAnalyticsService(CloudflareAnalyticsConfig{
		APIToken: "scoped-token",
		ZoneID:   "zone-id",
	}, nil, baseline)
	service.graphqlEndpoint = server.URL

	now := time.Date(2026, time.July, 13, 18, 0, 0, 0, time.UTC)
	stats, err := service.fetchTotalTrafficStats(context.Background(), now)
	if err != nil {
		t.Fatalf("fetch total traffic: %v", err)
	}
	if stats.Requests != 107051 {
		t.Fatalf("requests = %d, want 107051", stats.Requests)
	}
	if stats.Visitors != 5844 {
		t.Fatalf("visitors = %d, want 5844", stats.Visitors)
	}
	if baseline.totalRequests != 104734 || !baseline.totalStartedDate.Equal(started) {
		t.Fatalf("persisted baseline = requests:%d start:%s", baseline.totalRequests, baseline.totalStartedDate)
	}
}

type recordingTrafficBaseline struct {
	cursor           models.TrafficStatsCursor
	totalRequests    int64
	totalVisitors    int64
	totalStartedDate time.Time
	totalThroughDate time.Time
}

func (b *recordingTrafficBaseline) GetTrafficStatsCursor(context.Context) (models.TrafficStatsCursor, error) {
	return b.cursor, nil
}

func (b *recordingTrafficBaseline) UpdateTrafficStatsCursor(_ context.Context, _ time.Time, totalRequests int64, totalVisitors int64, totalStartedDate time.Time, totalThroughDate time.Time, _ bool) error {
	b.totalRequests = totalRequests
	b.totalVisitors = totalVisitors
	b.totalStartedDate = totalStartedDate
	b.totalThroughDate = totalThroughDate
	return nil
}
