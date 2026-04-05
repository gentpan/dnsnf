CREATE TABLE IF NOT EXISTS rdns_records (
    id         BIGSERIAL   PRIMARY KEY,
    ip         TEXT        NOT NULL,
    ptr        TEXT        NOT NULL,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (ip, ptr)
);

CREATE INDEX IF NOT EXISTS idx_rdns_records_ptr ON rdns_records (ptr);
CREATE INDEX IF NOT EXISTS idx_rdns_records_ip  ON rdns_records (ip);
