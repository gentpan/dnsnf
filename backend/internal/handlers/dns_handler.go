package handlers

import (
	"encoding/json"
	"net"
	"net/http"
	"strings"
	"time"

	"giantaccel/internal/models"
	"giantaccel/internal/services"
)

type DNSHandler struct {
	svc *services.Service
}

func NewDNSHandler(svc *services.Service) *DNSHandler {
	return &DNSHandler{svc: svc}
}

func (h *DNSHandler) Health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"status":    "ok",
		"timestamp": time.Now().Unix(),
	})
}

func (h *DNSHandler) LookupDNS(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	domain := strings.TrimSpace(r.URL.Query().Get("domain"))
	ip := strings.TrimSpace(r.URL.Query().Get("ip"))
	target := domain
	if target == "" {
		target = ip
	}
	if target == "" {
		writeError(w, http.StatusBadRequest, "domain or ip is required")
		return
	}

	recordType := strings.TrimSpace(r.URL.Query().Get("type"))
	clientIP := extractClientIP(r)

	resp, err := h.svc.Lookup(r.Context(), target, recordType, clientIP)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

func extractClientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}

	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, models.APIResponse{
		Code: status,
		Data: models.LookupData{
			Domain:     "",
			IP:         "",
			ReverseDNS: []string{},
			Records:    models.NewDNSRecords(),
		},
		Cached:    false,
		Timestamp: time.Now().Unix(),
		Message:   msg,
	})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
