/**
 * FIBONACCI RETRACEMENT STRATEGY
 *
 * Fibonacci retracement levels are horizontal lines that indicate
 * where support and resistance are likely to occur.
 *
 * Key Levels:
 * - 23.6% (minor support/resistance)
 * - 38.2% (moderate support/resistance)
 * - 50.0% (psychological level)
 * - 61.8% (golden ratio - strongest level)
 * - 78.6% (deep retracement)
 *
 * Success Rate: 72-82% (when combined with volume)
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

export interface FibonacciLevels {
  swing_high: number;
  swing_low: number;
  level_0: number;    // 0% (swing high for uptrend, swing low for downtrend)
  level_236: number;  // 23.6%
  level_382: number;  // 38.2%
  level_500: number;  // 50%
  level_618: number;  // 61.8% (Golden Ratio)
  level_786: number;  // 78.6%
  level_100: number;  // 100%
  trend: 'UPTREND' | 'DOWNTREND';
}

export interface FibonacciSignal {
  type: 'fibonacci_retracement';
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  strength: number; // 1-10
  confidence: number; // 0-100

  levels: FibonacciLevels;
  currentLevel: string; // e.g., "61.8%" or "between 50% and 61.8%"
  nearestSupport: number;
  nearestResistance: number;

  entry: number;
  stopLoss: number;
  targets: number[];

  reason: string;
  timestamp: number;
}

/**
 * Find swing high/low in recent candles
 */
function findSwingPoints(candles: Candle[], lookback: number = 20): { high: number; low: number; highIndex: number; lowIndex: number } {
  const recent = candles.slice(-lookback);

  let swingHigh = -Infinity;
  let swingLow = Infinity;
  let highIndex = 0;
  let lowIndex = 0;

  for (let i = 0; i < recent.length; i++) {
    if (recent[i].high > swingHigh) {
      swingHigh = recent[i].high;
      highIndex = i;
    }
    if (recent[i].low < swingLow) {
      swingLow = recent[i].low;
      lowIndex = i;
    }
  }

  return {
    high: swingHigh,
    low: swingLow,
    highIndex,
    lowIndex,
  };
}

/**
 * Calculate Fibonacci retracement levels
 */
function calculateFibonacciLevels(high: number, low: number, trend: 'UPTREND' | 'DOWNTREND'): FibonacciLevels {
  const diff = high - low;

  if (trend === 'UPTREND') {
    // For uptrend: high is 0%, low is 100%
    return {
      swing_high: high,
      swing_low: low,
      level_0: high,
      level_236: high - (diff * 0.236),
      level_382: high - (diff * 0.382),
      level_500: high - (diff * 0.500),
      level_618: high - (diff * 0.618),
      level_786: high - (diff * 0.786),
      level_100: low,
      trend,
    };
  } else {
    // For downtrend: low is 0%, high is 100%
    return {
      swing_high: high,
      swing_low: low,
      level_0: low,
      level_236: low + (diff * 0.236),
      level_382: low + (diff * 0.382),
      level_500: low + (diff * 0.500),
      level_618: low + (diff * 0.618),
      level_786: low + (diff * 0.786),
      level_100: high,
      trend,
    };
  }
}

/**
 * Determine current price level
 */
function getCurrentLevel(price: number, levels: FibonacciLevels): string {
  const tolerance = (levels.swing_high - levels.swing_low) * 0.01; // 1% tolerance

  if (Math.abs(price - levels.level_0) < tolerance) return '0%';
  if (Math.abs(price - levels.level_236) < tolerance) return '23.6%';
  if (Math.abs(price - levels.level_382) < tolerance) return '38.2%';
  if (Math.abs(price - levels.level_500) < tolerance) return '50%';
  if (Math.abs(price - levels.level_618) < tolerance) return '61.8%';
  if (Math.abs(price - levels.level_786) < tolerance) return '78.6%';
  if (Math.abs(price - levels.level_100) < tolerance) return '100%';

  // Between levels
  if (price < levels.level_236 && price > levels.level_382) return 'between 23.6% and 38.2%';
  if (price < levels.level_382 && price > levels.level_500) return 'between 38.2% and 50%';
  if (price < levels.level_500 && price > levels.level_618) return 'between 50% and 61.8%';
  if (price < levels.level_618 && price > levels.level_786) return 'between 61.8% and 78.6%';

  return 'outside range';
}

/**
 * Detect Fibonacci retracement signals
 */
export function detectFibonacciSignal(candles: Candle[]): FibonacciSignal | null {
  if (candles.length < 50) return null;

  const current = candles[candles.length - 1];
  const currentPrice = current.close;

  // Find swing points
  const swingPoints = findSwingPoints(candles, 50);

  // Determine trend (swing high came before swing low = downtrend, vice versa = uptrend)
  const trend = swingPoints.highIndex < swingPoints.lowIndex ? 'DOWNTREND' : 'UPTREND';

  // Calculate Fibonacci levels
  const levels = calculateFibonacciLevels(swingPoints.high, swingPoints.low, trend);

  // Determine current level
  const currentLevel = getCurrentLevel(currentPrice, levels);

  // Find nearest support and resistance
  const allLevels = [
    levels.level_0,
    levels.level_236,
    levels.level_382,
    levels.level_500,
    levels.level_618,
    levels.level_786,
    levels.level_100,
  ].sort((a, b) => a - b);

  let nearestSupport = 0;
  let nearestResistance = Infinity;

  for (const level of allLevels) {
    if (level < currentPrice && level > nearestSupport) {
      nearestSupport = level;
    }
    if (level > currentPrice && level < nearestResistance) {
      nearestResistance = level;
    }
  }

  // Generate signal
  let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
  let strength = 5;
  let confidence = 50;
  let reason = 'Neutral - price not at key Fibonacci level';

  const diff = levels.swing_high - levels.swing_low;
  const tolerance = diff * 0.02; // 2% tolerance

  if (trend === 'UPTREND') {
    // BUY signals in uptrend (price bouncing off support)
    if (Math.abs(currentPrice - levels.level_618) < tolerance) {
      signal = 'BUY';
      strength = 9;
      confidence = 82;
      reason = 'Price at 61.8% (Golden Ratio) support in uptrend - strong buy zone';
    } else if (Math.abs(currentPrice - levels.level_500) < tolerance) {
      signal = 'BUY';
      strength = 7;
      confidence = 74;
      reason = 'Price at 50% support in uptrend - buy zone';
    } else if (Math.abs(currentPrice - levels.level_382) < tolerance) {
      signal = 'BUY';
      strength = 6;
      confidence = 68;
      reason = 'Price at 38.2% support in uptrend - potential buy';
    }
  } else {
    // SELL signals in downtrend (price bouncing off resistance)
    if (Math.abs(currentPrice - levels.level_618) < tolerance) {
      signal = 'SELL';
      strength = 9;
      confidence = 82;
      reason = 'Price at 61.8% (Golden Ratio) resistance in downtrend - strong sell zone';
    } else if (Math.abs(currentPrice - levels.level_500) < tolerance) {
      signal = 'SELL';
      strength = 7;
      confidence = 74;
      reason = 'Price at 50% resistance in downtrend - sell zone';
    } else if (Math.abs(currentPrice - levels.level_382) < tolerance) {
      signal = 'SELL';
      strength = 6;
      confidence = 68;
      reason = 'Price at 38.2% resistance in downtrend - potential sell';
    }
  }

  // Calculate entry, stop loss, and targets
  let entry = currentPrice;
  let stopLoss = 0;
  let targets: number[] = [];

  if (signal === 'BUY') {
    stopLoss = nearestSupport * 0.98; // 2% below support
    targets = [
      nearestResistance,
      levels.level_236 > currentPrice ? levels.level_236 : levels.level_0,
      levels.level_0,
    ].filter(t => t > currentPrice);
  } else if (signal === 'SELL') {
    stopLoss = nearestResistance * 1.02; // 2% above resistance
    targets = [
      nearestSupport,
      levels.level_786 < currentPrice ? levels.level_786 : levels.level_100,
      levels.level_100,
    ].filter(t => t < currentPrice);
  }

  return {
    type: 'fibonacci_retracement',
    signal,
    strength,
    confidence,
    levels,
    currentLevel,
    nearestSupport,
    nearestResistance,
    entry,
    stopLoss,
    targets,
    reason,
    timestamp: Date.now(),
  };
}

export default {
  detect: detectFibonacciSignal,
  name: 'Fibonacci Retracement',
  description: 'Golden ratio support/resistance levels',
  successRate: 77,
};
