// BTC/ETH lead-lag analysis and correlation tracking
import { PriceData, TechnicalFeatures } from './features';
import { MarketRegime } from './regimes';

export interface LeadLagAnalysis {
  // BTC correlation and beta
  btcCorrelation: number;     // [-1, 1] correlation with BTC
  btcBeta: number;           // Beta coefficient vs BTC
  btcLeadLag: number;        // Lead(-)/Lag(+) in minutes
  
  // ETH correlation and beta  
  ethCorrelation: number;     // [-1, 1] correlation with ETH
  ethBeta: number;           // Beta coefficient vs ETH
  ethLeadLag: number;        // Lead(-)/Lag(+) in minutes
  
  // Market leadership analysis
  dominantLead: 'BTC' | 'ETH' | 'BOTH' | 'NONE';
  leadStrength: number;      // [0, 1] how strong is the lead
  
  // Regime synchronization
  btcRegimeSync: number;     // [0, 1] regime alignment with BTC
  ethRegimeSync: number;     // [0, 1] regime alignment with ETH
  
  // Risk indicators
  riskOnOff: number;         // [-1, 1] risk-on(+) vs risk-off(-) sentiment
  divergenceRisk: number;    // [0, 1] risk from correlation breakdown
  
  // Momentum analysis
  btcMomentumAlign: number;  // [-1, 1] momentum alignment with BTC
  ethMomentumAlign: number;  // [-1, 1] momentum alignment with ETH
}

export interface LeadAssetData {
  symbol: string;
  data: PriceData[];
  features: TechnicalFeatures;
  regime: MarketRegime;
}

export class LeadLagAnalyzer {
  private correlationWindow = 50;
  private leadLagWindow = 20;
  private btcHistory: number[] = [];
  private ethHistory: number[] = [];
  private priceHistory: Map<string, number[]> = new Map();
  
  constructor() {}
  
  analyzeLead(
    symbol: string,
    symbolData: PriceData[],
    symbolFeatures: TechnicalFeatures,
    symbolRegime: MarketRegime,
    btcData: LeadAssetData,
    ethData: LeadAssetData
  ): LeadLagAnalysis {
    
    if (symbolData.length < this.correlationWindow || 
        btcData.data.length < this.correlationWindow || 
        ethData.data.length < this.correlationWindow) {
      return this.getDefaultAnalysis();
    }
    
    // Update price histories
    this.updatePriceHistory(symbol, symbolData.map(d => d.close));
    this.updatePriceHistory('BTC', btcData.data.map(d => d.close));
    this.updatePriceHistory('ETH', ethData.data.map(d => d.close));
    
    // Calculate returns for correlation analysis
    const symbolReturns = this.calculateReturns(symbolData.map(d => d.close));
    const btcReturns = this.calculateReturns(btcData.data.map(d => d.close));
    const ethReturns = this.calculateReturns(ethData.data.map(d => d.close));
    
    // BTC analysis
    const btcCorrelation = this.calculateCorrelation(symbolReturns, btcReturns);
    const btcBeta = this.calculateBeta(symbolReturns, btcReturns);
    const btcLeadLag = this.calculateLeadLag(symbolData, btcData.data);
    
    // ETH analysis
    const ethCorrelation = this.calculateCorrelation(symbolReturns, ethReturns);
    const ethBeta = this.calculateBeta(symbolReturns, ethReturns);
    const ethLeadLag = this.calculateLeadLag(symbolData, ethData.data);
    
    // Leadership analysis
    const leadAnalysis = this.analyzeDominantLead(
      btcCorrelation, ethCorrelation, btcLeadLag, ethLeadLag
    );
    
    // Regime synchronization
    const btcRegimeSync = this.calculateRegimeSync(symbolRegime, btcData.regime);
    const ethRegimeSync = this.calculateRegimeSync(symbolRegime, ethData.regime);
    
    // Risk-on/off analysis
    const riskOnOff = this.calculateRiskSentiment(
      btcData.features, ethData.features, symbolFeatures
    );
    
    // Divergence risk
    const divergenceRisk = this.calculateDivergenceRisk(
      btcCorrelation, ethCorrelation, symbolReturns, btcReturns, ethReturns
    );
    
    // Momentum alignment
    const btcMomentumAlign = this.calculateMomentumAlignment(
      symbolFeatures, btcData.features
    );
    const ethMomentumAlign = this.calculateMomentumAlignment(
      symbolFeatures, ethData.features
    );
    
    const analysis: LeadLagAnalysis = {
      btcCorrelation,
      btcBeta,
      btcLeadLag,
      ethCorrelation,
      ethBeta,
      ethLeadLag,
      dominantLead: leadAnalysis.dominantLead,
      leadStrength: leadAnalysis.leadStrength,
      btcRegimeSync,
      ethRegimeSync,
      riskOnOff,
      divergenceRisk,
      btcMomentumAlign,
      ethMomentumAlign
    };
    
    console.log(`🔗 Lead-Lag ${symbol}: BTC β=${btcBeta.toFixed(2)} ETH β=${ethBeta.toFixed(2)} Risk=${riskOnOff.toFixed(2)}`);
    
    return analysis;
  }
  
  private updatePriceHistory(symbol: string, prices: number[]): void {
    if (!this.priceHistory.has(symbol)) {
      this.priceHistory.set(symbol, []);
    }
    
    const history = this.priceHistory.get(symbol)!;
    history.push(...prices.slice(-1)); // Add only the latest price
    
    // Keep only recent history
    if (history.length > this.correlationWindow * 2) {
      this.priceHistory.set(symbol, history.slice(-this.correlationWindow * 2));
    }
  }
  
  private calculateReturns(prices: number[]): number[] {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      if (prices[i-1] !== 0) {
        returns.push((prices[i] - prices[i-1]) / prices[i-1]);
      }
    }
    return returns;
  }
  
  private calculateCorrelation(x: number[], y: number[]): number {
    const minLength = Math.min(x.length, y.length);
    if (minLength < 10) return 0;
    
    const xSlice = x.slice(-minLength);
    const ySlice = y.slice(-minLength);
    
    const meanX = this.mean(xSlice);
    const meanY = this.mean(ySlice);
    
    let numerator = 0;
    let sumXSquared = 0;
    let sumYSquared = 0;
    
    for (let i = 0; i < minLength; i++) {
      const xDiff = xSlice[i] - meanX;
      const yDiff = ySlice[i] - meanY;
      
      numerator += xDiff * yDiff;
      sumXSquared += xDiff * xDiff;
      sumYSquared += yDiff * yDiff;
    }
    
    const denominator = Math.sqrt(sumXSquared * sumYSquared);
    return denominator !== 0 ? numerator / denominator : 0;
  }
  
  private calculateBeta(symbolReturns: number[], marketReturns: number[]): number {
    const correlation = this.calculateCorrelation(symbolReturns, marketReturns);
    const symbolStd = this.standardDeviation(symbolReturns);
    const marketStd = this.standardDeviation(marketReturns);
    
    if (marketStd === 0) return 0;
    return correlation * (symbolStd / marketStd);
  }
  
  private calculateLeadLag(symbolData: PriceData[], leadData: PriceData[]): number {
    // Simplified lead-lag calculation using cross-correlation
    const symbolPrices = symbolData.slice(-this.leadLagWindow).map(d => d.close);
    const leadPrices = leadData.slice(-this.leadLagWindow).map(d => d.close);
    
    const symbolReturns = this.calculateReturns(symbolPrices);
    const leadReturns = this.calculateReturns(leadPrices);
    
    if (symbolReturns.length < 5 || leadReturns.length < 5) return 0;
    
    let maxCorr = 0;
    let bestLag = 0;
    
    // Test lags from -5 to +5 periods
    for (let lag = -5; lag <= 5; lag++) {
      const corr = this.calculateLaggedCorrelation(symbolReturns, leadReturns, lag);
      if (Math.abs(corr) > Math.abs(maxCorr)) {
        maxCorr = corr;
        bestLag = lag;
      }
    }
    
    return bestLag; // Negative = symbol leads, Positive = symbol lags
  }
  
  private calculateLaggedCorrelation(x: number[], y: number[], lag: number): number {
    if (lag === 0) return this.calculateCorrelation(x, y);
    
    let xSeries, ySeries;
    
    if (lag > 0) {
      // x lags y by 'lag' periods
      xSeries = x.slice(lag);
      ySeries = y.slice(0, -lag);
    } else {
      // x leads y by |lag| periods
      xSeries = x.slice(0, lag);
      ySeries = y.slice(-lag);
    }
    
    return this.calculateCorrelation(xSeries, ySeries);
  }
  
  private analyzeDominantLead(
    btcCorr: number, ethCorr: number, btcLag: number, ethLag: number
  ): { dominantLead: 'BTC' | 'ETH' | 'BOTH' | 'NONE'; leadStrength: number } {
    
    const btcInfluence = Math.abs(btcCorr) * (btcLag < 0 ? 1.5 : 1); // Boost if BTC leads
    const ethInfluence = Math.abs(ethCorr) * (ethLag < 0 ? 1.5 : 1); // Boost if ETH leads
    
    const threshold = 0.1;
    
    if (btcInfluence > ethInfluence + threshold) {
      return { dominantLead: 'BTC', leadStrength: btcInfluence };
    } else if (ethInfluence > btcInfluence + threshold) {
      return { dominantLead: 'ETH', leadStrength: ethInfluence };
    } else if (Math.min(btcInfluence, ethInfluence) > 0.3) {
      return { dominantLead: 'BOTH', leadStrength: (btcInfluence + ethInfluence) / 2 };
    }
    
    return { dominantLead: 'NONE', leadStrength: 0 };
  }
  
  private calculateRegimeSync(symbolRegime: MarketRegime, leadRegime: MarketRegime): number {
    // Perfect sync = 1, opposite regimes = 0
    if (symbolRegime === leadRegime) return 1;
    
    // Partial sync for related regimes
    const regimeMap: Record<MarketRegime, number> = {
      'trend': 1,
      'range': 2,
      'squeeze': 2.5,
      'shock': 3
    };
    
    const symbolScore = regimeMap[symbolRegime];
    const leadScore = regimeMap[leadRegime];
    const distance = Math.abs(symbolScore - leadScore);
    
    return Math.max(0, 1 - distance / 2);
  }
  
  private calculateRiskSentiment(
    btcFeatures: TechnicalFeatures,
    ethFeatures: TechnicalFeatures,
    symbolFeatures: TechnicalFeatures
  ): number {
    
    // Risk-on indicators: rising prices, lower volatility, positive momentum
    let riskScore = 0;
    
    // BTC momentum (weight: 40%)
    if (btcFeatures.emaRatio > 1.01) riskScore += 0.4;
    else if (btcFeatures.emaRatio < 0.99) riskScore -= 0.4;
    
    // ETH momentum (weight: 30%)
    if (ethFeatures.emaRatio > 1.01) riskScore += 0.3;
    else if (ethFeatures.emaRatio < 0.99) riskScore -= 0.3;
    
    // Volatility environment (weight: 20%)
    const avgVol = (btcFeatures.volatilityScore + ethFeatures.volatilityScore) / 2;
    if (avgVol < 0.3) riskScore += 0.2; // Low vol = risk-on
    else if (avgVol > 0.7) riskScore -= 0.2; // High vol = risk-off
    
    // Symbol alignment (weight: 10%)
    if (symbolFeatures.momentumScore > 0.5) riskScore += 0.1;
    else if (symbolFeatures.momentumScore < -0.5) riskScore -= 0.1;
    
    return Math.max(-1, Math.min(1, riskScore));
  }
  
  private calculateDivergenceRisk(
    btcCorr: number, ethCorr: number, 
    symbolReturns: number[], btcReturns: number[], ethReturns: number[]
  ): number {
    
    // Historical correlation vs current correlation
    const historicalBtcCorr = this.calculateRollingCorrelation(
      symbolReturns.slice(0, -10), btcReturns.slice(0, -10)
    );
    const recentBtcCorr = this.calculateRollingCorrelation(
      symbolReturns.slice(-10), btcReturns.slice(-10)
    );
    
    const btcCorrChange = Math.abs(recentBtcCorr - historicalBtcCorr);
    
    const historicalEthCorr = this.calculateRollingCorrelation(
      symbolReturns.slice(0, -10), ethReturns.slice(0, -10)
    );
    const recentEthCorr = this.calculateRollingCorrelation(
      symbolReturns.slice(-10), ethReturns.slice(-10)
    );
    
    const ethCorrChange = Math.abs(recentEthCorr - historicalEthCorr);
    
    // Average correlation breakdown
    const avgCorrChange = (btcCorrChange + ethCorrChange) / 2;
    
    return Math.min(1, avgCorrChange * 2); // Scale to [0, 1]
  }
  
  private calculateRollingCorrelation(x: number[], y: number[]): number {
    return x.length >= 5 && y.length >= 5 ? this.calculateCorrelation(x, y) : 0;
  }
  
  private calculateMomentumAlignment(
    symbolFeatures: TechnicalFeatures, 
    leadFeatures: TechnicalFeatures
  ): number {
    
    // Compare momentum directions
    const symbolMomentum = symbolFeatures.momentumScore;
    const leadMomentum = leadFeatures.momentumScore;
    
    // Same direction = positive alignment
    if ((symbolMomentum > 0 && leadMomentum > 0) || (symbolMomentum < 0 && leadMomentum < 0)) {
      return Math.min(Math.abs(symbolMomentum), Math.abs(leadMomentum));
    }
    
    // Opposite direction = negative alignment
    return -Math.min(Math.abs(symbolMomentum), Math.abs(leadMomentum));
  }
  
  private getDefaultAnalysis(): LeadLagAnalysis {
    return {
      btcCorrelation: 0,
      btcBeta: 0,
      btcLeadLag: 0,
      ethCorrelation: 0,
      ethBeta: 0,
      ethLeadLag: 0,
      dominantLead: 'NONE',
      leadStrength: 0,
      btcRegimeSync: 0.5,
      ethRegimeSync: 0.5,
      riskOnOff: 0,
      divergenceRisk: 0,
      btcMomentumAlign: 0,
      ethMomentumAlign: 0
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
export const leadLagAnalyzer = new LeadLagAnalyzer();
