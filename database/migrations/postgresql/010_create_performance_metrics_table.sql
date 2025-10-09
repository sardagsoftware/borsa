-- Performance Metrics Table for APM System
-- Tracks HTTP requests, database queries, and custom metrics

CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    environment VARCHAR(50) NOT NULL,
    app_name VARCHAR(100) NOT NULL DEFAULT 'LyDian Platform',

    -- Metric Type
    type VARCHAR(50) NOT NULL, -- 'http_request', 'database_query', 'external_api', 'cache_hit', 'cache_miss', 'custom'
    duration INTEGER, -- milliseconds

    -- HTTP Request Metrics
    method VARCHAR(10),
    path VARCHAR(500),
    status_code INTEGER,
    content_length BIGINT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(100),
    user_agent TEXT,

    -- Database Query Metrics
    query TEXT,
    rows INTEGER,

    -- External API Metrics
    url VARCHAR(1000),

    -- Cache Metrics
    cache_key VARCHAR(255),

    -- Custom Metrics
    custom_name VARCHAR(255),
    custom_value NUMERIC,
    custom_tags JSONB,

    CONSTRAINT valid_metric_type CHECK (type IN ('http_request', 'database_query', 'external_api', 'cache_hit', 'cache_miss', 'custom'))
);

-- Indexes for fast queries
CREATE INDEX idx_perf_timestamp ON performance_metrics(timestamp DESC);
CREATE INDEX idx_perf_type ON performance_metrics(type);
CREATE INDEX idx_perf_environment ON performance_metrics(environment);
CREATE INDEX idx_perf_path ON performance_metrics(path) WHERE path IS NOT NULL;
CREATE INDEX idx_perf_duration ON performance_metrics(duration) WHERE duration IS NOT NULL;
CREATE INDEX idx_perf_user_id ON performance_metrics(user_id) WHERE user_id IS NOT NULL;

-- Composite indexes
CREATE INDEX idx_perf_type_timestamp ON performance_metrics(type, timestamp DESC);
CREATE INDEX idx_perf_env_type ON performance_metrics(environment, type, timestamp DESC);

-- Hypertable for TimescaleDB (optional, if using TimescaleDB)
-- SELECT create_hypertable('performance_metrics', 'timestamp', if_not_exists => TRUE);

-- Auto-delete old metrics (retention: 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_performance_metrics()
RETURNS void AS $$
BEGIN
    DELETE FROM performance_metrics
    WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- RLS
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can see all metrics
CREATE POLICY perf_metrics_admin_all
    ON performance_metrics
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
              AND user_roles.role_name IN ('SUPER_ADMIN', 'ADMIN')
        )
    );

-- Grant permissions
GRANT SELECT, INSERT ON performance_metrics TO authenticated;

COMMENT ON TABLE performance_metrics IS 'Application performance monitoring metrics';
