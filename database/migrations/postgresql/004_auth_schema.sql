-- Authentication & Security Database Schema
-- Migration 004: Core tables for authentication system
-- White-Hat Policy: Real production schema, no mock data
-- Supports: API Key, OAuth2/JWT, HMAC authentication

-- Users table (core identity)
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  organization_id VARCHAR(50),
  role VARCHAR(50) DEFAULT 'user',
  status VARCHAR(20) DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_role CHECK (
    role IN ('user', 'admin', 'developer', 'analyst', 'viewer')
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('active', 'suspended', 'pending', 'deleted')
  )
);

-- Indexes for users
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- API Keys table (API Key authentication)
CREATE TABLE IF NOT EXISTS api_keys (
  id BIGSERIAL PRIMARY KEY,
  key_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA256 hash
  user_id VARCHAR(50) NOT NULL,
  organization_id VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  scopes JSONB DEFAULT '[]'::jsonb,
  rate_limit_per_hour INTEGER DEFAULT 1000,
  status VARCHAR(20) DEFAULT 'active',
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT positive_rate_limit CHECK (rate_limit_per_hour > 0),
  CONSTRAINT valid_key_status CHECK (
    status IN ('active', 'revoked', 'expired')
  )
);

-- Indexes for api_keys
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_organization_id ON api_keys(organization_id);
CREATE INDEX idx_api_keys_status ON api_keys(status);
CREATE INDEX idx_api_keys_expires_at ON api_keys(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_api_keys_created_at ON api_keys(created_at DESC);

-- API Key Usage table (rate limiting & analytics)
CREATE TABLE IF NOT EXISTS api_key_usage (
  id BIGSERIAL PRIMARY KEY,
  api_key_id BIGINT NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_http_method CHECK (
    method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS')
  )
);

-- Indexes for api_key_usage
CREATE INDEX idx_api_key_usage_key_id ON api_key_usage(api_key_id);
CREATE INDEX idx_api_key_usage_timestamp ON api_key_usage(timestamp DESC);
CREATE INDEX idx_api_key_usage_endpoint ON api_key_usage(endpoint);
CREATE INDEX idx_api_key_usage_key_timestamp ON api_key_usage(api_key_id, timestamp DESC);

-- HMAC Keys table (HMAC signature authentication)
CREATE TABLE IF NOT EXISTS hmac_keys (
  id BIGSERIAL PRIMARY KEY,
  key_id VARCHAR(50) UNIQUE NOT NULL,
  secret VARCHAR(64) NOT NULL, -- HMAC secret (hex-encoded)
  user_id VARCHAR(50) NOT NULL,
  organization_id VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  scopes JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'active',
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_hmac_status CHECK (
    status IN ('active', 'revoked', 'expired')
  )
);

-- Indexes for hmac_keys
CREATE INDEX idx_hmac_keys_key_id ON hmac_keys(key_id);
CREATE INDEX idx_hmac_keys_user_id ON hmac_keys(user_id);
CREATE INDEX idx_hmac_keys_organization_id ON hmac_keys(organization_id);
CREATE INDEX idx_hmac_keys_status ON hmac_keys(status);
CREATE INDEX idx_hmac_keys_expires_at ON hmac_keys(expires_at) WHERE expires_at IS NOT NULL;

-- HMAC Signatures Used table (replay attack prevention)
CREATE TABLE IF NOT EXISTS hmac_signatures_used (
  id BIGSERIAL PRIMARY KEY,
  signature_id VARCHAR(100) UNIQUE NOT NULL,
  key_id VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for hmac_signatures_used
CREATE INDEX idx_hmac_signatures_signature_id ON hmac_signatures_used(signature_id);
CREATE INDEX idx_hmac_signatures_key_id ON hmac_signatures_used(key_id);
CREATE INDEX idx_hmac_signatures_timestamp ON hmac_signatures_used(timestamp DESC);
CREATE INDEX idx_hmac_signatures_created_at ON hmac_signatures_used(created_at DESC);

-- HMAC Key Usage table (analytics)
CREATE TABLE IF NOT EXISTS hmac_key_usage (
  id BIGSERIAL PRIMARY KEY,
  key_id BIGINT NOT NULL REFERENCES hmac_keys(id) ON DELETE CASCADE,
  endpoint VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL,
  ip_address VARCHAR(45),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_hmac_method CHECK (
    method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS')
  )
);

-- Indexes for hmac_key_usage
CREATE INDEX idx_hmac_key_usage_key_id ON hmac_key_usage(key_id);
CREATE INDEX idx_hmac_key_usage_timestamp ON hmac_key_usage(timestamp DESC);
CREATE INDEX idx_hmac_key_usage_endpoint ON hmac_key_usage(endpoint);

-- Token Blacklist table (OAuth2 token revocation)
CREATE TABLE IF NOT EXISTS token_blacklist (
  id BIGSERIAL PRIMARY KEY,
  token_jti VARCHAR(100) UNIQUE NOT NULL,
  reason VARCHAR(255) DEFAULT 'user_requested',
  revoked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_revoke_reason CHECK (
    reason IN ('user_requested', 'admin_revoked', 'security_breach', 'expired', 'password_reset')
  )
);

-- Indexes for token_blacklist
CREATE INDEX idx_token_blacklist_jti ON token_blacklist(token_jti);
CREATE INDEX idx_token_blacklist_revoked_at ON token_blacklist(revoked_at DESC);

-- Organizations table (multi-tenancy)
CREATE TABLE IF NOT EXISTS organizations (
  id BIGSERIAL PRIMARY KEY,
  organization_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  tier VARCHAR(50) DEFAULT 'free',
  status VARCHAR(20) DEFAULT 'active',
  rate_limit_multiplier NUMERIC(4,2) DEFAULT 1.0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_tier CHECK (
    tier IN ('free', 'starter', 'professional', 'enterprise')
  ),
  CONSTRAINT valid_org_status CHECK (
    status IN ('active', 'suspended', 'deleted')
  ),
  CONSTRAINT positive_multiplier CHECK (rate_limit_multiplier > 0)
);

-- Indexes for organizations
CREATE INDEX idx_organizations_org_id ON organizations(organization_id);
CREATE INDEX idx_organizations_tier ON organizations(tier);
CREATE INDEX idx_organizations_status ON organizations(status);

-- Permissions table (RBAC)
CREATE TABLE IF NOT EXISTS permissions (
  id BIGSERIAL PRIMARY KEY,
  permission_id VARCHAR(50) UNIQUE NOT NULL,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_action CHECK (
    action IN ('create', 'read', 'update', 'delete', 'list', 'execute', 'admin')
  ),
  CONSTRAINT unique_resource_action UNIQUE (resource, action)
);

-- Indexes for permissions
CREATE INDEX idx_permissions_permission_id ON permissions(permission_id);
CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_resource_action ON permissions(resource, action);

-- Role Permissions table (RBAC mapping)
CREATE TABLE IF NOT EXISTS role_permissions (
  id BIGSERIAL PRIMARY KEY,
  role VARCHAR(50) NOT NULL,
  permission_id VARCHAR(50) NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_role_perm CHECK (
    role IN ('user', 'admin', 'developer', 'analyst', 'viewer')
  ),
  CONSTRAINT unique_role_permission UNIQUE (role, permission_id)
);

-- Indexes for role_permissions
CREATE INDEX idx_role_permissions_role ON role_permissions(role);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Rate Limit Buckets table (distributed rate limiting)
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  id BIGSERIAL PRIMARY KEY,
  bucket_key VARCHAR(255) UNIQUE NOT NULL,
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT positive_count CHECK (request_count >= 0),
  CONSTRAINT valid_window CHECK (window_end > window_start)
);

-- Indexes for rate_limit_buckets
CREATE INDEX idx_rate_limit_buckets_key ON rate_limit_buckets(bucket_key);
CREATE INDEX idx_rate_limit_buckets_window_end ON rate_limit_buckets(window_end);

-- Audit Log table (security events)
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(50),
  organization_id VARCHAR(50),
  event_type VARCHAR(100) NOT NULL,
  resource VARCHAR(100),
  action VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_audit_action CHECK (
    action IN ('create', 'read', 'update', 'delete', 'login', 'logout', 'auth_failure', 'permission_denied')
  )
);

-- Indexes for audit_logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);

-- Updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hmac_keys_updated_at BEFORE UPDATE ON hmac_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE hmac_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE hmac_signatures_used ENABLE ROW LEVEL SECURITY;
ALTER TABLE hmac_key_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Service role full access policies
CREATE POLICY "Service role has full access to users"
  ON users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to api_keys"
  ON api_keys FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to api_key_usage"
  ON api_key_usage FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to hmac_keys"
  ON hmac_keys FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to hmac_signatures_used"
  ON hmac_signatures_used FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to hmac_key_usage"
  ON hmac_key_usage FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to token_blacklist"
  ON token_blacklist FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to organizations"
  ON organizations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to permissions"
  ON permissions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to role_permissions"
  ON role_permissions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to rate_limit_buckets"
  ON rate_limit_buckets FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to audit_logs"
  ON audit_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Helper function: Clean expired signatures (run periodically)
CREATE OR REPLACE FUNCTION clean_expired_hmac_signatures()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete signatures older than 10 minutes (2x the tolerance window)
  DELETE FROM hmac_signatures_used
  WHERE created_at < NOW() - INTERVAL '10 minutes';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Helper function: Clean old API key usage logs (run periodically)
CREATE OR REPLACE FUNCTION clean_old_usage_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete usage logs older than retention period
  DELETE FROM api_key_usage
  WHERE timestamp < NOW() - (retention_days || ' days')::INTERVAL;

  DELETE FROM hmac_key_usage
  WHERE timestamp < NOW() - (retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Helper function: Clean expired rate limit buckets
CREATE OR REPLACE FUNCTION clean_expired_rate_limit_buckets()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete buckets where window has ended
  DELETE FROM rate_limit_buckets
  WHERE window_end < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Helper function: Update last_used_at for API keys
CREATE OR REPLACE FUNCTION update_api_key_last_used(p_key_hash VARCHAR)
RETURNS void AS $$
BEGIN
  UPDATE api_keys
  SET last_used_at = NOW()
  WHERE key_hash = p_key_hash;
END;
$$ LANGUAGE plpgsql;

-- Helper function: Update last_used_at for HMAC keys
CREATE OR REPLACE FUNCTION update_hmac_key_last_used(p_key_id VARCHAR)
RETURNS void AS $$
BEGIN
  UPDATE hmac_keys
  SET last_used_at = NOW()
  WHERE key_id = p_key_id;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE users IS 'Core user identity table';
COMMENT ON TABLE api_keys IS 'API Key authentication credentials (hashed)';
COMMENT ON TABLE api_key_usage IS 'API Key usage logs for rate limiting and analytics';
COMMENT ON TABLE hmac_keys IS 'HMAC signature authentication keys';
COMMENT ON TABLE hmac_signatures_used IS 'Used HMAC signatures for replay attack prevention';
COMMENT ON TABLE hmac_key_usage IS 'HMAC key usage logs for analytics';
COMMENT ON TABLE token_blacklist IS 'Revoked OAuth2/JWT tokens';
COMMENT ON TABLE organizations IS 'Multi-tenant organizations';
COMMENT ON TABLE permissions IS 'RBAC permission definitions';
COMMENT ON TABLE role_permissions IS 'RBAC role-to-permission mapping';
COMMENT ON TABLE rate_limit_buckets IS 'Distributed rate limiting buckets';
COMMENT ON TABLE audit_logs IS 'Security and activity audit trail';

-- Materialized view for API key statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS api_key_stats AS
SELECT
  api_keys.id,
  api_keys.name,
  api_keys.user_id,
  api_keys.organization_id,
  COUNT(api_key_usage.id) as total_requests,
  MIN(api_key_usage.timestamp) as first_used,
  MAX(api_key_usage.timestamp) as last_used,
  COUNT(DISTINCT DATE(api_key_usage.timestamp)) as days_active
FROM api_keys
LEFT JOIN api_key_usage ON api_keys.id = api_key_usage.api_key_id
WHERE api_keys.status = 'active'
GROUP BY api_keys.id, api_keys.name, api_keys.user_id, api_keys.organization_id;

CREATE INDEX idx_api_key_stats_user_id ON api_key_stats(user_id);
CREATE INDEX idx_api_key_stats_org_id ON api_key_stats(organization_id);

-- Function to refresh API key stats
CREATE OR REPLACE FUNCTION refresh_api_key_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY api_key_stats;
END;
$$ LANGUAGE plpgsql;
