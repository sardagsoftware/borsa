export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  pe?: number;
  dividendYield?: number;
  high52Week?: number;
  low52Week?: number;
  lastUpdated: string;
}

export interface Crypto {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume24h: number;
  marketCap: number;
  marketCapRank: number;
  circulatingSupply: number;
  totalSupply?: number;
  high24h: number;
  low24h: number;
  ath: number;
  athDate: string;
  lastUpdated: string;
}

export interface PriceHistory {
  timestamp: string;
  price: number;
  volume?: number;
}

export interface MarketSummary {
  totalMarketCap: number;
  totalVolume24h: number;
  marketCapChange24h: number;
  activeCurrencies: number;
  totalExchanges: number;
  btcDominance: number;
  lastUpdated: string;
}

export interface WatchlistItem {
  type: 'stock' | 'crypto';
  symbol: string;
  addedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  timestamp: string;
}