package handlers

import (
	"context"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"giantaccel/internal/services"

	"github.com/miekg/dns"
)

const (
	blacklistTimeout  = 3 * time.Second
	blacklistCacheTTL = 3 * time.Minute
)

// rblZones lists actively maintained IPv4 DNS blocklists.
var rblZones = []string{
	"zen.spamhaus.org",
	"bl.spamcop.net",
	"b.barracudacentral.org",
	"cbl.abuseat.org",
	"dnsbl.dronebl.org",
	"psbl.surriel.com",
	"ubl.unsubscore.com",
	"dyna.spamrats.com",
	"noptr.spamrats.com",
	"spam.spamrats.com",
	"dnsbl.sorbs.net",
	"ix.dnsbl.manitu.net",
	"bl.mailspike.net",
	"z.mailspike.net",
	"truncate.gbudb.net",
	"dnsbl-1.uceprotect.net",
	"dnsbl-2.uceprotect.net",
	"dnsbl-3.uceprotect.net",
	"db.wpbl.info",
	"rbl.interserver.net",
	"virbl.bit.nl",
	"dnsbl.cyberlogic.net",
	"dnsbl.kempt.net",
	"combined.abuse.ch",
	"ips.backscatterer.org",
}

type BlacklistHandler struct {
	cache    services.CacheStore
	dns      *dns.Client
	upstream string
}

func NewBlacklistHandler(cache services.CacheStore, upstreams []string) *BlacklistHandler {
	upstream := "1.1.1.1:53"
	if len(upstreams) > 0 && strings.TrimSpace(upstreams[0]) != "" {
		upstream = strings.TrimSpace(upstreams[0])
	}
	return &BlacklistHandler{
		cache:    cache,
		dns:      &dns.Client{Timeout: blacklistTimeout},
		upstream: upstream,
	}
}

// Blacklist checks an IPv4 address against public DNS blocklists.
// GET /v1/dns/blacklist?ip=1.2.3.4
func (h *BlacklistHandler) Blacklist(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"code": 405, "message": "method not allowed"})
		return
	}
	ip := strings.TrimSpace(r.URL.Query().Get("ip"))
	parsed := net.ParseIP(ip)
	if parsed == nil || parsed.To4() == nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"code": 400, "message": "blacklist check currently supports ipv4 only"})
		return
	}

	cacheKey := "blacklist:" + ip
	var payload map[string]any
	if h.cache != nil && h.cache.Get(r.Context(), cacheKey, &payload) == nil {
		payload["cached"] = true
		writeJSON(w, http.StatusOK, payload)
		return
	}

	octets := strings.Split(ip, ".")
	reversed := octets[3] + "." + octets[2] + "." + octets[1] + "." + octets[0]
	ctx := r.Context()

	type listing struct {
		zone string
		a    []string
		txt  []string
	}
	results := make([]listing, len(rblZones))
	var wg sync.WaitGroup
	for i, zone := range rblZones {
		wg.Add(1)
		go func(i int, zone string) {
			defer wg.Done()
			queryName := reversed + "." + zone
			aRows := h.query(ctx, queryName, dns.TypeA)
			if len(aRows) == 0 {
				return
			}
			txtRows := h.query(ctx, queryName, dns.TypeTXT)
			results[i] = listing{zone: zone, a: aRows, txt: txtRows}
		}(i, zone)
	}
	wg.Wait()

	listed := make([]map[string]any, 0)
	for i, result := range results {
		if result.zone == "" {
			continue
		}
		listed = append(listed, map[string]any{
			"zone":   rblZones[i],
			"a":      result.a,
			"reason": strings.Join(result.txt, " "),
		})
	}

	payload = map[string]any{
		"code": 0,
		"data": map[string]any{
			"ip":           ip,
			"total_lists":  len(rblZones),
			"listed_count": len(listed),
			"clean_count":  len(rblZones) - len(listed),
			"listed":       listed,
			"status":       blacklistStatus(len(listed)),
			"note":         "Listings are reported by public DNS blocklists and may have zone-specific meanings.",
		},
		"cached":    false,
		"timestamp": time.Now().Unix(),
	}
	if h.cache != nil {
		_ = h.cache.Set(r.Context(), cacheKey, payload, blacklistCacheTTL)
	}
	writeJSON(w, http.StatusOK, payload)
}

func (h *BlacklistHandler) query(ctx context.Context, name string, qtype uint16) []string {
	msg := new(dns.Msg)
	msg.SetQuestion(dns.Fqdn(name), qtype)
	msg.RecursionDesired = true
	resp, _, err := h.dns.ExchangeContext(ctx, msg, h.upstream)
	if err != nil || resp == nil || resp.Rcode != dns.RcodeSuccess {
		return []string{}
	}
	out := make([]string, 0, len(resp.Answer))
	for _, ans := range resp.Answer {
		switch rr := ans.(type) {
		case *dns.A:
			out = append(out, rr.A.String())
		case *dns.TXT:
			out = append(out, strings.Join(rr.Txt, ""))
		}
	}
	return out
}

func blacklistStatus(listed int) string {
	switch {
	case listed == 0:
		return "clean"
	case listed <= 2:
		return "attention"
	default:
		return "listed"
	}
}
