-- ==========================================
-- Migration 012 ROLLBACK: Session OAuth Columns
-- Remove OAuth and session ID columns from sessions table
-- ==========================================

-- Drop indexes first
DROP INDEX IF EXISTS idx_sessions_sessionId;
DROP INDEX IF EXISTS idx_sessions_provider;
DROP INDEX IF EXISTS idx_sessions_expiresAt;
DROP INDEX IF EXISTS idx_sessions_ipAddress;

-- Note: SQLite doesn't support DROP COLUMN directly
-- For safety, this rollback requires manual table recreation

SELECT 'Rollback requires manual intervention for SQLite' as warning;
