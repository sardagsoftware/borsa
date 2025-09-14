// Pre-breakout and squeeze detection
import { PriceData, TechnicalFeatures } from './features';
import { MicroStructure } from './micro';

export interface SqueezeAnalysis {
  // Squeeze metrics
  isSqueezing: boolean;       // Currently in squeeze
  squeezeIntensity: number;   // [0, 1] compression level
  squeezeDuration: number;    // Bars in squeeze
  
  // Pre-breakout signals
  preBreakoutScore: number;   // [0, 1] breakout probability
  breakoutDirection: number;  // 1 (up), -1 (down), 0 (unclear)
  breakoutTarget: number;     // Estimated breakout price target
  
  // Volatility analysis
  volCompressionRatio: number; // Current vs historical volatility
  energyBuildUp: number;      // [0, 1] coiled spring energy
  
  // Technical squeeze indicators
  bbSqueeze: boolean;         // Bollinger Band squeeze
  keltnerSqueeze: boolean;    // Keltner Channel squeeze
  donchianSqueeze: boolean;   // Donchian Channel squeeze
  
  // Breakout confirmation signals
  volumeConfirmation: number; // [0, 1] volume buildup
  momentumAlignment: number;  // [0, 1] momentum indicators alignment
  structureBreak: number;     // [0, 1] key level break probability
}

export interface SqueezeAlert {
  symbol: string;
  type: 'SQUEEZE_FORMING' | 'PRE_BREAKOUT' | 'BREAKOUT_IMMINENT';
  score: number;
  direction: 'UP' | 'DOWN' | 'BOTH';
  target: number;
  confidence: number;
  timeframe: string;
  createdAt: Date;
}

export class SqueezeDetector {
  private squeezeHistory: Map<string, number[]> = new Map();
  private breakoutHistory: Map<string, { price: number; direction: number; timestamp: number }[]> = new Map();
  
  constructor(
    private squeezeWindow = parseInt(process.env.SQUEEZE_WINDOW || '20'),
    private breakoutWindow = parseInt(process.env.BREAKOUT_WINDOW || '55')
  ) {}
  
  analyzeSqueezeAndBreakout(
    symbol: string,
    data: PriceData[],
    features: TechnicalFeatures,
    micro: MicroStructure
  ): SqueezeAnalysis {
    
    if (data.length < this.breakoutWindow) {
      return this.getDefaultAnalysis();
    }
    
    // Initialize histories if needed
    if (!this.squeezeHistory.has(symbol)) {
      this.squeezeHistory.set(symbol, []);
    }
    if (!this.breakoutHistory.has(symbol)) {
      this.breakoutHistory.set(symbol, []);
    }
    
    // Calculate squeeze components
    const bbSqueeze = this.detectBollingerSqueeze(data, features);
    const keltnerSqueeze = this.detectKeltnerSqueeze(data);
    const donchianSqueeze = this.detectDonchianSqueeze(data);
    
    const isSqueezing = bbSqueeze.isSqueezing || keltnerSqueeze.isSqueezing;
    const squeezeIntensity = Math.max(bbSqueeze.intensity, keltnerSqueeze.intensity);
    
    // Update squeeze history
    const squeezeHist = this.squeezeHistory.get(symbol)!;
    squeezeHist.push(squeezeIntensity);
    if (squeezeHist.length > 100) squeezeHist.shift();
    
    const squeezeDuration = this.calculateSqueezeDuration(squeezeHist);
    
    // Volatility compression analysis
    const volCompressionRatio = this.calculateVolatilityCompression(data);
    const energyBuildUp = this.calculateEnergyBuildup(squeezeIntensity, squeezeDuration);
    
    // Pre-breakout analysis
    const preBreakoutScore = this.calculatePreBreakoutScore(
      data, features, micro, squeezeIntensity, energyBuildUp
    );
    
    const breakoutDirection = this.predictBreakoutDirection(data, features, micro);
    const breakoutTarget = this.calculateBreakoutTarget(data, breakoutDirection);
    
    // Confirmation signals
    const volumeConfirmation = this.analyzeVolumePattern(data, isSqueezing);
    const momentumAlignment = this.analyzeMomentumAlignment(features);
    const structureBreak = this.analyzeStructureBreak(data, features);
    
    const analysis: SqueezeAnalysis = {
      isSqueezing,
      squeezeIntensity,
      squeezeDuration,
      preBreakoutScore,
      breakoutDirection,
      breakoutTarget,
      volCompressionRatio,
      energyBuildUp,
      bbSqueeze: bbSqueeze.isSqueezing,
      keltnerSqueeze: keltnerSqueeze.isSqueezing,
      donchianSqueeze: donchianSqueeze.isSqueezing,
      volumeConfirmation,
      momentumAlignment,
      structureBreak
    };
    
    // Update breakout history if significant movement
    this.updateBreakoutHistory(symbol, data, analysis);
    
    console.log(`⚡ Squeeze ${symbol}: Intensity=${squeezeIntensity.toFixed(2)} PreBreak=${preBreakoutScore.toFixed(2)}`);
    
    return analysis;
  }
  
  private detectBollingerSqueeze(
    data: PriceData[], 
    features: TechnicalFeatures
  ): { isSqueezing: boolean; intensity: number } {
    
    // Use BB squeeze from features if available
    const bbSqueezeFromFeatures = features.bbSqueeze || 0;
    
    // Calculate BB width manually for validation
    if (features.bbUpper && features.bbLower && features.bbMiddle) {
      const currentWidth = (features.bbUpper - features.bbLower) / features.bbMiddle;
      
      // Compare to historical widths
      const recentData = data.slice(-50);
      const historicalWidths = this.calculateHistoricalBBWidths(recentData);
      
      if (historicalWidths.length > 0) {
        const avgWidth = this.mean(historicalWidths);
        const currentVsAvg = currentWidth / avgWidth;
        
        const isSqueezing = currentVsAvg < 0.8; // 20% below average
        const intensity = Math.max(0, 1 - currentVsAvg);
        
        return { isSqueezing, intensity };
      }
    }
    
    // Fallback to features-based squeeze
    return {
      isSqueezing: bbSqueezeFromFeatures > 0.5,
      intensity: bbSqueezeFromFeatures
    };
  }
  
  private detectKeltnerSqueeze(data: PriceData[]): { isSqueezing: boolean; intensity: number } {
    if (data.length < this.squeezeWindow + 10) {
      return { isSqueezing: false, intensity: 0 };
    }
    
    // Calculate Keltner Channels
    const period = this.squeezeWindow;
    const multiplier = 2.0;
    
    const keltnerData = this.calculateKeltnerChannels(data, period, multiplier);
    const currentKeltner = keltnerData[keltnerData.length - 1];
    
    if (!currentKeltner) return { isSqueezing: false, intensity: 0 };
    
    const currentWidth = (currentKeltner.upper - currentKeltner.lower) / currentKeltner.middle;
    
    // Compare to historical widths
    const historicalWidths = keltnerData.slice(-50).map(k => 
      k ? (k.upper - k.lower) / k.middle : 0
    ).filter(w => w > 0);
    
    if (historicalWidths.length === 0) {
      return { isSqueezing: false, intensity: 0 };
    }
    
    const avgWidth = this.mean(historicalWidths);
    const currentVsAvg = currentWidth / avgWidth;
    
    const isSqueezing = currentVsAvg < 0.75; // 25% below average
    const intensity = Math.max(0, 1 - currentVsAvg);
    
    return { isSqueezing, intensity };
  }
  
  private detectDonchianSqueeze(data: PriceData[]): { isSqueezing: boolean; intensity: number } {
    if (data.length < this.breakoutWindow) {
      return { isSqueezing: false, intensity: 0 };
    }
    
    // Donchian Channel calculation
    const period = this.breakoutWindow;
    const recentData = data.slice(-period);
    
    const high = Math.max(...recentData.map(d => d.high));
    const low = Math.min(...recentData.map(d => d.low));
    const currentPrice = data[data.length - 1].close;
    
    const channelWidth = (high - low) / currentPrice;
    
    // Compare to longer-term channel widths
    const longerPeriod = period * 2;
    if (data.length >= longerPeriod) {
      const longerData = data.slice(-longerPeriod, -period);
      const longerHigh = Math.max(...longerData.map(d => d.high));
      const longerLow = Math.min(...longerData.map(d => d.low));
      const longerWidth = (longerHigh - longerLow) / currentPrice;
      
      if (longerWidth > 0) {
        const widthRatio = channelWidth / longerWidth;
        const isSqueezing = widthRatio < 0.6; // 40% compression
        const intensity = Math.max(0, 1 - widthRatio);
        
        return { isSqueezing, intensity };
      }
    }
    
    return { isSqueezing: false, intensity: 0 };
  }
  
  private calculateHistoricalBBWidths(data: PriceData[]): number[] {
    // Simplified BB width calculation
    const period = 20;
    const widths = [];
    
    for (let i = period; i < data.length; i++) {
      const slice = data.slice(i - period, i);
      const closes = slice.map(d => d.close);
      const sma = this.mean(closes);
      const std = this.standardDeviation(closes);
      
      if (std > 0 && sma > 0) {
        const width = (std * 4) / sma; // Upper - Lower = SMA + 2*STD - (SMA - 2*STD) = 4*STD
        widths.push(width);
      }
    }
    
    return widths;
  }
  
  private calculateKeltnerChannels(data: PriceData[], period: number, multiplier: number): any[] {
    const result = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      
      // EMA of typical price
      const typicalPrices = slice.map(d => (d.high + d.low + d.close) / 3);
      const ema = this.calculateEMA(typicalPrices, period);
      const currentEMA = ema[ema.length - 1];
      
      // ATR calculation
      const atr = this.calculateATR(slice);
      
      if (currentEMA && atr) {
        result.push({
          middle: currentEMA,
          upper: currentEMA + multiplier * atr,
          lower: currentEMA - multiplier * atr
        });
      } else {
        result.push(null);
      }
    }
    
    return result;
  }
  
  private calculateEMA(values: number[], period: number): number[] {
    const ema = [];
    const multiplier = 2 / (period + 1);
    
    ema[0] = values[0];
    
    for (let i = 1; i < values.length; i++) {
      ema[i] = (values[i] * multiplier) + (ema[i - 1] * (1 - multiplier));
    }
    
    return ema;
  }
  
  private calculateATR(data: PriceData[]): number {
    if (data.length < 2) return 0;
    
    const trueRanges = [];
    
    for (let i = 1; i < data.length; i++) {
      const high = data[i].high;
      const low = data[i].low;
      const prevClose = data[i - 1].close;
      
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      
      trueRanges.push(tr);
    }
    
    return this.mean(trueRanges);
  }
  
  private calculateSqueezeDuration(squeezeHistory: number[]): number {
    let duration = 0;
    const threshold = 0.3;
    
    for (let i = squeezeHistory.length - 1; i >= 0; i--) {
      if (squeezeHistory[i] > threshold) {
        duration++;
      } else {
        break;
      }
    }
    
    return duration;
  }
  
  private calculateVolatilityCompression(data: PriceData[]): number {
    const shortPeriod = 10;
    const longPeriod = 50;
    
    if (data.length < longPeriod) return 1;
    
    const recentData = data.slice(-shortPeriod);
    const historicalData = data.slice(-longPeriod, -shortPeriod);
    
    const recentVol = this.calculateRealizedVolatility(recentData);
    const historicalVol = this.calculateRealizedVolatility(historicalData);
    
    return historicalVol > 0 ? recentVol / historicalVol : 1;
  }
  
  private calculateRealizedVolatility(data: PriceData[]): number {
    if (data.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      returns.push((data[i].close - data[i - 1].close) / data[i - 1].close);
    }
    
    return this.standardDeviation(returns);
  }
  
  private calculateEnergyBuildup(squeezeIntensity: number, squeezeDuration: number): number {
    // Energy builds up with intensity and duration
    const intensityComponent = squeezeIntensity;
    const durationComponent = Math.min(1, squeezeDuration / 20); // Max at 20 periods
    
    return (intensityComponent * 0.6 + durationComponent * 0.4);
  }
  
  private calculatePreBreakoutScore(
    data: PriceData[],
    features: TechnicalFeatures,
    micro: MicroStructure,
    squeezeIntensity: number,
    energyBuildup: number
  ): number {
    
    let score = 0;
    
    // Base squeeze score (30%)
    score += squeezeIntensity * 0.3;
    
    // Energy buildup (25%)
    score += energyBuildup * 0.25;
    
    // Volume pattern (20%)
    const volPattern = this.analyzeVolumePattern(data, true);
    score += volPattern * 0.2;
    
    // Momentum alignment (15%)
    const momentum = this.analyzeMomentumAlignment(features);
    score += momentum * 0.15;
    
    // Micro structure signals (10%)
    score += (micro.microTrendScore * 0.05 + micro.velocityScore * 0.05);
    
    return Math.max(0, Math.min(1, score));
  }
  
  private predictBreakoutDirection(
    data: PriceData[],
    features: TechnicalFeatures,
    micro: MicroStructure
  ): number {
    
    let directionScore = 0;
    
    // EMA bias
    if (features.emaRatio > 1.01) directionScore += 0.3;
    else if (features.emaRatio < 0.99) directionScore -= 0.3;
    
    // RSI position
    if (features.rsi > 55) directionScore += 0.2;
    else if (features.rsi < 45) directionScore -= 0.2;
    
    // MACD
    if (features.macdHistogram > 0) directionScore += 0.15;
    else if (features.macdHistogram < 0) directionScore -= 0.15;
    
    // Volume flow (if available)
    if (micro.obImbalance > 0.1) directionScore += 0.15;
    else if (micro.obImbalance < -0.1) directionScore -= 0.15;
    
    // Tick direction
    directionScore += micro.tickDirection * 0.2;
    
    // Return normalized direction
    if (directionScore > 0.3) return 1;
    else if (directionScore < -0.3) return -1;
    else return 0;
  }
  
  private calculateBreakoutTarget(data: PriceData[], direction: number): number {
    if (data.length < this.breakoutWindow || direction === 0) {
      return data[data.length - 1].close;
    }
    
    const currentPrice = data[data.length - 1].close;
    const recentData = data.slice(-this.breakoutWindow);
    
    // Donchian breakout target
    const high = Math.max(...recentData.map(d => d.high));
    const low = Math.min(...recentData.map(d => d.low));
    const range = high - low;
    
    if (direction > 0) {
      return high + range * 0.5; // 50% extension above high
    } else {
      return low - range * 0.5; // 50% extension below low
    }
  }
  
  private analyzeVolumePattern(data: PriceData[], isSqueezing: boolean): number {
    if (data.length < 20) return 0.5;
    
    const recentVolumes = data.slice(-10).map(d => d.volume);
    const historicalVolumes = data.slice(-30, -10).map(d => d.volume);
    
    const recentAvgVol = this.mean(recentVolumes);
    const historicalAvgVol = this.mean(historicalVolumes);
    
    if (historicalAvgVol === 0) return 0.5;
    
    const volumeRatio = recentAvgVol / historicalAvgVol;
    
    if (isSqueezing) {
      // During squeeze, expect declining volume
      return volumeRatio < 0.8 ? 0.8 : 0.3;
    } else {
      // For breakout, expect increasing volume
      return Math.min(1, volumeRatio - 0.5);
    }
  }
  
  private analyzeMomentumAlignment(features: TechnicalFeatures): number {
    // Check if multiple momentum indicators agree
    let alignmentScore = 0;
    
    const rsiMomentum = features.rsiSlope > 0 ? 1 : -1;
    const macdMomentum = features.macdSlope > 0 ? 1 : -1;
    const stochMomentum = features.stochSlope > 0 ? 1 : -1;
    
    // Count agreements
    const momentums = [rsiMomentum, macdMomentum, stochMomentum];
    const positive = momentums.filter(m => m > 0).length;
    const negative = momentums.filter(m => m < 0).length;
    
    alignmentScore = Math.abs(positive - negative) / momentums.length;
    
    return alignmentScore;
  }
  
  private analyzeStructureBreak(data: PriceData[], features: TechnicalFeatures): number {
    // Analyze key level proximity
    const currentPrice = data[data.length - 1].close;
    
    let structureScore = 0;
    
    // Moving average breaks
    if (Math.abs(currentPrice - features.sma20) / features.sma20 < 0.01) {
      structureScore += 0.3; // Close to SMA20
    }
    
    if (Math.abs(currentPrice - features.sma50) / features.sma50 < 0.01) {
      structureScore += 0.2; // Close to SMA50
    }
    
    // Bollinger Band position
    if (features.bbPercentB > 0.8 || features.bbPercentB < 0.2) {
      structureScore += 0.3; // Near BB extremes
    }
    
    // Recent high/low proximity
    const recentHigh = Math.max(...data.slice(-20).map(d => d.high));
    const recentLow = Math.min(...data.slice(-20).map(d => d.low));
    
    if (Math.abs(currentPrice - recentHigh) / currentPrice < 0.005) {
      structureScore += 0.2; // Near recent high
    }
    
    if (Math.abs(currentPrice - recentLow) / currentPrice < 0.005) {
      structureScore += 0.2; // Near recent low
    }
    
    return Math.min(1, structureScore);
  }
  
  private updateBreakoutHistory(symbol: string, data: PriceData[], analysis: SqueezeAnalysis): void {
    if (analysis.preBreakoutScore < 0.7) return; // Only significant breakouts
    
    const history = this.breakoutHistory.get(symbol)!;
    const currentPrice = data[data.length - 1].close;
    const timestamp = data[data.length - 1].timestamp;
    
    history.push({
      price: currentPrice,
      direction: analysis.breakoutDirection,
      timestamp
    });
    
    // Keep only recent history
    if (history.length > 50) {
      history.shift();
    }
  }
  
  generateSqueezeAlert(symbol: string, analysis: SqueezeAnalysis, timeframe: string): SqueezeAlert | null {
    let alertType: SqueezeAlert['type'] | null = null;
    let confidence = 0;
    
    if (analysis.isSqueezing && analysis.squeezeIntensity > 0.7) {
      alertType = 'SQUEEZE_FORMING';
      confidence = analysis.squeezeIntensity;
    } else if (analysis.preBreakoutScore > 0.8) {
      alertType = 'PRE_BREAKOUT';
      confidence = analysis.preBreakoutScore;
    } else if (analysis.preBreakoutScore > 0.9 && analysis.structureBreak > 0.5) {
      alertType = 'BREAKOUT_IMMINENT';
      confidence = (analysis.preBreakoutScore + analysis.structureBreak) / 2;
    }
    
    if (!alertType) return null;
    
    return {
      symbol,
      type: alertType,
      score: analysis.preBreakoutScore,
      direction: analysis.breakoutDirection > 0 ? 'UP' : 
                 analysis.breakoutDirection < 0 ? 'DOWN' : 'BOTH',
      target: analysis.breakoutTarget,
      confidence,
      timeframe,
      createdAt: new Date()
    };
  }
  
  private getDefaultAnalysis(): SqueezeAnalysis {
    return {
      isSqueezing: false,
      squeezeIntensity: 0,
      squeezeDuration: 0,
      preBreakoutScore: 0,
      breakoutDirection: 0,
      breakoutTarget: 0,
      volCompressionRatio: 1,
      energyBuildUp: 0,
      bbSqueeze: false,
      keltnerSqueeze: false,
      donchianSqueeze: false,
      volumeConfirmation: 0,
      momentumAlignment: 0,
      structureBreak: 0
    };
  }
  
  private mean(values: number[]): number {
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }
  
  private standardDeviation(values: number[]): number {
    if (values.length < 2) return 0;
    const avg = this.mean(values);
    const squaredDiffs = values.map(value => Math.pow(value - avg, 2));
    return Math.sqrt(this.mean(squaredDiffs));
  }
}

// Singleton instance
export const squeezeDetector = new SqueezeDetector();
