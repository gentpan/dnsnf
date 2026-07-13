package repository

import (
	"context"
	"time"

	"giantaccel/internal/models"
)

// UpsertDnsHistoryBatch inserts or updates DNS history records in a single batch query.
// On conflict (domain, record_type, record_value, source), it expands the time window
// (takes earliest first_seen_at and latest last_seen_at).
func (p *PostgresRepository) UpsertDnsHistoryBatch(ctx context.Context, records []models.DnsHistoryRecord) error {
	if len(records) == 0 {
		return nil
	}

	domains := make([]string, len(records))
	types := make([]string, len(records))
	values := make([]string, len(records))
	firstSeen := make([]time.Time, len(records))
	lastSeen := make([]time.Time, len(records))
	sources := make([]string, len(records))

	for i, r := range records {
		domains[i] = r.Domain
		types[i] = r.RecordType
		values[i] = r.RecordValue
		firstSeen[i] = r.FirstSeenAt
		lastSeen[i] = r.LastSeenAt
		sources[i] = r.Source
	}

	_, err := p.pool.Exec(ctx, `
		INSERT INTO dns_history
			(domain, record_type, record_value, first_seen_at, last_seen_at, source)
		SELECT *
		FROM unnest(
			$1::text[], $2::text[], $3::text[],
			$4::timestamptz[], $5::timestamptz[], $6::text[]
		) AS t(domain, record_type, record_value, first_seen_at, last_seen_at, source)
		ON CONFLICT (domain, record_type, record_value, source) DO UPDATE SET
			first_seen_at = LEAST(dns_history.first_seen_at, EXCLUDED.first_seen_at),
			last_seen_at  = GREATEST(dns_history.last_seen_at, EXCLUDED.last_seen_at)
	`, domains, types, values, firstSeen, lastSeen, sources)

	return err
}

// GetDnsHistory returns history records for a domain, newest first.
func (p *PostgresRepository) GetDnsHistory(ctx context.Context, domain string, limit int) ([]models.DnsHistoryRecord, error) {
	rows, err := p.pool.Query(ctx, `
		SELECT id, domain, record_type, record_value, first_seen_at, last_seen_at, source
		FROM dns_history
		WHERE domain = $1
		ORDER BY last_seen_at DESC
		LIMIT $2
	`, domain, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []models.DnsHistoryRecord
	for rows.Next() {
		var r models.DnsHistoryRecord
		if err := rows.Scan(&r.ID, &r.Domain, &r.RecordType, &r.RecordValue, &r.FirstSeenAt, &r.LastSeenAt, &r.Source); err != nil {
			return nil, err
		}
		records = append(records, r)
	}
	return records, rows.Err()
}
