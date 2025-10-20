/**
 * useMarketData Hook - V2
 *
 * Server-side API ile ultra-hızlı market data
 * - CORS problemi yok
 * - Cache-first strategy
 * - Background updates
 * - Real-time WebSocket
 */

import { useState, useEffect, useCallback } from 'react';

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume: number;
  rank?: number;
  sparkline: number[];
  change7d: number;
  changePercent7d: number;
}

interface UseMarketDataReturn {
  data: MarketData[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const CACHE_KEY = 'market_data_v2';
const CACHE_TTL = 60000; // 1 minute

interface CachedData {
  data: MarketData[];
  timestamp: number;
}

// Cache helpers
function getCached(): MarketData[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsed: CachedData = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function setCache(data: MarketData[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (err) {
    console.error('[Cache] Save failed:', err);
  }
}

// Fetch market data from API route
async function fetchMarketData(): Promise<MarketData[]> {
  try {
    console.log('[Market] 📡 Fetching from API...');

    // 1. Fetch tickers
    const tickerRes = await fetch('/api/market/overview', {
      cache: 'no-store',
    });

    if (!tickerRes.ok) {
      throw new Error(`API error: ${tickerRes.status}`);
    }

    const tickerData = await tickerRes.json();

    if (!tickerData.success || !tickerData.data) {
      throw new Error('Invalid API response');
    }

    const tickers = tickerData.data;
    console.log(`[Market] ✅ Got ${tickers.length} tickers`);

    // 2. Fetch sparklines for top 20
    const top20 = tickers.slice(0, 20).map((t: any) => t.symbol);
    const sparklineRes = await fetch(`/api/market/sparkline?symbols=${top20.join(',')}`, {
      cache: 'no-store',
    });

    let sparklineData: Record<string, any> = {};
    if (sparklineRes.ok) {
      const sparklineJson = await sparklineRes.json();
      if (sparklineJson.success) {
        sparklineData = sparklineJson.data;
        console.log(`[Market] ✅ Got ${Object.keys(sparklineData).length} sparklines`);
      }
    }

    // 3. Combine data
    const marketData: MarketData[] = tickers.map((ticker: any) => {
      const sparkline = sparklineData[ticker.symbol];
      return {
        ...ticker,
        sparkline: sparkline?.prices || [],
        change7d: sparkline?.change7d || 0,
        changePercent7d: sparkline?.changePercent7d || 0,
      };
    });

    console.log('[Market] ✅ Data ready!');
    return marketData;
  } catch (error) {
    console.error('[Market] Fetch error:', error);
    throw error;
  }
}

export function useMarketData(): UseMarketDataReturn {
  const [data, setData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try cache first (instant display)
        const cached = getCached();
        if (cached && cached.length > 0) {
          console.log('[Market] 📦 Using cache');
          setData(cached);
          setLoading(false);

          // Background refresh
          fetchMarketData()
            .then((fresh) => {
              if (isMounted && fresh.length > 0) {
                console.log('[Market] 🔄 Background update');
                setData(fresh);
                setCache(fresh);
              }
            })
            .catch((err) => {
              console.warn('[Market] Background update failed:', err);
            });

          return;
        }

        // No cache: Fresh fetch
        console.log('[Market] 📡 Fresh fetch...');
        const marketData = await fetchMarketData();

        if (!isMounted) return;

        if (marketData.length === 0) {
          throw new Error('No market data');
        }

        setData(marketData);
        setCache(marketData);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;

        console.error('[Market] Error:', err);
        setError(err instanceof Error ? err.message : 'Data fetch failed');
        setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Manual refresh
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const marketData = await fetchMarketData();
      setData(marketData);
      setCache(marketData);
      setLoading(false);
    } catch (err) {
      console.error('[Market] Refresh error:', err);
      setError('Refresh failed');
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    refresh,
  };
}
