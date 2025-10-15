-- LCI Database Initialization Script
-- White-hat security: Enable necessary extensions only

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create database user with limited privileges (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'lci_app') THEN
    CREATE USER lci_app WITH PASSWORD 'lci_app_password_change_in_prod';
  END IF;
END
$$;

-- Grant necessary permissions
GRANT CONNECT ON DATABASE lci_db TO lci_app;
GRANT USAGE ON SCHEMA public TO lci_app;

-- Security: Revoke public schema creation rights
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- Logging
\echo 'LCI Database initialized successfully'
\echo 'Extensions enabled: uuid-ossp, pg_trgm, unaccent, pgcrypto'
\echo 'WARNING: Change default passwords in production!'
