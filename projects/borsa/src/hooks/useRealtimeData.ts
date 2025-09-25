'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getStocks, getCryptos, getMarketSummary } from '@/lib/api';
import { Stock, Crypto, MarketSummary } from '@/types/market';
import { webSocketService } from '@/services/websocket';

interface RealtimeDataHook {
  stocks: Stock[];
  cryptos: Crypto[];
  marketSummary: MarketSummary | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  refetch: () => Promise<void>;
}

export function useRealtimeData(options?: {
  refreshInterval?: number;
  enableAutoRefresh?: boolean;
}): RealtimeDataHook {
  const { refreshInterval = 30000, enableAutoRefresh = true } = options || {};
  
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [marketSummary, setMarketSummary] = useState<MarketSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('connecting');
  
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isUnmountedRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (isUnmountedRef.current) return;

    try {
      setConnectionStatus('connecting');
      
      const [stocksResponse, cryptosResponse, summaryResponse] = await Promise.all([
        getStocks(),
        getCryptos(),
        getMarketSummary(),
      ]);

      if (isUnmountedRef.current) return;

      if (stocksResponse.error || cryptosResponse.error || summaryResponse.error) {
        throw new Error(stocksResponse.error || cryptosResponse.error || summaryResponse.error);
      }

      if (stocksResponse.data) setStocks(stocksResponse.data);
      if (cryptosResponse.data) setCryptos(cryptosResponse.data);
      if (summaryResponse.data) setMarketSummary(summaryResponse.data);
      
      setError(null);
      setLastUpdated(new Date());
      setConnectionStatus('connected');
    } catch (err) {
      if (isUnmountedRef.current) return;

      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch market data';
      setError(errorMessage);
      setConnectionStatus('error');
      console.error('Real-time data fetch error:', err);
    } finally {
      if (!isUnmountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Start real-time updates
  const startRealtimeUpdates = useCallback(() => {
    if (!enableAutoRefresh) return;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval
    intervalRef.current = setInterval(fetchData, refreshInterval);
  }, [fetchData, refreshInterval, enableAutoRefresh]);

  // Stop real-time updates
  const stopRealtimeUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    setConnectionStatus('disconnected');
  }, []);

  // Manual refetch function
  const refetch = useCallback(async () => {
    setLoading(true);
    await fetchData();
  }, [fetchData]);

  // Initialize data and start updates
  useEffect(() => {
    isUnmountedRef.current = false;
    fetchData();
    startRealtimeUpdates();
    
    // Set up WebSocket subscriptions for enhanced real-time updates
    const stockSymbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA'];
    const cryptoSymbols = ['bitcoin', 'ethereum', 'cardano', 'solana', 'polkadot'];
    
    const unsubscribeFunctions: Array<() => void> = [];
    
    // Subscribe to stock updates
    stockSymbols.forEach(symbol => {
      const unsubscribe = webSocketService.subscribe(symbol, 'stock', (data) => {
        if (!isUnmountedRef.current) {
          setStocks(prevStocks => 
            prevStocks.map(stock => 
              stock.symbol === data.symbol 
                ? { 
                    ...stock, 
                    currentPrice: data.price, 
                    change: data.change,
                    volume: data.volume,
                    lastUpdated: new Date().toISOString()
                  }
                : stock
            )
          );
          setLastUpdated(new Date());
        }
      });
      unsubscribeFunctions.push(unsubscribe);
    });
    
    // Subscribe to crypto updates
    cryptoSymbols.forEach(symbol => {
      const unsubscribe = webSocketService.subscribe(symbol, 'crypto', (data) => {
        if (!isUnmountedRef.current) {
          setCryptos(prevCryptos => 
            prevCryptos.map(crypto => 
              crypto.symbol === data.symbol 
                ? { 
                    ...crypto, 
                    currentPrice: data.price, 
                    change: data.change,
                    volume: data.volume,
                    lastUpdated: new Date().toISOString()
                  }
                : crypto
            )
          );
          setLastUpdated(new Date());
        }
      });
      unsubscribeFunctions.push(unsubscribe);
    });

    return () => {
      isUnmountedRef.current = true;
      stopRealtimeUpdates();
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [fetchData, startRealtimeUpdates, stopRealtimeUpdates]);

  // Handle visibility change (pause updates when tab is not visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopRealtimeUpdates();
      } else if (enableAutoRefresh) {
        startRealtimeUpdates();
        // Refresh immediately when tab becomes visible
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData, startRealtimeUpdates, stopRealtimeUpdates, enableAutoRefresh]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      if (enableAutoRefresh) {
        startRealtimeUpdates();
        fetchData();
      }
    };

    const handleOffline = () => {
      stopRealtimeUpdates();
      setConnectionStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchData, startRealtimeUpdates, stopRealtimeUpdates, enableAutoRefresh]);

  return {
    stocks,
    cryptos,
    marketSummary,
    loading,
    error,
    lastUpdated,
    connectionStatus,
    refetch,
  };
}

// Hook for single stock real-time data
export function useRealtimeStock(symbol: string) {
  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { stocks, loading: stocksLoading } = useRealtimeData();

  useEffect(() => {
    if (!stocksLoading && stocks.length > 0) {
      const foundStock = stocks.find(s => s.symbol.toLowerCase() === symbol.toLowerCase());
      setStock(foundStock || null);
      setLoading(false);
      setError(foundStock ? null : `Stock ${symbol} not found`);
    }
  }, [stocks, symbol, stocksLoading]);

  return { stock, loading: loading || stocksLoading, error };
}

// Hook for single crypto real-time data
export function useRealtimeCrypto(id: string) {
  const [crypto, setCrypto] = useState<Crypto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { cryptos, loading: cryptosLoading } = useRealtimeData();

  useEffect(() => {
    if (!cryptosLoading && cryptos.length > 0) {
      const foundCrypto = cryptos.find(c => 
        c.id.toLowerCase() === id.toLowerCase() || 
        c.symbol.toLowerCase() === id.toLowerCase()
      );
      setCrypto(foundCrypto || null);
      setLoading(false);
      setError(foundCrypto ? null : `Cryptocurrency ${id} not found`);
    }
  }, [cryptos, id, cryptosLoading]);

  return { crypto, loading: loading || cryptosLoading, error };
}

// Alias for backward compatibility
export const useRealTimeData = useRealtimeData;
