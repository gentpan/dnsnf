package utils

import (
	"fmt"
	"regexp"
	"strings"
)

var domainRegex = regexp.MustCompile(`^(?i)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$`)

var supportedTypes = map[string]struct{}{
	"ALL":   {},
	"A":     {},
	"AAAA":  {},
	"CNAME": {},
	"MX":    {},
	"NS":    {},
	"TXT":   {},
	"CAA":   {},
	"SOA":   {},
	"SRV":   {},
	"PTR":   {},
	"RDNS":  {},
}

func NormalizeDomain(domain string) string {
	return strings.TrimSuffix(strings.ToLower(strings.TrimSpace(domain)), ".")
}

func ValidateDomain(domain string) error {
	if !domainRegex.MatchString(domain) {
		return fmt.Errorf("invalid domain")
	}
	return nil
}

func NormalizeRecordType(t string) (string, error) {
	t = strings.ToUpper(strings.TrimSpace(t))
	if t == "" {
		return "ALL", nil
	}
	if _, ok := supportedTypes[t]; !ok {
		return "", fmt.Errorf("unsupported type")
	}
	if t == "PTR" {
		return "RDNS", nil
	}
	return t, nil
}

func AllRecordTypes() []string {
	return []string{"A", "AAAA", "CNAME", "MX", "NS", "TXT", "CAA", "SOA", "SRV"}
}
