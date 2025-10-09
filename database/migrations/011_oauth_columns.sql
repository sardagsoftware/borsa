-- ==========================================
-- Migration 011: OAuth Columns
-- Add OAuth provider columns to users table
-- ==========================================

-- Add Google OAuth ID
ALTER TABLE users ADD COLUMN googleId TEXT;

-- Add GitHub OAuth ID
ALTER TABLE users ADD COLUMN githubId TEXT;

-- Add 2FA backup codes (JSON array stored as TEXT)
ALTER TABLE users ADD COLUMN twoFactorBackupCodes TEXT;

-- Create indexes for OAuth columns
CREATE INDEX IF NOT EXISTS idx_users_googleId ON users(googleId);
CREATE INDEX IF NOT EXISTS idx_users_githubId ON users(githubId);

-- Migration complete
SELECT 'Migration 011 (OAuth Columns) completed successfully' as message;
