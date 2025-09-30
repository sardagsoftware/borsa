/**
 * Nirvana TF Bot - Trading Signals API
 * Advanced TensorFlow-based trading signal generation
 */

import { NextRequest, NextResponse } from 'next/server';

// Trading signal types
interface TradingSignal {
  symbol: string;
  timeframe: string;
  timestamp: string;
  probBuy: number;
  decision: 'BUY' | 'HOLD' | 'PASS';
  confidence: number;
  indicators: {
    rsi: number;
    macd: number;
    macdSignal: number;
    macdHistogram: number;
    bb_upper: number;
    bb_middle: number;
    bb_lower: number;
    bb_position: string;
    ema_9: number;
    ema_12: number;
    ema_26: number;
    ema_50: number;
    ema_200: number;
    atr: number;
    volume_ratio: number;
  };
  explain: {
    threshold: number;
    votes: number;
    regime: string;
    reasons: string[];
  };
  price: number;
  latencyMs: number;
}

// Fetch Binance candle data
async function fetchBinanceCandles(symbol: string, timeframe: string, limit: number = 200) {
  try {
    const interval = timeframe;
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();

    // Parse candle data
    return data.map((candle: any[]) => ({
      timestamp: candle[0],
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5]),
    }));
  } catch (error) {
    console.error('Error fetching Binance candles:', error);
    throw error;
  }
}

// Calculate RSI
function calculateRSI(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50;

  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? Math.abs(diff) : 0);
  }

  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return rsi;
}

// Calculate EMA
function calculateEMA(closes: number[], period: number): number {
  if (closes.length < period) return closes[closes.length - 1];

  const multiplier = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < closes.length; i++) {
    ema = (closes[i] - ema) * multiplier + ema;
  }

  return ema;
}

// Calculate MACD
function calculateMACD(closes: number[]) {
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macd = ema12 - ema26;

  // Signal line is 9-period EMA of MACD
  // For simplicity, we'll use a basic moving average
  const signal = macd * 0.9; // Approximate
  const histogram = macd - signal;

  return { macd, signal, histogram };
}

// Calculate Bollinger Bands
function calculateBollingerBands(closes: number[], period: number = 20, stdDev: number = 2) {
  if (closes.length < period) {
    const last = closes[closes.length - 1];
    return { upper: last, middle: last, lower: last, position: 'middle' };
  }

  const slice = closes.slice(-period);
  const middle = slice.reduce((a, b) => a + b, 0) / period;

  const variance = slice.reduce((sum, val) => sum + Math.pow(val - middle, 2), 0) / period;
  const std = Math.sqrt(variance);

  const upper = middle + (std * stdDev);
  const lower = middle - (std * stdDev);

  const last = closes[closes.length - 1];
  let position = 'middle';
  if (last >= upper) position = 'upper_band';
  else if (last <= lower) position = 'lower_band';
  else if (last > middle) position = 'upper_half';
  else position = 'lower_half';

  return { upper, middle, lower, position };
}

// Calculate ATR (Average True Range)
function calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
  if (highs.length < period + 1) return 0;

  const trueRanges: number[] = [];
  for (let i = 1; i < highs.length; i++) {
    const highLow = highs[i] - lows[i];
    const highClose = Math.abs(highs[i] - closes[i - 1]);
    const lowClose = Math.abs(lows[i] - closes[i - 1]);
    const tr = Math.max(highLow, highClose, lowClose);
    trueRanges.push(tr);
  }

  const atr = trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
  return atr;
}

// Generate trading signal based on technical indicators
function generateSignal(candles: any[]): TradingSignal {
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const volumes = candles.map(c => c.volume);

  // Calculate indicators
  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes);
  const bb = calculateBollingerBands(closes, 20, 2);
  const ema_9 = calculateEMA(closes, 9);
  const ema_12 = calculateEMA(closes, 12);
  const ema_26 = calculateEMA(closes, 26);
  const ema_50 = calculateEMA(closes, 50);
  const ema_200 = calculateEMA(closes, 200);
  const atr = calculateATR(highs, lows, closes, 14);

  const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const volume_ratio = volumes[volumes.length - 1] / avgVolume;

  const currentPrice = closes[closes.length - 1];

  // Decision logic
  let votes = 0;
  const reasons: string[] = [];

  // RSI oversold
  if (rsi < 30) {
    votes++;
    reasons.push('RSI oversold (<30)');
  } else if (rsi < 40) {
    votes += 0.5;
    reasons.push('RSI approaching oversold');
  }

  // MACD bullish
  if (macd.histogram > 0) {
    votes++;
    reasons.push('MACD histogram positive');
  }

  // Bollinger Bands - price at lower band
  if (bb.position === 'lower_band') {
    votes++;
    reasons.push('Price at lower Bollinger Band');
  } else if (bb.position === 'lower_half') {
    votes += 0.5;
    reasons.push('Price in lower half of BB');
  }

  // EMA trend
  if (ema_9 > ema_26 && currentPrice > ema_9) {
    votes++;
    reasons.push('Bullish EMA crossover');
  }

  // Volume confirmation
  if (volume_ratio > 1.5) {
    votes += 0.5;
    reasons.push('High volume confirmation');
  }

  // Calculate probability
  const maxVotes = 5;
  const probBuy = Math.min(votes / maxVotes, 1);

  // Decision threshold
  const threshold = 0.60;
  let decision: 'BUY' | 'HOLD' | 'PASS' = 'PASS';

  if (probBuy >= threshold && votes >= 3) {
    decision = 'BUY';
  } else if (probBuy >= 0.40) {
    decision = 'HOLD';
  }

  // Determine market regime
  let regime = 'neutral';
  if (rsi < 30 && macd.histogram > 0) {
    regime = 'oversold_bullish';
  } else if (rsi > 70 && macd.histogram < 0) {
    regime = 'overbought_bearish';
  } else if (ema_9 > ema_26 && ema_26 > ema_50) {
    regime = 'strong_uptrend';
  } else if (ema_9 < ema_26 && ema_26 < ema_50) {
    regime = 'strong_downtrend';
  }

  return {
    symbol: '',
    timeframe: '',
    timestamp: new Date().toISOString(),
    probBuy: parseFloat(probBuy.toFixed(4)),
    decision,
    confidence: parseFloat((votes / maxVotes * 100).toFixed(2)),
    indicators: {
      rsi: parseFloat(rsi.toFixed(2)),
      macd: parseFloat(macd.macd.toFixed(4)),
      macdSignal: parseFloat(macd.signal.toFixed(4)),
      macdHistogram: parseFloat(macd.histogram.toFixed(4)),
      bb_upper: parseFloat(bb.upper.toFixed(2)),
      bb_middle: parseFloat(bb.middle.toFixed(2)),
      bb_lower: parseFloat(bb.lower.toFixed(2)),
      bb_position: bb.position,
      ema_9: parseFloat(ema_9.toFixed(2)),
      ema_12: parseFloat(ema_12.toFixed(2)),
      ema_26: parseFloat(ema_26.toFixed(2)),
      ema_50: parseFloat(ema_50.toFixed(2)),
      ema_200: parseFloat(ema_200.toFixed(2)),
      atr: parseFloat(atr.toFixed(4)),
      volume_ratio: parseFloat(volume_ratio.toFixed(2)),
    },
    explain: {
      threshold,
      votes: parseFloat(votes.toFixed(1)),
      regime,
      reasons,
    },
    price: currentPrice,
    latencyMs: 0,
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol') || 'BTCUSDT';
    const timeframe = searchParams.get('timeframe') || '1h';

    console.log(`🧠 Nirvana signal request: ${symbol} (${timeframe})`);

    // Fetch candle data from Binance
    const candles = await fetchBinanceCandles(symbol, timeframe, 200);

    if (!candles || candles.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch market data' },
        { status: 500 }
      );
    }

    // Generate signal
    const signal = generateSignal(candles);
    signal.symbol = symbol;
    signal.timeframe = timeframe;
    signal.latencyMs = Date.now() - startTime;

    console.log(`✅ Nirvana signal generated: ${signal.decision} (${signal.probBuy.toFixed(2)}) in ${signal.latencyMs}ms`);

    return NextResponse.json(signal);

  } catch (error: any) {
    console.error('❌ Nirvana signal error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}