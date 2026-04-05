package middleware

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"
)

type TokenAuth struct {
	token string
}

func NewTokenAuth(token string) *TokenAuth {
	return &TokenAuth{token: token}
}

func (ta *TokenAuth) Handle(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 从 Header 获取 token
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			ta.writeError(w, "missing authorization header")
			return
		}

		// 支持 "Bearer <token>" 或直接 "<token>"
		parts := strings.SplitN(authHeader, " ", 2)
		token := authHeader
		if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
			token = parts[1]
		}

		if token != ta.token || ta.token == "" {
			ta.writeError(w, "invalid token")
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (ta *TokenAuth) writeError(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"code":      http.StatusUnauthorized,
		"message":   message,
		"timestamp": time.Now().Unix(),
	})
}
