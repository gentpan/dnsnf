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

type RdnsRecordHandler struct {
	repo          *repository.PostgresRepository
	internalToken string
}

func NewRdnsRecordHandler(repo *repository.PostgresRepository, token string) *RdnsRecordHandler {
	return &RdnsRecordHandler{repo: repo, internalToken: token}
}

func (h *RdnsRecordHandler) writeErr(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]any{"code": status, "message": msg})
}

// GET /api/v1/rdns-search?keyword=xxx&mode=left|middle|right&limit=200
func (h *RdnsRecordHandler) Search(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.writeErr(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	keyword := strings.TrimSpace(r.URL.Query().Get("keyword"))
	if keyword == "" {
		h.writeErr(w, http.StatusBadRequest, "keyword is required")
		return
	}
	if len(keyword) < 2 {
		h.writeErr(w, http.StatusBadRequest, "keyword too short (min 2 chars)")
		return
	}

	mode := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("mode")))
	if mode != "left" && mode != "right" {
		mode = "middle"
	}

	limit := 200
	if l := r.URL.Query().Get("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n > 0 && n <= 1000 {
			limit = n
		}
	}

	records, err := h.repo.SearchRdnsByPTR(r.Context(), keyword, mode, limit)
	if err != nil {
		h.writeErr(w, http.StatusInternalServerError, "search failed")
		return
	}
	if records == nil {
		records = []models.RdnsRecord{}
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"code": 0,
		"data": map[string]any{
			"keyword": keyword,
			"mode":    mode,
			"total":   len(records),
			"records": records,
		},
		"timestamp": time.Now().Unix(),
	})
}

type rdnsUpsertItem struct {
	IP  string `json:"ip"`
	PTR string `json:"ptr"`
}

// POST /api/v1/rdns-records  (internal — requires X-Internal-Token header)
func (h *RdnsRecordHandler) Upsert(w http.ResponseWriter, r *http.Request) {
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

	var items []rdnsUpsertItem
	if err := json.NewDecoder(r.Body).Decode(&items); err != nil {
		h.writeErr(w, http.StatusBadRequest, "invalid body")
		return
	}
	if len(items) > 5000 {
		h.writeErr(w, http.StatusBadRequest, "too many records (max 5000)")
		return
	}

	ips := make([]string, 0, len(items))
	ptrs := make([]string, 0, len(items))
	for _, item := range items {
		if item.IP == "" || item.PTR == "" {
			continue
		}
		ips = append(ips, item.IP)
		ptrs = append(ptrs, item.PTR)
	}

	if err := h.repo.UpsertRdnsRecordsBatch(r.Context(), ips, ptrs); err != nil {
		h.writeErr(w, http.StatusInternalServerError, "upsert failed")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"code":     0,
		"inserted": len(ips),
	})
}
