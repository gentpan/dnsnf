package middleware

import (
	"log/slog"
	"net/http"
	"strings"
	"time"
)

type RequestLogger struct {
	logger *slog.Logger
}

func NewRequestLogger(logger *slog.Logger) *RequestLogger {
	return &RequestLogger{logger: logger}
}

type statusRecorder struct {
	http.ResponseWriter
	status int
	size   int
}

func (w *statusRecorder) WriteHeader(code int) {
	w.status = code
	w.ResponseWriter.WriteHeader(code)
}

func (w *statusRecorder) Write(b []byte) (int, error) {
	n, err := w.ResponseWriter.Write(b)
	w.size += n
	return n, err
}

func (l *RequestLogger) Handle(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		
		// 提取真实客户端 IP
		clientIP := extractClientIP(r)
		
		// 记录请求 ID（如果存在）
		requestID := r.Header.Get("X-Request-ID")
		if requestID == "" {
			requestID = generateRequestID()
		}
		
		next.ServeHTTP(rec, r)
		
		duration := time.Since(start)
		
		// 构建日志属性
		attrs := []slog.Attr{
			slog.String("request_id", requestID),
			slog.String("method", r.Method),
			slog.String("path", r.URL.Path),
			slog.String("query", r.URL.RawQuery),
			slog.Int("status", rec.status),
			slog.Int("size_bytes", rec.size),
			slog.Float64("duration_ms", float64(duration.Nanoseconds())/1e6),
			slog.String("client_ip", clientIP),
			slog.String("user_agent", truncateString(r.UserAgent(), 200)),
			slog.String("referer", truncateString(r.Referer(), 200)),
		}
		
		// 转换 slog.Attr 为 any
		args := make([]any, len(attrs))
		for i, attr := range attrs {
			args[i] = attr
		}
		
		// 根据状态码选择日志级别
		if rec.status >= 500 {
			l.logger.Error("http_request_error", args...)
		} else if rec.status >= 400 {
			l.logger.Warn("http_request_warning", args...)
		} else {
			l.logger.Info("http_request", args...)
		}
	})
}

func extractClientIP(r *http.Request) string {
	// 优先从 X-Forwarded-For 获取
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}
	
	// 其次从 X-Real-IP 获取
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return strings.TrimSpace(xri)
	}
	
	// 最后从 RemoteAddr 获取
	host, _, _ := strings.Cut(r.RemoteAddr, ":")
	return host
}

func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

func generateRequestID() string {
	// 简单实现，生产环境可以使用 UUID
	return time.Now().Format("20060102150405") + "-" + randomString(8)
}

func randomString(n int) string {
	const letters = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[time.Now().UnixNano()%int64(len(letters))]
	}
	return string(b)
}
