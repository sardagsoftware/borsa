/**
 * BINANCE WEBSOCKET HOOK
 * Real-time price streaming from Binance WebSocket API
 * Usage: const { prices, isConnected } = useBinanceWebSocket(['BTCUSDT', 'ETHUSDT'])
 */

import { useEffect, useState, useRef } from 'react';

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

interface WebSocketMessage {
  e: string; // Event type
  s: string; // Symbol
  c: string; // Current price
  P: string; // Price change percent
  v: string; // Volume
  h: string; // High price
  l: string; // Low price
  E: number; // Event time
}

export function useBinanceWebSocket(symbols: string[] = ['BTCUSDT']) {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (symbols.length === 0) return;

    let isMounted = true;

    const connect = () => {
      try {
        // Binance WebSocket endpoint for 24hr ticker
        const streams = symbols
          .map(symbol => `${symbol.toLowerCase()}@ticker`)
          .join('/');

        const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;

        console.log('🔌 Connecting to Binance WebSocket...', symbols);

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isMounted) {
            console.log('✅ Binance WebSocket connected');
            setIsConnected(true);
            setError(null);
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.stream && data.data) {
              const ticker: WebSocketMessage = data.data;

              const priceData: PriceData = {
                symbol: ticker.s,
                price: parseFloat(ticker.c),
                change24h: parseFloat(ticker.P),
                volume24h: parseFloat(ticker.v),
                high24h: parseFloat(ticker.h),
                low24h: parseFloat(ticker.l),
                timestamp: ticker.E
              };

              if (isMounted) {
                setPrices(prev => ({
                  ...prev,
                  [ticker.s]: priceData
                }));
              }
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };

        ws.onerror = (event) => {
          console.error('❌ Binance WebSocket error:', event);
          if (isMounted) {
            setError('WebSocket connection error');
          }
        };

        ws.onclose = () => {
          console.log('🔌 Binance WebSocket disconnected');
          if (isMounted) {
            setIsConnected(false);

            // Auto-reconnect after 5 seconds
            reconnectTimeoutRef.current = setTimeout(() => {
              if (isMounted) {
                console.log('🔄 Attempting to reconnect...');
                connect();
              }
            }, 5000);
          }
        };

      } catch (err) {
        console.error('Error creating WebSocket:', err);
        if (isMounted) {
          setError('Failed to create WebSocket connection');
        }
      }
    };

    connect();

    // Cleanup function
    return () => {
      isMounted = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [symbols.join(',')]); // Re-connect when symbols change

  return { prices, isConnected, error };
}

/**
 * MULTI-COIN WEBSOCKET HOOK
 * Automatically fetch and stream Top 100 coins
 */
export function useMultiCoinWebSocket(limit: number = 20) {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch top symbols from API
    fetch(`/api/trading/top100?limit=${limit}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          const topSymbols = data.data.map((item: any) =>
            `${item.coin.symbol}USDT`
          ).filter((s: string) => s !== 'USDTUSDT'); // Remove USDT itself

          setSymbols(topSymbols);
        }
      })
      .catch(err => console.error('Error fetching top symbols:', err))
      .finally(() => setLoading(false));
  }, [limit]);

  const wsData = useBinanceWebSocket(symbols);

  return {
    ...wsData,
    loading,
    symbolCount: symbols.length
  };
}
