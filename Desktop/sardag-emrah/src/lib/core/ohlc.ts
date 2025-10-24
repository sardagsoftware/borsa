import type { Candle } from "@/types/ohlc";

export function mergeCandles(a: Candle[], b: Candle[]): Candle[] {
  const map = new Map<number, Candle>();
  for (const c of [...a, ...b]) {
    const prev = map.get(c.time);
    if (prev) {
      map.set(c.time, {
        time: c.time,
        open: prev.open,
        high: Math.max(prev.high, c.high),
        low: Math.min(prev.low, c.low),
        close: c.close,
        volume: prev.volume + c.volume,
      });
    } else {
      map.set(c.time, c);
    }
  }
  return Array.from(map.values()).sort((x, y) => x.time - y.time);
}

export function calculatePriceChange(candles: Candle[]): { change: number; changePercent: number } {
  if (candles.length < 2) return { change: 0, changePercent: 0 };
  const first = candles[0].open;
  const last = candles[candles.length - 1].close;
  const change = last - first;
  const changePercent = (change / first) * 100;
  return { change, changePercent };
}

export function calculateHigh24h(candles: Candle[]): number {
  if (candles.length === 0) return 0;
  return Math.max(...candles.map((c) => c.high));
}

export function calculateLow24h(candles: Candle[]): number {
  if (candles.length === 0) return 0;
  return Math.min(...candles.map((c) => c.low));
}
