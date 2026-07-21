package services

import (
	"context"
	"errors"
	"log/slog"
	"net"
	"os"
	"strings"
	"testing"
	"time"

	"giantaccel/internal/models"

	"github.com/redis/go-redis/v9"
)

type mockCache struct {
	store map[string]any
}

func (m *mockCache) Get(_ context.Context, key string, out any) error {
	v, ok := m.store[key]
	if !ok {
		return redis.Nil
	}
	switch t := out.(type) {
	case *[]string:
		*t = v.([]string)
	case *[]models.MXRecord:
		*t = v.([]models.MXRecord)
	case *[]models.CAARecord:
		*t = v.([]models.CAARecord)
	case *[]models.SRVRecord:
		*t = v.([]models.SRVRecord)
	case *models.SOARecord:
		*t = v.(models.SOARecord)
	default:
		return errors.New("unsupported test type")
	}
	return nil
}

func (m *mockCache) Set(_ context.Context, key string, payload any, _ time.Duration) error {
	m.store[key] = payload
	return nil
}

type noopRepo struct{}

func (noopRepo) InsertDNSLog(context.Context, string, string, string) error { return nil }
func (noopRepo) UpsertCacheBackup(context.Context, string, string, []byte) error {
	return nil
}

type mockResolver struct{}

func (mockResolver) LookupA(context.Context, string) ([]string, error) {
	return []string{"93.184.216.34"}, nil
}
func (mockResolver) LookupAAAA(context.Context, string) ([]string, error) {
	return []string{"2606:2800:220:1:248:1893:25c8:1946"}, nil
}
func (mockResolver) LookupCNAME(context.Context, string) ([]string, error) {
	return []string{"edge.example.net"}, nil
}
func (mockResolver) LookupMX(context.Context, string) ([]models.MXRecord, error) {
	return []models.MXRecord{{Host: "mail.example.com", Pref: 10}}, nil
}
func (mockResolver) LookupNS(context.Context, string) ([]string, error) {
	return []string{"ns1.example.com", "ns2.example.com"}, nil
}
func (mockResolver) LookupTXT(context.Context, string) ([]string, error) {
	return []string{"v=spf1 -all"}, nil
}
func (mockResolver) LookupCAA(context.Context, string) ([]models.CAARecord, error) {
	return []models.CAARecord{{Flag: 0, Tag: "issue", Value: "letsencrypt.org"}}, nil
}
func (mockResolver) LookupSOA(context.Context, string) (models.SOARecord, error) {
	return models.SOARecord{NS: "ns1.example.com", MBox: "admin.example.com", Serial: 1}, nil
}
func (mockResolver) LookupSRV(context.Context, string) ([]models.SRVRecord, error) {
	return []models.SRVRecord{{Target: "sip.example.com", Port: 443, Priority: 10, Weight: 20}}, nil
}
func (mockResolver) LookupRDNS(context.Context, string) ([]string, error) {
	return []string{"dns.google"}, nil
}
func (mockResolver) LookupRaw(context.Context, string, uint16) ([]string, error) {
	return []string{}, nil
}

type partialNotFoundResolver struct{}

func (partialNotFoundResolver) LookupA(context.Context, string) ([]string, error) {
	return []string{"93.184.216.34"}, nil
}
func (partialNotFoundResolver) LookupAAAA(context.Context, string) ([]string, error) {
	return nil, &net.DNSError{Err: "no such host", IsNotFound: true}
}
func (partialNotFoundResolver) LookupCNAME(context.Context, string) ([]string, error) {
	return []string{}, nil
}
func (partialNotFoundResolver) LookupMX(context.Context, string) ([]models.MXRecord, error) {
	return []models.MXRecord{}, nil
}
func (partialNotFoundResolver) LookupNS(context.Context, string) ([]string, error) {
	return []string{"a.iana-servers.net", "b.iana-servers.net"}, nil
}
func (partialNotFoundResolver) LookupTXT(context.Context, string) ([]string, error) {
	return []string{}, nil
}
func (partialNotFoundResolver) LookupCAA(context.Context, string) ([]models.CAARecord, error) {
	return []models.CAARecord{}, nil
}
func (partialNotFoundResolver) LookupSOA(context.Context, string) (models.SOARecord, error) {
	return models.SOARecord{}, nil
}
func (partialNotFoundResolver) LookupSRV(context.Context, string) ([]models.SRVRecord, error) {
	return []models.SRVRecord{}, nil
}
func (partialNotFoundResolver) LookupRDNS(context.Context, string) ([]string, error) {
	return []string{}, nil
}
func (partialNotFoundResolver) LookupRaw(context.Context, string, uint16) ([]string, error) {
	return []string{}, nil
}

type cidrResolver struct {
	mockResolver
}

func (cidrResolver) LookupRDNS(_ context.Context, ip string) ([]string, error) {
	return []string{"ptr-" + strings.ReplaceAll(ip, ".", "-") + ".example.test"}, nil
}

type cidrPartialErrorResolver struct {
	mockResolver
}

func (cidrPartialErrorResolver) LookupRDNS(_ context.Context, ip string) ([]string, error) {
	if strings.HasSuffix(ip, ".2") {
		return nil, errors.New("temporary resolver failure")
	}
	return []string{"ptr-" + strings.ReplaceAll(ip, ".", "-") + ".example.test"}, nil
}

func TestLookup_CacheHit(t *testing.T) {
	cache := &mockCache{store: map[string]any{"dns:cloudflare:example.com:A": []string{"1.1.1.1"}}}
	svc := NewDNSService(cache, noopRepo{}, noopRepo{}, mockResolver{}, slog.New(slog.NewTextHandler(os.Stdout, nil)))

	resp, err := svc.Lookup(context.Background(), "example.com", "A", "127.0.0.1")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if !resp.Cached {
		t.Fatalf("expected cached=true")
	}
	if len(resp.Data.Records.A) != 1 || resp.Data.Records.A[0] != "1.1.1.1" {
		t.Fatalf("unexpected A record: %+v", resp.Data.Records.A)
	}
}

func TestLookup_CacheMiss(t *testing.T) {
	cache := &mockCache{store: map[string]any{}}
	svc := NewDNSService(cache, noopRepo{}, noopRepo{}, mockResolver{}, slog.New(slog.NewTextHandler(os.Stdout, nil)))

	resp, err := svc.Lookup(context.Background(), "example.com", "TXT", "127.0.0.1")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if resp.Cached {
		t.Fatalf("expected cached=false")
	}
	if len(resp.Data.Records.TXT) != 1 {
		t.Fatalf("unexpected TXT records: %+v", resp.Data.Records.TXT)
	}
	if _, ok := cache.store["dns:cloudflare:example.com:TXT"]; !ok {
		t.Fatalf("expected TXT to be cached")
	}
}

func TestLookup_WithResolverUsesResolverScopedCache(t *testing.T) {
	cache := &mockCache{store: map[string]any{
		"dns:google:example.com:A": []string{"8.8.8.8"},
	}}
	svc := NewDNSService(cache, noopRepo{}, noopRepo{}, mockResolver{}, slog.New(slog.NewTextHandler(os.Stdout, nil)))
	svc.SetResolvers("cloudflare", map[string]DNSResolver{
		"cloudflare": mockResolver{},
		"google":     mockResolver{},
	})

	resp, err := svc.LookupWithResolver(context.Background(), "example.com", "A", "google", "127.0.0.1")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if !resp.Cached {
		t.Fatalf("expected cached=true")
	}
	if got := resp.Data.Records.A[0]; got != "8.8.8.8" {
		t.Fatalf("expected google scoped cache result, got %s", got)
	}
}

func TestLookup_RDNS(t *testing.T) {
	cache := &mockCache{store: map[string]any{}}
	svc := NewDNSService(cache, noopRepo{}, noopRepo{}, mockResolver{}, slog.New(slog.NewTextHandler(os.Stdout, nil)))

	resp, err := svc.Lookup(context.Background(), "8.8.8.8", "ALL", "127.0.0.1")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if resp.Data.IP != "8.8.8.8" {
		t.Fatalf("unexpected ip: %s", resp.Data.IP)
	}
	if len(resp.Data.ReverseDNS) == 0 {
		t.Fatalf("expected rdns results")
	}
}

func TestLookup_AllPartialNotFound_ShouldSucceed(t *testing.T) {
	cache := &mockCache{store: map[string]any{}}
	svc := NewDNSService(cache, noopRepo{}, noopRepo{}, partialNotFoundResolver{}, slog.New(slog.NewTextHandler(os.Stdout, nil)))

	resp, err := svc.Lookup(context.Background(), "example.com", "ALL", "127.0.0.1")
	if err != nil {
		t.Fatalf("expected no error for partial not found, got %v", err)
	}
	if len(resp.Data.Records.A) == 0 {
		t.Fatalf("expected A records to be present")
	}
}

func TestLookup_RDNS_CIDR(t *testing.T) {
	cache := &mockCache{store: map[string]any{}}
	svc := NewDNSService(cache, noopRepo{}, noopRepo{}, cidrResolver{}, slog.New(slog.NewTextHandler(os.Stdout, nil)))

	resp, err := svc.Lookup(context.Background(), "213.230.74.0/30", "RDNS", "127.0.0.1")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if resp.Data.IP != "213.230.74.0/30" {
		t.Fatalf("unexpected ip/cidr: %s", resp.Data.IP)
	}
	if len(resp.Data.ReverseDNS) != 2 {
		t.Fatalf("expected 2 rdns rows for /30 usable hosts, got %d: %+v", len(resp.Data.ReverseDNS), resp.Data.ReverseDNS)
	}
	if !strings.Contains(resp.Data.ReverseDNS[0], "213.230.74.1") {
		t.Fatalf("expected first row to contain host ip, got %s", resp.Data.ReverseDNS[0])
	}
}

func TestLookup_RDNS_CIDRTooLarge(t *testing.T) {
	cache := &mockCache{store: map[string]any{}}
	svc := NewDNSService(cache, noopRepo{}, noopRepo{}, mockResolver{}, slog.New(slog.NewTextHandler(os.Stdout, nil)))

	_, err := svc.Lookup(context.Background(), "10.0.0.0/16", "RDNS", "127.0.0.1")
	if err == nil {
		t.Fatalf("expected error for oversized cidr range")
	}
	if !strings.Contains(strings.ToLower(err.Error()), "too large") {
		t.Fatalf("expected 'too large' error, got %v", err)
	}
}

func TestLookup_RDNS_CIDRPartialLookupFailure_ShouldContinue(t *testing.T) {
	cache := &mockCache{store: map[string]any{}}
	svc := NewDNSService(cache, noopRepo{}, noopRepo{}, cidrPartialErrorResolver{}, slog.New(slog.NewTextHandler(os.Stdout, nil)))

	resp, err := svc.Lookup(context.Background(), "213.230.74.0/30", "RDNS", "127.0.0.1")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(resp.Data.ReverseDNS) != 1 {
		t.Fatalf("expected 1 successful row when one host fails, got %d: %+v", len(resp.Data.ReverseDNS), resp.Data.ReverseDNS)
	}
	if !strings.Contains(resp.Data.ReverseDNS[0], "213.230.74.1") {
		t.Fatalf("expected remaining successful host to be present, got %+v", resp.Data.ReverseDNS)
	}
}
