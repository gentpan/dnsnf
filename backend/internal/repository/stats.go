package repository

import (
	"context"
	"time"

	"giantaccel/internal/models"
)

func (p *PostgresRepository) GetStatsOverview(ctx context.Context) (models.StatsOverview, error) {
	var out models.StatsOverview
	out.QueryProjects = 8
	out.UpdatedAt = time.Now().UTC()

	err := p.pool.QueryRow(ctx, `
		SELECT
			COUNT(*) FILTER (WHERE created_at >= date_trunc('day', NOW())) AS today_requests,
			COUNT(*) AS total_queries,
			COUNT(DISTINCT client_ip) FILTER (WHERE created_at >= date_trunc('day', NOW())) AS today_visitors
		FROM dns_logs
	`).Scan(&out.TodayRequests, &out.TotalQueries, &out.TodayVisitors)
	return out, err
}

func (p *PostgresRepository) GetTrafficStatsStartedAt(ctx context.Context) (time.Time, error) {
	var startedAt time.Time
	err := p.pool.QueryRow(ctx, `
		INSERT INTO traffic_stats_baseline (key)
		VALUES ('cloudflare_requests_total')
		ON CONFLICT (key) DO UPDATE SET key = EXCLUDED.key
		RETURNING started_at
	`).Scan(&startedAt)
	return startedAt, err
}
