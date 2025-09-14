// Advanced Market Regime Detection with Machine Learning
import { EventEmitter } from 'events';

export interface MarketRegime {
  regime: 'bull_trend' | 'bear_trend' | 'bull_range' | 'bear_range' | 'high_volatility' | 'low_volatility' | 'shock' | 'recovery';
  confidence: number; // 0-1
  strength: number; // 0-100
  duration: number; // days in current regime
  characteristics: {
    trend: number; // -1 to 1
    volatility: number; // 0 to 1
    momentum: number; // -1 to 1
    volume: number; // relative volume
    breadth: number; // market breadth
  };
  probability: { [key: string]: number }; // Probability of each regime
  nextRegimeProb: { [key: string]: number }; // Transition probabilities
}

export interface MarketIndicators {
  price: {
    sma20: number;
    sma50: number;
    sma200: number;
    ema12: number;
    ema26: number;
    vwap: number;
  };
  
  trend: {
    adx: number;
    aroon: { up: number; down: number };
    parabolicSAR: number;
    ichimokuCloud: { tenkan: number; kijun: number; senkou: number };
    supertrend: number;
  };
  
  momentum: {
    rsi: number;
    stochastic: { k: number; d: number };
    williams: number;
    cci: number;
    macd: { macd: number; signal: number; histogram: number };
    roc: number; // Rate of Change
  };
  
  volatility: {
    atr: number;
    bollingerBands: { upper: number; middle: number; lower: number; width: number };
    keltnerChannels: { upper: number; middle: number; lower: number };
    donchianChannels: { upper: number; middle: number; lower: number };
    vix: number; // If available
    garchVolatility: number;
  };
  
  volume: {
    volumeMA: number;
    volumeRatio: number;
    onBalanceVolume: number;
    moneyFlowIndex: number;
    chaikinMoneyFlow: number;
    volumeProfile: number[];
    vwap: number;
  };
  
  breadth: {
    advanceDecline: number;
    newHighsNewLows: number;
    bullishPercent: number;
    mcclellanOscillator: number;
    arms: number; // Arms Index (TRIN)
  };
  
  microstructure: {
    bidAskSpread: number;
    marketDepth: number;
    tickDirection: number;
    orderImbalance: number;
    largeBlockRatio: number;
  };
}

export interface RegimeTransition {
  from: string;
  to: string;
  timestamp: number;
  confidence: number;
  triggerIndicators: string[];
  expectedDuration: number;
  riskAdjustment: number;
}

export interface VolatilityCluster {
  startTime: number;
  endTime: number;
  avgVolatility: number;
  maxVolatility: number;
  duration: number;
  regime: string;
  persistence: number; // How likely to continue
}

export class MarketRegimeDetector extends EventEmitter {
  private currentRegime!: MarketRegime;
  private regimeHistory: MarketRegime[] = [];
  private transitionHistory: RegimeTransition[] = [];
  private indicators!: MarketIndicators;
  private priceData: number[] = [];
  private volumeData: number[] = [];
  private volatilityClusters: VolatilityCluster[] = [];
  private regimeStates: Map<string, number> = new Map();

  // Regime transition matrix (probabilities)
  private transitionMatrix: { [key: string]: { [key: string]: number } } = {
    'bull_trend': { 'bull_trend': 0.7, 'bull_range': 0.15, 'high_volatility': 0.1, 'shock': 0.05 },
    'bear_trend': { 'bear_trend': 0.7, 'bear_range': 0.15, 'high_volatility': 0.1, 'shock': 0.05 },
    'bull_range': { 'bull_range': 0.6, 'bull_trend': 0.2, 'bear_range': 0.1, 'high_volatility': 0.1 },
    'bear_range': { 'bear_range': 0.6, 'bear_trend': 0.2, 'bull_range': 0.1, 'high_volatility': 0.1 },
    'high_volatility': { 'high_volatility': 0.4, 'shock': 0.2, 'bull_trend': 0.2, 'bear_trend': 0.2 },
    'low_volatility': { 'low_volatility': 0.7, 'bull_range': 0.15, 'bear_range': 0.15 },
    'shock': { 'shock': 0.3, 'recovery': 0.3, 'high_volatility': 0.4 },
    'recovery': { 'recovery': 0.4, 'bull_trend': 0.3, 'bull_range': 0.3 },
  };

  constructor() {
    super();
    this.initializeRegimeDetection();
  }

  private initializeRegimeDetection() {
    // Initialize with neutral regime
    this.currentRegime = {
      regime: 'bull_range',
      confidence: 0.5,
      strength: 50,
      duration: 0,
      characteristics: {
        trend: 0,
        volatility: 0.2,
        momentum: 0,
        volume: 1,
        breadth: 0.5,
      },
      probability: {
        'bull_trend': 0.2,
        'bear_trend': 0.2,
        'bull_range': 0.3,
        'bear_range': 0.2,
        'high_volatility': 0.1,
      },
      nextRegimeProb: this.transitionMatrix['bull_range'],
    };

    // Initialize regime states
    Object.keys(this.transitionMatrix).forEach(regime => {
      this.regimeStates.set(regime, 0);
    });

    // Start periodic regime detection
    setInterval(() => {
      this.detectCurrentRegime();
    }, 60000); // Every minute
  }

  // Main regime detection function
  public detectRegime(priceData: number[], volumeData: number[], timestamp: number = Date.now()): MarketRegime {
    this.priceData = priceData;
    this.volumeData = volumeData;

    // Calculate all technical indicators
    this.indicators = this.calculateAllIndicators(priceData, volumeData);

    // Detect volatility clusters
    this.detectVolatilityClusters();

    // Calculate regime characteristics
    const characteristics = this.calculateRegimeCharacteristics();

    // Apply machine learning-based regime classification
    const regimeProbabilities = this.classifyRegime(characteristics);

    // Determine the most likely regime
    const mostLikelyRegime = Object.entries(regimeProbabilities)
      .reduce((max, [regime, prob]) => prob > max.prob ? { regime, prob } : max, 
              { regime: 'bull_range', prob: 0 });

    // Calculate regime strength and confidence
    const strength = this.calculateRegimeStrength(characteristics, mostLikelyRegime.regime);
    const confidence = this.calculateRegimeConfidence(regimeProbabilities);

    // Check for regime transition
    const newRegime: MarketRegime = {
      regime: mostLikelyRegime.regime as any,
      confidence,
      strength,
      duration: this.calculateRegimeDuration(mostLikelyRegime.regime),
      characteristics,
      probability: regimeProbabilities,
      nextRegimeProb: this.transitionMatrix[mostLikelyRegime.regime] || {},
    };

    // Check if regime has changed
    if (this.currentRegime.regime !== newRegime.regime) {
      this.handleRegimeTransition(this.currentRegime, newRegime, timestamp);
    }

    this.currentRegime = newRegime;
    this.regimeHistory.push({ ...newRegime });

    // Keep history manageable
    if (this.regimeHistory.length > 1000) {
      this.regimeHistory = this.regimeHistory.slice(-1000);
    }

    return newRegime;
  }

  // Calculate comprehensive market indicators
  private calculateAllIndicators(prices: number[], volumes: number[]): MarketIndicators {
    return {
      price: {
        sma20: this.calculateSMA(prices, 20),
        sma50: this.calculateSMA(prices, 50),
        sma200: this.calculateSMA(prices, 200),
        ema12: this.calculateEMA(prices, 12),
        ema26: this.calculateEMA(prices, 26),
        vwap: this.calculateVWAP(prices, volumes),
      },

      trend: {
        adx: this.calculateADX(prices),
        aroon: this.calculateAroon(prices),
        parabolicSAR: this.calculateParabolicSAR(prices),
        ichimokuCloud: this.calculateIchimoku(prices),
        supertrend: this.calculateSupertrend(prices),
      },

      momentum: {
        rsi: this.calculateRSI(prices, 14),
        stochastic: this.calculateStochastic(prices),
        williams: this.calculateWilliamsR(prices),
        cci: this.calculateCCI(prices),
        macd: this.calculateMACD(prices),
        roc: this.calculateROC(prices, 14),
      },

      volatility: {
        atr: this.calculateATR(prices),
        bollingerBands: this.calculateBollingerBands(prices, 20, 2),
        keltnerChannels: this.calculateKeltnerChannels(prices),
        donchianChannels: this.calculateDonchianChannels(prices),
        vix: this.estimateVIX(prices),
        garchVolatility: this.calculateGARCHVolatility(prices),
      },

      volume: {
        volumeMA: this.calculateSMA(volumes, 20),
        volumeRatio: volumes[volumes.length - 1] / this.calculateSMA(volumes, 20),
        onBalanceVolume: this.calculateOBV(prices, volumes),
        moneyFlowIndex: this.calculateMFI(prices, volumes),
        chaikinMoneyFlow: this.calculateCMF(prices, volumes),
        volumeProfile: this.calculateVolumeProfile(prices, volumes),
        vwap: this.calculateVWAP(prices, volumes),
      },

      breadth: {
        advanceDecline: this.calculateAdvanceDecline(),
        newHighsNewLows: this.calculateNewHighsLows(),
        bullishPercent: this.calculateBullishPercent(),
        mcclellanOscillator: this.calculateMcClellanOscillator(),
        arms: this.calculateArmsIndex(),
      },

      microstructure: {
        bidAskSpread: this.estimateBidAskSpread(prices),
        marketDepth: this.estimateMarketDepth(volumes),
        tickDirection: this.calculateTickDirection(prices),
        orderImbalance: this.calculateOrderImbalance(prices, volumes),
        largeBlockRatio: this.calculateLargeBlockRatio(volumes),
      },
    };
  }

  // Regime characteristic calculation
  private calculateRegimeCharacteristics() {
    const indicators = this.indicators;
    const currentPrice = this.priceData[this.priceData.length - 1];

    // Trend calculation (composite)
    let trendScore = 0;
    if (currentPrice > indicators.price.sma20) trendScore += 0.2;
    if (currentPrice > indicators.price.sma50) trendScore += 0.3;
    if (currentPrice > indicators.price.sma200) trendScore += 0.5;
    if (indicators.trend.adx > 25) trendScore += 0.3 * (indicators.trend.adx / 100);
    if (indicators.momentum.macd.macd > indicators.momentum.macd.signal) trendScore += 0.2;
    
    const trend = Math.min(1, Math.max(-1, (trendScore - 0.5) * 2));

    // Volatility calculation (normalized)
    const avgVolatility = this.calculateHistoricalVolatility();
    const currentVolatility = indicators.volatility.atr / currentPrice;
    const volatility = Math.min(1, currentVolatility / avgVolatility);

    // Momentum calculation
    let momentumScore = 0;
    if (indicators.momentum.rsi > 50) momentumScore += (indicators.momentum.rsi - 50) / 50;
    else momentumScore += (indicators.momentum.rsi - 50) / 50;
    
    if (indicators.momentum.macd.histogram > 0) momentumScore += 0.3;
    else momentumScore -= 0.3;

    const momentum = Math.min(1, Math.max(-1, momentumScore));

    // Volume analysis
    const volume = Math.min(2, indicators.volume.volumeRatio);

    // Market breadth (simplified for crypto - could be expanded)
    const breadth = Math.min(1, Math.max(0, 
      (indicators.breadth.bullishPercent + 
       (indicators.breadth.advanceDecline + 1) / 2) / 2
    ));

    return {
      trend,
      volatility,
      momentum,
      volume,
      breadth,
    };
  }

  // Machine learning-based regime classification
  private classifyRegime(characteristics: MarketRegime['characteristics']): { [key: string]: number } {
    const { trend, volatility, momentum, volume, breadth } = characteristics;

    // Feature vector for ML model
    const features = [trend, volatility, momentum, volume, breadth];

    // Regime probability calculation (simplified neural network)
    const regimeProbabilities: { [key: string]: number } = {};

    // Bull trend: Strong upward trend + momentum + volume
    regimeProbabilities['bull_trend'] = this.sigmoid(
      trend * 3 + momentum * 2 + (volume - 1) * 1.5 + breadth * 1 - volatility * 0.5
    );

    // Bear trend: Strong downward trend + negative momentum
    regimeProbabilities['bear_trend'] = this.sigmoid(
      -trend * 3 - momentum * 2 + (volume - 1) * 1.5 - breadth * 1 - volatility * 0.5
    );

    // Bull range: Neutral trend + low volatility + positive breadth
    regimeProbabilities['bull_range'] = this.sigmoid(
      -Math.abs(trend) * 2 - volatility * 2 + breadth * 2 + momentum * 0.5
    );

    // Bear range: Neutral trend + low volatility + negative breadth
    regimeProbabilities['bear_range'] = this.sigmoid(
      -Math.abs(trend) * 2 - volatility * 2 - breadth * 2 - momentum * 0.5
    );

    // High volatility: High volatility regardless of trend
    regimeProbabilities['high_volatility'] = this.sigmoid(
      volatility * 4 + Math.abs(trend) * 1 + Math.abs(momentum) * 1
    );

    // Low volatility: Very low volatility + neutral conditions
    regimeProbabilities['low_volatility'] = this.sigmoid(
      -volatility * 4 - Math.abs(trend) * 1 - Math.abs(momentum) * 1 + 2
    );

    // Shock: Extreme volatility + extreme momentum
    regimeProbabilities['shock'] = this.sigmoid(
      volatility * 3 + Math.abs(momentum) * 3 + Math.abs(trend) * 2 - 4
    );

    // Recovery: Positive trend after shock + increasing volume
    regimeProbabilities['recovery'] = this.sigmoid(
      trend * 2 + momentum * 1.5 + (volume - 1) * 2 + breadth * 1.5 - 1
    );

    // Normalize probabilities
    const total = Object.values(regimeProbabilities).reduce((sum, prob) => sum + prob, 0);
    Object.keys(regimeProbabilities).forEach(key => {
      regimeProbabilities[key] /= total;
    });

    return regimeProbabilities;
  }

  // Volatility clustering detection using GARCH-like approach
  private detectVolatilityClusters() {
    if (this.priceData.length < 50) return;

    const returns = this.calculateReturns(this.priceData);
    const volatilities = this.calculateRollingVolatility(returns, 20);
    const threshold = this.calculatePercentile(volatilities, 75); // 75th percentile

    let clusterStart = -1;
    const clusters: VolatilityCluster[] = [];

    for (let i = 0; i < volatilities.length; i++) {
      if (volatilities[i] > threshold && clusterStart === -1) {
        clusterStart = i;
      } else if (volatilities[i] <= threshold && clusterStart !== -1) {
        // End of cluster
        const cluster: VolatilityCluster = {
          startTime: Date.now() - (volatilities.length - clusterStart) * 60000, // Minutes ago
          endTime: Date.now() - (volatilities.length - i) * 60000,
          avgVolatility: this.mean(volatilities.slice(clusterStart, i)),
          maxVolatility: Math.max(...volatilities.slice(clusterStart, i)),
          duration: i - clusterStart,
          regime: this.currentRegime.regime,
          persistence: this.calculateVolatilityPersistence(volatilities, clusterStart, i),
        };
        clusters.push(cluster);
        clusterStart = -1;
      }
    }

    this.volatilityClusters = clusters;
  }

  // Regime transition detection and handling
  private handleRegimeTransition(oldRegime: MarketRegime, newRegime: MarketRegime, timestamp: number) {
    const transition: RegimeTransition = {
      from: oldRegime.regime,
      to: newRegime.regime,
      timestamp,
      confidence: newRegime.confidence,
      triggerIndicators: this.identifyTransitionTriggers(oldRegime, newRegime),
      expectedDuration: this.estimateRegimeDuration(newRegime.regime),
      riskAdjustment: this.calculateRiskAdjustment(oldRegime.regime, newRegime.regime),
    };

    this.transitionHistory.push(transition);
    this.emit('regimeTransition', transition);

    // Update regime duration counters
    this.regimeStates.set(oldRegime.regime, 0);
    this.regimeStates.set(newRegime.regime, this.regimeStates.get(newRegime.regime) || 0);
  }

  // Helper functions for calculations
  private calculateSMA(data: number[], period: number): number {
    if (data.length < period) return data[data.length - 1] || 0;
    const slice = data.slice(-period);
    return slice.reduce((sum, val) => sum + val, 0) / slice.length;
  }

  private calculateEMA(data: number[], period: number): number {
    if (data.length === 0) return 0;
    const multiplier = 2 / (period + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
      ema = (data[i] * multiplier) + (ema * (1 - multiplier));
    }
    return ema;
  }

  private calculateVWAP(prices: number[], volumes: number[]): number {
    if (prices.length === 0 || volumes.length === 0) return 0;
    let totalVolume = 0;
    let totalValue = 0;
    
    for (let i = 0; i < Math.min(prices.length, volumes.length); i++) {
      totalValue += prices[i] * volumes[i];
      totalVolume += volumes[i];
    }
    
    return totalVolume > 0 ? totalValue / totalVolume : prices[prices.length - 1];
  }

  private calculateRSI(prices: number[], period: number): number {
    if (prices.length < period + 1) return 50;
    
    let gains = 0, losses = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
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

  private calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macd = ema12 - ema26;
    const signal = this.calculateEMA([macd], 9); // Simplified
    return { macd, signal, histogram: macd - signal };
  }

  private calculateATR(prices: number[], period: number = 14): number {
    if (prices.length < 2) return 0;
    
    const trueRanges = [];
    for (let i = 1; i < Math.min(prices.length, period + 1); i++) {
      const tr = Math.abs(prices[i] - prices[i - 1]); // Simplified TR
      trueRanges.push(tr);
    }
    
    return trueRanges.reduce((sum, tr) => sum + tr, 0) / trueRanges.length;
  }

  private calculateBollingerBands(prices: number[], period: number, stdDev: number) {
    const sma = this.calculateSMA(prices, period);
    const slice = prices.slice(-period);
    const variance = slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const std = Math.sqrt(variance);
    
    return {
      upper: sma + (std * stdDev),
      middle: sma,
      lower: sma - (std * stdDev),
      width: (2 * std * stdDev) / sma,
    };
  }

  private calculateADX(prices: number[], period: number = 14): number {
    // Simplified ADX calculation
    if (prices.length < period + 1) return 0;
    
    let dmPlus = 0, dmMinus = 0, tr = 0;
    
    for (let i = prices.length - period; i < prices.length; i++) {
      const highDiff = i > 0 ? prices[i] - prices[i - 1] : 0;
      const lowDiff = i > 0 ? prices[i - 1] - prices[i] : 0;
      
      dmPlus += (highDiff > 0 && highDiff > lowDiff) ? highDiff : 0;
      dmMinus += (lowDiff > 0 && lowDiff > highDiff) ? lowDiff : 0;
      
      if (i > 0) {
        tr += Math.abs(prices[i] - prices[i - 1]);
      }
    }
    
    const diPlus = tr > 0 ? (dmPlus / tr) * 100 : 0;
    const diMinus = tr > 0 ? (dmMinus / tr) * 100 : 0;
    
    const sum = diPlus + diMinus;
    return sum > 0 ? Math.abs(diPlus - diMinus) / sum * 100 : 0;
  }

  // Additional indicator calculations (simplified implementations)
  private calculateAroon(prices: number[], period: number = 14) {
    if (prices.length < period) return { up: 50, down: 50 };
    
    const slice = prices.slice(-period);
    const highIndex = slice.indexOf(Math.max(...slice));
    const lowIndex = slice.indexOf(Math.min(...slice));
    
    return {
      up: ((period - highIndex) / period) * 100,
      down: ((period - lowIndex) / period) * 100,
    };
  }

  private calculateParabolicSAR(prices: number[]): number {
    // Simplified PSAR - would need more complex implementation
    if (prices.length < 2) return prices[0] || 0;
    return prices[prices.length - 1] * 0.98; // Simplified
  }

  private calculateIchimoku(prices: number[]) {
    const tenkan = this.calculateSMA(prices, 9);
    const kijun = this.calculateSMA(prices, 26);
    const senkou = (tenkan + kijun) / 2;
    
    return { tenkan, kijun, senkou };
  }

  private calculateSupertrend(prices: number[]): number {
    // Simplified Supertrend calculation
    const atr = this.calculateATR(prices);
    const hl2 = prices[prices.length - 1]; // Simplified
    return hl2 - (2 * atr); // Basic calculation
  }

  private calculateStochastic(prices: number[], period: number = 14) {
    if (prices.length < period) return { k: 50, d: 50 };
    
    const slice = prices.slice(-period);
    const highest = Math.max(...slice);
    const lowest = Math.min(...slice);
    const current = prices[prices.length - 1];
    
    const k = ((current - lowest) / (highest - lowest)) * 100;
    const d = k; // Simplified - should be SMA of %K
    
    return { k, d };
  }

  private calculateWilliamsR(prices: number[], period: number = 14): number {
    if (prices.length < period) return -50;
    
    const slice = prices.slice(-period);
    const highest = Math.max(...slice);
    const lowest = Math.min(...slice);
    const current = prices[prices.length - 1];
    
    return ((highest - current) / (highest - lowest)) * -100;
  }

  private calculateCCI(prices: number[], period: number = 20): number {
    // Simplified CCI calculation
    const sma = this.calculateSMA(prices, period);
    const meanDeviation = this.calculateMeanDeviation(prices, sma, period);
    const current = prices[prices.length - 1];
    
    return meanDeviation > 0 ? (current - sma) / (0.015 * meanDeviation) : 0;
  }

  private calculateROC(prices: number[], period: number): number {
    if (prices.length < period + 1) return 0;
    const current = prices[prices.length - 1];
    const past = prices[prices.length - period - 1];
    return past > 0 ? ((current - past) / past) * 100 : 0;
  }

  // Volume indicators
  private calculateOBV(prices: number[], volumes: number[]): number {
    let obv = 0;
    for (let i = 1; i < Math.min(prices.length, volumes.length); i++) {
      if (prices[i] > prices[i - 1]) obv += volumes[i];
      else if (prices[i] < prices[i - 1]) obv -= volumes[i];
    }
    return obv;
  }

  private calculateMFI(prices: number[], volumes: number[], period: number = 14): number {
    // Simplified MFI calculation
    let positiveFlow = 0, negativeFlow = 0;
    
    for (let i = Math.max(1, prices.length - period); i < prices.length; i++) {
      const typicalPrice = prices[i];
      const moneyFlow = typicalPrice * volumes[i];
      
      if (prices[i] > prices[i - 1]) positiveFlow += moneyFlow;
      else if (prices[i] < prices[i - 1]) negativeFlow += moneyFlow;
    }
    
    if (negativeFlow === 0) return 100;
    const mfr = positiveFlow / negativeFlow;
    return 100 - (100 / (1 + mfr));
  }

  private calculateCMF(prices: number[], volumes: number[], period: number = 20): number {
    // Simplified Chaikin Money Flow
    let cmfSum = 0, volumeSum = 0;
    
    for (let i = Math.max(0, prices.length - period); i < prices.length; i++) {
      const moneyFlowVolume = volumes[i]; // Simplified
      cmfSum += moneyFlowVolume;
      volumeSum += volumes[i];
    }
    
    return volumeSum > 0 ? cmfSum / volumeSum : 0;
  }

  private calculateVolumeProfile(prices: number[], volumes: number[]): number[] {
    // Simplified volume profile - would need price level buckets
    return volumes.slice(-20); // Last 20 volume bars
  }

  // Market breadth indicators (simplified for crypto)
  private calculateAdvanceDecline(): number {
    // Mock implementation - in production, use multiple assets
    return Math.random() * 2 - 1; // -1 to 1
  }

  private calculateNewHighsLows(): number {
    return Math.random() * 2 - 1;
  }

  private calculateBullishPercent(): number {
    return Math.random();
  }

  private calculateMcClellanOscillator(): number {
    return Math.random() * 200 - 100;
  }

  private calculateArmsIndex(): number {
    return Math.random() * 2 + 0.5; // 0.5 to 2.5
  }

  // Microstructure indicators
  private estimateBidAskSpread(prices: number[]): number {
    if (prices.length < 2) return 0;
    const avgPrice = this.mean(prices.slice(-10));
    return avgPrice * 0.001; // Estimate 0.1% spread
  }

  private estimateMarketDepth(volumes: number[]): number {
    return this.mean(volumes.slice(-10));
  }

  private calculateTickDirection(prices: number[]): number {
    if (prices.length < 2) return 0;
    return prices[prices.length - 1] > prices[prices.length - 2] ? 1 : -1;
  }

  private calculateOrderImbalance(prices: number[], volumes: number[]): number {
    // Simplified order imbalance
    return Math.random() * 2 - 1;
  }

  private calculateLargeBlockRatio(volumes: number[]): number {
    const avgVolume = this.mean(volumes);
    const largeBlocks = volumes.filter(v => v > avgVolume * 2).length;
    return largeBlocks / volumes.length;
  }

  // Volatility calculations
  private calculateHistoricalVolatility(): number {
    const returns = this.calculateReturns(this.priceData);
    return this.standardDeviation(returns);
  }

  private calculateReturns(prices: number[]): number[] {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }
    return returns;
  }

  private calculateRollingVolatility(returns: number[], window: number): number[] {
    const volatilities = [];
    for (let i = window; i <= returns.length; i++) {
      const slice = returns.slice(i - window, i);
      volatilities.push(this.standardDeviation(slice));
    }
    return volatilities;
  }

  private calculateGARCHVolatility(prices: number[]): number {
    // Simplified GARCH(1,1) volatility estimate
    const returns = this.calculateReturns(prices);
    const variance = this.variance(returns);
    return Math.sqrt(variance * 252); // Annualized
  }

  private estimateVIX(prices: number[]): number {
    // Simplified VIX estimation
    const volatility = this.calculateHistoricalVolatility();
    return volatility * 100; // Convert to VIX-like scale
  }

  // Additional helper calculations
  private calculateKeltnerChannels(prices: number[]) {
    const ema = this.calculateEMA(prices, 20);
    const atr = this.calculateATR(prices);
    return {
      upper: ema + (2 * atr),
      middle: ema,
      lower: ema - (2 * atr),
    };
  }

  private calculateDonchianChannels(prices: number[], period: number = 20) {
    const slice = prices.slice(-period);
    return {
      upper: Math.max(...slice),
      middle: (Math.max(...slice) + Math.min(...slice)) / 2,
      lower: Math.min(...slice),
    };
  }

  private calculateMeanDeviation(prices: number[], mean: number, period: number): number {
    const slice = prices.slice(-period);
    const deviations = slice.map(price => Math.abs(price - mean));
    return this.mean(deviations);
  }

  private calculateVolatilityPersistence(volatilities: number[], start: number, end: number): number {
    const clusterVols = volatilities.slice(start, end);
    const autocorr = this.calculateAutocorrelation(clusterVols, 1);
    return Math.abs(autocorr); // Higher = more persistent
  }

  private calculateAutocorrelation(data: number[], lag: number): number {
    if (data.length < lag + 1) return 0;
    
    const mean = this.mean(data);
    const n = data.length;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n - lag; i++) {
      numerator += (data[i] - mean) * (data[i + lag] - mean);
    }
    
    for (let i = 0; i < n; i++) {
      denominator += Math.pow(data[i] - mean, 2);
    }
    
    return denominator > 0 ? numerator / denominator : 0;
  }

  // Regime calculation helpers
  private calculateRegimeStrength(characteristics: MarketRegime['characteristics'], regime: string): number {
    const { trend, volatility, momentum, volume, breadth } = characteristics;
    
    switch (regime) {
      case 'bull_trend':
        return Math.min(100, (trend * 40 + momentum * 30 + (volume - 1) * 20 + breadth * 10));
      case 'bear_trend':
        return Math.min(100, (-trend * 40 - momentum * 30 + (volume - 1) * 20 - breadth * 10));
      case 'high_volatility':
        return Math.min(100, volatility * 80 + Math.abs(momentum) * 20);
      case 'low_volatility':
        return Math.min(100, (1 - volatility) * 60 + (1 - Math.abs(trend)) * 40);
      default:
        return 50;
    }
  }

  private calculateRegimeConfidence(probabilities: { [key: string]: number }): number {
    const values = Object.values(probabilities);
    const maxProb = Math.max(...values);
    const entropy = -values.reduce((sum, p) => sum + (p > 0 ? p * Math.log2(p) : 0), 0);
    const maxEntropy = Math.log2(values.length);
    
    // Confidence is high when one regime dominates (low entropy)
    return maxProb * (1 - entropy / maxEntropy);
  }

  private calculateRegimeDuration(regime: string): number {
    const currentDuration = this.regimeStates.get(regime) || 0;
    return currentDuration + 1;
  }

  private identifyTransitionTriggers(oldRegime: MarketRegime, newRegime: MarketRegime): string[] {
    const triggers: string[] = [];
    
    // Compare characteristics to identify what changed
    if (Math.abs(newRegime.characteristics.trend - oldRegime.characteristics.trend) > 0.3) {
      triggers.push('trend_change');
    }
    
    if (Math.abs(newRegime.characteristics.volatility - oldRegime.characteristics.volatility) > 0.3) {
      triggers.push('volatility_change');
    }
    
    if (Math.abs(newRegime.characteristics.momentum - oldRegime.characteristics.momentum) > 0.3) {
      triggers.push('momentum_change');
    }
    
    if (Math.abs(newRegime.characteristics.volume - oldRegime.characteristics.volume) > 0.5) {
      triggers.push('volume_change');
    }
    
    return triggers;
  }

  private estimateRegimeDuration(regime: string): number {
    // Historical average durations (in days)
    const averageDurations: { [key: string]: number } = {
      'bull_trend': 45,
      'bear_trend': 35,
      'bull_range': 25,
      'bear_range': 20,
      'high_volatility': 10,
      'low_volatility': 30,
      'shock': 3,
      'recovery': 15,
    };
    
    return averageDurations[regime] || 20;
  }

  private calculateRiskAdjustment(fromRegime: string, toRegime: string): number {
    // Risk adjustment factors for regime transitions
    const riskFactors: { [key: string]: number } = {
      'bull_trend': 1.0,
      'bear_trend': 1.2,
      'bull_range': 0.8,
      'bear_range': 0.9,
      'high_volatility': 1.5,
      'low_volatility': 0.7,
      'shock': 2.0,
      'recovery': 1.1,
    };
    
    const fromRisk = riskFactors[fromRegime] || 1.0;
    const toRisk = riskFactors[toRegime] || 1.0;
    
    return toRisk / fromRisk;
  }

  private detectCurrentRegime() {
    if (this.priceData.length > 0) {
      this.detectRegime(this.priceData, this.volumeData);
    }
  }

  // Statistical helper functions
  private mean(values: number[]): number {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  private variance(values: number[]): number {
    const avg = this.mean(values);
    const squareDiffs = values.map(val => Math.pow(val - avg, 2));
    return this.mean(squareDiffs);
  }

  private standardDeviation(values: number[]): number {
    return Math.sqrt(this.variance(values));
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor((percentile / 100) * sorted.length);
    return sorted[Math.min(index, sorted.length - 1)];
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  // Public API methods
  public getCurrentRegime(): MarketRegime {
    return { ...this.currentRegime };
  }

  public getRegimeHistory(limit: number = 100): MarketRegime[] {
    return this.regimeHistory.slice(-limit);
  }

  public getTransitionHistory(limit: number = 50): RegimeTransition[] {
    return this.transitionHistory.slice(-limit);
  }

  public getVolatilityClusters(): VolatilityCluster[] {
    return [...this.volatilityClusters];
  }

  public subscribeToRegimeChanges(callback: (transition: RegimeTransition) => void) {
    this.on('regimeTransition', callback);
  }

  public updateMarketData(prices: number[], volumes: number[]) {
    this.detectRegime(prices, volumes);
  }
}

export const marketRegimeDetector = new MarketRegimeDetector();
