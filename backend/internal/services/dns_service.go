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
	cache      CacheStore
	logRepo    LogRepository
	backupRepo BackupRepository
	resolver   DNSResolver
	logger     *slog.Logger
}

func NewDNSService(cache CacheStore, logRepo LogRepository, backupRepo BackupRepository, resolver DNSResolver, logger *slog.Logger) *Service {
	return &Service{
		cache:      cache,
		logRepo:    logRepo,
		backupRepo: backupRepo,
		resolver:   resolver,
		logger:     logger,
	}
}

func (s *Service) Lookup(ctx context.Context, target, recordType, clientIP string) (models.APIResponse, error) {
	target = strings.TrimSpace(target)
	if target == "" {
		return models.APIResponse{}, fmt.Errorf("domain or ip is required")
	}

	normalizedType, err := utils.NormalizeRecordType(recordType)
	if err != nil {
		return models.APIResponse{}, err
	}

	if prefix, parseErr := netip.ParsePrefix(target); parseErr == nil {
		return s.lookupCIDR(ctx, prefix, normalizedType, clientIP)
	}

	if ip := net.ParseIP(target); ip != nil {
		return s.lookupIP(ctx, ip.String(), normalizedType, clientIP)
	}

	domain := utils.NormalizeDomain(target)
	if err := utils.ValidateDomain(domain); err != nil {
		return models.APIResponse{}, err
	}
	return s.lookupDomain(ctx, domain, normalizedType, clientIP)
}

func (s *Service) lookupDomain(ctx context.Context, domain, normalizedType, clientIP string) (models.APIResponse, error) {
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
		mu           sync.Mutex
		wg           sync.WaitGroup
		notFoundCount int
		allCached     = true
		firstErr      error
	)

	for _, t := range types {
		wg.Add(1)
		go func(t string) {
			defer wg.Done()
			key := fmt.Sprintf("dns:%s:%s", domain, t)
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
			if resolveErr := s.resolveAndPopulate(ctx, domain, t, &local); resolveErr != nil {
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

func (s *Service) lookupCIDR(ctx context.Context, prefix netip.Prefix, normalizedType, clientIP string) (models.APIResponse, error) {
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
		hosts, cached, err := s.lookupIPRDNSWithCache(ctx, ip)
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

func (s *Service) lookupIP(ctx context.Context, ip, normalizedType, clientIP string) (models.APIResponse, error) {
	if normalizedType != "ALL" && normalizedType != "RDNS" {
		return models.APIResponse{}, fmt.Errorf("ip target supports only RDNS or ALL")
	}

	reverseHosts, cached, err := s.lookupIPRDNSWithCache(ctx, ip)
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

func (s *Service) lookupIPRDNSWithCache(ctx context.Context, ip string) ([]string, bool, error) {
	cacheKey := fmt.Sprintf("dns:%s:RDNS", ip)
	reverseHosts := make([]string, 0)

	if err := s.cache.Get(ctx, cacheKey, &reverseHosts); err == nil {
		return reverseHosts, true, nil
	} else if err != redis.Nil {
		s.logger.Warn("redis get failed", "error", err, "key", cacheKey)
	}

	resolvedHosts, err := s.resolver.LookupRDNS(ctx, ip)
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

func (s *Service) resolveAndPopulate(ctx context.Context, domain, recordType string, records *models.DNSRecords) error {
	var err error
	switch recordType {
	case "A":
		records.A, err = s.resolver.LookupA(ctx, domain)
	case "AAAA":
		records.AAAA, err = s.resolver.LookupAAAA(ctx, domain)
	case "CNAME":
		records.CNAME, err = s.resolver.LookupCNAME(ctx, domain)
	case "MX":
		records.MX, err = s.resolver.LookupMX(ctx, domain)
	case "NS":
		records.NS, err = s.resolver.LookupNS(ctx, domain)
	case "TXT":
		records.TXT, err = s.resolver.LookupTXT(ctx, domain)
	case "CAA":
		records.CAA, err = s.resolver.LookupCAA(ctx, domain)
	case "SOA":
		records.SOA, err = s.resolver.LookupSOA(ctx, domain)
	case "SRV":
		records.SRV, err = s.resolver.LookupSRV(ctx, domain)
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
}

func NewNetResolver(upstreams []string) *NetResolver {
	return &NetResolver{
		resolver:  net.DefaultResolver,
		upstreams: upstreams,
		client:    &dns.Client{Timeout: 5 * time.Second},
	}
}

func (r *NetResolver) LookupA(ctx context.Context, domain string) ([]string, error) {
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

func (r *NetResolver) LookupAAAA(ctx context.Context, domain string) ([]string, error) {
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

func (r *NetResolver) LookupCNAME(ctx context.Context, domain string) ([]string, error) {
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

func (r *NetResolver) LookupMX(ctx context.Context, domain string) ([]models.MXRecord, error) {
	mxRecords, err := r.resolver.LookupMX(ctx, domain)
	if err != nil {
		return nil, err
	}
	out := make([]models.MXRecord, 0, len(mxRecords))
	for _, mx := range mxRecords {
		host := strings.TrimSuffix(mx.Host, ".")
		if host == "" {
			// RFC 7505 null MX is represented as ".", keep it explicit for UI/API consumers.
			host = "."
		}
		out = append(out, models.MXRecord{Host: host, Pref: mx.Pref})
	}
	return out, nil
}

func (r *NetResolver) LookupNS(ctx context.Context, domain string) ([]string, error) {
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

func (r *NetResolver) LookupTXT(ctx context.Context, domain string) ([]string, error) {
	return r.resolver.LookupTXT(ctx, domain)
}

func (r *NetResolver) LookupCAA(ctx context.Context, domain string) ([]models.CAARecord, error) {
	msg := new(dns.Msg)
	msg.SetQuestion(dns.Fqdn(domain), dns.TypeCAA)
	var resp *dns.Msg
	var err error
	for _, upstream := range r.upstreams {
		resp, _, err = r.client.ExchangeContext(ctx, msg, upstream)
		if err == nil {
			break
		}
	}
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
	msg := new(dns.Msg)
	msg.SetQuestion(dns.Fqdn(domain), dns.TypeSOA)
	var resp *dns.Msg
	var err error
	for _, upstream := range r.upstreams {
		resp, _, err = r.client.ExchangeContext(ctx, msg, upstream)
		if err == nil {
			break
		}
	}
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
	msg := new(dns.Msg)
	msg.SetQuestion(dns.Fqdn(domain), dns.TypeSRV)
	var resp *dns.Msg
	var err error
	for _, upstream := range r.upstreams {
		resp, _, err = r.client.ExchangeContext(ctx, msg, upstream)
		if err == nil {
			break
		}
	}
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
