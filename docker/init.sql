-- AILYDIAN AI LENS TRADER Database Initialization
-- This script runs on first PostgreSQL container startup

\c ailydian_borsa;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create initial user for development
DO $$
BEGIN
    -- Add any custom initialization logic here
    RAISE NOTICE 'AILYDIAN AI LENS TRADER database initialized successfully!';
END $$;
