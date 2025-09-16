/**
 * AILYDIAN GLOBAL TRADER - ULTRA PRO EDITION
 * Universal Market Data API Client with Advanced Fallback Chain
 * © 2025 Emrah Şardağ - All Rights Reserved
 */

export interface MarketDataSource {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  rateLimit: number; // requests per second
  priority: number; // 1 = highest priority
  healthCheck: string;
  supports: {
    stocks: boolean;
    crypto: boolean;
    commodities: boolean;
    forex: boolean;
    derivatives: boolean;
  };
  regions: string[];
}

export interface TickerData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  close: number;
  timestamp: number;
  source: string;
}

export interface OHLCVData {
  symbol: string;
  timeframe: string;
  data: Array<{
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  source: string;
}

// Global Market Data Sources Configuration
export const MARKET_DATA_SOURCES: MarketDataSource[] = [
  {
    id: 'polygon',
    name: 'Polygon.io',
    baseUrl: 'https://api.polygon.io',
    rateLimit: 5,
    priority: 1,
    healthCheck: '/v2/aggs/ticker/AAPL/prev',
    supports: {
      stocks: true,
      crypto: true,
      commodities: false,
      forex: true,
      derivatives: true,
    },
    regions: ['US', 'GLOBAL'],
  },
  {
    id: 'alpha_vantage',
    name: 'Alpha Vantage',
    baseUrl: 'https://www.alphavantage.co',
    rateLimit: 1,
    priority: 2,
    healthCheck: '/query?function=TIME_SERIES_INTRADAY&symbol=MSFT&interval=1min',
    supports: {
      stocks: true,
      crypto: true,
      commodities: true,
      forex: true,
      derivatives: false,
    },
    regions: ['US', 'EU', 'ASIA', 'GLOBAL'],
  },
  {
    id: 'binance',
    name: 'Binance API',
    baseUrl: 'https://api.binance.com',
    rateLimit: 10,
    priority: 1,
    healthCheck: '/api/v3/ticker/24hr?symbol=BTCUSDT',
    supports: {
      stocks: false,
      crypto: true,
      commodities: false,
      forex: false,
      derivatives: true,
    },
    regions: ['GLOBAL'],
  },
  {
    id: 'coinbase',
    name: 'Coinbase Pro',
    baseUrl: 'https://api.pro.coinbase.com',
    rateLimit: 10,
    priority: 2,
    healthCheck: '/products/BTC-USD/ticker',
    supports: {
      stocks: false,
      crypto: true,
      commodities: false,
      forex: false,
      derivatives: false,
    },
    regions: ['US', 'EU'],
  },
  {
    id: 'yahoo_finance',
    name: 'Yahoo Finance',
    baseUrl: 'https://query1.finance.yahoo.com',
    rateLimit: 2,
    priority: 3,
    healthCheck: '/v8/finance/chart/AAPL',
    supports: {
      stocks: true,
      crypto: true,
      commodities: true,
      forex: true,
      derivatives: true,
    },
    regions: ['US', 'EU', 'ASIA', 'GLOBAL'],
  },
  {
    id: 'twelve_data',
    name: 'Twelve Data',
    baseUrl: 'https://api.twelvedata.com',
    rateLimit: 8,
    priority: 2,
    healthCheck: '/price?symbol=AAPL',
    supports: {
      stocks: true,
      crypto: true,
      commodities: true,
      forex: true,
      derivatives: true,
    },
    regions: ['US', 'EU', 'ASIA', 'GLOBAL'],
  },
  {
    id: 'euronext',
    name: 'Euronext API',
    baseUrl: 'https://live.euronext.com',
    rateLimit: 5,
    priority: 1,
    healthCheck: '/intraday_chart/getChartData/FR0000120404-XPAR',
    supports: {
      stocks: true,
      crypto: false,
      commodities: false,
      forex: false,
      derivatives: true,
    },
    regions: ['EU'],
  },
  {
    id: 'lse',
    name: 'London Stock Exchange',
    baseUrl: 'https://api.londonstockexchange.com',
    rateLimit: 3,
    priority: 2,
    healthCheck: '/v1/prices/VOD',
    supports: {
      stocks: true,
      crypto: false,
      commodities: false,
      forex: false,
      derivatives: true,
    },
    regions: ['UK'],
  },
  {
    id: 'xetra',
    name: 'Deutsche Börse Xetra',
    baseUrl: 'https://api.xetra.com',
    rateLimit: 5,
    priority: 1,
    healthCheck: '/v1/price/DE0007164600',
    supports: {
      stocks: true,
      crypto: false,
      commodities: false,
      forex: false,
      derivatives: true,
    },
    regions: ['DE'],
  },
  {
    id: 'borsa_istanbul',
    name: 'Borsa İstanbul',
    baseUrl: 'https://www.borsaistanbul.com/api',
    rateLimit: 2,
    priority: 1,
    healthCheck: '/v1/stock/THYAO',
    supports: {
      stocks: true,
      crypto: false,
      commodities: false,
      forex: false,
      derivatives: true,
    },
    regions: ['TR'],
  }
];

class MarketDataClient {
  private sources: Map<string, MarketDataSource>;
  private healthStatus: Map<string, boolean>;
  private rateLimiters: Map<string, { calls: number; resetTime: number }>;

  constructor() {
    this.sources = new Map();
    this.healthStatus = new Map();
    this.rateLimiters = new Map();
    
    MARKET_DATA_SOURCES.forEach(source => {
      this.sources.set(source.id, source);
      this.healthStatus.set(source.id, true);
      this.rateLimiters.set(source.id, { calls: 0, resetTime: Date.now() + 1000 });
    });

    // Health check interval
    setInterval(() => this.performHealthChecks(), 60000);
  }

  private async performHealthChecks(): Promise<void> {
    for (const [sourceId, source] of this.sources) {
      try {
        const apiKey = process.env[`${source.id.toUpperCase()}_API_KEY`];
        const url = `${source.baseUrl}${source.healthCheck}${apiKey ? `&apikey=${apiKey}` : ''}`;
        
        const response = await Promise.race([
          fetch(url, { method: 'GET' }),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]);
        
        this.healthStatus.set(sourceId, response.ok);
        console.log(`✅ Health check ${sourceId}: ${response.status}`);
      } catch (error) {
        this.healthStatus.set(sourceId, false);
        console.error(`❌ Health check failed ${sourceId}:`, error);
      }
    }
  }

  private async canMakeRequest(sourceId: string): Promise<boolean> {
    const rateLimiter = this.rateLimiters.get(sourceId);
    const source = this.sources.get(sourceId);
    
    if (!rateLimiter || !source) return false;

    const now = Date.now();
    if (now > rateLimiter.resetTime) {
      rateLimiter.calls = 0;
      rateLimiter.resetTime = now + 1000;
    }

    if (rateLimiter.calls >= source.rateLimit) {
      return false;
    }

    rateLimiter.calls++;
    return true;
  }

  private getAvailableSources(assetType: keyof MarketDataSource['supports']): MarketDataSource[] {
    return Array.from(this.sources.values())
      .filter(source => 
        source.supports[assetType] && 
        this.healthStatus.get(source.id) === true
      )
      .sort((a, b) => a.priority - b.priority);
  }

  async getTickerData(symbol: string, assetType: keyof MarketDataSource['supports']): Promise<TickerData | null> {
    const availableSources = this.getAvailableSources(assetType);
    
    for (const source of availableSources) {
      if (!(await this.canMakeRequest(source.id))) {
        continue;
      }

      try {
        const data = await this.fetchFromSource(source, symbol, 'ticker');
        if (data) {
          return {
            ...data,
            source: source.id,
            timestamp: Date.now()
          };
        }
      } catch (error) {
        console.error(`Failed to fetch from ${source.id}:`, error);
        this.healthStatus.set(source.id, false);
      }
    }

    throw new Error(`No available sources for ${symbol} (${assetType})`);
  }

  async getOHLCVData(
    symbol: string, 
    timeframe: string,
    assetType: keyof MarketDataSource['supports'],
    limit: number = 100
  ): Promise<OHLCVData | null> {
    const availableSources = this.getAvailableSources(assetType);
    
    for (const source of availableSources) {
      if (!(await this.canMakeRequest(source.id))) {
        continue;
      }

      try {
        const data = await this.fetchFromSource(source, symbol, 'ohlcv', { timeframe, limit });
        if (data) {
          return {
            symbol,
            timeframe,
            data: data.values || data.data || [],
            source: source.id
          };
        }
      } catch (error) {
        console.error(`Failed to fetch OHLCV from ${source.id}:`, error);
        this.healthStatus.set(source.id, false);
      }
    }

    throw new Error(`No available sources for OHLCV ${symbol} (${assetType})`);
  }

  private async fetchFromSource(
    source: MarketDataSource, 
    symbol: string, 
    endpoint: string,
    params?: any
  ): Promise<any> {
    const apiKey = process.env[`${source.id.toUpperCase()}_API_KEY`];
    
    let url = `${source.baseUrl}`;
    
    // API-specific URL building
    switch (source.id) {
      case 'polygon':
        url += endpoint === 'ticker' 
          ? `/v2/last/trade/${symbol}`
          : `/v2/aggs/ticker/${symbol}/range/1/${params?.timeframe || 'minute'}/2023-01-01/2023-12-31?apikey=${apiKey}`;
        break;
        
      case 'alpha_vantage':
        url += endpoint === 'ticker'
          ? `/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
          : `/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${params?.timeframe || '1min'}&apikey=${apiKey}`;
        break;
        
      case 'binance':
        url += endpoint === 'ticker'
          ? `/api/v3/ticker/24hr?symbol=${symbol}`
          : `/api/v3/klines?symbol=${symbol}&interval=${params?.timeframe || '1m'}&limit=${params?.limit || 100}`;
        break;
        
      case 'yahoo_finance':
        url += `/v8/finance/chart/${symbol}`;
        break;
        
      default:
        url += `/${endpoint}/${symbol}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AILYDIAN-Trader/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  getHealthStatus(): Record<string, boolean> {
    return Object.fromEntries(this.healthStatus);
  }

  getSourceStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [sourceId, rateLimiter] of this.rateLimiters) {
      const source = this.sources.get(sourceId);
      stats[sourceId] = {
        name: source?.name,
        healthy: this.healthStatus.get(sourceId),
        callsUsed: rateLimiter.calls,
        rateLimit: source?.rateLimit,
        priority: source?.priority,
        supports: source?.supports
      };
    }
    
    return stats;
  }
}

export const globalMarketDataClient = new MarketDataClient();
