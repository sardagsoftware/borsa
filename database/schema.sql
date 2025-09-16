/**
 * AILYDIAN GLOBAL TRADER - Database Schema Design
 * PostgreSQL + TimescaleDB for high-frequency tick data
 * © 2025 Emrah Şardağ - Ultra Pro Edition
 */

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- MARKET DATA TABLES
-- =====================================================

-- Main market data table (hypertable for time-series)
CREATE TABLE IF NOT EXISTS market_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    symbol VARCHAR(32) NOT NULL,
    asset_type VARCHAR(16) NOT NULL, -- stocks, crypto, commodities, forex, derivatives
    exchange VARCHAR(32),
    timestamp TIMESTAMPTZ NOT NULL,
    open DECIMAL(20,8),
    high DECIMAL(20,8),
    low DECIMAL(20,8),
    close DECIMAL(20,8),
    volume DECIMAL(20,8),
    value_usd DECIMAL(20,8),
    trades_count INTEGER,
    source VARCHAR(32) NOT NULL,
    quality_score DECIMAL(3,2) DEFAULT 1.0,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Convert to hypertable (time-series optimized)
SELECT create_hypertable('market_data', 'timestamp', 
    chunk_time_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

-- Create continuous aggregates for different timeframes
CREATE MATERIALIZED VIEW market_data_1min
WITH (timescaledb.continuous) AS
SELECT 
    symbol,
    asset_type,
    exchange,
    time_bucket('1 minute', timestamp) AS time_bucket,
    FIRST(open, timestamp) AS open,
    MAX(high) AS high,
    MIN(low) AS low,
    LAST(close, timestamp) AS close,
    SUM(volume) AS volume,
    COUNT(*) AS ticks_count,
    AVG(quality_score) AS avg_quality
FROM market_data
GROUP BY symbol, asset_type, exchange, time_bucket;

CREATE MATERIALIZED VIEW market_data_5min
WITH (timescaledb.continuous) AS
SELECT 
    symbol,
    asset_type,
    exchange,
    time_bucket('5 minutes', timestamp) AS time_bucket,
    FIRST(open, timestamp) AS open,
    MAX(high) AS high,
    MIN(low) AS low,
    LAST(close, timestamp) AS close,
    SUM(volume) AS volume,
    COUNT(*) AS ticks_count,
    AVG(quality_score) AS avg_quality
FROM market_data
GROUP BY symbol, asset_type, exchange, time_bucket;

-- =====================================================
-- TRADING TABLES
-- =====================================================

-- Trading accounts
CREATE TABLE IF NOT EXISTS trading_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    account_type VARCHAR(16) NOT NULL, -- demo, live, paper
    exchange VARCHAR(32) NOT NULL,
    api_key_hash VARCHAR(128),
    balance DECIMAL(20,8) DEFAULT 0,
    equity DECIMAL(20,8) DEFAULT 0,
    margin_used DECIMAL(20,8) DEFAULT 0,
    margin_free DECIMAL(20,8) DEFAULT 0,
    currency VARCHAR(8) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    risk_settings JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trading orders
CREATE TABLE IF NOT EXISTS trading_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    account_id UUID REFERENCES trading_accounts(id),
    symbol VARCHAR(32) NOT NULL,
    asset_type VARCHAR(16) NOT NULL,
    order_type VARCHAR(16) NOT NULL, -- market, limit, stop, stop_limit
    side VARCHAR(4) NOT NULL, -- buy, sell
    quantity DECIMAL(20,8) NOT NULL,
    price DECIMAL(20,8),
    stop_price DECIMAL(20,8),
    status VARCHAR(16) DEFAULT 'pending', -- pending, partial, filled, canceled, rejected
    filled_quantity DECIMAL(20,8) DEFAULT 0,
    avg_fill_price DECIMAL(20,8),
    commission DECIMAL(20,8) DEFAULT 0,
    exchange_order_id VARCHAR(128),
    placed_at TIMESTAMPTZ DEFAULT NOW(),
    filled_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    metadata JSONB
);

-- Trading positions
CREATE TABLE IF NOT EXISTS trading_positions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    account_id UUID REFERENCES trading_accounts(id),
    symbol VARCHAR(32) NOT NULL,
    asset_type VARCHAR(16) NOT NULL,
    side VARCHAR(4) NOT NULL, -- long, short
    quantity DECIMAL(20,8) NOT NULL,
    avg_entry_price DECIMAL(20,8) NOT NULL,
    current_price DECIMAL(20,8),
    unrealized_pnl DECIMAL(20,8) DEFAULT 0,
    realized_pnl DECIMAL(20,8) DEFAULT 0,
    commission_paid DECIMAL(20,8) DEFAULT 0,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    metadata JSONB,
    UNIQUE(account_id, symbol, side)
);

-- =====================================================
-- AI TRADING TABLES
-- =====================================================

-- AI trading strategies
CREATE TABLE IF NOT EXISTS ai_strategies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    strategy_type VARCHAR(32) NOT NULL, -- trend_follow, mean_reversion, ml_signal, quantum_ml, sentiment_aware
    parameters JSONB NOT NULL,
    risk_parameters JSONB,
    performance_metrics JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI strategy backtests
CREATE TABLE IF NOT EXISTS strategy_backtests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    strategy_id UUID REFERENCES ai_strategies(id),
    symbol VARCHAR(32) NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    initial_balance DECIMAL(20,8) NOT NULL,
    final_balance DECIMAL(20,8) NOT NULL,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    max_drawdown DECIMAL(5,2),
    sharpe_ratio DECIMAL(8,4),
    profit_factor DECIMAL(8,4),
    results JSONB,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI signals and predictions
CREATE TABLE IF NOT EXISTS ai_signals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    strategy_id UUID REFERENCES ai_strategies(id),
    symbol VARCHAR(32) NOT NULL,
    asset_type VARCHAR(16) NOT NULL,
    signal_type VARCHAR(16) NOT NULL, -- buy, sell, hold
    confidence DECIMAL(5,4) NOT NULL, -- 0.0000 to 1.0000
    predicted_price DECIMAL(20,8),
    target_price DECIMAL(20,8),
    stop_loss DECIMAL(20,8),
    take_profit DECIMAL(20,8),
    reasoning TEXT,
    features JSONB, -- ML features used
    quantum_data JSONB, -- quantum ML specific data
    sentiment_score DECIMAL(3,2), -- -1.00 to 1.00
    news_impact DECIMAL(3,2), -- 0.00 to 1.00
    trust_score DECIMAL(3,2), -- 0.00 to 1.00
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    outcome VARCHAR(16), -- success, failure, expired, ignored
    accuracy_score DECIMAL(5,4)
);

-- =====================================================
-- SENTIMENT & NEWS TABLES
-- =====================================================

-- Social sentiment data
CREATE TABLE IF NOT EXISTS social_sentiment (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    symbol VARCHAR(32) NOT NULL,
    source VARCHAR(32) NOT NULL, -- twitter, reddit, stocktwits
    platform_id VARCHAR(128),
    content TEXT,
    sentiment_score DECIMAL(3,2) NOT NULL, -- -1.00 to 1.00
    confidence DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00
    trust_score DECIMAL(3,2), -- source reliability 0.00 to 1.00
    author VARCHAR(128),
    author_followers INTEGER,
    likes_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    timestamp TIMESTAMPTZ NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Convert to hypertable
SELECT create_hypertable('social_sentiment', 'timestamp', 
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- News and events data
CREATE TABLE IF NOT EXISTS news_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    headline VARCHAR(512) NOT NULL,
    summary TEXT,
    content TEXT,
    source VARCHAR(128) NOT NULL,
    author VARCHAR(128),
    url VARCHAR(512),
    published_at TIMESTAMPTZ NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    symbols VARCHAR(32)[], -- affected symbols
    categories VARCHAR(32)[], -- earnings, merger, fed, geopolitical
    sentiment_score DECIMAL(3,2), -- -1.00 to 1.00
    importance_score DECIMAL(3,2), -- 0.00 to 1.00
    trust_score DECIMAL(3,2), -- source reliability
    market_impact_score DECIMAL(3,2), -- predicted market impact
    metadata JSONB
);

-- Convert to hypertable
SELECT create_hypertable('news_events', 'published_at', 
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- =====================================================
-- USER & AUTHENTICATION TABLES
-- =====================================================

-- Enhanced users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(64) UNIQUE,
    password_hash VARCHAR(128),
    first_name VARCHAR(64),
    last_name VARCHAR(64),
    phone VARCHAR(32),
    country_code VARCHAR(8),
    timezone VARCHAR(64) DEFAULT 'UTC',
    language VARCHAR(8) DEFAULT 'en',
    subscription_tier VARCHAR(16) DEFAULT 'free', -- free, pro, ultra
    subscription_expires_at TIMESTAMPTZ,
    risk_tolerance VARCHAR(16) DEFAULT 'medium', -- low, medium, high
    trading_experience VARCHAR(16) DEFAULT 'beginner',
    preferred_assets VARCHAR(16)[] DEFAULT '{}',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions with enhanced security
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(128) NOT NULL,
    refresh_token_hash VARCHAR(128),
    device_info JSONB,
    ip_address INET,
    location JSONB, -- country, city, lat, lng
    user_agent TEXT,
    is_mobile BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- QUANTUM ML TABLES
-- =====================================================

-- Quantum ML experiments
CREATE TABLE IF NOT EXISTS quantum_experiments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    experiment_type VARCHAR(32) NOT NULL, -- portfolio_opt, volatility_pred, option_pricing
    quantum_backend VARCHAR(32), -- ibm_quantum, aws_braket, pennylane
    circuit_depth INTEGER,
    qubits_used INTEGER,
    parameters JSONB NOT NULL,
    input_data JSONB,
    results JSONB,
    accuracy_metrics JSONB,
    execution_time_ms INTEGER,
    cost_estimate DECIMAL(10,4),
    status VARCHAR(16) DEFAULT 'pending', -- pending, running, completed, failed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Quantum ML predictions
CREATE TABLE IF NOT EXISTS quantum_predictions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    experiment_id UUID REFERENCES quantum_experiments(id),
    symbol VARCHAR(32) NOT NULL,
    prediction_type VARCHAR(32) NOT NULL, -- price, volatility, risk, correlation
    predicted_value DECIMAL(20,8),
    confidence_interval JSONB, -- {lower, upper, probability}
    quantum_confidence DECIMAL(5,4), -- quantum-specific confidence
    classical_baseline DECIMAL(20,8), -- comparison with classical ML
    feature_importance JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    actual_value DECIMAL(20,8), -- for accuracy tracking
    accuracy_score DECIMAL(5,4)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Market data indexes
CREATE INDEX idx_market_data_symbol_time ON market_data (symbol, timestamp DESC);
CREATE INDEX idx_market_data_asset_type ON market_data (asset_type);
CREATE INDEX idx_market_data_source ON market_data (source);
CREATE INDEX idx_market_data_quality ON market_data (quality_score);

-- Trading indexes
CREATE INDEX idx_trading_orders_account ON trading_orders (account_id);
CREATE INDEX idx_trading_orders_symbol ON trading_orders (symbol);
CREATE INDEX idx_trading_orders_status ON trading_orders (status);
CREATE INDEX idx_trading_positions_account ON trading_positions (account_id);

-- AI indexes
CREATE INDEX idx_ai_signals_strategy ON ai_signals (strategy_id);
CREATE INDEX idx_ai_signals_symbol ON ai_signals (symbol, generated_at DESC);
CREATE INDEX idx_ai_signals_confidence ON ai_signals (confidence DESC);

-- Sentiment indexes
CREATE INDEX idx_social_sentiment_symbol ON social_sentiment (symbol, timestamp DESC);
CREATE INDEX idx_social_sentiment_source ON social_sentiment (source);
CREATE INDEX idx_social_sentiment_score ON social_sentiment (sentiment_score);

-- News indexes
CREATE INDEX idx_news_events_symbols ON news_events USING GIN(symbols);
CREATE INDEX idx_news_events_published ON news_events (published_at DESC);
CREATE INDEX idx_news_events_importance ON news_events (importance_score DESC);

-- User indexes
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_subscription ON users (subscription_tier);
CREATE INDEX idx_user_sessions_user ON user_sessions (user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions (token_hash);

-- =====================================================
-- DATA RETENTION POLICIES
-- =====================================================

-- Keep detailed tick data for 30 days, then compress
SELECT add_retention_policy('market_data', INTERVAL '30 days');

-- Keep sentiment data for 90 days
SELECT add_retention_policy('social_sentiment', INTERVAL '90 days');

-- Keep news for 1 year
SELECT add_retention_policy('news_events', INTERVAL '1 year');

-- =====================================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- =====================================================

-- Function to get latest price for a symbol
CREATE OR REPLACE FUNCTION get_latest_price(p_symbol VARCHAR, p_asset_type VARCHAR)
RETURNS DECIMAL(20,8) AS $$
DECLARE
    latest_price DECIMAL(20,8);
BEGIN
    SELECT close INTO latest_price
    FROM market_data
    WHERE symbol = p_symbol AND asset_type = p_asset_type
    ORDER BY timestamp DESC
    LIMIT 1;
    
    RETURN latest_price;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate position PnL
CREATE OR REPLACE FUNCTION calculate_position_pnl(p_position_id UUID)
RETURNS DECIMAL(20,8) AS $$
DECLARE
    position_record RECORD;
    current_price DECIMAL(20,8);
    pnl DECIMAL(20,8);
BEGIN
    SELECT * INTO position_record
    FROM trading_positions
    WHERE id = p_position_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    SELECT get_latest_price(position_record.symbol, position_record.asset_type) INTO current_price;
    
    IF position_record.side = 'long' THEN
        pnl := (current_price - position_record.avg_entry_price) * position_record.quantity;
    ELSE
        pnl := (position_record.avg_entry_price - current_price) * position_record.quantity;
    END IF;
    
    RETURN pnl;
END;
$$ LANGUAGE plpgsql;

-- Function to get aggregated sentiment score
CREATE OR REPLACE FUNCTION get_sentiment_aggregate(
    p_symbol VARCHAR, 
    p_hours INTEGER DEFAULT 24
) RETURNS TABLE(
    avg_sentiment DECIMAL(3,2),
    weighted_sentiment DECIMAL(3,2),
    sample_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        AVG(sentiment_score)::DECIMAL(3,2) as avg_sentiment,
        (SUM(sentiment_score * trust_score) / SUM(trust_score))::DECIMAL(3,2) as weighted_sentiment,
        COUNT(*)::INTEGER as sample_count
    FROM social_sentiment
    WHERE symbol = p_symbol
        AND timestamp > NOW() - (p_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql;
