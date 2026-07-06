ALTER TABLE traffic_stats_baseline
  ADD COLUMN IF NOT EXISTS total_visitors BIGINT NOT NULL DEFAULT 0;
