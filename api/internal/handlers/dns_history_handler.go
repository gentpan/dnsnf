package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"giantaccel/internal/models"
	"giantaccel/internal/repository"
)

type DnsHistoryHandler struct {
	repo          *repository.PostgresRepository
	internalToken string
}

func NewDnsHistoryHandler(repo *repository.PostgresRepository, token string) *DnsHistoryHandler {
	return &DnsHistoryHandler{repo: repo, internalToken: token}
}

func (h *DnsHistoryHandler) writeErr(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]any{"code": status, "message": msg})
}

// GET /api/v1/dns-history?domain=xxx[&limit=200]
func (h *DnsHistoryHandler) Get(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.writeErr(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	domain := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("domain")))
	if domain == "" {
		h.writeErr(w, http.StatusBadRequest, "domain is required")
		return
	}

	limit := 500
	if l := r.URL.Query().Get("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n > 0 && n <= 2000 {
			limit = n
		}
	}

	records, err := h.repo.GetDnsHistory(r.Context(), domain, limit)
	if err != nil {
		h.writeErr(w, http.StatusInternalServerError, "query failed")
		return
	}

	if records == nil {
		records = []models.DnsHistoryRecord{}
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"code": 0,
		"data": map[string]any{
			"domain":  domain,
			"total":   len(records),
			"records": records,
		},
		"timestamp": time.Now().Unix(),
	})
}

// POST /api/v1/dns-history  (internal — requires X-Internal-Token header)
func (h *DnsHistoryHandler) Upsert(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.writeErr(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	if h.internalToken != "" {
		tok := strings.TrimSpace(r.Header.Get("X-Internal-Token"))
		if tok != h.internalToken {
			h.writeErr(w, http.StatusForbidden, "forbidden")
			return
		}
	}

	var records []models.DnsHistoryRecord
	if err := json.NewDecoder(r.Body).Decode(&records); err != nil {
		h.writeErr(w, http.StatusBadRequest, "invalid body")
		return
	}
	if len(records) > 5000 {
		h.writeErr(w, http.StatusBadRequest, "too many records (max 5000)")
		return
	}

	if err := h.repo.UpsertDnsHistoryBatch(r.Context(), records); err != nil {
		h.writeErr(w, http.StatusInternalServerError, "upsert failed")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"code":     0,
		"inserted": len(records),
	})
}
