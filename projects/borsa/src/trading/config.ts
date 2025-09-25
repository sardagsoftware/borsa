// Trading Bot Configuration
export interface TradingConfig {
  // General Settings
  enabled: boolean;
  mode: 'live' | 'paper' | 'backtest';
  maxConcurrentTrades: number;
  
  // Risk Management
  maxRiskPerTrade: number; // % of portfolio
  maxDailyLoss: number; // % of portfolio
  maxDrawdown: number; // % of portfolio
  
  // Trading Parameters
  minTradeAmount: number;
  maxTradeAmount: number;
  defaultSlippage: number; // %
  
  // AI/ML Settings
  aiEnabled: boolean;
  modelConfidenceThreshold: number; // 0-1
  sentimentWeight: number; // 0-1
  technicalWeight: number; // 0-1
  
  // Exchanges
  exchanges: ExchangeConfig[];
  
  // Strategies
  strategies: StrategyConfig[];
}

export interface ExchangeConfig {
  name: string;
  type: 'crypto' | 'stock' | 'forex' | 'commodity';
  enabled: boolean;
  apiKey: string;
  apiSecret: string;
  sandbox: boolean;
  maxOrderSize: number;
  fees: {
    maker: number;
    taker: number;
  };
}

export interface StrategyConfig {
  name: string;
  enabled: boolean;
  allocation: number; // % of portfolio
  markets: string[]; // ['BTC/USDT', 'ETH/USDT', etc.]
  timeframes: string[]; // ['1m', '5m', '1h', etc.]
  parameters: Record<string, any>;
}

// Default Configuration
export const DEFAULT_TRADING_CONFIG: TradingConfig = {
  enabled: false,
  mode: 'paper',
  maxConcurrentTrades: 10,
  
  maxRiskPerTrade: 2, // 2% per trade
  maxDailyLoss: 5, // 5% daily loss limit
  maxDrawdown: 15, // 15% max drawdown
  
  minTradeAmount: 10,
  maxTradeAmount: 1000,
  defaultSlippage: 0.1,
  
  aiEnabled: true,
  modelConfidenceThreshold: 0.7,
  sentimentWeight: 0.3,
  technicalWeight: 0.7,
  
  exchanges: [
    {
      name: 'binance',
      type: 'crypto',
      enabled: false,
      apiKey: '',
      apiSecret: '',
      sandbox: true,
      maxOrderSize: 10000,
      fees: {
        maker: 0.001,
        taker: 0.001
      }
    },
    {
      name: 'alpaca',
      type: 'stock',
      enabled: false,
      apiKey: '',
      apiSecret: '',
      sandbox: true,
      maxOrderSize: 50000,
      fees: {
        maker: 0,
        taker: 0
      }
    }
  ],
  
  strategies: [
    {
      name: 'ai_momentum',
      enabled: true,
      allocation: 40,
      markets: ['BTC/USDT', 'ETH/USDT'],
      timeframes: ['1h', '4h'],
      parameters: {
        rsi_period: 14,
        macd_fast: 12,
        macd_slow: 26,
        bb_period: 20,
        confidence_threshold: 0.75
      }
    },
    {
      name: 'mean_reversion',
      enabled: true,
      allocation: 30,
      markets: ['AAPL', 'MSFT', 'GOOGL'],
      timeframes: ['1d'],
      parameters: {
        lookback_period: 20,
        std_multiplier: 2,
        min_volume_ratio: 1.5
      }
    },
    {
      name: 'breakout_scanner',
      enabled: true,
      allocation: 30,
      markets: ['*'], // All markets
      timeframes: ['15m', '1h'],
      parameters: {
        volume_threshold: 2.0,
        price_change_threshold: 0.05,
        consolidation_period: 10
      }
    }
  ]
};

// Market Types and Instruments
export const SUPPORTED_MARKETS = {
  CRYPTO: [
    'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT', 'XRP/USDT',
    'SOL/USDT', 'MATIC/USDT', 'DOT/USDT', 'AVAX/USDT', 'LINK/USDT'
  ],
  STOCKS: [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
    'AMD', 'INTC', 'CRM', 'ORCL', 'ADBE', 'PYPL', 'UBER', 'SHOP'
  ],
  FOREX: [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD',
    'USD/CHF', 'NZD/USD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY'
  ],
  COMMODITIES: [
    'GOLD', 'SILVER', 'OIL', 'COPPER', 'PLATINUM', 'PALLADIUM',
    'WHEAT', 'CORN', 'SOYBEANS', 'NATURAL_GAS'
  ]
};

// Risk Limits
export const RISK_LIMITS = {
  MAX_POSITION_SIZE: 0.1, // 10% of portfolio
  MAX_LEVERAGE: 3,
  MIN_ACCOUNT_BALANCE: 100,
  EMERGENCY_STOP_LOSS: 0.20, // 20% total loss triggers emergency stop
};

// Trading Hours (UTC)
export const TRADING_HOURS = {
  CRYPTO: { start: '00:00', end: '23:59', days: [0, 1, 2, 3, 4, 5, 6] },
  STOCK: { start: '14:30', end: '21:00', days: [1, 2, 3, 4, 5] }, // NYSE hours
  FOREX: { start: '21:00', end: '21:00', days: [0, 1, 2, 3, 4] }, // Sun 21:00 - Fri 21:00
};

// Technical Indicators Configuration
export const INDICATOR_CONFIGS = {
  RSI: { period: 14, overbought: 70, oversold: 30 },
  MACD: { fast: 12, slow: 26, signal: 9 },
  BOLLINGER_BANDS: { period: 20, multiplier: 2 },
  SMA: [10, 20, 50, 100, 200],
  EMA: [12, 26, 50, 100],
  VOLUME: { sma_period: 20, spike_threshold: 2.0 },
  ATR: { period: 14 },
  STOCHASTIC: { k_period: 14, d_period: 3 }
};

export default DEFAULT_TRADING_CONFIG;