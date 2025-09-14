// Micro-structure analysis for high-frequency signals
import { PriceData } from './features';

export interface MicroStructure {
  // Orderbook-related
  obImbalance: number;        // Buy/Sell pressure [-1, +1]
  spreadPct: number;          // Bid-ask spread as % of mid
  depthImbalance: number;     // Depth asymmetry [-1, +1]
  
  // Price action micro
  wickRatio: number;          // Wick to body ratio
  gapFillProbability: number; // Gap fill likelihood [0, 1]
  microTrendScore: number;    // 1-5m trend consistency [0, 1]
  volumeProfile: number;      // Volume at price clustering
  
  // Market microstructure
  tickDirection: number;      // Recent tick movements [-1, +1]
  velocityScore: number;      // Price movement speed [0, 1]
  momentumShift: number;      // Momentum direction change [-1, +1]
  
  // Volatility burst detection
  volBurstScore: number;      // Sudden volatility increase [0, 1]
  priceJumpScore: number;     // Abnormal price jumps [0, 1]
}

export interface OrderbookData {
  bids: [number, number][];   // [price, size]
  asks: [number, number][];   // [price, size]
  timestamp: number;
}

export class MicroAnalyzer {
  private priceHistory: number[] = [];
  private volumeHistory: number[] = [];
  private spreadHistory: number[] = [];
  
  constructor(private maxHistory = 100) {}
  
  analyzeMicroStructure(
    recentData: PriceData[],
    orderbook?: OrderbookData
  ): MicroStructure {
    
    if (recentData.length < 5) {
      return this.getDefaultMicroStructure();
    }
    
    // Update histories
    const currentPrice = recentData[recentData.length - 1].close;
    const currentVolume = recentData[recentData.length - 1].volume;
    
    this.updateHistory(this.priceHistory, currentPrice);
    this.updateHistory(this.volumeHistory, currentVolume);
    
    // Calculate micro features
    const wickRatio = this.calculateWickRatio(recentData.slice(-10));
    const microTrendScore = this.calculateMicroTrend(recentData.slice(-20));
    const tickDirection = this.calculateTickDirection(this.priceHistory.slice(-10));
    const velocityScore = this.calculateVelocityScore(recentData.slice(-5));
    const momentumShift = this.calculateMomentumShift(recentData.slice(-10));
    const volBurstScore = this.calculateVolatilityBurst(recentData.slice(-20));
    const priceJumpScore = this.calculatePriceJumps(recentData.slice(-10));
    const gapFillProbability = this.calculateGapFillProbability(recentData.slice(-20));
    const volumeProfile = this.calculateVolumeProfile(recentData.slice(-50));
    
    // Orderbook analysis (if available)
    let obImbalance = 0;
    let spreadPct = 0;
    let depthImbalance = 0;
    
    if (orderbook) {
      const obAnalysis = this.analyzeOrderbook(orderbook);
      obImbalance = obAnalysis.imbalance;
      spreadPct = obAnalysis.spreadPct;
      depthImbalance = obAnalysis.depthImbalance;
      
      this.updateHistory(this.spreadHistory, spreadPct);
    }
    
    return {
      obImbalance,
      spreadPct,
      depthImbalance,
      wickRatio,
      gapFillProbability,
      microTrendScore,
      volumeProfile,
      tickDirection,
      velocityScore,
      momentumShift,
      volBurstScore,
      priceJumpScore
    };
  }
  
  private updateHistory(history: number[], value: number): void {
    history.push(value);
    if (history.length > this.maxHistory) {
      history.shift();
    }
  }
  
  private calculateWickRatio(data: PriceData[]): number {
    if (data.length === 0) return 0;
    
    const wickRatios = data.map(candle => {
      const bodySize = Math.abs(candle.close - candle.open);
      const totalSize = candle.high - candle.low;
      const upperWick = candle.high - Math.max(candle.open, candle.close);
      const lowerWick = Math.min(candle.open, candle.close) - candle.low;
      const totalWick = upperWick + lowerWick;
      
      return totalSize > 0 ? totalWick / totalSize : 0;
    });
    
    return this.mean(wickRatios);
  }
  
  private calculateMicroTrend(data: PriceData[]): number {
    if (data.length < 5) return 0.5;
    
    const closes = data.map(d => d.close);
    let trendScore = 0;
    let consistentMoves = 0;
    
    for (let i = 1; i < closes.length; i++) {
      const direction = closes[i] > closes[i-1] ? 1 : -1;
      const prevDirection = i > 1 ? (closes[i-1] > closes[i-2] ? 1 : -1) : direction;
      
      if (direction === prevDirection) {
        consistentMoves++;
      }
    }
    
    trendScore = consistentMoves / (closes.length - 1);
    return Math.max(0, Math.min(1, trendScore));
  }
  
  private calculateTickDirection(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    let upTicks = 0;
    let downTicks = 0;
    
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > prices[i-1]) upTicks++;
      else if (prices[i] < prices[i-1]) downTicks++;
    }
    
    const totalTicks = upTicks + downTicks;
    return totalTicks > 0 ? (upTicks - downTicks) / totalTicks : 0;
  }
  
  private calculateVelocityScore(data: PriceData[]): number {
    if (data.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      returns.push(Math.abs((data[i].close - data[i-1].close) / data[i-1].close));
    }
    
    const avgReturn = this.mean(returns);
    const stdReturn = this.standardDeviation(returns);
    
    // Normalize velocity (higher = more volatile movement)
    return Math.min(1, (avgReturn + stdReturn) * 100);
  }
  
  private calculateMomentumShift(data: PriceData[]): number {
    if (data.length < 6) return 0;
    
    const mid = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, mid);
    const secondHalf = data.slice(mid);
    
    const firstMomentum = this.calculateSimpleMomentum(firstHalf);
    const secondMomentum = this.calculateSimpleMomentum(secondHalf);
    
    // Detect momentum reversal
    if ((firstMomentum > 0 && secondMomentum < 0) || (firstMomentum < 0 && secondMomentum > 0)) {
      return Math.sign(secondMomentum);
    }
    
    return 0;
  }
  
  private calculateSimpleMomentum(data: PriceData[]): number {
    if (data.length < 2) return 0;
    const first = data[0].close;
    const last = data[data.length - 1].close;
    return (last - first) / first;
  }
  
  private calculateVolatilityBurst(data: PriceData[]): number {
    if (data.length < 10) return 0;
    
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      returns.push(Math.abs((data[i].close - data[i-1].close) / data[i-1].close));
    }
    
    const recentReturns = returns.slice(-5);
    const historicalReturns = returns.slice(0, -5);
    
    if (historicalReturns.length === 0) return 0;
    
    const recentAvg = this.mean(recentReturns);
    const historicalAvg = this.mean(historicalReturns);
    const historicalStd = this.standardDeviation(historicalReturns);
    
    // Z-score of recent volatility vs historical
    if (historicalStd === 0) return 0;
    const zScore = (recentAvg - historicalAvg) / historicalStd;
    
    return Math.max(0, Math.min(1, zScore / 3)); // Normalize to [0,1]
  }
  
  private calculatePriceJumps(data: PriceData[]): number {
    if (data.length < 5) return 0;
    
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      returns.push(Math.abs((data[i].close - data[i-1].close) / data[i-1].close));
    }
    
    const avgReturn = this.mean(returns);
    const stdReturn = this.standardDeviation(returns);
    
    if (stdReturn === 0) return 0;
    
    // Count returns > 2 standard deviations
    const threshold = avgReturn + 2 * stdReturn;
    const jumps = returns.filter(r => r > threshold).length;
    
    return Math.min(1, jumps / returns.length);
  }
  
  private calculateGapFillProbability(data: PriceData[]): number {
    if (data.length < 10) return 0.5;
    
    let gapsFilled = 0;
    let totalGaps = 0;
    
    for (let i = 1; i < data.length - 5; i++) {
      const prevClose = data[i-1].close;
      const currentOpen = data[i].open;
      
      // Detect gap
      const gapSize = Math.abs(currentOpen - prevClose) / prevClose;
      if (gapSize > 0.001) { // 0.1% minimum gap
        totalGaps++;
        
        // Check if gap was filled in next 5 periods
        const gapHigh = Math.max(prevClose, currentOpen);
        const gapLow = Math.min(prevClose, currentOpen);
        
        for (let j = i + 1; j < Math.min(i + 6, data.length); j++) {
          if (data[j].low <= gapLow && data[j].high >= gapHigh) {
            gapsFilled++;
            break;
          }
        }
      }
    }
    
    return totalGaps > 0 ? gapsFilled / totalGaps : 0.5;
  }
  
  private calculateVolumeProfile(data: PriceData[]): number {
    if (data.length < 20) return 0.5;
    
    // Simple volume-weighted average price clustering
    const vwap = this.calculateVWAP(data);
    const currentPrice = data[data.length - 1].close;
    const priceDistance = Math.abs(currentPrice - vwap) / vwap;
    
    // Closer to VWAP = higher clustering score
    return Math.max(0, 1 - priceDistance * 10);
  }
  
  private calculateVWAP(data: PriceData[]): number {
    let volumeWeightedSum = 0;
    let totalVolume = 0;
    
    for (const candle of data) {
      const typicalPrice = (candle.high + candle.low + candle.close) / 3;
      volumeWeightedSum += typicalPrice * candle.volume;
      totalVolume += candle.volume;
    }
    
    return totalVolume > 0 ? volumeWeightedSum / totalVolume : 0;
  }
  
  private analyzeOrderbook(orderbook: OrderbookData): {
    imbalance: number;
    spreadPct: number;
    depthImbalance: number;
  } {
    const bids = orderbook.bids || [];
    const asks = orderbook.asks || [];
    
    if (bids.length === 0 || asks.length === 0) {
      return { imbalance: 0, spreadPct: 0, depthImbalance: 0 };
    }
    
    const bestBid = bids[0][0];
    const bestAsk = asks[0][0];
    const midPrice = (bestBid + bestAsk) / 2;
    
    // Spread calculation
    const spreadPct = (bestAsk - bestBid) / midPrice * 100;
    
    // Orderbook imbalance (top 5 levels)
    const topBids = bids.slice(0, 5);
    const topAsks = asks.slice(0, 5);
    
    const bidVolume = topBids.reduce((sum, [_, size]) => sum + size, 0);
    const askVolume = topAsks.reduce((sum, [_, size]) => sum + size, 0);
    
    const totalVolume = bidVolume + askVolume;
    const imbalance = totalVolume > 0 ? (bidVolume - askVolume) / totalVolume : 0;
    
    // Depth imbalance (weighted by distance from mid)
    const bidDepth = this.calculateWeightedDepth(topBids, midPrice, true);
    const askDepth = this.calculateWeightedDepth(topAsks, midPrice, false);
    
    const totalDepth = bidDepth + askDepth;
    const depthImbalance = totalDepth > 0 ? (bidDepth - askDepth) / totalDepth : 0;
    
    return { imbalance, spreadPct, depthImbalance };
  }
  
  private calculateWeightedDepth(levels: [number, number][], midPrice: number, isBid: boolean): number {
    let weightedDepth = 0;
    
    for (const [price, size] of levels) {
      const distance = Math.abs(price - midPrice) / midPrice;
      const weight = 1 / (1 + distance * 10); // Closer levels have higher weight
      weightedDepth += size * weight;
    }
    
    return weightedDepth;
  }
  
  private getDefaultMicroStructure(): MicroStructure {
    return {
      obImbalance: 0,
      spreadPct: 0,
      depthImbalance: 0,
      wickRatio: 0.3,
      gapFillProbability: 0.5,
      microTrendScore: 0.5,
      volumeProfile: 0.5,
      tickDirection: 0,
      velocityScore: 0,
      momentumShift: 0,
      volBurstScore: 0,
      priceJumpScore: 0
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
export const microAnalyzer = new MicroAnalyzer();
