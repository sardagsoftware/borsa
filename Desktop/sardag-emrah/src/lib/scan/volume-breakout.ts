import type { Candle } from "@/types/ohlc";
import type { BreakoutAlert } from "@/types/alert";

function zScores(values: number[], length = 20): number[] {
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < length) {
      out.push(NaN);
      continue;
    }
    const win = values.slice(i - length, i);
    const mean = win.reduce((a, b) => a + b, 0) / length;
    const variance = win.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / length;
    const stdev = Math.sqrt(variance);
    out.push(stdev === 0 ? 0 : (values[i] - mean) / stdev);
  }
  return out;
}

export function scanVolumeBreakout(
  symbol: string,
  tf: string,
  candles: Candle[],
  zThresh = 3,
  lookback = 10
): BreakoutAlert[] {
  if (candles.length < 50) return [];
  const vols = candles.map((c) => c.volume);
  const closes = candles.map((c) => c.close);
  const zs = zScores(vols, 20);
  const alerts: BreakoutAlert[] = [];
  const startIdx = Math.max(0, zs.length - lookback);
  for (let i = startIdx; i < zs.length; i++) {
    if (i <= 0 || !Number.isFinite(zs[i])) continue;
    if (zs[i] >= zThresh) {
      const dir = closes[i] >= closes[i - 1] ? "UP" : "DOWN";
      const zScore = Number(zs[i].toFixed(2));
      alerts.push({
        id: `${symbol}-${tf}-${candles[i].time}`,
        symbol,
        tf,
        time: candles[i].time,
        type: "VOL_BREAKOUT",
        direction: dir,
        zScore,
        price: closes[i],
        message: `Volume breakout: Z=${zScore}, Price=${closes[i].toFixed(4)}, ${dir}`,
      });
    }
  }
  return alerts;
}
