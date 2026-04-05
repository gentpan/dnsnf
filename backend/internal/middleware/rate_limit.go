package middleware

import (
	"encoding/json"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

type ipCounter struct {
	count    int
	resetAt  time.Time
	lastSeen time.Time
}

type RateLimiter struct {
	mu      sync.Mutex
	limit   int
	window  time.Duration
	clients map[string]*ipCounter
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		limit:   limit,
		window:  window,
		clients: make(map[string]*ipCounter),
	}
	go rl.gcLoop()
	return rl
}

func (rl *RateLimiter) Handle(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := clientIP(r)
		if !rl.allow(ip) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusTooManyRequests)
			_ = json.NewEncoder(w).Encode(map[string]any{
				"code":      http.StatusTooManyRequests,
				"message":   "rate limit exceeded",
				"timestamp": time.Now().Unix(),
			})
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (rl *RateLimiter) allow(ip string) bool {
	now := time.Now()
	rl.mu.Lock()
	defer rl.mu.Unlock()

	entry, ok := rl.clients[ip]
	if !ok || now.After(entry.resetAt) {
		rl.clients[ip] = &ipCounter{count: 1, resetAt: now.Add(rl.window), lastSeen: now}
		return true
	}

	entry.lastSeen = now
	if entry.count >= rl.limit {
		return false
	}

	entry.count++
	return true
}

func (rl *RateLimiter) gcLoop() {
	t := time.NewTicker(2 * time.Minute)
	defer t.Stop()

	for range t.C {
		now := time.Now()
		rl.mu.Lock()
		for ip, entry := range rl.clients {
			if now.Sub(entry.lastSeen) > 10*time.Minute {
				delete(rl.clients, ip)
			}
		}
		rl.mu.Unlock()
	}
}

func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
