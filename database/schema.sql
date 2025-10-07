-- ==========================================
-- AILYDIAN ULTRA PRO ENTERPRISE DATABASE SCHEMA
-- Complete Azure-Integrated Enterprise System
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- USER MANAGEMENT & AUTHENTICATION
-- ==========================================

-- Users table with Azure AD integration
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    azure_ad_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(200),
    avatar_url TEXT,
    phone VARCHAR(20),
    department VARCHAR(100),
    job_title VARCHAR(150),
    manager_id UUID REFERENCES users(id),

    -- Authentication
    password_hash VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,

    -- 2FA Settings
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    backup_codes TEXT[],

    -- Account Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin', 'developer', 'analyst')),

    -- Azure Integration
    azure_tenant_id VARCHAR(255),
    azure_subscription_id VARCHAR(255),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,

    -- Preferences
    preferences JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',

    -- Audit
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- User Sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255),
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    location JSONB,

    -- Session status
    active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Permissions
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(user_id, permission, resource)
);

-- ==========================================
-- ORGANIZATIONS & TENANTS
-- ==========================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    website VARCHAR(255),

    -- Azure Integration
    azure_tenant_id VARCHAR(255) UNIQUE,
    azure_subscription_id VARCHAR(255),

    -- Billing
    plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    billing_email VARCHAR(255),

    -- Settings
    settings JSONB DEFAULT '{}',

    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- User Organization Memberships
CREATE TABLE user_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    invited_by UUID REFERENCES users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, organization_id)
);

-- ==========================================
-- AI MODELS & INTEGRATIONS
-- ==========================================

CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    model_id VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,

    -- Capabilities
    capabilities TEXT[],
    context_length INTEGER,
    input_types TEXT[],
    output_types TEXT[],

    -- Configuration
    config JSONB DEFAULT '{}',
    pricing JSONB DEFAULT '{}',

    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deprecated')),
    available BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Model Preferences
CREATE TABLE user_model_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES ai_models(id),
    is_favorite BOOLEAN DEFAULT FALSE,
    custom_settings JSONB DEFAULT '{}',
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(user_id, model_id)
);

-- ==========================================
-- CONVERSATIONS & CHAT HISTORY
-- ==========================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    title VARCHAR(255),

    -- Configuration
    model_id UUID REFERENCES ai_models(id),
    system_prompt TEXT,
    settings JSONB DEFAULT '{}',

    -- Metadata
    message_count INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,

    -- Status
    archived BOOLEAN DEFAULT FALSE,
    shared BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),

    -- Content
    content TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content_type VARCHAR(50) DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'file', 'code')),

    -- AI Response Data
    model_id UUID REFERENCES ai_models(id),
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    response_time_ms INTEGER,

    -- Attachments
    attachments JSONB DEFAULT '[]',

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    edited_at TIMESTAMP WITH TIME ZONE,

    -- Search
    search_vector tsvector
);

-- ==========================================
-- NOTIFICATIONS SYSTEM
-- ==========================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'system')),
    category VARCHAR(50) DEFAULT 'general',

    -- Delivery
    channels TEXT[] DEFAULT ARRAY['web'],
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

    -- Status
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    archived BOOLEAN DEFAULT FALSE,

    -- Links & Actions
    action_url TEXT,
    action_label VARCHAR(100),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,

    -- Related entities
    related_type VARCHAR(100),
    related_id UUID
);

-- Notification Preferences
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,

    -- Channel preferences
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    web_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,

    -- Frequency
    frequency VARCHAR(20) DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'hourly', 'daily', 'weekly', 'never')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, category)
);

-- ==========================================
-- ANALYTICS & USAGE TRACKING
-- ==========================================

CREATE TABLE usage_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),

    -- Event data
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}',

    -- AI specific
    model_id UUID REFERENCES ai_models(id),
    tokens_used INTEGER,
    response_time_ms INTEGER,

    -- Request info
    ip_address INET,
    user_agent TEXT,
    session_id UUID,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Usage Tracking
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),

    -- API details
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,

    -- Usage metrics
    request_size INTEGER,
    response_size INTEGER,
    tokens_consumed INTEGER,

    -- Billing
    cost_cents INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- FILE MANAGEMENT
-- ==========================================

CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),

    -- File info
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT,

    -- Storage
    storage_provider VARCHAR(50) DEFAULT 'azure' CHECK (storage_provider IN ('azure', 'local')),
    storage_path TEXT NOT NULL,
    azure_blob_url TEXT,

    -- Processing
    processed BOOLEAN DEFAULT FALSE,
    processing_status VARCHAR(50) DEFAULT 'pending',
    processing_result JSONB DEFAULT '{}',

    -- Metadata
    metadata JSONB DEFAULT '{}',
    tags TEXT[],

    -- Access
    public BOOLEAN DEFAULT FALSE,
    access_token VARCHAR(255),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accessed_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- SYSTEM CONFIGURATION
-- ==========================================

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB,
    description TEXT,
    category VARCHAR(100) DEFAULT 'general',

    -- Access control
    public BOOLEAN DEFAULT FALSE,
    editable BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Feature Flags
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT FALSE,

    -- Targeting
    user_targeting JSONB DEFAULT '{}',
    organization_targeting JSONB DEFAULT '{}',
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- ==========================================
-- AUDIT LOGS
-- ==========================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),

    -- Action details
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,

    -- Data
    old_values JSONB,
    new_values JSONB,
    changes JSONB,

    -- Context
    ip_address INET,
    user_agent TEXT,
    session_id UUID,

    -- Result
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_azure_ad_id ON users(azure_ad_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_last_activity ON users(last_activity_at);

-- Sessions
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_active ON user_sessions(active, expires_at);

-- Conversations & Messages
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_org_id ON conversations(organization_id);
CREATE INDEX idx_conversations_updated ON conversations(updated_at);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_search ON messages USING gin(search_vector);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Analytics
CREATE INDEX idx_usage_analytics_user_id ON usage_analytics(user_id);
CREATE INDEX idx_usage_analytics_created_at ON usage_analytics(created_at);
CREATE INDEX idx_usage_analytics_event_type ON usage_analytics(event_type);
CREATE INDEX idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX idx_api_usage_created_at ON api_usage(created_at);

-- Files
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_org_id ON files(organization_id);
CREATE INDEX idx_files_storage_provider ON files(storage_provider);

-- Audit
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- ==========================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ==========================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- INITIAL DATA
-- ==========================================

-- Insert default AI models
INSERT INTO ai_models (name, provider, model_id, category, capabilities, context_length, status) VALUES
('Azure GPT-4 Omni', 'azure', 'azure-gpt-4o', 'MICROSOFT AZURE', ARRAY['text', 'vision', 'reasoning', 'code', 'analysis', 'multimodal'], 128000, 'active'),
('Azure GPT-4 Turbo', 'azure', 'azure-gpt-4-turbo', 'MICROSOFT AZURE', ARRAY['text', 'reasoning', 'code', 'analysis'], 128000, 'active'),
('Claude-3.5 Sonnet', 'anthropic', 'claude-3-5-sonnet', 'ANTHROPIC', ARRAY['text', 'reasoning', 'analysis', 'code'], 200000, 'active'),
('GPT-4 Turbo', 'openai', 'gpt-4-turbo', 'OPENAI', ARRAY['text', 'vision', 'reasoning', 'code'], 128000, 'active'),
('Gemini-2.0 Flash', 'google', 'gemini-2.0-flash-exp', 'GOOGLE', ARRAY['text', 'vision', 'reasoning', 'multimodal'], 1000000, 'active');

-- Insert default system settings
INSERT INTO system_settings (key, value, description, category) VALUES
('app_name', '"AiLydian Ultra Pro"', 'Application name', 'general'),
('app_version', '"2.1.0"', 'Current application version', 'general'),
('maintenance_mode', 'false', 'Enable maintenance mode', 'system'),
('registration_enabled', 'true', 'Allow new user registration', 'auth'),
('two_factor_required', 'false', 'Require 2FA for all users', 'security'),
('max_file_size', '10485760', 'Maximum file upload size in bytes', 'files'),
('session_timeout', '86400', 'Session timeout in seconds', 'auth');

-- Insert default feature flags
INSERT INTO feature_flags (name, description, enabled) VALUES
('azure_ad_integration', 'Enable Azure AD single sign-on', true),
('advanced_analytics', 'Enable advanced usage analytics', true),
('real_time_notifications', 'Enable real-time notification system', true),
('beta_features', 'Enable beta features for testing', false);

-- ==========================================
-- COMPLETION MESSAGE
-- ==========================================

-- Create a view for system status
CREATE VIEW system_status AS
SELECT
    'Database Schema' as component,
    'Initialized' as status,
    NOW() as last_updated;

SELECT 'AiLydian Ultra Pro Enterprise Database Schema created successfully!' as message;