-- ============================================================================
-- AILYDIAN Authentication System - Database Schema
-- ============================================================================
-- Complete production-ready authentication with email and OAuth support
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Users Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,

  -- Password auth (nullable for OAuth-only users)
  password_hash VARCHAR(255),

  -- Profile information
  name VARCHAR(255),
  avatar_url TEXT,

  -- OAuth provider information
  provider VARCHAR(50), -- 'email', 'google', 'microsoft', 'github', 'apple'
  provider_id VARCHAR(255), -- Provider's user ID
  provider_data JSONB, -- Additional provider-specific data

  -- Account status
  is_active BOOLEAN DEFAULT TRUE,
  is_admin BOOLEAN DEFAULT FALSE,
  role VARCHAR(50) DEFAULT 'user', -- 'user', 'admin', 'moderator'

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  login_count INTEGER DEFAULT 0,

  -- Constraints
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT provider_check CHECK (provider IN ('email', 'google', 'microsoft', 'github', 'apple'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at DESC);

-- ============================================================================
-- Sessions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Session tokens
  session_token VARCHAR(255) UNIQUE NOT NULL,
  refresh_token VARCHAR(255) UNIQUE,

  -- Session metadata
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,

  -- Expiration
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  revoked_at TIMESTAMP,
  revoked_reason VARCHAR(255)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(user_id, is_active, expires_at);

-- ============================================================================
-- Email Verification Tokens
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,

  -- Expiration (24 hours)
  expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Usage tracking
  verified_at TIMESTAMP,
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_verification_user ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_expires ON email_verification_tokens(expires_at);

-- ============================================================================
-- Password Reset Tokens
-- ============================================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,

  -- Expiration (1 hour)
  expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Usage tracking
  used_at TIMESTAMP,
  ip_address INET,
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reset_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_reset_expires ON password_reset_tokens(expires_at);

-- ============================================================================
-- OAuth Accounts (for linking multiple providers to one user)
-- ============================================================================
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Provider information
  provider VARCHAR(50) NOT NULL, -- 'google', 'microsoft', 'github', 'apple'
  provider_account_id VARCHAR(255) NOT NULL,
  provider_email VARCHAR(255),

  -- Tokens
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,

  -- Provider data
  provider_data JSONB,
  scope TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP,

  -- Constraints
  UNIQUE(provider, provider_account_id),
  CONSTRAINT oauth_provider_check CHECK (provider IN ('google', 'microsoft', 'github', 'apple'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_oauth_user ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_provider ON oauth_accounts(provider, provider_account_id);

-- ============================================================================
-- Login Attempts (for rate limiting and security)
-- ============================================================================
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  ip_address INET NOT NULL,

  -- Attempt details
  success BOOLEAN DEFAULT FALSE,
  failure_reason VARCHAR(255),

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,

  -- Rate limiting window (cleanup old records)
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attempts_email ON login_attempts(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_ip ON login_attempts(ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_expires ON login_attempts(expires_at);

-- ============================================================================
-- Audit Log (for security and compliance)
-- ============================================================================
CREATE TABLE IF NOT EXISTS auth_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Event information
  event_type VARCHAR(100) NOT NULL, -- 'login', 'logout', 'register', 'password_change', etc.
  event_status VARCHAR(50) NOT NULL, -- 'success', 'failure', 'pending'

  -- Context
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,

  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_user ON auth_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event ON auth_audit_log(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_created ON auth_audit_log(created_at DESC);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger: Auto-update updated_at for users
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at for oauth_accounts
CREATE TRIGGER update_oauth_updated_at BEFORE UPDATE ON oauth_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Cleanup expired tokens (run via cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM email_verification_tokens WHERE expires_at < CURRENT_TIMESTAMP;
  DELETE FROM password_reset_tokens WHERE expires_at < CURRENT_TIMESTAMP;
  DELETE FROM login_attempts WHERE expires_at < CURRENT_TIMESTAMP;
  DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP AND is_active = FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Initial Data (optional)
-- ============================================================================

-- Example: Create system admin user (optional, comment out if not needed)
-- INSERT INTO users (email, email_verified, password_hash, name, role, is_admin)
-- VALUES (
--   'admin@ailydian.com',
--   TRUE,
--   '$2b$12$example_hash', -- Replace with actual bcrypt hash
--   'System Administrator',
--   'admin',
--   TRUE
-- ) ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- Grants (adjust based on your database user)
-- ============================================================================

-- Example grants for application user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ailydian_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ailydian_app;

-- ============================================================================
-- Success Message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ AILYDIAN Authentication System schema created successfully!';
  RAISE NOTICE '📊 Tables created: users, sessions, email_verification_tokens, password_reset_tokens, oauth_accounts, login_attempts, auth_audit_log';
  RAISE NOTICE '🔒 Ready for production use with email and OAuth authentication';
END $$;
