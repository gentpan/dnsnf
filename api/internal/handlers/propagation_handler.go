package handlers

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"

	"giantaccel/internal/services"

	"github.com/miekg/dns"
)

const (
	propagationTimeout  = 6 * time.Second
	propagationCacheTTL = 2 * time.Minute
)

// dohResolvers lists public DNS-over-HTTPS endpoints (wire format).
var dohResolvers = []struct {
	name   string
	region string
	url    string
}{
	{"Cloudflare", "Global / US", "https://cloudflare-dns.com/dns-query"},
	{"Google", "Global / US", "https://dns.google/dns-query"},
	{"Quad9", "Global / EU", "https://dns.quad9.net/dns-query"},
	{"AdGuard", "Global / EU", "https://dns.adguard-dns.com/dns-query"},
	{"Mullvad", "Europe", "https://doh.mullvad.net/dns-query"},
	{"DNS.SB", "Germany", "https://doh.dns.sb/dns-query"},
	{"Ali DNS", "China", "https://dns.alidns.com/dns-query"},
	{"DNSPod", "China", "https://doh.pub/dns-query"},
	{"360 DNS", "China", "https://doh.360.cn/dns-query"},
	{"Hurricane Electric", "US", "https://ordns.he.net/dns-query"},
	{"ControlD", "Global / CA", "https://freedns.controld.com/p0"},
}

// dohTypeCodes maps record type names to DNS type codes.
var dohTypeCodes = map[string]uint16{
	"A": dns.TypeA, "NS": dns.TypeNS, "CNAME": dns.TypeCNAME, "SOA": dns.TypeSOA,
	"PTR": dns.TypePTR, "MX": dns.TypeMX, "TXT": dns.TypeTXT, "AAAA": dns.TypeAAAA,
	"SRV": dns.TypeSRV, "DS": dns.TypeDS, "DNSKEY": dns.TypeDNSKEY, "NAPTR": dns.TypeNAPTR,
	"TLSA": dns.TypeTLSA, "SSHFP": dns.TypeSSHFP, "CAA": dns.TypeCAA,
	"SVCB": dns.TypeSVCB, "HTTPS": dns.TypeHTTPS,
}

type PropagationHandler struct {
	cache  services.CacheStore
	client *http.Client
}

func NewPropagationHandler(cache services.CacheStore) *PropagationHandler {
	return &PropagationHandler{
		cache:  cache,
		client: &http.Client{Timeout: propagationTimeout},
	}
}

// Propagation queries a record from public DoH resolvers worldwide.
// GET /v1/dns/propagation?domain=example.com&type=A
func (h *PropagationHandler) Propagation(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"code": 405, "message": "method not allowed"})
		return
	}
	domain, ok := readDomainParam(w, r, "domain")
	if !ok {
		return
	}
	recordType := strings.ToUpper(strings.TrimSpace(r.URL.Query().Get("type")))
	if recordType == "" {
		recordType = "A"
	}
	typeCode, supported := dohTypeCodes[recordType]
	if !supported {
		writeJSON(w, http.StatusBadRequest, map[string]any{"code": 400, "message": "unsupported record type"})
		return
	}

	cacheKey := fmt.Sprintf("propagation:%s:%s", domain, recordType)
	var payload map[string]any
	if h.cache != nil && h.cache.Get(r.Context(), cacheKey, &payload) == nil {
		payload["cached"] = true
		writeJSON(w, http.StatusOK, payload)
		return
	}

	type result struct {
		name      string
		region    string
		status    string
		answers   []string
		ttl       int
		latencyMs int64
	}
	results := make([]result, len(dohResolvers))
	var wg sync.WaitGroup
	for i, resolver := range dohResolvers {
		wg.Add(1)
		go func(i int, resolver struct {
			name   string
			region string
			url    string
		}) {
			defer wg.Done()
			started := time.Now()
			answers, ttl, status := h.queryDoH(r.Context(), resolver.url, domain, typeCode)
			results[i] = result{
				name:      resolver.name,
				region:    resolver.region,
				status:    status,
				answers:   answers,
				ttl:       ttl,
				latencyMs: time.Since(started).Milliseconds(),
			}
		}(i, resolver)
	}
	wg.Wait()

	// Consistency: compare normalized answer sets across successful resolvers.
	setCounts := map[string]int{}
	successful := 0
	for _, res := range results {
		if res.status != "ok" && res.status != "nxdomain" {
			continue
		}
		successful++
		normalized := append([]string{}, res.answers...)
		sort.Strings(normalized)
		key := fmt.Sprintf("%s|%v", res.status, normalized)
		setCounts[key]++
	}
	consistent := len(setCounts) <= 1 && successful > 0

	items := make([]map[string]any, 0, len(results))
	for _, res := range results {
		items = append(items, map[string]any{
			"resolver":   res.name,
			"region":     res.region,
			"status":     res.status,
			"answers":    res.answers,
			"ttl":        res.ttl,
			"latency_ms": res.latencyMs,
		})
	}

	payload = map[string]any{
		"code": 0,
		"data": map[string]any{
			"domain":          domain,
			"type":            recordType,
			"total_resolvers": len(results),
			"successful":      successful,
			"unique_sets":     len(setCounts),
			"consistent":      consistent,
			"results":         items,
		},
		"cached":    false,
		"timestamp": time.Now().Unix(),
	}
	if h.cache != nil {
		_ = h.cache.Set(r.Context(), cacheKey, payload, propagationCacheTTL)
	}
	writeJSON(w, http.StatusOK, payload)
}

// queryDoH sends a wire-format DNS message via DoH POST and parses answers.
func (h *PropagationHandler) queryDoH(ctx context.Context, endpoint, domain string, typeCode uint16) ([]string, int, string) {
	msg := new(dns.Msg)
	msg.SetQuestion(dns.Fqdn(domain), typeCode)
	msg.RecursionDesired = true
	packed, err := msg.Pack()
	if err != nil {
		return nil, 0, "error"
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(packed))
	if err != nil {
		return nil, 0, "error"
	}
	req.Header.Set("Content-Type", "application/dns-message")
	req.Header.Set("Accept", "application/dns-message")
	resp, err := h.client.Do(req)
	if err != nil {
		return nil, 0, "error"
	}
	defer func() { _ = resp.Body.Close() }()
	if resp.StatusCode != http.StatusOK {
		return nil, 0, "error"
	}
	buf, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, 0, "error"
	}
	reply := new(dns.Msg)
	if err := reply.Unpack(buf); err != nil {
		return nil, 0, "error"
	}
	answers := make([]string, 0, len(reply.Answer))
	minTTL := 0
	for _, ans := range reply.Answer {
		if ans.Header().Rrtype != typeCode {
			continue
		}
		answers = append(answers, normalizeRRData(ans))
		ttl := int(ans.Header().Ttl)
		if minTTL == 0 || ttl < minTTL {
			minTTL = ttl
		}
	}
	sort.Strings(answers)
	switch {
	case reply.Rcode == dns.RcodeNameError:
		return answers, minTTL, "nxdomain"
	case reply.Rcode != dns.RcodeSuccess:
		return answers, minTTL, "error"
	case len(answers) == 0:
		return answers, minTTL, "no_data"
	default:
		return answers, minTTL, "ok"
	}
}

// normalizeRRData renders an RR's rdata into a comparable lowercase string.
func normalizeRRData(rr dns.RR) string {
	line := rr.String()
	header := rr.Header().String()
	data := strings.TrimSpace(strings.TrimPrefix(line, header))
	data = strings.ReplaceAll(data, "\"", "")
	return strings.ToLower(strings.TrimSuffix(data, "."))
}
