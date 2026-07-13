package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/netip"
	"strings"
	"sync"
	"time"

	"giantaccel/internal/models"
	"giantaccel/internal/utils"

	"github.com/miekg/dns"
	"github.com/redis/go-redis/v9"
)

var ttlByType = map[string]time.Duration{
	"A":     time.Hour,
	"AAAA":  time.Hour,
	"CNAME": time.Hour,
	"MX":    12 * time.Hour,
	"NS":    24 * time.Hour,
	"TXT":   6 * time.Hour,
	"CAA":   12 * time.Hour,
	"SOA":   12 * time.Hour,
	"SRV":   12 * time.Hour,
	"RDNS":  24 * time.Hour,
}

const (
	maxCIDRScanAddresses = 4096
)

var errDomainNotFound = errors.New("domain not found")

type CacheStore interface {
	Get(ctx context.Context, key string, out any) error
	Set(ctx context.Context, key string, payload any, ttl time.Duration) error
}

type LogRepository interface {
	InsertDNSLog(ctx context.Context, domain, queryType, clientIP string) error
}

type BackupRepository interface {
	UpsertCacheBackup(ctx context.Context, domain, recordType string, responseJSON []byte) error
}

type DNSResolver interface {
	LookupA(ctx context.Context, domain string) ([]string, error)
	LookupAAAA(ctx context.Context, domain string) ([]string, error)
	LookupCNAME(ctx context.Context, domain string) ([]string, error)
	LookupMX(ctx context.Context, domain string) ([]models.MXRecord, error)
	LookupNS(ctx context.Context, domain string) ([]string, error)
	LookupTXT(ctx context.Context, domain string) ([]string, error)
	LookupCAA(ctx context.Context, domain string) ([]models.CAARecord, error)
	LookupSOA(ctx context.Context, domain string) (models.SOARecord, error)
	LookupSRV(ctx context.Context, domain string) ([]models.SRVRecord, error)
	LookupRDNS(ctx context.Context, ip string) ([]string, error)
}

type Service struct {
	cache           CacheStore
	logRepo         LogRepository
	backupRepo      BackupRepository
	resolver        DNSResolver
	resolvers       map[string]DNSResolver
	defaultResolver string
	logger          *slog.Logger
}

func NewDNSService(cache CacheStore, logRepo LogRepository, backupRepo BackupRepository, resolver DNSResolver, logger *slog.Logger) *Service {
	return &Service{
		cache:           cache,
		logRepo:         logRepo,
		backupRepo:      backupRepo,
		resolver:        resolver,
		resolvers:       map[string]DNSResolver{"cloudflare": resolver},
		defaultResolver: "cloudflare",
		logger:          logger,
	}
}

func (s *Service) SetResolvers(defaultResolver string, resolvers map[string]DNSResolver) {
	if len(resolvers) == 0 {
		return
	}
	s.resolvers = resolvers
	s.defaultResolver = normalizeResolverName(defaultResolver)
	if _, ok := s.resolvers[s.defaultResolver]; !ok {
		s.defaultResolver = "cloudflare"
	}
	if fallback, ok := s.resolvers[s.defaultResolver]; ok {
		s.resolver = fallback
	}
}

func (s *Service) Lookup(ctx context.Context, target, recordType, clientIP string) (models.APIResponse, error) {
	return s.LookupWithResolver(ctx, target, recordType, "", clientIP)
}

func (s *Service) LookupWithResolver(ctx context.Context, target, recordType, resolverName, clientIP string) (models.APIResponse, error) {
	target = strings.TrimSpace(target)
	if target == "" {
		return models.APIResponse{}, fmt.Errorf("domain or ip is required")
	}

	normalizedType, err := utils.NormalizeRecordType(recordType)
	if err != nil {
		return models.APIResponse{}, err
	}

	resolverName, resolver, err := s.selectResolver(resolverName)
	if err != nil {
		return models.APIResponse{}, err
	}

	if prefix, parseErr := netip.ParsePrefix(target); parseErr == nil {
		return s.lookupCIDR(ctx, prefix, normalizedType, resolverName, resolver, clientIP)
	}

	if ip := net.ParseIP(target); ip != nil {
		return s.lookupIP(ctx, ip.String(), normalizedType, resolverName, resolver, clientIP)
	}

	domain := utils.NormalizeDomain(target)
	if err := utils.ValidateDomain(domain); err != nil {
		return models.APIResponse{}, err
	}
	return s.lookupDomain(ctx, domain, normalizedType, resolverName, resolver, clientIP)
}

func (s *Service) selectResolver(name string) (string, DNSResolver, error) {
	normalized := normalizeResolverName(name)
	if normalized == "" {
		normalized = s.defaultResolver
	}
	resolver, ok := s.resolvers[normalized]
	if !ok {
		return "", nil, fmt.Errorf("unsupported resolver")
	}
	return normalized, resolver, nil
}

func normalizeResolverName(name string) string {
	return strings.ToLower(strings.TrimSpace(name))
}

func (s *Service) lookupDomain(ctx context.Context, domain, normalizedType, resolverName string, resolver DNSResolver, clientIP string) (models.APIResponse, error) {
	types := utils.AllRecordTypes()
	queryTypeForLog := "ALL"

	if normalizedType != "ALL" {
		if normalizedType == "RDNS" {
			return models.APIResponse{}, fmt.Errorf("rdns requires ip target")
		}
		types = []string{normalizedType}
		queryTypeForLog = normalizedType
	}

	records := models.NewDNSRecords()

	var (
		mu            sync.Mutex
		wg            sync.WaitGroup
		notFoundCount int
		allCached     = true
		firstErr      error
	)

	for _, t := range types {
		wg.Add(1)
		go func(t string) {
			defer wg.Done()
			key := fmt.Sprintf("dns:%s:%s:%s", resolverName, domain, t)
			local := models.NewDNSRecords()

			// Try Redis cache (no lock needed — each key is independent)
			if hit, cacheErr := s.tryCache(ctx, key, t, &local); cacheErr == nil && hit {
				mu.Lock()
				mergeRecord(t, &local, &records)
				mu.Unlock()
				return
			} else if cacheErr != nil && cacheErr != redis.Nil {
				s.logger.Warn("redis get failed", "error", cacheErr, "key", key)
			}

			// DNS resolution runs concurrently — no lock held during network I/O
			if resolveErr := s.resolveAndPopulate(ctx, resolver, domain, t, &local); resolveErr != nil {
				mu.Lock()
				if errors.Is(resolveErr, errDomainNotFound) {
					notFoundCount++
				} else if firstErr == nil {
					firstErr = resolveErr
				}
				allCached = false
				mu.Unlock()
				return
			}

			// Merge result into shared records (fast — no network I/O under lock)
			mu.Lock()
			mergeRecord(t, &local, &records)
			allCached = false
			mu.Unlock()

			// Write back to Redis and DB (no lock — independent per-key operations)
			if writeErr := s.writeBack(ctx, domain, t, key, &local); writeErr != nil {
				s.logger.Warn("cache write-back failed", "error", writeErr, "key", key)
			}
		}(t)
	}

	wg.Wait()

	if firstErr != nil {
		return models.APIResponse{}, firstErr
	}

	if normalizedType == "ALL" && notFoundCount == len(types) {
		return models.APIResponse{}, errDomainNotFound
	}

	if err := s.logRepo.InsertDNSLog(ctx, domain, queryTypeForLog, clientIP); err != nil {
		s.logger.Warn("failed to write dns log", "error", err)
	}

	return models.APIResponse{
		Code: 0,
		Data: models.LookupData{
			Domain:     domain,
			ReverseDNS: []string{},
			Records:    records,
		},
		Cached:    allCached,
		Timestamp: time.Now().Unix(),
	}, nil
}

// mergeRecord copies the single typed field from src into dst.
func mergeRecord(recordType string, src, dst *models.DNSRecords) {
	switch recordType {
	case "A":
		dst.A = src.A
	case "AAAA":
		dst.AAAA = src.AAAA
	case "CNAME":
		dst.CNAME = src.CNAME
	case "MX":
		dst.MX = src.MX
	case "NS":
		dst.NS = src.NS
	case "TXT":
		dst.TXT = src.TXT
	case "CAA":
		dst.CAA = src.CAA
	case "SOA":
		dst.SOA = src.SOA
	case "SRV":
		dst.SRV = src.SRV
	}
}

func (s *Service) lookupCIDR(ctx context.Context, prefix netip.Prefix, normalizedType, resolverName string, resolver DNSResolver, clientIP string) (models.APIResponse, error) {
	if normalizedType != "ALL" && normalizedType != "RDNS" {
		return models.APIResponse{}, fmt.Errorf("cidr target supports only RDNS or ALL")
	}
	if !prefix.Addr().Is4() {
		return models.APIResponse{}, fmt.Errorf("cidr rdns scan currently supports ipv4 only")
	}

	prefix = prefix.Masked()
	hostBits := 32 - prefix.Bits()
	total := uint64(1) << hostBits
	if total > maxCIDRScanAddresses {
		return models.APIResponse{}, fmt.Errorf("cidr range too large, maximum %d addresses", maxCIDRScanAddresses)
	}

	first := ip4ToUint32(prefix.Addr())
	last := first + uint32(total) - 1
	start := first
	end := last
	if prefix.Bits() <= 30 {
		start = first + 1
		end = last - 1
	}
	if start > end {
		start = first
		end = last
	}

	allCached := true
	failedLookups := 0
	reverseHosts := make([]string, 0)

	for current := start; ; current++ {
		ip := uint32ToIP4(current).String()
		hosts, cached, err := s.lookupIPRDNSWithCache(ctx, ip, resolverName, resolver)
		if err != nil {
			failedLookups++
			allCached = false
			s.logger.Warn("rdns lookup failed during cidr scan", "ip", ip, "error", err)
			if current == end {
				break
			}
			continue
		}
		if !cached {
			allCached = false
		}
		if len(hosts) > 0 {
			reverseHosts = append(reverseHosts, fmt.Sprintf("%s %s", ip, strings.Join(hosts, ", ")))
		}
		if current == end {
			break
		}
	}

	if err := s.logRepo.InsertDNSLog(ctx, prefix.String(), "RDNS", clientIP); err != nil {
		s.logger.Warn("failed to write dns log", "error", err)
	}

	return models.APIResponse{
		Code: 0,
		Data: models.LookupData{
			IP:         prefix.String(),
			ReverseDNS: reverseHosts,
			Records:    models.NewDNSRecords(),
		},
		Cached:    allCached && failedLookups == 0,
		Timestamp: time.Now().Unix(),
	}, nil
}

func (s *Service) lookupIP(ctx context.Context, ip, normalizedType, resolverName string, resolver DNSResolver, clientIP string) (models.APIResponse, error) {
	if normalizedType != "ALL" && normalizedType != "RDNS" {
		return models.APIResponse{}, fmt.Errorf("ip target supports only RDNS or ALL")
	}

	reverseHosts, cached, err := s.lookupIPRDNSWithCache(ctx, ip, resolverName, resolver)
	if err != nil {
		return models.APIResponse{}, fmt.Errorf("lookup rdns failed: %w", err)
	}

	if err := s.logRepo.InsertDNSLog(ctx, ip, "RDNS", clientIP); err != nil {
		s.logger.Warn("failed to write dns log", "error", err)
	}

	return models.APIResponse{
		Code: 0,
		Data: models.LookupData{
			IP:         ip,
			ReverseDNS: reverseHosts,
			Records:    models.NewDNSRecords(),
		},
		Cached:    cached,
		Timestamp: time.Now().Unix(),
	}, nil
}

func (s *Service) lookupIPRDNSWithCache(ctx context.Context, ip, resolverName string, resolver DNSResolver) ([]string, bool, error) {
	cacheKey := fmt.Sprintf("dns:%s:%s:RDNS", resolverName, ip)
	reverseHosts := make([]string, 0)

	if err := s.cache.Get(ctx, cacheKey, &reverseHosts); err == nil {
		return reverseHosts, true, nil
	} else if err != redis.Nil {
		s.logger.Warn("redis get failed", "error", err, "key", cacheKey)
	}

	resolvedHosts, err := resolver.LookupRDNS(ctx, ip)
	if err != nil {
		return nil, false, err
	}

	if err := s.cache.Set(ctx, cacheKey, resolvedHosts, ttlByType["RDNS"]); err != nil {
		s.logger.Warn("cache write-back failed", "error", err, "key", cacheKey)
	}
	if b, err := json.Marshal(resolvedHosts); err == nil {
		if backupErr := s.backupRepo.UpsertCacheBackup(ctx, ip, "RDNS", b); backupErr != nil {
			s.logger.Warn("failed to backup cache record", "error", backupErr, "target", ip, "type", "RDNS")
		}
	}
	return resolvedHosts, false, nil
}

func ip4ToUint32(addr netip.Addr) uint32 {
	v4 := addr.As4()
	return uint32(v4[0])<<24 | uint32(v4[1])<<16 | uint32(v4[2])<<8 | uint32(v4[3])
}

func uint32ToIP4(v uint32) netip.Addr {
	return netip.AddrFrom4([4]byte{byte(v >> 24), byte(v >> 16), byte(v >> 8), byte(v)})
}

func (s *Service) tryCache(ctx context.Context, key, recordType string, records *models.DNSRecords) (bool, error) {
	switch recordType {
	case "A":
		var v []string
		if err := s.cache.Get(ctx, key, &v); err != nil {
			return false, err
		}
		records.A = v
	case "AAAA":
		var v []string
		if err := s.cache.Get(ctx, key, &v); err != nil {
			return false, err
		}
		records.AAAA = v
	case "CNAME":
		var v []string
		if err := s.cache.Get(ctx, key, &v); err != nil {
			return false, err
		}
		records.CNAME = v
	case "MX":
		var v []models.MXRecord
		if err := s.cache.Get(ctx, key, &v); err != nil {
			return false, err
		}
		records.MX = v
	case "NS":
		var v []string
		if err := s.cache.Get(ctx, key, &v); err != nil {
			return false, err
		}
		records.NS = v
	case "TXT":
		var v []string
		if err := s.cache.Get(ctx, key, &v); err != nil {
			return false, err
		}
		records.TXT = v
	case "CAA":
		var v []models.CAARecord
		if err := s.cache.Get(ctx, key, &v); err != nil {
			return false, err
		}
		records.CAA = v
	case "SOA":
		var v models.SOARecord
		if err := s.cache.Get(ctx, key, &v); err != nil {
			return false, err
		}
		records.SOA = v
	case "SRV":
		var v []models.SRVRecord
		if err := s.cache.Get(ctx, key, &v); err != nil {
			return false, err
		}
		records.SRV = v
	default:
		return false, fmt.Errorf("unsupported type")
	}

	return true, nil
}

func (s *Service) resolveAndPopulate(ctx context.Context, resolver DNSResolver, domain, recordType string, records *models.DNSRecords) error {
	var err error
	switch recordType {
	case "A":
		records.A, err = resolver.LookupA(ctx, domain)
	case "AAAA":
		records.AAAA, err = resolver.LookupAAAA(ctx, domain)
	case "CNAME":
		records.CNAME, err = resolver.LookupCNAME(ctx, domain)
	case "MX":
		records.MX, err = resolver.LookupMX(ctx, domain)
	case "NS":
		records.NS, err = resolver.LookupNS(ctx, domain)
	case "TXT":
		records.TXT, err = resolver.LookupTXT(ctx, domain)
	case "CAA":
		records.CAA, err = resolver.LookupCAA(ctx, domain)
	case "SOA":
		records.SOA, err = resolver.LookupSOA(ctx, domain)
	case "SRV":
		records.SRV, err = resolver.LookupSRV(ctx, domain)
	default:
		return fmt.Errorf("unsupported type")
	}

	if err != nil {
		if isNotFoundErr(err) {
			return errDomainNotFound
		}
		return fmt.Errorf("lookup %s failed: %w", recordType, err)
	}
	return nil
}

func isNotFoundErr(err error) bool {
	var dnsErr *net.DNSError
	if errors.As(err, &dnsErr) {
		return dnsErr.IsNotFound
	}
	return strings.Contains(strings.ToLower(err.Error()), "no such host")
}

func (s *Service) writeBack(ctx context.Context, target, recordType, cacheKey string, records *models.DNSRecords) error {
	var payload any
	switch recordType {
	case "A":
		payload = records.A
	case "AAAA":
		payload = records.AAAA
	case "CNAME":
		payload = records.CNAME
	case "MX":
		payload = records.MX
	case "NS":
		payload = records.NS
	case "TXT":
		payload = records.TXT
	case "CAA":
		payload = records.CAA
	case "SOA":
		payload = records.SOA
	case "SRV":
		payload = records.SRV
	default:
		return fmt.Errorf("unsupported type")
	}

	if err := s.cache.Set(ctx, cacheKey, payload, ttlByType[recordType]); err != nil {
		return err
	}

	if b, err := json.Marshal(payload); err == nil {
		if backupErr := s.backupRepo.UpsertCacheBackup(ctx, target, recordType, b); backupErr != nil {
			s.logger.Warn("failed to backup cache record", "error", backupErr, "target", target, "type", recordType)
		}
	}
	return nil
}

type NetResolver struct {
	resolver  *net.Resolver
	upstreams []string
	client    *dns.Client
	useSystem bool
}

func NewNetResolver(upstreams []string) *NetResolver {
	if len(upstreams) == 0 {
		upstreams = []string{"1.1.1.1:53"}
	}
	return &NetResolver{
		resolver:  net.DefaultResolver,
		upstreams: upstreams,
		client:    &dns.Client{Timeout: 5 * time.Second},
	}
}

func NewSystemResolver() *NetResolver {
	return &NetResolver{
		resolver:  net.DefaultResolver,
		upstreams: []string{},
		client:    &dns.Client{Timeout: 5 * time.Second},
		useSystem: true,
	}
}

func (r *NetResolver) LookupA(ctx context.Context, domain string) ([]string, error) {
	if r.useSystem {
		ips, err := r.resolver.LookupIP(ctx, "ip4", domain)
		if err != nil {
			return nil, err
		}
		out := make([]string, 0, len(ips))
		for _, ip := range ips {
			if v4 := ip.To4(); v4 != nil {
				out = append(out, v4.String())
			}
		}
		return out, nil
	}
	resp, err := r.exchange(ctx, domain, dns.TypeA)
	if err != nil {
		return nil, err
	}
	out := make([]string, 0, len(resp.Answer))
	for _, ans := range resp.Answer {
		if a, ok := ans.(*dns.A); ok {
			out = append(out, a.A.String())
		}
	}
	return out, nil
}

func (r *NetResolver) LookupAAAA(ctx context.Context, domain string) ([]string, error) {
	if r.useSystem {
		ips, err := r.resolver.LookupIP(ctx, "ip6", domain)
		if err != nil {
			return nil, err
		}
		out := make([]string, 0, len(ips))
		for _, ip := range ips {
			if ip.To16() != nil && ip.To4() == nil {
				out = append(out, ip.String())
			}
		}
		return out, nil
	}
	resp, err := r.exchange(ctx, domain, dns.TypeAAAA)
	if err != nil {
		return nil, err
	}
	out := make([]string, 0, len(resp.Answer))
	for _, ans := range resp.Answer {
		if aaaa, ok := ans.(*dns.AAAA); ok {
			out = append(out, aaaa.AAAA.String())
		}
	}
	return out, nil
}

func (r *NetResolver) LookupCNAME(ctx context.Context, domain string) ([]string, error) {
	if r.useSystem {
		cname, err := r.resolver.LookupCNAME(ctx, domain)
		if err != nil {
			return nil, err
		}
		clean := strings.TrimSuffix(strings.ToLower(cname), ".")
		if clean == "" || clean == strings.ToLower(domain) {
			return []string{}, nil
		}
		return []string{clean}, nil
	}
	resp, err := r.exchange(ctx, domain, dns.TypeCNAME)
	if err != nil {
		return nil, err
	}
	out := make([]string, 0, len(resp.Answer))
	for _, ans := range resp.Answer {
		if cname, ok := ans.(*dns.CNAME); ok {
			out = append(out, strings.TrimSuffix(strings.ToLower(cname.Target), "."))
		}
	}
	return out, nil
}

func (r *NetResolver) LookupMX(ctx context.Context, domain string) ([]models.MXRecord, error) {
	if r.useSystem {
		mxRecords, err := r.resolver.LookupMX(ctx, domain)
		if err != nil {
			return nil, err
		}
		out := make([]models.MXRecord, 0, len(mxRecords))
		for _, mx := range mxRecords {
			host := strings.TrimSuffix(mx.Host, ".")
			if host == "" {
				host = "."
			}
			out = append(out, models.MXRecord{Host: host, Pref: mx.Pref})
		}
		return out, nil
	}
	resp, err := r.exchange(ctx, domain, dns.TypeMX)
	if err != nil {
		return nil, err
	}
	out := make([]models.MXRecord, 0, len(resp.Answer))
	for _, ans := range resp.Answer {
		mx, ok := ans.(*dns.MX)
		if !ok {
			continue
		}
		host := strings.TrimSuffix(mx.Mx, ".")
		if host == "" {
			host = "."
		}
		out = append(out, models.MXRecord{Host: host, Pref: mx.Preference})
	}
	return out, nil
}

func (r *NetResolver) LookupNS(ctx context.Context, domain string) ([]string, error) {
	if r.useSystem {
		nsRecords, err := r.resolver.LookupNS(ctx, domain)
		if err != nil {
			return nil, err
		}
		out := make([]string, 0, len(nsRecords))
		for _, ns := range nsRecords {
			out = append(out, strings.TrimSuffix(ns.Host, "."))
		}
		return out, nil
	}
	resp, err := r.exchange(ctx, domain, dns.TypeNS)
	if err != nil {
		return nil, err
	}
	out := make([]string, 0, len(resp.Answer))
	for _, ans := range resp.Answer {
		if ns, ok := ans.(*dns.NS); ok {
			out = append(out, strings.TrimSuffix(ns.Ns, "."))
		}
	}
	return out, nil
}

func (r *NetResolver) LookupTXT(ctx context.Context, domain string) ([]string, error) {
	if r.useSystem {
		return r.resolver.LookupTXT(ctx, domain)
	}
	resp, err := r.exchange(ctx, domain, dns.TypeTXT)
	if err != nil {
		return nil, err
	}
	out := make([]string, 0, len(resp.Answer))
	for _, ans := range resp.Answer {
		if txt, ok := ans.(*dns.TXT); ok {
			out = append(out, strings.Join(txt.Txt, ""))
		}
	}
	return out, nil
}

func (r *NetResolver) LookupCAA(ctx context.Context, domain string) ([]models.CAARecord, error) {
	if r.useSystem {
		return []models.CAARecord{}, nil
	}
	resp, err := r.exchange(ctx, domain, dns.TypeCAA)
	if err != nil {
		return nil, err
	}

	out := make([]models.CAARecord, 0)
	for _, ans := range resp.Answer {
		if caa, ok := ans.(*dns.CAA); ok {
			out = append(out, models.CAARecord{Flag: caa.Flag, Tag: caa.Tag, Value: caa.Value})
		}
	}
	return out, nil
}

func (r *NetResolver) LookupSOA(ctx context.Context, domain string) (models.SOARecord, error) {
	if r.useSystem {
		return models.SOARecord{}, nil
	}
	resp, err := r.exchange(ctx, domain, dns.TypeSOA)
	if err != nil {
		return models.SOARecord{}, err
	}

	for _, ans := range resp.Answer {
		if soa, ok := ans.(*dns.SOA); ok {
			return models.SOARecord{
				NS:      strings.TrimSuffix(soa.Ns, "."),
				MBox:    strings.TrimSuffix(soa.Mbox, "."),
				Serial:  soa.Serial,
				Refresh: soa.Refresh,
				Retry:   soa.Retry,
				Expire:  soa.Expire,
				Minttl:  soa.Minttl,
			}, nil
		}
	}

	return models.SOARecord{}, nil
}

func (r *NetResolver) LookupSRV(ctx context.Context, domain string) ([]models.SRVRecord, error) {
	if r.useSystem {
		return []models.SRVRecord{}, nil
	}
	resp, err := r.exchange(ctx, domain, dns.TypeSRV)
	if err != nil {
		return nil, err
	}

	out := make([]models.SRVRecord, 0)
	for _, ans := range resp.Answer {
		if srv, ok := ans.(*dns.SRV); ok {
			out = append(out, models.SRVRecord{
				Target:   strings.TrimSuffix(srv.Target, "."),
				Port:     srv.Port,
				Priority: srv.Priority,
				Weight:   srv.Weight,
			})
		}
	}
	return out, nil
}

func (r *NetResolver) LookupRDNS(ctx context.Context, ip string) ([]string, error) {
	if r.useSystem {
		hosts, err := r.resolver.LookupAddr(ctx, ip)
		if err != nil {
			if strings.Contains(err.Error(), "no such host") {
				return []string{}, nil
			}
			return nil, err
		}
		out := make([]string, 0, len(hosts))
		for _, h := range hosts {
			out = append(out, strings.TrimSuffix(strings.ToLower(h), "."))
		}
		return out, nil
	}
	ptr, err := dns.ReverseAddr(ip)
	if err != nil {
		return nil, err
	}
	resp, err := r.exchange(ctx, ptr, dns.TypePTR)
	if err != nil {
		if isNotFoundErr(err) {
			return []string{}, nil
		}
		return nil, err
	}
	out := make([]string, 0, len(resp.Answer))
	for _, ans := range resp.Answer {
		if ptr, ok := ans.(*dns.PTR); ok {
			out = append(out, strings.TrimSuffix(strings.ToLower(ptr.Ptr), "."))
		}
	}
	return out, nil
}

func (r *NetResolver) exchange(ctx context.Context, domain string, qtype uint16) (*dns.Msg, error) {
	if r.useSystem {
		return nil, fmt.Errorf("system resolver does not support raw exchange")
	}

	msg := new(dns.Msg)
	msg.SetQuestion(dns.Fqdn(domain), qtype)
	msg.RecursionDesired = true

	var lastErr error
	for _, upstream := range r.upstreams {
		resp, _, err := r.client.ExchangeContext(ctx, msg, upstream)
		if err != nil {
			lastErr = err
			continue
		}
		if resp.Rcode == dns.RcodeNameError {
			return nil, &net.DNSError{Err: "no such host", Name: domain, IsNotFound: true}
		}
		if resp.Rcode != dns.RcodeSuccess {
			lastErr = fmt.Errorf("dns rcode %s", dns.RcodeToString[resp.Rcode])
			continue
		}
		return resp, nil
	}
	if lastErr != nil {
		return nil, lastErr
	}
	return nil, fmt.Errorf("no dns upstreams configured")
}

type AuthoritativeResolver struct {
	recursive *NetResolver
	client    *dns.Client
}

func NewAuthoritativeResolver(recursive *NetResolver) *AuthoritativeResolver {
	return &AuthoritativeResolver{
		recursive: recursive,
		client:    &dns.Client{Timeout: 5 * time.Second},
	}
}

func (r *AuthoritativeResolver) LookupA(ctx context.Context, domain string) ([]string, error) {
	resp, err := r.exchange(ctx, domain, dns.TypeA)
	if err != nil {
		return nil, err
	}
	out := make([]string, 0, len(resp.Answer))
	for _, ans := range resp.Answer {
		if a, ok := ans.(*dns.A); ok {
			out = append(out, a.A.String())
		}
	}
	return out, nil
}

func (r *AuthoritativeResolver) LookupAAAA(ctx context.Context, domain string) ([]string, error) {
	resp, err := r.exchange(ctx, domain, dns.TypeAAAA)
	if err != nil {
		return nil, err
	}
	out := make([]string, 0, len(resp.Answer))
	for _, ans := range resp.Answer {
		if aaaa, ok := ans.(*dns.AAAA); ok {
			out = append(out, aaaa.AAAA.String())
		}
	}
	return out, nil
}

func (r *AuthoritativeResolver) LookupCNAME(ctx context.Context, domain string) ([]string, error) {
	resp, err := r.exchange(ctx, domain, dns.TypeCNAME)
	if err != nil {
		return nil, err
	}
	out := make([]string, 0, len(resp.Answer))
	for _, ans := range resp.Answer {
		if cname, ok := ans.(*dns.CNAME); ok {
			out = append(out, strings.TrimSuffix(strings.ToLower(cname.Target), "."))
		}
	}
	return out, nil
}

func (r *AuthoritativeResolver) LookupMX(ctx context.Context, domain string) ([]models.MXRecord, error) {
	resp, err := r.exchange(ctx, domain, dns.TypeMX)
	if err != nil {
		return nil, err
	}
	out := make([]models.MXRecord, 0, len(resp.Answer))
	for _, ans := range resp.Answer {
		if mx, ok := ans.(*dns.MX); ok {
			host := strings.TrimSuffix(mx.Mx, ".")
			if host == "" {
				host = "."
			}
			out = append(out, models.MXRecord{Host: host, Pref: mx.Preference})
		}
	}
	return out, nil
}

func (r *AuthoritativeResolver) LookupNS(ctx context.Context, domain string) ([]string, error) {
	resp, err := r.exchange(ctx, domain, dns.TypeNS)
	if err != nil {
		return nil, err
	}
	out := make([]string, 0, len(resp.Answer))
	for _, ans := range resp.Answer {
		if ns, ok := ans.(*dns.NS); ok {
			out = append(out, strings.TrimSuffix(ns.Ns, "."))
		}
	}
	return out, nil
}

func (r *AuthoritativeResolver) LookupTXT(ctx context.Context, domain string) ([]string, error) {
	resp, err := r.exchange(ctx, domain, dns.TypeTXT)
	if err != nil {
		return nil, err
	}
	out := make([]string, 0, len(resp.Answer))
	for _, ans := range resp.Answer {
		if txt, ok := ans.(*dns.TXT); ok {
			out = append(out, strings.Join(txt.Txt, ""))
		}
	}
	return out, nil
}

func (r *AuthoritativeResolver) LookupCAA(ctx context.Context, domain string) ([]models.CAARecord, error) {
	resp, err := r.exchange(ctx, domain, dns.TypeCAA)
	if err != nil {
		return nil, err
	}
	out := make([]models.CAARecord, 0, len(resp.Answer))
	for _, ans := range resp.Answer {
		if caa, ok := ans.(*dns.CAA); ok {
			out = append(out, models.CAARecord{Flag: caa.Flag, Tag: caa.Tag, Value: caa.Value})
		}
	}
	return out, nil
}

func (r *AuthoritativeResolver) LookupSOA(ctx context.Context, domain string) (models.SOARecord, error) {
	resp, err := r.exchange(ctx, domain, dns.TypeSOA)
	if err != nil {
		return models.SOARecord{}, err
	}
	for _, ans := range resp.Answer {
		if soa, ok := ans.(*dns.SOA); ok {
			return models.SOARecord{
				NS:      strings.TrimSuffix(soa.Ns, "."),
				MBox:    strings.TrimSuffix(soa.Mbox, "."),
				Serial:  soa.Serial,
				Refresh: soa.Refresh,
				Retry:   soa.Retry,
				Expire:  soa.Expire,
				Minttl:  soa.Minttl,
			}, nil
		}
	}
	return models.SOARecord{}, nil
}

func (r *AuthoritativeResolver) LookupSRV(ctx context.Context, domain string) ([]models.SRVRecord, error) {
	resp, err := r.exchange(ctx, domain, dns.TypeSRV)
	if err != nil {
		return nil, err
	}
	out := make([]models.SRVRecord, 0, len(resp.Answer))
	for _, ans := range resp.Answer {
		if srv, ok := ans.(*dns.SRV); ok {
			out = append(out, models.SRVRecord{
				Target:   strings.TrimSuffix(srv.Target, "."),
				Port:     srv.Port,
				Priority: srv.Priority,
				Weight:   srv.Weight,
			})
		}
	}
	return out, nil
}

func (r *AuthoritativeResolver) LookupRDNS(ctx context.Context, ip string) ([]string, error) {
	ptr, err := dns.ReverseAddr(ip)
	if err != nil {
		return nil, err
	}
	resp, err := r.exchange(ctx, ptr, dns.TypePTR)
	if err != nil {
		if isNotFoundErr(err) {
			return []string{}, nil
		}
		return nil, err
	}
	out := make([]string, 0, len(resp.Answer))
	for _, ans := range resp.Answer {
		if ptr, ok := ans.(*dns.PTR); ok {
			out = append(out, strings.TrimSuffix(strings.ToLower(ptr.Ptr), "."))
		}
	}
	return out, nil
}

func (r *AuthoritativeResolver) exchange(ctx context.Context, domain string, qtype uint16) (*dns.Msg, error) {
	nsRecords, err := r.recursive.LookupNS(ctx, domain)
	if err != nil || len(nsRecords) == 0 {
		zone := parentDomain(domain)
		for zone != "" {
			nsRecords, err = r.recursive.LookupNS(ctx, zone)
			if err == nil && len(nsRecords) > 0 {
				break
			}
			zone = parentDomain(zone)
		}
	}
	if len(nsRecords) == 0 {
		if err != nil {
			return nil, err
		}
		return nil, &net.DNSError{Err: "no authoritative nameservers", Name: domain, IsNotFound: true}
	}

	msg := new(dns.Msg)
	msg.SetQuestion(dns.Fqdn(domain), qtype)
	msg.RecursionDesired = false

	var lastErr error
	for _, nsHost := range nsRecords {
		ips, err := r.recursive.LookupA(ctx, nsHost)
		if err != nil || len(ips) == 0 {
			aaaa, aaaaErr := r.recursive.LookupAAAA(ctx, nsHost)
			if aaaaErr != nil && err == nil {
				err = aaaaErr
			}
			ips = append(ips, aaaa...)
		}
		if err != nil && len(ips) == 0 {
			lastErr = err
			continue
		}
		for _, ip := range ips {
			resp, _, err := r.client.ExchangeContext(ctx, msg, net.JoinHostPort(ip, "53"))
			if err != nil {
				lastErr = err
				continue
			}
			if resp.Rcode == dns.RcodeNameError {
				return nil, &net.DNSError{Err: "no such host", Name: domain, IsNotFound: true}
			}
			if resp.Rcode != dns.RcodeSuccess {
				lastErr = fmt.Errorf("dns rcode %s", dns.RcodeToString[resp.Rcode])
				continue
			}
			return resp, nil
		}
	}
	if lastErr != nil {
		return nil, lastErr
	}
	return nil, fmt.Errorf("authoritative lookup failed")
}

func parentDomain(domain string) string {
	domain = strings.TrimSuffix(strings.ToLower(strings.TrimSpace(domain)), ".")
	parts := strings.Split(domain, ".")
	if len(parts) <= 2 {
		return ""
	}
	return strings.Join(parts[1:], ".")
}
