import crypto from 'crypto';

export enum ExchangeType {
  CRYPTO = 'crypto',
  STOCK = 'stock',
  COMMODITY = 'commodity',
  BOND = 'bond',
  FOREX = 'forex',
  OPTION = 'option',
  FUTURE = 'future'
}

export enum Region {
  GLOBAL = 'global',
  NORTH_AMERICA = 'north_america',
  EUROPE = 'europe',
  ASIA = 'asia',
  MIDDLE_EAST = 'middle_east',
  AFRICA = 'africa',
  SOUTH_AMERICA = 'south_america'
}

export interface ExchangeConfig {
  id: string;
  name: string;
  displayName: string;
  type: ExchangeType[];
  region: Region;
  country: string;
  website: string;
  apiBaseUrl: string;
  wsBaseUrl?: string;
  supportedAssets: string[];
  tradingHours: {
    timezone: string;
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };
  authentication: {
    type: 'api_key' | 'oauth' | 'jwt' | 'certificate';
    requiredFields: string[];
    sandbox: boolean;
    rateLimits: {
      requests: number;
      interval: string; // 'second' | 'minute' | 'hour' | 'day'
    }[];
  };
  features: {
    spotTrading: boolean;
    marginTrading: boolean;
    futuresTrading: boolean;
    optionsTrading: boolean;
    lending: boolean;
    staking: boolean;
    orderTypes: string[];
    maxPositions: number;
    minTradeAmount: number;
  };
  fees: {
    maker: number;
    taker: number;
    withdrawal: { [asset: string]: number };
  };
  status: 'active' | 'maintenance' | 'deprecated';
  aiCompatibility: {
    realTimeData: boolean;
    historicalData: boolean;
    orderExecution: boolean;
    portfolioSync: boolean;
    riskManagement: boolean;
  };
}

export class GlobalExchangeRegistry {
  private static exchanges: Map<string, ExchangeConfig> = new Map();
  private static userConfigs: Map<string, UserExchangeConfig> = new Map();
  private static encryptionKey: string = process.env.EXCHANGE_ENCRYPTION_KEY || 'default-key';

  // Global Kripto Borsaları
  static readonly CRYPTO_EXCHANGES: ExchangeConfig[] = [
    {
      id: 'binance',
      name: 'Binance',
      displayName: 'Binance Global',
      type: [ExchangeType.CRYPTO],
      region: Region.GLOBAL,
      country: 'Malta',
      website: 'https://www.binance.com',
      apiBaseUrl: 'https://api.binance.com',
      wsBaseUrl: 'wss://stream.binance.com:9443',
      supportedAssets: ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'USDT', 'USDC', 'DOT', 'MATIC'],
      tradingHours: {
        timezone: 'UTC',
        monday: { open: '00:00', close: '23:59' },
        tuesday: { open: '00:00', close: '23:59' },
        wednesday: { open: '00:00', close: '23:59' },
        thursday: { open: '00:00', close: '23:59' },
        friday: { open: '00:00', close: '23:59' },
        saturday: { open: '00:00', close: '23:59' },
        sunday: { open: '00:00', close: '23:59' }
      },
      authentication: {
        type: 'api_key',
        requiredFields: ['apiKey', 'secretKey'],
        sandbox: true,
        rateLimits: [
          { requests: 1200, interval: 'minute' },
          { requests: 10, interval: 'second' }
        ]
      },
      features: {
        spotTrading: true,
        marginTrading: true,
        futuresTrading: true,
        optionsTrading: true,
        lending: true,
        staking: true,
        orderTypes: ['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT', 'OCO'],
        maxPositions: 200,
        minTradeAmount: 10
      },
      fees: {
        maker: 0.001,
        taker: 0.001,
        withdrawal: { 'BTC': 0.0005, 'ETH': 0.005, 'USDT': 1.0 }
      },
      status: 'active',
      aiCompatibility: {
        realTimeData: true,
        historicalData: true,
        orderExecution: true,
        portfolioSync: true,
        riskManagement: true
      }
    },
    {
      id: 'coinbase_pro',
      name: 'Coinbase Pro',
      displayName: 'Coinbase Pro',
      type: [ExchangeType.CRYPTO],
      region: Region.NORTH_AMERICA,
      country: 'USA',
      website: 'https://pro.coinbase.com',
      apiBaseUrl: 'https://api.pro.coinbase.com',
      wsBaseUrl: 'wss://ws-feed.pro.coinbase.com',
      supportedAssets: ['BTC', 'ETH', 'LTC', 'BCH', 'ETC', 'ADA', 'DOT'],
      tradingHours: {
        timezone: 'UTC',
        monday: { open: '00:00', close: '23:59' },
        tuesday: { open: '00:00', close: '23:59' },
        wednesday: { open: '00:00', close: '23:59' },
        thursday: { open: '00:00', close: '23:59' },
        friday: { open: '00:00', close: '23:59' },
        saturday: { open: '00:00', close: '23:59' },
        sunday: { open: '00:00', close: '23:59' }
      },
      authentication: {
        type: 'api_key',
        requiredFields: ['key', 'secret', 'passphrase'],
        sandbox: true,
        rateLimits: [
          { requests: 10, interval: 'second' }
        ]
      },
      features: {
        spotTrading: true,
        marginTrading: false,
        futuresTrading: false,
        optionsTrading: false,
        lending: false,
        staking: false,
        orderTypes: ['MARKET', 'LIMIT', 'STOP'],
        maxPositions: 100,
        minTradeAmount: 1
      },
      fees: {
        maker: 0.005,
        taker: 0.005,
        withdrawal: { 'BTC': 0.0005, 'ETH': 0.005 }
      },
      status: 'active',
      aiCompatibility: {
        realTimeData: true,
        historicalData: true,
        orderExecution: true,
        portfolioSync: true,
        riskManagement: true
      }
    },
    {
      id: 'btcturk',
      name: 'BTCTurk',
      displayName: 'BTCTurk',
      type: [ExchangeType.CRYPTO],
      region: Region.EUROPE,
      country: 'Turkey',
      website: 'https://www.btcturk.com',
      apiBaseUrl: 'https://api.btcturk.com',
      wsBaseUrl: 'wss://ws-feed.btcturk.com',
      supportedAssets: ['BTC', 'ETH', 'LTC', 'XRP', 'ADA', 'TRY'],
      tradingHours: {
        timezone: 'Europe/Istanbul',
        monday: { open: '00:00', close: '23:59' },
        tuesday: { open: '00:00', close: '23:59' },
        wednesday: { open: '00:00', close: '23:59' },
        thursday: { open: '00:00', close: '23:59' },
        friday: { open: '00:00', close: '23:59' },
        saturday: { open: '00:00', close: '23:59' },
        sunday: { open: '00:00', close: '23:59' }
      },
      authentication: {
        type: 'api_key',
        requiredFields: ['apiKey', 'secretKey'],
        sandbox: true,
        rateLimits: [
          { requests: 100, interval: 'minute' }
        ]
      },
      features: {
        spotTrading: true,
        marginTrading: false,
        futuresTrading: false,
        optionsTrading: false,
        lending: false,
        staking: false,
        orderTypes: ['MARKET', 'LIMIT'],
        maxPositions: 50,
        minTradeAmount: 10
      },
      fees: {
        maker: 0.002,
        taker: 0.003,
        withdrawal: { 'BTC': 0.0005, 'ETH': 0.01, 'TRY': 5 }
      },
      status: 'active',
      aiCompatibility: {
        realTimeData: true,
        historicalData: true,
        orderExecution: true,
        portfolioSync: true,
        riskManagement: true
      }
    }
  ];

  // Global Hisse Senedi Borsaları
  static readonly STOCK_EXCHANGES: ExchangeConfig[] = [
    {
      id: 'nasdaq',
      name: 'NASDAQ',
      displayName: 'NASDAQ Stock Market',
      type: [ExchangeType.STOCK, ExchangeType.OPTION],
      region: Region.NORTH_AMERICA,
      country: 'USA',
      website: 'https://www.nasdaq.com',
      apiBaseUrl: 'https://api.nasdaq.com',
      wsBaseUrl: 'wss://ws.nasdaq.com',
      supportedAssets: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA'],
      tradingHours: {
        timezone: 'America/New_York',
        monday: { open: '09:30', close: '16:00' },
        tuesday: { open: '09:30', close: '16:00' },
        wednesday: { open: '09:30', close: '16:00' },
        thursday: { open: '09:30', close: '16:00' },
        friday: { open: '09:30', close: '16:00' }
      },
      authentication: {
        type: 'api_key',
        requiredFields: ['apiKey'],
        sandbox: true,
        rateLimits: [
          { requests: 200, interval: 'minute' }
        ]
      },
      features: {
        spotTrading: true,
        marginTrading: true,
        futuresTrading: false,
        optionsTrading: true,
        lending: false,
        staking: false,
        orderTypes: ['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT'],
        maxPositions: 1000,
        minTradeAmount: 1
      },
      fees: {
        maker: 0.0005,
        taker: 0.0005,
        withdrawal: {}
      },
      status: 'active',
      aiCompatibility: {
        realTimeData: true,
        historicalData: true,
        orderExecution: true,
        portfolioSync: true,
        riskManagement: true
      }
    },
    {
      id: 'bist',
      name: 'BIST',
      displayName: 'Borsa İstanbul',
      type: [ExchangeType.STOCK, ExchangeType.BOND],
      region: Region.EUROPE,
      country: 'Turkey',
      website: 'https://www.borsaistanbul.com',
      apiBaseUrl: 'https://api.borsaistanbul.com',
      wsBaseUrl: 'wss://ws.borsaistanbul.com',
      supportedAssets: ['THYAO', 'AKBNK', 'GARAN', 'ISCTR', 'SASA', 'TUPRS', 'ASELS'],
      tradingHours: {
        timezone: 'Europe/Istanbul',
        monday: { open: '09:30', close: '18:00' },
        tuesday: { open: '09:30', close: '18:00' },
        wednesday: { open: '09:30', close: '18:00' },
        thursday: { open: '09:30', close: '18:00' },
        friday: { open: '09:30', close: '18:00' }
      },
      authentication: {
        type: 'api_key',
        requiredFields: ['apiKey', 'secretKey'],
        sandbox: true,
        rateLimits: [
          { requests: 100, interval: 'minute' }
        ]
      },
      features: {
        spotTrading: true,
        marginTrading: true,
        futuresTrading: false,
        optionsTrading: false,
        lending: false,
        staking: false,
        orderTypes: ['MARKET', 'LIMIT'],
        maxPositions: 200,
        minTradeAmount: 100
      },
      fees: {
        maker: 0.001,
        taker: 0.002,
        withdrawal: {}
      },
      status: 'active',
      aiCompatibility: {
        realTimeData: true,
        historicalData: true,
        orderExecution: true,
        portfolioSync: true,
        riskManagement: true
      }
    },
    {
      id: 'lse',
      name: 'LSE',
      displayName: 'London Stock Exchange',
      type: [ExchangeType.STOCK, ExchangeType.BOND],
      region: Region.EUROPE,
      country: 'UK',
      website: 'https://www.londonstockexchange.com',
      apiBaseUrl: 'https://api.londonstockexchange.com',
      wsBaseUrl: 'wss://ws.londonstockexchange.com',
      supportedAssets: ['VOD', 'BP', 'SHELL', 'AZN', 'HSBA', 'LLOY'],
      tradingHours: {
        timezone: 'Europe/London',
        monday: { open: '08:00', close: '16:30' },
        tuesday: { open: '08:00', close: '16:30' },
        wednesday: { open: '08:00', close: '16:30' },
        thursday: { open: '08:00', close: '16:30' },
        friday: { open: '08:00', close: '16:30' }
      },
      authentication: {
        type: 'api_key',
        requiredFields: ['apiKey'],
        sandbox: true,
        rateLimits: [
          { requests: 150, interval: 'minute' }
        ]
      },
      features: {
        spotTrading: true,
        marginTrading: true,
        futuresTrading: false,
        optionsTrading: false,
        lending: false,
        staking: false,
        orderTypes: ['MARKET', 'LIMIT', 'STOP'],
        maxPositions: 500,
        minTradeAmount: 10
      },
      fees: {
        maker: 0.0008,
        taker: 0.0008,
        withdrawal: {}
      },
      status: 'active',
      aiCompatibility: {
        realTimeData: true,
        historicalData: true,
        orderExecution: true,
        portfolioSync: true,
        riskManagement: true
      }
    }
  ];

  // Emtia Borsaları
  static readonly COMMODITY_EXCHANGES: ExchangeConfig[] = [
    {
      id: 'cme',
      name: 'CME',
      displayName: 'Chicago Mercantile Exchange',
      type: [ExchangeType.COMMODITY, ExchangeType.FUTURE],
      region: Region.NORTH_AMERICA,
      country: 'USA',
      website: 'https://www.cmegroup.com',
      apiBaseUrl: 'https://api.cmegroup.com',
      wsBaseUrl: 'wss://ws.cmegroup.com',
      supportedAssets: ['GC', 'SI', 'CL', 'NG', 'ZC', 'ZS', 'ZW'],
      tradingHours: {
        timezone: 'America/Chicago',
        monday: { open: '17:00', close: '16:00' },
        tuesday: { open: '17:00', close: '16:00' },
        wednesday: { open: '17:00', close: '16:00' },
        thursday: { open: '17:00', close: '16:00' },
        friday: { open: '17:00', close: '16:00' }
      },
      authentication: {
        type: 'api_key',
        requiredFields: ['apiKey', 'secretKey'],
        sandbox: true,
        rateLimits: [
          { requests: 500, interval: 'minute' }
        ]
      },
      features: {
        spotTrading: false,
        marginTrading: true,
        futuresTrading: true,
        optionsTrading: true,
        lending: false,
        staking: false,
        orderTypes: ['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT'],
        maxPositions: 1000,
        minTradeAmount: 1
      },
      fees: {
        maker: 0.0001,
        taker: 0.0002,
        withdrawal: {}
      },
      status: 'active',
      aiCompatibility: {
        realTimeData: true,
        historicalData: true,
        orderExecution: true,
        portfolioSync: true,
        riskManagement: true
      }
    }
  ];

  // Forex Borsaları
  static readonly FOREX_EXCHANGES: ExchangeConfig[] = [
    {
      id: 'oanda',
      name: 'OANDA',
      displayName: 'OANDA Corporation',
      type: [ExchangeType.FOREX],
      region: Region.GLOBAL,
      country: 'Canada',
      website: 'https://www.oanda.com',
      apiBaseUrl: 'https://api-fxtrade.oanda.com',
      wsBaseUrl: 'wss://stream-fxtrade.oanda.com',
      supportedAssets: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD'],
      tradingHours: {
        timezone: 'UTC',
        monday: { open: '00:00', close: '23:59' },
        tuesday: { open: '00:00', close: '23:59' },
        wednesday: { open: '00:00', close: '23:59' },
        thursday: { open: '00:00', close: '23:59' },
        friday: { open: '00:00', close: '21:00' }
      },
      authentication: {
        type: 'api_key',
        requiredFields: ['apiKey'],
        sandbox: true,
        rateLimits: [
          { requests: 100, interval: 'second' }
        ]
      },
      features: {
        spotTrading: true,
        marginTrading: true,
        futuresTrading: false,
        optionsTrading: false,
        lending: false,
        staking: false,
        orderTypes: ['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT'],
        maxPositions: 200,
        minTradeAmount: 1
      },
      fees: {
        maker: 0.00001,
        taker: 0.00002,
        withdrawal: {}
      },
      status: 'active',
      aiCompatibility: {
        realTimeData: true,
        historicalData: true,
        orderExecution: true,
        portfolioSync: true,
        riskManagement: true
      }
    }
  ];

  static initialize(): void {
    // Tüm borsaları kaydet
    [...this.CRYPTO_EXCHANGES, ...this.STOCK_EXCHANGES, ...this.COMMODITY_EXCHANGES, ...this.FOREX_EXCHANGES]
      .forEach(exchange => {
        this.exchanges.set(exchange.id, exchange);
      });
    
    console.log(`🌍 Global Borsa Sistemi: ${this.exchanges.size} borsa yüklendi`);
  }

  static getAllExchanges(): ExchangeConfig[] {
    return Array.from(this.exchanges.values());
  }

  static getExchangesByType(type: ExchangeType): ExchangeConfig[] {
    return Array.from(this.exchanges.values()).filter(exchange => 
      exchange.type.includes(type)
    );
  }

  static getExchangesByRegion(region: Region): ExchangeConfig[] {
    return Array.from(this.exchanges.values()).filter(exchange => 
      exchange.region === region
    );
  }

  static getExchange(id: string): ExchangeConfig | undefined {
    return this.exchanges.get(id);
  }

  static isExchangeActive(id: string): boolean {
    const exchange = this.exchanges.get(id);
    return exchange?.status === 'active' || false;
  }

  static getAICompatibleExchanges(): ExchangeConfig[] {
    return Array.from(this.exchanges.values()).filter(exchange => 
      exchange.aiCompatibility.realTimeData && 
      exchange.aiCompatibility.orderExecution
    );
  }

  // Güvenli API anahtarı şifreleme
  static encryptApiKey(apiKey: string): string {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, this.encryptionKey);
    
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  static decryptApiKey(encryptedKey: string): string {
    const algorithm = 'aes-256-gcm';
    const parts = encryptedKey.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];
    
    const decipher = crypto.createDecipher(algorithm, this.encryptionKey);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

export interface UserExchangeConfig {
  exchangeId: string;
  userId: string;
  enabled: boolean;
  credentials: {
    [key: string]: string; // Şifrelenmiş API anahtarları
  };
  settings: {
    paperTrading: boolean;
    maxRiskPerTrade: number;
    maxDailyRisk: number;
    allowedAssets: string[];
    tradingHours: {
      enabled: boolean;
      timezone: string;
      schedule: any;
    };
  };
  aiSettings: {
    enabled: boolean;
    confidenceThreshold: number;
    maxConcurrentTrades: number;
    strategies: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}