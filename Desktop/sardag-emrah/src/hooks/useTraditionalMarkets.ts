/**
 * TRADITIONAL MARKETS HOOK
 *
 * Forex, Commodities, Indices için data fetching hook
 */

import { useState, useEffect, useCallback } from 'react';
import type { TraditionalMarketData } from '@/types/traditional-markets';

interface UseTraditionalMarketsResult {
  data: TraditionalMarketData[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTraditionalMarkets(): UseTraditionalMarketsResult {
  const [data, setData] = useState<TraditionalMarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/traditional-markets/overview');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data || []);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      console.error('[useTraditionalMarkets] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch traditional markets');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
  };
}
