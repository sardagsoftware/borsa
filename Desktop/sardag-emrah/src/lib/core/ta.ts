import type { Candle } from "@/types/ohlc";

export function SMA(values: number[], length: number): number[] {
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= length) sum -= values[i - length];
    out.push(i >= length - 1 ? sum / length : NaN);
  }
  return out;
}

export function EMA(values: number[], length: number): number[] {
  const out: number[] = [];
  const k = 2 / (length + 1);
  let prev = values[0];
  for (let i = 0; i < values.length; i++) {
    const v = i === 0 ? values[0] : values[i] * k + prev * (1 - k);
    out.push(i < length - 1 ? NaN : v);
    prev = v;
  }
  return out;
}

export function RSI(values: number[], length: number): number[] {
  const out: number[] = [NaN];
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < values.length; i++) {
    const ch = values[i] - values[i - 1];
    const g = Math.max(0, ch);
    const l = Math.max(0, -ch);
    if (i <= length) {
      gain += g;
      loss += l;
      out.push(NaN);
      continue;
    }
    const avgG = (gain * (length - 1) + g) / length;
    const avgL = (loss * (length - 1) + l) / length;
    gain = avgG;
    loss = avgL;
    const rs = avgL === 0 ? 100 : avgG / avgL;
    const rsi = 100 - 100 / (1 + rs);
    out.push(rsi);
  }
  return out;
}

export function Bollinger(
  values: number[],
  length: number,
  mult: number
): { upper: number; basis: number; lower: number }[] {
  const sma = SMA(values, length);
  return values.map((_, i) => {
    if (i < length - 1) return { upper: NaN, basis: NaN, lower: NaN };
    let variance = 0;
    for (let j = i - length + 1; j <= i; j++) {
      const diff = values[j] - sma[i];
      variance += diff * diff;
    }
    const stdev = Math.sqrt(variance / length);
    return {
      upper: sma[i] + mult * stdev,
      basis: sma[i],
      lower: sma[i] - mult * stdev,
    };
  });
}

export function VWAP(candles: Candle[]): number[] {
  const out: number[] = [];
  let pv = 0;
  let v = 0;
  for (let i = 0; i < candles.length; i++) {
    const tp = (candles[i].high + candles[i].low + candles[i].close) / 3;
    pv += tp * candles[i].volume;
    v += candles[i].volume;
    out.push(v === 0 ? NaN : pv / v);
  }
  return out;
}
