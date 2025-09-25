import { EventEmitter } from 'events';
import { MarketData, Candle } from '../engines/UniversalMarketDataEngine';

export interface AIPrediction {
  symbol: string;
  direction: 'UP' | 'DOWN' | 'SIDEWAYS';
  confidence: number;
  price: number;
  timeframe: string;
  models: string[];
  timestamp: number;
}

export class CompactAIPipeline extends EventEmitter {
  private models = ['LSTM', 'CNN', 'Transformer'];
  private performance = new Map<string, number>();
  
  constructor() {
    super();
    this.initModels();
  }

  private initModels() {
    this.models.forEach(model => {
      this.performance.set(model, 70 + Math.random() * 20);
    });
    console.log('🤖 Compact AI Pipeline hazır');
  }

  public async predict(symbol: string, data: Candle[], market: MarketData): Promise<AIPrediction> {
    const features = this.extractFeatures(data, market);
    const predictions = this.models.map(model => this.modelPredict(model, features));
    
    // Ensemble
    const avgConf = predictions.reduce((a, b) => a + b.confidence, 0) / predictions.length;
    const direction = this.getMajorityDirection(predictions);
    
    return {
      symbol,
      direction,
      confidence: Math.min(avgConf * 1.1, 0.95),
      price: this.calculateTargetPrice(market.price, direction, avgConf),
      timeframe: '1h',
      models: this.models,
      timestamp: Date.now()
    };
  }

  private extractFeatures(data: Candle[], market: MarketData): number[] {
    if (data.length < 20) return [];
    
    const prices = data.map(d => d.close);
    const volumes = data.map(d => d.volume);
    
    return [
      this.sma(prices, 10),
      this.sma(prices, 20),
      this.rsi(prices, 14),
      this.volatility(prices),
      market.price,
      market.volume,
      market.changePercent24h || 0
    ];
  }

  private sma(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    return prices.slice(-period).reduce((a, b) => a + b) / period;
  }

  private rsi(prices: number[], period: number): number {
    if (prices.length < period + 1) return 50;
    
    const changes = prices.slice(1).map((p, i) => p - prices[i]);
    const gains = changes.map(c => c > 0 ? c : 0);
    const losses = changes.map(c => c < 0 ? -c : 0);
    
    const avgGain = gains.slice(-period).reduce((a, b) => a + b) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b) / period;
    
    return avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
  }

  private volatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    const returns = prices.slice(1).map((p, i) => Math.log(p / prices[i]));
    const mean = returns.reduce((a, b) => a + b) / returns.length;
    const variance = returns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  private modelPredict(model: string, features: number[]): { confidence: number; direction: 'UP' | 'DOWN' | 'SIDEWAYS' } {
    // Simulated AI prediction
    const basePerf = this.performance.get(model) || 70;
    const confidence = (basePerf + Math.random() * 20) / 100;
    
    const rand = Math.random();
    let direction: 'UP' | 'DOWN' | 'SIDEWAYS';
    
    if (rand > 0.6) direction = 'UP';
    else if (rand < 0.4) direction = 'DOWN';
    else direction = 'SIDEWAYS';
    
    return { confidence, direction };
  }

  private getMajorityDirection(predictions: { direction: string }[]): 'UP' | 'DOWN' | 'SIDEWAYS' {
    const counts = { UP: 0, DOWN: 0, SIDEWAYS: 0 };
    predictions.forEach(p => counts[p.direction as keyof typeof counts]++);
    
    return Object.keys(counts).reduce((a, b) => 
      counts[a as keyof typeof counts] > counts[b as keyof typeof counts] ? a : b
    ) as 'UP' | 'DOWN' | 'SIDEWAYS';
  }

  private calculateTargetPrice(currentPrice: number, direction: string, confidence: number): number {
    const volatility = 0.02; // 2% volatility assumption
    const factor = volatility * confidence;
    
    switch (direction) {
      case 'UP': return currentPrice * (1 + factor);
      case 'DOWN': return currentPrice * (1 - factor);
      default: return currentPrice;
    }
  }

  public getPerformance(): Map<string, number> {
    return new Map(this.performance);
  }
}

export default CompactAIPipeline;