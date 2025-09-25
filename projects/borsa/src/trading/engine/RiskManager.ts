// Advanced Risk Management System for borsa.ailydian.com
import { EventEmitter } from 'events';
import { TradingConfig, RISK_LIMITS } from '../config';
import { TradeSignal } from './AITradingEngine';

export interface RiskProfile {
  maxDailyLoss: number; // %
  maxWeeklyLoss: number; // %
  maxDrawdown: number; // %
  maxRiskPerTrade: number; // %
  maxConcurrentTrades: number;
  maxPositionSize: number; // % of portfolio
  maxLeverage: number;
  volatilityThreshold: number; // Above this, reduce position sizes
  correlationLimit: number; // Max correlation between positions
}

export interface RiskMetrics {
  currentDrawdown: number; // %
  dailyLoss: number; // %
  weeklyLoss: number; // %
  monthlyLoss: number; // %
  totalPnL: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdownPeriod: number; // days
  winRate: number; // %
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  kellyCriterion: number; // Optimal position sizing
}

export interface RiskAssessment {
  approved: boolean;
  reason: string;
  riskScore: number; // 0-10 (10 = maximum risk)
  recommendedPositionSize?: number;
  warnings: string[];
}

export interface PositionRisk {
  symbol: string;
  currentValue: number;
  portfolioPercent: number;
  leverageUsed: number;
  unrealizedPnL: number;
  riskScore: number;
  stopLossDistance: number;
  correlatedSymbols: string[];
}

// Market regime detector
class MarketRegimeDetector {
  private regimes = ['BULL', 'BEAR', 'VOLATILE', 'SIDEWAYS', 'CRISIS'];
  private indicators: Map<string, number> = new Map();
  
  updateIndicator(name: string, value: number): void {
    this.indicators.set(name, value);
  }
  
  detectRegime(marketData: any): string {
    const vix = this.indicators.get('VIX') || 20;
    const trendStrength = this.indicators.get('TREND_STRENGTH') || 0;
    const volatility = this.calculateVolatility(marketData);
    
    // Crisis detection
    if (vix > 40 || volatility > 0.05) {
      return 'CRISIS';
    }
    
    // High volatility
    if (vix > 25 || volatility > 0.03) {
      return 'VOLATILE';
    }
    
    // Trend detection
    if (trendStrength > 0.6) {
      return 'BULL';
    } else if (trendStrength < -0.6) {
      return 'BEAR';
    }
    
    return 'SIDEWAYS';
  }
  
  private calculateVolatility(marketData: any): number {
    if (!marketData || !marketData.prices || marketData.prices.length < 20) {
      return 0.02; // Default volatility
    }
    
    const returns = [];
    for (let i = 1; i < marketData.prices.length; i++) {
      returns.push(Math.log(marketData.prices[i] / marketData.prices[i - 1]));
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance * 252); // Annualized volatility
  }
}

// Position sizing calculator
class PositionSizer {
  calculateKellyOptimal(winRate: number, avgWin: number, avgLoss: number): number {
    if (avgLoss === 0) return 0;
    
    const winLossRatio = avgWin / Math.abs(avgLoss);
    const kelly = (winRate * winLossRatio - (1 - winRate)) / winLossRatio;
    
    // Cap Kelly at 25% for safety
    return Math.max(0, Math.min(0.25, kelly));
  }
  
  calculateVolatilityAdjusted(baseSize: number, currentVol: number, targetVol: number = 0.15): number {
    if (currentVol === 0) return baseSize;
    
    const volAdjustment = Math.sqrt(targetVol / currentVol);
    return baseSize * Math.min(2, Math.max(0.1, volAdjustment)); // Cap between 10% and 200%
  }
  
  calculateFixedFractional(portfolioValue: number, riskPercent: number, stopDistance: number): number {
    if (stopDistance === 0) return 0;
    
    const riskAmount = portfolioValue * (riskPercent / 100);
    return riskAmount / stopDistance;
  }
}

// Correlation calculator
class CorrelationCalculator {
  private priceHistory: Map<string, number[]> = new Map();
  private maxHistory = 100;
  
  addPrice(symbol: string, price: number): void {
    if (!this.priceHistory.has(symbol)) {
      this.priceHistory.set(symbol, []);
    }
    
    const history = this.priceHistory.get(symbol)!;
    history.push(price);
    
    if (history.length > this.maxHistory) {
      history.shift();
    }
  }
  
  calculateCorrelation(symbol1: string, symbol2: string): number {
    const prices1 = this.priceHistory.get(symbol1);
    const prices2 = this.priceHistory.get(symbol2);
    
    if (!prices1 || !prices2 || prices1.length < 20 || prices2.length < 20) {
      return 0;
    }
    
    const returns1 = this.calculateReturns(prices1);
    const returns2 = this.calculateReturns(prices2);
    
    const minLength = Math.min(returns1.length, returns2.length);
    const r1 = returns1.slice(-minLength);
    const r2 = returns2.slice(-minLength);
    
    return this.pearsonCorrelation(r1, r2);
  }
  
  private calculateReturns(prices: number[]): number[] {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }
    return returns;
  }
  
  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n !== y.length || n === 0) return 0;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
}

export class RiskManager extends EventEmitter {
  private config: TradingConfig;
  private riskProfile: RiskProfile;
  private currentMetrics: RiskMetrics;
  private positions: Map<string, PositionRisk> = new Map();
  private tradeHistory: any[] = [];
  private portfolioValue: number = 0;
  private dailyPnL: number = 0;
  private weeklyPnL: number = 0;
  private monthlyPnL: number = 0;
  private lastResetDate: Date = new Date();
  
  // Risk calculation components
  private regimeDetector: MarketRegimeDetector;
  private positionSizer: PositionSizer;
  private correlationCalc: CorrelationCalculator;
  
  // Emergency stop triggers
  private emergencyStopTriggered: boolean = false;
  private consecutiveLosses: number = 0;
  private maxConsecutiveLosses: number = 5;
  
  constructor(config: TradingConfig) {
    super();
    this.config = config;
    
    // Initialize risk profile
    this.riskProfile = {
      maxDailyLoss: config.maxDailyLoss || 5,
      maxWeeklyLoss: 10,
      maxDrawdown: config.maxDrawdown || 15,
      maxRiskPerTrade: config.maxRiskPerTrade || 2,
      maxConcurrentTrades: config.maxConcurrentTrades || 10,
      maxPositionSize: RISK_LIMITS.MAX_POSITION_SIZE * 100,
      maxLeverage: RISK_LIMITS.MAX_LEVERAGE,
      volatilityThreshold: 0.03,
      correlationLimit: 0.7
    };
    
    // Initialize metrics
    this.currentMetrics = {
      currentDrawdown: 0,
      dailyLoss: 0,
      weeklyLoss: 0,
      monthlyLoss: 0,
      totalPnL: 0,
      volatility: 0,
      sharpeRatio: 0,
      maxDrawdownPeriod: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      kellyCriterion: 0
    };
    
    this.regimeDetector = new MarketRegimeDetector();
    this.positionSizer = new PositionSizer();
    this.correlationCalc = new CorrelationCalculator();
    
    // Update portfolio value periodically
    this.updatePortfolioValue();
  }
  
  async validateTrade(signal: TradeSignal): Promise<RiskAssessment> {
    const warnings: string[] = [];
    let riskScore = 0;
    let approved = true;
    let reason = 'Trade approved';
    
    try {
      // 1. Check if emergency stop is active
      if (this.emergencyStopTriggered) {
        return {
          approved: false,
          reason: 'Emergency stop is active',
          riskScore: 10,
          warnings: ['Emergency stop active - all trading suspended']
        };
      }
      
      // 2. Check daily loss limits
      if (Math.abs(this.dailyPnL) >= this.portfolioValue * (this.riskProfile.maxDailyLoss / 100)) {
        return {
          approved: false,
          reason: 'Daily loss limit reached',
          riskScore: 10,
          warnings: [`Daily loss: ${this.dailyPnL.toFixed(2)}$`]
        };
      }
      
      // 3. Check maximum concurrent trades
      if (this.positions.size >= this.riskProfile.maxConcurrentTrades) {
        return {
          approved: false,
          reason: 'Maximum concurrent trades reached',
          riskScore: 8,
          warnings: [`Active positions: ${this.positions.size}/${this.riskProfile.maxConcurrentTrades}`]
        };
      }
      
      // 4. Check position size limits
      const positionValue = signal.quantity * signal.price;
      const positionPercent = (positionValue / this.portfolioValue) * 100;
      
      if (positionPercent > this.riskProfile.maxPositionSize) {
        warnings.push(`Position size ${positionPercent.toFixed(2)}% exceeds limit ${this.riskProfile.maxPositionSize}%`);
        riskScore += 2;
      }
      
      // 5. Check correlation with existing positions
      const correlationRisk = await this.checkCorrelationRisk(signal.symbol);
      if (correlationRisk > this.riskProfile.correlationLimit) {
        warnings.push(`High correlation (${correlationRisk.toFixed(2)}) with existing positions`);
        riskScore += 1;
      }
      
      // 6. Check market regime
      const regime = this.regimeDetector.detectRegime({});
      if (regime === 'CRISIS' || regime === 'VOLATILE') {
        warnings.push(`Market regime: ${regime} - increased risk`);
        riskScore += 2;
        
        if (regime === 'CRISIS') {
          return {
            approved: false,
            reason: 'Crisis market conditions detected',
            riskScore: 9,
            warnings
          };
        }
      }
      
      // 7. Check AI signal quality
      if (signal.confidence < this.config.modelConfidenceThreshold) {
        warnings.push(`Low AI confidence: ${(signal.confidence * 100).toFixed(1)}%`);
        riskScore += 1;
      }
      
      // 8. Check consecutive losses
      if (this.consecutiveLosses >= this.maxConsecutiveLosses) {
        warnings.push(`${this.consecutiveLosses} consecutive losses - reducing risk`);
        riskScore += 2;
      }
      
      // 9. Volatility check
      const volatility = this.calculateSymbolVolatility(signal.symbol);
      if (volatility > this.riskProfile.volatilityThreshold) {
        warnings.push(`High volatility: ${(volatility * 100).toFixed(2)}%`);
        riskScore += 1;
      }
      
      // 10. Check drawdown limits
      if (this.currentMetrics.currentDrawdown >= this.riskProfile.maxDrawdown) {
        return {
          approved: false,
          reason: `Maximum drawdown reached: ${this.currentMetrics.currentDrawdown.toFixed(2)}%`,
          riskScore: 10,
          warnings
        };
      }
      
      // Calculate recommended position size
      const recommendedSize = this.calculateOptimalPositionSize(signal, riskScore);
      
      // Final approval decision
      if (riskScore >= 7) {
        approved = false;
        reason = `Risk score too high: ${riskScore}/10`;
      } else if (riskScore >= 5) {
        warnings.push('Medium risk level - position size reduced');
      }
      
      return {
        approved,
        reason,
        riskScore,
        recommendedPositionSize: recommendedSize,
        warnings
      };
      
    } catch (error) {
      console.error('Risk validation error:', error);
      return {
        approved: false,
        reason: 'Risk calculation error',
        riskScore: 10,
        warnings: ['Error in risk assessment']
      };
    }
  }
  
  calculateRiskScore(symbol: string, positionSize: number): number {
    let score = 0;
    
    // Position size risk (0-3 points)
    const positionPercent = (positionSize / this.portfolioValue) * 100;
    if (positionPercent > this.riskProfile.maxPositionSize) score += 3;
    else if (positionPercent > this.riskProfile.maxPositionSize * 0.7) score += 2;
    else if (positionPercent > this.riskProfile.maxPositionSize * 0.5) score += 1;
    
    // Volatility risk (0-2 points)
    const volatility = this.calculateSymbolVolatility(symbol);
    if (volatility > this.riskProfile.volatilityThreshold) score += 2;
    else if (volatility > this.riskProfile.volatilityThreshold * 0.7) score += 1;
    
    // Correlation risk (0-2 points)
    // This would be calculated in validateTrade for performance
    
    // Drawdown risk (0-3 points)
    if (this.currentMetrics.currentDrawdown > this.riskProfile.maxDrawdown * 0.8) score += 3;
    else if (this.currentMetrics.currentDrawdown > this.riskProfile.maxDrawdown * 0.6) score += 2;
    else if (this.currentMetrics.currentDrawdown > this.riskProfile.maxDrawdown * 0.4) score += 1;
    
    return Math.min(10, score);
  }
  
  private async checkCorrelationRisk(symbol: string): Promise<number> {
    let maxCorrelation = 0;
    
    for (const [positionSymbol] of this.positions) {
      if (positionSymbol !== symbol) {
        const correlation = Math.abs(this.correlationCalc.calculateCorrelation(symbol, positionSymbol));
        maxCorrelation = Math.max(maxCorrelation, correlation);
      }
    }
    
    return maxCorrelation;
  }
  
  private calculateOptimalPositionSize(signal: TradeSignal, riskScore: number): number {
    // Base position size from signal
    let optimalSize = signal.quantity;
    
    // Adjust for risk score
    const riskMultiplier = Math.max(0.1, 1 - (riskScore / 10));
    optimalSize *= riskMultiplier;
    
    // Kelly criterion adjustment
    if (this.currentMetrics.kellyCriterion > 0) {
      const kellySize = this.portfolioValue * this.currentMetrics.kellyCriterion / signal.price;
      optimalSize = Math.min(optimalSize, kellySize);
    }
    
    // Volatility adjustment
    const volatility = this.calculateSymbolVolatility(signal.symbol);
    const volatilityAdjustedSize = this.positionSizer.calculateVolatilityAdjusted(
      optimalSize,
      volatility,
      0.15 // Target 15% volatility
    );
    
    // Position size limits
    const maxPositionValue = this.portfolioValue * (this.riskProfile.maxPositionSize / 100);
    const maxSize = maxPositionValue / signal.price;
    
    return Math.min(volatilityAdjustedSize, maxSize);
  }
  
  private calculateSymbolVolatility(symbol: string): number {
    // Simplified volatility calculation - in production, use real market data
    const baseVolatilities: Record<string, number> = {
      'BTC/USDT': 0.04,
      'ETH/USDT': 0.045,
      'AAPL': 0.02,
      'TSLA': 0.035,
      'MSFT': 0.018
    };
    
    return baseVolatilities[symbol] || 0.025;
  }
  
  async updatePosition(symbol: string, positionData: any): Promise<void> {
    const position: PositionRisk = {
      symbol,
      currentValue: positionData.value || 0,
      portfolioPercent: (positionData.value / this.portfolioValue) * 100,
      leverageUsed: positionData.leverage || 1,
      unrealizedPnL: positionData.unrealizedPnL || 0,
      riskScore: this.calculateRiskScore(symbol, positionData.value),
      stopLossDistance: Math.abs((positionData.price - positionData.stopLoss) / positionData.price) || 0.02,
      correlatedSymbols: await this.findCorrelatedSymbols(symbol)
    };
    
    this.positions.set(symbol, position);
    
    // Update correlation data
    this.correlationCalc.addPrice(symbol, positionData.price);
    
    // Check if position triggers risk alerts
    if (position.riskScore >= 7) {
      this.emit('riskAlert', {
        severity: 'HIGH',
        message: `High risk position: ${symbol} (Risk Score: ${position.riskScore}/10)`,
        symbol,
        position
      });
    }
  }
  
  private async findCorrelatedSymbols(symbol: string): Promise<string[]> {
    const correlatedSymbols: string[] = [];
    
    for (const [otherSymbol] of this.positions) {
      if (otherSymbol !== symbol) {
        const correlation = Math.abs(this.correlationCalc.calculateCorrelation(symbol, otherSymbol));
        if (correlation > 0.5) {
          correlatedSymbols.push(`${otherSymbol}(${correlation.toFixed(2)})`);
        }
      }
    }
    
    return correlatedSymbols;
  }
  
  async recordTrade(tradeResult: any): Promise<void> {
    this.tradeHistory.push({
      ...tradeResult,
      timestamp: new Date()
    });
    
    // Update PnL tracking
    const pnl = tradeResult.pnl || 0;
    this.dailyPnL += pnl;
    this.weeklyPnL += pnl;
    this.monthlyPnL += pnl;
    this.currentMetrics.totalPnL += pnl;
    
    // Track consecutive losses
    if (pnl < 0) {
      this.consecutiveLosses++;
    } else {
      this.consecutiveLosses = 0;
    }
    
    // Update metrics
    await this.updateRiskMetrics();
    
    // Check for risk alerts
    await this.checkRiskLimits();
    
    // Remove completed position
    if (tradeResult.symbol && tradeResult.status === 'closed') {
      this.positions.delete(tradeResult.symbol);
    }
  }
  
  private async updateRiskMetrics(): Promise<void> {
    if (this.tradeHistory.length === 0) return;
    
    const trades = this.tradeHistory;
    const profits = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl < 0);
    
    // Win rate
    this.currentMetrics.winRate = (profits.length / trades.length) * 100;
    
    // Average win/loss
    this.currentMetrics.avgWin = profits.length > 0 
      ? profits.reduce((sum, t) => sum + t.pnl, 0) / profits.length 
      : 0;
    this.currentMetrics.avgLoss = losses.length > 0 
      ? losses.reduce((sum, t) => sum + Math.abs(t.pnl), 0) / losses.length 
      : 0;
    
    // Profit factor
    const totalProfit = profits.reduce((sum, t) => sum + t.pnl, 0);
    const totalLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
    this.currentMetrics.profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;
    
    // Kelly criterion
    if (this.currentMetrics.avgLoss > 0) {
      this.currentMetrics.kellyCriterion = this.positionSizer.calculateKellyOptimal(
        this.currentMetrics.winRate / 100,
        this.currentMetrics.avgWin,
        this.currentMetrics.avgLoss
      );
    }
    
    // Drawdown calculation
    this.calculateDrawdown();
  }
  
  private calculateDrawdown(): void {
    if (this.tradeHistory.length < 2) return;
    
    let peak = 0;
    let maxDrawdown = 0;
    let currentDrawdown = 0;
    let runningPnL = 0;
    
    for (const trade of this.tradeHistory) {
      runningPnL += trade.pnl;
      
      if (runningPnL > peak) {
        peak = runningPnL;
        currentDrawdown = 0;
      } else {
        currentDrawdown = ((peak - runningPnL) / Math.max(peak, this.portfolioValue)) * 100;
        maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
      }
    }
    
    this.currentMetrics.currentDrawdown = currentDrawdown;
    if (maxDrawdown > this.currentMetrics.currentDrawdown) {
      // We're at a new drawdown high
    }
  }
  
  private async checkRiskLimits(): Promise<void> {
    // Daily loss check
    const dailyLossPercent = Math.abs(this.dailyPnL / this.portfolioValue) * 100;
    if (dailyLossPercent >= this.riskProfile.maxDailyLoss) {
      this.emit('riskAlert', {
        severity: 'CRITICAL',
        message: `Daily loss limit reached: ${dailyLossPercent.toFixed(2)}%`,
        limit: this.riskProfile.maxDailyLoss
      });
    }
    
    // Drawdown check
    if (this.currentMetrics.currentDrawdown >= this.riskProfile.maxDrawdown * 0.8) {
      this.emit('riskAlert', {
        severity: 'HIGH',
        message: `Approaching maximum drawdown: ${this.currentMetrics.currentDrawdown.toFixed(2)}%`,
        limit: this.riskProfile.maxDrawdown
      });
    }
    
    // Emergency stop conditions
    if (dailyLossPercent >= RISK_LIMITS.EMERGENCY_STOP_LOSS * 100 || 
        this.currentMetrics.currentDrawdown >= RISK_LIMITS.EMERGENCY_STOP_LOSS * 100 ||
        this.consecutiveLosses >= this.maxConsecutiveLosses) {
      
      this.triggerEmergencyStop(`Critical risk conditions met`);
    }
  }
  
  public triggerEmergencyStop(reason: string): void {
    this.emergencyStopTriggered = true;
    
    this.emit('emergencyStop', reason);
    
    console.error(`🚨 EMERGENCY STOP TRIGGERED: ${reason}`);
    console.error(`📊 Current Metrics:`, {
      drawdown: `${this.currentMetrics.currentDrawdown.toFixed(2)}%`,
      dailyLoss: `${(Math.abs(this.dailyPnL / this.portfolioValue) * 100).toFixed(2)}%`,
      consecutiveLosses: this.consecutiveLosses,
      totalPnL: this.currentMetrics.totalPnL
    });
  }
  
  public resetEmergencyStop(): void {
    this.emergencyStopTriggered = false;
    this.consecutiveLosses = 0;
    console.log('🔄 Emergency stop reset');
  }
  
  public startMonitoring(): void {
    // Reset daily/weekly/monthly PnL at appropriate intervals
    setInterval(() => {
      const now = new Date();
      const lastReset = new Date(this.lastResetDate);
      
      // Reset daily at midnight
      if (now.getDate() !== lastReset.getDate()) {
        this.dailyPnL = 0;
        console.log('📅 Daily PnL reset');
      }
      
      // Reset weekly on Sunday
      if (now.getDay() === 0 && lastReset.getDay() !== 0) {
        this.weeklyPnL = 0;
        console.log('📅 Weekly PnL reset');
      }
      
      // Reset monthly
      if (now.getMonth() !== lastReset.getMonth()) {
        this.monthlyPnL = 0;
        console.log('📅 Monthly PnL reset');
      }
      
      this.lastResetDate = now;
    }, 60000); // Check every minute
    
    // Portfolio value update
    setInterval(() => {
      this.updatePortfolioValue();
    }, 30000); // Update every 30 seconds
    
    console.log('🛡️ Risk monitoring started');
  }
  
  public stopMonitoring(): void {
    console.log('🛡️ Risk monitoring stopped');
  }
  
  private async updatePortfolioValue(): Promise<void> {
    // In production, this would fetch real portfolio value from exchanges
    // For now, simulate based on positions
    let totalValue = 100000; // Base value
    
    for (const position of this.positions.values()) {
      totalValue += position.unrealizedPnL;
    }
    
    this.portfolioValue = totalValue + this.currentMetrics.totalPnL;
  }
  
  // Public API methods
  public getRiskMetrics(): RiskMetrics {
    return { ...this.currentMetrics };
  }
  
  public getRiskProfile(): RiskProfile {
    return { ...this.riskProfile };
  }
  
  public updateRiskProfile(newProfile: Partial<RiskProfile>): void {
    this.riskProfile = { ...this.riskProfile, ...newProfile };
    this.emit('riskProfileUpdated', this.riskProfile);
  }
  
  public getPositionRisks(): PositionRisk[] {
    return Array.from(this.positions.values());
  }
  
  public getPortfolioValue(): number {
    return this.portfolioValue;
  }
  
  public isEmergencyStopActive(): boolean {
    return this.emergencyStopTriggered;
  }
  
  public getTradeHistory(limit: number = 100): any[] {
    return this.tradeHistory.slice(-limit);
  }
  
  public generateRiskReport(): any {
    return {
      timestamp: new Date(),
      portfolioValue: this.portfolioValue,
      riskProfile: this.riskProfile,
      currentMetrics: this.currentMetrics,
      positions: Array.from(this.positions.values()),
      emergencyStop: this.emergencyStopTriggered,
      recentTrades: this.tradeHistory.slice(-10),
      recommendations: this.generateRecommendations()
    };
  }
  
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.currentMetrics.winRate < 50) {
      recommendations.push('Consider reviewing trading strategies - win rate below 50%');
    }
    
    if (this.currentMetrics.currentDrawdown > this.riskProfile.maxDrawdown * 0.5) {
      recommendations.push('High drawdown detected - consider reducing position sizes');
    }
    
    if (this.consecutiveLosses >= 3) {
      recommendations.push('Multiple consecutive losses - consider pausing trading');
    }
    
    if (this.positions.size >= this.riskProfile.maxConcurrentTrades * 0.8) {
      recommendations.push('Approaching maximum position limit - be selective with new trades');
    }
    
    return recommendations;
  }
}

export default RiskManager;