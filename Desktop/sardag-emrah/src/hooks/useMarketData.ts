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
  baseAsset?: string; // For futures
  isFutures?: boolean; // Futures flag
}

interface UseMarketDataReturn {
  data: MarketData[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  marketType: 'spot' | 'futures';
  setMarketType: (type: 'spot' | 'futures') => void;
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
async function fetchMarketData(type: 'spot' | 'futures' = 'futures'): Promise<MarketData[]> {
  try {
    console.log(`[Market] 📡 Fetching ${type} data from API...`);

    // Choose API based on market type
    const apiUrl = type === 'futures' ? '/api/futures-all' : '/api/market/overview';
    console.log('[Market] URL:', window.location.origin + apiUrl);

    // 1. Fetch tickers
    const tickerRes = await fetch(apiUrl, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('[Market] Response status:', tickerRes.status);
    console.log('[Market] Response ok:', tickerRes.ok);

    if (!tickerRes.ok) {
      const errorText = await tickerRes.text();
      console.error('[Market] API error response:', errorText);
      throw new Error(`API error: ${tickerRes.status} - ${errorText.slice(0, 100)}`);
    }

    const tickerData = await tickerRes.json();
    console.log('[Market] Ticker data received:', tickerData);

    if (!tickerData.success || !tickerData.data) {
      console.error('[Market] Invalid response structure:', tickerData);
      throw new Error('Invalid API response');
    }

    const tickers = tickerData.data;
    console.log(`[Market] ✅ Got ${tickers.length} ${type} tickers`);

    // For futures, data is already complete
    if (type === 'futures') {
      const marketData: MarketData[] = tickers.map((ticker: any) => ({
        ...ticker,
        sparkline: [],
        change7d: 0,
        changePercent7d: ticker.changePercent24h || 0, // Use 24h as approximation
        isFutures: true,
      }));
      console.log('[Market] ✅ Futures data ready!');
      return marketData;
    }

    // For spot, fetch sparklines for top 20
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

    // 3. Combine data for spot
    const marketData: MarketData[] = tickers.map((ticker: any) => {
      const sparkline = sparklineData[ticker.symbol];
      return {
        ...ticker,
        sparkline: sparkline?.prices || [],
        change7d: sparkline?.change7d || 0,
        changePercent7d: sparkline?.changePercent7d || 0,
        isFutures: false,
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
  const [retryCount, setRetryCount] = useState(0);
  const [marketType, setMarketType] = useState<'spot' | 'futures'>('futures'); // Default: Futures

  // Initial load
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        console.log('[Market] 🚀 Component mounted, starting data load...');
        console.log('[Market] isMounted:', isMounted);
        setLoading(true);
        setError(null);

        // Try cache first (instant display)
        const cached = getCached();
        console.log('[Market] Cache check result:', cached ? cached.length : 'null');
        if (cached && cached.length > 0) {
          console.log('[Market] 📦 Using cache:', cached.length, 'coins');
          if (isMounted) {
            console.log('[Market] Setting cached data to state...');
            setData(cached);
            setLoading(false);
            console.log('[Market] ✅ Cached data set, loading=false');
          }

          // Background refresh
          setTimeout(() => {
            fetchMarketData(marketType)
              .then((fresh) => {
                if (isMounted && fresh.length > 0) {
                  console.log('[Market] 🔄 Background update:', fresh.length, 'coins');
                  setData(fresh);
                  setCache(fresh);
                }
              })
              .catch((err) => {
                console.warn('[Market] Background update failed:', err);
              });
          }, 100);

          return;
        }

        // No cache: Fresh fetch
        console.log('[Market] 📡 No cache, fresh fetch...');
        console.log('[Market] Calling fetchMarketData()...');
        const marketData = await fetchMarketData(marketType);
        console.log('[Market] fetchMarketData() returned:', marketData?.length, 'items');

        if (!isMounted) {
          console.log('[Market] Component unmounted, skipping update');
          return;
        }

        if (!marketData || marketData.length === 0) {
          console.error('[Market] Empty data received!');
          throw new Error('No market data received from API');
        }

        console.log('[Market] ✅ Setting data to state:', marketData.length, 'coins');
        setData(marketData);
        console.log('[Market] Data set! Now caching...');
        setCache(marketData);
        console.log('[Market] Setting loading=false...');
        setLoading(false);
        console.log('[Market] ✅ ALL DONE! Data should be visible now.');
      } catch (err) {
        if (!isMounted) return;

        console.error('[Market] ❌ Error:', err);
        setError(err instanceof Error ? err.message : 'Data fetch failed');
        setLoading(false);
      }
    };

    // Small delay to ensure client-side mounting
    const timer = setTimeout(() => {
      loadData();
    }, 100);

    // Auto-retry if stuck in loading after 5 seconds
    const retryTimer = setTimeout(() => {
      if (loading && data.length === 0 && retryCount < 3) {
        console.warn('[Market] ⚠️ Still loading after 5s, retrying...', retryCount + 1);
        setRetryCount(prev => prev + 1);
        loadData();
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      clearTimeout(retryTimer);
    };
  }, [retryCount, marketType]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    // Skip if no data yet
    if (data.length === 0) return;

    console.log('[Market] 🔄 Starting auto-refresh timer (10s)');

    const interval = setInterval(async () => {
      try {
        console.log('[Market] 🔄 Auto-refreshing data...');
        const marketData = await fetchMarketData(marketType);
        if (marketData && marketData.length > 0) {
          setData(marketData);
          setCache(marketData);
          console.log('[Market] ✅ Auto-refresh successful');
        }
      } catch (err) {
        console.warn('[Market] Auto-refresh failed (silent):', err);
        // Don't show error to user for background refresh failures
      }
    }, 10000); // 10 seconds

    return () => {
      console.log('[Market] 🛑 Clearing auto-refresh timer');
      clearInterval(interval);
    };
  }, [data.length, marketType]);

  // Manual refresh
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const marketData = await fetchMarketData(marketType);
      setData(marketData);
      setCache(marketData);
      setLoading(false);
    } catch (err) {
      console.error('[Market] Refresh error:', err);
      setError('Refresh failed');
      setLoading(false);
    }
  }, [marketType]);

  return {
    data,
    loading,
    error,
    refresh,
    marketType,
    setMarketType,
  };
}
