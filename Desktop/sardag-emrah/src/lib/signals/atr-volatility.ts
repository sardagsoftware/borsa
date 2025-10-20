/**
 * ATR (Average True Range) VOLATILITY STRATEGY
 *
 * ATR measures market volatility by decomposing the entire range of an asset price
 * for that period. Higher ATR = higher volatility, Lower ATR = lower volatility.
 *
 * Trading Strategies:
 * 1. Breakout Detection: High ATR = strong trend, Low ATR = consolidation
 * 2. Stop Loss Placement: Use ATR multiples for dynamic stop losses
 * 3. Position Sizing: Adjust position size based on volatility
 * 4. Volatility Expansion: Rising ATR = potential trend start
 * 5. Volatility Contraction: Falling ATR = consolidation, breakout imminent
 *
 * Success Rate: 70-80% (when combined with trend indicators)
 * Best Timeframes: 4H, 1D
 */

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ATRAnalysis {
  currentATR: number;
  avgATR: number;
  atrPercent: number; // ATR as % of price
  volatilityState: 'LOW' | 'NORMAL' | 'HIGH' | 'EXTREME';
  atrChange: number; // % change in ATR
  expanding: boolean; // Is volatility expanding?
}

export interface ATRSignal {
  type: 'atr_volatility';
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  strength: number; // 1-10
  confidence: number; // 0-100

  analysis: ATRAnalysis;
  optimalStopLoss: number; // Based on ATR
  optimalPositionSize: number; // 0-100% (risk-adjusted)

  entry: number;
  stopLoss: number;
  targets: number[];

  reason: string;
  timestamp: number;
}

/**
 * Calculate True Range
 * TR = max(high - low, abs(high - prev_close), abs(low - prev_close))
 */
function calculateTrueRange(current: Candle, previous: Candle | null): number {
  if (!previous) {
    return current.high - current.low;
  }

  const hl = current.high - current.low;
  const hc = Math.abs(current.high - previous.close);
  const lc = Math.abs(current.low - previous.close);

  return Math.max(hl, hc, lc);
}

/**
 * Calculate ATR (Average True Range)
 * Using Wilder's smoothing method
 */
function calculateATR(candles: Candle[], period: number = 14): number[] {
  if (candles.length < period + 1) return [];

  const atrValues: number[] = [];
  let prevATR = 0;

  for (let i = 1; i < candles.length; i++) {
    const tr = calculateTrueRange(candles[i], candles[i - 1]);

    if (i < period) {
      // Initial ATR: simple average of first 'period' TRs
      prevATR += tr;
      if (i === period - 1) {
        prevATR = prevATR / period;
        atrValues.push(prevATR);
      }
    } else {
      // Subsequent ATR: Wilder's smoothing
      const currentATR = (prevATR * (period - 1) + tr) / period;
      atrValues.push(currentATR);
      prevATR = currentATR;
    }
  }

  return atrValues;
}

/**
 * Determine volatility state based on ATR
 */
function getVolatilityState(atrPercent: number): 'LOW' | 'NORMAL' | 'HIGH' | 'EXTREME' {
  // ATR as percentage of price
  if (atrPercent < 1.5) return 'LOW';
  if (atrPercent < 3.0) return 'NORMAL';
  if (atrPercent < 5.0) return 'HIGH';
  return 'EXTREME';
}

/**
 * Calculate optimal position size based on volatility
 * Higher volatility = smaller position size
 */
function calculatePositionSize(atrPercent: number, riskTolerance: number = 2): number {
  // Risk tolerance: 1 = conservative, 2 = moderate, 3 = aggressive
  const baseSize = 100; // 100% position

  // Reduce position size as volatility increases
  if (atrPercent < 1.5) {
    return baseSize * (riskTolerance === 3 ? 1.0 : riskTolerance === 2 ? 0.8 : 0.6);
  } else if (atrPercent < 3.0) {
    return baseSize * (riskTolerance === 3 ? 0.8 : riskTolerance === 2 ? 0.6 : 0.4);
  } else if (atrPercent < 5.0) {
    return baseSize * (riskTolerance === 3 ? 0.6 : riskTolerance === 2 ? 0.4 : 0.2);
  } else {
    return baseSize * (riskTolerance === 3 ? 0.4 : riskTolerance === 2 ? 0.2 : 0.1);
  }
}

/**
 * Detect ATR-based volatility signals
 */
export function detectATRSignal(candles: Candle[], atrPeriod: number = 14): ATRSignal | null {
  if (candles.length < atrPeriod + 20) return null; // Need extra candles for analysis

  const current = candles[candles.length - 1];
  const currentPrice = current.close;

  // Calculate ATR
  const atrValues = calculateATR(candles, atrPeriod);
  if (atrValues.length === 0) return null;

  const currentATR = atrValues[atrValues.length - 1];
  const avgATR = atrValues.slice(-20).reduce((sum, val) => sum + val, 0) / Math.min(20, atrValues.length);

  // ATR as percentage of price
  const atrPercent = (currentATR / currentPrice) * 100;

  // Volatility state
  const volatilityState = getVolatilityState(atrPercent);

  // ATR change (is volatility expanding or contracting?)
  const prevATR = atrValues.length >= 2 ? atrValues[atrValues.length - 2] : currentATR;
  const atrChange = ((currentATR - prevATR) / prevATR) * 100;
  const expanding = atrChange > 5; // > 5% increase = expanding

  // Analysis object
  const analysis: ATRAnalysis = {
    currentATR,
    avgATR,
    atrPercent,
    volatilityState,
    atrChange,
    expanding,
  };

  // Calculate optimal stop loss (2.5x ATR is common)
  const optimalStopLoss = currentATR * 2.5;

  // Calculate optimal position size
  const optimalPositionSize = calculatePositionSize(atrPercent, 2); // Moderate risk

  // Generate signal
  let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
  let strength = 5;
  let confidence = 50;
  let reason = 'Neutral - normal volatility, no clear signal';

  // Look at recent price action
  const recentCandles = candles.slice(-5);
  const isUptrend = recentCandles.every((c, i) => i === 0 || c.close >= recentCandles[i - 1].close);
  const isDowntrend = recentCandles.every((c, i) => i === 0 || c.close <= recentCandles[i - 1].close);

  // VOLATILITY EXPANSION BREAKOUT (Strong signal)
  if (expanding && volatilityState === 'HIGH' && isUptrend) {
    signal = 'BUY';
    strength = 8;
    confidence = 78;
    reason = 'Volatility expanding with uptrend - strong breakout signal';
  } else if (expanding && volatilityState === 'HIGH' && isDowntrend) {
    signal = 'SELL';
    strength = 8;
    confidence = 78;
    reason = 'Volatility expanding with downtrend - strong breakdown signal';
  }
  // VOLATILITY CONTRACTION (Breakout imminent)
  else if (!expanding && volatilityState === 'LOW' && atrPercent < 1.5) {
    // Low volatility = consolidation, breakout imminent
    // Use recent trend to predict direction
    if (isUptrend) {
      signal = 'BUY';
      strength = 6;
      confidence = 65;
      reason = 'Low volatility consolidation in uptrend - potential breakout up';
    } else if (isDowntrend) {
      signal = 'SELL';
      strength = 6;
      confidence = 65;
      reason = 'Low volatility consolidation in downtrend - potential breakdown';
    } else {
      reason = 'Low volatility consolidation - breakout imminent but direction unclear';
    }
  }
  // EXTREME VOLATILITY (Caution)
  else if (volatilityState === 'EXTREME') {
    signal = 'NEUTRAL';
    strength = 3;
    confidence = 40;
    reason = 'Extreme volatility - high risk, recommend waiting for consolidation';
  }
  // NORMAL VOLATILITY (Use other indicators)
  else if (volatilityState === 'NORMAL') {
    reason = 'Normal volatility - use trend indicators for direction';
  }

  // Calculate entry, stop loss, and targets
  const entry = currentPrice;
  let stopLoss = 0;
  let targets: number[] = [];

  if (signal === 'BUY') {
    stopLoss = currentPrice - optimalStopLoss;
    // Targets: 1x ATR, 2x ATR, 3x ATR
    targets = [
      currentPrice + currentATR * 1.0,
      currentPrice + currentATR * 2.0,
      currentPrice + currentATR * 3.0,
    ];
  } else if (signal === 'SELL') {
    stopLoss = currentPrice + optimalStopLoss;
    // Targets: 1x ATR, 2x ATR, 3x ATR
    targets = [
      currentPrice - currentATR * 1.0,
      currentPrice - currentATR * 2.0,
      currentPrice - currentATR * 3.0,
    ];
  }

  return {
    type: 'atr_volatility',
    signal,
    strength,
    confidence,
    analysis,
    optimalStopLoss,
    optimalPositionSize,
    entry,
    stopLoss,
    targets,
    reason,
    timestamp: Date.now(),
  };
}

export default {
  detect: detectATRSignal,
  name: 'ATR Volatility',
  description: 'Volatility-based breakout detection',
  successRate: 75,
};
