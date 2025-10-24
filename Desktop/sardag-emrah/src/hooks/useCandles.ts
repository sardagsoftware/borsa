"use client";
import { useState, useEffect, useRef } from "react";
import type { Candle, Interval } from "@/types/ohlc";
import type { MarketType } from "@/store/useChartStore";
import { fetchKlines, subscribeKline } from "@/lib/adapters/binance";
import { fetchFuturesKlines, subscribeFuturesKline } from "@/lib/adapters/binance-futures";

// SADECE FUTURES - Default artık "futures"
export function useCandles(symbol: string, interval: Interval, market: MarketType = "futures") {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const lastParamsRef = useRef<{ symbol: string; interval: Interval; market: MarketType } | null>(null);

  useEffect(() => {
    // İlk render veya parametre değişikliğini kontrol et
    const paramsChanged =
      !lastParamsRef.current ||
      lastParamsRef.current.symbol !== symbol ||
      lastParamsRef.current.interval !== interval ||
      lastParamsRef.current.market !== market;

    if (!paramsChanged) return;

    lastParamsRef.current = { symbol, interval, market };

    // Cleanup previous WebSocket
    unsubRef.current?.();

    let isMounted = true;

    const loadHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = market === "futures"
          ? await fetchFuturesKlines(symbol, interval, 500)
          : await fetchKlines(symbol, interval, 500);

        if (isMounted) {
          setCandles(data);
        }
      } catch (err) {
        console.error("Failed to load history:", err);
        if (isMounted) {
          setError(err as Error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const startWS = () => {
      const onCandle = (c: Candle, isFinal?: boolean) => {
        if (!isMounted) return;

        setCandles((prev) => {
          if (prev.length === 0) return [c];
          const last = prev[prev.length - 1];
          if (c.time > last.time) return [...prev, c];
          const copy = [...prev];
          copy[copy.length - 1] = c;
          return copy;
        });
      };

      const onError = (err: Error) => {
        if (isMounted) {
          setError(err);
        }
      };

      unsubRef.current = market === "futures"
        ? subscribeFuturesKline(symbol, interval, onCandle, onError)
        : subscribeKline(symbol, interval, onCandle, onError);
    };

    // Load history then start WebSocket
    loadHistory().then(() => {
      if (isMounted) {
        startWS();
      }
    });

    return () => {
      isMounted = false;
      unsubRef.current?.();
    };
  }, [symbol, interval, market]);

  return { candles, loading, error };
}
