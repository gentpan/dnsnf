package models

import "time"

type RdnsRecord struct {
	ID        int64     `json:"id"`
	IP        string    `json:"ip"`
	PTR       string    `json:"ptr"`
	ScannedAt time.Time `json:"scanned_at"`
}
