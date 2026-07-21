package handlers

import (
	"context"
	"encoding/base64"
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"giantaccel/internal/services"

	"github.com/miekg/dns"
)

const (
	mailSecurityTimeout  = 5 * time.Second
	mailSecurityCacheTTL = 3 * time.Minute
	spfMaxDNSLookups     = 10
	spfMaxDepth          = 8
)

// commonDKIMSelectors are probed when no selector is supplied.
var commonDKIMSelectors = []string{
	"google", "selector1", "selector2", "default", "mail", "k1", "s1", "s2",
	"dkim", "smtp", "mailo", "mandrill", "ses", "cm", "protonmail", "20230601",
}

type MailSecurityHandler struct {
	cache    services.CacheStore
	dns      *dns.Client
	upstream string
}

func NewMailSecurityHandler(cache services.CacheStore, upstreams []string) *MailSecurityHandler {
	upstream := "1.1.1.1:53"
	if len(upstreams) > 0 && strings.TrimSpace(upstreams[0]) != "" {
		upstream = strings.TrimSpace(upstreams[0])
	}
	return &MailSecurityHandler{
		cache:    cache,
		dns:      &dns.Client{Timeout: mailSecurityTimeout},
		upstream: upstream,
	}
}

// MailSecurity inspects SPF, DKIM, DMARC, MTA-STS, TLS-RPT, and BIMI for a domain.
// GET /v1/dns/mail-security?domain=example.com&selector=google
func (h *MailSecurityHandler) MailSecurity(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"code": 405, "message": "method not allowed"})
		return
	}
	domain, ok := readDomainParam(w, r, "domain")
	if !ok {
		return
	}
	selector := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("selector")))

	cacheKey := "mail-security:" + domain + ":" + selector
	var payload map[string]any
	if h.cache != nil && h.cache.Get(r.Context(), cacheKey, &payload) == nil {
		payload["cached"] = true
		writeJSON(w, http.StatusOK, payload)
		return
	}

	spf := h.checkSPF(r.Context(), domain)
	dmarc := h.checkDMARC(r.Context(), domain)
	dkim := h.checkDKIM(r.Context(), domain, selector)
	mtaSTS := h.checkSimpleTXT(r.Context(), "_mta-sts."+domain, "v=STSv1")
	tlsRPT := h.checkSimpleTXT(r.Context(), "_smtp._tls."+domain, "v=TLSRPTv1")
	bimi := h.checkSimpleTXT(r.Context(), "default._bimi."+domain, "v=BIMI1")
	mx := h.queryTXTLike(r.Context(), domain, dns.TypeMX)

	score := 0
	if spf["found"] == true {
		qualifier, _ := spf["all_qualifier"].(string)
		switch {
		case strings.HasPrefix(qualifier, "-all"):
			score += 30
		case strings.HasPrefix(qualifier, "~all"):
			score += 25
		default:
			score += 15
		}
	}
	if dmarc["found"] == true {
		switch dmarc["policy"] {
		case "reject":
			score += 30
		case "quarantine":
			score += 25
		case "none":
			score += 10
		}
	}
	if dkim["found"] == true && dkim["revoked"] != true {
		score += 20
	}
	if mtaSTS["found"] == true {
		score += 10
	}
	if tlsRPT["found"] == true {
		score += 5
	}
	if bimi["found"] == true {
		score += 5
	}
	if score > 100 {
		score = 100
	}
	status := "weak"
	if score >= 70 {
		status = "strong"
	} else if score >= 40 {
		status = "partial"
	}

	payload = map[string]any{
		"code": 0,
		"data": map[string]any{
			"domain":  domain,
			"score":   score,
			"status":  status,
			"spf":     spf,
			"dmarc":   dmarc,
			"dkim":    dkim,
			"mta_sts": mtaSTS,
			"tls_rpt": tlsRPT,
			"bimi":    bimi,
			"mx":      mx,
		},
		"cached":    false,
		"timestamp": time.Now().Unix(),
	}
	if h.cache != nil {
		_ = h.cache.Set(r.Context(), cacheKey, payload, mailSecurityCacheTTL)
	}
	writeJSON(w, http.StatusOK, payload)
}

func (h *MailSecurityHandler) txtRecords(ctx context.Context, name string) []string {
	rows := h.queryTXTLike(ctx, name, dns.TypeTXT)
	return rows
}

func (h *MailSecurityHandler) queryTXTLike(ctx context.Context, name string, qtype uint16) []string {
	msg := new(dns.Msg)
	msg.SetQuestion(dns.Fqdn(name), qtype)
	msg.RecursionDesired = true
	resp, _, err := h.dns.ExchangeContext(ctx, msg, h.upstream)
	if err == nil && resp != nil && resp.Truncated {
		// Large TXT answer sets (e.g. google.com) exceed UDP; retry over TCP.
		tcpClient := &dns.Client{Net: "tcp", Timeout: mailSecurityTimeout}
		resp, _, err = tcpClient.ExchangeContext(ctx, msg, h.upstream)
	}
	if err != nil || resp == nil || resp.Rcode != dns.RcodeSuccess {
		return []string{}
	}
	out := make([]string, 0, len(resp.Answer))
	for _, ans := range resp.Answer {
		switch rr := ans.(type) {
		case *dns.TXT:
			out = append(out, strings.Join(rr.Txt, ""))
		case *dns.MX:
			out = append(out, fmt.Sprintf("%s (pref %d)", strings.TrimSuffix(rr.Mx, "."), rr.Preference))
		}
	}
	return out
}

func (h *MailSecurityHandler) checkSPF(ctx context.Context, domain string) map[string]any {
	records := h.txtRecords(ctx, domain)
	spfRecords := make([]string, 0, 1)
	for _, record := range records {
		if strings.HasPrefix(record, "v=spf1") {
			spfRecords = append(spfRecords, record)
		}
	}
	result := map[string]any{
		"found":           len(spfRecords) > 0,
		"record":          "",
		"all_qualifier":   "",
		"includes":        []string{},
		"ip4":             []string{},
		"ip6":             []string{},
		"dns_lookups":     0,
		"lookup_limit_ok": true,
		"warnings":        []string{},
	}
	warnings := []string{}
	if len(spfRecords) == 0 {
		warnings = append(warnings, "No SPF record published. Receivers cannot verify authorized senders.")
		result["warnings"] = warnings
		return result
	}
	if len(spfRecords) > 1 {
		warnings = append(warnings, "Multiple SPF records found. Exactly one v=spf1 record is allowed.")
	}
	record := spfRecords[0]
	result["record"] = record

	includes := []string{}
	ip4 := []string{}
	ip6 := []string{}
	lookups := 0
	visited := map[string]bool{}
	h.walkSPF(ctx, record, 0, visited, &lookups, &includes, &ip4, &ip6, &warnings, result)

	qualifier := ""
	redirectTarget := ""
	for _, token := range strings.Fields(record) {
		if strings.HasSuffix(token, "all") && (token == "all" || len(token) == 4) {
			qualifier = token
		}
		if strings.HasPrefix(token, "redirect=") {
			redirectTarget = strings.TrimPrefix(token, "redirect=")
		}
		if strings.HasPrefix(token, "ptr") || strings.Contains(token, ":ptr") {
			warnings = append(warnings, "The ptr mechanism is slow and discouraged by RFC 7208.")
		}
	}
	if qualifier == "" && redirectTarget != "" {
		// With redirect=, the "all" default comes from the redirected policy.
		for _, sub := range h.txtRecords(ctx, redirectTarget) {
			if !strings.HasPrefix(sub, "v=spf1") {
				continue
			}
			for _, token := range strings.Fields(sub) {
				if strings.HasSuffix(token, "all") && (token == "all" || len(token) == 4) {
					qualifier = token + " (via redirect)"
				}
			}
		}
	}
	if qualifier == "" {
		qualifier = "(none)"
		warnings = append(warnings, "No 'all' mechanism found. The policy falls through without a default.")
	} else if strings.HasPrefix(qualifier, "+all") || qualifier == "all" {
		warnings = append(warnings, "Policy allows any sender ("+qualifier+"). Use -all or ~all instead.")
	} else if qualifier == "?all" {
		warnings = append(warnings, "Neutral '?all' provides no spoofing protection.")
	}
	if lookups > spfMaxDNSLookups {
		warnings = append(warnings, fmt.Sprintf("SPF requires %d DNS lookups, exceeding the RFC 7208 limit of %d. Receivers may return PermError.", lookups, spfMaxDNSLookups))
	}

	sort.Strings(includes)
	result["includes"] = includes
	result["ip4"] = ip4
	result["ip6"] = ip6
	result["dns_lookups"] = lookups
	result["lookup_limit_ok"] = lookups <= spfMaxDNSLookups
	result["all_qualifier"] = qualifier
	result["warnings"] = warnings
	return result
}

func (h *MailSecurityHandler) walkSPF(ctx context.Context, record string, depth int, visited map[string]bool, lookups *int, includes, ip4, ip6 *[]string, warnings *[]string, result map[string]any) {
	if depth > spfMaxDepth {
		*warnings = append(*warnings, "SPF include chain is deeper than the evaluation limit.")
		return
	}
	for _, token := range strings.Fields(record) {
		token = strings.TrimSpace(token)
		mech := token
		if len(mech) > 0 && strings.ContainsRune("+~-?", rune(mech[0])) {
			mech = mech[1:]
		}
		switch {
		case strings.HasPrefix(mech, "include:"):
			target := strings.TrimPrefix(mech, "include:")
			*includes = append(*includes, target)
			*lookups++
			if visited[target] {
				continue
			}
			visited[target] = true
			for _, sub := range h.txtRecords(ctx, target) {
				if strings.HasPrefix(sub, "v=spf1") {
					h.walkSPF(ctx, sub, depth+1, visited, lookups, includes, ip4, ip6, warnings, result)
				}
			}
		case strings.HasPrefix(mech, "redirect="):
			target := strings.TrimPrefix(mech, "redirect=")
			*includes = append(*includes, "redirect:"+target)
			*lookups++
			if visited[target] {
				continue
			}
			visited[target] = true
			for _, sub := range h.txtRecords(ctx, target) {
				if strings.HasPrefix(sub, "v=spf1") {
					h.walkSPF(ctx, sub, depth+1, visited, lookups, includes, ip4, ip6, warnings, result)
				}
			}
		case strings.HasPrefix(mech, "ip4:"):
			*ip4 = append(*ip4, strings.TrimPrefix(mech, "ip4:"))
		case strings.HasPrefix(mech, "ip6:"):
			*ip6 = append(*ip6, strings.TrimPrefix(mech, "ip6:"))
		case mech == "a" || strings.HasPrefix(mech, "a:") || strings.HasPrefix(mech, "a/"):
			*lookups++
		case mech == "mx" || strings.HasPrefix(mech, "mx:") || strings.HasPrefix(mech, "mx/"):
			*lookups++
		case mech == "ptr" || strings.HasPrefix(mech, "ptr:"):
			*lookups++
		case strings.HasPrefix(mech, "exists:"):
			*lookups++
		}
	}
}

func (h *MailSecurityHandler) checkDMARC(ctx context.Context, domain string) map[string]any {
	records := h.txtRecords(ctx, "_dmarc."+domain)
	result := map[string]any{
		"found":            false,
		"record":           "",
		"policy":           "",
		"subdomain_policy": "",
		"pct":              100,
		"rua":              []string{},
		"ruf":              []string{},
		"adkim":            "r",
		"aspf":             "r",
		"warnings":         []string{},
	}
	warnings := []string{}
	for _, record := range records {
		if !strings.HasPrefix(record, "v=DMARC1") {
			continue
		}
		tags := parseTagValue(record)
		result["found"] = true
		result["record"] = record
		policy := strings.ToLower(tags["p"])
		result["policy"] = policy
		if sp := strings.ToLower(tags["sp"]); sp != "" {
			result["subdomain_policy"] = sp
		} else {
			result["subdomain_policy"] = policy
		}
		if pct, err := strconv.Atoi(tags["pct"]); err == nil {
			result["pct"] = pct
		}
		if tags["rua"] != "" {
			result["rua"] = strings.Split(tags["rua"], ",")
		}
		if tags["ruf"] != "" {
			result["ruf"] = strings.Split(tags["ruf"], ",")
		}
		if tags["adkim"] != "" {
			result["adkim"] = tags["adkim"]
		}
		if tags["aspf"] != "" {
			result["aspf"] = tags["aspf"]
		}
		switch policy {
		case "none":
			warnings = append(warnings, "DMARC policy is p=none (monitor only). Move to quarantine or reject for enforcement.")
		case "quarantine", "reject":
		default:
			warnings = append(warnings, "DMARC policy tag is missing or invalid.")
		}
		if pct, _ := result["pct"].(int); pct < 100 {
			warnings = append(warnings, fmt.Sprintf("DMARC applies to only %d%% of mail (pct=%d).", pct, pct))
		}
		break
	}
	if result["found"] != true {
		warnings = append(warnings, "No DMARC record at _dmarc."+domain+".")
	}
	result["warnings"] = warnings
	return result
}

func (h *MailSecurityHandler) checkDKIM(ctx context.Context, domain, selector string) map[string]any {
	result := map[string]any{
		"requested_selector": selector,
		"found":              false,
		"selector":           "",
		"record":             "",
		"key_type":           "rsa",
		"key_bytes":          0,
		"revoked":            false,
		"probed_selectors":   []string{},
		"warnings":           []string{},
	}
	candidates := []string{}
	if selector != "" {
		candidates = []string{selector}
	} else {
		candidates = commonDKIMSelectors
	}
	probed := []string{}
	for _, candidate := range candidates {
		name := candidate + "._domainkey." + domain
		probed = append(probed, candidate)
		for _, record := range h.txtRecords(ctx, name) {
			if !strings.Contains(record, "DKIM1") && !strings.Contains(record, "p=") {
				continue
			}
			tags := parseTagValue(record)
			result["found"] = true
			result["selector"] = candidate
			result["record"] = record
			if tags["k"] != "" {
				result["key_type"] = tags["k"]
			}
			pub := strings.TrimSpace(tags["p"])
			if pub == "" {
				result["revoked"] = true
				result["warnings"] = append(result["warnings"].([]string), "The public key is empty, meaning this DKIM key has been revoked.")
			} else if decoded, err := base64.StdEncoding.DecodeString(pub); err == nil {
				result["key_bytes"] = len(decoded)
			}
			if selector != "" {
				result["probed_selectors"] = []string{selector}
			} else {
				result["probed_selectors"] = probed
			}
			return result
		}
	}
	result["probed_selectors"] = probed
	warnings := result["warnings"].([]string)
	if selector != "" {
		warnings = append(warnings, "No DKIM record found for selector '"+selector+"'.")
	} else {
		warnings = append(warnings, "No DKIM record found for common selectors. Provide the selector used by your mail provider for a definitive check.")
	}
	result["warnings"] = warnings
	return result
}

func (h *MailSecurityHandler) checkSimpleTXT(ctx context.Context, name, prefix string) map[string]any {
	for _, record := range h.txtRecords(ctx, name) {
		if strings.HasPrefix(record, prefix) {
			return map[string]any{"found": true, "record": record, "name": name}
		}
	}
	return map[string]any{"found": false, "record": "", "name": name}
}

func parseTagValue(record string) map[string]string {
	tags := map[string]string{}
	for _, part := range strings.Split(record, ";") {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		key, value, found := strings.Cut(part, "=")
		if !found {
			continue
		}
		tags[strings.ToLower(strings.TrimSpace(key))] = strings.TrimSpace(value)
	}
	return tags
}
