package handlers

import (
	"context"
	"crypto/ecdsa"
	"crypto/ed25519"
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"

	"giantaccel/internal/services"
)

const (
	sslTimeout  = 8 * time.Second
	sslCacheTTL = 3 * time.Minute
)

type SSLHandler struct {
	cache services.CacheStore
}

func NewSSLHandler(cache services.CacheStore) *SSLHandler {
	return &SSLHandler{cache: cache}
}

// SSL inspects the TLS certificate of a domain or IP target.
// GET /v1/dns/ssl?target=example.com&port=443
func (h *SSLHandler) SSL(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"code": 405, "message": "method not allowed"})
		return
	}
	raw := strings.TrimSpace(r.URL.Query().Get("target"))
	if raw == "" {
		raw = strings.TrimSpace(r.URL.Query().Get("domain"))
	}
	if raw == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"code": 400, "message": "target is required"})
		return
	}
	target := normalizeDomain(raw)
	isIP := net.ParseIP(target) != nil
	if !isIP && !validDomain(target) {
		writeJSON(w, http.StatusBadRequest, map[string]any{"code": 400, "message": "invalid domain or ip"})
		return
	}
	port := 443
	if rawPort := strings.TrimSpace(r.URL.Query().Get("port")); rawPort != "" {
		parsed, err := strconv.Atoi(rawPort)
		if err != nil || parsed < 1 || parsed > 65535 {
			writeJSON(w, http.StatusBadRequest, map[string]any{"code": 400, "message": "invalid port"})
			return
		}
		port = parsed
	}

	cacheKey := fmt.Sprintf("ssl:%s:%d", target, port)
	var payload map[string]any
	if h.cache != nil && h.cache.Get(r.Context(), cacheKey, &payload) == nil {
		payload["cached"] = true
		writeJSON(w, http.StatusOK, payload)
		return
	}

	result, err := inspectTLS(r.Context(), target, port, isIP)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]any{"code": 502, "message": "tls handshake failed: " + err.Error()})
		return
	}

	payload = map[string]any{
		"code":      0,
		"data":      result,
		"cached":    false,
		"timestamp": time.Now().Unix(),
	}
	if h.cache != nil {
		_ = h.cache.Set(r.Context(), cacheKey, payload, sslCacheTTL)
	}
	writeJSON(w, http.StatusOK, payload)
}

func inspectTLS(ctx context.Context, target string, port int, isIP bool) (map[string]any, error) {
	dialer := &net.Dialer{Timeout: sslTimeout}
	address := net.JoinHostPort(target, strconv.Itoa(port))
	serverName := target
	if isIP {
		// SNI must be a hostname; skip it for bare IP targets.
		serverName = ""
	}
	// The handshake intentionally skips verification so certificate details
	// are still returned for broken or expired chains; trust is evaluated
	// separately against the system root pool below.
	rawConn, err := dialer.DialContext(ctx, "tcp", address)
	if err != nil {
		return nil, err
	}
	conn := tls.Client(rawConn, &tls.Config{
		ServerName:         serverName,
		InsecureSkipVerify: true, //nolint:gosec // verified manually after the handshake
	})
	if err := conn.HandshakeContext(ctx); err != nil {
		_ = rawConn.Close()
		return nil, err
	}
	defer func() { _ = conn.Close() }()

	state := conn.ConnectionState()
	peerCerts := state.PeerCertificates
	if len(peerCerts) == 0 {
		return nil, fmt.Errorf("server presented no certificate")
	}
	leaf := peerCerts[0]

	verified := true
	verifyError := ""
	verifyName := target
	verifyOpts := x509.VerifyOptions{
		DNSName:       verifyName,
		Intermediates: x509.NewCertPool(),
	}
	for _, cert := range peerCerts[1:] {
		verifyOpts.Intermediates.AddCert(cert)
	}
	if roots, err := x509.SystemCertPool(); err == nil && roots != nil {
		verifyOpts.Roots = roots
	}
	if _, err := leaf.Verify(verifyOpts); err != nil {
		verified = false
		verifyError = err.Error()
	}

	now := time.Now()
	chain := make([]map[string]any, 0, len(peerCerts))
	for _, cert := range peerCerts {
		chain = append(chain, summarizeCert(cert, now))
	}

	return map[string]any{
		"target":            target,
		"ip":                conn.RemoteAddr().String(),
		"port":              port,
		"tls_version":       tlsVersionName(state.Version),
		"cipher_suite":      tls.CipherSuiteName(state.CipherSuite),
		"alpn":              state.NegotiatedProtocol,
		"ocsp_stapled":      len(state.OCSPResponse) > 0,
		"verified":          verified,
		"verify_error":      verifyError,
		"chain_length":      len(peerCerts),
		"certificate":       summarizeCert(leaf, now),
		"subject_alt_names": leaf.DNSNames,
		"chain":             chain,
	}, nil
}

func summarizeCert(cert *x509.Certificate, now time.Time) map[string]any {
	daysRemaining := int(time.Until(cert.NotAfter).Hours() / 24)
	return map[string]any{
		"subject_cn":           cert.Subject.CommonName,
		"subject_org":          strings.Join(cert.Subject.Organization, ", "),
		"issuer_cn":            cert.Issuer.CommonName,
		"issuer_org":           strings.Join(cert.Issuer.Organization, ", "),
		"serial_number":        cert.SerialNumber.String(),
		"version":              cert.Version,
		"signature_algorithm":  cert.SignatureAlgorithm.String(),
		"public_key_algorithm": cert.PublicKeyAlgorithm.String(),
		"public_key_bits":      publicKeyBits(cert),
		"not_before":           cert.NotBefore.UTC().Format(time.RFC3339),
		"not_after":            cert.NotAfter.UTC().Format(time.RFC3339),
		"days_remaining":       daysRemaining,
		"expired":              now.After(cert.NotAfter),
		"is_ca":                cert.IsCA,
		"self_signed":          cert.Subject.String() == cert.Issuer.String() && cert.CheckSignatureFrom(cert) == nil,
		"dns_names":            cert.DNSNames,
		"ip_addresses":         ipStrings(cert.IPAddresses),
		"email_addresses":      cert.EmailAddresses,
	}
}

func publicKeyBits(cert *x509.Certificate) int {
	switch key := cert.PublicKey.(type) {
	case *rsa.PublicKey:
		return key.N.BitLen()
	case *ecdsa.PublicKey:
		return key.Curve.Params().BitSize
	case ed25519.PublicKey:
		return 256
	default:
		return 0
	}
}

func ipStrings(ips []net.IP) []string {
	out := make([]string, 0, len(ips))
	for _, ip := range ips {
		out = append(out, ip.String())
	}
	return out
}

func tlsVersionName(version uint16) string {
	switch version {
	case tls.VersionTLS13:
		return "TLS 1.3"
	case tls.VersionTLS12:
		return "TLS 1.2"
	case tls.VersionTLS11:
		return "TLS 1.1"
	case tls.VersionTLS10:
		return "TLS 1.0"
	default:
		return fmt.Sprintf("0x%04x", version)
	}
}
