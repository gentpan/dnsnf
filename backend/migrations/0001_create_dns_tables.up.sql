CREATE TABLE IF NOT EXISTS dns_logs (
    id BIGSERIAL PRIMARY KEY,
    domain TEXT NOT NULL,
    query_type VARCHAR(10) NOT NULL,
    client_ip INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dns_logs_domain_created_at
ON dns_logs (domain, created_at DESC);

CREATE TABLE IF NOT EXISTS dns_cache_backup (
    domain TEXT NOT NULL,
    type VARCHAR(10) NOT NULL,
    response_json JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (domain, type)
);

CREATE INDEX IF NOT EXISTS idx_dns_cache_backup_updated_at
ON dns_cache_backup (updated_at DESC);
