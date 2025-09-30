/**
 * CoinMarketCap Top 100 Integration Service
 * Real-time cryptocurrency data from CoinMarketCap API
 */

export interface CoinData {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  rank: number;
  price: number;
  volume24h: number;
  marketCap: number;
  percentChange1h: number;
  percentChange24h: number;
  percentChange7d: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number | null;
  lastUpdated: string;
}

export interface CoinMarketCapResponse {
  success: boolean;
  data: CoinData[];
  timestamp: string;
}

class CoinMarketCapService {
  private cache: CoinData[] = [];
  private lastFetch: number = 0;
  private cacheDuration: number = 60000; // 1 minute

  async getTop100Coins(): Promise<CoinMarketCapResponse> {
    try {
      // Check cache first
      if (this.cache.length > 0 && Date.now() - this.lastFetch < this.cacheDuration) {
        return {
          success: true,
          data: this.cache,
          timestamp: new Date().toISOString()
        };
      }

      // Fetch from API
      const response = await fetch('/api/market/coinmarketcap?limit=100');

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        this.cache = result.data;
        this.lastFetch = Date.now();
      }

      return result;

    } catch (error) {
      console.error('❌ CoinMarketCap fetch error:', error);

      // Return cached data if available
      if (this.cache.length > 0) {
        return {
          success: true,
          data: this.cache,
          timestamp: new Date().toISOString()
        };
      }

      throw error;
    }
  }

  async getCoinBySymbol(symbol: string): Promise<CoinData | null> {
    const result = await this.getTop100Coins();
    return result.data.find(coin => coin.symbol === symbol.toUpperCase()) || null;
  }

  async getTopNCoins(n: number): Promise<CoinData[]> {
    const result = await this.getTop100Coins();
    return result.data.slice(0, n);
  }

  clearCache(): void {
    this.cache = [];
    this.lastFetch = 0;
  }
}

// Singleton instance
export const coinMarketCapService = new CoinMarketCapService();