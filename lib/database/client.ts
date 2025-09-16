/**
 * AILYDIAN GLOBAL TRADER - Database Client
 * PostgreSQL + TimescaleDB Connection Manager
 * © 2025 Emrah Şardağ - Ultra Pro Edition
 */

import { Pool, PoolClient, QueryResult } from 'pg';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  max?: number;
  idleTimeoutMillis?: number;
}

class DatabaseManager {
  private pool: Pool | null = null;
  private config: DatabaseConfig;

  constructor() {
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'ailydian_trader',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.NODE_ENV === 'production',
      max: 20, // Maximum number of connections
      idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    };

    this.initializePool();
  }

  private initializePool(): void {
    try {
      this.pool = new Pool(this.config);
      
      this.pool.on('connect', () => {
        console.log('📊 Connected to TimescaleDB');
      });

      this.pool.on('error', (err) => {
        console.error('❌ PostgreSQL pool error:', err);
      });

      // Test connection
      this.testConnection();
    } catch (error) {
      console.error('❌ Failed to initialize database pool:', error);
    }
  }

  private async testConnection(): Promise<void> {
    try {
      const client = await this.getClient();
      const result = await client.query('SELECT NOW() as current_time, version()');
      console.log('✅ Database connected:', result.rows[0].current_time);
      client.release();
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
    }
  }

  async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }
    return await this.pool.connect();
  }

  async query(text: string, params?: any[]): Promise<QueryResult> {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }
    return await this.pool.query(text, params);
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Market data operations
  async insertMarketData(data: {
    symbol: string;
    assetType: string;
    exchange?: string;
    timestamp: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    source: string;
    qualityScore?: number;
    metadata?: any;
  }): Promise<string> {
    const query = `
      INSERT INTO market_data (
        symbol, asset_type, exchange, timestamp, 
        open, high, low, close, volume, source, 
        quality_score, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `;

    const values = [
      data.symbol,
      data.assetType,
      data.exchange,
      data.timestamp,
      data.open,
      data.high,
      data.low,
      data.close,
      data.volume,
      data.source,
      data.qualityScore || 1.0,
      JSON.stringify(data.metadata || {})
    ];

    const result = await this.query(query, values);
    return result.rows[0].id;
  }

  async getLatestPrice(symbol: string, assetType: string): Promise<number | null> {
    const query = `
      SELECT close FROM market_data
      WHERE symbol = $1 AND asset_type = $2
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    const result = await this.query(query, [symbol, assetType]);
    return result.rows.length > 0 ? parseFloat(result.rows[0].close) : null;
  }

  async getOHLCVData(
    symbol: string,
    assetType: string,
    timeframe: string = '1min',
    limit: number = 100
  ): Promise<any[]> {
    const viewName = timeframe === '1min' ? 'market_data_1min' : 
                    timeframe === '5min' ? 'market_data_5min' : 'market_data';

    const query = `
      SELECT 
        time_bucket,
        open,
        high,
        low,
        close,
        volume,
        ticks_count
      FROM ${viewName}
      WHERE symbol = $1 AND asset_type = $2
      ORDER BY time_bucket DESC
      LIMIT $3
    `;

    const result = await this.query(query, [symbol, assetType, limit]);
    return result.rows;
  }

  // Sentiment operations
  async insertSentimentData(data: {
    symbol: string;
    source: string;
    platformId?: string;
    content?: string;
    sentimentScore: number;
    confidence: number;
    trustScore?: number;
    author?: string;
    timestamp: Date;
    metadata?: any;
  }): Promise<string> {
    const query = `
      INSERT INTO social_sentiment (
        symbol, source, platform_id, content, 
        sentiment_score, confidence, trust_score, 
        author, timestamp, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;

    const values = [
      data.symbol,
      data.source,
      data.platformId,
      data.content,
      data.sentimentScore,
      data.confidence,
      data.trustScore || 0.5,
      data.author,
      data.timestamp,
      JSON.stringify(data.metadata || {})
    ];

    const result = await this.query(query, values);
    return result.rows[0].id;
  }

  async getSentimentAggregate(symbol: string, hours: number = 24): Promise<{
    avgSentiment: number;
    weightedSentiment: number;
    sampleCount: number;
  } | null> {
    const query = `SELECT * FROM get_sentiment_aggregate($1, $2)`;
    const result = await this.query(query, [symbol, hours]);
    
    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        avgSentiment: parseFloat(row.avg_sentiment),
        weightedSentiment: parseFloat(row.weighted_sentiment),
        sampleCount: parseInt(row.sample_count)
      };
    }
    
    return null;
  }

  // News operations
  async insertNewsEvent(data: {
    headline: string;
    summary?: string;
    content?: string;
    source: string;
    author?: string;
    url?: string;
    publishedAt: Date;
    symbols: string[];
    categories: string[];
    sentimentScore?: number;
    importanceScore?: number;
    trustScore?: number;
    metadata?: any;
  }): Promise<string> {
    const query = `
      INSERT INTO news_events (
        headline, summary, content, source, author, url, 
        published_at, symbols, categories, sentiment_score, 
        importance_score, trust_score, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `;

    const values = [
      data.headline,
      data.summary,
      data.content,
      data.source,
      data.author,
      data.url,
      data.publishedAt,
      data.symbols,
      data.categories,
      data.sentimentScore,
      data.importanceScore,
      data.trustScore,
      JSON.stringify(data.metadata || {})
    ];

    const result = await this.query(query, values);
    return result.rows[0].id;
  }

  // Trading operations
  async createTradingOrder(data: {
    accountId: string;
    symbol: string;
    assetType: string;
    orderType: string;
    side: string;
    quantity: number;
    price?: number;
    stopPrice?: number;
    metadata?: any;
  }): Promise<string> {
    const query = `
      INSERT INTO trading_orders (
        account_id, symbol, asset_type, order_type, 
        side, quantity, price, stop_price, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;

    const values = [
      data.accountId,
      data.symbol,
      data.assetType,
      data.orderType,
      data.side,
      data.quantity,
      data.price,
      data.stopPrice,
      JSON.stringify(data.metadata || {})
    ];

    const result = await this.query(query, values);
    return result.rows[0].id;
  }

  async getActivePositions(accountId: string): Promise<any[]> {
    const query = `
      SELECT 
        p.*,
        get_latest_price(p.symbol, p.asset_type) as current_price,
        calculate_position_pnl(p.id) as unrealized_pnl
      FROM trading_positions p
      WHERE p.account_id = $1 AND p.closed_at IS NULL
      ORDER BY p.opened_at DESC
    `;

    const result = await this.query(query, [accountId]);
    return result.rows;
  }

  // AI operations
  async insertAISignal(data: {
    strategyId: string;
    symbol: string;
    assetType: string;
    signalType: string;
    confidence: number;
    predictedPrice?: number;
    reasoning?: string;
    features?: any;
    sentimentScore?: number;
    trustScore?: number;
    expiresAt?: Date;
  }): Promise<string> {
    const query = `
      INSERT INTO ai_signals (
        strategy_id, symbol, asset_type, signal_type, 
        confidence, predicted_price, reasoning, features,
        sentiment_score, trust_score, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `;

    const values = [
      data.strategyId,
      data.symbol,
      data.assetType,
      data.signalType,
      data.confidence,
      data.predictedPrice,
      data.reasoning,
      JSON.stringify(data.features || {}),
      data.sentimentScore,
      data.trustScore,
      data.expiresAt
    ];

    const result = await this.query(query, values);
    return result.rows[0].id;
  }

  async getActiveSignals(limit: number = 50): Promise<any[]> {
    const query = `
      SELECT 
        s.*,
        st.name as strategy_name,
        st.strategy_type
      FROM ai_signals s
      JOIN ai_strategies st ON s.strategy_id = st.id
      WHERE s.expires_at > NOW() AND s.executed_at IS NULL
      ORDER BY s.confidence DESC, s.generated_at DESC
      LIMIT $1
    `;

    const result = await this.query(query, [limit]);
    return result.rows;
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      console.log('📊 Database pool closed');
    }
  }
}

// Singleton instance
export const dbManager = new DatabaseManager();

// Helper functions for common operations
export const marketDataQueries = {
  insertTick: (data: any) => dbManager.insertMarketData(data),
  getLatestPrice: (symbol: string, assetType: string) => 
    dbManager.getLatestPrice(symbol, assetType),
  getOHLCV: (symbol: string, assetType: string, timeframe?: string, limit?: number) =>
    dbManager.getOHLCVData(symbol, assetType, timeframe, limit),
};

export const sentimentQueries = {
  insertSentiment: (data: any) => dbManager.insertSentimentData(data),
  getAggregate: (symbol: string, hours?: number) =>
    dbManager.getSentimentAggregate(symbol, hours),
};

export const newsQueries = {
  insertNews: (data: any) => dbManager.insertNewsEvent(data),
};

export const tradingQueries = {
  createOrder: (data: any) => dbManager.createTradingOrder(data),
  getPositions: (accountId: string) => dbManager.getActivePositions(accountId),
};

export const aiQueries = {
  insertSignal: (data: any) => dbManager.insertAISignal(data),
  getActiveSignals: (limit?: number) => dbManager.getActiveSignals(limit),
};
