package middleware

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"time"
)

type Recovery struct {
	logger *slog.Logger
}

func NewRecovery(logger *slog.Logger) *Recovery {
	return &Recovery{logger: logger}
}

func (r *Recovery) Handle(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				r.logger.Error("panic recovered", "panic", rec, "path", req.URL.Path)
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				_ = json.NewEncoder(w).Encode(map[string]any{
					"code":      http.StatusInternalServerError,
					"message":   "internal server error",
					"timestamp": time.Now().Unix(),
				})
			}
		}()
		next.ServeHTTP(w, req)
	})
}
