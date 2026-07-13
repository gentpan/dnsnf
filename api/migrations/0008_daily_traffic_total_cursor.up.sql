ALTER TABLE traffic_stats_baseline
  ADD COLUMN IF NOT EXISTS total_started_date DATE NOT NULL DEFAULT ((NOW() AT TIME ZONE 'UTC')::date),
  ADD COLUMN IF NOT EXISTS total_through_date DATE NOT NULL DEFAULT ((NOW() AT TIME ZONE 'UTC')::date - 1);
