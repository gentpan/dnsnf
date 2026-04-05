package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PostgresRepository struct {
	pool *pgxpool.Pool
}

func NewPostgres(ctx context.Context, dsn string) (*PostgresRepository, error) {
	cfg, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("parse pg config: %w", err)
	}
	cfg.MaxConns = 20
	cfg.MinConns = 2
	cfg.MaxConnLifetime = 30 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("connect postgres: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("ping postgres: %w", err)
	}

	return &PostgresRepository{pool: pool}, nil
}

func (p *PostgresRepository) InsertDNSLog(ctx context.Context, domain, queryType, clientIP string) error {
	_, err := p.pool.Exec(ctx, `
		INSERT INTO dns_logs (domain, query_type, client_ip)
		VALUES ($1, $2, $3)
	`, domain, queryType, clientIP)
	return err
}

func (p *PostgresRepository) UpsertCacheBackup(ctx context.Context, domain, recordType string, responseJSON []byte) error {
	_, err := p.pool.Exec(ctx, `
		INSERT INTO dns_cache_backup (domain, type, response_json, updated_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (domain, type)
		DO UPDATE SET response_json = EXCLUDED.response_json, updated_at = EXCLUDED.updated_at
	`, domain, recordType, responseJSON)
	return err
}

func (p *PostgresRepository) Close() {
	p.pool.Close()
}
