package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"giantaccel/internal/config"
	"giantaccel/internal/handlers"
	"giantaccel/internal/middleware"
	"giantaccel/internal/repository"
	"giantaccel/internal/services"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		panic(err)
	}

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	ctx := context.Background()

	pgRepo, err := repository.NewPostgres(ctx, cfg.PostgresDSN)
	if err != nil {
		logger.Error("failed to connect postgres", "error", err)
		os.Exit(1)
	}
	defer pgRepo.Close()

	redisStore := repository.NewRedisClient(repository.RedisConfig{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPass,
		DB:       cfg.RedisDB,
	}, logger)
	if err := redisStore.Ping(ctx); err != nil {
		logger.Error("failed to connect redis", "error", err)
		os.Exit(1)
	}
	defer func() {
		_ = redisStore.Close()
	}()

	resolver := services.NewNetResolver(cfg.DNSUpstream)
	dnsService := services.NewDNSService(redisStore, pgRepo, pgRepo, resolver, logger)
	cloudflareResolver := services.NewNetResolver([]string{"1.1.1.1:53", "1.0.0.1:53"})
	dnsService.SetResolvers("cloudflare", map[string]services.DNSResolver{
		"cloudflare":    cloudflareResolver,
		"google":        services.NewNetResolver([]string{"8.8.8.8:53", "8.8.4.4:53"}),
		"ali":           services.NewNetResolver([]string{"223.5.5.5:53", "223.6.6.6:53"}),
		"tencent":       services.NewNetResolver([]string{"119.29.29.29:53", "182.254.116.116:53"}),
		"local":         services.NewSystemResolver(),
		"authoritative": services.NewAuthoritativeResolver(cloudflareResolver),
	})
	dnsHandler := handlers.NewDNSHandler(dnsService)
	historyHandler := handlers.NewDnsHistoryHandler(pgRepo, cfg.InternalToken)
	rdnsHandler := handlers.NewRdnsRecordHandler(pgRepo, cfg.InternalToken)
	discoveryHandler := handlers.NewDiscoveryHandler(redisStore, pgRepo, cfg.DNSUpstream)
	trafficService := services.NewCloudflareAnalyticsService(services.CloudflareAnalyticsConfig{
		APIToken: cfg.CloudflareAPIToken,
		Email:    cfg.CloudflareEmail,
		APIKey:   cfg.CloudflareAPIKey,
		ZoneID:   cfg.CloudflareZoneID,
	}, redisStore, pgRepo)
	trafficHandler := handlers.NewTrafficHandler(trafficService)
	sslHandler := handlers.NewSSLHandler(redisStore)
	mailSecurityHandler := handlers.NewMailSecurityHandler(redisStore, cfg.DNSUpstream)
	blacklistHandler := handlers.NewBlacklistHandler(redisStore, cfg.DNSUpstream)
	propagationHandler := handlers.NewPropagationHandler(redisStore)
	healthCheckHandler := handlers.NewHealthCheckHandler(redisStore, cfg.DNSUpstream)
	ecsHandler := handlers.NewECSHandler(redisStore)
	takeoverHandler := handlers.NewTakeoverHandler(redisStore, discoveryHandler, cfg.DNSUpstream)

	loggerMW := middleware.NewRequestLogger(logger)
	// V1: public API, 60 requests per minute.
	v1Limiter := middleware.NewRateLimiter(60, time.Minute)
	// V2: 对内，Token认证，无限流
	v2TokenAuth := middleware.NewTokenAuth(cfg.InternalToken)
	recoveryMW := middleware.NewRecovery(logger)
	corsMW := middleware.NewCORS(cfg.CORSOrigins)
	metricsMW := middleware.NewMetrics()
	analyticsReporter := middleware.NewAnalyticsReporter(cfg.AnalyticsURL, cfg.InternalToken)
	router := handlers.NewRouter(dnsHandler, historyHandler, rdnsHandler, discoveryHandler, trafficHandler, sslHandler, mailSecurityHandler, blacklistHandler, propagationHandler, healthCheckHandler, ecsHandler, takeoverHandler, loggerMW, v1Limiter, recoveryMW, corsMW, metricsMW, v2TokenAuth, analyticsReporter)

	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
		IdleTimeout:  cfg.IdleTimeout,
	}

	go func() {
		logger.Info("server started", "addr", server.Addr, "env", cfg.AppEnv)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("server stopped unexpectedly", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	shutdownCtx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownGrace)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error("graceful shutdown failed", "error", err)
		_ = server.Close()
	}

	logger.Info("server exited")
}
