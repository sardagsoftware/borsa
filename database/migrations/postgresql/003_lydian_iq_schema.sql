-- LyDian IQ Database Schema
-- Migration 003: Core tables for LyDian IQ module
-- White-Hat Policy: Real production schema, no mock data

-- Signals table (real-time event ingestion)
CREATE TABLE IF NOT EXISTS signals (
  id BIGSERIAL PRIMARY KEY,
  signal_id VARCHAR(50) UNIQUE NOT NULL,
  signal_type VARCHAR(100) NOT NULL,
  source VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  payload JSONB NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  idempotency_key VARCHAR(100) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for signals
CREATE INDEX idx_signals_signal_id ON signals(signal_id);
CREATE INDEX idx_signals_type ON signals(signal_type);
CREATE INDEX idx_signals_source ON signals(source);
CREATE INDEX idx_signals_timestamp ON signals(timestamp DESC);
CREATE INDEX idx_signals_created_at ON signals(created_at DESC);
CREATE INDEX idx_signals_payload ON signals USING GIN (payload);

-- Knowledge Graph Nodes table
CREATE TABLE IF NOT EXISTS kg_nodes (
  id BIGSERIAL PRIMARY KEY,
  node_id VARCHAR(50) UNIQUE NOT NULL,
  node_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(100),
  properties JSONB DEFAULT '{}'::jsonb,
  idempotency_key VARCHAR(100) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_node_type CHECK (
    node_type IN ('entity', 'concept', 'event', 'attribute')
  )
);

-- Indexes for kg_nodes
CREATE INDEX idx_kg_nodes_node_id ON kg_nodes(node_id);
CREATE INDEX idx_kg_nodes_type ON kg_nodes(node_type);
CREATE INDEX idx_kg_nodes_entity_type ON kg_nodes(entity_type);
CREATE INDEX idx_kg_nodes_properties ON kg_nodes USING GIN (properties);
CREATE INDEX idx_kg_nodes_created_at ON kg_nodes(created_at DESC);

-- Knowledge Graph Edges table (relationships)
CREATE TABLE IF NOT EXISTS kg_edges (
  id BIGSERIAL PRIMARY KEY,
  edge_id VARCHAR(50) UNIQUE NOT NULL,
  source_node_id VARCHAR(50) NOT NULL REFERENCES kg_nodes(node_id) ON DELETE CASCADE,
  target_node_id VARCHAR(50) NOT NULL REFERENCES kg_nodes(node_id) ON DELETE CASCADE,
  edge_type VARCHAR(100) NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  weight NUMERIC(10,4) DEFAULT 1.0,
  idempotency_key VARCHAR(100) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT different_nodes CHECK (source_node_id != target_node_id),
  CONSTRAINT positive_weight CHECK (weight > 0)
);

-- Indexes for kg_edges
CREATE INDEX idx_kg_edges_edge_id ON kg_edges(edge_id);
CREATE INDEX idx_kg_edges_source ON kg_edges(source_node_id);
CREATE INDEX idx_kg_edges_target ON kg_edges(target_node_id);
CREATE INDEX idx_kg_edges_type ON kg_edges(edge_type);
CREATE INDEX idx_kg_edges_created_at ON kg_edges(created_at DESC);

-- Insights table (AI-derived insights)
CREATE TABLE IF NOT EXISTS insights (
  id BIGSERIAL PRIMARY KEY,
  insight_id VARCHAR(50) UNIQUE NOT NULL,
  insight_type VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  confidence_score NUMERIC(5,4),
  data JSONB DEFAULT '{}'::jsonb,
  source_signals JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT valid_confidence CHECK (
    confidence_score >= 0 AND confidence_score <= 1
  ),
  CONSTRAINT valid_insight_status CHECK (
    status IN ('active', 'archived', 'invalidated')
  )
);

-- Indexes for insights
CREATE INDEX idx_insights_insight_id ON insights(insight_id);
CREATE INDEX idx_insights_type ON insights(insight_type);
CREATE INDEX idx_insights_status ON insights(status);
CREATE INDEX idx_insights_confidence ON insights(confidence_score DESC);
CREATE INDEX idx_insights_created_at ON insights(created_at DESC);
CREATE INDEX idx_insights_expires_at ON insights(expires_at) WHERE expires_at IS NOT NULL;

-- Indicators table (dashboard metrics)
CREATE TABLE IF NOT EXISTS indicators (
  id BIGSERIAL PRIMARY KEY,
  indicator_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  indicator_type VARCHAR(100) NOT NULL,
  value NUMERIC NOT NULL,
  unit VARCHAR(50),
  trend VARCHAR(20),
  metadata JSONB DEFAULT '{}'::jsonb,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_trend CHECK (
    trend IN ('up', 'down', 'stable', 'unknown') OR trend IS NULL
  )
);

-- Indexes for indicators
CREATE INDEX idx_indicators_indicator_id ON indicators(indicator_id);
CREATE INDEX idx_indicators_type ON indicators(indicator_type);
CREATE INDEX idx_indicators_calculated_at ON indicators(calculated_at DESC);

-- Updated_at trigger for kg_nodes
CREATE TRIGGER update_kg_nodes_updated_at BEFORE UPDATE ON kg_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE kg_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE kg_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicators ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access to signals"
  ON signals FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to kg_nodes"
  ON kg_nodes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to kg_edges"
  ON kg_edges FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to insights"
  ON insights FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to indicators"
  ON indicators FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE signals IS 'Real-time signal/event ingestion for analytics';
COMMENT ON TABLE kg_nodes IS 'Knowledge graph nodes (entities, concepts, events)';
COMMENT ON TABLE kg_edges IS 'Knowledge graph edges (relationships between nodes)';
COMMENT ON TABLE insights IS 'AI-derived insights from signals and knowledge graph';
COMMENT ON TABLE indicators IS 'Dashboard indicators and KPIs';

-- Materialized view for signal statistics (performance optimization)
CREATE MATERIALIZED VIEW IF NOT EXISTS signal_stats AS
SELECT
  signal_type,
  COUNT(*) as total_count,
  MIN(timestamp) as first_seen,
  MAX(timestamp) as last_seen,
  COUNT(DISTINCT source) as unique_sources
FROM signals
GROUP BY signal_type;

CREATE INDEX idx_signal_stats_type ON signal_stats(signal_type);

-- Function to refresh signal stats
CREATE OR REPLACE FUNCTION refresh_signal_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY signal_stats;
END;
$$ LANGUAGE plpgsql;
