import type { Candle } from "@/types/ohlc";

export type CandleSignal = "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell";

export type CandleWithSignal = Candle & {
  signal: CandleSignal;
};

/**
 * Calculate trading signal for each candle based on:
 * - RSI (overbought/oversold)
 * - Price vs SMA (trend)
 * - Volume (confirmation)
 */
export function calculateCandleSignals(
  candles: Candle[],
  rsi?: number[],
  sma?: number[]
): CandleWithSignal[] {
  return candles.map((candle, i) => {
    let score = 0; // -2 to +2

    // RSI Signal
    if (rsi && rsi[i] !== undefined) {
      const rsiVal = rsi[i];
      if (rsiVal < 30) score += 2; // Oversold = Strong Buy
      else if (rsiVal < 40) score += 1; // Buy
      else if (rsiVal > 70) score -= 2; // Overbought = Strong Sell
      else if (rsiVal > 60) score -= 1; // Sell
    }

    // Price vs SMA Signal
    if (sma && sma[i] !== undefined) {
      const priceAboveSMA = candle.close > sma[i];
      if (priceAboveSMA) score += 1; // Bullish
      else score -= 1; // Bearish
    }

    // Volume confirmation (optional)
    if (i > 0) {
      const avgVolume =
        candles.slice(Math.max(0, i - 20), i).reduce((sum, c) => sum + c.volume, 0) / 20;
      if (candle.volume > avgVolume * 1.5) {
        // High volume confirms signal
        score = score > 0 ? score + 0.5 : score - 0.5;
      }
    }

    // Map score to signal
    let signal: CandleSignal;
    if (score >= 2) signal = "strong_buy";
    else if (score >= 1) signal = "buy";
    else if (score <= -2) signal = "strong_sell";
    else if (score <= -1) signal = "sell";
    else signal = "neutral";

    return { ...candle, signal };
  });
}
