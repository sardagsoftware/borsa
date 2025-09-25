import { EventEmitter } from 'events';
import { GlobalExchangeRegistry, ExchangeConfig, ExchangeType, UserExchangeConfig } from '../exchanges/GlobalExchangeConfig';
import UniversalMarketDataEngine, { MarketData, Candle } from '../engines/UniversalMarketDataEngine';
import { RiskManager } from '../trading/RiskManager';
import { OrderManager } from '../trading/OrderManager';
import { AITradingEngine } from './AITradingEngine';
import { AIPredictionEngine } from './AIPredictionEngine';

export interface GlobalTradingSignal {
  id: string;
  symbol: string;
  exchange: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  price: number;
  quantity: number;
  reasoning: string[];
  aiModels: string[];
  crossExchangeAnalysis?: {
    arbitrageOpportunity: boolean;
    bestExchange: string;
    worstExchange: string;
    priceSpread: number;
  };
  riskAssessment: {
    score: number;
    factors: string[];
    maxPositionSize: number;
    stopLoss: number;
    takeProfit: number;
  };
  timestamp: number;
}

export interface GlobalPortfolio {
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  positions: {
    [exchange: string]: {
      [symbol: string]: {
        side: 'LONG' | 'SHORT';
        size: number;
        entryPrice: number;
        currentPrice: number;
        pnl: number;
        pnlPercent: number;
        marginUsed?: number;
      };
    };
  };
  balances: {
    [exchange: string]: {
      [currency: string]: {
        total: number;
        available: number;
        locked: number;
      };
    };
  };
  performance: {
    dailyPnL: number;
    weeklyPnL: number;
    monthlyPnL: number;
    maxDrawdown: number;
    sharpeRatio: number;
    winRate: number;
    totalTrades: number;
    avgTradeSize: number;
  };
}

export interface AIStrategy {
  id: string;
  name: string;
  description: string;
  exchangeTypes: ExchangeType[];
  symbols: string[];
  enabled: boolean;
  parameters: {
    [key: string]: any;
  };
  performance: {
    totalTrades: number;
    winRate: number;
    pnlPercent: number;
    sharpeRatio: number;
  };
}

export class GlobalAITradingBot extends EventEmitter {
  private marketDataEngine: UniversalMarketDataEngine;
  private aiTradingEngine: AITradingEngine;
  private aiPredictionEngine: AIPredictionEngine;
  private riskManager: RiskManager;
  private orderManager: OrderManager;
  
  private activeExchanges: Map<string, ExchangeConfig> = new Map();
  private userConfigs: Map<string, UserExchangeConfig> = new Map();
  private portfolio: GlobalPortfolio;
  private activeSignals: Map<string, GlobalTradingSignal> = new Map();
  private strategies: Map<string, AIStrategy> = new Map();
  private tradingHistory: GlobalTradingSignal[] = [];
  
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private emergencyStop: boolean = false;
  
  // AI Model Performance Tracking
  private modelPerformance: Map<string, {
    predictions: number;
    correctPredictions: number;
    accuracy: number;
    profitableSignals: number;
    totalProfit: number;
  }> = new Map();

  constructor() {
    super();
    
    // Initialize components
    this.marketDataEngine = new UniversalMarketDataEngine();
    this.aiTradingEngine = new AITradingEngine();
    this.aiPredictionEngine = new AIPredictionEngine();
    this.riskManager = new RiskManager();
    this.orderManager = new OrderManager();
    
    // Initialize portfolio
    this.portfolio = this.initializePortfolio();
    
    // Initialize AI strategies
    this.initializeAIStrategies();
    
    // Setup event handlers
    this.setupEventHandlers();
    
    console.log('🤖 Global AI Trading Bot başlatıldı');
  }

  private initializePortfolio(): GlobalPortfolio {
    return {
      totalValue: 0,
      totalPnL: 0,
      totalPnLPercent: 0,
      positions: {},
      balances: {},
      performance: {
        dailyPnL: 0,
        weeklyPnL: 0,
        monthlyPnL: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        winRate: 0,
        totalTrades: 0,
        avgTradeSize: 0
      }
    };
  }

  private initializeAIStrategies(): void {
    const strategies: AIStrategy[] = [
      {
        id: 'global_momentum',
        name: 'Global Momentum Strategy',
        description: 'Tüm borsalardaki momentum sinyallerini analiz eder',
        exchangeTypes: [ExchangeType.CRYPTO, ExchangeType.STOCK],
        symbols: ['BTC', 'ETH', 'AAPL', 'TSLA'],
        enabled: true,
        parameters: {
          momentumPeriod: 14,
          confidenceThreshold: 0.7,
          maxPositions: 10
        },
        performance: {
          totalTrades: 0,
          winRate: 0,
          pnlPercent: 0,
          sharpeRatio: 0
        }
      },
      {
        id: 'cross_exchange_arbitrage',
        name: 'Cross-Exchange Arbitrage',
        description: 'Borsalar arası arbitraj fırsatlarını yakalar',
        exchangeTypes: [ExchangeType.CRYPTO],
        symbols: ['BTC', 'ETH', 'USDT'],
        enabled: true,
        parameters: {
          minSpread: 0.5,
          maxRisk: 1,
          executionSpeed: 'fast'
        },
        performance: {
          totalTrades: 0,
          winRate: 0,
          pnlPercent: 0,
          sharpeRatio: 0
        }
      },
      {
        id: 'ai_sentiment_analysis',
        name: 'AI Sentiment Analysis',
        description: 'Piyasa duyarlılığını AI ile analiz eder',
        exchangeTypes: [ExchangeType.CRYPTO, ExchangeType.STOCK, ExchangeType.FOREX],
        symbols: ['*'], // Tüm semboller
        enabled: true,
        parameters: {
          sentimentWeight: 0.3,
          newsAnalysis: true,
          socialMediaAnalysis: true
        },
        performance: {
          totalTrades: 0,
          winRate: 0,
          pnlPercent: 0,
          sharpeRatio: 0
        }
      },
      {
        id: 'market_regime_detection',
        name: 'Market Regime Detection',
        description: 'Piyasa rejimlerini tespit eder ve strateji ayarlar',
        exchangeTypes: [ExchangeType.STOCK, ExchangeType.COMMODITY, ExchangeType.FOREX],
        symbols: ['*'],
        enabled: true,
        parameters: {
          regimeIndicators: ['volatility', 'correlation', 'momentum'],
          adaptationSpeed: 'medium'
        },
        performance: {
          totalTrades: 0,
          winRate: 0,
          pnlPercent: 0,
          sharpeRatio: 0
        }
      }
    ];

    strategies.forEach(strategy => {
      this.strategies.set(strategy.id, strategy);
    });

    console.log(`🧠 ${strategies.length} AI stratejisi yüklendi`);
  }

  private setupEventHandlers(): void {
    // Market data handler - AI prediction tetikleyici
    this.marketDataEngine.setAIPredictionHandler((marketData: MarketData) => {
      this.processMarketDataWithAI(marketData);
    });

    // Anomaly detection handler
    this.marketDataEngine.setAnomalyDetector((marketData: MarketData) => {
      return this.detectMarketAnomaly(marketData);
    });

    // Market data events
    this.marketDataEngine.on('marketData', (data: MarketData) => {
      this.updatePortfolio(data);
    });

    // Arbitrage opportunities
    this.marketDataEngine.on('arbitrageOpportunity', (opportunity: any) => {
      if (this.isRunning && !this.isPaused) {
        this.handleArbitrageOpportunity(opportunity);
      }
    });

    // Exchange connection events
    this.marketDataEngine.on('exchangeConnected', (exchangeId: string) => {
      console.log(`🔗 ${exchangeId} borsası AI bot'a bağlandı`);
      this.emit('exchangeConnected', exchangeId);
    });
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    
    console.log('🚀 Global AI Trading Bot başlatılıyor...');
    this.isRunning = true;
    this.isPaused = false;
    this.emergencyStop = false;
    
    // Initialize exchanges
    GlobalExchangeRegistry.initialize();
    const activeExchanges = GlobalExchangeRegistry.getAICompatibleExchanges();
    
    activeExchanges.forEach(exchange => {
      this.activeExchanges.set(exchange.id, exchange);
    });
    
    // Start market data engine
    this.marketDataEngine.startArbitrageDetection();
    
    // Start AI engines
    await this.aiTradingEngine.initialize();
    await this.aiPredictionEngine.initialize();
    
    // Start main trading loop
    this.startTradingLoop();
    
    this.emit('botStarted');
    console.log('✅ Global AI Trading Bot aktif');
  }

  public pause(): void {
    if (!this.isRunning) return;
    
    this.isPaused = !this.isPaused;
    const status = this.isPaused ? 'duraklatıldı' : 'devam ediyor';
    console.log(`⏸️ AI Trading Bot ${status}`);
    this.emit('botPaused', this.isPaused);
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) return;
    
    console.log('🛑 AI Trading Bot durduruluyor...');
    this.isRunning = false;
    this.isPaused = false;
    
    // Close all positions safely
    await this.closeAllPositions();
    
    // Stop engines
    this.marketDataEngine.close();
    
    this.emit('botStopped');
    console.log('✅ AI Trading Bot durduruldu');
  }

  public emergencyStopActivate(): void {
    console.log('🚨 ACİL DURDURMA AKTİF');
    this.emergencyStop = true;
    this.isRunning = false;
    this.isPaused = false;
    
    // Immediately close all positions
    this.closeAllPositionsEmergency();
    
    this.emit('emergencyStop');
  }

  private startTradingLoop(): void {
    const tradingInterval = setInterval(async () => {
      if (!this.isRunning || this.isPaused || this.emergencyStop) {
        if (this.emergencyStop || !this.isRunning) {
          clearInterval(tradingInterval);
        }
        return;
      }
      
      try {
        await this.runTradingCycle();
      } catch (error) {
        console.error('❌ Trading cycle hatası:', error);
        this.emit('tradingError', error);
      }
    }, 5000); // Her 5 saniyede bir trading cycle
  }

  private async runTradingCycle(): Promise<void> {
    // 1. Aktif pozisyonları güncelle
    await this.updateActivePositions();
    
    // 2. Risk yönetimini kontrol et
    const riskCheck = await this.riskManager.evaluatePortfolioRisk(this.portfolio as any);
    if (riskCheck.emergencyStop) {
      this.emergencyStopActivate();
      return;
    }
    
    // 3. Her strateji için AI sinyallerini üret
    for (const [strategyId, strategy] of this.strategies.entries()) {
      if (strategy.enabled) {
        await this.executeStrategy(strategy);
      }
    }
    
    // 4. Portföy performansını güncelle
    this.updatePortfolioPerformance();
    
    // 5. Events emit et
    this.emit('tradingCycleComplete', {
      timestamp: Date.now(),
      activePositions: Object.keys(this.portfolio.positions).length,
      totalPnL: this.portfolio.totalPnL,
      activeSignals: this.activeSignals.size
    });
  }

  private async processMarketDataWithAI(marketData: MarketData): Promise<void> {
    if (!this.isRunning || this.isPaused) return;
    
    // AI prediction ile market data analizi
    const prediction = await this.aiPredictionEngine.predict({
      symbol: marketData.symbol,
      price: marketData.price,
      volume: marketData.volume,
      timestamp: marketData.timestamp,
      exchange: marketData.exchange
    });
    
    // AI trading engine ile signal generation
    const signal = await this.aiTradingEngine.generateSignal({
      marketData,
      prediction,
      portfolio: this.portfolio,
      riskMetrics: await this.riskManager.getCurrentRiskMetrics()
    });
    
    if (signal && signal.confidence > 0.7) {
      const globalSignal = this.createGlobalSignal(marketData, signal, prediction);
      await this.evaluateAndExecuteSignal(globalSignal);
    }
  }

  private createGlobalSignal(
    marketData: MarketData, 
    aiSignal: any, 
    prediction: any
  ): GlobalTradingSignal {
    return {
      id: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol: marketData.symbol,
      exchange: marketData.exchange,
      action: aiSignal.action,
      confidence: aiSignal.confidence,
      price: marketData.price,
      quantity: aiSignal.quantity,
      reasoning: aiSignal.reasoning || [],
      aiModels: ['neural_network', 'random_forest', 'lstm'],
      riskAssessment: {
        score: aiSignal.riskScore || 5,
        factors: aiSignal.riskFactors || [],
        maxPositionSize: aiSignal.maxPositionSize || 1000,
        stopLoss: aiSignal.stopLoss || marketData.price * 0.95,
        takeProfit: aiSignal.takeProfit || marketData.price * 1.05
      },
      timestamp: Date.now()
    };
  }

  private async evaluateAndExecuteSignal(signal: GlobalTradingSignal): Promise<void> {
    // Risk kontrolü
    const riskApproved = await this.riskManager.evaluateTradeRisk({
      symbol: signal.symbol,
      action: signal.action,
      quantity: signal.quantity,
      price: signal.price,
      exchange: signal.exchange
    } as any);
    
    if (!riskApproved.approved) {
      console.log(`❌ Risk kontrolü başarısız: ${signal.symbol} - ${riskApproved.reason}`);
      return;
    }
    
    // Cross-exchange analizi
    await this.addCrossExchangeAnalysis(signal);
    
    // Signal'ı aktif listesine ekle
    this.activeSignals.set(signal.id, signal);
    
    // Order execution
    if (signal.action !== 'HOLD') {
      try {
        const orderResult = await this.executeOrder(signal);
        if (orderResult.success) {
          console.log(`✅ Order başarılı: ${signal.symbol} ${signal.action} @ ${signal.price}`);
          this.updateTradingHistory(signal);
          this.updateModelPerformance(signal);
        }
      } catch (error) {
        console.error(`❌ Order execution hatası:`, error);
      }
    }
    
    this.emit('newSignal', signal);
  }

  private async addCrossExchangeAnalysis(signal: GlobalTradingSignal): Promise<void> {
    const allMarketData = this.marketDataEngine.getAllMarketData();
    const symbolPrices: { exchange: string; price: number }[] = [];
    
    allMarketData.forEach((data, key) => {
      if (data.symbol === signal.symbol) {
        symbolPrices.push({
          exchange: data.exchange,
          price: data.price
        });
      }
    });
    
    if (symbolPrices.length >= 2) {
      const maxPrice = Math.max(...symbolPrices.map(p => p.price));
      const minPrice = Math.min(...symbolPrices.map(p => p.price));
      const spread = ((maxPrice - minPrice) / minPrice) * 100;
      
      const bestExchange = symbolPrices.find(p => p.price === (signal.action === 'BUY' ? minPrice : maxPrice))!;
      const worstExchange = symbolPrices.find(p => p.price === (signal.action === 'BUY' ? maxPrice : minPrice))!;
      
      signal.crossExchangeAnalysis = {
        arbitrageOpportunity: spread > 0.5,
        bestExchange: bestExchange.exchange,
        worstExchange: worstExchange.exchange,
        priceSpread: spread
      };
    }
  }

  private async executeOrder(signal: GlobalTradingSignal): Promise<{ success: boolean; orderId?: string }> {
    return await this.orderManager.placeOrder({
      exchange: signal.exchange,
      symbol: signal.symbol,
      side: signal.action.toLowerCase() as 'buy' | 'sell',
      type: 'market',
      quantity: signal.quantity,
      price: signal.price,
      stopLoss: signal.riskAssessment.stopLoss,
      takeProfit: signal.riskAssessment.takeProfit,
      metadata: {
        aiGenerated: true,
        confidence: signal.confidence,
        signalId: signal.id
      }
    });
  }

  private async executeStrategy(strategy: AIStrategy): Promise<void> {
    const marketData = this.marketDataEngine.getAllMarketData();
    const relevantData: MarketData[] = [];
    
    // Strategy'ye uygun market data'yı filtrele
    marketData.forEach((data) => {
      const exchange = GlobalExchangeRegistry.getExchange(data.exchange);
      if (exchange && this.isStrategyApplicable(strategy, exchange, data.symbol)) {
        relevantData.push(data);
      }
    });
    
    if (relevantData.length === 0) return;
    
    // Strategy-specific execution
    switch (strategy.id) {
      case 'global_momentum':
        await this.executeMomentumStrategy(strategy, relevantData);
        break;
        
      case 'cross_exchange_arbitrage':
        await this.executeArbitrageStrategy(strategy, relevantData);
        break;
        
      case 'ai_sentiment_analysis':
        await this.executeSentimentStrategy(strategy, relevantData);
        break;
        
      case 'market_regime_detection':
        await this.executeRegimeStrategy(strategy, relevantData);
        break;
    }
  }

  private isStrategyApplicable(strategy: AIStrategy, exchange: ExchangeConfig, symbol: string): boolean {
    // Exchange type kontrolü
    const hasMatchingType = strategy.exchangeTypes.some(type => exchange.type.includes(type));
    if (!hasMatchingType) return false;
    
    // Symbol kontrolü
    if (strategy.symbols.includes('*')) return true;
    if (strategy.symbols.includes(symbol)) return true;
    
    return false;
  }

  private async executeMomentumStrategy(strategy: AIStrategy, marketData: MarketData[]): Promise<void> {
    for (const data of marketData) {
      if (data.changePercent24h && Math.abs(data.changePercent24h) > 5) {
        const signal = await this.aiTradingEngine.generateMomentumSignal(data, strategy.parameters);
        if (signal && signal.confidence > strategy.parameters.confidenceThreshold) {
          const globalSignal = this.createGlobalSignal(data, signal, null);
          await this.evaluateAndExecuteSignal(globalSignal);
        }
      }
    }
  }

  private async executeArbitrageStrategy(strategy: AIStrategy, marketData: MarketData[]): Promise<void> {
    // Arbitrage fırsatları zaten market data engine tarafından tespit ediliyor
    // Bu strategy daha sofistike arbitrage mantıkları için kullanılabilir
  }

  private async executeSentimentStrategy(strategy: AIStrategy, marketData: MarketData[]): Promise<void> {
    // Sentiment analysis için external API'lerden veri çekme
    // Bu demo'da basitleştirilmiş bir implementasyon var
  }

  private async executeRegimeStrategy(strategy: AIStrategy, marketData: MarketData[]): Promise<void> {
    // Market regime detection ve strategy adaptation
  }

  private async handleArbitrageOpportunity(opportunity: any): Promise<void> {
    if (opportunity.potentialProfit > 1) { // %1'den fazla profit potansiyeli
      console.log(`🎯 Arbitraj fırsatı: ${opportunity.symbol} - %${opportunity.spread} spread`);
      
      const signal: GlobalTradingSignal = {
        id: `arb_${Date.now()}`,
        symbol: opportunity.symbol,
        exchange: opportunity.buyExchange,
        action: 'BUY',
        confidence: 0.9,
        price: opportunity.buyPrice,
        quantity: 1, // Risk yönetimine göre hesaplanacak
        reasoning: ['Arbitraj fırsatı tespit edildi', `%${opportunity.spread} spread`],
        aiModels: ['arbitrage_detector'],
        crossExchangeAnalysis: {
          arbitrageOpportunity: true,
          bestExchange: opportunity.buyExchange,
          worstExchange: opportunity.sellExchange,
          priceSpread: parseFloat(opportunity.spread)
        },
        riskAssessment: {
          score: 2, // Düşük risk
          factors: ['Arbitraj - düşük risk'],
          maxPositionSize: 10000,
          stopLoss: opportunity.buyPrice * 0.99,
          takeProfit: opportunity.sellPrice * 0.99
        },
        timestamp: Date.now()
      };
      
      await this.evaluateAndExecuteSignal(signal);
    }
  }

  private detectMarketAnomaly(marketData: MarketData): boolean {
    // Basit anomali tespiti - gerçek implementasyonda daha sofistike olacak
    if (marketData.changePercent24h && Math.abs(marketData.changePercent24h) > 20) {
      console.log(`🚨 Anomali tespit edildi: ${marketData.symbol} %${marketData.changePercent24h} değişim`);
      return true;
    }
    
    return false;
  }

  private updateTradingHistory(signal: GlobalTradingSignal): void {
    this.tradingHistory.unshift(signal);
    
    // History boyutunu sınırla (son 1000 trade)
    if (this.tradingHistory.length > 1000) {
      this.tradingHistory = this.tradingHistory.slice(0, 1000);
    }
  }

  private updateModelPerformance(signal: GlobalTradingSignal): void {
    signal.aiModels.forEach(model => {
      if (!this.modelPerformance.has(model)) {
        this.modelPerformance.set(model, {
          predictions: 0,
          correctPredictions: 0,
          accuracy: 0,
          profitableSignals: 0,
          totalProfit: 0
        });
      }
      
      const performance = this.modelPerformance.get(model)!;
      performance.predictions++;
      
      // Basit performance tracking (gerçek implementasyonda daha detaylı olacak)
      if (signal.confidence > 0.7) {
        performance.correctPredictions++;
      }
      
      performance.accuracy = (performance.correctPredictions / performance.predictions) * 100;
      this.modelPerformance.set(model, performance);
    });
  }

  private async updateActivePositions(): Promise<void> {
    // Her exchange için pozisyonları güncelle
    for (const [exchangeId] of this.activeExchanges) {
      const positions = await this.orderManager.getActivePositions(exchangeId);
      this.portfolio.positions[exchangeId] = positions;
    }
  }

  private updatePortfolio(marketData: MarketData): void {
    // Real-time portfolio value update
    const exchangePositions = this.portfolio.positions[marketData.exchange];
    if (exchangePositions && exchangePositions[marketData.symbol]) {
      const position = exchangePositions[marketData.symbol];
      position.currentPrice = marketData.price;
      
      const priceDiff = marketData.price - position.entryPrice;
      position.pnl = priceDiff * position.size * (position.side === 'LONG' ? 1 : -1);
      position.pnlPercent = (position.pnl / (position.entryPrice * position.size)) * 100;
    }
  }

  private updatePortfolioPerformance(): void {
    let totalValue = 0;
    let totalPnL = 0;
    
    // Tüm pozisyonları hesapla
    Object.values(this.portfolio.positions).forEach(exchangePositions => {
      Object.values(exchangePositions).forEach(position => {
        const positionValue = position.currentPrice * position.size;
        totalValue += positionValue;
        totalPnL += position.pnl;
      });
    });
    
    this.portfolio.totalValue = totalValue;
    this.portfolio.totalPnL = totalPnL;
    this.portfolio.totalPnLPercent = totalValue > 0 ? (totalPnL / totalValue) * 100 : 0;
    
    // Performance metrics güncelle
    this.portfolio.performance.totalTrades = this.tradingHistory.length;
    
    const profitableTrades = this.tradingHistory.filter(signal => {
      // Basit karlılık kontrolü - gerçekte daha detaylı olacak
      return signal.confidence > 0.7;
    });
    
    this.portfolio.performance.winRate = this.tradingHistory.length > 0 
      ? (profitableTrades.length / this.tradingHistory.length) * 100 
      : 0;
  }

  private async closeAllPositions(): Promise<void> {
    console.log('🔄 Tüm pozisyonlar kapatılıyor...');
    
    for (const [exchangeId, positions] of Object.entries(this.portfolio.positions)) {
      for (const [symbol] of Object.entries(positions)) {
        try {
          await this.orderManager.closePosition(exchangeId, symbol);
          console.log(`✅ ${exchangeId}:${symbol} pozisyonu kapatıldı`);
        } catch (error) {
          console.error(`❌ ${exchangeId}:${symbol} pozisyonu kapatılamadı:`, error);
        }
      }
    }
  }

  private async closeAllPositionsEmergency(): Promise<void> {
    console.log('🚨 ACİL DURUM - Tüm pozisyonlar kapatılıyor...');
    await this.closeAllPositions();
  }

  // Public getters
  public getPortfolio(): GlobalPortfolio {
    return { ...this.portfolio };
  }

  public getActiveSignals(): GlobalTradingSignal[] {
    return Array.from(this.activeSignals.values());
  }

  public getTradingHistory(limit: number = 100): GlobalTradingSignal[] {
    return this.tradingHistory.slice(0, limit);
  }

  public getStrategies(): AIStrategy[] {
    return Array.from(this.strategies.values());
  }

  public getModelPerformance(): Map<string, any> {
    return new Map(this.modelPerformance);
  }

  public getBotStatus() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      emergencyStop: this.emergencyStop,
      connectedExchanges: this.marketDataEngine.getConnectedExchanges(),
      activeStrategies: Array.from(this.strategies.values()).filter(s => s.enabled).length,
      totalSignals: this.activeSignals.size,
      portfolio: this.getPortfolio()
    };
  }

  public async configureExchange(
    exchangeId: string, 
    credentials: any, 
    settings: any
  ): Promise<void> {
    // Exchange konfigürasyonu - güvenli credential storage
    const encryptedCredentials: any = {};
    
    Object.keys(credentials).forEach(key => {
      encryptedCredentials[key] = GlobalExchangeRegistry.encryptApiKey(credentials[key]);
    });
    
    const userConfig: UserExchangeConfig = {
      exchangeId,
      userId: 'default', // Gerçek uygulamada user ID kullanılacak
      enabled: true,
      credentials: encryptedCredentials,
      settings: {
        paperTrading: settings.paperTrading || true,
        maxRiskPerTrade: settings.maxRiskPerTrade || 2,
        maxDailyRisk: settings.maxDailyRisk || 5,
        allowedAssets: settings.allowedAssets || ['*'],
        tradingHours: settings.tradingHours || {
          enabled: false,
          timezone: 'UTC',
          schedule: {}
        }
      },
      aiSettings: {
        enabled: settings.aiEnabled || true,
        confidenceThreshold: settings.confidenceThreshold || 0.7,
        maxConcurrentTrades: settings.maxConcurrentTrades || 10,
        strategies: settings.strategies || ['global_momentum']
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.userConfigs.set(exchangeId, userConfig);
    console.log(`⚙️ ${exchangeId} exchange konfigürasyonu tamamlandı`);
  }
}

export default GlobalAITradingBot;