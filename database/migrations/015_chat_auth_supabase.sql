-- ==============================================
-- CHAT AUTHENTICATION SYSTEM - SUPABASE VERSION
-- Independent from main ailydian.com auth
-- ==============================================

-- Chat Users (Separate from main users table)
CREATE TABLE IF NOT EXISTS chat_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_chat_users_email ON chat_users(email);
CREATE INDEX IF NOT EXISTS idx_chat_users_status ON chat_users(status);

-- Chat User Sessions (Refresh tokens)
CREATE TABLE IF NOT EXISTS chat_user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES chat_users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    is_valid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_token ON chat_user_sessions(refresh_token);

-- Chat User Settings
CREATE TABLE IF NOT EXISTS chat_user_settings (
    user_id UUID PRIMARY KEY REFERENCES chat_users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'dark',
    language TEXT DEFAULT 'tr',
    font_size TEXT DEFAULT 'medium',
    preferred_model TEXT DEFAULT 'premium',
    auto_save_history BOOLEAN DEFAULT TRUE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    sound_enabled BOOLEAN DEFAULT TRUE,
    custom_settings JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Conversations (User-specific)
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES chat_users(id) ON DELETE CASCADE,
    title TEXT,
    model_used TEXT DEFAULT 'premium',
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_conv_user ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conv_updated ON chat_conversations(updated_at);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    model TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_msg_conv ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_msg_created ON chat_messages(created_at);

-- Password Reset Tokens
CREATE TABLE IF NOT EXISTS chat_password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES chat_users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_reset_token ON chat_password_resets(token);
CREATE INDEX IF NOT EXISTS idx_chat_reset_user ON chat_password_resets(user_id);

-- RLS Policies (Row Level Security)
ALTER TABLE chat_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_password_resets ENABLE ROW LEVEL SECURITY;

-- Service role can access all
CREATE POLICY "Service role full access" ON chat_users FOR ALL USING (true);
CREATE POLICY "Service role full access" ON chat_user_sessions FOR ALL USING (true);
CREATE POLICY "Service role full access" ON chat_user_settings FOR ALL USING (true);
CREATE POLICY "Service role full access" ON chat_conversations FOR ALL USING (true);
CREATE POLICY "Service role full access" ON chat_messages FOR ALL USING (true);
CREATE POLICY "Service role full access" ON chat_password_resets FOR ALL USING (true);

-- Helper function to increment message count
CREATE OR REPLACE FUNCTION increment_message_count(conv_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE chat_conversations
    SET message_count = message_count + 1, updated_at = NOW()
    WHERE id = conv_id;
END;
$$ LANGUAGE plpgsql;
