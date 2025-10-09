-- ==========================================
-- Migration 012: Session OAuth Columns
-- Add OAuth and session ID columns to sessions table
-- ==========================================

-- Add session ID for better tracking
ALTER TABLE sessions ADD COLUMN sessionId TEXT;

-- Add OAuth provider information
ALTER TABLE sessions ADD COLUMN provider TEXT;

-- Add OAuth tokens
ALTER TABLE sessions ADD COLUMN oauthAccessToken TEXT;
ALTER TABLE sessions ADD COLUMN oauthRefreshToken TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_sessionId ON sessions(sessionId);
CREATE INDEX IF NOT EXISTS idx_sessions_provider ON sessions(provider);
CREATE INDEX IF NOT EXISTS idx_sessions_expiresAt ON sessions(expiresAt);
CREATE INDEX IF NOT EXISTS idx_sessions_ipAddress ON sessions(ipAddress);

-- Migration complete
SELECT 'Migration 012 (Session OAuth Columns) completed successfully' as message;
