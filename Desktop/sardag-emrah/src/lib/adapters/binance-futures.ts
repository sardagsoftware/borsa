import type { Candle, Interval } from "@/types/ohlc";

const FUTURES_REST_BASE = "https://fapi.binance.com";
const FUTURES_WS_BASE = "wss://fstream.binance.com";

export class BinanceFuturesError extends Error {
  constructor(message: string, public code?: number) {
    super(message);
    this.name = "BinanceFuturesError";
  }
}

export class BinanceFuturesTimeoutError extends BinanceFuturesError {
  constructor() {
    super("Binance Futures request timeout", 408);
    this.name = "BinanceFuturesTimeoutError";
  }
}

type BinanceKline = [
  number, // 0: open time
  string, // 1: open
  string, // 2: high
  string, // 3: low
  string, // 4: close
  string, // 5: volume
  number, // 6: close time
  string, // 7: quote asset volume
  number, // 8: number of trades
  string, // 9: taker buy base asset volume
  string, // 10: taker buy quote asset volume
  string  // 11: ignore
];

/**
 * Fetch historical klines from Binance Futures
 */
export async function fetchFuturesKlines(
  symbol: string,
  interval: Interval,
  limit = 500
): Promise<Candle[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const url = `${FUTURES_REST_BASE}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const response = await fetch(url, { signal: controller.signal });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new BinanceFuturesError(
        `Binance Futures API error: ${response.status} ${errorText}`,
        response.status
      );
    }

    const data: BinanceKline[] = await response.json();

    return data.map((k) => ({
      time: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new BinanceFuturesTimeoutError();
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Subscribe to real-time kline updates from Binance Futures WebSocket
 */
export function subscribeFuturesKline(
  symbol: string,
  interval: Interval,
  onCandle: (candle: Candle, isFinal: boolean) => void,
  onError?: (err: Error) => void
): () => void {
  const stream = `${symbol.toLowerCase()}@kline_${interval}`;
  const url = `${FUTURES_WS_BASE}/ws/${stream}`;

  let ws: WebSocket | null = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const reconnectDelay = 2000;

  const connect = () => {
    try {
      ws = new WebSocket(url);

      ws.onopen = () => {
        console.log(`[Binance Futures WS] Connected to ${stream}`);
        reconnectAttempts = 0;
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const k = msg.k;

          if (!k) return;

          const candle: Candle = {
            time: k.t,
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c),
            volume: parseFloat(k.v),
          };

          onCandle(candle, k.x);
        } catch (err) {
          console.error("[Binance Futures WS] Parse error:", err);
        }
      };

      ws.onerror = (event) => {
        const error = new BinanceFuturesError("WebSocket error");
        console.error("[Binance Futures WS] Error:", error);
        onError?.(error);
      };

      ws.onclose = (event) => {
        console.log(`[Binance Futures WS] Closed: ${event.code} ${event.reason}`);

        // Auto-reconnect if not intentional close
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          console.log(`[Binance Futures WS] Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`);
          setTimeout(connect, reconnectDelay * reconnectAttempts);
        }
      };
    } catch (err) {
      console.error("[Binance Futures WS] Connection error:", err);
      onError?.(err instanceof Error ? err : new Error("Unknown error"));
    }
  };

  connect();

  // Return cleanup function
  return () => {
    if (ws) {
      ws.close(1000, "Client disconnect");
      ws = null;
    }
  };
}
