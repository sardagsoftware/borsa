// Advanced Risk Management AI with Dynamic Position Sizing
import { EventEmitter } from 'events';

export interface RiskParameters {
  maxAccountRisk: number; // Maximum account risk per trade (%)
  maxPortfolioHeat: number; // Maximum portfolio heat (%)
  maxDrawdown: number; // Maximum allowed drawdown (%)
  maxPositionSize: number; // Maximum position size per asset (%)
  maxCorrelatedRisk: number; // Maximum risk in correlated assets (%)
  riskFreeRate: number; // Risk-free rate for calculations (%)
  confidenceLevel: number; // VaR confidence level (0.95, 0.99)
}

export interface PortfolioPosition {
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  weight: number; // Portfolio weight
  beta: number; // Beta to market
  volatility: number; // Annualized volatility
  correlation: { [symbol: string]: number };
}

export interface RiskMetrics {
  portfolioValue: number;
  totalPnL: number;
  unrealizedPnL: number;
  realizedPnL: number;
  accountEquity: number;
  
  // VaR metrics
  portfolioVaR: {
    oneDay: number;
    fiveDay: number;
    tenDay: number;
  };
  
  // Drawdown metrics
  currentDrawdown: number;
  maxDrawdown: number;
  drawdownDuration: number;
  
  // Portfolio metrics
  portfolioVolatility: number;
  portfolioBeta: number;
  sharpeRatio: number;
  sortino: number;
  calmarRatio: number;
  
  // Risk ratios
  riskUtilization: number; // Used risk / Max risk
  concentrationRisk: number;
  correlationRisk: number;
  
  // Position sizing
  maxPositionSize: number;
  recommendedPositionSize: { [symbol: string]: number };
}

export interface MonteCarloScenario {
  scenario: number;
  portfolioValue: number;
  portfolioReturn: number;
  maxDrawdown: number;
  positions: { [symbol: string]: number };
}

export interface KellyResult {
  symbol: string;
  kellyPercentage: number;
  fractionalKelly: number; // Reduced Kelly for practical use
  winRate: number;
  avgWin: number;
  avgLoss: number;
  expectedValue: number;
  confidence: number;
}

export interface RiskAlert {
  type: 'position_size' | 'portfolio_heat' | 'drawdown' | 'var_breach' | 'correlation' | 'volatility';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  symbol?: string;
  currentValue: number;
  threshold: number;
  recommendation: string;
  timestamp: number;
}

export class RiskManagementAI extends EventEmitter {
  private riskParams: RiskParameters;
  private portfolio: Map<string, PortfolioPosition> = new Map();
  private historicalReturns: Map<string, number[]> = new Map();
  private correlationMatrix: Map<string, Map<string, number>> = new Map();
  private riskAlerts: RiskAlert[] = [];
  private equityCurve: number[] = [];

  constructor(riskParams: RiskParameters) {
    super();
    this.riskParams = riskParams;
    this.initializeRiskManagement();
  }

  private initializeRiskManagement() {
    // Initialize with default portfolio tracking
    this.equityCurve = [100000]; // Starting with $100k
    
    // Start periodic risk assessment
    setInterval(() => {
      this.assessPortfolioRisk();
    }, 60000); // Every minute
  }

  // Update portfolio positions
  public updatePosition(position: PortfolioPosition) {
    this.portfolio.set(position.symbol, position);
    this.calculatePortfolioMetrics();
    this.assessRisks();
  }

  // Remove position from portfolio
  public removePosition(symbol: string) {
    this.portfolio.delete(symbol);
    this.calculatePortfolioMetrics();
  }

  // Dynamic position sizing using multiple methodologies
  public calculateOptimalPositionSize(
    symbol: string,
    entryPrice: number,
    stopLoss: number,
    signal: number, // AI signal strength (-100 to +100)
    confidence: number // AI confidence (0 to 1)
  ): {
    kellySize: number;
    varSize: number;
    volatilitySize: number;
    recommendedSize: number;
    reasoning: string[];
  } {
    
    const reasoning: string[] = [];
    
    // 1. Kelly Criterion sizing
    const kellyData = this.calculateKellyCriterion(symbol);
    const kellySize = kellyData ? kellyData.fractionalKelly * Math.abs(signal) / 100 * confidence : 0;
    reasoning.push(`Kelly sizing: ${(kellySize * 100).toFixed(2)}% (Win rate: ${kellyData?.winRate?.toFixed(1)}%)`);
    
    // 2. VaR-based sizing
    const portfolioValue = this.getPortfolioValue();
    const riskAmount = portfolioValue * this.riskParams.maxAccountRisk / 100;
    const priceRisk = Math.abs(entryPrice - stopLoss) / entryPrice;
    const varSize = riskAmount / (portfolioValue * priceRisk);
    reasoning.push(`VaR sizing: ${(varSize * 100).toFixed(2)}% (Risk: $${riskAmount.toFixed(0)})`);
    
    // 3. Volatility-adjusted sizing
    const volatility = this.getAssetVolatility(symbol);
    const targetVolatility = 0.15; // 15% target
    const volatilitySize = Math.min(
      this.riskParams.maxPositionSize / 100,
      targetVolatility / volatility * 0.1 // Base 10% position
    );
    reasoning.push(`Volatility sizing: ${(volatilitySize * 100).toFixed(2)}% (Vol: ${(volatility * 100).toFixed(1)}%)`);
    
    // 4. Correlation-adjusted sizing
    const correlationAdjustment = this.calculateCorrelationAdjustment(symbol);
    reasoning.push(`Correlation adjustment: ${(correlationAdjustment * 100).toFixed(1)}%`);
    
    // 5. Market regime adjustment
    const regimeAdjustment = this.calculateRegimeAdjustment();
    reasoning.push(`Market regime adjustment: ${(regimeAdjustment * 100).toFixed(1)}%`);
    
    // Combine all methods with dynamic weighting
    const weights = {
      kelly: 0.3,
      var: 0.4,
      volatility: 0.3,
    };
    
    let recommendedSize = (
      kellySize * weights.kelly +
      varSize * weights.var +
      volatilitySize * weights.volatility
    );
    
    // Apply adjustments
    recommendedSize *= correlationAdjustment;
    recommendedSize *= regimeAdjustment;
    
    // Apply safety limits
    recommendedSize = Math.min(recommendedSize, this.riskParams.maxPositionSize / 100);
    recommendedSize = Math.max(recommendedSize, 0.001); // Minimum 0.1%
    
    reasoning.push(`Final recommended size: ${(recommendedSize * 100).toFixed(2)}%`);
    
    return {
      kellySize,
      varSize,
      volatilitySize,
      recommendedSize,
      reasoning,
    };
  }

  // Monte Carlo risk simulation
  public runMonteCarloSimulation(
    timeHorizon: number = 30, // days
    scenarios: number = 10000
  ): {
    scenarios: MonteCarloScenario[];
    statistics: {
      meanReturn: number;
      medianReturn: number;
      stdReturn: number;
      var95: number;
      var99: number;
      expectedShortfall: number;
      probabilityOfLoss: number;
      maxDrawdown: number;
    };
  } {
    
    const currentValue = this.getPortfolioValue();
    const positions = Array.from(this.portfolio.values());
    const simulationResults: MonteCarloScenario[] = [];
    
    for (let i = 0; i < scenarios; i++) {
      const scenario = this.simulatePriceScenario(positions, timeHorizon);
      simulationResults.push({
        scenario: i + 1,
        portfolioValue: scenario.finalValue,
        portfolioReturn: (scenario.finalValue - currentValue) / currentValue,
        maxDrawdown: scenario.maxDrawdown,
        positions: scenario.positions,
      });
    }
    
    // Calculate statistics
    const returns = simulationResults.map(s => s.portfolioReturn);
    returns.sort((a, b) => a - b);
    
    const statistics = {
      meanReturn: this.mean(returns),
      medianReturn: this.median(returns),
      stdReturn: this.standardDeviation(returns),
      var95: returns[Math.floor(scenarios * 0.05)],
      var99: returns[Math.floor(scenarios * 0.01)],
      expectedShortfall: this.mean(returns.slice(0, Math.floor(scenarios * 0.05))),
      probabilityOfLoss: returns.filter(r => r < 0).length / scenarios,
      maxDrawdown: Math.max(...simulationResults.map(s => s.maxDrawdown)),
    };
    
    return { scenarios: simulationResults, statistics };
  }

  // Calculate portfolio VaR using parametric method
  public calculateVaR(
    confidenceLevel: number = 0.95,
    timeHorizon: number = 1
  ): {
    parametricVaR: number;
    historicalVaR: number;
    monteCarloVaR: number;
    expectedShortfall: number;
  } {
    
    const portfolioValue = this.getPortfolioValue();
    const portfolioVolatility = this.calculatePortfolioVolatility();
    const positions = Array.from(this.portfolio.values());
    
    // 1. Parametric VaR (assumes normal distribution)
    const zScore = this.getZScore(confidenceLevel);
    const parametricVaR = portfolioValue * portfolioVolatility * zScore * Math.sqrt(timeHorizon);
    
    // 2. Historical VaR
    const historicalReturns = this.getPortfolioHistoricalReturns(250); // Last 250 days
    historicalReturns.sort((a, b) => a - b);
    const historicalIndex = Math.floor((1 - confidenceLevel) * historicalReturns.length);
    const historicalVaR = Math.abs(historicalReturns[historicalIndex] * portfolioValue);
    
    // 3. Monte Carlo VaR (simplified)
    const mcSimulation = this.runMonteCarloSimulation(timeHorizon, 1000);
    const var95Index = Math.floor(0.05 * mcSimulation.scenarios.length);
    const monteCarloVaR = Math.abs(mcSimulation.statistics.var95 * portfolioValue);
    
    // Expected Shortfall (average loss beyond VaR)
    const tailLosses = historicalReturns.slice(0, historicalIndex);
    const expectedShortfall = Math.abs(this.mean(tailLosses) * portfolioValue);
    
    return {
      parametricVaR,
      historicalVaR,
      monteCarloVaR,
      expectedShortfall,
    };
  }

  // Adaptive stop-loss calculation
  public calculateAdaptiveStopLoss(
    symbol: string,
    entryPrice: number,
    side: 'long' | 'short',
    volatilityLookback: number = 20
  ): {
    atrStop: number;
    volatilityStop: number;
    trendStop: number;
    dynamicStop: number;
    reasoning: string;
  } {
    
    const historicalData = this.getHistoricalPrices(symbol, volatilityLookback);
    const currentVolatility = this.calculateATR(historicalData);
    const trend = this.calculateTrend(historicalData);
    
    // 1. ATR-based stop
    const atrMultiplier = 2.0; // 2x ATR
    const atrStop = side === 'long'
      ? entryPrice - (currentVolatility * atrMultiplier)
      : entryPrice + (currentVolatility * atrMultiplier);
    
    // 2. Volatility-based stop (2 standard deviations)
    const returns = this.calculateReturns(historicalData);
    const volatility = this.standardDeviation(returns);
    const volatilityStop = side === 'long'
      ? entryPrice * (1 - 2 * volatility)
      : entryPrice * (1 + 2 * volatility);
    
    // 3. Trend-following stop
    const trendMultiplier = Math.abs(trend) > 0.02 ? 1.5 : 2.5; // Tighter stops in trending markets
    const trendStop = side === 'long'
      ? entryPrice - (currentVolatility * trendMultiplier)
      : entryPrice + (currentVolatility * trendMultiplier);
    
    // 4. Dynamic stop (weighted combination)
    const marketRegime = this.detectMarketRegime(historicalData);
    let weights: { atr: number; volatility: number; trend: number };
    
    switch (marketRegime) {
      case 'trending':
        weights = { atr: 0.2, volatility: 0.3, trend: 0.5 };
        break;
      case 'ranging':
        weights = { atr: 0.4, volatility: 0.4, trend: 0.2 };
        break;
      case 'volatile':
        weights = { atr: 0.3, volatility: 0.5, trend: 0.2 };
        break;
      default:
        weights = { atr: 0.33, volatility: 0.33, trend: 0.34 };
    }
    
    const dynamicStop = 
      atrStop * weights.atr +
      volatilityStop * weights.volatility +
      trendStop * weights.trend;
    
    const reasoning = `Market regime: ${marketRegime}. Using ${Object.entries(weights)
      .map(([key, value]) => `${key}: ${(value * 100).toFixed(0)}%`)
      .join(', ')}`;
    
    return {
      atrStop,
      volatilityStop,
      trendStop,
      dynamicStop,
      reasoning,
    };
  }

  // Real-time risk assessment
  private assessPortfolioRisk() {
    const alerts: RiskAlert[] = [];
    const metrics = this.calculatePortfolioMetrics();
    
    // Check position concentration
    this.portfolio.forEach((position, symbol) => {
      if (position.weight > this.riskParams.maxPositionSize / 100) {
        alerts.push({
          type: 'position_size',
          severity: 'warning',
          message: `Position size exceeds limit`,
          symbol,
          currentValue: position.weight * 100,
          threshold: this.riskParams.maxPositionSize,
          recommendation: `Reduce position size to ${this.riskParams.maxPositionSize}%`,
          timestamp: Date.now(),
        });
      }
    });
    
    // Check portfolio heat
    if (metrics.riskUtilization > 0.8) {
      alerts.push({
        type: 'portfolio_heat',
        severity: metrics.riskUtilization > 0.95 ? 'critical' : 'warning',
        message: 'Portfolio risk utilization is high',
        currentValue: metrics.riskUtilization * 100,
        threshold: 80,
        recommendation: 'Consider reducing overall position sizes',
        timestamp: Date.now(),
      });
    }
    
    // Check drawdown
    if (metrics.currentDrawdown > this.riskParams.maxDrawdown / 100) {
      alerts.push({
        type: 'drawdown',
        severity: 'critical',
        message: 'Maximum drawdown exceeded',
        currentValue: metrics.currentDrawdown * 100,
        threshold: this.riskParams.maxDrawdown,
        recommendation: 'Stop trading and review risk parameters',
        timestamp: Date.now(),
      });
    }
    
    // Check VaR breach
    const varData = this.calculateVaR();
    const dailyVaRLimit = this.getPortfolioValue() * 0.02; // 2% daily VaR limit
    if (varData.parametricVaR > dailyVaRLimit) {
      alerts.push({
        type: 'var_breach',
        severity: 'warning',
        message: 'VaR limit exceeded',
        currentValue: varData.parametricVaR,
        threshold: dailyVaRLimit,
        recommendation: 'Reduce portfolio volatility',
        timestamp: Date.now(),
      });
    }
    
    // Emit alerts
    alerts.forEach(alert => {
      this.riskAlerts.push(alert);
      this.emit('riskAlert', alert);
    });
    
    // Keep only last 1000 alerts
    if (this.riskAlerts.length > 1000) {
      this.riskAlerts = this.riskAlerts.slice(-1000);
    }
  }

  // Calculate comprehensive portfolio metrics
  private calculatePortfolioMetrics(): RiskMetrics {
    const portfolioValue = this.getPortfolioValue();
    const positions = Array.from(this.portfolio.values());
    
    const totalPnL = positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);
    const portfolioVolatility = this.calculatePortfolioVolatility();
    const portfolioBeta = this.calculatePortfolioBeta();
    
    // Calculate drawdown
    this.equityCurve.push(portfolioValue);
    const peak = Math.max(...this.equityCurve);
    const currentDrawdown = (peak - portfolioValue) / peak;
    const maxDrawdown = this.calculateMaxDrawdown();
    
    // Calculate risk ratios
    const riskFreeReturn = this.riskParams.riskFreeRate / 252; // Daily risk-free rate
    const excessReturn = this.calculateExcessReturn();
    const sharpeRatio = excessReturn / portfolioVolatility;
    const downSideDeviation = this.calculateDownsideDeviation();
    const sortino = excessReturn / downSideDeviation;
    const calmarRatio = excessReturn / maxDrawdown;
    
    // VaR calculations
    const varData = this.calculateVaR();
    
    const metrics: RiskMetrics = {
      portfolioValue,
      totalPnL,
      unrealizedPnL: totalPnL,
      realizedPnL: 0, // Would track this separately
      accountEquity: portfolioValue,
      
      portfolioVaR: {
        oneDay: varData.parametricVaR,
        fiveDay: varData.parametricVaR * Math.sqrt(5),
        tenDay: varData.parametricVaR * Math.sqrt(10),
      },
      
      currentDrawdown,
      maxDrawdown,
      drawdownDuration: this.calculateDrawdownDuration(),
      
      portfolioVolatility,
      portfolioBeta,
      sharpeRatio,
      sortino,
      calmarRatio,
      
      riskUtilization: this.calculateRiskUtilization(),
      concentrationRisk: this.calculateConcentrationRisk(),
      correlationRisk: this.calculateCorrelationRisk(),
      
      maxPositionSize: this.riskParams.maxPositionSize,
      recommendedPositionSize: this.calculateRecommendedSizes(),
    };
    
    return metrics;
  }

  // Helper methods
  private calculateKellyCriterion(symbol: string): KellyResult | null {
    const returns = this.historicalReturns.get(symbol);
    if (!returns || returns.length < 30) return null;
    
    const wins = returns.filter(r => r > 0);
    const losses = returns.filter(r => r < 0);
    
    if (wins.length === 0 || losses.length === 0) return null;
    
    const winRate = wins.length / returns.length;
    const avgWin = this.mean(wins);
    const avgLoss = Math.abs(this.mean(losses));
    
    const kellyPercentage = winRate - ((1 - winRate) / (avgWin / avgLoss));
    const fractionalKelly = Math.max(0, Math.min(0.25, kellyPercentage * 0.25)); // 25% of Kelly
    
    return {
      symbol,
      kellyPercentage,
      fractionalKelly,
      winRate,
      avgWin,
      avgLoss,
      expectedValue: winRate * avgWin - (1 - winRate) * avgLoss,
      confidence: Math.min(returns.length / 100, 1), // Based on sample size
    };
  }

  private simulatePriceScenario(positions: PortfolioPosition[], timeHorizon: number) {
    const initialValue = this.getPortfolioValue();
    let currentValue = initialValue;
    let maxValue = initialValue;
    let maxDrawdown = 0;
    
    const finalPositions: { [symbol: string]: number } = {};
    
    for (const position of positions) {
      const volatility = position.volatility;
      const drift = 0.0001; // Small positive drift
      
      let price = position.currentPrice;
      for (let day = 0; day < timeHorizon; day++) {
        const randomShock = this.generateRandomNormal() * volatility / Math.sqrt(252);
        price *= Math.exp((drift - 0.5 * volatility * volatility / 252) + randomShock);
      }
      
      const newValue = position.quantity * price;
      currentValue += (newValue - position.marketValue);
      finalPositions[position.symbol] = price;
    }
    
    maxValue = Math.max(maxValue, currentValue);
    maxDrawdown = Math.max(maxDrawdown, (maxValue - currentValue) / maxValue);
    
    return {
      finalValue: currentValue,
      maxDrawdown,
      positions: finalPositions,
    };
  }

  private getAssetVolatility(symbol: string): number {
    const position = this.portfolio.get(symbol);
    if (position) return position.volatility;
    
    // Default volatility if not found
    return 0.3; // 30% annual volatility
  }

  private calculateCorrelationAdjustment(symbol: string): number {
    const correlations = this.correlationMatrix.get(symbol);
    if (!correlations) return 1.0;
    
    const existingPositions = Array.from(this.portfolio.keys());
    let totalCorrelation = 0;
    let count = 0;
    
    for (const existing of existingPositions) {
      const correlation = correlations.get(existing) || 0;
      totalCorrelation += Math.abs(correlation);
      count++;
    }
    
    const avgCorrelation = count > 0 ? totalCorrelation / count : 0;
    return Math.max(0.5, 1.0 - avgCorrelation * 0.5); // Reduce size for high correlation
  }

  private calculateRegimeAdjustment(): number {
    // Simplified market regime detection
    const recentReturns = this.getPortfolioHistoricalReturns(20);
    const volatility = this.standardDeviation(recentReturns);
    
    if (volatility > 0.03) return 0.7; // High volatility - reduce sizes
    if (volatility < 0.015) return 1.1; // Low volatility - slightly increase
    return 1.0; // Normal volatility
  }

  private getPortfolioValue(): number {
    return Array.from(this.portfolio.values())
      .reduce((sum, pos) => sum + pos.marketValue, 0);
  }

  private calculatePortfolioVolatility(): number {
    const positions = Array.from(this.portfolio.values());
    if (positions.length === 0) return 0;
    
    let portfolioVariance = 0;
    
    // Calculate portfolio variance including correlations
    for (let i = 0; i < positions.length; i++) {
      for (let j = 0; j < positions.length; j++) {
        const wi = positions[i].weight;
        const wj = positions[j].weight;
        const vi = positions[i].volatility;
        const vj = positions[j].volatility;
        
        let correlation = 1;
        if (i !== j) {
          const corrMap = this.correlationMatrix.get(positions[i].symbol);
          correlation = corrMap?.get(positions[j].symbol) || 0.3; // Default correlation
        }
        
        portfolioVariance += wi * wj * vi * vj * correlation;
      }
    }
    
    return Math.sqrt(portfolioVariance);
  }

  private calculatePortfolioBeta(): number {
    const positions = Array.from(this.portfolio.values());
    return positions.reduce((sum, pos) => sum + pos.weight * pos.beta, 0);
  }

  private calculateMaxDrawdown(): number {
    if (this.equityCurve.length < 2) return 0;
    
    let maxDrawdown = 0;
    let peak = this.equityCurve[0];
    
    for (const value of this.equityCurve) {
      if (value > peak) peak = value;
      const drawdown = (peak - value) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    
    return maxDrawdown;
  }

  private calculateExcessReturn(): number {
    if (this.equityCurve.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < this.equityCurve.length; i++) {
      returns.push((this.equityCurve[i] - this.equityCurve[i - 1]) / this.equityCurve[i - 1]);
    }
    
    const portfolioReturn = this.mean(returns);
    const riskFreeDaily = this.riskParams.riskFreeRate / 252;
    
    return portfolioReturn - riskFreeDaily;
  }

  private calculateDownsideDeviation(): number {
    if (this.equityCurve.length < 2) return 0.01;
    
    const returns = [];
    for (let i = 1; i < this.equityCurve.length; i++) {
      const ret = (this.equityCurve[i] - this.equityCurve[i - 1]) / this.equityCurve[i - 1];
      if (ret < 0) returns.push(ret);
    }
    
    return returns.length > 0 ? this.standardDeviation(returns) : 0.01;
  }

  private calculateDrawdownDuration(): number {
    // Simplified calculation - count consecutive periods below peak
    let duration = 0;
    let peak = Math.max(...this.equityCurve);
    const current = this.equityCurve[this.equityCurve.length - 1];
    
    if (current < peak) {
      // Count backwards until we reach the peak
      for (let i = this.equityCurve.length - 1; i >= 0; i--) {
        if (this.equityCurve[i] < peak) {
          duration++;
        } else {
          break;
        }
      }
    }
    
    return duration;
  }

  private calculateRiskUtilization(): number {
    const positions = Array.from(this.portfolio.values());
    const totalRisk = positions.reduce((sum, pos) => 
      sum + Math.abs(pos.weight) * pos.volatility, 0
    );
    return totalRisk / this.riskParams.maxPortfolioHeat * 100;
  }

  private calculateConcentrationRisk(): number {
    const weights = Array.from(this.portfolio.values()).map(p => Math.abs(p.weight));
    const herfindahlIndex = weights.reduce((sum, w) => sum + w * w, 0);
    return herfindahlIndex;
  }

  private calculateCorrelationRisk(): number {
    const symbols = Array.from(this.portfolio.keys());
    if (symbols.length < 2) return 0;
    
    let totalCorrelation = 0;
    let pairs = 0;
    
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        const corrMap = this.correlationMatrix.get(symbols[i]);
        const correlation = corrMap?.get(symbols[j]) || 0;
        totalCorrelation += Math.abs(correlation);
        pairs++;
      }
    }
    
    return pairs > 0 ? totalCorrelation / pairs : 0;
  }

  private calculateRecommendedSizes(): { [symbol: string]: number } {
    const sizes: { [symbol: string]: number } = {};
    
    this.portfolio.forEach((position, symbol) => {
      const sizing = this.calculateOptimalPositionSize(
        symbol,
        position.currentPrice,
        position.currentPrice * 0.95, // Assume 5% stop loss
        50, // Neutral signal
        0.7 // Medium confidence
      );
      sizes[symbol] = sizing.recommendedSize;
    });
    
    return sizes;
  }

  // Statistical helper methods
  private mean(values: number[]): number {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  private median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  private standardDeviation(values: number[]): number {
    const avg = this.mean(values);
    const squareDiffs = values.map(val => Math.pow(val - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }

  private generateRandomNormal(): number {
    // Box-Muller transformation
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  private getZScore(confidenceLevel: number): number {
    // Inverse normal distribution approximation
    const p = 1 - confidenceLevel;
    if (p <= 0.05) return 1.645; // 95%
    if (p <= 0.01) return 2.326; // 99%
    return 1.96; // Default 95%
  }

  private getPortfolioHistoricalReturns(days: number): number[] {
    // Mock implementation - in production, use actual historical data
    const returns = [];
    for (let i = 0; i < days; i++) {
      returns.push((Math.random() - 0.5) * 0.04); // ±2% daily returns
    }
    return returns;
  }

  private getHistoricalPrices(symbol: string, days: number): number[] {
    // Mock implementation
    const prices = [50000]; // Starting price
    for (let i = 1; i < days; i++) {
      const change = (Math.random() - 0.5) * 0.03;
      prices.push(prices[i - 1] * (1 + change));
    }
    return prices;
  }

  private calculateATR(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return prices[0] * 0.02; // Default 2%
    
    const trueRanges = [];
    for (let i = 1; i < prices.length; i++) {
      const high = Math.max(prices[i], prices[i - 1]);
      const low = Math.min(prices[i], prices[i - 1]);
      const tr = high - low;
      trueRanges.push(tr);
    }
    
    return this.mean(trueRanges.slice(-period));
  }

  private calculateTrend(prices: number[]): number {
    if (prices.length < 20) return 0;
    const recent = prices.slice(-10);
    const older = prices.slice(-20, -10);
    const recentAvg = this.mean(recent);
    const olderAvg = this.mean(older);
    return (recentAvg - olderAvg) / olderAvg;
  }

  private calculateReturns(prices: number[]): number[] {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    return returns;
  }

  private detectMarketRegime(prices: number[]): 'trending' | 'ranging' | 'volatile' {
    const returns = this.calculateReturns(prices);
    const volatility = this.standardDeviation(returns);
    const trend = Math.abs(this.calculateTrend(prices));
    
    if (volatility > 0.03) return 'volatile';
    if (trend > 0.02) return 'trending';
    return 'ranging';
  }

  // Public API methods
  public getRiskMetrics(): RiskMetrics {
    return this.calculatePortfolioMetrics();
  }

  public getRiskAlerts(limit: number = 50): RiskAlert[] {
    return this.riskAlerts.slice(-limit);
  }

  public updateRiskParameters(params: Partial<RiskParameters>) {
    this.riskParams = { ...this.riskParams, ...params };
    this.assessRisks();
  }

  public subscribeToRiskAlerts(callback: (alert: RiskAlert) => void) {
    this.on('riskAlert', callback);
  }

  private assessRisks() {
    this.assessPortfolioRisk();
  }
}

export const riskManagementAI = new RiskManagementAI({
  maxAccountRisk: 2, // 2% per trade
  maxPortfolioHeat: 20, // 20% total portfolio risk
  maxDrawdown: 15, // 15% max drawdown
  maxPositionSize: 10, // 10% max position size
  maxCorrelatedRisk: 30, // 30% in correlated assets
  riskFreeRate: 3, // 3% annual risk-free rate
  confidenceLevel: 0.95, // 95% confidence for VaR
});
