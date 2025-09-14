interface OHLCV {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

interface IndicatorResult {
  value: number;
  timestamp: number;
}

interface MACDResult {
  macd: number;
  signal: number;
  histogram: number;
  timestamp: number;
}

interface BollingerBandsResult {
  upper: number;
  middle: number;
  lower: number;
  timestamp: number;
}

interface IchimokuResult {
  tenkanSen: number;
  kijunSen: number;
  senkouSpanA: number;
  senkouSpanB: number;
  chikouSpan: number;
  timestamp: number;
}

interface StochasticResult {
  k: number;
  d: number;
  timestamp: number;
}

interface FibonacciLevels {
  level_0: number;    // 0%
  level_236: number;  // 23.6%
  level_382: number;  // 38.2%
  level_500: number;  // 50%
  level_618: number;  // 61.8%
  level_786: number;  // 78.6%
  level_100: number;  // 100%
}

class TechnicalIndicatorsService {
  /**
   * Simple Moving Average (SMA)
   */
  calculateSMA(data: number[], period: number): IndicatorResult[] {
    if (data.length < period) return [];
    
    const results: IndicatorResult[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      const average = sum / period;
      
      results.push({
        value: average,
        timestamp: Date.now() - (data.length - i - 1) * 60000, // Assuming 1-minute intervals
      });
    }
    
    return results;
  }

  /**
   * Exponential Moving Average (EMA)
   */
  calculateEMA(data: number[], period: number): IndicatorResult[] {
    if (data.length < period) return [];
    
    const results: IndicatorResult[] = [];
    const multiplier = 2 / (period + 1);
    
    // Start with SMA for the first value
    let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    results.push({
      value: ema,
      timestamp: Date.now() - (data.length - period) * 60000,
    });
    
    // Calculate EMA for the rest
    for (let i = period; i < data.length; i++) {
      ema = (data[i] - ema) * multiplier + ema;
      results.push({
        value: ema,
        timestamp: Date.now() - (data.length - i - 1) * 60000,
      });
    }
    
    return results;
  }

  /**
   * Relative Strength Index (RSI)
   */
  calculateRSI(data: number[], period = 14): IndicatorResult[] {
    if (data.length < period + 1) return [];
    
    const results: IndicatorResult[] = [];
    const gains: number[] = [];
    const losses: number[] = [];
    
    // Calculate price changes
    for (let i = 1; i < data.length; i++) {
      const change = data[i] - data[i - 1];
      gains.push(Math.max(change, 0));
      losses.push(Math.abs(Math.min(change, 0)));
    }
    
    // Calculate RSI values
    for (let i = period - 1; i < gains.length; i++) {
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      
      results.push({
        value: rsi,
        timestamp: Date.now() - (gains.length - i - 1) * 60000,
      });
    }
    
    return results;
  }

  /**
   * MACD (Moving Average Convergence Divergence)
   */
  calculateMACD(data: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): MACDResult[] {
    if (data.length < slowPeriod) return [];
    
    const fastEMA = this.calculateEMA(data, fastPeriod);
    const slowEMA = this.calculateEMA(data, slowPeriod);
    
    if (fastEMA.length === 0 || slowEMA.length === 0) return [];
    
    // Calculate MACD line
    const macdLine: number[] = [];
    const minLength = Math.min(fastEMA.length, slowEMA.length);
    
    for (let i = 0; i < minLength; i++) {
      macdLine.push(fastEMA[fastEMA.length - minLength + i].value - slowEMA[slowEMA.length - minLength + i].value);
    }
    
    // Calculate signal line (EMA of MACD line)
    const signalLine = this.calculateEMA(macdLine, signalPeriod);
    
    const results: MACDResult[] = [];
    const signalStartIndex = macdLine.length - signalLine.length;
    
    for (let i = 0; i < signalLine.length; i++) {
      const macdValue = macdLine[signalStartIndex + i];
      const signalValue = signalLine[i].value;
      
      results.push({
        macd: macdValue,
        signal: signalValue,
        histogram: macdValue - signalValue,
        timestamp: Date.now() - (signalLine.length - i - 1) * 60000,
      });
    }
    
    return results;
  }

  /**
   * Bollinger Bands
   */
  calculateBollingerBands(data: number[], period = 20, multiplier = 2): BollingerBandsResult[] {
    if (data.length < period) return [];
    
    const smaResults = this.calculateSMA(data, period);
    const results: BollingerBandsResult[] = [];
    
    for (let i = 0; i < smaResults.length; i++) {
      const dataIndex = i + period - 1;
      const subset = data.slice(dataIndex - period + 1, dataIndex + 1);
      const sma = smaResults[i].value;
      
      // Calculate standard deviation
      const variance = subset.reduce((sum, value) => sum + Math.pow(value - sma, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      
      results.push({
        upper: sma + (multiplier * stdDev),
        middle: sma,
        lower: sma - (multiplier * stdDev),
        timestamp: smaResults[i].timestamp,
      });
    }
    
    return results;
  }

  /**
   * Stochastic Oscillator
   */
  calculateStochastic(highs: number[], lows: number[], closes: number[], kPeriod = 14, dPeriod = 3): StochasticResult[] {
    if (highs.length < kPeriod || lows.length < kPeriod || closes.length < kPeriod) return [];
    
    const kValues: number[] = [];
    
    // Calculate %K values
    for (let i = kPeriod - 1; i < closes.length; i++) {
      const highestHigh = Math.max(...highs.slice(i - kPeriod + 1, i + 1));
      const lowestLow = Math.min(...lows.slice(i - kPeriod + 1, i + 1));
      const currentClose = closes[i];
      
      const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
      kValues.push(k);
    }
    
    // Calculate %D values (SMA of %K)
    const dResults = this.calculateSMA(kValues, dPeriod);
    
    const results: StochasticResult[] = [];
    const dStartIndex = kValues.length - dResults.length;
    
    for (let i = 0; i < dResults.length; i++) {
      results.push({
        k: kValues[dStartIndex + i],
        d: dResults[i].value,
        timestamp: Date.now() - (dResults.length - i - 1) * 60000,
      });
    }
    
    return results;
  }

  /**
   * Average Directional Index (ADX)
   */
  calculateADX(highs: number[], lows: number[], closes: number[], period = 14): IndicatorResult[] {
    if (highs.length < period + 1) return [];
    
    const trueRanges: number[] = [];
    const plusDMs: number[] = [];
    const minusDMs: number[] = [];
    
    // Calculate True Range, +DM, and -DM
    for (let i = 1; i < highs.length; i++) {
      const high = highs[i];
      const low = lows[i];
      const close = closes[i];
      const prevHigh = highs[i - 1];
      const prevLow = lows[i - 1];
      const prevClose = closes[i - 1];
      
      const tr1 = high - low;
      const tr2 = Math.abs(high - prevClose);
      const tr3 = Math.abs(low - prevClose);
      const tr = Math.max(tr1, tr2, tr3);
      trueRanges.push(tr);
      
      const upMove = high - prevHigh;
      const downMove = prevLow - low;
      
      const plusDM = (upMove > downMove && upMove > 0) ? upMove : 0;
      const minusDM = (downMove > upMove && downMove > 0) ? downMove : 0;
      
      plusDMs.push(plusDM);
      minusDMs.push(minusDM);
    }
    
    const results: IndicatorResult[] = [];
    
    // Calculate ADX for each period
    for (let i = period - 1; i < trueRanges.length; i++) {
      const atr = trueRanges.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      const plusDI = (plusDMs.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period) / atr * 100;
      const minusDI = (minusDMs.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period) / atr * 100;
      
      const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
      
      results.push({
        value: dx,
        timestamp: Date.now() - (trueRanges.length - i - 1) * 60000,
      });
    }
    
    // Smooth ADX values
    return this.calculateEMA(results.map(r => r.value), period);
  }

  /**
   * Ichimoku Cloud
   */
  calculateIchimoku(highs: number[], lows: number[], closes: number[]): IchimokuResult[] {
    if (highs.length < 52) return [];
    
    const results: IchimokuResult[] = [];
    
    for (let i = 51; i < highs.length; i++) {
      // Tenkan-sen (9-period)
      const tenkanHigh = Math.max(...highs.slice(i - 8, i + 1));
      const tenkanLow = Math.min(...lows.slice(i - 8, i + 1));
      const tenkanSen = (tenkanHigh + tenkanLow) / 2;
      
      // Kijun-sen (26-period)
      const kijunHigh = Math.max(...highs.slice(i - 25, i + 1));
      const kijunLow = Math.min(...lows.slice(i - 25, i + 1));
      const kijunSen = (kijunHigh + kijunLow) / 2;
      
      // Senkou Span A (projected 26 periods ahead)
      const senkouSpanA = (tenkanSen + kijunSen) / 2;
      
      // Senkou Span B (52-period, projected 26 periods ahead)
      const senkouHigh = Math.max(...highs.slice(i - 51, i + 1));
      const senkouLow = Math.min(...lows.slice(i - 51, i + 1));
      const senkouSpanB = (senkouHigh + senkouLow) / 2;
      
      // Chikou Span (current close, plotted 26 periods back)
      const chikouSpan = closes[i];
      
      results.push({
        tenkanSen,
        kijunSen,
        senkouSpanA,
        senkouSpanB,
        chikouSpan,
        timestamp: Date.now() - (highs.length - i - 1) * 60000,
      });
    }
    
    return results;
  }

  /**
   * Fibonacci Retracement Levels
   */
  calculateFibonacciLevels(high: number, low: number): FibonacciLevels {
    const range = high - low;
    
    return {
      level_0: high,
      level_236: high - (range * 0.236),
      level_382: high - (range * 0.382),
      level_500: high - (range * 0.500),
      level_618: high - (range * 0.618),
      level_786: high - (range * 0.786),
      level_100: low,
    };
  }

  /**
   * Volume Weighted Average Price (VWAP)
   */
  calculateVWAP(ohlcvData: OHLCV[]): IndicatorResult[] {
    if (ohlcvData.length === 0) return [];
    
    const results: IndicatorResult[] = [];
    let cumulativeVolume = 0;
    let cumulativeTypicalPriceVolume = 0;
    
    for (let i = 0; i < ohlcvData.length; i++) {
      const candle = ohlcvData[i];
      const typicalPrice = (candle.high + candle.low + candle.close) / 3;
      const typicalPriceVolume = typicalPrice * candle.volume;
      
      cumulativeTypicalPriceVolume += typicalPriceVolume;
      cumulativeVolume += candle.volume;
      
      const vwap = cumulativeVolume > 0 ? cumulativeTypicalPriceVolume / cumulativeVolume : typicalPrice;
      
      results.push({
        value: vwap,
        timestamp: candle.timestamp,
      });
    }
    
    return results;
  }

  /**
   * Williams %R
   */
  calculateWilliamsR(highs: number[], lows: number[], closes: number[], period = 14): IndicatorResult[] {
    if (highs.length < period) return [];
    
    const results: IndicatorResult[] = [];
    
    for (let i = period - 1; i < closes.length; i++) {
      const highestHigh = Math.max(...highs.slice(i - period + 1, i + 1));
      const lowestLow = Math.min(...lows.slice(i - period + 1, i + 1));
      const currentClose = closes[i];
      
      const williamsR = ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
      
      results.push({
        value: williamsR,
        timestamp: Date.now() - (closes.length - i - 1) * 60000,
      });
    }
    
    return results;
  }

  /**
   * Commodity Channel Index (CCI)
   */
  calculateCCI(highs: number[], lows: number[], closes: number[], period = 20): IndicatorResult[] {
    if (highs.length < period) return [];
    
    const results: IndicatorResult[] = [];
    
    for (let i = period - 1; i < closes.length; i++) {
      const typicalPrices: number[] = [];
      
      // Calculate typical prices for the period
      for (let j = i - period + 1; j <= i; j++) {
        typicalPrices.push((highs[j] + lows[j] + closes[j]) / 3);
      }
      
      const sma = typicalPrices.reduce((a, b) => a + b, 0) / period;
      const currentTypicalPrice = (highs[i] + lows[i] + closes[i]) / 3;
      
      // Calculate mean deviation
      const meanDeviation = typicalPrices.reduce((sum, tp) => sum + Math.abs(tp - sma), 0) / period;
      
      const cci = meanDeviation !== 0 ? (currentTypicalPrice - sma) / (0.015 * meanDeviation) : 0;
      
      results.push({
        value: cci,
        timestamp: Date.now() - (closes.length - i - 1) * 60000,
      });
    }
    
    return results;
  }

  /**
   * Comprehensive Technical Analysis
   */
  async analyzeSymbol(ohlcvData: OHLCV[]): Promise<any> {
    if (ohlcvData.length < 52) {
      throw new Error('Insufficient data for comprehensive analysis');
    }
    
    const closes = ohlcvData.map(d => d.close);
    const highs = ohlcvData.map(d => d.high);
    const lows = ohlcvData.map(d => d.low);
    const volumes = ohlcvData.map(d => d.volume);
    
    const analysis = {
      timestamp: Date.now(),
      symbol: 'ANALYSIS',
      
      // Trend Indicators
      sma20: this.calculateSMA(closes, 20).slice(-1)[0]?.value,
      sma50: this.calculateSMA(closes, 50).slice(-1)[0]?.value,
      ema20: this.calculateEMA(closes, 20).slice(-1)[0]?.value,
      ema50: this.calculateEMA(closes, 50).slice(-1)[0]?.value,
      
      // Momentum Indicators
      rsi: this.calculateRSI(closes).slice(-1)[0]?.value,
      macd: this.calculateMACD(closes).slice(-1)[0],
      stochastic: this.calculateStochastic(highs, lows, closes).slice(-1)[0],
      
      // Volatility Indicators
      bollingerBands: this.calculateBollingerBands(closes).slice(-1)[0],
      
      // Volume Indicators
      vwap: this.calculateVWAP(ohlcvData).slice(-1)[0]?.value,
      
      // Strength Indicators
      adx: this.calculateADX(highs, lows, closes).slice(-1)[0]?.value,
      williamsR: this.calculateWilliamsR(highs, lows, closes).slice(-1)[0]?.value,
      cci: this.calculateCCI(highs, lows, closes).slice(-1)[0]?.value,
      
      // Japanese Indicators
      ichimoku: this.calculateIchimoku(highs, lows, closes).slice(-1)[0],
      
      // Support/Resistance
      fibonacciLevels: this.calculateFibonacciLevels(
        Math.max(...highs.slice(-52)),
        Math.min(...lows.slice(-52))
      ),
      
      // Market Conditions
      currentPrice: closes[closes.length - 1],
      priceChange24h: closes[closes.length - 1] - closes[closes.length - 2],
      volume24h: volumes[volumes.length - 1],
      
      // Signals
      signals: {
        trend: this.analyzeTrend(closes),
        momentum: this.analyzeMomentum(closes, highs, lows),
        volume: this.analyzeVolume(volumes),
        volatility: this.analyzeVolatility(closes),
      }
    };
    
    return analysis;
  }

  private analyzeTrend(closes: number[]): string {
    const sma20 = this.calculateSMA(closes, 20).slice(-1)[0]?.value;
    const sma50 = this.calculateSMA(closes, 50).slice(-1)[0]?.value;
    const currentPrice = closes[closes.length - 1];
    
    if (!sma20 || !sma50) return 'NEUTRAL';
    
    if (currentPrice > sma20 && sma20 > sma50) return 'BULLISH';
    if (currentPrice < sma20 && sma20 < sma50) return 'BEARISH';
    return 'NEUTRAL';
  }

  private analyzeMomentum(closes: number[], highs: number[], lows: number[]): string {
    const rsi = this.calculateRSI(closes).slice(-1)[0]?.value;
    const stoch = this.calculateStochastic(highs, lows, closes).slice(-1)[0];
    
    if (!rsi || !stoch) return 'NEUTRAL';
    
    if (rsi > 70 || stoch.k > 80) return 'OVERBOUGHT';
    if (rsi < 30 || stoch.k < 20) return 'OVERSOLD';
    return 'NEUTRAL';
  }

  private analyzeVolume(volumes: number[]): string {
    const recentVolume = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    
    if (recentVolume > avgVolume * 1.5) return 'HIGH';
    if (recentVolume < avgVolume * 0.5) return 'LOW';
    return 'NORMAL';
  }

  private analyzeVolatility(closes: number[]): string {
    const bb = this.calculateBollingerBands(closes).slice(-1)[0];
    const currentPrice = closes[closes.length - 1];
    
    if (!bb) return 'NORMAL';
    
    const bandWidth = (bb.upper - bb.lower) / bb.middle;
    
    if (bandWidth > 0.1) return 'HIGH';
    if (bandWidth < 0.02) return 'LOW';
    return 'NORMAL';
  }
}

export const technicalIndicatorsService = new TechnicalIndicatorsService();
export type { 
  OHLCV, 
  IndicatorResult, 
  MACDResult, 
  BollingerBandsResult, 
  IchimokuResult, 
  StochasticResult,
  FibonacciLevels 
};
