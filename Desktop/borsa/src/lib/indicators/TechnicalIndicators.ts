/**
 * Technical Indicators Library
 * Real calculations for RSI, MACD, Bollinger Bands, Moving Averages
 */

export interface PriceData {
  close: number;
  high: number;
  low: number;
  volume: number;
  timestamp: number;
}

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
      continue;
    }

    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }

  return sma;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  // Start with SMA for first value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    if (i >= prices.length) break;
    sum += prices[i];
  }

  let previousEMA = sum / period;
  ema.push(previousEMA);

  // Calculate EMA for rest
  for (let i = period; i < prices.length; i++) {
    const currentEMA = (prices[i] - previousEMA) * multiplier + previousEMA;
    ema.push(currentEMA);
    previousEMA = currentEMA;
  }

  return ema;
}

/**
 * Calculate Relative Strength Index (RSI)
 */
export function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi: number[] = [];

  if (prices.length < period + 1) {
    return prices.map(() => NaN);
  }

  // Calculate price changes
  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  // Calculate average gains and losses
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }

  avgGain /= period;
  avgLoss /= period;

  // First RSI value
  rsi.push(NaN); // No RSI for first price

  for (let i = 0; i < period - 1; i++) {
    rsi.push(NaN);
  }

  if (avgLoss === 0) {
    rsi.push(100);
  } else {
    const rs = avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }

  // Calculate subsequent RSI values
  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }

  return rsi;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
  const emaFast = calculateEMA(prices, fastPeriod);
  const emaSlow = calculateEMA(prices, slowPeriod);

  // MACD Line
  const macdLine: number[] = [];
  for (let i = 0; i < Math.max(emaFast.length, emaSlow.length); i++) {
    if (i < slowPeriod - 1) {
      macdLine.push(NaN);
    } else {
      macdLine.push(emaFast[i] - emaSlow[i]);
    }
  }

  // Signal Line (EMA of MACD)
  const validMacd = macdLine.filter(v => !isNaN(v));
  const signalLineValues = calculateEMA(validMacd, signalPeriod);

  const signalLine: number[] = [];
  let signalIndex = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (isNaN(macdLine[i])) {
      signalLine.push(NaN);
    } else {
      signalLine.push(signalLineValues[signalIndex] || NaN);
      signalIndex++;
    }
  }

  // Histogram
  const histogram: number[] = [];
  for (let i = 0; i < macdLine.length; i++) {
    if (isNaN(macdLine[i]) || isNaN(signalLine[i])) {
      histogram.push(NaN);
    } else {
      histogram.push(macdLine[i] - signalLine[i]);
    }
  }

  return { macdLine, signalLine, histogram };
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(prices: number[], period: number = 20, stdDevMultiplier: number = 2) {
  const sma = calculateSMA(prices, period);

  const upperBand: number[] = [];
  const lowerBand: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      upperBand.push(NaN);
      lowerBand.push(NaN);
      continue;
    }

    // Calculate standard deviation
    const slice = prices.slice(i - period + 1, i + 1);
    const mean = sma[i];
    const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    upperBand.push(mean + stdDevMultiplier * stdDev);
    lowerBand.push(mean - stdDevMultiplier * stdDev);
  }

  return {
    middle: sma,
    upper: upperBand,
    lower: lowerBand
  };
}

/**
 * Generate trading signal based on indicators
 */
export function generateSignal(prices: number[]): {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  riskScore: number;
  indicators: any;
  pattern: string;
} {
  if (prices.length < 50) {
    return {
      action: 'HOLD',
      confidence: 0,
      riskScore: 100,
      indicators: {},
      pattern: 'Yetersiz Veri'
    };
  }

  const currentPrice = prices[prices.length - 1];
  const rsi = calculateRSI(prices, 14);
  const macd = calculateMACD(prices);
  const bb = calculateBollingerBands(prices, 20, 2);
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);

  const currentRSI = rsi[rsi.length - 1];
  const currentMACD = macd.macdLine[macd.macdLine.length - 1];
  const currentSignal = macd.signalLine[macd.signalLine.length - 1];
  const currentHistogram = macd.histogram[macd.histogram.length - 1];
  const currentBBUpper = bb.upper[bb.upper.length - 1];
  const currentBBLower = bb.lower[bb.lower.length - 1];
  const currentSMA20 = sma20[sma20.length - 1];
  const currentSMA50 = sma50[sma50.length - 1];

  let signals = 0;
  let totalSignals = 0;
  let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  let patterns: string[] = [];

  // RSI Signals
  totalSignals++;
  if (currentRSI < 30) {
    signals++;
    patterns.push('RSI Aşırı Satış');
    action = 'BUY';
  } else if (currentRSI > 70) {
    signals--;
    patterns.push('RSI Aşırı Alış');
    action = 'SELL';
  }

  // MACD Signals
  totalSignals++;
  if (currentMACD > currentSignal && currentHistogram > 0) {
    signals++;
    patterns.push('MACD Yükseliş');
    if (action !== 'SELL') action = 'BUY';
  } else if (currentMACD < currentSignal && currentHistogram < 0) {
    signals--;
    patterns.push('MACD Düşüş');
    if (action !== 'BUY') action = 'SELL';
  }

  // Bollinger Bands Signals
  totalSignals++;
  if (currentPrice < currentBBLower) {
    signals++;
    patterns.push('BB Alt Bandında');
    if (action !== 'SELL') action = 'BUY';
  } else if (currentPrice > currentBBUpper) {
    signals--;
    patterns.push('BB Üst Bandında');
    if (action !== 'BUY') action = 'SELL';
  }

  // Moving Average Crossover
  totalSignals++;
  if (currentSMA20 > currentSMA50) {
    signals++;
    patterns.push('Golden Cross');
  } else if (currentSMA20 < currentSMA50) {
    signals--;
    patterns.push('Death Cross');
  }

  // Calculate confidence and risk
  const confidence = Math.abs(signals) / totalSignals;
  const riskScore = Math.min(100, Math.max(0, 50 + (currentRSI - 50)));

  if (Math.abs(signals) < 2) {
    action = 'HOLD';
  } else if (signals > 0) {
    action = 'BUY';
  } else {
    action = 'SELL';
  }

  return {
    action,
    confidence: confidence * 0.9 + 0.1, // Min 10% confidence
    riskScore: Math.round(riskScore),
    indicators: {
      rsi: Math.round(currentRSI * 100) / 100,
      macd: Math.round(currentMACD * 100) / 100,
      signal: Math.round(currentSignal * 100) / 100,
      histogram: Math.round(currentHistogram * 100) / 100,
      bbUpper: Math.round(currentBBUpper * 100) / 100,
      bbLower: Math.round(currentBBLower * 100) / 100,
      sma20: Math.round(currentSMA20 * 100) / 100,
      sma50: Math.round(currentSMA50 * 100) / 100
    },
    pattern: patterns.join(' + ') || 'Nötr'
  };
}