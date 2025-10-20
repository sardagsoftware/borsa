import type { Candle } from "@/types/ohlc";

export function pivotsClassic(candles: Candle[]): number[] {
  if (candles.length < 2) return [];
  const last = candles[candles.length - 2];
  const P = (last.high + last.low + last.close) / 3;
  const R1 = 2 * P - last.low;
  const S1 = 2 * P - last.high;
  const R2 = P + (last.high - last.low);
  const S2 = P - (last.high - last.low);
  const R3 = last.high + 2 * (P - last.low);
  const S3 = last.low - 2 * (last.high - P);
  return [S3, S2, S1, P, R1, R2, R3].filter(Number.isFinite);
}

export function zigzag(candles: Candle[], deviationPct = 5): { time: number; value: number }[] {
  const out: { time: number; value: number }[] = [];
  if (candles.length < 2) return out;
  const dev = deviationPct / 100;
  let dir: "up" | "down" | "none" = "none";
  let pivot = candles[0];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    if (dir === "none") {
      if (c.close > pivot.close * (1 + dev)) {
        dir = "up";
        out.push({ time: pivot.time, value: pivot.close });
      } else if (c.close < pivot.close * (1 - dev)) {
        dir = "down";
        out.push({ time: pivot.time, value: pivot.close });
      }
      if (Math.abs(c.close - pivot.close) > pivot.close * dev) pivot = c;
    } else if (dir === "up") {
      if (c.close < pivot.close * (1 - dev)) {
        dir = "down";
        out.push({ time: pivot.time, value: pivot.close });
        pivot = c;
      }
      if (c.close > pivot.close) pivot = c;
    } else {
      if (c.close > pivot.close * (1 + dev)) {
        dir = "up";
        out.push({ time: pivot.time, value: pivot.close });
        pivot = c;
      }
      if (c.close < pivot.close) pivot = c;
    }
  }
  out.push({ time: pivot.time, value: pivot.close });
  return out;
}
