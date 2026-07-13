CREATE TABLE IF NOT EXISTS dns_history (
    id            BIGSERIAL PRIMARY KEY,
    domain        TEXT          NOT NULL,
    record_type   VARCHAR(20)   NOT NULL,
    record_value  TEXT          NOT NULL,
    first_seen_at TIMESTAMPTZ   NOT NULL,
    last_seen_at  TIMESTAMPTZ   NOT NULL,
    source        VARCHAR(50)   NOT NULL DEFAULT 'local',
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (domain, record_type, record_value, source)
);

CREATE INDEX IF NOT EXISTS idx_dns_history_domain
    ON dns_history (domain, record_type);

CREATE INDEX IF NOT EXISTS idx_dns_history_last_seen
    ON dns_history (last_seen_at DESC);
