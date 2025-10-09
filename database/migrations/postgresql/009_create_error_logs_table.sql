-- Error Logs Table for Monitoring System
-- Stores application errors, exceptions, and critical events

CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_id VARCHAR(100) UNIQUE NOT NULL,

    -- Timestamps
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Application Context
    environment VARCHAR(50) NOT NULL, -- 'development', 'staging', 'production'
    app_name VARCHAR(100) NOT NULL DEFAULT 'LyDian Platform',
    version VARCHAR(50),

    -- Error Details
    message TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    stack TEXT,
    code VARCHAR(100),

    -- Classification
    category VARCHAR(50) NOT NULL, -- 'api', 'database', 'authentication', etc.
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'

    -- User Context
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),

    -- Request Context (for API errors)
    request_data JSONB,
    query_data JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- User Agent Info
    user_agent TEXT,
    browser VARCHAR(100),
    os VARCHAR(100),

    -- Status
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT,

    -- Indexes for fast queries
    CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT valid_category CHECK (category IN ('api', 'database', 'authentication', 'rate_limit', 'validation', 'external_service', 'internal'))
);

-- Indexes
CREATE INDEX idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_category ON error_logs(category);
CREATE INDEX idx_error_logs_environment ON error_logs(environment);
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_error_logs_error_id ON error_logs(error_id);
CREATE INDEX idx_error_logs_resolved ON error_logs(resolved) WHERE resolved = FALSE;

-- Composite indexes for common queries
CREATE INDEX idx_error_logs_env_severity ON error_logs(environment, severity, timestamp DESC);
CREATE INDEX idx_error_logs_category_timestamp ON error_logs(category, timestamp DESC);

-- Function to auto-delete old error logs (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS void AS $$
BEGIN
    -- Delete error logs older than 90 days (except critical ones)
    DELETE FROM error_logs
    WHERE timestamp < NOW() - INTERVAL '90 days'
      AND severity != 'critical';

    -- Delete critical error logs older than 1 year
    DELETE FROM error_logs
    WHERE timestamp < NOW() - INTERVAL '1 year'
      AND severity = 'critical';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (run daily at 3 AM)
-- Note: This requires pg_cron extension
-- SELECT cron.schedule('cleanup-error-logs', '0 3 * * *', 'SELECT cleanup_old_error_logs()');

-- Row Level Security (RLS)
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can see all errors
CREATE POLICY error_logs_admin_all
    ON error_logs
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
              AND user_roles.role_name IN ('SUPER_ADMIN', 'ADMIN')
        )
    );

-- Policy: Users can only see their own errors
CREATE POLICY error_logs_user_own
    ON error_logs
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT ON error_logs TO authenticated;
GRANT UPDATE, DELETE ON error_logs TO authenticated; -- Only for admins via RLS

-- Comments
COMMENT ON TABLE error_logs IS 'Application error tracking and monitoring';
COMMENT ON COLUMN error_logs.error_id IS 'Unique error identifier for tracking';
COMMENT ON COLUMN error_logs.severity IS 'Error severity: low, medium, high, critical';
COMMENT ON COLUMN error_logs.category IS 'Error category for classification';
COMMENT ON COLUMN error_logs.request_data IS 'Request context (method, URL, headers, etc.)';
COMMENT ON COLUMN error_logs.metadata IS 'Additional error context and debugging info';
