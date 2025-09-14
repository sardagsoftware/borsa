interface CMCCrypto {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  cmc_rank: number;
  market_cap: number;
  price: number;
  percent_change_1h: number;
  percent_change_24h: number;
  percent_change_7d: number;
  volume_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply?: number;
  last_updated: string;
}

interface CMCResponse {
  data: CMCCrypto[];
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
    elapsed: number;
    credit_count: number;
  };
}

class CoinMarketCapService {
  private apiKey: string;
  private baseUrl = 'https://pro-api.coinmarketcap.com/v1';
  private cache: Map<string, { data: CMCCrypto[], timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.apiKey = process.env.COINMARKETCAP_API_KEY || '';
    if (!this.apiKey) {
      console.warn('CoinMarketCap API key not configured');
    }
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    if (!this.apiKey) {
      throw new Error('CoinMarketCap API key not configured');
    }

    const url = new URL(endpoint, this.baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-CMC_PRO_API_KEY': this.apiKey,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`CMC API error: ${response.status} - ${errorData.status?.error_message || response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status?.error_code !== 0) {
        throw new Error(`CMC API error: ${data.status.error_message}`);
      }

      return data;
    } catch (error) {
      console.error('CoinMarketCap API request failed:', error);
      throw error;
    }
  }

  /**
   * Get top 100 cryptocurrencies with current prices
   */
  async getTop100(): Promise<CMCCrypto[]> {
    const cacheKey = 'top100';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response: CMCResponse = await this.makeRequest('/cryptocurrency/listings/latest', {
        start: 1,
        limit: 100,
        convert: 'USD',
        sort: 'market_cap',
        sort_dir: 'desc'
      });

      const data = response.data.map(crypto => ({
        id: crypto.id,
        name: crypto.name,
        symbol: crypto.symbol,
        slug: crypto.slug,
        cmc_rank: crypto.cmc_rank,
        market_cap: crypto.market_cap,
        price: crypto.price,
        percent_change_1h: crypto.percent_change_1h,
        percent_change_24h: crypto.percent_change_24h,
        percent_change_7d: crypto.percent_change_7d,
        volume_24h: crypto.volume_24h,
        circulating_supply: crypto.circulating_supply,
        total_supply: crypto.total_supply,
        max_supply: crypto.max_supply,
        last_updated: crypto.last_updated,
      }));

      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Failed to fetch top 100 cryptocurrencies:', error);
      // Return cached data if available, even if expired
      if (cached) {
        console.log('Returning stale cached data due to API error');
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Get specific cryptocurrency data
   */
  async getCryptoData(symbols: string[]): Promise<CMCCrypto[]> {
    if (symbols.length === 0) return [];

    const cacheKey = `symbols_${symbols.join('_')}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response: CMCResponse = await this.makeRequest('/cryptocurrency/quotes/latest', {
        symbol: symbols.join(','),
        convert: 'USD'
      });

      const data = Object.values(response.data).map((crypto: any) => ({
        id: crypto.id,
        name: crypto.name,
        symbol: crypto.symbol,
        slug: crypto.slug,
        cmc_rank: crypto.cmc_rank,
        market_cap: crypto.quote.USD.market_cap,
        price: crypto.quote.USD.price,
        percent_change_1h: crypto.quote.USD.percent_change_1h,
        percent_change_24h: crypto.quote.USD.percent_change_24h,
        percent_change_7d: crypto.quote.USD.percent_change_7d,
        volume_24h: crypto.quote.USD.volume_24h,
        circulating_supply: crypto.circulating_supply,
        total_supply: crypto.total_supply,
        max_supply: crypto.max_supply,
        last_updated: crypto.quote.USD.last_updated,
      }));

      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error(`Failed to fetch crypto data for ${symbols.join(', ')}:`, error);
      if (cached) {
        console.log('Returning stale cached data due to API error');
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Get cryptocurrency metadata
   */
  async getCryptoMetadata(symbols: string[]): Promise<any[]> {
    if (symbols.length === 0) return [];

    try {
      const response = await this.makeRequest('/cryptocurrency/info', {
        symbol: symbols.join(',')
      });

      return Object.values(response.data);
    } catch (error) {
      console.error(`Failed to fetch crypto metadata for ${symbols.join(', ')}:`, error);
      throw error;
    }
  }

  /**
   * Search cryptocurrencies
   */
  async searchCrypto(query: string): Promise<CMCCrypto[]> {
    const top100 = await this.getTop100();
    
    const searchLower = query.toLowerCase();
    return top100.filter(crypto => 
      crypto.name.toLowerCase().includes(searchLower) ||
      crypto.symbol.toLowerCase().includes(searchLower) ||
      crypto.slug.toLowerCase().includes(searchLower)
    ).slice(0, 20); // Return max 20 results
  }

  /**
   * Get trending cryptocurrencies
   */
  async getTrending(): Promise<CMCCrypto[]> {
    const top100 = await this.getTop100();
    
    // Sort by 24h change percentage (descending)
    return top100
      .filter(crypto => crypto.percent_change_24h > 0)
      .sort((a, b) => b.percent_change_24h - a.percent_change_24h)
      .slice(0, 10);
  }

  /**
   * Get biggest losers
   */
  async getBiggestLosers(): Promise<CMCCrypto[]> {
    const top100 = await this.getTop100();
    
    // Sort by 24h change percentage (ascending)
    return top100
      .filter(crypto => crypto.percent_change_24h < 0)
      .sort((a, b) => a.percent_change_24h - b.percent_change_24h)
      .slice(0, 10);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { entries: number; keys: string[] } {
    return {
      entries: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const coinMarketCapService = new CoinMarketCapService();
export type { CMCCrypto, CMCResponse };
