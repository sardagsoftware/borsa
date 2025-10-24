import type { Candle, Interval } from "@/types/ohlc";

const REST_BASE = process.env.NEXT_PUBLIC_BINANCE_REST_BASE || "https://api.binance.com";
const WS_BASE = process.env.NEXT_PUBLIC_BINANCE_WS_BASE || "wss://stream.binance.com:9443";

const intervalMap: Record<Interval, string> = {
  "1m": "1m",
  "5m": "5m",
  "15m": "15m",
  "1h": "1h",
  "4h": "4h",
  "1d": "1d",
  "1w": "1w",
};

export class BinanceError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "BinanceError";
  }
}

export async function fetchKlines(
  symbol: string,
  interval: Interval,
  limit = 500
): Promise<Candle[]> {
  try {
    const url = new URL(`${REST_BASE}/api/v3/klines`);
    url.searchParams.set("symbol", symbol.toUpperCase());
    url.searchParams.set("interval", intervalMap[interval]);
    url.searchParams.set("limit", String(Math.min(limit, 1000)));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const r = await fetch(url.toString(), {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!r.ok) {
      throw new BinanceError(`HTTP ${r.status}`, r.status);
    }

    const data = (await r.json()) as any[];

    return data.map((k) => ({
      time: k[0],
      open: +k[1],
      high: +k[2],
      low: +k[3],
      close: +k[4],
      volume: +k[5],
    }));
  } catch (err) {
    if (err instanceof BinanceError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new BinanceError("Request timeout", 408);
    }
    throw new BinanceError("Failed to fetch klines");
  }
}

export function subscribeKline(
  symbol: string,
  interval: Interval,
  onCandle: (c: Candle, final: boolean) => void,
  onError?: (err: Error) => void
) {
  const stream = `${symbol.toLowerCase()}@kline_${intervalMap[interval]}`;
  let ws: WebSocket | undefined;
  let retry = 0;

  const connect = () => {
    try {
      ws = new WebSocket(`${WS_BASE}/ws/${stream}`);

      ws.onopen = () => {
        retry = 0;
        console.log(`[WS] Connected to ${symbol} ${interval}`);
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data));
          const k = msg.k;
          const candle: Candle = {
            time: k.t,
            open: +k.o,
            high: +k.h,
            low: +k.l,
            close: +k.c,
            volume: +k.v,
          };
          onCandle(candle, !!k.x);
        } catch (err) {
          console.error("[WS] Parse error:", err);
        }
      };

      ws.onclose = () => {
        const delay = Math.min(30000, 1000 * Math.pow(2, retry++));
        setTimeout(connect, delay);
      };

      ws.onerror = (err) => {
        console.error("[WS] Error:", err);
        onError?.(new Error("WebSocket error"));
        ws?.close();
      };
    } catch (err) {
      onError?.(err as Error);
    }
  };

  connect();

  return () => {
    ws?.close();
  };
}
