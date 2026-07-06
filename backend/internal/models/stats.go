package models

import "time"

type StatsOverview struct {
	QueryProjects int       `json:"query_projects"`
	TodayRequests int64     `json:"today_requests"`
	TotalQueries  int64     `json:"total_queries"`
	TodayVisitors int64     `json:"today_visitors"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type TrafficStats struct {
	Range     string    `json:"range"`
	Requests  int64     `json:"requests"`
	Visitors  int64     `json:"visitors"`
	UpdatedAt time.Time `json:"updated_at"`
}

type TrafficStatsCursor struct {
	StartedAt     time.Time
	LastCheckedAt time.Time
	TotalRequests int64
}
