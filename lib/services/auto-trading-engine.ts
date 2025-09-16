/**
 * Auto Trading Engine - AI Destekli Otomatik Trading Sistemi
 * Z.AI GLM-4.5 ile güçlendirilmiş gelişmiş trading algoritmaları
 */

import ZAIService, { MarketAnalysis, PortfolioAnalysis } from './zai-service';

interface TradingSignal {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'CLOSE';
  quantity: number;
  price: number;
  confidence: number;
  reasoning: string;
  timestamp: Date;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  stop_loss?: number;
  take_profit?: number;
  expires_at?: Date;
}

interface TradingScenario {
  id: string;
  name: string;
  description: string;
  conditions: string[];
  actions: TradingAction[];
  risk_management: RiskRule[];
  is_active: boolean;
  performance: {
    total_trades: number;
    win_rate: number;
    avg_return: number;
    max_drawdown: number;
    sharpe_ratio: number;
  };
}

interface TradingAction {
  symbol: string;
  action: 'BUY' | 'SELL' | 'CLOSE' | 'ADJUST';
  quantity_type: 'PERCENTAGE' | 'FIXED' | 'DYNAMIC';
  quantity_value: number;
  conditions: TriggerCondition[];
  risk_controls: RiskControl[];
}

interface TriggerCondition {
  type: 'PRICE' | 'RSI' | 'MACD' | 'VOLUME' | 'NEWS' | 'AI_SIGNAL';
  operator: 'GT' | 'LT' | 'EQ' | 'CROSS_UP' | 'CROSS_DOWN';
  value: number | string;
  timeframe?: string;
}

interface RiskControl {
  type: 'STOP_LOSS' | 'TAKE_PROFIT' | 'MAX_POSITION' | 'MAX_DAILY_LOSS';
  value: number;
  is_percentage: boolean;
}

interface RiskRule {
  name: string;
  max_position_size: number;
  max_daily_loss: number;
  max_drawdown: number;
  correlation_limits: Record<string, number>;
}

interface MarketDataPoint {
  symbol: string;
  price: number;
  volume: number;
  change_24h: number;
  market_cap: number;
  timestamp: Date;
  technical_indicators: {
    rsi: number;
    macd: { value: number; signal: number; histogram: number };
    bollinger_bands: { upper: number; middle: number; lower: number };
    moving_averages: { ma20: number; ma50: number; ma200: number };
    volume_profile: any;
  };
}

class AutoTradingEngine {
  private zaiService: ZAIService;
  private scenarios: Map<string, TradingScenario> = new Map();
  private activeSignals: Map<string, TradingSignal> = new Map();
  private marketData: Map<string, MarketDataPoint> = new Map();
  private portfolioData: any = {};
  private isRunning = false;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(zaiApiKey?: string) {
    this.zaiService = new ZAIService(zaiApiKey);
    this.initializeDefaultScenarios();
  }

  /**
   * Varsayılan trading senaryolarını yükle
   */
  private initializeDefaultScenarios() {
    const scenarios: TradingScenario[] = [
      {
        id: 'momentum_scalp',
        name: '🚀 Momentum Scalping',
        description: 'Kısa vadeli momentum fırsatlarını yakala',
        conditions: [
          'RSI > 70 veya RSI < 30',
          'Volume spike > 150%',
          'AI confidence > 80%'
        ],
        actions: [
          {
            symbol: 'dynamic', // Dinamik sembol seçimi
            action: 'BUY',
            quantity_type: 'PERCENTAGE',
            quantity_value: 5, // Portföyün %5'i
            conditions: [
              { type: 'RSI', operator: 'LT', value: 30 },
              { type: 'AI_SIGNAL', operator: 'GT', value: 80 },
              { type: 'VOLUME', operator: 'GT', value: 1.5 }
            ],
            risk_controls: [
              { type: 'STOP_LOSS', value: 3, is_percentage: true },
              { type: 'TAKE_PROFIT', value: 8, is_percentage: true }
            ]
          }
        ],
        risk_management: [
          {
            name: 'Conservative Risk',
            max_position_size: 10,
            max_daily_loss: 3,
            max_drawdown: 8,
            correlation_limits: { 'BTC': 0.7, 'ETH': 0.5 }
          }
        ],
        is_active: false,
        performance: {
          total_trades: 0,
          win_rate: 0,
          avg_return: 0,
          max_drawdown: 0,
          sharpe_ratio: 0
        }
      },
      {
        id: 'trend_following',
        name: '📈 Trend Following',
        description: 'Güçlü trendleri takip et ve kârını maksimize et',
        conditions: [
          'MA20 > MA50 > MA200',
          'MACD histogram pozitif',
          'AI trend güveni > 75%'
        ],
        actions: [
          {
            symbol: 'dynamic',
            action: 'BUY',
            quantity_type: 'DYNAMIC',
            quantity_value: 0, // AI tarafından belirlenecek
            conditions: [
              { type: 'MACD', operator: 'CROSS_UP', value: 0 },
              { type: 'AI_SIGNAL', operator: 'GT', value: 75 }
            ],
            risk_controls: [
              { type: 'STOP_LOSS', value: 5, is_percentage: true },
              { type: 'TAKE_PROFIT', value: 20, is_percentage: true }
            ]
          }
        ],
        risk_management: [
          {
            name: 'Trend Risk',
            max_position_size: 15,
            max_daily_loss: 5,
            max_drawdown: 12,
            correlation_limits: { 'BTC': 0.8, 'ETH': 0.6 }
          }
        ],
        is_active: false,
        performance: {
          total_trades: 0,
          win_rate: 0,
          avg_return: 0,
          max_drawdown: 0,
          sharpe_ratio: 0
        }
      },
      {
        id: 'ai_arbitrage',
        name: '🤖 AI Arbitraj',
        description: 'Yapay zeka destekli arbitraj fırsatları',
        conditions: [
          'Cross-exchange fiyat farkı > %1.5',
          'Likidite yeterli',
          'AI risk skoru < 50'
        ],
        actions: [
          {
            symbol: 'dynamic',
            action: 'BUY',
            quantity_type: 'FIXED',
            quantity_value: 1000, // $1000 fixed
            conditions: [
              { type: 'AI_SIGNAL', operator: 'GT', value: 85 }
            ],
            risk_controls: [
              { type: 'STOP_LOSS', value: 2, is_percentage: true },
              { type: 'TAKE_PROFIT', value: 3, is_percentage: true }
            ]
          }
        ],
        risk_management: [
          {
            name: 'Arbitrage Risk',
            max_position_size: 20,
            max_daily_loss: 2,
            max_drawdown: 5,
            correlation_limits: {}
          }
        ],
        is_active: false,
        performance: {
          total_trades: 0,
          win_rate: 0,
          avg_return: 0,
          max_drawdown: 0,
          sharpe_ratio: 0
        }
      }
    ];

    scenarios.forEach(scenario => {
      this.scenarios.set(scenario.id, scenario);
    });
  }

  /**
   * Auto trading sistemini başlat
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    console.log('🤖 Auto Trading Engine başlatılıyor...');
    
    // Z.AI bağlantısını test et
    const isZAIReady = await this.zaiService.healthCheck();
    if (!isZAIReady) {
      console.warn('⚠️ Z.AI service not available - using fallback analysis');
    }

    this.isRunning = true;
    
    // Ana döngüyü başlat (10 saniyede bir analiz)
    this.updateInterval = setInterval(async () => {
      await this.runAnalysisCycle();
    }, 10000);

    console.log('✅ Auto Trading Engine aktif');
  }

  /**
   * Auto trading sistemini durdur
   */
  stop(): void {
    if (!this.isRunning) return;

    console.log('🛑 Auto Trading Engine durduruluyor...');
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.isRunning = false;
    console.log('✅ Auto Trading Engine durduruldu');
  }

  /**
   * Ana analiz döngüsü
   */
  private async runAnalysisCycle(): Promise<void> {
    try {
      // 1. Market verilerini güncelle
      await this.updateMarketData();

      // 2. Aktif senaryoları kontrol et
      await this.checkActiveScenarios();

      // 3. Yeni trading fırsatlarını ara
      await this.scanForOpportunities();

      // 4. Risk kontrollerini yap
      await this.performRiskChecks();

      // 5. Aktif pozisyonları izle
      await this.monitorActivePositions();

    } catch (error) {
      console.error('Analysis cycle error:', error);
    }
  }

  /**
   * Market verilerini güncelle
   */
  private async updateMarketData(): Promise<void> {
    // Bu gerçek implementasyonda crypto API'lerinden veri çekilecek
    const symbols = ['BTC', 'ETH', 'ADA', 'SOL', 'MATIC', 'DOT'];
    
    for (const symbol of symbols) {
      // Simülasyon verisi - gerçek implementasyonda API çağrısı yapılacak
      const mockData: MarketDataPoint = {
        symbol,
        price: Math.random() * 50000 + 20000,
        volume: Math.random() * 1000000000,
        change_24h: (Math.random() - 0.5) * 20,
        market_cap: Math.random() * 100000000000,
        timestamp: new Date(),
        technical_indicators: {
          rsi: Math.random() * 100,
          macd: {
            value: (Math.random() - 0.5) * 1000,
            signal: (Math.random() - 0.5) * 1000,
            histogram: (Math.random() - 0.5) * 500
          },
          bollinger_bands: {
            upper: Math.random() * 55000 + 30000,
            middle: Math.random() * 50000 + 25000,
            lower: Math.random() * 45000 + 20000
          },
          moving_averages: {
            ma20: Math.random() * 50000 + 20000,
            ma50: Math.random() * 45000 + 22000,
            ma200: Math.random() * 40000 + 25000
          },
          volume_profile: {}
        }
      };

      this.marketData.set(symbol, mockData);
    }
  }

  /**
   * Aktif senaryoları kontrol et
   */
  private async checkActiveScenarios(): Promise<void> {
    for (const [scenarioId, scenario] of this.scenarios) {
      if (!scenario.is_active) continue;

      for (const action of scenario.actions) {
        const symbol = action.symbol === 'dynamic' 
          ? await this.selectBestSymbol(action.conditions)
          : action.symbol;

        if (symbol && await this.checkConditions(symbol, action.conditions)) {
          await this.executeAction(scenarioId, symbol, action);
        }
      }
    }
  }

  /**
   * Yeni fırsatları tara
   */
  private async scanForOpportunities(): Promise<void> {
    for (const [symbol, data] of this.marketData) {
      try {
        // Z.AI ile detaylı analiz
        const analysis = await this.zaiService.analyzeMarket(
          symbol,
          {
            price: data.price,
            change_24h: data.change_24h,
            volume_24h: data.volume,
            market_cap: data.market_cap
          },
          data.technical_indicators
        );

        if (analysis.confidence > 70 && analysis.action !== 'HOLD') {
          const signal: TradingSignal = {
            id: `${symbol}_${Date.now()}`,
            symbol,
            action: analysis.action as any,
            quantity: this.calculatePositionSize(symbol, analysis.risk_level),
            price: data.price,
            confidence: analysis.confidence,
            reasoning: analysis.reasoning,
            timestamp: new Date(),
            risk_level: analysis.risk_level,
            stop_loss: analysis.stop_loss,
            take_profit: analysis.target_price,
            expires_at: new Date(Date.now() + 3600000) // 1 saat
          };

          this.activeSignals.set(signal.id, signal);
          console.log(`🚨 Yeni trading sinyali: ${signal.symbol} ${signal.action} (${signal.confidence}%)`);
        }
      } catch (error) {
        console.error(`Analysis error for ${symbol}:`, error);
      }
    }
  }

  /**
   * Risk kontrollerini gerçekleştir
   */
  private async performRiskChecks(): Promise<void> {
    // Portfolio risk analizi
    const holdings = Array.from(this.marketData.entries()).map(([symbol, data]) => ({
      symbol,
      quantity: Math.random() * 10, // Mock veri
      value: data.price * Math.random() * 10
    }));

    const marketDataArray = Array.from(this.marketData.values());
    
    try {
      const portfolioAnalysis = await this.zaiService.analyzePortfolio(holdings, marketDataArray);
      
      if (portfolioAnalysis.risk_score > 80) {
        console.warn('⚠️ Yüksek risk tespit edildi - pozisyonlar azaltılıyor');
        await this.reduceRiskyPositions();
      }
    } catch (error) {
      console.error('Risk analysis error:', error);
    }
  }

  /**
   * Aktif pozisyonları izle
   */
  private async monitorActivePositions(): Promise<void> {
    const now = new Date();
    
    for (const [signalId, signal] of this.activeSignals) {
      // Süresi dolmuş sinyalleri temizle
      if (signal.expires_at && now > signal.expires_at) {
        this.activeSignals.delete(signalId);
        console.log(`⏰ Sinyalin süresi doldu: ${signal.symbol} ${signal.action}`);
        continue;
      }

      const currentData = this.marketData.get(signal.symbol);
      if (!currentData) continue;

      const currentPrice = currentData.price;
      const entryPrice = signal.price;

      // Stop loss ve take profit kontrolü
      if (signal.action === 'BUY') {
        if (signal.stop_loss && currentPrice <= signal.stop_loss) {
          console.log(`🛑 Stop loss tetiklendi: ${signal.symbol} ${currentPrice}`);
          await this.closePosition(signal);
        } else if (signal.take_profit && currentPrice >= signal.take_profit) {
          console.log(`💰 Take profit tetiklendi: ${signal.symbol} ${currentPrice}`);
          await this.closePosition(signal);
        }
      }
    }
  }

  /**
   * Koşulları kontrol et
   */
  private async checkConditions(symbol: string, conditions: TriggerCondition[]): Promise<boolean> {
    const data = this.marketData.get(symbol);
    if (!data) return false;

    for (const condition of conditions) {
      let conditionMet = false;

      switch (condition.type) {
        case 'PRICE':
          conditionMet = this.evaluateNumericCondition(
            data.price, condition.operator as any, condition.value as number
          );
          break;
        
        case 'RSI':
          conditionMet = this.evaluateNumericCondition(
            data.technical_indicators.rsi, condition.operator as any, condition.value as number
          );
          break;
        
        case 'VOLUME':
          conditionMet = this.evaluateNumericCondition(
            data.volume, condition.operator as any, condition.value as number
          );
          break;
          
        case 'AI_SIGNAL':
          // Z.AI confidence threshold
          try {
            const analysis = await this.zaiService.analyzeMarket(symbol, data, data.technical_indicators);
            conditionMet = analysis.confidence >= (condition.value as number);
          } catch {
            conditionMet = false;
          }
          break;
      }

      if (!conditionMet) return false;
    }

    return true;
  }

  /**
   * Sayısal koşulu değerlendir
   */
  private evaluateNumericCondition(value: number, operator: 'GT' | 'LT' | 'EQ', target: number): boolean {
    switch (operator) {
      case 'GT': return value > target;
      case 'LT': return value < target;
      case 'EQ': return Math.abs(value - target) < 0.001;
      default: return false;
    }
  }

  /**
   * En iyi sembolü seç
   */
  private async selectBestSymbol(conditions: TriggerCondition[]): Promise<string | null> {
    const symbols = Array.from(this.marketData.keys());
    let bestSymbol = null;
    let bestScore = 0;

    for (const symbol of symbols) {
      try {
        const data = this.marketData.get(symbol)!;
        const analysis = await this.zaiService.analyzeMarket(symbol, data, data.technical_indicators);
        
        if (analysis.confidence > bestScore) {
          bestScore = analysis.confidence;
          bestSymbol = symbol;
        }
      } catch {
        continue;
      }
    }

    return bestScore > 70 ? bestSymbol : null;
  }

  /**
   * Pozisyon büyüklüğünü hesapla
   */
  private calculatePositionSize(symbol: string, riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'): number {
    const baseSize = 1000; // $1000 base position
    const riskMultiplier = {
      'LOW': 0.5,
      'MEDIUM': 1.0,
      'HIGH': 0.3
    };

    return baseSize * riskMultiplier[riskLevel];
  }

  /**
   * Action'ı gerçekleştir
   */
  private async executeAction(scenarioId: string, symbol: string, action: TradingAction): Promise<void> {
    console.log(`🎯 Action executing: ${scenarioId} - ${symbol} ${action.action}`);
    
    // Gerçek implementasyonda burada exchange API'sine order gönderilecek
    // Şimdilik log'da takip ediyoruz
    
    const scenario = this.scenarios.get(scenarioId);
    if (scenario) {
      scenario.performance.total_trades++;
    }
  }

  /**
   * Pozisyonu kapat
   */
  private async closePosition(signal: TradingSignal): Promise<void> {
    console.log(`📤 Closing position: ${signal.symbol} ${signal.action}`);
    this.activeSignals.delete(signal.id);
    
    // Gerçek implementasyonda exchange API'sine close order gönderilecek
  }

  /**
   * Riskli pozisyonları azalt
   */
  private async reduceRiskyPositions(): Promise<void> {
    // Risk azaltma stratejileri implementasyonu
    console.log('🔄 Risk reduction strategies activated');
  }

  /**
   * Senaryoyu aktif/deaktif et
   */
  toggleScenario(scenarioId: string, active: boolean): boolean {
    const scenario = this.scenarios.get(scenarioId);
    if (scenario) {
      scenario.is_active = active;
      console.log(`${active ? '✅' : '❌'} Scenario ${scenario.name}: ${active ? 'activated' : 'deactivated'}`);
      return true;
    }
    return false;
  }

  /**
   * Manuel trading sinyali gönder
   */
  async sendManualSignal(query: string): Promise<string> {
    try {
      const marketContext = Array.from(this.marketData.entries()).reduce((acc, [symbol, data]) => {
        acc[symbol] = {
          price: data.price,
          change_24h: data.change_24h,
          rsi: data.technical_indicators.rsi
        };
        return acc;
      }, {} as Record<string, any>);

      const response = await this.zaiService.queryAI(
        `Trading sorusu: ${query}`,
        { market_data: marketContext, portfolio: this.portfolioData }
      );

      // AI'nin önerdiği action'ları parse et ve uygula
      if (response.toLowerCase().includes('al') || response.toLowerCase().includes('buy')) {
        console.log('🤖 AI recommendation: BUY signal detected');
      }

      return response;
    } catch (error) {
      console.error('Manual signal error:', error);
      return 'Manuel sinyal işlenirken hata oluştu: ' + (error as Error).message;
    }
  }

  /**
   * Mevcut durumu getir
   */
  getStatus() {
    return {
      is_running: this.isRunning,
      active_scenarios: Array.from(this.scenarios.values()).filter(s => s.is_active).length,
      total_scenarios: this.scenarios.size,
      active_signals: this.activeSignals.size,
      monitored_symbols: this.marketData.size
    };
  }

  /**
   * Senaryoları listele
   */
  getScenarios() {
    return Array.from(this.scenarios.values());
  }

  /**
   * Aktif sinyalleri getir
   */
  getActiveSignals() {
    return Array.from(this.activeSignals.values());
  }
}

export default AutoTradingEngine;
export type { TradingSignal, TradingScenario, TradingAction };
