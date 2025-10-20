/**
 * TRADITIONAL MARKETS DATA TYPES
 *
 * Forex, Commodities, Indices için veri tipleri
 * Crypto ile aynı stratejiler ve AI kullanılacak
 */

export type MarketType = 'FOREX' | 'COMMODITY' | 'INDEX' | 'CRYPTO';

export interface TraditionalMarketData {
  symbol: string;
  name: string;
  type: MarketType;
  price: number;
  changePercent24h: number;
  changePercent7d?: number;
  volume24h: number;
  sparkline: number[];
  high24h?: number;
  low24h?: number;
  lastUpdate: number;
  // Additional metadata
  icon?: string;
  category?: string;
  description?: string;
}

export interface TraditionalMarketConfig {
  symbol: string;
  binanceSymbol: string; // Binance'deki karşılığı
  name: string;
  type: MarketType;
  icon: string;
  category: string;
  description: string;
  enabled: boolean;
}

/**
 * Desteklenen geleneksel piyasa ürünleri
 */
export const TRADITIONAL_MARKETS: TraditionalMarketConfig[] = [
  // FOREX
  {
    symbol: 'EUR/USD',
    binanceSymbol: 'EURUSDT',
    name: 'Euro / US Dollar',
    type: 'FOREX',
    icon: '💶',
    category: 'Forex',
    description: 'En likit forex çifti',
    enabled: true,
  },
  {
    symbol: 'GBP/USD',
    binanceSymbol: 'GBPUSDT',
    name: 'British Pound / US Dollar',
    type: 'FOREX',
    icon: '💷',
    category: 'Forex',
    description: 'Cable - Major forex pair',
    enabled: true,
  },
  {
    symbol: 'USD/TRY',
    binanceSymbol: 'USDTTRY',
    name: 'US Dollar / Turkish Lira',
    type: 'FOREX',
    icon: '💵',
    category: 'Forex',
    description: 'Dolar / Türk Lirası',
    enabled: true,
  },

  // COMMODITIES
  {
    symbol: 'GOLD',
    binanceSymbol: 'PAXGUSDT',
    name: 'Gold (Paxos)',
    type: 'COMMODITY',
    icon: '🥇',
    category: 'Precious Metals',
    description: 'Altın (Gold) - PAXG tokenized 1oz = 1 token',
    enabled: true, // ✅ ACTIVE - Using Binance PAXGUSDT
  },

  // PRECIOUS METALS (MetalpriceAPI)
  {
    symbol: 'SILVER',
    binanceSymbol: 'XAG', // MetalpriceAPI symbol
    name: 'Silver (Troy Ounce)',
    type: 'COMMODITY',
    icon: '🥈',
    category: 'Precious Metals',
    description: 'Gümüş (Silver) - Live prices via MetalpriceAPI',
    enabled: true, // ✅ ACTIVE - Using MetalpriceAPI
  },
  {
    symbol: 'PLATINUM',
    binanceSymbol: 'XPT', // MetalpriceAPI symbol
    name: 'Platinum (Troy Ounce)',
    type: 'COMMODITY',
    icon: '⚪',
    category: 'Precious Metals',
    description: 'Platin (Platinum) - Live prices via MetalpriceAPI',
    enabled: true, // ✅ ACTIVE - Using MetalpriceAPI
  },
  {
    symbol: 'SEK/USD',
    binanceSymbol: 'SEKUSD', // Mock - gerçek API eklenecek
    name: 'Swedish Krona / US Dollar',
    type: 'FOREX',
    icon: '🇸🇪',
    category: 'Forex',
    description: 'İsveç Kronası - Yakında',
    enabled: false,
  },
  {
    symbol: 'BIST100',
    binanceSymbol: 'XU100.IS', // Yahoo Finance symbol
    name: 'BIST 100 Index',
    type: 'INDEX',
    icon: '📊',
    category: 'Turkish Index',
    description: 'Borsa İstanbul 100 - Live prices via Yahoo Finance',
    enabled: true, // ✅ ACTIVE - Using Yahoo Finance
  },
  {
    symbol: 'DXY',
    binanceSymbol: 'DXY', // Mock - gerçek API eklenecek
    name: 'US Dollar Index',
    type: 'INDEX',
    icon: '💵',
    category: 'Endeks',
    description: 'Dolar Endeksi - Yakında',
    enabled: false,
  },
];

/**
 * Get enabled traditional markets
 */
export function getEnabledTraditionalMarkets(): TraditionalMarketConfig[] {
  return TRADITIONAL_MARKETS.filter(m => m.enabled);
}

/**
 * Get market config by symbol
 */
export function getMarketConfig(symbol: string): TraditionalMarketConfig | undefined {
  return TRADITIONAL_MARKETS.find(m => m.symbol === symbol || m.binanceSymbol === symbol);
}

/**
 * Convert TraditionalMarketData to MarketData (for compatibility with useMarketData)
 */
export interface MarketData {
  symbol: string;
  price: number;
  change24h: number; // Absolute change
  changePercent24h: number;
  change7d: number; // Absolute change
  changePercent7d: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume: number; // Same as volume24h for traditional markets
  sparkline: number[];
  rank?: number;
  marketCap?: number;
}

export function convertToMarketData(data: TraditionalMarketData): MarketData {
  // Calculate absolute changes from percentages
  const change24h = (data.price * data.changePercent24h) / 100;
  const changePercent7d = data.changePercent7d || data.changePercent24h * 7; // Estimate if not available
  const change7d = (data.price * changePercent7d) / 100;

  return {
    symbol: data.symbol,
    price: data.price,
    change24h: change24h,
    changePercent24h: data.changePercent24h,
    change7d: change7d,
    changePercent7d: changePercent7d,
    high24h: data.high24h || data.price * 1.02, // Fallback estimate
    low24h: data.low24h || data.price * 0.98, // Fallback estimate
    volume24h: data.volume24h,
    quoteVolume: data.volume24h, // Same for traditional markets
    sparkline: data.sparkline,
  };
}
