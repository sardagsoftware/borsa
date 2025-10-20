-- Smart Cities Database Schema
-- Migration 001: Core tables for Smart Cities module
-- White-Hat Policy: Real production schema, no mock data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
  id BIGSERIAL PRIMARY KEY,
  city_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  coordinates JSONB NOT NULL,
  population BIGINT NOT NULL,
  timezone VARCHAR(100) NOT NULL,
  idempotency_key VARCHAR(100) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT coordinates_format CHECK (
    coordinates ? 'latitude' AND
    coordinates ? 'longitude'
  ),
  CONSTRAINT valid_latitude CHECK (
    (coordinates->>'latitude')::FLOAT >= -90 AND
    (coordinates->>'latitude')::FLOAT <= 90
  ),
  CONSTRAINT valid_longitude CHECK (
    (coordinates->>'longitude')::FLOAT >= -180 AND
    (coordinates->>'longitude')::FLOAT <= 180
  ),
  CONSTRAINT positive_population CHECK (population > 0)
);

-- Indexes for cities
CREATE INDEX idx_cities_city_id ON cities(city_id);
CREATE INDEX idx_cities_created_at ON cities(created_at DESC);
CREATE INDEX idx_cities_name ON cities(name);
CREATE INDEX idx_cities_idempotency_key ON cities(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Assets table
CREATE TABLE IF NOT EXISTS city_assets (
  id BIGSERIAL PRIMARY KEY,
  asset_id VARCHAR(50) UNIQUE NOT NULL,
  city_id VARCHAR(50) NOT NULL REFERENCES cities(city_id) ON DELETE CASCADE,
  asset_type VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  location JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  idempotency_key VARCHAR(100) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT location_format CHECK (
    location ? 'latitude' AND
    location ? 'longitude'
  ),
  CONSTRAINT valid_asset_status CHECK (
    status IN ('active', 'inactive', 'maintenance', 'offline')
  )
);

-- Indexes for assets
CREATE INDEX idx_assets_asset_id ON city_assets(asset_id);
CREATE INDEX idx_assets_city_id ON city_assets(city_id);
CREATE INDEX idx_assets_type ON city_assets(asset_type);
CREATE INDEX idx_assets_created_at ON city_assets(created_at DESC);

-- City metrics table (real-time data)
CREATE TABLE IF NOT EXISTS city_metrics (
  id BIGSERIAL PRIMARY KEY,
  city_id VARCHAR(50) NOT NULL REFERENCES cities(city_id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Traffic metrics
  traffic_congestion_level NUMERIC(5,2) CHECK (traffic_congestion_level >= 0 AND traffic_congestion_level <= 100),
  traffic_avg_speed NUMERIC(6,2),
  traffic_incidents INTEGER DEFAULT 0,

  -- Energy metrics
  energy_total_consumption NUMERIC(15,2), -- kWh
  energy_renewable_percentage NUMERIC(5,2) CHECK (energy_renewable_percentage >= 0 AND energy_renewable_percentage <= 100),
  energy_grid_load NUMERIC(5,2),

  -- Air quality metrics
  air_aqi INTEGER CHECK (air_aqi >= 0 AND air_aqi <= 500),
  air_pm25 NUMERIC(8,2),
  air_pm10 NUMERIC(8,2),
  air_co2 NUMERIC(8,2),

  -- Water metrics
  water_consumption NUMERIC(15,2), -- liters
  water_quality_index NUMERIC(5,2) CHECK (water_quality_index >= 0 AND water_quality_index <= 100),
  water_pressure NUMERIC(6,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for metrics
CREATE INDEX idx_metrics_city_id ON city_metrics(city_id);
CREATE INDEX idx_metrics_timestamp ON city_metrics(timestamp DESC);
CREATE INDEX idx_metrics_city_timestamp ON city_metrics(city_id, timestamp DESC);

-- Events table
CREATE TABLE IF NOT EXISTS city_events (
  id BIGSERIAL PRIMARY KEY,
  event_id VARCHAR(50) UNIQUE NOT NULL,
  city_id VARCHAR(50) NOT NULL REFERENCES cities(city_id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  location JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  idempotency_key VARCHAR(100) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_event_severity CHECK (
    severity IN ('low', 'medium', 'high', 'critical')
  ),
  CONSTRAINT valid_event_type CHECK (
    event_type IN ('security', 'disaster', 'maintenance', 'traffic', 'environmental', 'other')
  )
);

-- Indexes for events
CREATE INDEX idx_events_event_id ON city_events(event_id);
CREATE INDEX idx_events_city_id ON city_events(city_id);
CREATE INDEX idx_events_type ON city_events(event_type);
CREATE INDEX idx_events_severity ON city_events(severity);
CREATE INDEX idx_events_timestamp ON city_events(timestamp DESC);

-- Alerts table
CREATE TABLE IF NOT EXISTS city_alerts (
  id BIGSERIAL PRIMARY KEY,
  alert_id VARCHAR(50) UNIQUE NOT NULL,
  city_id VARCHAR(50) NOT NULL REFERENCES cities(city_id) ON DELETE CASCADE,
  alert_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  idempotency_key VARCHAR(100) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT valid_alert_severity CHECK (
    severity IN ('low', 'medium', 'high', 'critical')
  ),
  CONSTRAINT valid_alert_status CHECK (
    status IN ('active', 'acknowledged', 'resolved', 'dismissed')
  )
);

-- Indexes for alerts
CREATE INDEX idx_alerts_alert_id ON city_alerts(alert_id);
CREATE INDEX idx_alerts_city_id ON city_alerts(city_id);
CREATE INDEX idx_alerts_severity ON city_alerts(severity);
CREATE INDEX idx_alerts_status ON city_alerts(status);
CREATE INDEX idx_alerts_created_at ON city_alerts(created_at DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON cities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON city_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON city_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_alerts ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access to cities"
  ON cities FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to assets"
  ON city_assets FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to metrics"
  ON city_metrics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to events"
  ON city_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to alerts"
  ON city_alerts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE cities IS 'Smart cities registry';
COMMENT ON TABLE city_assets IS 'IoT assets and sensors deployed in cities';
COMMENT ON TABLE city_metrics IS 'Real-time metrics for traffic, energy, air quality, and water';
COMMENT ON TABLE city_events IS 'City events (security, disaster, etc.)';
COMMENT ON TABLE city_alerts IS 'Active alerts for cities';
