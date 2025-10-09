-- ==========================================
-- Migration 011 ROLLBACK: OAuth Columns
-- Remove OAuth provider columns from users table
-- ==========================================

-- Drop indexes first
DROP INDEX IF EXISTS idx_users_googleId;
DROP INDEX IF EXISTS idx_users_githubId;

-- Note: SQLite doesn't support DROP COLUMN directly
-- To properly rollback, you would need to:
-- 1. Create a new table without these columns
-- 2. Copy data from old table
-- 3. Drop old table
-- 4. Rename new table

-- For safety, this rollback is manual
-- DO NOT RUN in production without backup

SELECT 'Rollback requires manual intervention for SQLite' as warning;
