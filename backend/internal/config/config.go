package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv        string
	Port          string
	ReadTimeout   time.Duration
	WriteTimeout  time.Duration
	IdleTimeout   time.Duration
	ShutdownGrace time.Duration

	PostgresDSN string
	RedisAddr   string
	RedisPass   string
	RedisDB     int

	DNSUpstream   []string
	CORSOrigins   []string
	InternalToken string
	AnalyticsURL  string

	CloudflareAPIToken string
	CloudflareEmail    string
	CloudflareAPIKey   string
	CloudflareZoneID   string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	redisDB, err := getenvInt("REDIS_DB", 0)
	if err != nil {
		return nil, fmt.Errorf("parse REDIS_DB: %w", err)
	}

	cfg := &Config{
		AppEnv:        getenv("APP_ENV", "development"),
		Port:          getenv("PORT", "8080"),
		ReadTimeout:   getenvDuration("HTTP_READ_TIMEOUT", 10*time.Second),
		WriteTimeout:  getenvDuration("HTTP_WRITE_TIMEOUT", 10*time.Second),
		IdleTimeout:   getenvDuration("HTTP_IDLE_TIMEOUT", 60*time.Second),
		ShutdownGrace: getenvDuration("HTTP_SHUTDOWN_GRACE", 10*time.Second),

		PostgresDSN: getenv("POSTGRES_DSN", "postgres://postgres:postgres@localhost:5432/dns_platform?sslmode=disable"),
		RedisAddr:   getenv("REDIS_ADDR", "localhost:6379"),
		RedisPass:   getenv("REDIS_PASSWORD", ""),
		RedisDB:     redisDB,

		DNSUpstream:   splitCSV(getenv("DNS_UPSTREAM", "1.1.1.1:53")),
		CORSOrigins:   splitCSV(getenv("CORS_ALLOWED_ORIGINS", "https://dns.nf,http://localhost:3000")),
		InternalToken: getenv("INTERNAL_TOKEN", ""),
		AnalyticsURL:  getenv("ANALYTICS_URL", ""),

		CloudflareAPIToken: getenv("CLOUDFLARE_API_TOKEN", ""),
		CloudflareEmail:    getenv("CLOUDFLARE_EMAIL", ""),
		CloudflareAPIKey:   getenv("CLOUDFLARE_API_KEY", ""),
		CloudflareZoneID:   getenv("CLOUDFLARE_ZONE_ID", ""),
	}

	return cfg, nil
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getenvInt(key string, fallback int) (int, error) {
	v := os.Getenv(key)
	if v == "" {
		return fallback, nil
	}
	return strconv.Atoi(v)
}

func getenvDuration(key string, fallback time.Duration) time.Duration {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	d, err := time.ParseDuration(v)
	if err != nil {
		return fallback
	}
	return d
}

func splitCSV(v string) []string {
	parts := strings.Split(v, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}
