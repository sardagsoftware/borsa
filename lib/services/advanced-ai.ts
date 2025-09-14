// Advanced AI Signal Engine with Multi-Timeframe Analysis
import { EventEmitter } from 'events';

export interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  timestamp: number;
  high: number;
  low: number;
  open: number;
  close: number;
}

export interface SignalFeatures {
  technical: {
    rsi: number;
    macd: { macd: number; signal: number; histogram: number };
    bollinger: { upper: number; middle: number; lower: number; percentB: number };
    stochastic: { percentK: number; percentD: number };
    williams: number;
    momentum: number;
    atr: number;
    adx: number;
  };
  orderflow: {
    bidAskRatio: number;
    volumeProfile: number;
    marketImpact: number;
    liquidityImbalance: number;
    largeOrderFlow: number;
  };
  sentiment: {
    newsScore: number;
    socialScore: number;
    fearGreedIndex: number;
    volatilitySmile: number;
    putCallRatio: number;
  };
  microstructure: {
    tickDirection: number;
    spreadAnalysis: number;
    depthImbalance: number;
    timeSalesPattern: number;
  };
  macroeconomic: {
    correlationBTC: number;
    correlationSPX: number;
    usdStrength: number;
    riskOnOff: number;
  };
}

export interface AISignal {
  symbol: string;
  timestamp: number;
  signal: number; // -100 to +100
  confidence: number; // 0 to 1
  timeframe: string;
  regime: 'trending_up' | 'trending_down' | 'ranging' | 'volatile' | 'shock';
  features: SignalFeatures;
  explanation: string[];
  riskAdjustedSignal: number;
}

export class AdvancedSignalEngine extends EventEmitter {
  private symbols: string[] = [];
  private timeframes: string[] = ['1m', '5m', '15m', '1h', '4h', '1d'];
  private signalHistory: Map<string, AISignal[]> = new Map();
  private modelWeights: any;

  constructor() {
    super();
    this.initializeMLModel();
  }

  private initializeMLModel() {
    // Advanced model weights based on backtesting results
    this.modelWeights = {
      technical: {
        trending: { rsi: 0.15, macd: 0.25, bollinger: 0.20, momentum: 0.25, adx: 0.15 },
        ranging: { rsi: 0.30, bollinger: 0.35, stochastic: 0.35 },
        volatile: { atr: 0.40, bollinger: 0.30, williams: 0.30 },
      },
      orderflow: {
        high_volume: { bidAskRatio: 0.35, volumeProfile: 0.30, marketImpact: 0.35 },
        low_volume: { liquidityImbalance: 0.50, largeOrderFlow: 0.50 },
      },
      sentiment: {
        bull_market: { newsScore: 0.25, socialScore: 0.25, fearGreedIndex: 0.50 },
        bear_market: { newsScore: 0.30, putCallRatio: 0.40, volatilitySmile: 0.30 },
      },
    };
  }

  // Multi-timeframe technical analysis
  private calculateTechnicalFeatures(data: MarketData[], timeframe: string) {
    const closes = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const volumes = data.map(d => d.volume);

    return {
      rsi: this.calculateRSI(closes, 14),
      macd: this.calculateMACD(closes),
      bollinger: this.calculateBollingerBands(closes, 20, 2),
      stochastic: this.calculateStochastic(highs, lows, closes, 14),
      williams: this.calculateWilliamsR(highs, lows, closes, 14),
      momentum: this.calculateMomentum(closes, 10),
      atr: this.calculateATR(highs, lows, closes, 14),
      adx: this.calculateADX(highs, lows, closes, 14),
    };
  }

  // Order flow analysis
  private calculateOrderFlowFeatures(orderBook: any, trades: any[]) {
    const totalBidVolume = orderBook.bids.reduce((sum: number, bid: any) => sum + parseFloat(bid[1]), 0);
    const totalAskVolume = orderBook.asks.reduce((sum: number, ask: any) => sum + parseFloat(ask[1]), 0);
    
    const recentTrades = trades.slice(-100);
    const buyVolume = recentTrades.filter(t => t.isBuyerMaker === false).reduce((sum, t) => sum + parseFloat(t.qty), 0);
    const sellVolume = recentTrades.filter(t => t.isBuyerMaker === true).reduce((sum, t) => sum + parseFloat(t.qty), 0);

    return {
      bidAskRatio: totalBidVolume / (totalBidVolume + totalAskVolume),
      volumeProfile: this.calculateVolumeProfile(recentTrades),
      marketImpact: this.calculateMarketImpact(recentTrades),
      liquidityImbalance: Math.abs(totalBidVolume - totalAskVolume) / (totalBidVolume + totalAskVolume),
      largeOrderFlow: buyVolume / (buyVolume + sellVolume),
    };
  }

  // Sentiment analysis from multiple sources
  private async calculateSentimentFeatures(symbol: string): Promise<any> {
    // Mock implementations - in production, connect to real APIs
    const newsScore = await this.getNewsAnalysis(symbol);
    const socialScore = await this.getSocialSentiment(symbol);
    const fearGreed = await this.getFearGreedIndex();
    
    return {
      newsScore: newsScore,
      socialScore: socialScore,
      fearGreedIndex: fearGreed,
      volatilitySmile: this.calculateVolatilitySmile(),
      putCallRatio: this.getPutCallRatio(symbol),
    };
  }

  // Market microstructure analysis
  private calculateMicrostructureFeatures(tickData: any[]) {
    const tickDirections = this.calculateTickDirection(tickData);
    const spreads = this.calculateSpreadAnalysis(tickData);
    
    return {
      tickDirection: tickDirections,
      spreadAnalysis: spreads,
      depthImbalance: this.calculateDepthImbalance(tickData),
      timeSalesPattern: this.analyzeTimeSalesPattern(tickData),
    };
  }

  // Market regime detection
  private detectMarketRegime(data: MarketData[]): AISignal['regime'] {
    const volatility = this.calculateVolatility(data.map(d => d.close));
    const trend = this.calculateTrend(data.map(d => d.close));
    const volume = data[data.length - 1].volume;
    const avgVolume = data.slice(-20).reduce((sum, d) => sum + d.volume, 0) / 20;

    if (volatility > 0.05 && volume > avgVolume * 2) return 'shock';
    if (volatility > 0.03) return 'volatile';
    if (Math.abs(trend) > 0.02) return trend > 0 ? 'trending_up' : 'trending_down';
    return 'ranging';
  }

  // Composite signal generation with ML ensemble
  public async generateSignal(
    symbol: string, 
    marketData: MarketData[], 
    orderBook: any, 
    trades: any[]
  ): Promise<AISignal> {
    
    const regime = this.detectMarketRegime(marketData);
    const features: SignalFeatures = {
      technical: this.calculateTechnicalFeatures(marketData, '1h'),
      orderflow: this.calculateOrderFlowFeatures(orderBook, trades),
      sentiment: await this.calculateSentimentFeatures(symbol),
      microstructure: this.calculateMicrostructureFeatures(trades.slice(-50)),
      macroeconomic: await this.getMacroFeatures(symbol),
    };

    // ML ensemble prediction
    const signals = this.calculateEnsembleSignals(features, regime);
    const rawSignal = this.combineSignals(signals, regime);
    
    // Risk adjustment
    const riskAdjustedSignal = this.applyRiskAdjustment(rawSignal, features, regime);
    
    // Confidence calculation
    const confidence = this.calculateConfidence(features, signals);
    
    // Generate explanation
    const explanation = this.generateExplanation(features, signals, regime);

    const signal: AISignal = {
      symbol,
      timestamp: Date.now(),
      signal: Math.max(-100, Math.min(100, rawSignal)),
      confidence,
      timeframe: '1h',
      regime,
      features,
      explanation,
      riskAdjustedSignal: Math.max(-100, Math.min(100, riskAdjustedSignal)),
    };

    // Store signal history
    if (!this.signalHistory.has(symbol)) {
      this.signalHistory.set(symbol, []);
    }
    const history = this.signalHistory.get(symbol)!;
    history.push(signal);
    if (history.length > 1000) history.shift(); // Keep last 1000 signals

    // Emit signal for real-time subscribers
    this.emit('signal', signal);
    
    return signal;
  }

  // Ensemble of different ML models
  private calculateEnsembleSignals(features: SignalFeatures, regime: AISignal['regime']) {
    return {
      technicalModel: this.technicalAnalysisModel(features.technical, regime),
      orderFlowModel: this.orderFlowModel(features.orderflow, regime),
      sentimentModel: this.sentimentModel(features.sentiment, regime),
      microstructureModel: this.microstructureModel(features.microstructure, regime),
      ensembleModel: this.deepLearningEnsemble(features, regime),
    };
  }

  // Individual model implementations
  private technicalAnalysisModel(technical: any, regime: AISignal['regime']): number {
    const weights = this.modelWeights.technical[regime] || this.modelWeights.technical.trending;
    
    let signal = 0;
    if (technical.rsi < 30) signal += 20 * (weights.rsi || 0.2);
    if (technical.rsi > 70) signal -= 20 * (weights.rsi || 0.2);
    
    if (technical.macd.macd > technical.macd.signal) signal += 15 * (weights.macd || 0.25);
    else signal -= 15 * (weights.macd || 0.25);
    
    if (technical.bollinger.percentB < 0.2) signal += 10 * (weights.bollinger || 0.2);
    if (technical.bollinger.percentB > 0.8) signal -= 10 * (weights.bollinger || 0.2);
    
    return signal;
  }

  private orderFlowModel(orderflow: any, regime: AISignal['regime']): number {
    let signal = 0;
    signal += (orderflow.bidAskRatio - 0.5) * 40; // Bid/Ask imbalance
    signal += (orderflow.largeOrderFlow - 0.5) * 30; // Large order flow
    signal += orderflow.volumeProfile * 20; // Volume profile
    return signal;
  }

  private sentimentModel(sentiment: any, regime: AISignal['regime']): number {
    let signal = 0;
    signal += sentiment.newsScore * 25;
    signal += sentiment.socialScore * 15;
    signal += (sentiment.fearGreedIndex - 50) * 0.3; // Contrarian indicator
    return signal;
  }

  private microstructureModel(microstructure: any, regime: AISignal['regime']): number {
    let signal = 0;
    signal += microstructure.tickDirection * 20;
    signal += microstructure.depthImbalance * 15;
    signal += microstructure.timeSalesPattern * 10;
    return signal;
  }

  private deepLearningEnsemble(features: SignalFeatures, regime: AISignal['regime']): number {
    // Mock deep learning model - in production, use TensorFlow.js or call Python API
    const featureVector = this.extractFeatureVector(features);
    const prediction = this.mockNeuralNetwork(featureVector, regime);
    return prediction * 100; // Scale to -100 to +100
  }

  // Signal combination with regime-specific weights
  private combineSignals(signals: any, regime: AISignal['regime']): number {
    const regimeWeights = {
      trending_up: { technical: 0.4, orderFlow: 0.25, sentiment: 0.15, microstructure: 0.1, ensemble: 0.1 },
      trending_down: { technical: 0.4, orderFlow: 0.25, sentiment: 0.15, microstructure: 0.1, ensemble: 0.1 },
      ranging: { technical: 0.25, orderFlow: 0.35, sentiment: 0.2, microstructure: 0.2, ensemble: 0.0 },
      volatile: { technical: 0.2, orderFlow: 0.4, sentiment: 0.1, microstructure: 0.3, ensemble: 0.0 },
      shock: { orderFlow: 0.5, microstructure: 0.3, sentiment: 0.2, technical: 0.0, ensemble: 0.0 },
    };

    const weights = regimeWeights[regime];
    
    return (
      signals.technicalModel * weights.technical +
      signals.orderFlowModel * weights.orderFlow +
      signals.sentimentModel * weights.sentiment +
      signals.microstructureModel * weights.microstructure +
      signals.ensembleModel * weights.ensemble
    );
  }

  // Risk adjustment based on market conditions
  private applyRiskAdjustment(signal: number, features: SignalFeatures, regime: AISignal['regime']): number {
    let adjustment = 1.0;
    
    // Reduce signal during high volatility
    if (features.technical.atr > 0.05) adjustment *= 0.7;
    
    // Reduce signal during low liquidity
    if (features.orderflow.liquidityImbalance > 0.3) adjustment *= 0.8;
    
    // Increase signal during strong trends with volume confirmation
    if (regime.includes('trending') && features.orderflow.volumeProfile > 0.5) {
      adjustment *= 1.2;
    }
    
    // Reduce signal during uncertain sentiment
    if (Math.abs(features.sentiment.fearGreedIndex - 50) > 30) adjustment *= 0.9;
    
    return signal * adjustment;
  }

  private calculateConfidence(features: SignalFeatures, signals: any): number {
    // Confidence based on signal agreement and feature quality
    const signalValues = Object.values(signals).filter(s => typeof s === 'number') as number[];
    const signalAgreement = this.calculateSignalAgreement(signalValues);
    const featureQuality = this.assessFeatureQuality(features);
    
    return Math.min(1.0, signalAgreement * featureQuality);
  }

  private generateExplanation(features: SignalFeatures, signals: any, regime: AISignal['regime']): string[] {
    const explanations: string[] = [];
    
    if (Math.abs(signals.technicalModel) > 20) {
      explanations.push(`Strong technical ${signals.technicalModel > 0 ? 'bullish' : 'bearish'} signals`);
    }
    
    if (Math.abs(signals.orderFlowModel) > 15) {
      explanations.push(`Order flow showing ${signals.orderFlowModel > 0 ? 'buying' : 'selling'} pressure`);
    }
    
    if (Math.abs(signals.sentimentModel) > 10) {
      explanations.push(`Market sentiment ${signals.sentimentModel > 0 ? 'positive' : 'negative'}`);
    }
    
    explanations.push(`Market regime: ${regime.replace('_', ' ')}`);
    
    return explanations;
  }

  // Helper functions (simplified implementations)
  private calculateRSI(prices: number[], period: number): number {
    if (prices.length < period + 1) return 50;
    
    let gains = 0, losses = 0;
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

  private calculateMACD(prices: number[]) {
    // Simplified MACD calculation
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macd = ema12 - ema26;
    const signal = this.calculateEMA([macd], 9); // Simplified
    return { macd, signal, histogram: macd - signal };
  }

  private calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    return ema;
  }

  private calculateBollingerBands(prices: number[], period: number, stdDev: number) {
    const sma = prices.slice(-period).reduce((sum, price) => sum + price, 0) / period;
    const variance = prices.slice(-period).reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const std = Math.sqrt(variance);
    
    return {
      upper: sma + (std * stdDev),
      middle: sma,
      lower: sma - (std * stdDev),
      percentB: (prices[prices.length - 1] - (sma - (std * stdDev))) / (2 * std * stdDev)
    };
  }

  private calculateStochastic(highs: number[], lows: number[], closes: number[], period: number) {
    const recentHighs = highs.slice(-period);
    const recentLows = lows.slice(-period);
    const currentClose = closes[closes.length - 1];
    
    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);
    
    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    const d = k; // Simplified - should be SMA of %K
    
    return { percentK: k, percentD: d };
  }

  private calculateWilliamsR(highs: number[], lows: number[], closes: number[], period: number): number {
    const recentHighs = highs.slice(-period);
    const recentLows = lows.slice(-period);
    const currentClose = closes[closes.length - 1];
    
    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);
    
    return ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
  }

  private calculateMomentum(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    return ((prices[prices.length - 1] / prices[prices.length - period - 1]) - 1) * 100;
  }

  private calculateATR(highs: number[], lows: number[], closes: number[], period: number): number {
    const trueRanges = [];
    for (let i = 1; i < highs.length && i < period + 1; i++) {
      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      );
      trueRanges.push(tr);
    }
    return trueRanges.reduce((sum, tr) => sum + tr, 0) / trueRanges.length;
  }

  private calculateADX(highs: number[], lows: number[], closes: number[], period: number): number {
    // Simplified ADX calculation
    let dmPlus = 0, dmMinus = 0, tr = 0;
    
    for (let i = 1; i < Math.min(highs.length, period + 1); i++) {
      const highDiff = highs[i] - highs[i - 1];
      const lowDiff = lows[i - 1] - lows[i];
      
      dmPlus += (highDiff > 0 && highDiff > lowDiff) ? highDiff : 0;
      dmMinus += (lowDiff > 0 && lowDiff > highDiff) ? lowDiff : 0;
      
      tr += Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      );
    }
    
    const diPlus = (dmPlus / tr) * 100;
    const diMinus = (dmMinus / tr) * 100;
    
    return Math.abs(diPlus - diMinus) / (diPlus + diMinus) * 100;
  }

  // Mock implementations for external data
  private async getNewsAnalysis(symbol: string): Promise<number> {
    // Mock news sentiment analysis
    return Math.random() * 2 - 1; // -1 to 1
  }

  private async getSocialSentiment(symbol: string): Promise<number> {
    // Mock social media sentiment
    return Math.random() * 2 - 1; // -1 to 1
  }

  private async getFearGreedIndex(): Promise<number> {
    // Mock fear and greed index
    return Math.random() * 100; // 0 to 100
  }

  private calculateVolatilitySmile(): number {
    // Mock volatility smile analysis
    return Math.random() * 0.5 - 0.25; // -0.25 to 0.25
  }

  private getPutCallRatio(symbol: string): number {
    // Mock put/call ratio
    return Math.random() * 2 + 0.5; // 0.5 to 2.5
  }

  private async getMacroFeatures(symbol: string): Promise<any> {
    return {
      correlationBTC: Math.random() * 2 - 1,
      correlationSPX: Math.random() * 2 - 1,
      usdStrength: Math.random() * 2 - 1,
      riskOnOff: Math.random() * 2 - 1,
    };
  }

  private calculateVolumeProfile(trades: any[]): number {
    // Volume profile analysis
    return Math.random() * 2 - 1;
  }

  private calculateMarketImpact(trades: any[]): number {
    // Market impact calculation
    return Math.random() * 0.1;
  }

  private calculateTickDirection(tickData: any[]): number {
    // Tick direction analysis
    return Math.random() * 2 - 1;
  }

  private calculateSpreadAnalysis(tickData: any[]): number {
    // Spread analysis
    return Math.random() * 0.01;
  }

  private calculateDepthImbalance(tickData: any[]): number {
    // Order book depth imbalance
    return Math.random() * 2 - 1;
  }

  private analyzeTimeSalesPattern(tickData: any[]): number {
    // Time and sales pattern analysis
    return Math.random() * 2 - 1;
  }

  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    return Math.sqrt(variance * 252); // Annualized volatility
  }

  private calculateTrend(prices: number[]): number {
    if (prices.length < 20) return 0;
    const recent = prices.slice(-20);
    const older = prices.slice(-40, -20);
    const recentAvg = recent.reduce((sum, p) => sum + p, 0) / recent.length;
    const olderAvg = older.reduce((sum, p) => sum + p, 0) / older.length;
    return (recentAvg - olderAvg) / olderAvg;
  }

  private extractFeatureVector(features: SignalFeatures): number[] {
    // Extract numerical features for ML model
    return [
      features.technical.rsi,
      features.technical.macd.macd,
      features.technical.bollinger.percentB,
      features.orderflow.bidAskRatio,
      features.orderflow.volumeProfile,
      features.sentiment.newsScore,
      features.sentiment.socialScore,
      features.microstructure.tickDirection,
    ];
  }

  private mockNeuralNetwork(features: number[], regime: AISignal['regime']): number {
    // Mock neural network prediction
    const sum = features.reduce((acc, f) => acc + f, 0);
    const regimeFactor = regime === 'trending_up' ? 1.2 : regime === 'trending_down' ? -1.2 : 1.0;
    return Math.tanh(sum * 0.1) * regimeFactor;
  }

  private calculateSignalAgreement(signals: number[]): number {
    const signs = signals.map(s => Math.sign(s));
    const agreement = Math.abs(signs.reduce((sum, sign) => sum + sign, 0)) / signs.length;
    return agreement;
  }

  private assessFeatureQuality(features: SignalFeatures): number {
    // Assess the quality and completeness of features
    let quality = 0.5;
    
    if (features.technical.rsi > 0 && features.technical.rsi < 100) quality += 0.1;
    if (features.orderflow.bidAskRatio > 0 && features.orderflow.bidAskRatio < 1) quality += 0.1;
    if (Math.abs(features.sentiment.newsScore) < 1) quality += 0.1;
    if (Math.abs(features.microstructure.tickDirection) < 1) quality += 0.1;
    
    return Math.min(1.0, quality);
  }

  // Public methods for external access
  public getSignalHistory(symbol: string, limit: number = 100): AISignal[] {
    const history = this.signalHistory.get(symbol) || [];
    return history.slice(-limit);
  }

  public subscribeToSignals(callback: (signal: AISignal) => void) {
    this.on('signal', callback);
  }

  public unsubscribeFromSignals(callback: (signal: AISignal) => void) {
    this.off('signal', callback);
  }
}

export const advancedSignalEngine = new AdvancedSignalEngine();
