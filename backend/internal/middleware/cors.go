package middleware

import "net/http"

type CORS struct {
	allowedOrigins map[string]struct{}
}

func NewCORS(origins []string) *CORS {
	m := make(map[string]struct{}, len(origins))
	for _, o := range origins {
		if o == "" {
			continue
		}
		m[o] = struct{}{}
	}
	return &CORS{allowedOrigins: m}
}

func (c *CORS) Handle(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" {
			if _, ok := c.allowedOrigins[origin]; ok {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Vary", "Origin")
				w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			}
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
