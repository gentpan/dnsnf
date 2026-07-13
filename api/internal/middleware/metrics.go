package middleware

import (
	"net/http"
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	// HTTPRequestsTotal 总请求数计数器
	HTTPRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "path", "status"},
	)

	// HTTPRequestDuration 请求耗时直方图
	HTTPRequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "HTTP request duration in seconds",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "path"},
	)

	// HTTPRequestSize 请求大小
	HTTPRequestSize = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_size_bytes",
			Help:    "HTTP request size in bytes",
			Buckets: prometheus.ExponentialBuckets(100, 10, 8),
		},
		[]string{"method", "path"},
	)

	// HTTPResponseSize 响应大小
	HTTPResponseSize = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_response_size_bytes",
			Help:    "HTTP response size in bytes",
			Buckets: prometheus.ExponentialBuckets(100, 10, 8),
		},
		[]string{"method", "path"},
	)

	// DNSQueriesTotal DNS 查询总数
	DNSQueriesTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "dns_queries_total",
			Help: "Total number of DNS queries",
		},
		[]string{"type", "cached", "status"},
	)

	// DNSQueryDuration DNS 查询耗时
	DNSQueryDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "dns_query_duration_seconds",
			Help:    "DNS query duration in seconds",
			Buckets: []float64{.001, .005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10},
		},
		[]string{"type"},
	)

	// CacheHitsTotal 缓存命中数
	CacheHitsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "cache_hits_total",
			Help: "Total number of cache hits",
		},
		[]string{"cache_type", "hit"},
	)

	// ActiveConnections 活跃连接数
	ActiveConnections = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "http_active_connections",
			Help: "Number of active HTTP connections",
		},
	)
)

// Metrics 指标收集中间件
type Metrics struct{}

func NewMetrics() *Metrics {
	return &Metrics{}
}

func (m *Metrics) Handle(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ActiveConnections.Inc()
		defer ActiveConnections.Dec()

		start := time.Now()
		
		// 包装 ResponseWriter 以捕获状态码和响应大小
		rec := &metricsResponseWriter{ResponseWriter: w, statusCode: http.StatusOK}
		
		next.ServeHTTP(rec, r)
		
		duration := time.Since(start).Seconds()
		path := sanitizePath(r.URL.Path)
		status := strconv.Itoa(rec.statusCode)
		
		// 记录指标
		HTTPRequestsTotal.WithLabelValues(r.Method, path, status).Inc()
		HTTPRequestDuration.WithLabelValues(r.Method, path).Observe(duration)
		HTTPRequestSize.WithLabelValues(r.Method, path).Observe(float64(r.ContentLength))
		HTTPResponseSize.WithLabelValues(r.Method, path).Observe(float64(rec.size))
	})
}

// metricsResponseWriter 包装 http.ResponseWriter 以捕获指标
type metricsResponseWriter struct {
	http.ResponseWriter
	statusCode int
	size       int
}

func (w *metricsResponseWriter) WriteHeader(code int) {
	w.statusCode = code
	w.ResponseWriter.WriteHeader(code)
}

func (w *metricsResponseWriter) Write(b []byte) (int, error) {
	n, err := w.ResponseWriter.Write(b)
	w.size += n
	return n, err
}

// sanitizePath 清理路径，避免标签基数爆炸
func sanitizePath(path string) string {
	// 将动态路径归一化
	switch {
	case path == "/health":
		return "/health"
	case path == "/v1/dns/lookup":
		return "/v1/dns/lookup"
	case path == "/v1/dns/rdns":
		return "/v1/dns/rdns"
	case path == "/v2/dns/rdns":
		return "/v2/dns/rdns"
	case path == "/v1/dns/history":
		return "/v1/dns/history"
	case path == "/v2/dns/history":
		return "/v2/dns/history"
	case path == "/v2/dns/rdns-records":
		return "/v2/dns/rdns-records"
	case path == "/metrics":
		return "/metrics"
	default:
		return "/other"
	}
}

// RecordDNSQuery 记录 DNS 查询指标
func RecordDNSQuery(queryType string, cached bool, duration time.Duration) {
	cachedStr := "false"
	if cached {
		cachedStr = "true"
	}
	DNSQueriesTotal.WithLabelValues(queryType, cachedStr, "success").Inc()
	DNSQueryDuration.WithLabelValues(queryType).Observe(duration.Seconds())
}

// RecordDNSQueryError 记录 DNS 查询错误
func RecordDNSQueryError(queryType string) {
	DNSQueriesTotal.WithLabelValues(queryType, "false", "error").Inc()
}

// RecordCacheHit 记录缓存命中
func RecordCacheHit(cacheType string, hit bool) {
	hitStr := "false"
	if hit {
		hitStr = "true"
	}
	CacheHitsTotal.WithLabelValues(cacheType, hitStr).Inc()
}
