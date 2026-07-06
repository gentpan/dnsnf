package handlers

import (
	"net/http"

	"giantaccel/docs"
	"giantaccel/internal/middleware"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func NewRouter(
	dns *DNSHandler,
	history *DnsHistoryHandler,
	rdns *RdnsRecordHandler,
	discovery *DiscoveryHandler,
	loggerMW *middleware.RequestLogger,
	v1Limiter *middleware.RateLimiter,
	recoverer *middleware.Recovery,
	cors *middleware.CORS,
	metrics *middleware.Metrics,
	v2TokenAuth *middleware.TokenAuth,
	analyticsReporter *middleware.AnalyticsReporter,
) http.Handler {
	// 创建子路由处理器
	v1Mux := http.NewServeMux()
	v2Mux := http.NewServeMux()
	publicMux := http.NewServeMux()

	// V1 路由 - 对外，有限流 (1分钟60次)
	v1Mux.HandleFunc("/v1/dns/lookup", dns.LookupDNS)
	v1Mux.HandleFunc("/v1/dns/history", history.Get)
	v1Mux.HandleFunc("/v1/dns/rdns", rdns.Search)
	v1Mux.HandleFunc("/v1/dns/reverse-ip", discovery.ReverseIP)
	v1Mux.HandleFunc("/v1/dns/subdomains", discovery.Subdomains)
	v1Mux.HandleFunc("/v1/dns/reverse-ns", discovery.ReverseNS)
	v1Mux.HandleFunc("/v1/dns/reverse-mx", discovery.ReverseMX)
	v1Mux.HandleFunc("/v1/dns/dnssec", discovery.DNSSEC)
	v1Mux.HandleFunc("/v1/dns/stats/overview", discovery.StatsOverview)

	// V2 路由 - 对内，需 Token，无限流
	v2Mux.HandleFunc("/v2/dns/lookup", dns.LookupDNS)
	v2Mux.HandleFunc("/v2/dns/history", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			history.Get(w, r)
		case http.MethodPost:
			history.Upsert(w, r)
		default:
			writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"code": 405, "message": "method not allowed"})
		}
	})
	v2Mux.HandleFunc("/v2/dns/rdns", rdns.Search)
	v2Mux.HandleFunc("/v2/dns/rdns-records", rdns.Upsert)

	// 公共路由 - 健康检查等
	publicMux.HandleFunc("/health", dns.Health)
	publicMux.Handle("/metrics", promhttp.Handler())
	publicMux.HandleFunc("/swagger.json", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(docs.GetSwaggerJSON())
	})
	publicMux.HandleFunc("/index.css", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/css; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("/* fallback css */"))
	})

	// 主路由
	mainMux := http.NewServeMux()

	// V1 路由 + 限流
	var v1Handler http.Handler = v1Mux
	v1Handler = v1Limiter.Handle(v1Handler)
	v1Handler = analyticsReporter.Handle(v1Handler)
	mainMux.Handle("/v1/", v1Handler)

	// V2 路由 + Token 认证（无限流）
	var v2Handler http.Handler = v2Mux
	v2Handler = v2TokenAuth.Handle(v2Handler)
	mainMux.Handle("/v2/", v2Handler)

	// 公共路由
	mainMux.Handle("/", publicMux)

	// 全局中间件
	var h http.Handler = mainMux
	h = recoverer.Handle(h)
	h = cors.Handle(h)
	h = metrics.Handle(h)
	h = loggerMW.Handle(h)
	return h
}
