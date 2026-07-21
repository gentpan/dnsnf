package handlers

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"

	"giantaccel/internal/services"

	"github.com/miekg/dns"
)

const (
	ecsTimeout  = 5 * time.Second
	ecsCacheTTL = 2 * time.Minute
)

// ecsProbeSubnets are vantage-point subnets used when no subnet is supplied.
var ecsProbeSubnets = []struct {
	label  string
	subnet string
}{
	{"North America", "8.0.0.0/24"},
	{"Europe", "77.88.0.0/24"},
	{"East Asia", "101.226.0.0/24"},
	{"South America", "177.71.128.0/24"},
	{"Oceania", "203.33.0.0/24"},
	{"Middle East", "185.93.0.0/24"},
}

// ecsResolvers are recursive resolvers known to forward EDNS Client Subnet.
var ecsResolvers = []struct {
	name string
	addr string
}{
	{"Google", "8.8.8.8:53"},
	{"Quad9", "9.9.9.9:53"},
	{"Ali DNS", "223.5.5.5:53"},
}

type ECSHandler struct {
	cache services.CacheStore
	dns   *dns.Client
}

type ecsProbeResult struct {
	region       string
	subnet       string
	resolver     string
	status       string
	answers      []string
	echoed_scope int
	latency_ms   int64
}

func NewECSHandler(cache services.CacheStore) *ECSHandler {
	return &ECSHandler{
		cache: cache,
		dns:   &dns.Client{Timeout: ecsTimeout},
	}
}

// ECS probes how resolvers answer a query for different EDNS Client Subnets.
// GET /v1/dns/ecs?domain=example.com&subnet=8.0.0.0/24
func (h *ECSHandler) ECS(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"code": 405, "message": "method not allowed"})
		return
	}
	domain, ok := readDomainParam(w, r, "domain")
	if !ok {
		return
	}

	subnets := ecsProbeSubnets
	custom := strings.TrimSpace(r.URL.Query().Get("subnet"))
	if custom != "" {
		if _, _, err := net.ParseCIDR(custom); err != nil {
			if ip := net.ParseIP(custom); ip == nil {
				writeJSON(w, http.StatusBadRequest, map[string]any{"code": 400, "message": "invalid subnet, use CIDR like 8.8.8.0/24"})
				return
			} else {
				bits := 32
				if ip.To4() == nil {
					bits = 128
				}
				custom = fmt.Sprintf("%s/%d", custom, bits)
			}
		}
		subnets = []struct {
			label  string
			subnet string
		}{{"Custom", custom}}
	}

	cacheKey := fmt.Sprintf("ecs:%s:%s", domain, strings.ReplaceAll(fmt.Sprintf("%v", subnets), " ", ""))
	var payload map[string]any
	if h.cache != nil && h.cache.Get(r.Context(), cacheKey, &payload) == nil {
		payload["cached"] = true
		writeJSON(w, http.StatusOK, payload)
		return
	}

	type probe = ecsProbeResult
	jobs := len(subnets) * len(ecsResolvers)
	probes := make([]probe, 0, jobs)
	var mu sync.Mutex
	var wg sync.WaitGroup
	for _, subnet := range subnets {
		for _, resolver := range ecsResolvers {
			wg.Add(1)
			go func(subnet struct {
				label  string
				subnet string
			}, resolver struct {
				name string
				addr string
			}) {
				defer wg.Done()
				started := time.Now()
				answers, scope, status := h.queryECS(r.Context(), resolver.addr, domain, subnet.subnet)
				mu.Lock()
				probes = append(probes, probe{
					region:       subnet.label,
					subnet:       subnet.subnet,
					resolver:     resolver.name,
					status:       status,
					answers:      answers,
					echoed_scope: scope,
					latency_ms:   time.Since(started).Milliseconds(),
				})
				mu.Unlock()
			}(subnet, resolver)
		}
	}
	wg.Wait()
	sort.Slice(probes, func(i, j int) bool {
		if probes[i].region != probes[j].region {
			return probes[i].region < probes[j].region
		}
		return probes[i].resolver < probes[j].resolver
	})

	// Detect GeoDNS behaviour: distinct answer sets for the same resolver.
	setsByResolver := map[string]map[string]bool{}
	geoDNS := false
	for _, p := range probes {
		if p.status != "ok" {
			continue
		}
		key := strings.Join(p.answers, ",")
		if setsByResolver[p.resolver] == nil {
			setsByResolver[p.resolver] = map[string]bool{}
		}
		setsByResolver[p.resolver][key] = true
		if len(setsByResolver[p.resolver]) > 1 {
			geoDNS = true
		}
	}

	items := make([]map[string]any, 0, len(probes))
	for _, p := range probes {
		items = append(items, map[string]any{
			"region":       p.region,
			"subnet":       p.subnet,
			"resolver":     p.resolver,
			"status":       p.status,
			"answers":      p.answers,
			"echoed_scope": p.echoed_scope,
			"latency_ms":   p.latency_ms,
		})
	}

	payload = map[string]any{
		"code": 0,
		"data": map[string]any{
			"domain":      domain,
			"probes":      items,
			"geodns":      geoDNS,
			"ecs_honored": anyScopeEchoed(probes),
		},
		"cached":    false,
		"timestamp": time.Now().Unix(),
	}
	if h.cache != nil {
		_ = h.cache.Set(r.Context(), cacheKey, payload, ecsCacheTTL)
	}
	writeJSON(w, http.StatusOK, payload)
}

func anyScopeEchoed(probes []ecsProbeResult) bool {
	for _, p := range probes {
		if p.echoed_scope > 0 {
			return true
		}
	}
	return false
}

// queryECS sends an A query with an EDNS Client Subnet option and reports the
// answers plus the scope prefix the server echoed back.
func (h *ECSHandler) queryECS(ctx context.Context, server, domain, subnet string) ([]string, int, string) {
	ip, network, err := net.ParseCIDR(subnet)
	if err != nil {
		return nil, 0, "error"
	}
	ones, _ := network.Mask.Size()
	family := uint16(1)
	if ip.To4() == nil {
		family = 2
	}

	msg := new(dns.Msg)
	msg.SetQuestion(dns.Fqdn(domain), dns.TypeA)
	msg.RecursionDesired = true
	opt := &dns.OPT{Hdr: dns.RR_Header{Name: ".", Rrtype: dns.TypeOPT}}
	opt.SetUDPSize(1232)
	opt.Option = append(opt.Option, &dns.EDNS0_SUBNET{
		Code:          dns.EDNS0SUBNET,
		Family:        family,
		SourceNetmask: uint8(ones),
		SourceScope:   0,
		Address:       ip.Mask(network.Mask),
	})
	msg.Extra = append(msg.Extra, opt)

	resp, _, err := h.dns.ExchangeContext(ctx, msg, server)
	if err != nil || resp == nil {
		return nil, 0, "error"
	}
	scope := 0
	if extra := resp.IsEdns0(); extra != nil {
		for _, option := range extra.Option {
			if ecs, ok := option.(*dns.EDNS0_SUBNET); ok {
				scope = int(ecs.SourceScope)
			}
		}
	}
	answers := []string{}
	for _, ans := range resp.Answer {
		if a, ok := ans.(*dns.A); ok {
			answers = append(answers, a.A.String())
		}
	}
	sort.Strings(answers)
	switch {
	case resp.Rcode == dns.RcodeNameError:
		return answers, scope, "nxdomain"
	case resp.Rcode != dns.RcodeSuccess:
		return answers, scope, "error"
	case len(answers) == 0:
		return answers, scope, "no_data"
	default:
		return answers, scope, "ok"
	}
}
