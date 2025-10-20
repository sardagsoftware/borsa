-- ==========================================
-- Migration 013: Performance Indexes
-- Add performance indexes for security features
-- ==========================================

-- Activity Log Indexes (for suspicious activity detection)
CREATE INDEX IF NOT EXISTS idx_activity_log_userId_createdAt ON activity_log(userId, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_ipAddress ON activity_log(ipAddress);

-- Email Verification Indexes
CREATE INDEX IF NOT EXISTS idx_email_verification_userId ON email_verification(userId);
CREATE INDEX IF NOT EXISTS idx_email_verification_expiresAt ON email_verification(expiresAt);

-- Password Reset Indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_userId ON password_reset(userId);
CREATE INDEX IF NOT EXISTS idx_password_reset_expiresAt ON password_reset(expiresAt);

-- Users Table Additional Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_lastLogin ON users(lastLogin);
CREATE INDEX IF NOT EXISTS idx_users_createdAt ON users(createdAt);

-- Sessions Table Additional Indexes (beyond migration 012)
CREATE INDEX IF NOT EXISTS idx_sessions_userId_expiresAt ON sessions(userId, expiresAt DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_lastActivity ON sessions(lastActivity);

-- Migration complete
SELECT 'Migration 013 (Performance Indexes) completed successfully' as message;
