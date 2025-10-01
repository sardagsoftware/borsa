/**
 * COINMARKETCAP TOP 100 SERVICE
 * Real-time cryptocurrency data for top 100 coins by market cap
 */

import axios from 'axios';

export interface CMCCoin {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  rank: number;
  price: number;
  volume24h: number;
  volumeChange24h: number;
  percentChange1h: number;
  percentChange24h: number;
  percentChange7d: number;
  percentChange30d: number;
  percentChange60d: number;
  percentChange90d: number;
  marketCap: number;
  marketCapDominance: number;
  fullyDilutedMarketCap: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number | null;
  lastUpdated: string;
  tags: string[];
  platform: {
    name: string;
    symbol: string;
    tokenAddress: string;
  } | null;
}

export interface CMCQuote {
  USD: {
    price: number;
    volume_24h: number;
    volume_change_24h: number;
    percent_change_1h: number;
    percent_change_24h: number;
    percent_change_7d: number;
    percent_change_30d: number;
    percent_change_60d: number;
    percent_change_90d: number;
    market_cap: number;
    market_cap_dominance: number;
    fully_diluted_market_cap: number;
    last_updated: string;
  };
}

export interface CMCResponse {
  data: {
    [key: string]: {
      id: number;
      name: string;
      symbol: string;
      slug: string;
      cmc_rank: number;
      circulating_supply: number;
      total_supply: number;
      max_supply: number | null;
      tags: string[];
      platform: any;
      quote: CMCQuote;
    };
  };
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
    elapsed: number;
    credit_count: number;
  };
}

export class CoinMarketCapService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://pro-api.coinmarketcap.com/v1';
  private cache: Map<string, { data: CMCCoin[]; timestamp: number }> = new Map();
  private readonly cacheDuration = 60000; // 1 minute cache

  constructor() {
    this.apiKey = process.env.COINMARKETCAP_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️  CMC API key not found - using mock data');
    }
  }

  /**
   * Get Top 100 cryptocurrencies by market cap
   */
  async getTop100(): Promise<CMCCoin[]> {
    // Check cache first
    const cached = this.cache.get('top100');
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      console.log('✅ Returning cached Top 100 data');
      return cached.data;
    }

    try {
      if (!this.apiKey) {
        return this.getMockTop100();
      }

      const response = await axios.get<CMCResponse>(`${this.baseUrl}/cryptocurrency/listings/latest`, {
        headers: {
          'X-CMC_PRO_API_KEY': this.apiKey,
        },
        params: {
          start: 1,
          limit: 100,
          convert: 'USD',
          sort: 'market_cap',
          sort_dir: 'desc',
        },
        timeout: 10000,
      });

      const coins = this.parseResponse(response.data);

      // Update cache
      this.cache.set('top100', {
        data: coins,
        timestamp: Date.now(),
      });

      console.log(`✅ Fetched ${coins.length} coins from CoinMarketCap`);
      return coins;
    } catch (error: any) {
      console.error('❌ CoinMarketCap API error:', error.message);

      // Return cached data if available
      if (cached) {
        console.log('⚠️  Using stale cache data');
        return cached.data;
      }

      // Fallback to mock data
      return this.getMockTop100();
    }
  }

  /**
   * Get specific coins by symbols
   */
  async getCoinsBySymbols(symbols: string[]): Promise<CMCCoin[]> {
    try {
      if (!this.apiKey) {
        const allCoins = await this.getMockTop100();
        return allCoins.filter(coin => symbols.includes(coin.symbol));
      }

      const response = await axios.get<CMCResponse>(`${this.baseUrl}/cryptocurrency/quotes/latest`, {
        headers: {
          'X-CMC_PRO_API_KEY': this.apiKey,
        },
        params: {
          symbol: symbols.join(','),
          convert: 'USD',
        },
        timeout: 10000,
      });

      return this.parseResponse(response.data);
    } catch (error: any) {
      console.error('❌ Error fetching coins by symbols:', error.message);
      return [];
    }
  }

  /**
   * Get coin metadata (description, logo, website, etc.)
   */
  async getCoinMetadata(symbols: string[]): Promise<any> {
    try {
      if (!this.apiKey) {
        return null;
      }

      const response = await axios.get(`${this.baseUrl}/cryptocurrency/info`, {
        headers: {
          'X-CMC_PRO_API_KEY': this.apiKey,
        },
        params: {
          symbol: symbols.join(','),
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching metadata:', error.message);
      return null;
    }
  }

  /**
   * Parse CMC API response
   */
  private parseResponse(response: CMCResponse): CMCCoin[] {
    const coins: CMCCoin[] = [];

    for (const key in response.data) {
      const coin = response.data[key];
      const quote = coin.quote.USD;

      coins.push({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        slug: coin.slug,
        rank: coin.cmc_rank,
        price: quote.price,
        volume24h: quote.volume_24h,
        volumeChange24h: quote.volume_change_24h,
        percentChange1h: quote.percent_change_1h,
        percentChange24h: quote.percent_change_24h,
        percentChange7d: quote.percent_change_7d,
        percentChange30d: quote.percent_change_30d,
        percentChange60d: quote.percent_change_60d,
        percentChange90d: quote.percent_change_90d,
        marketCap: quote.market_cap,
        marketCapDominance: quote.market_cap_dominance,
        fullyDilutedMarketCap: quote.fully_diluted_market_cap,
        circulatingSupply: coin.circulating_supply,
        totalSupply: coin.total_supply,
        maxSupply: coin.max_supply,
        lastUpdated: quote.last_updated,
        tags: coin.tags || [],
        platform: coin.platform,
      });
    }

    return coins.sort((a, b) => a.rank - b.rank);
  }

  /**
   * Mock data for development/testing
   */
  private getMockTop100(): CMCCoin[] {
    const mockCoins: CMCCoin[] = [];
    const topCoins = [
      { symbol: 'BTC', name: 'Bitcoin', price: 67234, cap: 1320000000000 },
      { symbol: 'ETH', name: 'Ethereum', price: 3245, cap: 390000000000 },
      { symbol: 'BNB', name: 'BNB', price: 582, cap: 84000000000 },
      { symbol: 'SOL', name: 'Solana', price: 152, cap: 68000000000 },
      { symbol: 'XRP', name: 'XRP', price: 0.55, cap: 30000000000 },
      { symbol: 'ADA', name: 'Cardano', price: 0.46, cap: 16000000000 },
      { symbol: 'AVAX', name: 'Avalanche', price: 38, cap: 14000000000 },
      { symbol: 'DOT', name: 'Polkadot', price: 7.5, cap: 10000000000 },
      { symbol: 'MATIC', name: 'Polygon', price: 0.85, cap: 8000000000 },
      { symbol: 'LINK', name: 'Chainlink', price: 14.2, cap: 8500000000 },
    ];

    topCoins.forEach((coin, index) => {
      const priceChange = (Math.random() - 0.5) * 10; // ±5%
      mockCoins.push({
        id: index + 1,
        name: coin.name,
        symbol: coin.symbol,
        slug: coin.name.toLowerCase().replace(' ', '-'),
        rank: index + 1,
        price: coin.price,
        volume24h: coin.cap * 0.05, // 5% of market cap
        volumeChange24h: (Math.random() - 0.5) * 20,
        percentChange1h: (Math.random() - 0.5) * 2,
        percentChange24h: priceChange,
        percentChange7d: (Math.random() - 0.5) * 20,
        percentChange30d: (Math.random() - 0.5) * 40,
        percentChange60d: (Math.random() - 0.5) * 60,
        percentChange90d: (Math.random() - 0.5) * 80,
        marketCap: coin.cap,
        marketCapDominance: (coin.cap / 2400000000000) * 100,
        fullyDilutedMarketCap: coin.cap * 1.2,
        circulatingSupply: coin.cap / coin.price,
        totalSupply: (coin.cap / coin.price) * 1.1,
        maxSupply: coin.symbol === 'BTC' ? 21000000 : null,
        lastUpdated: new Date().toISOString(),
        tags: ['layer-1', 'proof-of-stake'],
        platform: null,
      });
    });

    // Generate remaining 90 coins
    for (let i = 10; i < 100; i++) {
      const price = Math.random() * 100 + 1;
      const cap = Math.random() * 5000000000 + 100000000;

      mockCoins.push({
        id: i + 1,
        name: `Coin ${i + 1}`,
        symbol: `C${i + 1}`,
        slug: `coin-${i + 1}`,
        rank: i + 1,
        price,
        volume24h: cap * 0.05,
        volumeChange24h: (Math.random() - 0.5) * 20,
        percentChange1h: (Math.random() - 0.5) * 2,
        percentChange24h: (Math.random() - 0.5) * 10,
        percentChange7d: (Math.random() - 0.5) * 20,
        percentChange30d: (Math.random() - 0.5) * 40,
        percentChange60d: (Math.random() - 0.5) * 60,
        percentChange90d: (Math.random() - 0.5) * 80,
        marketCap: cap,
        marketCapDominance: (cap / 2400000000000) * 100,
        fullyDilutedMarketCap: cap * 1.2,
        circulatingSupply: cap / price,
        totalSupply: (cap / price) * 1.1,
        maxSupply: null,
        lastUpdated: new Date().toISOString(),
        tags: ['defi', 'layer-2'],
        platform: null,
      });
    }

    return mockCoins;
  }

  /**
   * Get trending coins (biggest movers)
   */
  async getTrendingCoins(limit: number = 10): Promise<CMCCoin[]> {
    const allCoins = await this.getTop100();
    return allCoins
      .sort((a, b) => Math.abs(b.percentChange24h) - Math.abs(a.percentChange24h))
      .slice(0, limit);
  }

  /**
   * Get top gainers
   */
  async getTopGainers(limit: number = 10): Promise<CMCCoin[]> {
    const allCoins = await this.getTop100();
    return allCoins
      .sort((a, b) => b.percentChange24h - a.percentChange24h)
      .slice(0, limit);
  }

  /**
   * Get top losers
   */
  async getTopLosers(limit: number = 10): Promise<CMCCoin[]> {
    const allCoins = await this.getTop100();
    return allCoins
      .sort((a, b) => a.percentChange24h - b.percentChange24h)
      .slice(0, limit);
  }

  /**
   * Get coins by category/tag
   */
  async getCoinsByTag(tag: string): Promise<CMCCoin[]> {
    const allCoins = await this.getTop100();
    return allCoins.filter(coin => coin.tags.includes(tag));
  }

  /**
   * Search coins by name or symbol
   */
  async searchCoins(query: string): Promise<CMCCoin[]> {
    const allCoins = await this.getTop100();
    const lowerQuery = query.toLowerCase();
    return allCoins.filter(
      coin =>
        coin.name.toLowerCase().includes(lowerQuery) ||
        coin.symbol.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️  Cache cleared');
  }
}

// Singleton instance
export const coinMarketCapService = new CoinMarketCapService();
