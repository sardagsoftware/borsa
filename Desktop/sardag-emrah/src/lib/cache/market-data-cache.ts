/**
 * MARKET DATA CACHE
 *
 * Specialized caching for trading data:
 * - Candles (OHLCV data)
 * - Trading signals
 * - Market overview
 * - Symbol information
 *
 * STRATEGIES:
 * - Candles: Long TTL (15 minutes), IndexedDB
 * - Signals: Medium TTL (5 minutes), localStorage
 * - Market data: Short TTL (1 minute), memory
 * - Stale-while-revalidate for all
 *
 * BENEFITS:
 * - Reduce Binance API calls
 * - Faster page loads
 * - Offline support (with stale data)
 * - Better user experience
 */

import { cacheManager, type CacheOptions } from './cache-manager';
import type { AggregatedSignal } from '../strategy-aggregator';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketOverview {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  timestamp: number;
}

/**
 * Market Data Cache API
 */
class MarketDataCache {
  // Cache TTLs
  private readonly CANDLES_TTL = 15 * 60 * 1000;    // 15 minutes
  private readonly SIGNALS_TTL = 5 * 60 * 1000;     // 5 minutes
  private readonly MARKET_TTL = 1 * 60 * 1000;      // 1 minute
  private readonly OVERVIEW_TTL = 30 * 1000;        // 30 seconds

  // Cache key prefixes
  private readonly PREFIX_CANDLES = 'candles:';
  private readonly PREFIX_SIGNAL = 'signal:';
  private readonly PREFIX_MARKET = 'market:';
  private readonly PREFIX_OVERVIEW = 'overview:';

  /**
   * Cache candles for a symbol
   */
  async cacheCandles(
    symbol: string,
    timeframe: string,
    candles: Candle[]
  ): Promise<void> {
    const key = `${this.PREFIX_CANDLES}${symbol}:${timeframe}`;

    await cacheManager.set(key, candles, {
      ttl: this.CANDLES_TTL,
      tier: 'indexedDB', // Large data
      staleWhileRevalidate: true,
    });
  }

  /**
   * Get cached candles
   */
  async getCandles(
    symbol: string,
    timeframe: string
  ): Promise<Candle[] | null> {
    const key = `${this.PREFIX_CANDLES}${symbol}:${timeframe}`;

    return cacheManager.get<Candle[]>(key, {
      staleWhileRevalidate: true,
      maxAge: 10 * 60 * 1000, // 10 minutes stale threshold
    });
  }

  /**
   * Cache trading signal
   */
  async cacheSignal(
    symbol: string,
    timeframe: string,
    signal: AggregatedSignal
  ): Promise<void> {
    const key = `${this.PREFIX_SIGNAL}${symbol}:${timeframe}`;

    await cacheManager.set(key, signal, {
      ttl: this.SIGNALS_TTL,
      tier: 'localStorage', // Medium data
      staleWhileRevalidate: true,
    });
  }

  /**
   * Get cached signal
   */
  async getSignal(
    symbol: string,
    timeframe: string
  ): Promise<AggregatedSignal | null> {
    const key = `${this.PREFIX_SIGNAL}${symbol}:${timeframe}`;

    return cacheManager.get<AggregatedSignal>(key, {
      staleWhileRevalidate: true,
      maxAge: 3 * 60 * 1000, // 3 minutes stale threshold
    });
  }

  /**
   * Cache market data (price, volume, etc.)
   */
  async cacheMarketData(
    symbol: string,
    data: {
      price: number;
      change24h: number;
      volume24h: number;
    }
  ): Promise<void> {
    const key = `${this.PREFIX_MARKET}${symbol}`;

    await cacheManager.set(
      key,
      {
        ...data,
        timestamp: Date.now(),
      },
      {
        ttl: this.MARKET_TTL,
        tier: 'memory', // Small, frequently accessed
      }
    );
  }

  /**
   * Get cached market data
   */
  async getMarketData(symbol: string): Promise<{
    price: number;
    change24h: number;
    volume24h: number;
    timestamp: number;
  } | null> {
    const key = `${this.PREFIX_MARKET}${symbol}`;

    return cacheManager.get(key, {
      staleWhileRevalidate: true,
      maxAge: 30 * 1000, // 30 seconds stale threshold
    });
  }

  /**
   * Cache market overview (all symbols)
   */
  async cacheMarketOverview(data: MarketOverview[]): Promise<void> {
    const key = `${this.PREFIX_OVERVIEW}all`;

    await cacheManager.set(key, data, {
      ttl: this.OVERVIEW_TTL,
      tier: 'memory',
    });
  }

  /**
   * Get cached market overview
   */
  async getMarketOverview(): Promise<MarketOverview[] | null> {
    const key = `${this.PREFIX_OVERVIEW}all`;

    return cacheManager.get<MarketOverview[]>(key, {
      staleWhileRevalidate: true,
      maxAge: 15 * 1000, // 15 seconds stale threshold
    });
  }

  /**
   * Invalidate all caches for a symbol
   */
  async invalidateSymbol(symbol: string): Promise<void> {
    // Delete all related caches
    const timeframes = ['1m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d', '1w'];

    for (const tf of timeframes) {
      await cacheManager.delete(`${this.PREFIX_CANDLES}${symbol}:${tf}`);
      await cacheManager.delete(`${this.PREFIX_SIGNAL}${symbol}:${tf}`);
    }

    await cacheManager.delete(`${this.PREFIX_MARKET}${symbol}`);

    console.log(`[MarketCache] 🗑️ Invalidated all caches for ${symbol}`);
  }

  /**
   * Clear all market data caches
   */
  async clearAll(): Promise<void> {
    await cacheManager.clearAll();
    console.log('[MarketCache] 🗑️ All market data caches cleared');
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    return cacheManager.getStats();
  }

  /**
   * Preload candles for multiple symbols (background task)
   */
  async preloadCandles(
    symbols: string[],
    timeframe: string = '4h',
    fetchFn: (symbol: string, timeframe: string) => Promise<Candle[]>
  ): Promise<void> {
    console.log(`[MarketCache] 🔄 Preloading candles for ${symbols.length} symbols...`);

    const promises = symbols.map(async (symbol) => {
      try {
        // Check if already cached
        const cached = await this.getCandles(symbol, timeframe);
        if (cached) {
          return; // Already cached
        }

        // Fetch and cache
        const candles = await fetchFn(symbol, timeframe);
        await this.cacheCandles(symbol, timeframe, candles);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`[MarketCache] Failed to preload ${symbol}:`, error);
      }
    });

    await Promise.all(promises);
    console.log(`[MarketCache] ✅ Preload complete`);
  }

  /**
   * Get cache hit rate (for monitoring)
   */
  getCacheHitRate(): {
    hits: number;
    misses: number;
    rate: number;
  } {
    // This would be tracked separately in production
    // For now, return placeholder
    return {
      hits: 0,
      misses: 0,
      rate: 0,
    };
  }
}

// Singleton instance
export const marketDataCache = new MarketDataCache();

// Export types
export type { MarketDataCache };
