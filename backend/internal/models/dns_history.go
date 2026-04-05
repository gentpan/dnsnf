package models

import "time"

type DnsHistoryRecord struct {
	ID          int64     `json:"id"`
	Domain      string    `json:"domain"`
	RecordType  string    `json:"record_type"`
	RecordValue string    `json:"record_value"`
	FirstSeenAt time.Time `json:"first_seen_at"`
	LastSeenAt  time.Time `json:"last_seen_at"`
	Source      string    `json:"source"`
}
