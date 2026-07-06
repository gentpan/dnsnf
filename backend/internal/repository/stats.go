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

func (p *PostgresRepository) GetTrafficStatsCursor(ctx context.Context) (models.TrafficStatsCursor, error) {
	var cursor models.TrafficStatsCursor
	err := p.pool.QueryRow(ctx, `
		INSERT INTO traffic_stats_baseline (key, started_at, last_checked_at, total_requests)
		VALUES ('cloudflare_requests_total', NOW(), NOW(), 0)
		ON CONFLICT (key) DO UPDATE SET key = EXCLUDED.key
		RETURNING started_at, last_checked_at, total_requests
	`).Scan(&cursor.StartedAt, &cursor.LastCheckedAt, &cursor.TotalRequests)
	return cursor, err
}

func (p *PostgresRepository) UpdateTrafficStatsCursor(ctx context.Context, checkedAt time.Time, totalRequests int64) error {
	_, err := p.pool.Exec(ctx, `
		UPDATE traffic_stats_baseline
		SET last_checked_at = $1, total_requests = $2
		WHERE key = 'cloudflare_requests_total'
	`, checkedAt, totalRequests)
	return err
}
