-- İnsan IQ Database Schema
-- Migration 002: Core tables for İnsan IQ module
-- White-Hat Policy: Real production schema, no mock data

-- Personas table (personality profiles)
CREATE TABLE IF NOT EXISTS personas (
  id BIGSERIAL PRIMARY KEY,
  persona_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  personality TEXT NOT NULL,
  expertise JSONB DEFAULT '[]'::jsonb,
  language VARCHAR(10) NOT NULL,
  description TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  idempotency_key VARCHAR(100) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_language CHECK (
    language IN ('tr', 'en', 'de', 'fr', 'es', 'it', 'ar', 'zh', 'ja', 'ru')
  )
);

-- Indexes for personas
CREATE INDEX idx_personas_persona_id ON personas(persona_id);
CREATE INDEX idx_personas_language ON personas(language);
CREATE INDEX idx_personas_created_at ON personas(created_at DESC);
CREATE INDEX idx_personas_idempotency_key ON personas(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Skills table (marketplace)
CREATE TABLE IF NOT EXISTS skills (
  id BIGSERIAL PRIMARY KEY,
  skill_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  version VARCHAR(50) NOT NULL,
  capabilities JSONB DEFAULT '[]'::jsonb,
  pricing JSONB NOT NULL,
  author_id VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  idempotency_key VARCHAR(100) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_skill_status CHECK (
    status IN ('active', 'inactive', 'deprecated', 'archived')
  ),
  CONSTRAINT valid_category CHECK (
    category IN ('language', 'analysis', 'automation', 'data', 'communication', 'other')
  )
);

-- Indexes for skills
CREATE INDEX idx_skills_skill_id ON skills(skill_id);
CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_status ON skills(status);
CREATE INDEX idx_skills_created_at ON skills(created_at DESC);
CREATE INDEX idx_skills_author_id ON skills(author_id);

-- Assistants table
CREATE TABLE IF NOT EXISTS assistants (
  id BIGSERIAL PRIMARY KEY,
  assistant_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  persona_id VARCHAR(50) NOT NULL REFERENCES personas(persona_id) ON DELETE CASCADE,
  skills JSONB DEFAULT '[]'::jsonb,
  capabilities JSONB DEFAULT '[]'::jsonb,
  configuration JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(20) DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  idempotency_key VARCHAR(100) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_assistant_status CHECK (
    status IN ('active', 'inactive', 'training', 'maintenance')
  )
);

-- Indexes for assistants
CREATE INDEX idx_assistants_assistant_id ON assistants(assistant_id);
CREATE INDEX idx_assistants_persona_id ON assistants(persona_id);
CREATE INDEX idx_assistants_status ON assistants(status);
CREATE INDEX idx_assistants_created_at ON assistants(created_at DESC);

-- Sessions table (assistant conversations)
CREATE TABLE IF NOT EXISTS assistant_sessions (
  id BIGSERIAL PRIMARY KEY,
  session_id VARCHAR(50) UNIQUE NOT NULL,
  assistant_id VARCHAR(50) NOT NULL REFERENCES assistants(assistant_id) ON DELETE CASCADE,
  user_id VARCHAR(50),
  context JSONB DEFAULT '{}'::jsonb,
  messages JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_session_status CHECK (
    status IN ('active', 'paused', 'completed', 'terminated')
  )
);

-- Indexes for sessions
CREATE INDEX idx_sessions_session_id ON assistant_sessions(session_id);
CREATE INDEX idx_sessions_assistant_id ON assistant_sessions(assistant_id);
CREATE INDEX idx_sessions_user_id ON assistant_sessions(user_id);
CREATE INDEX idx_sessions_status ON assistant_sessions(status);
CREATE INDEX idx_sessions_started_at ON assistant_sessions(started_at DESC);

-- Assistant state table (runtime state)
CREATE TABLE IF NOT EXISTS assistant_states (
  id BIGSERIAL PRIMARY KEY,
  assistant_id VARCHAR(50) UNIQUE NOT NULL REFERENCES assistants(assistant_id) ON DELETE CASCADE,
  state_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  active_sessions_count INTEGER DEFAULT 0,
  total_messages_count BIGINT DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT non_negative_sessions CHECK (active_sessions_count >= 0),
  CONSTRAINT non_negative_messages CHECK (total_messages_count >= 0)
);

-- Indexes for assistant states
CREATE INDEX idx_assistant_states_assistant_id ON assistant_states(assistant_id);
CREATE INDEX idx_assistant_states_last_activity ON assistant_states(last_activity_at DESC);

-- Updated_at trigger for personas
CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON personas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for skills
CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for assistants
CREATE TRIGGER update_assistants_updated_at BEFORE UPDATE ON assistants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for assistant states
CREATE TRIGGER update_assistant_states_updated_at BEFORE UPDATE ON assistant_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_states ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access to personas"
  ON personas FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to skills"
  ON skills FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to assistants"
  ON assistants FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to sessions"
  ON assistant_sessions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to assistant states"
  ON assistant_states FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE personas IS 'Personality profiles for AI assistants';
COMMENT ON TABLE skills IS 'Skills marketplace for assistant capabilities';
COMMENT ON TABLE assistants IS 'AI assistants with personas and skills';
COMMENT ON TABLE assistant_sessions IS 'Conversation sessions between users and assistants';
COMMENT ON TABLE assistant_states IS 'Runtime state tracking for assistants';

-- Functions for state management
CREATE OR REPLACE FUNCTION increment_assistant_messages(p_assistant_id VARCHAR)
RETURNS void AS $$
BEGIN
  INSERT INTO assistant_states (assistant_id, total_messages_count, last_activity_at)
  VALUES (p_assistant_id, 1, NOW())
  ON CONFLICT (assistant_id)
  DO UPDATE SET
    total_messages_count = assistant_states.total_messages_count + 1,
    last_activity_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_assistant_sessions_count(p_assistant_id VARCHAR, p_delta INTEGER)
RETURNS void AS $$
BEGIN
  INSERT INTO assistant_states (assistant_id, active_sessions_count, last_activity_at)
  VALUES (p_assistant_id, p_delta, NOW())
  ON CONFLICT (assistant_id)
  DO UPDATE SET
    active_sessions_count = GREATEST(0, assistant_states.active_sessions_count + p_delta),
    last_activity_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
