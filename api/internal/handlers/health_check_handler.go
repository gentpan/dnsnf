package handlers

import (
	"context"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"time"

	"giantaccel/internal/services"

	"github.com/miekg/dns"
)

const (
	healthCheckTimeout  = 5 * time.Second
	healthCheckCacheTTL = 3 * time.Minute
)

type healthCheck struct {
	ID     string
	Title  string
	Status string // pass, warn, fail, info
	Detail string
	Weight int
}

type HealthCheckHandler struct {
	cache    services.CacheStore
	dns      *dns.Client
	upstream string
}

func NewHealthCheckHandler(cache services.CacheStore, upstreams []string) *HealthCheckHandler {
	upstream := "1.1.1.1:53"
	if len(upstreams) > 0 && strings.TrimSpace(upstreams[0]) != "" {
		upstream = strings.TrimSpace(upstreams[0])
	}
	return &HealthCheckHandler{
		cache:    cache,
		dns:      &dns.Client{Timeout: healthCheckTimeout},
		upstream: upstream,
	}
}

// HealthCheck runs a delegation and configuration audit for a domain.
// GET /v1/dns/health-check?domain=example.com
func (h *HealthCheckHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"code": 405, "message": "method not allowed"})
		return
	}
	domain, ok := readDomainParam(w, r, "domain")
	if !ok {
		return
	}

	cacheKey := "health-check:" + domain
	var payload map[string]any
	if h.cache != nil && h.cache.Get(r.Context(), cacheKey, &payload) == nil {
		payload["cached"] = true
		writeJSON(w, http.StatusOK, payload)
		return
	}

	ctx := r.Context()
	checks := make([]healthCheck, 0, 12)

	// 1. NS records (parent view via recursive resolver).
	parentNS := h.nsRecords(ctx, domain, h.upstream, true)
	if len(parentNS) > 0 {
		checks = append(checks, healthCheck{"ns_exist", "Nameservers published", "pass", fmt.Sprintf("%d NS records: %s", len(parentNS), strings.Join(parentNS, ", ")), 15})
	} else {
		checks = append(checks, healthCheck{"ns_exist", "Nameservers published", "fail", "No NS records returned by recursive resolvers.", 15})
	}

	// 2. Delegation consistency: child zone NS vs parent NS.
	if len(parentNS) > 0 {
		childNS := h.childNSRecords(ctx, domain, parentNS)
		if len(childNS) == 0 {
			checks = append(checks, healthCheck{"ns_consistent", "Delegation consistency", "warn", "Authoritative nameservers did not return NS records for the zone.", 15})
		} else if sameStringSet(parentNS, childNS) {
			checks = append(checks, healthCheck{"ns_consistent", "Delegation consistency", "pass", "Parent and zone NS records match.", 15})
		} else {
			checks = append(checks, healthCheck{"ns_consistent", "Delegation consistency", "fail",
				fmt.Sprintf("Parent lists %v but zone lists %v.", parentNS, childNS), 15})
		}
	}

	// 3. Nameserver address resolution (glue/A).
	if len(parentNS) > 0 {
		missing := []string{}
		nsIPv4 := map[string]bool{}
		for _, ns := range parentNS {
			ips := h.aRecords(ctx, ns)
			if len(ips) == 0 {
				missing = append(missing, ns)
			}
			for _, ip := range ips {
				parts := strings.Split(ip, ".")
				if len(parts) == 4 {
					nsIPv4[parts[0]+"."+parts[1]+"."+parts[2]+".0/24"] = true
				}
			}
		}
		if len(missing) > 0 {
			checks = append(checks, healthCheck{"ns_glue", "Nameserver addresses", "fail", "No A records for: " + strings.Join(missing, ", "), 10})
		} else {
			checks = append(checks, healthCheck{"ns_glue", "Nameserver addresses", "pass", "All nameserver hostnames resolve.", 10})
		}
		// 4. NS diversity across subnets.
		if len(nsIPv4) >= 2 {
			checks = append(checks, healthCheck{"ns_diversity", "Nameserver diversity", "pass", fmt.Sprintf("Nameservers span %d IPv4 /24 networks.", len(nsIPv4)), 5})
		} else if len(parentNS) > 1 {
			checks = append(checks, healthCheck{"ns_diversity", "Nameserver diversity", "warn", "All nameservers appear to share one IPv4 /24 network.", 5})
		} else {
			checks = append(checks, healthCheck{"ns_diversity", "Nameserver diversity", "warn", "Only one nameserver is configured.", 5})
		}
	}

	// 5. SOA record.
	soa := h.soaRecord(ctx, domain)
	if soa == nil {
		checks = append(checks, healthCheck{"soa", "SOA record", "fail", "No SOA record returned.", 10})
	} else {
		detail := fmt.Sprintf("Primary NS %s, serial %d, refresh %ds, retry %ds, expire %ds, minimum TTL %ds.",
			soa.Ns, soa.Serial, soa.Refresh, soa.Retry, soa.Expire, soa.Minttl)
		status := "pass"
		if soa.Refresh >= soa.Expire {
			status = "warn"
			detail += " Refresh is not smaller than expire, which is unusual."
		}
		checks = append(checks, healthCheck{"soa", "SOA record", status, detail, 10})
	}

	// 6. Apex address records.
	apexA := h.aRecords(ctx, domain)
	apexAAAA := h.aaaaRecords(ctx, domain)
	switch {
	case len(apexA) > 0 && len(apexAAAA) > 0:
		checks = append(checks, healthCheck{"apex", "Apex address records", "pass", fmt.Sprintf("%d A and %d AAAA records.", len(apexA), len(apexAAAA)), 10})
	case len(apexA) > 0:
		checks = append(checks, healthCheck{"apex", "Apex address records", "pass", fmt.Sprintf("%d A records, no AAAA (IPv6 not published).", len(apexA)), 10})
	default:
		checks = append(checks, healthCheck{"apex", "Apex address records", "warn", "No A/AAAA records at the zone apex.", 10})
	}

	// 7. MX hosts resolve.
	mxHosts := h.mxRecords(ctx, domain)
	if len(mxHosts) == 0 {
		checks = append(checks, healthCheck{"mx", "Mail exchangers", "warn", "No MX records. The domain cannot receive email.", 10})
	} else {
		broken := []string{}
		for _, host := range mxHosts {
			if len(h.aRecords(ctx, host)) == 0 {
				broken = append(broken, host)
			}
		}
		if len(broken) > 0 {
			checks = append(checks, healthCheck{"mx", "Mail exchangers", "fail", "MX hosts without A records: " + strings.Join(broken, ", "), 10})
		} else {
			checks = append(checks, healthCheck{"mx", "Mail exchangers", "pass", fmt.Sprintf("%d MX hosts, all resolve.", len(mxHosts)), 10})
		}
	}

	// 8. DNSSEC.
	ds := h.countType(ctx, domain, dns.TypeDS)
	dnskey := h.countType(ctx, domain, dns.TypeDNSKEY)
	switch {
	case ds > 0 && dnskey > 0:
		checks = append(checks, healthCheck{"dnssec", "DNSSEC", "pass", fmt.Sprintf("%d DS and %d DNSKEY records.", ds, dnskey), 10})
	case ds == 0 && dnskey == 0:
		checks = append(checks, healthCheck{"dnssec", "DNSSEC", "warn", "DNSSEC is not enabled for this domain.", 10})
	default:
		checks = append(checks, healthCheck{"dnssec", "DNSSEC", "fail", fmt.Sprintf("Partial DNSSEC state: %d DS but %d DNSKEY records.", ds, dnskey), 10})
	}

	// 9. SPF.
	spfFound := false
	for _, txt := range h.txtValues(ctx, domain) {
		if strings.HasPrefix(txt, "v=spf1") {
			spfFound = true
		}
	}
	if spfFound {
		checks = append(checks, healthCheck{"spf", "SPF policy", "pass", "SPF record published.", 5})
	} else {
		checks = append(checks, healthCheck{"spf", "SPF policy", "warn", "No SPF record. Receivers cannot verify authorized senders.", 5})
	}

	// 10. DMARC.
	dmarcFound := false
	for _, txt := range h.txtValues(ctx, "_dmarc."+domain) {
		if strings.HasPrefix(txt, "v=DMARC1") {
			dmarcFound = true
		}
	}
	if dmarcFound {
		checks = append(checks, healthCheck{"dmarc", "DMARC policy", "pass", "DMARC record published.", 5})
	} else {
		checks = append(checks, healthCheck{"dmarc", "DMARC policy", "warn", "No DMARC record at _dmarc." + domain + ".", 5})
	}

	// 11. CAA.
	caa := h.countType(ctx, domain, dns.TypeCAA)
	if caa > 0 {
		checks = append(checks, healthCheck{"caa", "CAA policy", "pass", fmt.Sprintf("%d CAA records restrict certificate issuance.", caa), 5})
	} else {
		checks = append(checks, healthCheck{"caa", "CAA policy", "info", "No CAA records. Any public CA may issue certificates.", 5})
	}

	// 12. HTTPS service binding record.
	httpsCount := h.countType(ctx, domain, dns.TypeHTTPS)
	if httpsCount > 0 {
		checks = append(checks, healthCheck{"https_rr", "HTTPS record", "pass", fmt.Sprintf("%d HTTPS service binding records.", httpsCount), 5})
	} else {
		checks = append(checks, healthCheck{"https_rr", "HTTPS record", "info", "No HTTPS service binding record.", 5})
	}

	// Score: weighted pass ratio, warn counts half, info neutral.
	totalWeight := 0
	earned := 0
	passed, warned, failed := 0, 0, 0
	for _, check := range checks {
		totalWeight += check.Weight
		switch check.Status {
		case "pass":
			earned += check.Weight
			passed++
		case "warn":
			earned += check.Weight / 2
			warned++
		case "fail":
			failed++
		case "info":
			earned += check.Weight / 2
		}
	}
	score := 0
	if totalWeight > 0 {
		score = earned * 100 / totalWeight
	}
	status := "healthy"
	if failed > 0 || score < 50 {
		status = "critical"
	} else if warned > 0 || score < 85 {
		status = "warnings"
	}

	items := make([]map[string]any, 0, len(checks))
	for _, check := range checks {
		items = append(items, map[string]any{
			"id":     check.ID,
			"title":  check.Title,
			"status": check.Status,
			"detail": check.Detail,
		})
	}

	payload = map[string]any{
		"code": 0,
		"data": map[string]any{
			"domain": domain,
			"score":  score,
			"status": status,
			"passed": passed,
			"warned": warned,
			"failed": failed,
			"checks": items,
		},
		"cached":    false,
		"timestamp": time.Now().Unix(),
	}
	if h.cache != nil {
		_ = h.cache.Set(r.Context(), cacheKey, payload, healthCheckCacheTTL)
	}
	writeJSON(w, http.StatusOK, payload)
}

func (h *HealthCheckHandler) exchange(ctx context.Context, server, name string, qtype uint16, recursion bool) *dns.Msg {
	msg := new(dns.Msg)
	msg.SetQuestion(dns.Fqdn(name), qtype)
	msg.RecursionDesired = recursion
	resp, _, err := h.dns.ExchangeContext(ctx, msg, server)
	if err == nil && resp != nil && resp.Truncated && recursion {
		tcpClient := &dns.Client{Net: "tcp", Timeout: healthCheckTimeout}
		resp, _, err = tcpClient.ExchangeContext(ctx, msg, server)
	}
	if err != nil || resp == nil || resp.Rcode != dns.RcodeSuccess {
		return nil
	}
	return resp
}

func (h *HealthCheckHandler) nsRecords(ctx context.Context, domain, server string, recursion bool) []string {
	resp := h.exchange(ctx, server, domain, dns.TypeNS, recursion)
	out := []string{}
	if resp == nil {
		return out
	}
	for _, ans := range resp.Answer {
		if ns, ok := ans.(*dns.NS); ok {
			out = append(out, strings.ToLower(strings.TrimSuffix(ns.Ns, ".")))
		}
	}
	sort.Strings(out)
	return out
}

func (h *HealthCheckHandler) childNSRecords(ctx context.Context, domain string, parentNS []string) []string {
	for _, ns := range parentNS {
		ips := h.aRecords(ctx, ns)
		for _, ip := range ips {
			child := h.nsRecords(ctx, domain, ip+":53", false)
			if len(child) > 0 {
				return child
			}
		}
	}
	return []string{}
}

func (h *HealthCheckHandler) aRecords(ctx context.Context, name string) []string {
	resp := h.exchange(ctx, h.upstream, name, dns.TypeA, true)
	out := []string{}
	if resp == nil {
		return out
	}
	for _, ans := range resp.Answer {
		if a, ok := ans.(*dns.A); ok {
			out = append(out, a.A.String())
		}
	}
	return out
}

func (h *HealthCheckHandler) aaaaRecords(ctx context.Context, name string) []string {
	resp := h.exchange(ctx, h.upstream, name, dns.TypeAAAA, true)
	out := []string{}
	if resp == nil {
		return out
	}
	for _, ans := range resp.Answer {
		if aaaa, ok := ans.(*dns.AAAA); ok {
			out = append(out, aaaa.AAAA.String())
		}
	}
	return out
}

func (h *HealthCheckHandler) mxRecords(ctx context.Context, domain string) []string {
	resp := h.exchange(ctx, h.upstream, domain, dns.TypeMX, true)
	out := []string{}
	if resp == nil {
		return out
	}
	for _, ans := range resp.Answer {
		if mx, ok := ans.(*dns.MX); ok {
			host := strings.ToLower(strings.TrimSuffix(mx.Mx, "."))
			if host != "" {
				out = append(out, host)
			}
		}
	}
	return out
}

func (h *HealthCheckHandler) soaRecord(ctx context.Context, domain string) *dns.SOA {
	resp := h.exchange(ctx, h.upstream, domain, dns.TypeSOA, true)
	if resp == nil {
		return nil
	}
	for _, ans := range resp.Answer {
		if soa, ok := ans.(*dns.SOA); ok {
			return soa
		}
	}
	return nil
}

func (h *HealthCheckHandler) txtValues(ctx context.Context, name string) []string {
	resp := h.exchange(ctx, h.upstream, name, dns.TypeTXT, true)
	out := []string{}
	if resp == nil {
		return out
	}
	for _, ans := range resp.Answer {
		if txt, ok := ans.(*dns.TXT); ok {
			out = append(out, strings.Join(txt.Txt, ""))
		}
	}
	return out
}

func (h *HealthCheckHandler) countType(ctx context.Context, name string, qtype uint16) int {
	resp := h.exchange(ctx, h.upstream, name, qtype, true)
	if resp == nil {
		return 0
	}
	count := 0
	for _, ans := range resp.Answer {
		if ans.Header().Rrtype == qtype {
			count++
		}
	}
	return count
}

func sameStringSet(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	counts := map[string]int{}
	for _, item := range a {
		counts[item]++
	}
	for _, item := range b {
		counts[item]--
		if counts[item] < 0 {
			return false
		}
	}
	return true
}
