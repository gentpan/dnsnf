package repository

import (
	"context"

	"giantaccel/internal/models"
)

// UpsertRdnsRecordsBatch inserts or updates PTR records in a single batch query.
// On conflict (ip, ptr), it updates scanned_at to now.
func (p *PostgresRepository) UpsertRdnsRecordsBatch(ctx context.Context, ips, ptrs []string) error {
	if len(ips) == 0 {
		return nil
	}
	_, err := p.pool.Exec(ctx, `
		INSERT INTO rdns_records (ip, ptr, scanned_at)
		SELECT unnest($1::text[]), unnest($2::text[]), NOW()
		ON CONFLICT (ip, ptr) DO UPDATE SET scanned_at = NOW()
	`, ips, ptrs)
	return err
}

// SearchRdnsByPTR finds stored PTR records matching keyword with left/middle/right mode.
func (p *PostgresRepository) SearchRdnsByPTR(ctx context.Context, keyword, mode string, limit int) ([]models.RdnsRecord, error) {
	var pattern string
	switch mode {
	case "left":
		pattern = keyword + "%"
	case "right":
		pattern = "%" + keyword
	default:
		pattern = "%" + keyword + "%"
	}

	rows, err := p.pool.Query(ctx, `
		SELECT id, ip, ptr, scanned_at
		FROM rdns_records
		WHERE ptr LIKE $1
		ORDER BY scanned_at DESC
		LIMIT $2
	`, pattern, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []models.RdnsRecord
	for rows.Next() {
		var r models.RdnsRecord
		if err := rows.Scan(&r.ID, &r.IP, &r.PTR, &r.ScannedAt); err != nil {
			return nil, err
		}
		records = append(records, r)
	}
	return records, rows.Err()
}
