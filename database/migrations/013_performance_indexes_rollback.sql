-- ==========================================
-- Migration 013 ROLLBACK: Performance Indexes
-- Remove performance indexes for security features
-- ==========================================

-- Activity Log Indexes
DROP INDEX IF EXISTS idx_activity_log_userId_createdAt;
DROP INDEX IF EXISTS idx_activity_log_action;
DROP INDEX IF EXISTS idx_activity_log_ipAddress;

-- Email Verification Indexes
DROP INDEX IF EXISTS idx_email_verification_userId;
DROP INDEX IF EXISTS idx_email_verification_expiresAt;

-- Password Reset Indexes
DROP INDEX IF EXISTS idx_password_reset_userId;
DROP INDEX IF EXISTS idx_password_reset_expiresAt;

-- Users Table Indexes
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_status;
DROP INDEX IF EXISTS idx_users_lastLogin;
DROP INDEX IF EXISTS idx_users_createdAt;

-- Sessions Table Indexes
DROP INDEX IF EXISTS idx_sessions_userId_expiresAt;
DROP INDEX IF EXISTS idx_sessions_token;
DROP INDEX IF EXISTS idx_sessions_lastActivity;

-- Rollback complete
SELECT 'Migration 013 rollback completed successfully' as message;
