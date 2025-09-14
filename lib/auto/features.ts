// Multi-timeframe technical features
import { RSI, MACD, BollingerBands, EMA, SMA, Stochastic, ATR, ADX } from 'technicalindicators';
import * as ss from 'simple-statistics';

export interface TechnicalFeatures {
  // Trend/Momentum
  ema20: number;
  ema50: number;
  sma20: number;
  sma50: number;
  emaRatio: number; // EMA20/EMA50
  smaRatio: number; // SMA20/SMA50
  
  // RSI family
  rsi: number;
  rsiSlope: number; // RSI momentum
  rsiDivergence: number;
  
  // MACD
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  macdSlope: number;
  
  // Bollinger Bands
  bbUpper: number;
  bbLower: number;
  bbMiddle: number;
  bbWidth: number;
  bbPercentB: number; // %B indicator
  bbSqueeze: number;  // Squeeze intensity
  
  // Volatility
  atr: number;
  atrRatio: number; // Current ATR / 20-period ATR average
  volatility: number; // Realized volatility
  
  // Stochastic
  stochK: number;
  stochD: number;
  stochSlope: number;
  
  // ADX (Trend Strength)
  adx: number;
  adxSlope: number;
  
  // Volume-based
  vwap?: number;
  vwapDistance?: number; // Price distance from VWAP
  volumeRatio?: number;  // Current volume / 20-period average
  
  // Market Structure
  higherHighs: number;    // Count of recent higher highs
  lowerLows: number;      // Count of recent lower lows
  supportResistance: number; // Proximity to key levels
  
  // Quality scores
  trendStrength: number;   // Overall trend conviction [0,1]
  meanReversionScore: number; // Mean reversion potential [0,1]
  momentumScore: number;      // Momentum strength [0,1]
  volatilityScore: number;    // Volatility regime [0,1]
}

export interface PriceData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class FeatureEngine {
  
  constructor(private debug = false) {}
  
  calculateFeatures(
    data: PriceData[], 
    timeframe: string = '1m'
  ): TechnicalFeatures | null {
    
    if (data.length < 100) {
      if (this.debug) console.log('⚠️  Insufficient data for feature calculation');
      return null;
    }
    
    try {
      const closes = data.map(d => d.close);
      const highs = data.map(d => d.high);
      const lows = data.map(d => d.low);
      const volumes = data.map(d => d.volume);
      
      // Moving Averages
      const ema20Values = EMA.calculate({ period: 20, values: closes });
      const ema50Values = EMA.calculate({ period: 50, values: closes });
      const sma20Values = SMA.calculate({ period: 20, values: closes });
      const sma50Values = SMA.calculate({ period: 50, values: closes });
      
      const currentEma20 = ema20Values[ema20Values.length - 1] || closes[closes.length - 1];
      const currentEma50 = ema50Values[ema50Values.length - 1] || closes[closes.length - 1];
      const currentSma20 = sma20Values[sma20Values.length - 1] || closes[closes.length - 1];
      const currentSma50 = sma50Values[sma50Values.length - 1] || closes[closes.length - 1];
      
      // RSI
      const rsiValues = RSI.calculate({ period: 14, values: closes });
      const currentRsi = rsiValues[rsiValues.length - 1] || 50;
      const rsiSlope = this.calculateSlope(rsiValues.slice(-5));
      
      // MACD - Simplified approach
      const macdResult: any[] = [];
      try {
        const macdData = MACD.calculate({ 
          fastPeriod: 12, 
          slowPeriod: 26, 
          signalPeriod: 9, 
          values: closes,
          SimpleMAOscillator: true,
          SimpleMASignal: true
        });
        macdResult.push(...macdData);
      } catch (e) {
        // Fallback to manual MACD calculation
        const ema12 = EMA.calculate({ period: 12, values: closes });
        const ema26 = EMA.calculate({ period: 26, values: closes });
        const macdLine = ema12.map((val, i) => val - (ema26[i] || val));
        const signalLine = EMA.calculate({ period: 9, values: macdLine });
        
        macdLine.forEach((macd, i) => {
          const signal = signalLine[i] || macd;
          macdResult.push({
            MACD: macd,
            signal: signal,
            histogram: macd - signal
          });
        });
      }
      
      const currentMacd = macdResult[macdResult.length - 1] || { MACD: 0, signal: 0, histogram: 0 };
      const macdSlope = macdResult.length >= 5 ? 
        this.calculateSlope(macdResult.slice(-5).map(m => m?.MACD || 0)) : 0;
      
      // Bollinger Bands
      const bbData = BollingerBands.calculate({ 
        period: 20, 
        stdDev: 2, 
        values: closes 
      });
      const currentBB = bbData[bbData.length - 1];
      
      // ATR
      const atrData = ATR.calculate({ 
        high: highs, 
        low: lows, 
        close: closes, 
        period: 14 
      });
      const currentAtr = atrData[atrData.length - 1] || 0;
      const atrAvg = atrData.length >= 20 ? 
        ss.mean(atrData.slice(-20)) : currentAtr;
      
      // Stochastic
      const stochData = Stochastic.calculate({ 
        high: highs, 
        low: lows, 
        close: closes, 
        period: 14, 
        signalPeriod: 3 
      });
      const currentStoch = stochData[stochData.length - 1];
      const stochSlope = stochData.length >= 5 ?
        this.calculateSlope(stochData.slice(-5).map(s => s.k)) : 0;
      
      // ADX
      const adxData = ADX.calculate({ 
        high: highs, 
        low: lows, 
        close: closes, 
        period: 14 
      });
      const currentAdxValue = adxData[adxData.length - 1];
      const currentAdx = typeof currentAdxValue === 'object' ? 
        (currentAdxValue as any)?.adx || 25 : currentAdxValue || 25;
      const adxSlope = adxData.length >= 5 ?
        this.calculateSlope(adxData.slice(-5).map(d => 
          typeof d === 'object' ? (d as any)?.adx || 0 : d || 0
        )) : 0;
      
      // Market Structure
      const { higherHighs, lowerLows } = this.calculateMarketStructure(data.slice(-20));
      
      // Volatility
      const returns = this.calculateReturns(closes);
      const volatility = returns.length > 1 ? ss.standardDeviation(returns) : 0;
      
      // Quality Scores
      const trendStrength = this.calculateTrendStrength(
        currentEma20, currentEma50, currentAdx, ema20Values, ema50Values
      );
      const meanReversionScore = this.calculateMeanReversionScore(
        currentRsi, currentBB, closes[closes.length - 1]
      );
      const momentumScore = this.calculateMomentumScore(
        rsiSlope, macdSlope, stochSlope
      );
      const volatilityScore = Math.min(volatility * 100, 1);
      
      const features: TechnicalFeatures = {
        // Trend/Momentum
        ema20: currentEma20,
        ema50: currentEma50,
        sma20: currentSma20,
        sma50: currentSma50,
        emaRatio: currentEma20 / currentEma50,
        smaRatio: currentSma20 / currentSma50,
        
        // RSI
        rsi: currentRsi,
        rsiSlope,
        rsiDivergence: 0, // TODO: Implement divergence detection
        
        // MACD
        macd: currentMacd?.MACD || 0,
        macdSignal: currentMacd?.signal || 0,
        macdHistogram: currentMacd?.histogram || 0,
        macdSlope,
        
        // Bollinger Bands
        bbUpper: currentBB?.upper || 0,
        bbLower: currentBB?.lower || 0,
        bbMiddle: currentBB?.middle || 0,
        bbWidth: currentBB ? (currentBB.upper - currentBB.lower) / currentBB.middle : 0,
        bbPercentB: currentBB ? 
          (closes[closes.length - 1] - currentBB.lower) / (currentBB.upper - currentBB.lower) : 0.5,
        bbSqueeze: this.calculateBBSqueeze(bbData),
        
        // Volatility
        atr: currentAtr,
        atrRatio: atrAvg > 0 ? currentAtr / atrAvg : 1,
        volatility,
        
        // Stochastic
        stochK: currentStoch?.k || 50,
        stochD: currentStoch?.d || 50,
        stochSlope,
        
        // ADX
        adx: currentAdx,
        adxSlope,
        
        // Volume (if available)
        volumeRatio: volumes.length >= 20 ? 
          volumes[volumes.length - 1] / ss.mean(volumes.slice(-20)) : 1,
        
        // Market Structure
        higherHighs,
        lowerLows,
        supportResistance: 0, // TODO: Implement S/R detection
        
        // Quality scores
        trendStrength,
        meanReversionScore,
        momentumScore,
        volatilityScore
      };
      
      if (this.debug) {
        console.log(`📊 Features calculated for ${timeframe}:`, {
          trend: trendStrength.toFixed(3),
          momentum: momentumScore.toFixed(3),
          meanRev: meanReversionScore.toFixed(3),
          vol: volatilityScore.toFixed(3)
        });
      }
      
      return features;
      
    } catch (error) {
      console.error('❌ Feature calculation error:', error);
      return null;
    }
  }
  
  private calculateSlope(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    try {
      const slope = ss.linearRegression(indices.map((x, i) => [x, values[i]])).m;
      return isFinite(slope) ? slope : 0;
    } catch {
      return 0;
    }
  }
  
  private calculateMarketStructure(data: PriceData[]): { higherHighs: number, lowerLows: number } {
    let higherHighs = 0;
    let lowerLows = 0;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i].high > data[i-1].high) higherHighs++;
      if (data[i].low < data[i-1].low) lowerLows++;
    }
    
    return { higherHighs, lowerLows };
  }
  
  private calculateReturns(closes: number[]): number[] {
    const returns = [];
    for (let i = 1; i < closes.length; i++) {
      returns.push((closes[i] - closes[i-1]) / closes[i-1]);
    }
    return returns;
  }
  
  private calculateBBSqueeze(bbData: any[]): number {
    if (bbData.length < 20) return 0;
    
    const recentWidths = bbData.slice(-20).map(bb => 
      bb ? (bb.upper - bb.lower) / bb.middle : 0
    );
    
    const avgWidth = ss.mean(recentWidths);
    const currentWidth = recentWidths[recentWidths.length - 1];
    
    // Squeeze indicator: lower width = higher squeeze
    return avgWidth > 0 ? Math.max(0, 1 - (currentWidth / avgWidth)) : 0;
  }
  
  private calculateTrendStrength(
    ema20: number, ema50: number, adx: number, 
    ema20Values: number[], ema50Values: number[]
  ): number {
    // EMA alignment
    const emaAlignment = ema20 > ema50 ? 1 : 0;
    
    // EMA slope consistency
    const ema20Slope = ema20Values.length >= 5 ? 
      this.calculateSlope(ema20Values.slice(-5)) : 0;
    const ema50Slope = ema50Values.length >= 5 ? 
      this.calculateSlope(ema50Values.slice(-5)) : 0;
    
    const slopeAlignment = (ema20Slope > 0 && ema50Slope > 0) || 
                          (ema20Slope < 0 && ema50Slope < 0) ? 1 : 0;
    
    // ADX strength
    const adxStrength = Math.min(adx / 25, 1); // Normalize ADX
    
    return (emaAlignment * 0.4 + slopeAlignment * 0.3 + adxStrength * 0.3);
  }
  
  private calculateMeanReversionScore(rsi: number, bb: any, price: number): number {
    let score = 0;
    
    // RSI extremes
    if (rsi > 70) score += 0.5;
    else if (rsi < 30) score += 0.5;
    
    // Bollinger Band extremes
    if (bb && bb.upper && bb.lower) {
      const bbPercentB = (price - bb.lower) / (bb.upper - bb.lower);
      if (bbPercentB > 0.8 || bbPercentB < 0.2) score += 0.5;
    }
    
    return Math.min(score, 1);
  }
  
  private calculateMomentumScore(rsiSlope: number, macdSlope: number, stochSlope: number): number {
    // Normalize slopes and take average
    const avgSlope = (rsiSlope + macdSlope + stochSlope) / 3;
    return Math.max(0, Math.min(1, Math.abs(avgSlope) * 10));
  }
}

// Singleton instance
export const featureEngine = new FeatureEngine();
