package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"giantaccel/internal/repository"
	"giantaccel/internal/services"

	"github.com/miekg/dns"
)

const (
	discoveryTimeout       = 6 * time.Second
	discoveryCacheTTL      = 3 * time.Minute
	maxDiscoveryResults    = 500
	maxSharedLookupResults = 50
	maxCandidateScan       = 500
)

var (
	domainLabelRE = regexp.MustCompile(`(?i)^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$`)
	tldRE         = regexp.MustCompile(`(?i)^[a-z]{2,63}$`)
	htmlCellRE    = regexp.MustCompile(`(?is)<td[^>]*>\s*([^<]+?)\s*</td>`)
)

type DiscoveryHandler struct {
	cache    services.CacheStore
	repo     *repository.PostgresRepository
	client   *http.Client
	resolver *net.Resolver
	dns      *dns.Client
	upstream string
}

func NewDiscoveryHandler(cache services.CacheStore, repo *repository.PostgresRepository, upstreams []string) *DiscoveryHandler {
	upstream := "1.1.1.1:53"
	if len(upstreams) > 0 && strings.TrimSpace(upstreams[0]) != "" {
		upstream = strings.TrimSpace(upstreams[0])
	}
	return &DiscoveryHandler{
		cache:    cache,
		repo:     repo,
		client:   &http.Client{Timeout: discoveryTimeout},
		resolver: net.DefaultResolver,
		dns:      &dns.Client{Timeout: discoveryTimeout},
		upstream: upstream,
	}
}

func (h *DiscoveryHandler) ReverseIP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"code": 405, "message": "method not allowed"})
		return
	}
	ip := strings.TrimSpace(r.URL.Query().Get("ip"))
	parsed := net.ParseIP(ip)
	if parsed == nil || parsed.To4() == nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"code": 400, "message": "reverse ip lookup currently supports ipv4 only"})
		return
	}

	var payload map[string]any
	if h.getCache(r.Context(), "discovery:reverse-ip:"+ip, &payload) {
		payload["cached"] = true
		writeJSON(w, http.StatusOK, payload)
		return
	}

	type sourceRows struct {
		source  string
		domains []string
	}
	rows := make([]sourceRows, 0, 3)
	errors := make([]string, 0)
	if domains, err := h.queryHackerTargetReverseIP(r.Context(), ip); err == nil {
		rows = append(rows, sourceRows{"hackertarget", domains})
	} else {
		errors = append(errors, "hackertarget: "+err.Error())
	}
	if domains, err := h.queryYouGetSignal(r.Context(), ip); err == nil {
		rows = append(rows, sourceRows{"yougetsignal", domains})
	} else {
		errors = append(errors, "yougetsignal: "+err.Error())
	}
	if domains, err := h.queryRapidDNSReverseIP(r.Context(), ip); err == nil {
		rows = append(rows, sourceRows{"rapiddns", domains})
	} else {
		errors = append(errors, "rapiddns: "+err.Error())
	}

	merged := mergeNamedRows(rows, func(r sourceRows) []string { return r.domains }, func(r sourceRows) string { return r.source })
	payload = map[string]any{
		"code": 0,
		"data": map[string]any{
			"ip":           ip,
			"total":        len(merged),
			"domains":      merged,
			"sources":      sourceNames(rows, func(r sourceRows) string { return r.source }),
			"completeness": "best_effort_public_sources",
			"note":         "Results are from public datasets and may be incomplete.",
			"errors":       errors,
		},
		"cached":    false,
		"timestamp": time.Now().Unix(),
	}
	h.setCache(r.Context(), "discovery:reverse-ip:"+ip, payload)
	writeJSON(w, http.StatusOK, payload)
}

func (h *DiscoveryHandler) Subdomains(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"code": 405, "message": "method not allowed"})
		return
	}
	domain, ok := readDomainParam(w, r, "domain")
	if !ok {
		return
	}
	limit := readLimit(r, 200, maxDiscoveryResults)
	cacheKey := fmt.Sprintf("discovery:subdomains:%s:%d", domain, limit)
	var payload map[string]any
	if h.getCache(r.Context(), cacheKey, &payload) {
		payload["cached"] = true
		writeJSON(w, http.StatusOK, payload)
		return
	}

	type sourceRows struct {
		source string
		hosts  []string
	}
	rows := make([]sourceRows, 0, 3)
	errors := make([]string, 0)
	if hosts, err := h.queryCrtSH(r.Context(), domain); err == nil {
		rows = append(rows, sourceRows{"crtsh", hosts})
	} else {
		errors = append(errors, "crtsh: "+err.Error())
	}
	if hosts, err := h.queryHackerTargetSubdomains(r.Context(), domain); err == nil {
		rows = append(rows, sourceRows{"hackertarget", hosts})
	} else {
		errors = append(errors, "hackertarget: "+err.Error())
	}
	if hosts, err := h.queryRapidDNSSubdomains(r.Context(), domain); err == nil {
		rows = append(rows, sourceRows{"rapiddns", hosts})
	} else {
		errors = append(errors, "rapiddns: "+err.Error())
	}
	items := mergeNamedRows(rows, func(r sourceRows) []string { return r.hosts }, func(r sourceRows) string { return r.source })
	if len(items) > limit {
		items = items[:limit]
	}
	payload = map[string]any{
		"code": 0,
		"data": map[string]any{
			"target":  domain,
			"total":   len(items),
			"items":   items,
			"sources": sourceNames(rows, func(r sourceRows) string { return r.source }),
			"note":    "Best-effort subdomain discovery from public datasets.",
			"errors":  errors,
		},
		"cached":    false,
		"timestamp": time.Now().Unix(),
	}
	h.setCache(r.Context(), cacheKey, payload)
	writeJSON(w, http.StatusOK, payload)
}

func (h *DiscoveryHandler) ReverseNS(w http.ResponseWriter, r *http.Request) {
	h.sharedDNS(w, r, "NS")
}

func (h *DiscoveryHandler) ReverseMX(w http.ResponseWriter, r *http.Request) {
	h.sharedDNS(w, r, "MX")
}

func (h *DiscoveryHandler) DNSSEC(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"code": 405, "message": "method not allowed"})
		return
	}
	domain, ok := readDomainParam(w, r, "domain")
	if !ok {
		return
	}

	recordTypes := []uint16{dns.TypeDS, dns.TypeDNSKEY, dns.TypeRRSIG, dns.TypeNSEC}
	typeNames := []string{"DS", "DNSKEY", "RRSIG", "NSEC"}
	records := make(map[string]map[string]any, len(typeNames))
	score := 0
	for i, typ := range recordTypes {
		rows := h.queryDNSRaw(r.Context(), domain, typ)
		if len(rows) > 0 {
			switch typeNames[i] {
			case "DS", "DNSKEY", "RRSIG":
				score += 30
			case "NSEC":
				score += 10
			}
		}
		records[typeNames[i]] = map[string]any{
			"values":     rows,
			"confidence": confidence(rows),
			"sources":    []string{h.upstream},
		}
	}
	status := "weak"
	if score >= 70 {
		status = "strong"
	} else if score >= 40 {
		status = "partial"
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"code": 0,
		"data": map[string]any{
			"domain":  domain,
			"score":   score,
			"status":  status,
			"records": records,
		},
		"cached":    false,
		"timestamp": time.Now().Unix(),
	})
}

func (h *DiscoveryHandler) StatsOverview(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"code": 405, "message": "method not allowed"})
		return
	}
	stats, err := h.repo.GetStatsOverview(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"code": 500, "message": "stats failed"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"code":      0,
		"data":      stats,
		"cached":    false,
		"timestamp": time.Now().Unix(),
	})
}

func (h *DiscoveryHandler) sharedDNS(w http.ResponseWriter, r *http.Request, kind string) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"code": 405, "message": "method not allowed"})
		return
	}
	domain, ok := readDomainParam(w, r, "domain")
	if !ok {
		return
	}
	limit := readLimit(r, maxSharedLookupResults, maxSharedLookupResults)
	cacheKey := fmt.Sprintf("discovery:reverse-%s:%s:%d", strings.ToLower(kind), domain, limit)
	var payload map[string]any
	if h.getCache(r.Context(), cacheKey, &payload) {
		payload["cached"] = true
		writeJSON(w, http.StatusOK, payload)
		return
	}

	targetHosts, err := h.lookupHostsByKind(r.Context(), domain, kind)
	inputMode := "domain"
	if kind == "MX" && len(targetHosts) == 0 {
		inputMode = "mx_host"
		targetHosts = []string{domain}
	}
	if err != nil || len(targetHosts) == 0 {
		writeJSON(w, http.StatusNotFound, map[string]any{"code": 404, "message": "no " + strings.ToLower(kind) + " records found"})
		return
	}
	sourceIPs := h.lookupIPv4s(r.Context(), targetHosts)
	candidateSources := map[string]map[string]bool{}
	fetchErrors := []string{}
	for _, ip := range sourceIPs {
		domains, err := h.reverseIPDomains(r.Context(), ip)
		if err != nil {
			fetchErrors = append(fetchErrors, ip+": "+err.Error())
			continue
		}
		for _, candidate := range domains {
			if candidate == domain || !validDomain(candidate) {
				continue
			}
			if candidateSources[candidate] == nil {
				candidateSources[candidate] = map[string]bool{}
			}
			candidateSources[candidate][ip] = true
		}
	}

	candidates := sortedKeys(candidateSources)
	if len(candidates) > maxCandidateScan {
		candidates = candidates[:maxCandidateScan]
	}
	targetSet := boolSet(targetHosts)
	items := make([]map[string]any, 0)
	for _, candidate := range candidates {
		hosts, _ := h.lookupHostsByKind(r.Context(), candidate, kind)
		shared := intersection(hosts, targetSet)
		if len(shared) == 0 {
			continue
		}
		row := map[string]any{
			"domain":     candidate,
			"source_ips": sortedSet(candidateSources[candidate]),
		}
		if kind == "NS" {
			row["shared_ns"] = shared
		} else {
			row["shared_mx"] = shared
		}
		items = append(items, row)
		if len(items) >= limit {
			break
		}
	}

	data := map[string]any{
		"target":           domain,
		"source_ips":       sourceIPs,
		"total_candidates": len(candidateSources),
		"total_shared":     len(items),
		"items":            items,
		"errors":           fetchErrors,
	}
	if kind == "NS" {
		data["ns"] = targetHosts
		data["note"] = "Best-effort results using public reverse IP datasets and DNS NS verification."
	} else {
		data["mx"] = targetHosts
		data["input_mode"] = inputMode
		data["note"] = "Best-effort reverse search using public reverse IP datasets and DNS MX verification."
	}
	payload = map[string]any{
		"code":      0,
		"data":      data,
		"cached":    false,
		"timestamp": time.Now().Unix(),
	}
	h.setCache(r.Context(), cacheKey, payload)
	writeJSON(w, http.StatusOK, payload)
}

func (h *DiscoveryHandler) reverseIPDomains(ctx context.Context, ip string) ([]string, error) {
	var payload map[string]any
	if h.getCache(ctx, "discovery:reverse-ip:"+ip, &payload) {
		if data, ok := payload["data"].(map[string]any); ok {
			return domainRowsFromAny(data["domains"]), nil
		}
	}
	rows := [][]string{}
	if v, err := h.queryHackerTargetReverseIP(ctx, ip); err == nil {
		rows = append(rows, v)
	}
	if v, err := h.queryYouGetSignal(ctx, ip); err == nil {
		rows = append(rows, v)
	}
	if v, err := h.queryRapidDNSReverseIP(ctx, ip); err == nil {
		rows = append(rows, v)
	}
	out := uniqueStrings(flatten(rows))
	if len(out) == 0 {
		return nil, fmt.Errorf("no reverse-ip rows")
	}
	return out, nil
}

func (h *DiscoveryHandler) queryHackerTargetReverseIP(ctx context.Context, ip string) ([]string, error) {
	body, err := h.getText(ctx, "https://api.hackertarget.com/reverseiplookup/?q="+url.QueryEscape(ip), nil)
	if err != nil {
		return nil, err
	}
	return pickDomainsFromLines(body, ""), nil
}

func (h *DiscoveryHandler) queryRapidDNSReverseIP(ctx context.Context, ip string) ([]string, error) {
	body, err := h.getText(ctx, "https://rapiddns.io/sameip/"+url.PathEscape(ip)+"?full=1", browserHeaders())
	if err != nil {
		return nil, err
	}
	return pickDomainsFromHTML(body, ""), nil
}

func (h *DiscoveryHandler) queryYouGetSignal(ctx context.Context, ip string) ([]string, error) {
	form := url.Values{}
	form.Set("remoteAddress", ip)
	form.Set("key", "")
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://domains.yougetsignal.com/domains.php", strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("content-type", "application/x-www-form-urlencoded; charset=UTF-8")
	req.Header.Set("origin", "https://www.yougetsignal.com")
	req.Header.Set("referer", "https://www.yougetsignal.com/tools/web-sites-on-web-server/")
	for k, v := range browserHeaders() {
		req.Header.Set(k, v)
	}
	resp, err := h.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var data struct {
		Status      string     `json:"status"`
		Message     string     `json:"message"`
		DomainArray [][]string `json:"domainArray"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}
	if data.Status != "" && strings.ToLower(data.Status) != "success" {
		if data.Message != "" {
			return nil, errors.New(data.Message)
		}
		return nil, fmt.Errorf("provider status: %s", data.Status)
	}
	out := make([]string, 0, len(data.DomainArray))
	for _, row := range data.DomainArray {
		if len(row) > 0 {
			out = append(out, normalizeDomain(row[0]))
		}
	}
	return filterDomains(out, ""), nil
}

func (h *DiscoveryHandler) queryCrtSH(ctx context.Context, domain string) ([]string, error) {
	body, err := h.getText(ctx, "https://crt.sh/?q=%25."+url.QueryEscape(domain)+"&output=json", nil)
	if err != nil {
		return nil, err
	}
	var rows []struct {
		NameValue string `json:"name_value"`
	}
	if err := json.Unmarshal([]byte(body), &rows); err != nil {
		return nil, err
	}
	out := make([]string, 0)
	for _, row := range rows {
		for _, item := range strings.Fields(row.NameValue) {
			out = append(out, normalizeDomain(strings.TrimPrefix(item, "*.")))
		}
	}
	return filterDomains(out, domain), nil
}

func (h *DiscoveryHandler) queryHackerTargetSubdomains(ctx context.Context, domain string) ([]string, error) {
	body, err := h.getText(ctx, "https://api.hackertarget.com/hostsearch/?q="+url.QueryEscape(domain), nil)
	if err != nil {
		return nil, err
	}
	return pickDomainsFromLines(body, domain), nil
}

func (h *DiscoveryHandler) queryRapidDNSSubdomains(ctx context.Context, domain string) ([]string, error) {
	body, err := h.getText(ctx, "https://rapiddns.io/subdomain/"+url.PathEscape(domain)+"?full=1", browserHeaders())
	if err != nil {
		return nil, err
	}
	return pickDomainsFromHTML(body, domain), nil
}

func (h *DiscoveryHandler) lookupHostsByKind(ctx context.Context, domain, kind string) ([]string, error) {
	switch kind {
	case "NS":
		rows, err := h.resolver.LookupNS(ctx, domain)
		if err != nil {
			return nil, err
		}
		out := make([]string, 0, len(rows))
		for _, row := range rows {
			out = append(out, normalizeDomain(row.Host))
		}
		return uniqueStrings(out), nil
	case "MX":
		rows, err := h.resolver.LookupMX(ctx, domain)
		if err != nil {
			return nil, err
		}
		out := make([]string, 0, len(rows))
		for _, row := range rows {
			out = append(out, normalizeDomain(row.Host))
		}
		return uniqueStrings(out), nil
	default:
		return nil, fmt.Errorf("unsupported shared lookup")
	}
}

func (h *DiscoveryHandler) lookupIPv4s(ctx context.Context, hosts []string) []string {
	ips := make([]string, 0)
	for _, host := range hosts {
		rows, err := h.resolver.LookupIP(ctx, "ip4", host)
		if err != nil {
			continue
		}
		for _, row := range rows {
			if v4 := row.To4(); v4 != nil {
				ips = append(ips, v4.String())
			}
		}
	}
	return uniqueStrings(ips)
}

func (h *DiscoveryHandler) queryDNSRaw(ctx context.Context, domain string, typ uint16) []string {
	msg := new(dns.Msg)
	msg.SetQuestion(dns.Fqdn(domain), typ)
	msg.SetEdns0(4096, true)
	resp, _, err := h.dns.ExchangeContext(ctx, msg, h.upstream)
	if err != nil || resp == nil {
		return []string{}
	}
	out := make([]string, 0, len(resp.Answer))
	for _, ans := range resp.Answer {
		if ans.Header().Rrtype == typ {
			out = append(out, ans.String())
		}
	}
	return uniqueStrings(out)
}

func (h *DiscoveryHandler) getText(ctx context.Context, target string, headers map[string]string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, target, nil)
	if err != nil {
		return "", err
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	resp, err := h.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("provider status %d", resp.StatusCode)
	}
	b, err := io.ReadAll(io.LimitReader(resp.Body, 4<<20))
	if err != nil {
		return "", err
	}
	return string(b), nil
}

func (h *DiscoveryHandler) getCache(ctx context.Context, key string, out any) bool {
	if h.cache == nil {
		return false
	}
	return h.cache.Get(ctx, key, out) == nil
}

func (h *DiscoveryHandler) setCache(ctx context.Context, key string, payload any) {
	if h.cache == nil {
		return
	}
	_ = h.cache.Set(ctx, key, payload, discoveryCacheTTL)
}

func readDomainParam(w http.ResponseWriter, r *http.Request, name string) (string, bool) {
	domain := normalizeDomain(r.URL.Query().Get(name))
	if !validDomain(domain) {
		writeJSON(w, http.StatusBadRequest, map[string]any{"code": 400, "message": "invalid domain"})
		return "", false
	}
	return domain, true
}

func readLimit(r *http.Request, fallback, max int) int {
	limit := fallback
	if raw := r.URL.Query().Get("limit"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			limit = parsed
		}
	}
	if limit < 1 {
		return 1
	}
	if limit > max {
		return max
	}
	return limit
}

func normalizeDomain(value string) string {
	return strings.TrimSuffix(strings.ToLower(strings.TrimSpace(value)), ".")
}

func validDomain(domain string) bool {
	if domain == "" || len(domain) > 253 || !strings.Contains(domain, ".") {
		return false
	}
	parts := strings.Split(domain, ".")
	for i, part := range parts {
		if part == "" || len(part) > 63 {
			return false
		}
		if i == len(parts)-1 {
			if !tldRE.MatchString(part) {
				return false
			}
			continue
		}
		if !domainLabelRE.MatchString(part) {
			return false
		}
	}
	return true
}

func inRoot(host, root string) bool {
	return host == root || strings.HasSuffix(host, "."+root)
}

func pickDomainsFromLines(text, root string) []string {
	out := make([]string, 0)
	for _, line := range strings.Split(text, "\n") {
		cell := strings.TrimSpace(line)
		if strings.Contains(cell, ",") {
			cell = strings.Split(cell, ",")[0]
		}
		if fields := strings.Fields(cell); len(fields) > 0 {
			cell = fields[0]
		}
		out = append(out, normalizeDomain(strings.TrimPrefix(cell, "*.")))
	}
	return filterDomains(out, root)
}

func pickDomainsFromHTML(text, root string) []string {
	out := make([]string, 0)
	for _, match := range htmlCellRE.FindAllStringSubmatch(text, -1) {
		if len(match) > 1 {
			out = append(out, normalizeDomain(strings.TrimPrefix(match[1], "*.")))
		}
	}
	return filterDomains(out, root)
}

func filterDomains(values []string, root string) []string {
	out := make([]string, 0, len(values))
	for _, value := range values {
		value = normalizeDomain(value)
		if !validDomain(value) {
			continue
		}
		if root != "" && !inRoot(value, root) {
			continue
		}
		out = append(out, value)
	}
	return uniqueStrings(out)
}

func mergeNamedRows[T any](rows []T, values func(T) []string, source func(T) string) []map[string]any {
	bag := map[string]map[string]bool{}
	for _, row := range rows {
		src := source(row)
		for _, value := range values(row) {
			if !validDomain(value) {
				continue
			}
			if bag[value] == nil {
				bag[value] = map[string]bool{}
			}
			bag[value][src] = true
		}
	}
	keys := sortedKeys(bag)
	out := make([]map[string]any, 0, len(keys))
	for _, key := range keys {
		out = append(out, map[string]any{
			"domain":  key,
			"host":    key,
			"sources": sortedSet(bag[key]),
		})
	}
	return out
}

func sourceNames[T any](rows []T, source func(T) string) []string {
	out := make([]string, 0, len(rows))
	for _, row := range rows {
		out = append(out, source(row))
	}
	return uniqueStrings(out)
}

func domainRowsFromAny(value any) []string {
	rows, ok := value.([]any)
	if !ok {
		return []string{}
	}
	out := make([]string, 0, len(rows))
	for _, row := range rows {
		if obj, ok := row.(map[string]any); ok {
			if domain, ok := obj["domain"].(string); ok {
				out = append(out, domain)
			}
		}
	}
	return out
}

func browserHeaders() map[string]string {
	return map[string]string{
		"accept":     "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
		"user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
	}
}

func uniqueStrings(values []string) []string {
	seen := map[string]bool{}
	out := make([]string, 0, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value == "" || seen[value] {
			continue
		}
		seen[value] = true
		out = append(out, value)
	}
	sort.Strings(out)
	return out
}

func flatten(values [][]string) []string {
	out := make([]string, 0)
	for _, row := range values {
		out = append(out, row...)
	}
	return out
}

func boolSet(values []string) map[string]bool {
	out := map[string]bool{}
	for _, value := range values {
		out[value] = true
	}
	return out
}

func intersection(values []string, set map[string]bool) []string {
	out := make([]string, 0)
	for _, value := range values {
		if set[value] {
			out = append(out, value)
		}
	}
	return uniqueStrings(out)
}

func sortedSet(set map[string]bool) []string {
	out := make([]string, 0, len(set))
	for key := range set {
		out = append(out, key)
	}
	sort.Strings(out)
	return out
}

func sortedKeys[V any](m map[string]V) []string {
	out := make([]string, 0, len(m))
	for key := range m {
		out = append(out, key)
	}
	sort.Strings(out)
	return out
}

func confidence(rows []string) int {
	if len(rows) == 0 {
		return 0
	}
	return 100
}
