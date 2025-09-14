// Market regime detection: trend|range|squeeze|shock
import { PriceData, TechnicalFeatures } from './features';
import { MicroStructure } from './micro';

export type MarketRegime = 'trend' | 'range' | 'squeeze' | 'shock';

export interface RegimeAnalysis {
  regime: MarketRegime;
  confidence: number;     // [0, 1] confidence in regime classification
  duration: number;       // How long in current regime (bars)
  strength: number;       // Regime strength [0, 1]
  transition: number;     // Probability of regime change [0, 1]
  
  // Regime-specific metrics
  trendDirection?: number; // For trend: 1 (up) or -1 (down)
  rangeTop?: number;      // For range: resistance level
  rangeBottom?: number;   // For range: support level
  squeezeIntensity?: number; // For squeeze: compression level
  shockMagnitude?: number;   // For shock: volatility spike size
}

export interface RegimeHistory {
  timestamp: number;
  regime: MarketRegime;
  confidence: number;
  price: number;
  volume: number;
}

export class RegimeDetector {
  private regimeHistory: RegimeHistory[] = [];
  private currentRegime: MarketRegime = 'range';
  private regimeDuration = 0;
  private lastTransition = 0;
  
  constructor(
    private lookbackPeriods = parseInt(process.env.REGIME_LOOKBACK || '1440'),
    private volLookback = parseInt(process.env.VOL_LOOKBACK || '240')
  ) {}
  
  detectRegime(
    data: PriceData[],
    features: TechnicalFeatures,
    micro: MicroStructure
  ): RegimeAnalysis {
    
    if (data.length < 50) {
      return this.getDefaultRegime();
    }
    
    // Calculate regime probabilities
    const trendProb = this.calculateTrendProbability(data, features, micro);
    const rangeProb = this.calculateRangeProbability(data, features, micro);
    const squeezeProb = this.calculateSqueezeProbability(data, features, micro);
    const shockProb = this.calculateShockProbability(data, features, micro);
    
    // Normalize probabilities
    const totalProb = trendProb + rangeProb + squeezeProb + shockProb;
    const normalizedProbs = {
      trend: trendProb / totalProb,
      range: rangeProb / totalProb,
      squeeze: squeezeProb / totalProb,
      shock: shockProb / totalProb
    };
    
    // Select most likely regime
    const maxProb = Math.max(...Object.values(normalizedProbs));
    let detectedRegime: MarketRegime = 'range';
    let confidence = maxProb;
    
    for (const [regime, prob] of Object.entries(normalizedProbs)) {
      if (prob === maxProb) {
        detectedRegime = regime as MarketRegime;
        break;
      }
    }
    
    // Apply regime persistence (avoid rapid switching)
    const persistenceAdjusted = this.applyRegimePersistence(
      detectedRegime, confidence, normalizedProbs
    );
    
    detectedRegime = persistenceAdjusted.regime;
    confidence = persistenceAdjusted.confidence;
    
    // Update regime history
    this.updateRegimeHistory(detectedRegime, confidence, data);
    
    // Calculate transition probability
    const transitionProb = this.calculateTransitionProbability(
      detectedRegime, confidence, features, micro
    );
    
    // Build detailed analysis
    const analysis: RegimeAnalysis = {
      regime: detectedRegime,
      confidence,
      duration: this.regimeDuration,
      strength: this.calculateRegimeStrength(detectedRegime, features, micro),
      transition: transitionProb
    };
    
    // Add regime-specific details
    switch (detectedRegime) {
      case 'trend':
        analysis.trendDirection = features.emaRatio > 1 ? 1 : -1;
        break;
      case 'range':
        const rangeLevels = this.calculateRangeLevels(data.slice(-100));
        analysis.rangeTop = rangeLevels.resistance;
        analysis.rangeBottom = rangeLevels.support;
        break;
      case 'squeeze':
        analysis.squeezeIntensity = features.bbSqueeze;
        break;
      case 'shock':
        analysis.shockMagnitude = micro.volBurstScore;
        break;
    }
    
    console.log(`📊 Regime: ${detectedRegime} (${(confidence * 100).toFixed(1)}% conf, ${this.regimeDuration}bars)`);
    
    return analysis;
  }
  
  private calculateTrendProbability(
    data: PriceData[], 
    features: TechnicalFeatures, 
    micro: MicroStructure
  ): number {
    let score = 0;
    
    // EMA alignment and slope
    if (features.emaRatio > 1.01 || features.emaRatio < 0.99) score += 0.3;
    
    // ADX trend strength
    if (features.adx > 25) score += 0.25;
    if (features.adxSlope > 0) score += 0.1;
    
    // Trend consistency
    score += features.trendStrength * 0.2;
    
    // Micro trend alignment
    if (micro.microTrendScore > 0.6) score += 0.15;
    
    return Math.min(1, score);
  }
  
  private calculateRangeProbability(
    data: PriceData[], 
    features: TechnicalFeatures, 
    micro: MicroStructure
  ): number {
    let score = 0;
    
    // Low ADX (weak trend)
    if (features.adx < 25) score += 0.3;
    
    // RSI mean reversion signals
    if (features.rsi > 30 && features.rsi < 70) score += 0.2;
    
    // Low volatility
    if (features.volatilityScore < 0.5) score += 0.2;
    
    // Price near moving averages
    const currentPrice = data[data.length - 1].close;
    const smaDistance = Math.abs(currentPrice - features.sma20) / features.sma20;
    if (smaDistance < 0.02) score += 0.15; // Within 2% of SMA20
    
    // Low momentum
    if (Math.abs(features.momentumScore) < 0.3) score += 0.15;
    
    return Math.min(1, score);
  }
  
  private calculateSqueezeProbability(
    data: PriceData[], 
    features: TechnicalFeatures, 
    micro: MicroStructure
  ): number {
    let score = 0;
    
    // Bollinger Band squeeze
    if (features.bbSqueeze > 0.5) score += 0.4;
    
    // Low ATR relative to historical
    if (features.atrRatio < 0.8) score += 0.2;
    
    // Decreasing volatility
    if (features.volatilityScore < 0.3) score += 0.2;
    
    // Low volume
    if (features.volumeRatio && features.volumeRatio < 0.8) score += 0.1;
    
    // Price consolidation
    const recentData = data.slice(-20);
    const priceRange = this.calculatePriceRange(recentData);
    if (priceRange < 0.02) score += 0.1; // Less than 2% range
    
    return Math.min(1, score);
  }
  
  private calculateShockProbability(
    data: PriceData[], 
    features: TechnicalFeatures, 
    micro: MicroStructure
  ): number {
    let score = 0;
    
    // Volatility burst
    if (micro.volBurstScore > 0.5) score += 0.4;
    
    // High ATR
    if (features.atrRatio > 1.5) score += 0.3;
    
    // Price jumps
    if (micro.priceJumpScore > 0.3) score += 0.2;
    
    // High volume
    if (features.volumeRatio && features.volumeRatio > 1.5) score += 0.1;
    
    return Math.min(1, score);
  }
  
  private applyRegimePersistence(
    newRegime: MarketRegime,
    newConfidence: number,
    allProbs: Record<MarketRegime, number>
  ): { regime: MarketRegime; confidence: number } {
    
    // If regime hasn't changed, increment duration
    if (newRegime === this.currentRegime) {
      this.regimeDuration++;
      return { regime: newRegime, confidence: newConfidence };
    }
    
    // For regime change, require higher confidence
    const minConfidenceForChange = 0.6;
    const confidenceGap = newConfidence - allProbs[this.currentRegime];
    
    if (newConfidence > minConfidenceForChange && confidenceGap > 0.15) {
      // Confident regime change
      this.currentRegime = newRegime;
      this.regimeDuration = 1;
      this.lastTransition = Date.now();
      return { regime: newRegime, confidence: newConfidence };
    }
    
    // Stay in current regime
    return { 
      regime: this.currentRegime, 
      confidence: allProbs[this.currentRegime] 
    };
  }
  
  private updateRegimeHistory(regime: MarketRegime, confidence: number, data: PriceData[]): void {
    const currentData = data[data.length - 1];
    
    this.regimeHistory.push({
      timestamp: currentData.timestamp,
      regime,
      confidence,
      price: currentData.close,
      volume: currentData.volume
    });
    
    // Keep only recent history
    const maxHistory = 1000;
    if (this.regimeHistory.length > maxHistory) {
      this.regimeHistory = this.regimeHistory.slice(-maxHistory);
    }
  }
  
  private calculateTransitionProbability(
    regime: MarketRegime,
    confidence: number,
    features: TechnicalFeatures,
    micro: MicroStructure
  ): number {
    
    // Base transition probability (lower confidence = higher transition probability)
    let transitionProb = 1 - confidence;
    
    // Regime duration factor
    if (this.regimeDuration < 5) {
      transitionProb += 0.2; // More likely to transition if recent regime change
    } else if (this.regimeDuration > 50) {
      transitionProb -= 0.1; // Less likely to transition if long-established regime
    }
    
    // Market structure signals
    if (micro.momentumShift !== 0) transitionProb += 0.15;
    if (micro.volBurstScore > 0.3) transitionProb += 0.1;
    
    // Technical indicator divergences
    if (Math.abs(features.rsiSlope) > 0.5) transitionProb += 0.05;
    if (Math.abs(features.macdSlope) > 0.1) transitionProb += 0.05;
    
    return Math.max(0, Math.min(1, transitionProb));
  }
  
  private calculateRegimeStrength(
    regime: MarketRegime,
    features: TechnicalFeatures,
    micro: MicroStructure
  ): number {
    
    switch (regime) {
      case 'trend':
        return Math.min(1, features.adx / 50 + features.trendStrength * 0.5);
        
      case 'range':
        // Strong range = low volatility + mean reversion signals
        const rangeStrength = (1 - features.volatilityScore) * 0.6 + 
                             features.meanReversionScore * 0.4;
        return rangeStrength;
        
      case 'squeeze':
        return features.bbSqueeze;
        
      case 'shock':
        return Math.min(1, micro.volBurstScore + micro.priceJumpScore * 0.5);
        
      default:
        return 0.5;
    }
  }
  
  private calculateRangeLevels(data: PriceData[]): { support: number; resistance: number } {
    if (data.length === 0) return { support: 0, resistance: 0 };
    
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    
    // Simple S/R calculation using recent high/low clustering
    const sortedHighs = [...highs].sort((a, b) => b - a);
    const sortedLows = [...lows].sort((a, b) => a - b);
    
    const resistance = this.findClusterLevel(sortedHighs.slice(0, 10));
    const support = this.findClusterLevel(sortedLows.slice(0, 10));
    
    return { support, resistance };
  }
  
  private findClusterLevel(prices: number[]): number {
    // Find most common price level (simplified clustering)
    const tolerance = 0.01; // 1% tolerance
    const clusters: { level: number; count: number }[] = [];
    
    for (const price of prices) {
      let foundCluster = false;
      
      for (const cluster of clusters) {
        if (Math.abs(price - cluster.level) / cluster.level < tolerance) {
          cluster.count++;
          cluster.level = (cluster.level * (cluster.count - 1) + price) / cluster.count;
          foundCluster = true;
          break;
        }
      }
      
      if (!foundCluster) {
        clusters.push({ level: price, count: 1 });
      }
    }
    
    clusters.sort((a, b) => b.count - a.count);
    return clusters[0]?.level || prices[0];
  }
  
  private calculatePriceRange(data: PriceData[]): number {
    if (data.length === 0) return 0;
    
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    
    const maxHigh = Math.max(...highs);
    const minLow = Math.min(...lows);
    const avgPrice = (maxHigh + minLow) / 2;
    
    return avgPrice > 0 ? (maxHigh - minLow) / avgPrice : 0;
  }
  
  private getDefaultRegime(): RegimeAnalysis {
    return {
      regime: 'range',
      confidence: 0.5,
      duration: 0,
      strength: 0.5,
      transition: 0.3
    };
  }
  
  getRegimeHistory(): RegimeHistory[] {
    return [...this.regimeHistory];
  }
  
  getCurrentRegime(): MarketRegime {
    return this.currentRegime;
  }
  
  getRegimeDuration(): number {
    return this.regimeDuration;
  }
}

// Singleton instance
export const regimeDetector = new RegimeDetector();
