// Advanced AI Trading Engine for borsa.ailydian.com
import { EventEmitter } from 'events';
import { TradingConfig, ExchangeConfig, StrategyConfig, RISK_LIMITS } from '../config';
import { TechnicalAnalyzer } from './TechnicalAnalyzer';
import { AIPredictor } from './AIPredictor';
import { RiskManager } from './RiskManager';
import { PortfolioManager } from './PortfolioManager';
import { OrderManager } from './OrderManager';
import { MarketDataProcessor } from './MarketDataProcessor';
import { SentimentAnalyzer } from './SentimentAnalyzer';
import { PatternRecognition } from './PatternRecognition';

export interface TradeSignal {
  symbol: string;
  exchange: string;
  action: 'BUY' | 'SELL' | 'HOLD' | 'CLOSE';
  confidence: number; // 0-1
  price: number;
  quantity: number;
  stopLoss: number;
  takeProfit: number;
  reasoning: string[];
  aiPrediction: number; // predicted price movement %
  technicalScore: number;
  sentimentScore: number;
  riskScore: number;
  timestamp: Date;
}

export interface MarketCondition {
  volatility: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  strength: number; // 0-1
  volume: 'LOW' | 'NORMAL' | 'HIGH' | 'SPIKE';
  newsImpact: number; // -1 to 1
}

export class AITradingEngine extends EventEmitter {
  private config: TradingConfig;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  
  // Core Components
  private technicalAnalyzer: TechnicalAnalyzer;
  private aiPredictor: AIPredictor;
  private riskManager: RiskManager;
  private portfolioManager: PortfolioManager;
  private orderManager: OrderManager;
  private marketDataProcessor: MarketDataProcessor;
  private sentimentAnalyzer: SentimentAnalyzer;
  private patternRecognition: PatternRecognition;
  
  // State Management
  private activePositions: Map<string, any> = new Map();
  private marketConditions: Map<string, MarketCondition> = new Map();
  private performanceMetrics: any = {
    totalTrades: 0,
    winRate: 0,
    totalReturn: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
    aiAccuracy: 0
  };
  
  // Emergency Controls
  private emergencyStop: boolean = false;
  private maxDailyLossReached: boolean = false;
  
  constructor(config: TradingConfig) {
    super();
    this.config = config;
    this.initializeComponents();
    this.setupEventHandlers();
  }
  
  private initializeComponents(): void {
    this.technicalAnalyzer = new TechnicalAnalyzer();
    this.aiPredictor = new AIPredictor();
    this.riskManager = new RiskManager(this.config);
    this.portfolioManager = new PortfolioManager(this.config);
    this.orderManager = new OrderManager(this.config);
    this.marketDataProcessor = new MarketDataProcessor();
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.patternRecognition = new PatternRecognition();
  }
  
  private setupEventHandlers(): void {
    // Market data events
    this.marketDataProcessor.on('newCandle', this.onNewCandle.bind(this));
    this.marketDataProcessor.on('tickerUpdate', this.onTickerUpdate.bind(this));
    
    // Order events
    this.orderManager.on('orderFilled', this.onOrderFilled.bind(this));
    this.orderManager.on('orderCanceled', this.onOrderCanceled.bind(this));
    this.orderManager.on('orderError', this.onOrderError.bind(this));
    
    // Risk management events
    this.riskManager.on('riskAlert', this.onRiskAlert.bind(this));
    this.riskManager.on('emergencyStop', this.onEmergencyStop.bind(this));
    
    // AI model events
    this.aiPredictor.on('predictionComplete', this.onPredictionComplete.bind(this));
    this.aiPredictor.on('modelRetrained', this.onModelRetrained.bind(this));
  }
  
  public async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Trading engine is already running');
    }
    
    try {
      console.log('🚀 Starting AI Trading Engine...');
      
      // Initialize all components
      await this.aiPredictor.initializeModels();
      await this.marketDataProcessor.connect();
      await this.orderManager.initialize();
      
      // Start market data streams
      await this.startMarketDataStreams();
      
      // Start strategy execution loops
      this.startStrategyExecutionLoop();
      
      // Start risk monitoring
      this.riskManager.startMonitoring();
      
      this.isRunning = true;
      this.emit('started');
      console.log('✅ AI Trading Engine started successfully');
      
    } catch (error) {
      console.error('❌ Failed to start AI Trading Engine:', error);
      throw error;
    }
  }
  
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    
    console.log('🛑 Stopping AI Trading Engine...');
    
    this.isRunning = false;
    this.isPaused = false;
    
    // Close all open positions if requested
    if (this.config.mode === 'live') {
      await this.closeAllPositions('SYSTEM_SHUTDOWN');
    }
    
    // Stop all components
    await this.marketDataProcessor.disconnect();
    this.riskManager.stopMonitoring();
    
    this.emit('stopped');
    console.log('✅ AI Trading Engine stopped');
  }
  
  public pause(): void {
    this.isPaused = true;
    this.emit('paused');
    console.log('⏸️ AI Trading Engine paused');
  }
  
  public resume(): void {
    this.isPaused = false;
    this.emit('resumed');
    console.log('▶️ AI Trading Engine resumed');
  }
  
  private async startMarketDataStreams(): Promise<void> {
    const allMarkets = new Set<string>();
    
    // Collect all markets from all strategies
    for (const strategy of this.config.strategies) {
      if (strategy.enabled) {
        for (const market of strategy.markets) {
          if (market === '*') {
            // Add all supported markets
            allMarkets.add('BTC/USDT');
            allMarkets.add('ETH/USDT');
            allMarkets.add('AAPL');
            allMarkets.add('TSLA');
          } else {
            allMarkets.add(market);
          }
        }
      }
    }
    
    // Subscribe to market data for each symbol
    for (const market of allMarkets) {
      await this.marketDataProcessor.subscribe(market);
    }
  }
  
  private startStrategyExecutionLoop(): void {
    setInterval(async () => {
      if (!this.isRunning || this.isPaused || this.emergencyStop) {
        return;
      }
      
      try {
        await this.executeStrategies();
      } catch (error) {
        console.error('Error in strategy execution loop:', error);
        this.emit('error', error);
      }
    }, 1000); // Execute every second
  }
  
  private async executeStrategies(): Promise<void> {
    for (const strategy of this.config.strategies) {
      if (!strategy.enabled) continue;
      
      try {
        await this.executeStrategy(strategy);
      } catch (error) {
        console.error(`Error executing strategy ${strategy.name}:`, error);
      }
    }
  }
  
  private async executeStrategy(strategy: StrategyConfig): Promise<void> {
    for (const market of strategy.markets) {
      if (market === '*') {
        // Execute on all available markets
        continue;
      }
      
      const marketData = await this.marketDataProcessor.getLatestData(market);
      if (!marketData) continue;
      
      // Get market condition
      const condition = await this.analyzeMarketCondition(market, marketData);
      this.marketConditions.set(market, condition);
      
      // Skip if market conditions are too risky
      if (condition.volatility === 'EXTREME' || condition.newsImpact < -0.8) {
        console.log(`⚠️ Skipping ${market} due to extreme conditions`);
        continue;
      }
      
      // Generate AI prediction
      const aiPrediction = await this.aiPredictor.predict(market, marketData, condition);
      
      // Perform technical analysis
      const technicalSignals = await this.technicalAnalyzer.analyze(market, marketData);
      
      // Get sentiment analysis
      const sentiment = await this.sentimentAnalyzer.analyzeSentiment(market);
      
      // Recognize patterns
      const patterns = await this.patternRecognition.findPatterns(market, marketData);
      
      // Generate trade signal
      const signal = await this.generateTradeSignal(
        market,
        strategy,
        aiPrediction,
        technicalSignals,
        sentiment,
        patterns,
        condition
      );
      
      if (signal && signal.confidence >= this.config.modelConfidenceThreshold) {
        await this.processTradeSignal(signal);
      }
    }
  }
  
  private async generateTradeSignal(
    market: string,
    strategy: StrategyConfig,
    aiPrediction: any,
    technicalSignals: any,
    sentiment: any,
    patterns: any,
    condition: MarketCondition
  ): Promise<TradeSignal | null> {
    
    const reasoning: string[] = [];
    let confidence = 0;
    let action: 'BUY' | 'SELL' | 'HOLD' | 'CLOSE' = 'HOLD';
    
    // AI-driven decision making
    const aiScore = aiPrediction.confidence * aiPrediction.direction;
    const technicalScore = this.calculateTechnicalScore(technicalSignals);
    const sentimentScore = sentiment.score;
    
    // Weighted scoring
    const finalScore = 
      aiScore * this.config.technicalWeight +
      technicalScore * this.config.technicalWeight +
      sentimentScore * this.config.sentimentWeight;
    
    confidence = Math.abs(finalScore);
    
    if (finalScore > 0.6) {
      action = 'BUY';
      reasoning.push(`Strong bullish signal (${finalScore.toFixed(2)})`);
    } else if (finalScore < -0.6) {
      action = 'SELL';
      reasoning.push(`Strong bearish signal (${finalScore.toFixed(2)})`);
    }
    
    // Add AI-specific reasoning
    if (aiPrediction.confidence > 0.8) {
      reasoning.push(`High AI confidence: ${(aiPrediction.confidence * 100).toFixed(1)}%`);
    }
    
    // Add technical analysis reasoning
    if (technicalSignals.rsi && technicalSignals.rsi > 70) {
      reasoning.push('RSI indicates overbought condition');
    } else if (technicalSignals.rsi && technicalSignals.rsi < 30) {
      reasoning.push('RSI indicates oversold condition');
    }
    
    // Add pattern recognition insights
    if (patterns.breakout) {
      reasoning.push(`Breakout pattern detected: ${patterns.breakout.type}`);
    }
    
    if (action === 'HOLD' || confidence < this.config.modelConfidenceThreshold) {
      return null;
    }
    
    const currentPrice = await this.marketDataProcessor.getCurrentPrice(market);
    const positionSize = await this.calculatePositionSize(market, confidence);
    
    return {
      symbol: market,
      exchange: this.getExchangeForMarket(market),
      action,
      confidence,
      price: currentPrice,
      quantity: positionSize,
      stopLoss: this.calculateStopLoss(currentPrice, action),
      takeProfit: this.calculateTakeProfit(currentPrice, action, aiPrediction.target),
      reasoning,
      aiPrediction: aiPrediction.direction,
      technicalScore,
      sentimentScore,
      riskScore: this.riskManager.calculateRiskScore(market, positionSize),
      timestamp: new Date()
    };
  }
  
  private async processTradeSignal(signal: TradeSignal): Promise<void> {
    // Risk validation
    const riskCheck = await this.riskManager.validateTrade(signal);
    if (!riskCheck.approved) {
      console.log(`🚫 Trade rejected: ${riskCheck.reason}`);
      return;
    }
    
    // Check position limits
    if (this.activePositions.size >= this.config.maxConcurrentTrades) {
      console.log('🚫 Maximum concurrent trades reached');
      return;
    }
    
    // Execute trade
    try {
      const order = await this.orderManager.placeOrder(signal);
      
      this.emit('tradeSignal', signal);
      this.emit('orderPlaced', order);
      
      console.log(`📊 Trade signal: ${signal.action} ${signal.symbol} at ${signal.price} (Confidence: ${(signal.confidence * 100).toFixed(1)}%)`);
      console.log(`🎯 AI Prediction: ${(signal.aiPrediction * 100).toFixed(1)}% movement`);
      console.log(`📝 Reasoning: ${signal.reasoning.join(', ')}`);
      
    } catch (error) {
      console.error('Failed to execute trade:', error);
      this.emit('tradeError', { signal, error });
    }
  }
  
  private calculateTechnicalScore(signals: any): number {
    let score = 0;
    let count = 0;
    
    // RSI scoring
    if (signals.rsi) {
      if (signals.rsi > 70) score -= 0.3; // Overbought
      else if (signals.rsi < 30) score += 0.3; // Oversold
      count++;
    }
    
    // MACD scoring
    if (signals.macd) {
      if (signals.macd.histogram > 0 && signals.macd.signal > signals.macd.macd) {
        score += 0.4; // Bullish
      } else if (signals.macd.histogram < 0 && signals.macd.signal < signals.macd.macd) {
        score -= 0.4; // Bearish
      }
      count++;
    }
    
    // Moving average scoring
    if (signals.movingAverages) {
      const { sma20, sma50, ema12, ema26 } = signals.movingAverages;
      if (ema12 > ema26 && sma20 > sma50) score += 0.3; // Bullish
      else if (ema12 < ema26 && sma20 < sma50) score -= 0.3; // Bearish
      count++;
    }
    
    return count > 0 ? score / count : 0;
  }
  
  private async analyzeMarketCondition(market: string, data: any): Promise<MarketCondition> {
    const volatility = this.calculateVolatility(data);
    const trend = await this.determineTrend(market, data);
    const volume = this.analyzeVolume(data);
    const newsImpact = await this.sentimentAnalyzer.getNewsImpact(market);
    
    return {
      volatility: this.categorizeVolatility(volatility),
      trend: trend.direction,
      strength: trend.strength,
      volume: this.categorizeVolume(volume),
      newsImpact
    };
  }
  
  private calculateVolatility(data: any): number {
    // Calculate average true range or similar volatility measure
    if (!data.candles || data.candles.length < 14) return 0;
    
    let atr = 0;
    for (let i = 1; i < Math.min(14, data.candles.length); i++) {
      const current = data.candles[i];
      const previous = data.candles[i - 1];
      
      const tr = Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close)
      );
      atr += tr;
    }
    
    return atr / 14;
  }
  
  private categorizeVolatility(atr: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' {
    if (atr < 0.02) return 'LOW';
    if (atr < 0.05) return 'MEDIUM';
    if (atr < 0.1) return 'HIGH';
    return 'EXTREME';
  }
  
  private async determineTrend(market: string, data: any): Promise<{ direction: 'BULLISH' | 'BEARISH' | 'SIDEWAYS', strength: number }> {
    // Use AI model to determine trend
    const trendPrediction = await this.aiPredictor.analyzeTrend(market, data);
    return trendPrediction;
  }
  
  private analyzeVolume(data: any): number {
    if (!data.candles || data.candles.length < 20) return 1;
    
    const recentVolume = data.candles.slice(-1)[0].volume;
    const avgVolume = data.candles.slice(-20).reduce((sum: number, candle: any) => sum + candle.volume, 0) / 20;
    
    return recentVolume / avgVolume;
  }
  
  private categorizeVolume(volumeRatio: number): 'LOW' | 'NORMAL' | 'HIGH' | 'SPIKE' {
    if (volumeRatio < 0.5) return 'LOW';
    if (volumeRatio < 1.5) return 'NORMAL';
    if (volumeRatio < 3.0) return 'HIGH';
    return 'SPIKE';
  }
  
  private async calculatePositionSize(market: string, confidence: number): Promise<number> {
    const portfolioValue = await this.portfolioManager.getTotalValue();
    const riskAmount = portfolioValue * (this.config.maxRiskPerTrade / 100);
    
    // Adjust position size based on confidence
    const adjustedRisk = riskAmount * confidence;
    
    const currentPrice = await this.marketDataProcessor.getCurrentPrice(market);
    return Math.min(adjustedRisk / currentPrice, this.config.maxTradeAmount);
  }
  
  private calculateStopLoss(price: number, action: 'BUY' | 'SELL'): number {
    const stopLossPercent = 0.02; // 2% stop loss
    
    if (action === 'BUY') {
      return price * (1 - stopLossPercent);
    } else {
      return price * (1 + stopLossPercent);
    }
  }
  
  private calculateTakeProfit(price: number, action: 'BUY' | 'SELL', aiTarget?: number): number {
    let takeProfitPercent = 0.04; // Default 4% take profit
    
    // Use AI target if available
    if (aiTarget && Math.abs(aiTarget) > 0.04) {
      takeProfitPercent = Math.min(Math.abs(aiTarget), 0.15); // Cap at 15%
    }
    
    if (action === 'BUY') {
      return price * (1 + takeProfitPercent);
    } else {
      return price * (1 - takeProfitPercent);
    }
  }
  
  private getExchangeForMarket(market: string): string {
    // Determine appropriate exchange based on market
    if (market.includes('/')) {
      return 'binance'; // Crypto pairs
    } else if (market.length <= 5) {
      return 'alpaca'; // Stock symbols
    }
    return 'binance'; // Default
  }
  
  private async closeAllPositions(reason: string): Promise<void> {
    console.log(`🚨 Closing all positions: ${reason}`);
    
    for (const [symbol, position] of this.activePositions) {
      try {
        await this.orderManager.closePosition(symbol, position);
        console.log(`✅ Closed position for ${symbol}`);
      } catch (error) {
        console.error(`❌ Failed to close position for ${symbol}:`, error);
      }
    }
    
    this.activePositions.clear();
  }
  
  // Event handlers
  private async onNewCandle(data: any): Promise<void> {
    // Process new candle data for real-time analysis
    this.emit('newCandle', data);
  }
  
  private async onTickerUpdate(data: any): Promise<void> {
    // Handle real-time price updates
    this.emit('priceUpdate', data);
  }
  
  private async onOrderFilled(order: any): Promise<void> {
    console.log(`✅ Order filled: ${order.symbol} ${order.side} ${order.quantity}`);
    
    // Update position tracking
    if (order.side === 'BUY' || order.side === 'SELL') {
      this.activePositions.set(order.symbol, order);
    } else {
      this.activePositions.delete(order.symbol);
    }
    
    // Update performance metrics
    this.updatePerformanceMetrics(order);
    
    this.emit('orderFilled', order);
  }
  
  private async onOrderCanceled(order: any): Promise<void> {
    console.log(`❌ Order canceled: ${order.symbol}`);
    this.emit('orderCanceled', order);
  }
  
  private async onOrderError(error: any): Promise<void> {
    console.error('❌ Order error:', error);
    this.emit('orderError', error);
  }
  
  private async onRiskAlert(alert: any): Promise<void> {
    console.warn(`⚠️ Risk alert: ${alert.message}`);
    
    if (alert.severity === 'HIGH') {
      this.pause();
    }
    
    this.emit('riskAlert', alert);
  }
  
  private async onEmergencyStop(reason: string): Promise<void> {
    console.error(`🚨 EMERGENCY STOP: ${reason}`);
    this.emergencyStop = true;
    
    await this.closeAllPositions('EMERGENCY_STOP');
    this.pause();
    
    this.emit('emergencyStop', reason);
  }
  
  private async onPredictionComplete(prediction: any): Promise<void> {
    this.emit('aiPrediction', prediction);
  }
  
  private async onModelRetrained(modelInfo: any): Promise<void> {
    console.log(`🧠 AI model retrained: ${modelInfo.accuracy}% accuracy`);
    this.emit('modelRetrained', modelInfo);
  }
  
  private updatePerformanceMetrics(order: any): void {
    this.performanceMetrics.totalTrades++;
    // Add more performance tracking logic here
  }
  
  // Public API methods
  public getStatus(): any {
    return {
      running: this.isRunning,
      paused: this.isPaused,
      emergencyStop: this.emergencyStop,
      activePositions: this.activePositions.size,
      marketConditions: Object.fromEntries(this.marketConditions),
      performance: this.performanceMetrics
    };
  }
  
  public getPerformanceMetrics(): any {
    return { ...this.performanceMetrics };
  }
  
  public getActivePositions(): Map<string, any> {
    return new Map(this.activePositions);
  }
  
  public updateConfig(newConfig: Partial<TradingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }
  
  public async forceClosePosition(symbol: string): Promise<void> {
    const position = this.activePositions.get(symbol);
    if (position) {
      await this.orderManager.closePosition(symbol, position);
      this.activePositions.delete(symbol);
    }
  }
  
  public resetEmergencyStop(): void {
    this.emergencyStop = false;
    this.maxDailyLossReached = false;
    console.log('🔄 Emergency stop reset');
  }
}

export default AITradingEngine;