// AI Composite Signal Service
export class AISignalService {
  private signals: Map<string, number> = new Map();

  // Technical Analysis Signals
  calculateTechnicalSignal(klines: any[]): number {
    if (!klines || klines.length < 20) return 0;
    
    // Simple RSI-based signal
    const closes = klines.map(k => parseFloat(k[4]));
    const rsi = this.calculateRSI(closes, 14);
    
    if (rsi > 70) return -30; // Overbought
    if (rsi < 30) return 30;  // Oversold
    return 0;
  }

  // Order Flow Signals
  calculateOrderFlowSignal(orderBook: any): number {
    if (!orderBook || !orderBook.bids || !orderBook.asks) return 0;
    
    const bidVolume = orderBook.bids.reduce((sum: number, bid: any) => sum + parseFloat(bid[1]), 0);
    const askVolume = orderBook.asks.reduce((sum: number, ask: any) => sum + parseFloat(ask[1]), 0);
    
    const ratio = bidVolume / (bidVolume + askVolume);
    return (ratio - 0.5) * 40; // -20 to +20 range
  }

  // News Sentiment Signal
  calculateNewsSignal(): number {
    // Mock news sentiment
    return Math.random() * 20 - 10; // -10 to +10
  }

  // Machine Learning Features
  calculateMLFeatures(data: any): number {
    // Mock ML model prediction
    return Math.random() * 30 - 15; // -15 to +15
  }

  // Composite Signal Calculation
  calculateCompositeSignal(symbol: string, marketData: any): number {
    const weights = {
      technical: 0.3,
      orderFlow: 0.25,
      news: 0.2,
      ml: 0.25,
    };

    const technicalSignal = this.calculateTechnicalSignal(marketData.klines);
    const orderFlowSignal = this.calculateOrderFlowSignal(marketData.orderBook);
    const newsSignal = this.calculateNewsSignal();
    const mlSignal = this.calculateMLFeatures(marketData);

    const composite = 
      technicalSignal * weights.technical +
      orderFlowSignal * weights.orderFlow +
      newsSignal * weights.news +
      mlSignal * weights.ml;

    // Clamp to [-100, +100]
    const clampedSignal = Math.max(-100, Math.min(100, composite));
    
    this.signals.set(symbol, clampedSignal);
    return clampedSignal;
  }

  // RSI Helper
  private calculateRSI(prices: number[], period: number): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change >= 0) gains += change;
      else losses -= change;
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  getSignal(symbol: string): number {
    return this.signals.get(symbol) || 0;
  }
}

// Risk Management Service
export class RiskService {
  private maxDailyLoss: number;
  private maxSingleTrade: number;
  private killSwitch: boolean;

  constructor() {
    this.maxDailyLoss = parseFloat(process.env.MAX_DAILY_LOSS_USD || '500');
    this.maxSingleTrade = parseFloat(process.env.MAX_SINGLE_TRADE_RISK_PCT || '1.0');
    this.killSwitch = process.env.GLOBAL_KILL_SWITCH === 'true';
  }

  // Pre-trade risk check
  checkTradeRisk(trade: any): { allowed: boolean; reason?: string } {
    if (this.killSwitch) {
      return { allowed: false, reason: 'Global kill switch activated' };
    }

    const tradeRisk = Math.abs(trade.price * trade.quantity);
    if (tradeRisk > this.maxSingleTrade * 100) {
      return { allowed: false, reason: 'Trade size exceeds maximum risk limit' };
    }

    return { allowed: true };
  }

  // Calculate VaR (Value at Risk)
  calculateVaR(positions: any[], confidenceLevel: number = 0.95): number {
    // Simplified VaR calculation
    const totalValue = positions.reduce((sum, pos) => sum + Math.abs(pos.value), 0);
    return totalValue * 0.02 * 2.33; // 95% confidence, 2% daily volatility
  }

  // Stress testing
  runStressTest(positions: any[], shockScenarios: any[]): any {
    return {
      scenarios: [
        { name: 'Market Crash -20%', pnl: -1000 },
        { name: 'Volatility Spike +50%', pnl: -500 },
        { name: 'Flash Crash -10%', pnl: -300 },
      ]
    };
  }
}

// Policy Engine for Bot Trading
export class PolicyEngine {
  private riskService: RiskService;

  constructor(riskService: RiskService) {
    this.riskService = riskService;
  }

  // Bot decision logic
  shouldTrade(signal: number, mode: string, marketConditions: any): { 
    action: 'buy' | 'sell' | 'hold'; 
    confidence: number; 
    reason: string 
  } {
    // Signal thresholds
    const buyThreshold = 50;
    const sellThreshold = -50;

    if (mode === 'off') {
      return { action: 'hold', confidence: 0, reason: 'Bot is disabled' };
    }

    if (Math.abs(signal) < 30) {
      return { action: 'hold', confidence: Math.abs(signal), reason: 'Signal too weak' };
    }

    if (signal > buyThreshold) {
      return { 
        action: 'buy', 
        confidence: signal, 
        reason: `Strong buy signal: ${signal.toFixed(1)}` 
      };
    }

    if (signal < sellThreshold) {
      return { 
        action: 'sell', 
        confidence: Math.abs(signal), 
        reason: `Strong sell signal: ${signal.toFixed(1)}` 
      };
    }

    return { action: 'hold', confidence: 0, reason: 'No clear signal' };
  }
}
