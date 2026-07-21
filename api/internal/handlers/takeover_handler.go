package handlers

import (
	"context"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"

	"giantaccel/internal/services"

	"github.com/miekg/dns"
)

const (
	takeoverTimeout    = 5 * time.Second
	takeoverCacheTTL   = 5 * time.Minute
	takeoverMaxTargets = 60
)

// takeoverFingerprints maps CNAME target suffixes to claimable hosting services.
var takeoverFingerprints = []struct {
	suffix  string
	service string
}{
	{"github.io", "GitHub Pages"},
	{"gitlab.io", "GitLab Pages"},
	{"bitbucket.io", "Bitbucket"},
	{"herokuapp.com", "Heroku"},
	{"herokudns.com", "Heroku"},
	{"s3.amazonaws.com", "AWS S3"},
	{"s3-website", "AWS S3 Website"},
	{"amazonaws.com", "AWS"},
	{"elasticbeanstalk.com", "AWS Elastic Beanstalk"},
	{"azurewebsites.net", "Azure Web Apps"},
	{"cloudapp.net", "Azure CloudApp"},
	{"trafficmanager.net", "Azure Traffic Manager"},
	{"blob.core.windows.net", "Azure Blob Storage"},
	{"firebaseapp.com", "Firebase"},
	{"web.app", "Firebase"},
	{"netlify.app", "Netlify"},
	{"netlify.com", "Netlify"},
	{"vercel.app", "Vercel"},
	{"now.sh", "Vercel"},
	{"surge.sh", "Surge"},
	{"fly.io", "Fly.io"},
	{"onrender.com", "Render"},
	{"railway.app", "Railway"},
	{"webflow.io", "Webflow"},
	{"wpenginepowered.com", "WP Engine"},
	{"myshopify.com", "Shopify"},
	{"tumblr.com", "Tumblr"},
	{"wordpress.com", "WordPress.com"},
	{"ghost.io", "Ghost"},
	{"readthedocs.io", "Read the Docs"},
	{"pythonanywhere.com", "PythonAnywhere"},
	{"unbouncepages.com", "Unbounce"},
	{"landingi.com", "Landingi"},
	{"fastly.net", "Fastly"},
	{"edgekey.net", "Akamai"},
	{"akamaiedge.net", "Akamai"},
	{"cloudfront.net", "CloudFront"},
}

type TakeoverHandler struct {
	cache     services.CacheStore
	discovery *DiscoveryHandler
	dns       *dns.Client
	upstream  string
}

func NewTakeoverHandler(cache services.CacheStore, discovery *DiscoveryHandler, upstreams []string) *TakeoverHandler {
	upstream := "1.1.1.1:53"
	if len(upstreams) > 0 && strings.TrimSpace(upstreams[0]) != "" {
		upstream = strings.TrimSpace(upstreams[0])
	}
	return &TakeoverHandler{
		cache:     cache,
		discovery: discovery,
		dns:       &dns.Client{Timeout: takeoverTimeout},
		upstream:  upstream,
	}
}

// Takeover scans discovered subdomains for dangling CNAME records pointing at
// claimable third-party hosting services.
// GET /v1/dns/takeover?domain=example.com
func (h *TakeoverHandler) Takeover(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"code": 405, "message": "method not allowed"})
		return
	}
	domain, ok := readDomainParam(w, r, "domain")
	if !ok {
		return
	}

	cacheKey := "takeover:" + domain
	var payload map[string]any
	if h.cache != nil && h.cache.Get(r.Context(), cacheKey, &payload) == nil {
		payload["cached"] = true
		writeJSON(w, http.StatusOK, payload)
		return
	}

	ctx := r.Context()
	subdomainSet := map[string]bool{}
	for _, fetch := range []func(context.Context, string) ([]string, error){
		h.discovery.queryCrtSH,
		h.discovery.queryHackerTargetSubdomains,
		h.discovery.queryRapidDNSSubdomains,
	} {
		if hosts, err := fetch(ctx, domain); err == nil {
			for _, host := range hosts {
				host = strings.ToLower(strings.TrimSuffix(strings.TrimSpace(host), "."))
				if host != "" && host != domain && strings.HasSuffix(host, "."+domain) && !strings.Contains(host, "*") {
					subdomainSet[host] = true
				}
			}
		}
	}
	subdomains := make([]string, 0, len(subdomainSet))
	for host := range subdomainSet {
		subdomains = append(subdomains, host)
	}
	sort.Strings(subdomains)
	if len(subdomains) > takeoverMaxTargets {
		subdomains = subdomains[:takeoverMaxTargets]
	}

	type finding struct {
		subdomain string
		cname     string
		service   string
		status    string // vulnerable, dangling, active
	}
	findings := make([]finding, 0)
	var mu sync.Mutex
	var wg sync.WaitGroup
	sem := make(chan struct{}, 8)
	for _, host := range subdomains {
		wg.Add(1)
		go func(host string) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()
			cname := h.cnameTarget(ctx, host)
			if cname == "" {
				return
			}
			service := matchFingerprint(cname)
			if service == "" {
				return
			}
			status := "active"
			if h.isNXDOMAIN(ctx, cname) {
				status = "vulnerable"
			} else if service == "AWS S3" || service == "AWS S3 Website" {
				status = "dangling"
			}
			mu.Lock()
			findings = append(findings, finding{subdomain: host, cname: cname, service: service, status: status})
			mu.Unlock()
		}(host)
	}
	wg.Wait()
	sort.Slice(findings, func(i, j int) bool { return findings[i].subdomain < findings[j].subdomain })

	vulnerable := 0
	items := make([]map[string]any, 0, len(findings))
	for _, f := range findings {
		if f.status == "vulnerable" {
			vulnerable++
		}
		items = append(items, map[string]any{
			"subdomain": f.subdomain,
			"cname":     f.cname,
			"service":   f.service,
			"status":    f.status,
		})
	}

	payload = map[string]any{
		"code": 0,
		"data": map[string]any{
			"domain":           domain,
			"subdomains_found": len(subdomainSet),
			"checked":          len(subdomains),
			"cname_targets":    len(findings),
			"vulnerable_count": vulnerable,
			"status":           map[bool]string{true: "attention", false: "clean"}[vulnerable > 0],
			"findings":         items,
			"note":             "Heuristic check based on public subdomain datasets and CNAME fingerprints. Verify manually before claiming any target.",
		},
		"cached":    false,
		"timestamp": time.Now().Unix(),
	}
	if h.cache != nil {
		_ = h.cache.Set(r.Context(), cacheKey, payload, takeoverCacheTTL)
	}
	writeJSON(w, http.StatusOK, payload)
}

func (h *TakeoverHandler) cnameTarget(ctx context.Context, host string) string {
	msg := new(dns.Msg)
	msg.SetQuestion(dns.Fqdn(host), dns.TypeCNAME)
	msg.RecursionDesired = true
	resp, _, err := h.dns.ExchangeContext(ctx, msg, h.upstream)
	if err != nil || resp == nil || resp.Rcode != dns.RcodeSuccess {
		return ""
	}
	for _, ans := range resp.Answer {
		if cname, ok := ans.(*dns.CNAME); ok {
			return strings.ToLower(strings.TrimSuffix(cname.Target, "."))
		}
	}
	return ""
}

func (h *TakeoverHandler) isNXDOMAIN(ctx context.Context, name string) bool {
	msg := new(dns.Msg)
	msg.SetQuestion(dns.Fqdn(name), dns.TypeA)
	msg.RecursionDesired = true
	resp, _, err := h.dns.ExchangeContext(ctx, msg, h.upstream)
	if err != nil || resp == nil {
		return false
	}
	return resp.Rcode == dns.RcodeNameError
}

func matchFingerprint(cname string) string {
	for _, fp := range takeoverFingerprints {
		if strings.HasSuffix(cname, fp.suffix) || strings.Contains(cname, "."+fp.suffix) {
			return fp.service
		}
	}
	return ""
}
