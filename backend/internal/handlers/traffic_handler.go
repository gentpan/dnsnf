package handlers

import (
	"net/http"
	"strings"
	"time"

	"giantaccel/internal/services"
)

type TrafficHandler struct {
	analytics *services.CloudflareAnalyticsService
}

func NewTrafficHandler(analytics *services.CloudflareAnalyticsService) *TrafficHandler {
	return &TrafficHandler{analytics: analytics}
}

func (h *TrafficHandler) Stats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"code": 405, "message": "method not allowed"})
		return
	}
	trafficRange := strings.TrimSpace(r.URL.Query().Get("range"))
	stats, err := h.analytics.TrafficStats(r.Context(), trafficRange)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]any{"code": 502, "message": "traffic stats unavailable"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"code":      0,
		"data":      stats,
		"cached":    false,
		"timestamp": time.Now().Unix(),
	})
}
