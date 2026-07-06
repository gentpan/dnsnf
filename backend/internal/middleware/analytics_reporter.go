package middleware

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net"
	"net/http"
	"strings"
	"time"
)

type AnalyticsReporter struct {
	endpoint string
	token    string
	client   *http.Client
}

func NewAnalyticsReporter(endpoint, token string) *AnalyticsReporter {
	return &AnalyticsReporter{
		endpoint: strings.TrimSpace(endpoint),
		token:    strings.TrimSpace(token),
		client:   &http.Client{Timeout: 1500 * time.Millisecond},
	}
}

func (ar *AnalyticsReporter) Handle(next http.Handler) http.Handler {
	if ar.endpoint == "" || ar.token == "" {
		return next
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		next.ServeHTTP(w, r)

		if r.Header.Get("X-Analytics-Skip") == "1" {
			return
		}

		method := strings.ToUpper(r.Method)
		if method != http.MethodGet && method != http.MethodHead {
			return
		}

		queries := 0
		if method == http.MethodGet && isAnalyticsQueryPath(r.URL.Path) {
			queries = 1
		}

		payload := analyticsPayload{
			Requests:      1,
			Queries:       queries,
			VisitClientIP: analyticsClientIP(r),
		}
		go ar.report(payload)
	})
}

type analyticsPayload struct {
	Requests      int    `json:"requests"`
	Queries       int    `json:"queries"`
	VisitClientIP string `json:"visitClientIp"`
}

func isAnalyticsQueryPath(path string) bool {
	switch path {
	case "/v1/dns/lookup", "/v1/dns/history", "/v1/dns/rdns":
		return true
	default:
		return false
	}
}

func analyticsClientIP(r *http.Request) string {
	if xff := strings.TrimSpace(r.Header.Get("X-Forwarded-For")); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}
	if xri := strings.TrimSpace(r.Header.Get("X-Real-IP")); xri != "" {
		return xri
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

func (ar *AnalyticsReporter) report(payload analyticsPayload) {
	body, err := json.Marshal(payload)
	if err != nil {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 1500*time.Millisecond)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, ar.endpoint, bytes.NewReader(body))
	if err != nil {
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Internal-Token", ar.token)

	resp, err := ar.client.Do(req)
	if err != nil {
		return
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, resp.Body)
}
