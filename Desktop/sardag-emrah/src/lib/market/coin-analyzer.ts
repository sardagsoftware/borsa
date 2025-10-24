/**
 * COIN COMPREHENSIVE ANALYZER
 *
 * Tüm timeframe'lerde coin analizi
 * - MA Crossover (7, 25, 99)
 * - Support/Resistance levels
 * - Volume analysis
 * - Multi-timeframe alignment
 * - Buy/Sell recommendation
 */

import { detectMACrossoverPullback } from "@/lib/signals/ma-crossover-pullback";
import { calculateSupportResistance } from "@/lib/indicators/support-resistance";

export interface TimeframeAnalysis {
  timeframe: string;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  maCrossover: boolean;
  ma7: number;
  ma25: number;
  ma99: number;
  supportLevel: number | null;
  resistanceLevel: number | null;
  rsi: number | null;
  macdTrend: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  volumeStatus: 'HIGH' | 'NORMAL' | 'LOW';
}

export interface ComprehensiveAnalysis {
  symbol: string;
  currentPrice: number;

  // Multi-timeframe
  timeframes: {
    '1d': TimeframeAnalysis;
    '4h': TimeframeAnalysis;
    '1h': TimeframeAnalysis;
  };

  // MTF Alignment
  mtfAlignment: number; // 0-3 (kaç timeframe aynı yönde)

  // Composite Score
  compositeScore: number; // 0-10
  recommendation: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';

  // Entry/Exit Suggestions
  suggestedEntry: number | null;
  suggestedStopLoss: number | null;
  suggestedTakeProfit: number | null;
  riskRewardRatio: string | null;
}

// ============================================================
// 1. FETCH CANDLES FOR TIMEFRAME
// ============================================================

async function fetchCandles(symbol: string, interval: string, limit: number = 200) {
  try {
    const response = await fetch(
      `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );

    if (!response.ok) return [];

    const data = await response.json();

    return data.map((d: any) => ({
      time: d[0],
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
      volume: parseFloat(d[5]),
    }));
  } catch (error) {
    console.error(`[Analyzer] Candles error for ${symbol} ${interval}:`, error);
    return [];
  }
}

// ============================================================
// 2. CALCULATE MA VALUES
// ============================================================

function calculateMA(candles: any[], period: number): number | null {
  if (candles.length < period) return null;

  const recent = candles.slice(-period);
  const sum = recent.reduce((acc, c) => acc + c.close, 0);
  return sum / period;
}

// ============================================================
// 3. ANALYZE SINGLE TIMEFRAME
// ============================================================

export async function analyzeTimeframe(
  symbol: string,
  interval: string
): Promise<TimeframeAnalysis | null> {
  try {
    const candles = await fetchCandles(symbol, interval, 200);
    if (candles.length < 100) return null;

    const currentPrice = candles[candles.length - 1].close;

    // MA values
    const ma7 = calculateMA(candles, 7);
    const ma25 = calculateMA(candles, 25);
    const ma99 = calculateMA(candles, 99);

    if (!ma7 || !ma25 || !ma99) return null;

    // Trend determination
    let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (ma7 > ma25 && ma25 > ma99) {
      trend = 'BULLISH';
    } else if (ma7 < ma25 && ma25 < ma99) {
      trend = 'BEARISH';
    }

    // MA Crossover check
    const maCrossover = detectMACrossoverPullback(symbol, interval, candles) !== null;

    // Support/Resistance
    const srLevels = calculateSupportResistance(candles.slice(-100), 20, 0.01);
    const supportLevels = srLevels.filter(l => l.type === 'support' && l.price < currentPrice);
    const resistanceLevels = srLevels.filter(l => l.type === 'resistance' && l.price > currentPrice);

    const supportLevel = supportLevels.length > 0
      ? supportLevels.sort((a, b) => b.price - a.price)[0].price
      : null;

    const resistanceLevel = resistanceLevels.length > 0
      ? resistanceLevels.sort((a, b) => a.price - b.price)[0].price
      : null;

    // Simple RSI calculation (last 14 candles)
    const rsi = calculateSimpleRSI(candles.slice(-14));

    // MACD trend (simple)
    const macdTrend = ma7 > ma25 ? 'POSITIVE' : ma7 < ma25 ? 'NEGATIVE' : 'NEUTRAL';

    // Volume status
    const avgVolume = candles.slice(-20).reduce((sum: number, c: any) => sum + c.volume, 0) / 20;
    const currentVolume = candles[candles.length - 1].volume;
    const volumeStatus = currentVolume > avgVolume * 1.5 ? 'HIGH' : currentVolume < avgVolume * 0.7 ? 'LOW' : 'NORMAL';

    return {
      timeframe: interval,
      trend,
      maCrossover,
      ma7,
      ma25,
      ma99,
      supportLevel,
      resistanceLevel,
      rsi,
      macdTrend,
      volumeStatus,
    };
  } catch (error) {
    console.error(`[Analyzer] Timeframe analysis error:`, error);
    return null;
  }
}

// Simple RSI calculation
function calculateSimpleRSI(candles: any[]): number | null {
  if (candles.length < 14) return null;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  const avgGain = gains / 14;
  const avgLoss = losses / 14;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return rsi;
}

// ============================================================
// 4. COMPREHENSIVE ANALYSIS
// ============================================================

export async function analyzeComprehensive(
  symbol: string,
  currentPrice: number
): Promise<ComprehensiveAnalysis | null> {
  try {
    console.log(`[Analyzer] 🔍 Analyzing ${symbol}...`);

    // Analyze all timeframes in parallel
    const [tf1d, tf4h, tf1h] = await Promise.all([
      analyzeTimeframe(symbol, '1d'),
      analyzeTimeframe(symbol, '4h'),
      analyzeTimeframe(symbol, '1h'),
    ]);

    if (!tf1d || !tf4h || !tf1h) {
      throw new Error('Timeframe analysis failed');
    }

    // MTF Alignment (how many timeframes are bullish)
    const bullishCount = [tf1d, tf4h, tf1h].filter(tf => tf.trend === 'BULLISH').length;
    const mtfAlignment = bullishCount;

    // Composite Score (0-10)
    let score = 0;

    // MTF (0-3 points)
    score += mtfAlignment;

    // MA Crossover on 4h (2 points)
    if (tf4h.maCrossover) score += 2;

    // Above support on 1d (1 point)
    if (tf1d.supportLevel && currentPrice > tf1d.supportLevel) score += 1;

    // Volume high on 4h (1 point)
    if (tf4h.volumeStatus === 'HIGH') score += 1;

    // RSI healthy (1 point)
    if (tf4h.rsi && tf4h.rsi > 40 && tf4h.rsi < 70) score += 1;

    // MACD positive on 4h (1 point)
    if (tf4h.macdTrend === 'POSITIVE') score += 1;

    // Price above MA99 on 1d (1 point)
    if (currentPrice > tf1d.ma99) score += 1;

    const compositeScore = Math.min(score, 10);

    // Recommendation
    let recommendation: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
    if (compositeScore >= 8) recommendation = 'STRONG_BUY';
    else if (compositeScore >= 6) recommendation = 'BUY';
    else if (compositeScore >= 4) recommendation = 'NEUTRAL';
    else if (compositeScore >= 2) recommendation = 'SELL';
    else recommendation = 'STRONG_SELL';

    // Risk Level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    if (mtfAlignment >= 2 && tf4h.supportLevel) riskLevel = 'LOW';
    else if (mtfAlignment >= 1) riskLevel = 'MEDIUM';
    else riskLevel = 'HIGH';

    // Entry/Exit Suggestions
    const suggestedEntry = currentPrice;
    const suggestedStopLoss = tf4h.supportLevel || tf4h.ma25;
    const suggestedTakeProfit = tf4h.resistanceLevel || currentPrice * 1.05;

    const riskAmount = suggestedEntry - suggestedStopLoss;
    const rewardAmount = suggestedTakeProfit - suggestedEntry;
    const riskRewardRatio = `1:${(rewardAmount / riskAmount).toFixed(2)}`;

    return {
      symbol,
      currentPrice,
      timeframes: {
        '1d': tf1d,
        '4h': tf4h,
        '1h': tf1h,
      },
      mtfAlignment,
      compositeScore,
      recommendation,
      riskLevel,
      suggestedEntry,
      suggestedStopLoss,
      suggestedTakeProfit,
      riskRewardRatio,
    };
  } catch (error) {
    console.error(`[Analyzer] Comprehensive analysis error:`, error);
    return null;
  }
}

export default {
  analyzeComprehensive,
  analyzeTimeframe,
};
