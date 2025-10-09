-- ========================================
-- LYDIAN DATABASE INITIALIZATION
-- Creates necessary extensions and schemas
-- ========================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS lydian_app;
CREATE SCHEMA IF NOT EXISTS lydian_temporal;
CREATE SCHEMA IF NOT EXISTS lydian_audit;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA lydian_app TO lydian;
GRANT ALL PRIVILEGES ON SCHEMA lydian_temporal TO lydian;
GRANT ALL PRIVILEGES ON SCHEMA lydian_audit TO lydian;

-- Create audit trigger function (for compliance)
CREATE OR REPLACE FUNCTION lydian_audit.audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO lydian_audit.audit_log (table_name, operation, row_data, changed_at)
        VALUES (TG_TABLE_NAME, 'INSERT', row_to_json(NEW), NOW());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO lydian_audit.audit_log (table_name, operation, row_data, old_row_data, changed_at)
        VALUES (TG_TABLE_NAME, 'UPDATE', row_to_json(NEW), row_to_json(OLD), NOW());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO lydian_audit.audit_log (table_name, operation, old_row_data, changed_at)
        VALUES (TG_TABLE_NAME, 'DELETE', row_to_json(OLD), NOW());
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create audit log table
CREATE TABLE IF NOT EXISTS lydian_audit.audit_log (
    id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    row_data JSONB,
    old_row_data JSONB,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    changed_by TEXT DEFAULT CURRENT_USER
);

CREATE INDEX idx_audit_log_table_name ON lydian_audit.audit_log(table_name);
CREATE INDEX idx_audit_log_changed_at ON lydian_audit.audit_log(changed_at);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Lydian database initialized successfully';
END
$$;
