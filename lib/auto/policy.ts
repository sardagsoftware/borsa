// Trading policy and decision engine
import { CompositeSignal } from './ensemble';
import { TechnicalFeatures } from './features';
import { RegimeAnalysis } from './regimes';
import { LeadLagAnalysis } from './leadlag';

export type TradeAction = 'LONG' | 'SHORT' | 'CLOSE' | 'HOLD';
export type BotMode = 'semi' | 'auto' | 'off';

export interface PolicyDecision {
  action: TradeAction;
  confidence: number;        // [0, 1]
  reasoning: string[];       // XAI explanations
  
  // Position sizing
  positionSize: number;      // USD amount
  leverage: number;          // Leverage multiplier
  
  // Risk management
  stopLoss: number;          // Stop loss price
  takeProfit: number[];      // Multiple TP levels
  trailStop: boolean;        // Use trailing stop
  
  // Execution parameters
  orderType: 'MARKET' | 'LIMIT' | 'STOP_LIMIT';
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  maxSlippage: number;       // Max acceptable slippage %
  
  // Timing
  timeInForce: 'GTC' | 'IOC' | 'FOK';
  cooldown: number;          // Minutes to wait before next trade
  
  // Meta
  policyVersion: string;
  appliedAt: Date;
}

export interface RiskLimits {
  maxDailyLossUsd: number;
  maxSingleTradeRiskPct: number;
  maxConcurrentPositions: number;
  maxLeverage: number;
  minOrderbookDepthUsd: number;
  maxSpreadBps: number;
}

export interface PositionInfo {
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  leverage: number;
}

export interface AccountInfo {
  balance: number;
  equity: number;
  margin: number;
  dailyPnl: number;
  positions: PositionInfo[];
}

export class PolicyEngine {
  private policyVersion = '1.0.0';
  private riskLimits: RiskLimits;
  private cooldownMap: Map<string, number> = new Map();
  
  constructor(riskLimits?: Partial<RiskLimits>) {
    this.riskLimits = {
      maxDailyLossUsd: parseFloat(process.env.MAX_DAILY_LOSS_USD || '600'),
      maxSingleTradeRiskPct: parseFloat(process.env.MAX_SINGLE_TRADE_RISK_PCT || '0.8'),
      maxConcurrentPositions: parseInt(process.env.MAX_CONCURRENT_POS || '5'),
      maxLeverage: 10,
      minOrderbookDepthUsd: parseFloat(process.env.MIN_ORDERBOOK_DEPTH_USD || '150000'),
      maxSpreadBps: parseFloat(process.env.SPREAD_MAX_BPS || '15'),
      ...riskLimits
    };
  }
  
  makeDecision(
    symbol: string,
    signal: CompositeSignal,
    features: TechnicalFeatures,
    regime: RegimeAnalysis,
    leadLag: LeadLagAnalysis,
    account: AccountInfo,
    mode: BotMode,
    currentPrice: number
  ): PolicyDecision {
    
    const reasoning: string[] = [];
    
    // Check if bot is enabled
    if (mode === 'off') {
      return this.createHoldDecision('Bot is disabled', reasoning);
    }
    
    // Check global kill switch
    if (process.env.GLOBAL_KILL_SWITCH === 'true') {
      return this.createHoldDecision('Global kill switch activated', reasoning);
    }
    
    // Check cooldown
    const cooldownEnd = this.cooldownMap.get(symbol) || 0;
    if (Date.now() < cooldownEnd) {
      return this.createHoldDecision('Symbol in cooldown period', reasoning);
    }
    
    // Risk guardrails
    const riskCheck = this.checkRiskLimits(account, symbol);
    if (!riskCheck.passed) {
      return this.createHoldDecision(riskCheck.reason, reasoning);
    }
    
    // Signal strength check
    if (Math.abs(signal.score) < 20) {
      reasoning.push('Signal too weak (< 20)');
      return this.createHoldDecision('Insufficient signal strength', reasoning);
    }
    
    // Quality and confidence filters
    if (signal.confidence < 0.3 || signal.quality < 0.3) {
      reasoning.push(`Low confidence (${(signal.confidence*100).toFixed(0)}%) or quality (${(signal.quality*100).toFixed(0)}%)`);
      return this.createHoldDecision('Signal quality insufficient', reasoning);
    }
    
    // Current position check
    const existingPosition = account.positions.find(p => p.symbol === symbol);
    
    if (existingPosition) {
      return this.handleExistingPosition(
        existingPosition, signal, features, regime, currentPrice, reasoning
      );
    }
    
    // New position logic
    return this.handleNewPosition(
      symbol, signal, features, regime, leadLag, account, currentPrice, reasoning
    );
  }
  
  private checkRiskLimits(account: AccountInfo, symbol: string): { passed: boolean; reason: string } {
    // Daily loss limit
    if (account.dailyPnl < -this.riskLimits.maxDailyLossUsd) {
      return { passed: false, reason: `Daily loss limit reached: $${account.dailyPnl.toFixed(2)}` };
    }
    
    // Maximum concurrent positions
    if (account.positions.length >= this.riskLimits.maxConcurrentPositions) {
      return { passed: false, reason: `Max concurrent positions reached: ${account.positions.length}` };
    }
    
    // Available margin
    const marginUtilization = account.margin / account.equity;
    if (marginUtilization > 0.8) {
      return { passed: false, reason: `High margin utilization: ${(marginUtilization*100).toFixed(1)}%` };
    }
    
    return { passed: true, reason: '' };
  }
  
  private handleExistingPosition(
    position: PositionInfo,
    signal: CompositeSignal,
    features: TechnicalFeatures,
    regime: RegimeAnalysis,
    currentPrice: number,
    reasoning: string[]
  ): PolicyDecision {
    
    const isLong = position.side === 'LONG';
    const signalDirection = signal.score > 0 ? 'LONG' : 'SHORT';
    const pnlPercent = position.unrealizedPnl / Math.abs(position.size) * 100;
    
    reasoning.push(`Existing ${position.side} position: ${pnlPercent.toFixed(2)}% PnL`);
    
    // Check for position exit conditions
    if (this.shouldClosePosition(position, signal, features, regime, reasoning)) {
      return {
        action: 'CLOSE',
        confidence: 0.8,
        reasoning,
        positionSize: Math.abs(position.size),
        leverage: 1,
        stopLoss: 0,
        takeProfit: [],
        trailStop: false,
        orderType: 'MARKET',
        urgency: 'HIGH',
        maxSlippage: 0.1,
        timeInForce: 'IOC',
        cooldown: this.calculateCooldown(signal, regime),
        policyVersion: this.policyVersion,
        appliedAt: new Date()
      };
    }
    
    // Position size adjustment logic could go here
    return this.createHoldDecision('Maintaining existing position', reasoning);
  }
  
  private shouldClosePosition(
    position: PositionInfo,
    signal: CompositeSignal,
    features: TechnicalFeatures,
    regime: RegimeAnalysis,
    reasoning: string[]
  ): boolean {
    
    const isLong = position.side === 'LONG';
    const signalDirection = signal.score > 0;
    const pnlPercent = position.unrealizedPnl / Math.abs(position.size) * 100;
    
    // Stop loss hit (simplified - should be checked by execution engine)
    if (pnlPercent < -2.0) {
      reasoning.push('Stop loss triggered');
      return true;
    }
    
    // Take profit hit
    if (pnlPercent > 3.0) {
      reasoning.push('Take profit target reached');
      return true;
    }
    
    // Signal reversal
    if ((isLong && signal.score < -40) || (!isLong && signal.score > 40)) {
      reasoning.push('Strong signal reversal');
      return true;
    }
    
    // Regime change risk
    if (regime.transition > 0.8) {
      reasoning.push('High regime transition probability');
      return true;
    }
    
    // Technical breakdown
    if (isLong && features.emaRatio < 0.98 && features.rsi < 40) {
      reasoning.push('Technical breakdown for long position');
      return true;
    }
    
    if (!isLong && features.emaRatio > 1.02 && features.rsi > 60) {
      reasoning.push('Technical breakdown for short position');
      return true;
    }
    
    return false;
  }
  
  private handleNewPosition(
    symbol: string,
    signal: CompositeSignal,
    features: TechnicalFeatures,
    regime: RegimeAnalysis,
    leadLag: LeadLagAnalysis,
    account: AccountInfo,
    currentPrice: number,
    reasoning: string[]
  ): PolicyDecision {
    
    const isLong = signal.score > 0;
    const action: TradeAction = isLong ? 'LONG' : 'SHORT';
    
    reasoning.push(`${signal.dominantStrategy} strategy signal: ${signal.score.toFixed(1)}`);
    reasoning.push(`Regime: ${regime.regime} (${(regime.confidence*100).toFixed(0)}% confidence)`);
    
    // Position sizing
    const positionSize = this.calculatePositionSize(
      signal, features, regime, leadLag, account, reasoning
    );
    
    // Leverage calculation
    const leverage = this.calculateLeverage(
      signal, regime, features, reasoning
    );
    
    // Risk management levels
    const stopLoss = this.calculateStopLoss(currentPrice, isLong, features, reasoning);
    const takeProfit = this.calculateTakeProfit(currentPrice, isLong, features, reasoning);
    
    // Execution parameters
    const { orderType, urgency, maxSlippage } = this.getExecutionParams(
      signal, regime, features
    );
    
    return {
      action,
      confidence: signal.confidence,
      reasoning,
      positionSize,
      leverage,
      stopLoss,
      takeProfit,
      trailStop: signal.score > 70, // Use trail stop for strong signals
      orderType,
      urgency,
      maxSlippage,
      timeInForce: 'GTC',
      cooldown: this.calculateCooldown(signal, regime),
      policyVersion: this.policyVersion,
      appliedAt: new Date()
    };
  }
  
  private calculatePositionSize(
    signal: CompositeSignal,
    features: TechnicalFeatures,
    regime: RegimeAnalysis,
    leadLag: LeadLagAnalysis,
    account: AccountInfo,
    reasoning: string[]
  ): number {
    
    // Base size from risk limit
    const maxRiskUsd = account.equity * (this.riskLimits.maxSingleTradeRiskPct / 100);
    let baseSize = maxRiskUsd;
    
    // Signal strength adjustment
    const signalStrength = Math.abs(signal.score) / 100;
    baseSize *= signalStrength;
    
    // Confidence adjustment
    baseSize *= signal.confidence;
    
    // Quality adjustment
    baseSize *= signal.quality;
    
    // Regime adjustment
    if (regime.regime === 'shock') {
      baseSize *= 0.5; // Reduce size in shock regime
      reasoning.push('Reduced position size due to shock regime');
    } else if (regime.regime === 'trend' && regime.strength > 0.7) {
      baseSize *= 1.2; // Increase size in strong trends
      reasoning.push('Increased position size due to strong trend');
    }
    
    // Lead-lag risk adjustment
    if (leadLag.divergenceRisk > 0.5) {
      baseSize *= 0.8;
      reasoning.push('Reduced size due to correlation divergence');
    }
    
    // Volatility adjustment
    if (features.volatilityScore > 0.7) {
      baseSize *= 0.7;
      reasoning.push('Reduced size due to high volatility');
    }
    
    reasoning.push(`Position size: $${baseSize.toFixed(2)}`);
    
    return Math.max(50, Math.min(maxRiskUsd, baseSize)); // Min $50, max risk limit
  }
  
  private calculateLeverage(
    signal: CompositeSignal,
    regime: RegimeAnalysis,
    features: TechnicalFeatures,
    reasoning: string[]
  ): number {
    
    let leverage = 1.0;
    
    // Base leverage from signal strength
    const signalStrength = Math.abs(signal.score) / 100;
    leverage = 1 + (signalStrength * 2); // Max 3x from signal
    
    // Regime adjustments
    if (regime.regime === 'trend' && regime.strength > 0.6) {
      leverage *= 1.3; // Boost in strong trends
    } else if (regime.regime === 'shock') {
      leverage = 1; // No leverage in shock
      reasoning.push('No leverage in shock regime');
    }
    
    // Volatility limiting
    if (features.volatilityScore > 0.6) {
      leverage = Math.min(leverage, 2);
      reasoning.push('Limited leverage due to volatility');
    }
    
    // Apply hard limit
    leverage = Math.min(leverage, this.riskLimits.maxLeverage);
    
    reasoning.push(`Leverage: ${leverage.toFixed(1)}x`);
    
    return leverage;
  }
  
  private calculateStopLoss(
    currentPrice: number,
    isLong: boolean,
    features: TechnicalFeatures,
    reasoning: string[]
  ): number {
    
    // ATR-based stop loss
    const atrMultiple = 2.0;
    const atrDistance = features.atr * atrMultiple;
    
    let stopLoss: number;
    
    if (isLong) {
      stopLoss = currentPrice - atrDistance;
      // Don't place stop below recent support
      const recentLow = currentPrice * 0.98; // Simple support approximation
      stopLoss = Math.max(stopLoss, recentLow);
    } else {
      stopLoss = currentPrice + atrDistance;
      // Don't place stop above recent resistance
      const recentHigh = currentPrice * 1.02; // Simple resistance approximation
      stopLoss = Math.min(stopLoss, recentHigh);
    }
    
    const stopDistancePct = Math.abs(stopLoss - currentPrice) / currentPrice * 100;
    reasoning.push(`Stop loss: ${stopLoss.toFixed(4)} (${stopDistancePct.toFixed(2)}% away)`);
    
    return stopLoss;
  }
  
  private calculateTakeProfit(
    currentPrice: number,
    isLong: boolean,
    features: TechnicalFeatures,
    reasoning: string[]
  ): number[] {
    
    // Multiple TP levels
    const atrMultiple1 = 1.5;
    const atrMultiple2 = 3.0;
    const atrMultiple3 = 5.0;
    
    const atrDistance1 = features.atr * atrMultiple1;
    const atrDistance2 = features.atr * atrMultiple2;
    const atrDistance3 = features.atr * atrMultiple3;
    
    let tp1: number, tp2: number, tp3: number;
    
    if (isLong) {
      tp1 = currentPrice + atrDistance1;
      tp2 = currentPrice + atrDistance2;
      tp3 = currentPrice + atrDistance3;
    } else {
      tp1 = currentPrice - atrDistance1;
      tp2 = currentPrice - atrDistance2;
      tp3 = currentPrice - atrDistance3;
    }
    
    reasoning.push(`Take profits: ${tp1.toFixed(4)}, ${tp2.toFixed(4)}, ${tp3.toFixed(4)}`);
    
    return [tp1, tp2, tp3];
  }
  
  private getExecutionParams(
    signal: CompositeSignal,
    regime: RegimeAnalysis,
    features: TechnicalFeatures
  ): {
    orderType: 'MARKET' | 'LIMIT' | 'STOP_LIMIT';
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
    maxSlippage: number;
  } {
    
    let orderType: 'MARKET' | 'LIMIT' | 'STOP_LIMIT' = 'LIMIT';
    let urgency: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    let maxSlippage = 0.05; // 5 bps default
    
    // High urgency conditions
    if (Math.abs(signal.score) > 80 || regime.regime === 'shock') {
      orderType = 'MARKET';
      urgency = 'HIGH';
      maxSlippage = 0.1; // 10 bps
    }
    
    // Low volatility = tighter execution
    if (features.volatilityScore < 0.3) {
      maxSlippage = 0.03; // 3 bps
      urgency = 'LOW';
    }
    
    return { orderType, urgency, maxSlippage };
  }
  
  private calculateCooldown(signal: CompositeSignal, regime: RegimeAnalysis): number {
    let cooldown = 30; // 30 minutes default
    
    // Longer cooldown after losses or in shock regime
    if (regime.regime === 'shock') {
      cooldown = 120; // 2 hours
    } else if (signal.confidence < 0.5) {
      cooldown = 60; // 1 hour
    }
    
    return cooldown;
  }
  
  private createHoldDecision(reason: string, reasoning: string[]): PolicyDecision {
    reasoning.push(reason);
    
    return {
      action: 'HOLD',
      confidence: 0,
      reasoning,
      positionSize: 0,
      leverage: 1,
      stopLoss: 0,
      takeProfit: [],
      trailStop: false,
      orderType: 'MARKET',
      urgency: 'LOW',
      maxSlippage: 0,
      timeInForce: 'GTC',
      cooldown: 0,
      policyVersion: this.policyVersion,
      appliedAt: new Date()
    };
  }
  
  setCooldown(symbol: string, minutes: number): void {
    this.cooldownMap.set(symbol, Date.now() + minutes * 60 * 1000);
  }
  
  updateRiskLimits(newLimits: Partial<RiskLimits>): void {
    this.riskLimits = { ...this.riskLimits, ...newLimits };
  }
  
  getRiskLimits(): RiskLimits {
    return { ...this.riskLimits };
  }
}

// Singleton instance
export const policyEngine = new PolicyEngine();
