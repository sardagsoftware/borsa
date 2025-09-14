// Ensemble decision engine - Composite Signal [-100, +100]
import { PriceData, TechnicalFeatures } from './features';
import { MicroStructure } from './micro';
import { RegimeAnalysis } from './regimes';
import { LeadLagAnalysis } from './leadlag';
import { SqueezeAnalysis } from './squeeze';

export interface CompositeSignal {
  // Main composite score
  score: number;              // [-100, +100] final signal
  confidence: number;         // [0, 1] signal confidence
  quality: number;           // [0, 1] signal quality
  
  // Component scores
  trendScore: number;        // [-100, +100] trend following signal
  meanReversionScore: number; // [-100, +100] mean reversion signal  
  breakoutScore: number;     // [-100, +100] breakout signal
  microflowScore: number;    // [-100, +100] microstructure signal
  regimeScore: number;       // [-100, +100] regime alignment signal
  
  // Weights applied
  trendWeight: number;
  meanRevWeight: number;
  breakoutWeight: number;
  microflowWeight: number;
  regimeWeight: number;
  
  // Meta information
  dominantStrategy: string;  // Which strategy is driving the signal
  riskAdjustment: number;   // Risk-based signal reduction
  leadLagAdjustment: number; // BTC/ETH alignment adjustment
}

export interface StrategyWeights {
  trend: number;
  meanReversion: number;
  breakout: number;
  microflow: number;
  regime: number;
}

export interface EnsembleConfig {
  // Signal thresholds
  strongSignalThreshold: number;    // Default: 60
  weakSignalThreshold: number;      // Default: 40
  noTradeThreshold: number;         // Default: 20
  
  // Strategy weights (sum should = 1.0)
  baseWeights: StrategyWeights;
  
  // Regime-based weight adjustments
  trendRegimeBoost: number;         // Default: 1.2
  rangeRegimeBoost: number;         // Default: 1.1
  squeezeRegimeBoost: number;       // Default: 1.3
  shockRegimePenalty: number;       // Default: 0.5
  
  // Risk adjustments
  maxBetaRisk: number;             // Max beta before risk reduction
  correlationThreshold: number;    // Min correlation for regime sync
  volatilityPenalty: number;       // Vol spike penalty factor
}

export class EnsembleEngine {
  private config: EnsembleConfig;
  private signalHistory: Map<string, CompositeSignal[]> = new Map();
  
  constructor(config?: Partial<EnsembleConfig>) {
    this.config = {
      strongSignalThreshold: 60,
      weakSignalThreshold: 40,
      noTradeThreshold: 20,
      baseWeights: {
        trend: 0.3,
        meanReversion: 0.25,
        breakout: 0.2,
        microflow: 0.15,
        regime: 0.1
      },
      trendRegimeBoost: 1.2,
      rangeRegimeBoost: 1.1,
      squeezeRegimeBoost: 1.3,
      shockRegimePenalty: 0.5,
      maxBetaRisk: 1.5,
      correlationThreshold: 0.3,
      volatilityPenalty: 0.7,
      ...config
    };
  }
  
  generateCompositeSignal(
    symbol: string,
    data: PriceData[],
    features: TechnicalFeatures,
    micro: MicroStructure,
    regime: RegimeAnalysis,
    leadLag: LeadLagAnalysis,
    squeeze: SqueezeAnalysis
  ): CompositeSignal {
    
    // Calculate individual strategy signals
    const trendScore = this.calculateTrendSignal(features, regime);
    const meanReversionScore = this.calculateMeanReversionSignal(features, micro);
    const breakoutScore = this.calculateBreakoutSignal(squeeze, features);
    const microflowScore = this.calculateMicroflowSignal(micro);
    const regimeScore = this.calculateRegimeSignal(regime, features);
    
    // Determine strategy weights based on market conditions
    const weights = this.calculateDynamicWeights(regime, leadLag, features);
    
    // Calculate base composite score
    let compositeScore = 
      trendScore * weights.trend +
      meanReversionScore * weights.meanReversion +
      breakoutScore * weights.breakout +
      microflowScore * weights.microflow +
      regimeScore * weights.regime;
    
    // Risk adjustments
    const riskAdjustment = this.calculateRiskAdjustment(leadLag, features, regime);
    const leadLagAdjustment = this.calculateLeadLagAdjustment(leadLag);
    
    // Apply adjustments
    compositeScore *= riskAdjustment;
    compositeScore *= leadLagAdjustment;
    
    // Signal quality and confidence
    const quality = this.calculateSignalQuality(features, micro, regime);
    const confidence = this.calculateSignalConfidence(
      [trendScore, meanReversionScore, breakoutScore, microflowScore, regimeScore],
      weights,
      quality
    );
    
    // Determine dominant strategy
    const dominantStrategy = this.findDominantStrategy(
      trendScore, meanReversionScore, breakoutScore, microflowScore, regimeScore,
      weights
    );
    
    const signal: CompositeSignal = {
      score: Math.max(-100, Math.min(100, compositeScore)),
      confidence,
      quality,
      trendScore,
      meanReversionScore,
      breakoutScore,
      microflowScore,
      regimeScore,
      trendWeight: weights.trend,
      meanRevWeight: weights.meanReversion,
      breakoutWeight: weights.breakout,
      microflowWeight: weights.microflow,
      regimeWeight: weights.regime,
      dominantStrategy,
      riskAdjustment,
      leadLagAdjustment
    };
    
    // Update signal history
    this.updateSignalHistory(symbol, signal);
    
    console.log(`🎯 Signal ${symbol}: S=${signal.score.toFixed(1)} C=${(signal.confidence*100).toFixed(0)}% ${dominantStrategy}`);
    
    return signal;
  }
  
  private calculateTrendSignal(features: TechnicalFeatures, regime: RegimeAnalysis): number {
    let trendSignal = 0;
    
    // EMA alignment
    const emaRatio = features.emaRatio;
    if (emaRatio > 1.02) trendSignal += 30;
    else if (emaRatio > 1.01) trendSignal += 15;
    else if (emaRatio < 0.98) trendSignal -= 30;
    else if (emaRatio < 0.99) trendSignal -= 15;
    
    // ADX trend strength
    if (features.adx > 30) {
      trendSignal *= 1.2; // Boost in strong trends
    } else if (features.adx < 20) {
      trendSignal *= 0.7; // Reduce in weak trends
    }
    
    // MACD confirmation
    if (features.macdHistogram > 0 && trendSignal > 0) trendSignal += 10;
    else if (features.macdHistogram < 0 && trendSignal < 0) trendSignal += 10;
    else if ((features.macdHistogram > 0) !== (trendSignal > 0)) trendSignal *= 0.8;
    
    // Regime boost
    if (regime.regime === 'trend') {
      trendSignal *= this.config.trendRegimeBoost;
    }
    
    return Math.max(-100, Math.min(100, trendSignal));
  }
  
  private calculateMeanReversionSignal(features: TechnicalFeatures, micro: MicroStructure): number {
    let meanRevSignal = 0;
    
    // RSI extremes
    if (features.rsi > 70) meanRevSignal -= (features.rsi - 70) * 2;
    else if (features.rsi < 30) meanRevSignal += (30 - features.rsi) * 2;
    
    // Bollinger Band position
    if (features.bbPercentB > 0.8) meanRevSignal -= (features.bbPercentB - 0.8) * 100;
    else if (features.bbPercentB < 0.2) meanRevSignal += (0.2 - features.bbPercentB) * 100;
    
    // Stochastic extremes
    if (features.stochK > 80) meanRevSignal -= 10;
    else if (features.stochK < 20) meanRevSignal += 10;
    
    // Mean reversion momentum
    if (micro.momentumShift !== 0) {
      meanRevSignal += micro.momentumShift * 15;
    }
    
    // Volume confirmation
    if (features.volumeRatio && features.volumeRatio > 1.2) {
      meanRevSignal *= 1.1; // Volume supports mean reversion
    }
    
    return Math.max(-100, Math.min(100, meanRevSignal));
  }
  
  private calculateBreakoutSignal(squeeze: SqueezeAnalysis, features: TechnicalFeatures): number {
    let breakoutSignal = 0;
    
    // Pre-breakout score
    breakoutSignal += squeeze.preBreakoutScore * 50 * squeeze.breakoutDirection;
    
    // Squeeze intensity
    if (squeeze.isSqueezing) {
      breakoutSignal += squeeze.squeezeIntensity * 20 * squeeze.breakoutDirection;
    }
    
    // Volume confirmation
    breakoutSignal += squeeze.volumeConfirmation * 15 * squeeze.breakoutDirection;
    
    // Structure break
    breakoutSignal += squeeze.structureBreak * 10 * squeeze.breakoutDirection;
    
    // ADX building
    if (features.adxSlope > 0) {
      breakoutSignal *= 1.1;
    }
    
    return Math.max(-100, Math.min(100, breakoutSignal));
  }
  
  private calculateMicroflowSignal(micro: MicroStructure): number {
    let microSignal = 0;
    
    // Orderbook imbalance
    microSignal += micro.obImbalance * 30;
    
    // Tick direction
    microSignal += micro.tickDirection * 20;
    
    // Micro trend consistency
    if (micro.microTrendScore > 0.6) {
      microSignal += (micro.microTrendScore - 0.5) * 40;
    }
    
    // Volume profile clustering
    if (micro.volumeProfile > 0.7) {
      microSignal *= 0.9; // Reduce signal when price at VWAP
    }
    
    // Velocity adjustment
    if (micro.velocityScore > 0.5) {
      microSignal *= (1 + micro.velocityScore * 0.2); // Boost on high velocity
    }
    
    return Math.max(-100, Math.min(100, microSignal));
  }
  
  private calculateRegimeSignal(regime: RegimeAnalysis, features: TechnicalFeatures): number {
    let regimeSignal = 0;
    
    switch (regime.regime) {
      case 'trend':
        if (regime.trendDirection) {
          regimeSignal = regime.trendDirection * regime.strength * 40;
        }
        break;
        
      case 'range':
        // Fade extremes in range
        if (features.rsi > 60) regimeSignal = -20;
        else if (features.rsi < 40) regimeSignal = 20;
        break;
        
      case 'squeeze':
        // Wait for breakout direction
        regimeSignal = 0;
        break;
        
      case 'shock':
        // Reduce all signals during shock
        regimeSignal = 0;
        break;
    }
    
    // Confidence adjustment
    regimeSignal *= regime.confidence;
    
    return Math.max(-100, Math.min(100, regimeSignal));
  }
  
  private calculateDynamicWeights(
    regime: RegimeAnalysis,
    leadLag: LeadLagAnalysis,
    features: TechnicalFeatures
  ): StrategyWeights {
    
    let weights = { ...this.config.baseWeights };
    
    // Regime-based adjustments
    switch (regime.regime) {
      case 'trend':
        weights.trend *= this.config.trendRegimeBoost;
        weights.meanReversion *= 0.8;
        break;
        
      case 'range':
        weights.meanReversion *= this.config.rangeRegimeBoost;
        weights.trend *= 0.8;
        weights.breakout *= 0.9;
        break;
        
      case 'squeeze':
        weights.breakout *= this.config.squeezeRegimeBoost;
        weights.trend *= 0.7;
        weights.meanReversion *= 0.7;
        break;
        
      case 'shock':
        // Reduce all weights during shock
        Object.keys(weights).forEach(key => {
          (weights as any)[key] *= this.config.shockRegimePenalty;
        });
        break;
    }
    
    // Correlation-based adjustments
    if (Math.abs(leadLag.btcCorrelation) < this.config.correlationThreshold) {
      // Low correlation - reduce regime influence
      weights.regime *= 0.5;
      weights.microflow *= 1.2;
    }
    
    // Volatility adjustments
    if (features.volatilityScore > 0.7) {
      // High volatility - emphasize microflow and reduce trend
      weights.microflow *= 1.3;
      weights.trend *= this.config.volatilityPenalty;
    }
    
    // Normalize weights
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    Object.keys(weights).forEach(key => {
      (weights as any)[key] /= totalWeight;
    });
    
    return weights;
  }
  
  private calculateRiskAdjustment(
    leadLag: LeadLagAnalysis,
    features: TechnicalFeatures,
    regime: RegimeAnalysis
  ): number {
    
    let riskAdjustment = 1.0;
    
    // High beta risk
    const maxBeta = Math.max(Math.abs(leadLag.btcBeta), Math.abs(leadLag.ethBeta));
    if (maxBeta > this.config.maxBetaRisk) {
      riskAdjustment *= (this.config.maxBetaRisk / maxBeta);
    }
    
    // Correlation breakdown risk
    if (leadLag.divergenceRisk > 0.5) {
      riskAdjustment *= (1 - leadLag.divergenceRisk * 0.3);
    }
    
    // Volatility spike
    if (features.volatilityScore > 0.8) {
      riskAdjustment *= this.config.volatilityPenalty;
    }
    
    // Regime transition risk
    if (regime.transition > 0.7) {
      riskAdjustment *= 0.8;
    }
    
    return Math.max(0.3, riskAdjustment); // Never reduce more than 70%
  }
  
  private calculateLeadLagAdjustment(leadLag: LeadLagAnalysis): number {
    let adjustment = 1.0;
    
    // Risk-off environment
    if (leadLag.riskOnOff < -0.3) {
      adjustment *= 0.8; // Reduce signals in risk-off
    }
    
    // BTC/ETH momentum misalignment
    if (leadLag.btcMomentumAlign < -0.3 || leadLag.ethMomentumAlign < -0.3) {
      adjustment *= 0.9;
    }
    
    return adjustment;
  }
  
  private calculateSignalQuality(
    features: TechnicalFeatures,
    micro: MicroStructure,
    regime: RegimeAnalysis
  ): number {
    
    let quality = 0;
    
    // Liquidity quality (from spread)
    if (micro.spreadPct < 0.1) quality += 0.2;
    else if (micro.spreadPct > 0.3) quality -= 0.1;
    
    // Volume quality
    if (features.volumeRatio && features.volumeRatio > 0.8) quality += 0.15;
    
    // Regime clarity
    quality += regime.confidence * 0.2;
    
    // Technical alignment
    quality += features.trendStrength * 0.15;
    
    // Volatility environment
    if (features.volatilityScore > 0.2 && features.volatilityScore < 0.6) {
      quality += 0.2; // Optimal volatility range
    }
    
    // Micro structure quality
    if (micro.microTrendScore > 0.6) quality += 0.1;
    
    return Math.max(0, Math.min(1, 0.5 + quality));
  }
  
  private calculateSignalConfidence(
    scores: number[],
    weights: StrategyWeights,
    quality: number
  ): number {
    
    // Agreement between strategies
    const weightedScores = scores.map((score, i) => 
      score * Object.values(weights)[i]
    );
    
    const avgScore = weightedScores.reduce((sum, s) => sum + s, 0);
    const variance = weightedScores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length;
    
    // Lower variance = higher confidence
    const agreementConfidence = Math.max(0, 1 - variance / 1000);
    
    // Magnitude confidence
    const magnitudeConfidence = Math.min(1, Math.abs(avgScore) / 50);
    
    // Combined confidence with quality factor
    return (agreementConfidence * 0.4 + magnitudeConfidence * 0.3 + quality * 0.3);
  }
  
  private findDominantStrategy(
    trend: number, meanRev: number, breakout: number, 
    microflow: number, regime: number, weights: StrategyWeights
  ): string {
    
    const strategies = [
      { name: 'trend', score: Math.abs(trend * weights.trend) },
      { name: 'meanReversion', score: Math.abs(meanRev * weights.meanReversion) },
      { name: 'breakout', score: Math.abs(breakout * weights.breakout) },
      { name: 'microflow', score: Math.abs(microflow * weights.microflow) },
      { name: 'regime', score: Math.abs(regime * weights.regime) }
    ];
    
    strategies.sort((a, b) => b.score - a.score);
    return strategies[0].name;
  }
  
  private updateSignalHistory(symbol: string, signal: CompositeSignal): void {
    if (!this.signalHistory.has(symbol)) {
      this.signalHistory.set(symbol, []);
    }
    
    const history = this.signalHistory.get(symbol)!;
    history.push(signal);
    
    // Keep only recent history
    if (history.length > 100) {
      history.shift();
    }
  }
  
  getSignalStrength(score: number): 'STRONG' | 'WEAK' | 'NEUTRAL' {
    const absScore = Math.abs(score);
    
    if (absScore >= this.config.strongSignalThreshold) return 'STRONG';
    if (absScore >= this.config.weakSignalThreshold) return 'WEAK';
    return 'NEUTRAL';
  }
  
  shouldTrade(signal: CompositeSignal): boolean {
    return Math.abs(signal.score) >= this.config.noTradeThreshold && 
           signal.confidence >= 0.3 && 
           signal.quality >= 0.3;
  }
  
  getSignalHistory(symbol: string): CompositeSignal[] {
    return this.signalHistory.get(symbol) || [];
  }
}

// Singleton instance
export const ensembleEngine = new EnsembleEngine();
