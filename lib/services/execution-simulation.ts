// Advanced Execution Simulation with Latency-Aware Modeling
import { EventEmitter } from 'events';

export interface ExecutionVenue {
  id: string;
  name: string;
  type: 'EXCHANGE' | 'ECN' | 'DARK_POOL' | 'SOR';
  
  latency: {
    connect: number; // Connection latency (ms)
    order: number; // Order placement latency (ms)
    cancel: number; // Cancel latency (ms)
    market_data: number; // Market data latency (ms)
  };
  
  fees: {
    maker: number; // Maker fee (bps)
    taker: number; // Taker fee (bps)
    cancel: number; // Cancel fee (fixed)
  };
  
  marketStructure: {
    minOrderSize: number;
    maxOrderSize: number;
    tickSize: number;
    lotSize: number;
    
    // Market impact parameters
    liquidityParameter: number; // Kyle's lambda
    temporaryImpact: number;
    permanentImpact: number;
    
    // Queue position modeling
    queueProcessingRate: number; // Orders per second
    averageQueueDepth: number;
  };
  
  // Real-time market data
  currentSpread: number;
  bidSize: number;
  askSize: number;
  midPrice: number;
  volatility: number;
  
  // Venue quality metrics
  fillRate: number; // Historical fill rate
  averageFillTime: number; // Average time to fill (ms)
  rejectRate: number; // Order rejection rate
  partialFillRate: number; // Partial fill probability
}

export interface OrderParams {
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  orderType: 'MARKET' | 'LIMIT' | 'TWAP' | 'VWAP' | 'POV' | 'IS' | 'AC';
  
  // Limit order specific
  limitPrice?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK' | 'GTD';
  
  // Algo specific parameters
  timeHorizon?: number; // Minutes for TWAP/VWAP
  participationRate?: number; // For POV orders (0-1)
  maxSlice?: number; // Maximum child order size
  minSlice?: number; // Minimum child order size
  
  // Risk controls
  maxSlippage?: number; // Maximum acceptable slippage (bps)
  maxLatency?: number; // Maximum acceptable latency (ms)
  darkPoolPreference?: boolean;
  allowPartialFills?: boolean;
}

export interface ExecutionPath {
  venues: ExecutionVenue[];
  allocation: number[]; // Percentage allocation to each venue
  expectedCost: number; // Total expected transaction cost (bps)
  expectedLatency: number; // Expected execution time (ms)
  riskMetrics: {
    slippageVar95: number; // 95% VaR of slippage
    slippageVar99: number; // 99% VaR of slippage
    expectedShortfall: number; // Expected shortfall
    probabilityOfCompletion: number; // Probability of full execution
  };
}

export interface SimulationScenario {
  name: string;
  marketCondition: 'NORMAL' | 'VOLATILE' | 'ILLIQUID' | 'TRENDING' | 'STRESSED';
  
  // Market parameters for scenario
  volatilityMultiplier: number;
  spreadMultiplier: number;
  liquidityMultiplier: number;
  latencyMultiplier: number;
  
  // Stress test parameters
  volumeShock?: number; // Sudden volume increase/decrease
  priceShock?: number; // Sudden price move (%)
  connectivityIssues?: boolean; // Venue connectivity problems
  
  probability: number; // Scenario probability
}

export interface ExecutionResult {
  orderId: string;
  timestamp: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  originalQuantity: number;
  
  execution: {
    fills: {
      venueId: string;
      timestamp: number;
      quantity: number;
      price: number;
      fees: number;
      latency: number;
    }[];
    
    totalFilled: number;
    totalRemaining: number;
    avgFillPrice: number;
    totalFees: number;
    totalLatency: number;
    
    // Cost analysis
    slippage: number; // bps from mid-price at order time
    marketImpact: number; // Estimated market impact
    timing: number; // Timing cost (implementation shortfall component)
    
    // Execution quality metrics
    realization: number; // Price improvement/degradation
    fillRate: number; // Percentage filled
    executionTime: number; // Total execution time (ms)
  };
  
  // Risk metrics
  worstCaseSlippage: number;
  expectedVsActual: {
    slippage: { expected: number; actual: number };
    latency: { expected: number; actual: number };
    cost: { expected: number; actual: number };
  };
  
  status: 'COMPLETED' | 'PARTIALLY_FILLED' | 'CANCELLED' | 'REJECTED' | 'EXPIRED';
}

export interface MarketImpactModel {
  // Almgren-Chriss parameters
  permanentImpact: number; // Permanent impact coefficient
  temporaryImpact: number; // Temporary impact coefficient
  volatility: number; // Price volatility
  
  // Kyle's model parameters
  lambda: number; // Liquidity parameter
  
  // Square-root law parameters
  sigma: number; // Volatility
  eta: number; // Temporary market impact
  gamma: number; // Permanent market impact
  
  calculateImpact(
    quantity: number,
    rate: number, // Trading rate (shares per unit time)
    adv: number, // Average daily volume
    spread: number // Bid-ask spread
  ): {
    permanent: number;
    temporary: number;
    total: number;
  };
}

export interface LatencyModel {
  // Network latency components
  networkLatency: number; // Base network latency
  processingLatency: number; // Order processing latency
  queueingLatency: number; // Queueing delay
  
  // Latency distribution parameters
  distribution: 'NORMAL' | 'EXPONENTIAL' | 'WEIBULL' | 'LOGNORMAL';
  parameters: {
    mean: number;
    variance: number;
    shape?: number; // For Weibull
    scale?: number; // For Weibull
  };
  
  // Correlation with market conditions
  volatilityCorrelation: number; // Correlation with market volatility
  volumeCorrelation: number; // Correlation with trading volume
  
  sampleLatency(): number;
  updateConditions(marketVolatility: number, tradingVolume: number): void;
}

export class ExecutionSimulator extends EventEmitter {
  private venues: Map<string, ExecutionVenue> = new Map();
  private scenarios: SimulationScenario[] = [];
  private impactModel: MarketImpactModel;
  private latencyModel: LatencyModel;
  private simulationHistory: ExecutionResult[] = [];
  
  // Current market state
  private currentVolatility: number = 0.02; // 2% daily vol
  private currentVolume: number = 1000000; // Current volume
  private currentSpread: number = 0.0001; // 1 bp spread
  
  constructor() {
    super();
    this.initializeVenues();
    this.initializeScenarios();
    this.impactModel = this.createMarketImpactModel();
    this.latencyModel = this.createLatencyModel();
  }

  private initializeVenues() {
    // Binance
    this.venues.set('BINANCE', {
      id: 'BINANCE',
      name: 'Binance',
      type: 'EXCHANGE',
      latency: {
        connect: 50,
        order: 25,
        cancel: 20,
        market_data: 10
      },
      fees: {
        maker: -1, // -0.01% (rebate)
        taker: 10, // 0.1%
        cancel: 0
      },
      marketStructure: {
        minOrderSize: 0.001,
        maxOrderSize: 1000000,
        tickSize: 0.01,
        lotSize: 0.001,
        liquidityParameter: 0.001,
        temporaryImpact: 0.5,
        permanentImpact: 0.1,
        queueProcessingRate: 1000,
        averageQueueDepth: 50
      },
      currentSpread: 0.0001,
      bidSize: 100,
      askSize: 120,
      midPrice: 50000,
      volatility: 0.03,
      fillRate: 0.98,
      averageFillTime: 150,
      rejectRate: 0.001,
      partialFillRate: 0.05
    });

    // Coinbase Pro
    this.venues.set('COINBASE', {
      id: 'COINBASE',
      name: 'Coinbase Pro',
      type: 'EXCHANGE',
      latency: {
        connect: 80,
        order: 40,
        cancel: 35,
        market_data: 20
      },
      fees: {
        maker: 0, // 0%
        taker: 5, // 0.05%
        cancel: 0
      },
      marketStructure: {
        minOrderSize: 0.001,
        maxOrderSize: 500000,
        tickSize: 0.01,
        lotSize: 0.001,
        liquidityParameter: 0.002,
        temporaryImpact: 0.6,
        permanentImpact: 0.15,
        queueProcessingRate: 800,
        averageQueueDepth: 30
      },
      currentSpread: 0.0002,
      bidSize: 80,
      askSize: 90,
      midPrice: 50000,
      volatility: 0.025,
      fillRate: 0.95,
      averageFillTime: 200,
      rejectRate: 0.002,
      partialFillRate: 0.08
    });

    // Kraken
    this.venues.set('KRAKEN', {
      id: 'KRAKEN',
      name: 'Kraken',
      type: 'EXCHANGE',
      latency: {
        connect: 100,
        order: 60,
        cancel: 50,
        market_data: 30
      },
      fees: {
        maker: 0, // 0%
        taker: 8, // 0.08%
        cancel: 0
      },
      marketStructure: {
        minOrderSize: 0.002,
        maxOrderSize: 200000,
        tickSize: 0.1,
        lotSize: 0.002,
        liquidityParameter: 0.003,
        temporaryImpact: 0.8,
        permanentImpact: 0.2,
        queueProcessingRate: 500,
        averageQueueDepth: 20
      },
      currentSpread: 0.0003,
      bidSize: 60,
      askSize: 75,
      midPrice: 50000,
      volatility: 0.028,
      fillRate: 0.92,
      averageFillTime: 300,
      rejectRate: 0.003,
      partialFillRate: 0.12
    });

    // Dark Pool (simulated)
    this.venues.set('DARK_POOL_1', {
      id: 'DARK_POOL_1',
      name: 'Crypto Dark Pool',
      type: 'DARK_POOL',
      latency: {
        connect: 200,
        order: 100,
        cancel: 80,
        market_data: 50
      },
      fees: {
        maker: -5, // -0.05% rebate
        taker: 3, // 0.03%
        cancel: 0
      },
      marketStructure: {
        minOrderSize: 1,
        maxOrderSize: 100000,
        tickSize: 0.01,
        lotSize: 1,
        liquidityParameter: 0.0005,
        temporaryImpact: 0.2,
        permanentImpact: 0.05,
        queueProcessingRate: 100,
        averageQueueDepth: 5
      },
      currentSpread: 0,
      bidSize: 200,
      askSize: 250,
      midPrice: 50000,
      volatility: 0.02,
      fillRate: 0.70,
      averageFillTime: 5000,
      rejectRate: 0.05,
      partialFillRate: 0.30
    });
  }

  private initializeScenarios() {
    this.scenarios = [
      {
        name: 'Normal Market',
        marketCondition: 'NORMAL',
        volatilityMultiplier: 1.0,
        spreadMultiplier: 1.0,
        liquidityMultiplier: 1.0,
        latencyMultiplier: 1.0,
        probability: 0.70
      },
      {
        name: 'High Volatility',
        marketCondition: 'VOLATILE',
        volatilityMultiplier: 2.5,
        spreadMultiplier: 1.8,
        liquidityMultiplier: 0.6,
        latencyMultiplier: 1.3,
        probability: 0.15
      },
      {
        name: 'Low Liquidity',
        marketCondition: 'ILLIQUID',
        volatilityMultiplier: 1.2,
        spreadMultiplier: 3.0,
        liquidityMultiplier: 0.3,
        latencyMultiplier: 1.1,
        probability: 0.08
      },
      {
        name: 'Strong Trend',
        marketCondition: 'TRENDING',
        volatilityMultiplier: 1.5,
        spreadMultiplier: 1.2,
        liquidityMultiplier: 0.8,
        latencyMultiplier: 1.2,
        probability: 0.05
      },
      {
        name: 'Market Stress',
        marketCondition: 'STRESSED',
        volatilityMultiplier: 4.0,
        spreadMultiplier: 5.0,
        liquidityMultiplier: 0.2,
        latencyMultiplier: 2.0,
        volumeShock: -0.5,
        priceShock: -0.10,
        connectivityIssues: true,
        probability: 0.02
      }
    ];
  }

  private createMarketImpactModel(): MarketImpactModel {
    return {
      permanentImpact: 0.1,
      temporaryImpact: 0.5,
      volatility: 0.03,
      lambda: 0.001,
      sigma: 0.03,
      eta: 0.5,
      gamma: 0.1,
      
      calculateImpact(quantity: number, rate: number, adv: number, spread: number) {
        // Almgren-Chriss model
        const permanent = this.gamma * (quantity / adv);
        const temporary = this.eta * (rate / adv) + 0.5 * spread;
        
        return {
          permanent,
          temporary,
          total: permanent + temporary
        };
      }
    };
  }

  private createLatencyModel(): LatencyModel {
    return {
      networkLatency: 50,
      processingLatency: 25,
      queueingLatency: 10,
      
      distribution: 'LOGNORMAL',
      parameters: {
        mean: 85,
        variance: 400
      },
      
      volatilityCorrelation: 0.3,
      volumeCorrelation: -0.2,
      
      sampleLatency(): number {
        // Log-normal distribution sampling (simplified)
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        
        const logMean = Math.log(this.parameters.mean) - 0.5 * Math.log(1 + this.parameters.variance / (this.parameters.mean * this.parameters.mean));
        const logStd = Math.sqrt(Math.log(1 + this.parameters.variance / (this.parameters.mean * this.parameters.mean)));
        
        return Math.exp(logMean + logStd * z0);
      },
      
      updateConditions(marketVolatility: number, tradingVolume: number): void {
        // Adjust latency based on market conditions
        const volatilityAdjustment = 1 + this.volatilityCorrelation * (marketVolatility - 0.02) / 0.02;
        const volumeAdjustment = 1 + this.volumeCorrelation * Math.log(tradingVolume / 1000000);
        
        this.parameters.mean = 85 * volatilityAdjustment * volumeAdjustment;
      }
    };
  }

  // Main simulation function
  public async simulateOrder(
    orderParams: OrderParams,
    scenarios: SimulationScenario[] = this.scenarios,
    numSimulations: number = 1000
  ): Promise<{
    results: ExecutionResult[];
    statistics: {
      meanSlippage: number;
      medianSlippage: number;
      slippageStd: number;
      var95: number;
      var99: number;
      expectedShortfall: number;
      fillRate: number;
      avgExecutionTime: number;
      worstCase: ExecutionResult;
      bestCase: ExecutionResult;
    };
  }> {

    const results: ExecutionResult[] = [];
    
    // Pre-calculate execution paths for different scenarios
    const executionPaths = new Map<string, ExecutionPath>();
    
    for (const scenario of scenarios) {
      const path = await this.optimizeExecutionPath(orderParams, scenario);
      executionPaths.set(scenario.name, path);
    }

    // Run Monte Carlo simulations
    for (let sim = 0; sim < numSimulations; sim++) {
      // Sample scenario based on probabilities
      const scenario = this.sampleScenario(scenarios);
      const executionPath = executionPaths.get(scenario.name)!;
      
      // Apply scenario conditions
      this.applyScenarioConditions(scenario);
      
      // Simulate execution
      const result = await this.executeOrderSimulation(orderParams, executionPath, scenario);
      results.push(result);
      
      // Progress update
      if (sim % 100 === 0) {
        this.emit('simulationProgress', { completed: sim, total: numSimulations });
      }
    }

    // Calculate statistics
    const statistics = this.calculateSimulationStatistics(results);
    
    // Store results
    this.simulationHistory.push(...results);
    
    // Emit completion
    this.emit('simulationComplete', { results, statistics });
    
    return { results, statistics };
  }

  // Optimize execution path for given order and scenario
  private async optimizeExecutionPath(
    orderParams: OrderParams,
    scenario: SimulationScenario
  ): Promise<ExecutionPath> {
    
    const candidateVenues = Array.from(this.venues.values());
    const n = candidateVenues.length;
    
    // Calculate expected costs for each venue under this scenario
    const venueCosts: number[] = [];
    const venueLatencies: number[] = [];
    const riskMetrics: any[] = [];
    
    for (const venue of candidateVenues) {
      // Adjust venue parameters based on scenario
      const adjustedVenue = this.applyScenarioToVenue(venue, scenario);
      
      // Calculate transaction costs
      const costs = this.calculateTransactionCosts(orderParams, adjustedVenue);
      const latency = this.estimateExecutionLatency(orderParams, adjustedVenue);
      const risk = this.calculateVenueRisk(orderParams, adjustedVenue, scenario);
      
      venueCosts.push(costs.total);
      venueLatencies.push(latency);
      riskMetrics.push(risk);
    }
    
    // Optimize allocation using mean-variance approach
    const allocation = this.optimizeVenueAllocation(
      venueCosts,
      riskMetrics,
      orderParams
    );
    
    // Calculate path metrics
    const expectedCost = venueCosts.reduce((sum, cost, i) => sum + cost * allocation[i], 0);
    const expectedLatency = venueLatencies.reduce((sum, latency, i) => sum + latency * allocation[i], 0);
    
    // Calculate risk metrics
    const pathRisk = this.calculatePathRisk(riskMetrics, allocation);
    
    return {
      venues: candidateVenues,
      allocation,
      expectedCost,
      expectedLatency,
      riskMetrics: pathRisk
    };
  }

  // Execute order simulation for a specific path and scenario
  private async executeOrderSimulation(
    orderParams: OrderParams,
    executionPath: ExecutionPath,
    scenario: SimulationScenario
  ): Promise<ExecutionResult> {
    
    const orderId = this.generateOrderId();
    const startTime = Date.now();
    const fills: ExecutionResult['execution']['fills'] = [];
    
    let remainingQuantity = orderParams.quantity;
    let totalFees = 0;
    let totalLatency = 0;
    let avgFillPrice = 0;
    let totalFillValue = 0;
    
    // Execute on each venue according to allocation
    for (let i = 0; i < executionPath.venues.length && remainingQuantity > 0; i++) {
      const venue = executionPath.venues[i];
      const allocation = executionPath.allocation[i];
      
      if (allocation === 0) continue;
      
      const targetQuantity = Math.min(remainingQuantity, orderParams.quantity * allocation);
      const venueResult = await this.executeOnVenue(
        orderParams,
        targetQuantity,
        venue,
        scenario
      );
      
      fills.push(...venueResult.fills);
      totalFees += venueResult.totalFees;
      totalLatency = Math.max(totalLatency, venueResult.latency);
      
      venueResult.fills.forEach(fill => {
        totalFillValue += fill.quantity * fill.price;
      });
      
      remainingQuantity -= venueResult.totalFilled;
    }
    
    // Calculate metrics
    const totalFilled = orderParams.quantity - remainingQuantity;
    if (totalFilled > 0) {
      avgFillPrice = totalFillValue / totalFilled;
    }
    
    // Market data at order time (simulated)
    const orderTimeMid = 50000; // Placeholder
    const slippage = ((avgFillPrice - orderTimeMid) / orderTimeMid) * 10000; // bps
    
    // Calculate market impact
    const impact = this.impactModel.calculateImpact(
      orderParams.quantity,
      orderParams.quantity / (orderParams.timeHorizon || 5), // Rate
      1000000, // ADV
      this.currentSpread
    );
    
    return {
      orderId,
      timestamp: startTime,
      symbol: orderParams.symbol,
      side: orderParams.side,
      originalQuantity: orderParams.quantity,
      
      execution: {
        fills,
        totalFilled,
        totalRemaining: remainingQuantity,
        avgFillPrice,
        totalFees,
        totalLatency,
        slippage,
        marketImpact: impact.total * 10000, // bps
        timing: 0, // Placeholder
        realization: 0, // Placeholder
        fillRate: totalFilled / orderParams.quantity,
        executionTime: Date.now() - startTime
      },
      
      worstCaseSlippage: slippage * 1.5, // Simplified
      expectedVsActual: {
        slippage: { expected: executionPath.expectedCost, actual: slippage },
        latency: { expected: executionPath.expectedLatency, actual: totalLatency },
        cost: { expected: executionPath.expectedCost, actual: slippage + totalFees }
      },
      
      status: remainingQuantity === 0 ? 'COMPLETED' : 'PARTIALLY_FILLED'
    };
  }

  // Execute on specific venue
  private async executeOnVenue(
    orderParams: OrderParams,
    quantity: number,
    venue: ExecutionVenue,
    scenario: SimulationScenario
  ): Promise<{
    fills: ExecutionResult['execution']['fills'];
    totalFilled: number;
    totalFees: number;
    latency: number;
  }> {
    
    const fills: ExecutionResult['execution']['fills'] = [];
    let totalFilled = 0;
    let totalFees = 0;
    
    // Sample latency
    this.latencyModel.updateConditions(this.currentVolatility, this.currentVolume);
    const latency = this.latencyModel.sampleLatency() * scenario.latencyMultiplier;
    
    // Check for connectivity issues
    if (scenario.connectivityIssues && Math.random() < 0.1) {
      return { fills, totalFilled: 0, totalFees: 0, latency: latency * 5 };
    }
    
    // Simulate order rejection
    if (Math.random() < venue.rejectRate) {
      return { fills, totalFilled: 0, totalFees: 0, latency };
    }
    
    // Calculate fill probability and quantity
    let fillQuantity = quantity;
    
    // Apply partial fill probability
    if (Math.random() < venue.partialFillRate) {
      fillQuantity = quantity * (0.3 + Math.random() * 0.4); // 30-70% fill
    }
    
    // Apply venue liquidity constraints
    const availableLiquidity = venue.bidSize + venue.askSize;
    fillQuantity = Math.min(fillQuantity, availableLiquidity * 0.5);
    
    if (fillQuantity > 0) {
      // Calculate fill price with market impact
      const basePrice = venue.midPrice;
      const impact = this.calculateMarketImpact(fillQuantity, venue, scenario);
      const fillPrice = orderParams.side === 'BUY' 
        ? basePrice * (1 + impact.total)
        : basePrice * (1 - impact.total);
      
      // Calculate fees
      const feeRate = orderParams.orderType === 'MARKET' ? venue.fees.taker : venue.fees.maker;
      const fees = (fillQuantity * fillPrice * feeRate) / 10000; // Convert from bps
      
      fills.push({
        venueId: venue.id,
        timestamp: Date.now(),
        quantity: fillQuantity,
        price: fillPrice,
        fees,
        latency
      });
      
      totalFilled = fillQuantity;
      totalFees = fees;
    }
    
    return { fills, totalFilled, totalFees, latency };
  }

  // Helper functions
  private sampleScenario(scenarios: SimulationScenario[]): SimulationScenario {
    const rand = Math.random();
    let cumulative = 0;
    
    for (const scenario of scenarios) {
      cumulative += scenario.probability;
      if (rand <= cumulative) {
        return scenario;
      }
    }
    
    return scenarios[0]; // Fallback
  }

  private applyScenarioConditions(scenario: SimulationScenario) {
    // Update current market conditions based on scenario
    this.currentVolatility *= scenario.volatilityMultiplier;
    this.currentSpread *= scenario.spreadMultiplier;
    this.currentVolume *= scenario.liquidityMultiplier;
    
    // Apply shocks if present
    if (scenario.volumeShock) {
      this.currentVolume *= (1 + scenario.volumeShock);
    }
  }

  private applyScenarioToVenue(venue: ExecutionVenue, scenario: SimulationScenario): ExecutionVenue {
    return {
      ...venue,
      currentSpread: venue.currentSpread * scenario.spreadMultiplier,
      volatility: venue.volatility * scenario.volatilityMultiplier,
      bidSize: venue.bidSize * scenario.liquidityMultiplier,
      askSize: venue.askSize * scenario.liquidityMultiplier,
      latency: {
        connect: venue.latency.connect * scenario.latencyMultiplier,
        order: venue.latency.order * scenario.latencyMultiplier,
        cancel: venue.latency.cancel * scenario.latencyMultiplier,
        market_data: venue.latency.market_data * scenario.latencyMultiplier
      }
    };
  }

  private calculateTransactionCosts(orderParams: OrderParams, venue: ExecutionVenue): {
    marketImpact: number;
    spread: number;
    fees: number;
    timing: number;
    total: number;
  } {
    // Market impact
    const impact = this.calculateMarketImpact(orderParams.quantity, venue);
    
    // Spread cost (for market orders)
    const spreadCost = orderParams.orderType === 'MARKET' ? venue.currentSpread / 2 : 0;
    
    // Fees
    const feeRate = orderParams.orderType === 'MARKET' ? venue.fees.taker : venue.fees.maker;
    const fees = Math.abs(feeRate); // Convert from bps
    
    // Timing cost (simplified)
    const timingCost = venue.volatility * Math.sqrt((orderParams.timeHorizon || 5) / 60);
    
    return {
      marketImpact: impact.total * 10000, // Convert to bps
      spread: spreadCost * 10000,
      fees,
      timing: timingCost * 10000,
      total: impact.total * 10000 + spreadCost * 10000 + fees + timingCost * 10000
    };
  }

  private calculateMarketImpact(
    quantity: number, 
    venue: ExecutionVenue, 
    scenario?: SimulationScenario
  ): { permanent: number; temporary: number; total: number } {
    
    const adv = venue.bidSize + venue.askSize; // Simplified ADV
    const participationRate = quantity / adv;
    
    // Square root law
    const permanent = venue.marketStructure.permanentImpact * Math.sqrt(participationRate);
    const temporary = venue.marketStructure.temporaryImpact * participationRate;
    
    // Apply scenario multipliers
    const multiplier = scenario ? scenario.volatilityMultiplier : 1;
    
    return {
      permanent: permanent * multiplier,
      temporary: temporary * multiplier,
      total: (permanent + temporary) * multiplier
    };
  }

  private estimateExecutionLatency(orderParams: OrderParams, venue: ExecutionVenue): number {
    let baseLatency = venue.latency.connect + venue.latency.order;
    
    // Add processing time based on order complexity
    if (orderParams.orderType !== 'MARKET') {
      baseLatency += venue.latency.order * 0.5; // Additional processing for limit orders
    }
    
    // Add queueing delay
    const queueingDelay = venue.marketStructure.averageQueueDepth / venue.marketStructure.queueProcessingRate * 1000;
    
    return baseLatency + queueingDelay;
  }

  private calculateVenueRisk(
    orderParams: OrderParams,
    venue: ExecutionVenue,
    scenario: SimulationScenario
  ): any {
    
    const baseVolatility = venue.volatility * scenario.volatilityMultiplier;
    const liquidityRisk = 1 / (venue.bidSize + venue.askSize);
    const rejectRisk = venue.rejectRate;
    
    return {
      volatility: baseVolatility,
      liquidityRisk,
      rejectRisk,
      fillRate: venue.fillRate,
      partialFillRate: venue.partialFillRate
    };
  }

  private optimizeVenueAllocation(
    costs: number[],
    risks: any[],
    orderParams: OrderParams
  ): number[] {
    
    const n = costs.length;
    
    // Simple cost-based allocation with risk adjustment
    const riskAdjustedCosts = costs.map((cost, i) => {
      const risk = risks[i];
      const riskPenalty = risk.volatility * 1000 + risk.liquidityRisk * 500 + risk.rejectRisk * 2000;
      return cost + riskPenalty;
    });
    
    // Inverse cost weighting
    const inverseWeights = riskAdjustedCosts.map(cost => 1 / (cost + 1));
    const sum = inverseWeights.reduce((s, w) => s + w, 0);
    
    return inverseWeights.map(w => w / sum);
  }

  private calculatePathRisk(riskMetrics: any[], allocation: number[]): ExecutionPath['riskMetrics'] {
    const portfolioVolatility = Math.sqrt(
      riskMetrics.reduce((sum, risk, i) => {
        return sum + Math.pow(allocation[i] * risk.volatility, 2);
      }, 0)
    );
    
    const avgFillRate = riskMetrics.reduce((sum, risk, i) => sum + allocation[i] * risk.fillRate, 0);
    
    return {
      slippageVar95: portfolioVolatility * 1.645 * 10000, // 95% VaR in bps
      slippageVar99: portfolioVolatility * 2.326 * 10000, // 99% VaR in bps
      expectedShortfall: portfolioVolatility * 2.5 * 10000, // Simplified ES
      probabilityOfCompletion: avgFillRate
    };
  }

  private calculateSimulationStatistics(results: ExecutionResult[]) {
    const slippages = results.map(r => r.execution.slippage);
    const executionTimes = results.map(r => r.execution.executionTime);
    const fillRates = results.map(r => r.execution.fillRate);
    
    slippages.sort((a, b) => a - b);
    
    const mean = slippages.reduce((s, x) => s + x, 0) / slippages.length;
    const median = slippages[Math.floor(slippages.length / 2)];
    const variance = slippages.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / slippages.length;
    const std = Math.sqrt(variance);
    
    const var95Index = Math.floor(slippages.length * 0.95);
    const var99Index = Math.floor(slippages.length * 0.99);
    
    // Expected Shortfall (average of worst 5%)
    const tailStart = var95Index;
    const expectedShortfall = slippages.slice(tailStart).reduce((s, x) => s + x, 0) / (slippages.length - tailStart);
    
    // Find best and worst cases
    const worstCase = results.reduce((worst, current) => 
      current.execution.slippage > worst.execution.slippage ? current : worst
    );
    
    const bestCase = results.reduce((best, current) => 
      current.execution.slippage < best.execution.slippage ? current : best
    );
    
    return {
      meanSlippage: mean,
      medianSlippage: median,
      slippageStd: std,
      var95: slippages[var95Index],
      var99: slippages[var99Index],
      expectedShortfall,
      fillRate: fillRates.reduce((s, x) => s + x, 0) / fillRates.length,
      avgExecutionTime: executionTimes.reduce((s, x) => s + x, 0) / executionTimes.length,
      worstCase,
      bestCase
    };
  }

  private generateOrderId(): string {
    return `SIM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  public getVenues(): ExecutionVenue[] {
    return Array.from(this.venues.values());
  }

  public addVenue(venue: ExecutionVenue) {
    this.venues.set(venue.id, venue);
  }

  public updateVenue(venueId: string, updates: Partial<ExecutionVenue>) {
    const venue = this.venues.get(venueId);
    if (venue) {
      this.venues.set(venueId, { ...venue, ...updates });
    }
  }

  public getScenarios(): SimulationScenario[] {
    return [...this.scenarios];
  }

  public addScenario(scenario: SimulationScenario) {
    this.scenarios.push(scenario);
  }

  public getSimulationHistory(limit: number = 1000): ExecutionResult[] {
    return this.simulationHistory.slice(-limit);
  }

  public updateMarketConditions(volatility: number, volume: number, spread: number) {
    this.currentVolatility = volatility;
    this.currentVolume = volume;
    this.currentSpread = spread;
    
    // Update venue conditions
    this.venues.forEach(venue => {
      venue.volatility = volatility;
      venue.currentSpread = spread;
    });
  }

  // Benchmark against execution algorithms
  public async benchmarkAlgorithms(
    orderParams: OrderParams,
    algorithms: string[] = ['TWAP', 'VWAP', 'POV', 'IS']
  ): Promise<Map<string, any>> {
    
    const results = new Map();
    
    for (const algo of algorithms) {
      const algoParams = { ...orderParams, orderType: algo as any };
      const simulation = await this.simulateOrder(algoParams, this.scenarios, 500);
      results.set(algo, simulation.statistics);
    }
    
    return results;
  }

  public subscribeToSimulation(callback: (data: any) => void) {
    this.on('simulationProgress', callback);
    this.on('simulationComplete', callback);
  }
}

export const executionSimulator = new ExecutionSimulator();
