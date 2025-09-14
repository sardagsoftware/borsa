// Advanced Portfolio Optimization with Modern Portfolio Theory and ML
import { EventEmitter } from 'events';

export interface Asset {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'bond' | 'commodity';
  currentPrice: number;
  marketCap: number;
  volume24h: number;
  
  statistics: {
    expectedReturn: number; // Annualized
    volatility: number; // Annualized
    sharpeRatio: number;
    beta: number;
    correlation: { [symbol: string]: number };
  };
  
  constraints: {
    minWeight: number; // Minimum allocation (0-1)
    maxWeight: number; // Maximum allocation (0-1)
    isRequired: boolean; // Must be included
    isExcluded: boolean; // Must be excluded
  };
  
  features: {
    marketRegime: string;
    sentimentScore: number;
    technicalScore: number;
    fundamentalScore: number;
    liquidityScore: number;
  };
}

export interface PortfolioAllocation {
  symbol: string;
  weight: number; // Allocation percentage (0-1)
  targetQuantity: number;
  currentQuantity: number;
  rebalanceAction: 'buy' | 'sell' | 'hold';
  rebalanceAmount: number;
  contribution: {
    expectedReturn: number;
    risk: number;
    diversificationBenefit: number;
  };
}

export interface OptimizationResult {
  allocations: PortfolioAllocation[];
  portfolioMetrics: {
    expectedReturn: number;
    volatility: number;
    sharpeRatio: number;
    sortino: number;
    maxDrawdown: number;
    var95: number;
    var99: number;
    conditionalVaR: number;
  };
  
  riskDecomposition: {
    totalRisk: number;
    specificRisk: number; // Diversifiable risk
    systematicRisk: number; // Market risk
    concentrationRisk: number;
  };
  
  optimization: {
    method: 'mean_variance' | 'black_litterman' | 'risk_parity' | 'min_variance' | 'max_sharpe' | 'ml_enhanced';
    objective: string;
    constraints: string[];
    convergence: boolean;
    iterations: number;
  };
  
  rebalancing: {
    totalTurnover: number;
    tradingCosts: number;
    netBenefit: number;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  };
  
  scenarios: {
    bullMarket: { return: number; risk: number };
    bearMarket: { return: number; risk: number };
    highVolatility: { return: number; risk: number };
    normalMarket: { return: number; risk: number };
  };
  
  timestamp: number;
}

export interface OptimizationParameters {
  objective: 'max_sharpe' | 'min_variance' | 'risk_parity' | 'custom';
  riskTolerance: number; // 0-1 (0 = very conservative, 1 = very aggressive)
  targetReturn?: number; // If specified, optimize for this return level
  maxRisk?: number; // Maximum portfolio volatility
  
  constraints: {
    maxPositionSize: number; // Maximum weight per asset
    minPositionSize: number; // Minimum weight per asset
    maxTurnover: number; // Maximum portfolio turnover
    maxTradingCost: number; // Maximum acceptable trading costs
    sectorLimits?: { [sector: string]: number }; // Sector concentration limits
    
    // Advanced constraints
    maxCorrelation: number; // Maximum correlation between any two assets
    minDiversification: number; // Minimum number of assets
    maxConcentration: number; // Maximum Herfindahl index
  };
  
  preferences: {
    preferredAssets: string[]; // Assets to favor
    avoidedAssets: string[]; // Assets to minimize
    esgScore?: number; // ESG preference weight
    liquidityPreference: number; // Preference for liquid assets (0-1)
  };
  
  marketViews?: { // For Black-Litterman
    asset: string;
    expectedReturn: number;
    confidence: number; // 0-1
  }[];
  
  rebalancingFreq: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  lookbackPeriod: number; // Days for historical data
  forecastHorizon: number; // Days for optimization horizon
}

export interface BacktestResult {
  period: { start: number; end: number };
  returns: number[];
  cumReturns: number[];
  
  performance: {
    totalReturn: number;
    annualizedReturn: number;
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    profitFactor: number;
  };
  
  benchmark: {
    name: string;
    returns: number[];
    totalReturn: number;
    alpha: number;
    beta: number;
    trackingError: number;
  };
  
  rebalances: {
    dates: number[];
    turnovers: number[];
    costs: number[];
  };
}

export class PortfolioOptimizer extends EventEmitter {
  private assets: Map<string, Asset> = new Map();
  private historicalData: Map<string, number[]> = new Map(); // Price history
  private correlationMatrix: number[][] = [];
  private covarianceMatrix: number[][] = [];
  private optimizationHistory: OptimizationResult[] = [];
  
  // Market regime and sentiment integration
  private marketRegime: string = 'normal';
  private sentimentScores: Map<string, number> = new Map();
  
  // Black-Litterman parameters
  private marketEquilibrium: Map<string, number> = new Map();
  private riskAversion: number = 3.0;

  constructor() {
    super();
    this.initializeOptimizer();
  }

  private initializeOptimizer() {
    // Initialize with common crypto assets
    this.initializeDefaultAssets();
    
    // Start periodic optimization
    setInterval(() => {
      this.performPeriodicOptimization();
    }, 60 * 60 * 1000); // Every hour
  }

  private initializeDefaultAssets() {
    // Major cryptocurrencies
    const defaultAssets: Partial<Asset>[] = [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        type: 'crypto',
        constraints: { minWeight: 0.1, maxWeight: 0.4, isRequired: true, isExcluded: false },
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        type: 'crypto',
        constraints: { minWeight: 0.05, maxWeight: 0.3, isRequired: true, isExcluded: false },
      },
      {
        symbol: 'BNB',
        name: 'Binance Coin',
        type: 'crypto',
        constraints: { minWeight: 0, maxWeight: 0.15, isRequired: false, isExcluded: false },
      },
      {
        symbol: 'ADA',
        name: 'Cardano',
        type: 'crypto',
        constraints: { minWeight: 0, maxWeight: 0.1, isRequired: false, isExcluded: false },
      },
      {
        symbol: 'SOL',
        name: 'Solana',
        type: 'crypto',
        constraints: { minWeight: 0, maxWeight: 0.1, isRequired: false, isExcluded: false },
      },
    ];

    defaultAssets.forEach(assetData => {
      if (assetData.symbol) {
        const asset: Asset = {
          ...assetData,
          currentPrice: 50000, // Mock price
          marketCap: 1000000000,
          volume24h: 10000000,
          statistics: {
            expectedReturn: 0.15 + Math.random() * 0.3, // 15-45% expected return
            volatility: 0.4 + Math.random() * 0.4, // 40-80% volatility
            sharpeRatio: 0.3 + Math.random() * 0.7,
            beta: 0.8 + Math.random() * 0.4,
            correlation: {},
          },
          features: {
            marketRegime: 'normal',
            sentimentScore: Math.random() * 2 - 1,
            technicalScore: Math.random() * 2 - 1,
            fundamentalScore: Math.random() * 2 - 1,
            liquidityScore: Math.random(),
          },
        } as Asset;
        
        this.assets.set(asset.symbol, asset);
      }
    });

    // Calculate initial correlations
    this.updateCorrelationMatrix();
  }

  // Main optimization function
  public async optimizePortfolio(
    currentPortfolio: { [symbol: string]: number }, // Current weights
    parameters: OptimizationParameters
  ): Promise<OptimizationResult> {
    
    // Update asset statistics
    await this.updateAssetStatistics();
    
    // Update correlation matrix
    this.updateCorrelationMatrix();
    
    // Select optimization method
    let allocation: PortfolioAllocation[];
    let method: string;
    
    switch (parameters.objective) {
      case 'max_sharpe':
        allocation = await this.maximizeSharpeRatio(parameters);
        method = 'max_sharpe';
        break;
      
      case 'min_variance':
        allocation = await this.minimizeVariance(parameters);
        method = 'min_variance';
        break;
      
      case 'risk_parity':
        allocation = await this.riskParityOptimization(parameters);
        method = 'risk_parity';
        break;
      
      default:
        allocation = await this.blackLittermanOptimization(parameters);
        method = 'black_litterman';
    }
    
    // Calculate portfolio metrics
    const portfolioMetrics = this.calculatePortfolioMetrics(allocation);
    
    // Calculate risk decomposition
    const riskDecomposition = this.calculateRiskDecomposition(allocation);
    
    // Calculate rebalancing requirements
    const rebalancing = this.calculateRebalancing(currentPortfolio, allocation, parameters);
    
    // Run scenario analysis
    const scenarios = this.runScenarioAnalysis(allocation);
    
    const result: OptimizationResult = {
      allocations: allocation,
      portfolioMetrics,
      riskDecomposition,
      optimization: {
        method: method as any,
        objective: parameters.objective,
        constraints: this.getConstraintDescriptions(parameters),
        convergence: true, // Simplified
        iterations: 100, // Mock
      },
      rebalancing,
      scenarios,
      timestamp: Date.now(),
    };
    
    this.optimizationHistory.push(result);
    this.emit('optimizationComplete', result);
    
    return result;
  }

  // Maximum Sharpe Ratio Optimization
  private async maximizeSharpeRatio(params: OptimizationParameters): Promise<PortfolioAllocation[]> {
    const assets = Array.from(this.assets.values());
    const n = assets.length;
    
    // Use quadratic programming to solve
    // max (w'μ - rf) / √(w'Σw)
    // subject to constraints
    
    const weights = await this.solveQuadraticProgram(
      'maximize',
      (w: number[]) => this.calculateSharpeRatio(w),
      params
    );
    
    return this.createAllocationFromWeights(weights, assets);
  }

  // Minimum Variance Optimization
  private async minimizeVariance(params: OptimizationParameters): Promise<PortfolioAllocation[]> {
    const assets = Array.from(this.assets.values());
    
    const weights = await this.solveQuadraticProgram(
      'minimize',
      (w: number[]) => this.calculatePortfolioVariance(w),
      params
    );
    
    return this.createAllocationFromWeights(weights, assets);
  }

  // Risk Parity Optimization
  private async riskParityOptimization(params: OptimizationParameters): Promise<PortfolioAllocation[]> {
    const assets = Array.from(this.assets.values());
    const n = assets.length;
    
    // Risk parity: each asset contributes equally to portfolio risk
    // Solve: minimize Σ(RCi - 1/n)² where RCi is risk contribution of asset i
    
    const weights = await this.solveRiskParity(params);
    
    return this.createAllocationFromWeights(weights, assets);
  }

  // Black-Litterman Optimization
  private async blackLittermanOptimization(params: OptimizationParameters): Promise<PortfolioAllocation[]> {
    const assets = Array.from(this.assets.values());
    const n = assets.length;
    
    // Step 1: Calculate implied equilibrium returns
    const equilibriumReturns = this.calculateEquilibriumReturns();
    
    // Step 2: Incorporate investor views
    const { adjustedReturns, adjustedCovariance } = this.incorporateViews(
      equilibriumReturns,
      params.marketViews || []
    );
    
    // Step 3: Optimize with adjusted parameters
    const weights = await this.solveOptimizationWithViews(adjustedReturns, adjustedCovariance, params);
    
    return this.createAllocationFromWeights(weights, assets);
  }

  // Quadratic Programming Solver (simplified)
  private async solveQuadraticProgram(
    direction: 'maximize' | 'minimize',
    objectiveFunction: (weights: number[]) => number,
    params: OptimizationParameters
  ): Promise<number[]> {
    
    const assets = Array.from(this.assets.values());
    const n = assets.length;
    
    // Use gradient descent optimization (simplified)
    let weights = new Array(n).fill(1 / n); // Start with equal weights
    const learningRate = 0.01;
    const maxIterations = 1000;
    const tolerance = 1e-6;
    
    for (let iter = 0; iter < maxIterations; iter++) {
      const gradient = this.calculateGradient(weights, objectiveFunction);
      const newWeights = weights.map((w, i) => {
        const step = direction === 'maximize' ? gradient[i] : -gradient[i];
        return w + learningRate * step;
      });
      
      // Apply constraints
      const constrainedWeights = this.applyConstraints(newWeights, params);
      
      // Check convergence
      const change = constrainedWeights.reduce((sum, w, i) => sum + Math.abs(w - weights[i]), 0);
      if (change < tolerance) break;
      
      weights = constrainedWeights;
    }
    
    return weights;
  }

  // Risk Parity Solver
  private async solveRiskParity(params: OptimizationParameters): Promise<number[]> {
    const assets = Array.from(this.assets.values());
    const n = assets.length;
    
    // Iterative algorithm for risk parity
    let weights = new Array(n).fill(1 / n);
    const maxIterations = 100;
    
    for (let iter = 0; iter < maxIterations; iter++) {
      const riskContributions = this.calculateRiskContributions(weights);
      const targetRC = 1 / n; // Equal risk contribution
      
      // Adjust weights based on risk contribution deviation
      const newWeights = weights.map((w, i) => {
        const adjustment = targetRC / riskContributions[i];
        return w * Math.pow(adjustment, 0.1); // Dampened adjustment
      });
      
      // Normalize weights
      const sum = newWeights.reduce((s, w) => s + w, 0);
      weights = newWeights.map(w => w / sum);
      
      // Apply constraints
      weights = this.applyConstraints(weights, params);
    }
    
    return weights;
  }

  // Black-Litterman implementation
  private calculateEquilibriumReturns(): number[] {
    const assets = Array.from(this.assets.values());
    const marketCaps = assets.map(a => a.marketCap);
    const totalMarketCap = marketCaps.reduce((sum, cap) => sum + cap, 0);
    
    // Market cap weighted portfolio as equilibrium
    const marketWeights = marketCaps.map(cap => cap / totalMarketCap);
    
    // Implied returns = risk_aversion * covariance * market_weights
    const equilibriumReturns = marketWeights.map((w, i) => {
      let impliedReturn = 0;
      for (let j = 0; j < assets.length; j++) {
        const covariance = this.getCovariance(i, j);
        impliedReturn += this.riskAversion * covariance * marketWeights[j];
      }
      return impliedReturn;
    });
    
    return equilibriumReturns;
  }

  private incorporateViews(
    equilibriumReturns: number[], 
    views: OptimizationParameters['marketViews']
  ): { adjustedReturns: number[]; adjustedCovariance: number[][] } {
    
    if (!views || views.length === 0) {
      return {
        adjustedReturns: equilibriumReturns,
        adjustedCovariance: this.covarianceMatrix,
      };
    }
    
    const assets = Array.from(this.assets.values());
    const n = assets.length;
    const k = views.length;
    
    // Pick matrix P (which assets the views relate to)
    const P = Array(k).fill(0).map(() => Array(n).fill(0));
    const Q = Array(k).fill(0); // View returns
    const Omega = Array(k).fill(0).map(() => Array(k).fill(0)); // View uncertainty
    
    views.forEach((view, i) => {
      const assetIndex = assets.findIndex(a => a.symbol === view.asset);
      if (assetIndex !== -1) {
        P[i][assetIndex] = 1;
        Q[i] = view.expectedReturn;
        Omega[i][i] = (1 - view.confidence) * this.getCovariance(assetIndex, assetIndex);
      }
    });
    
    // Black-Litterman formula
    // μ_BL = [(τΣ)^-1 + P'Ω^-1P]^-1[(τΣ)^-1μ + P'Ω^-1Q]
    const tau = 0.05; // Scaling factor
    
    // Simplified calculation (in practice, would use proper matrix operations)
    const adjustedReturns = equilibriumReturns.map((mu, i) => {
      let adjustment = 0;
      views.forEach(view => {
        const assetIndex = assets.findIndex(a => a.symbol === view.asset);
        if (assetIndex === i) {
          const confidence = view.confidence;
          adjustment += confidence * (view.expectedReturn - mu);
        }
      });
      return mu + adjustment * 0.1; // Simplified blending
    });
    
    return {
      adjustedReturns,
      adjustedCovariance: this.covarianceMatrix, // Simplified - would adjust covariance too
    };
  }

  private async solveOptimizationWithViews(
    returns: number[],
    covariance: number[][],
    params: OptimizationParameters
  ): Promise<number[]> {
    
    // Use adjusted returns and covariance in standard mean-variance optimization
    const assets = Array.from(this.assets.values());
    const n = assets.length;
    
    // Maximize utility: w'μ - (λ/2)w'Σw
    const lambda = this.riskAversion;
    
    let weights = new Array(n).fill(1 / n);
    const learningRate = 0.01;
    const maxIterations = 500;
    
    for (let iter = 0; iter < maxIterations; iter++) {
      const gradient = weights.map((w, i) => {
        let grad = returns[i]; // Expected return component
        
        // Risk penalty component: -λ * Σw_j * Σ_ij
        let riskPenalty = 0;
        for (let j = 0; j < n; j++) {
          riskPenalty += weights[j] * covariance[i][j];
        }
        grad -= lambda * riskPenalty;
        
        return grad;
      });
      
      // Update weights
      const newWeights = weights.map((w, i) => w + learningRate * gradient[i]);
      
      // Apply constraints
      weights = this.applyConstraints(newWeights, params);
    }
    
    return weights;
  }

  // Portfolio metrics calculations
  private calculatePortfolioMetrics(allocations: PortfolioAllocation[]): OptimizationResult['portfolioMetrics'] {
    const weights = allocations.map(a => a.weight);
    
    const expectedReturn = this.calculateExpectedReturn(weights);
    const volatility = Math.sqrt(this.calculatePortfolioVariance(weights));
    const sharpeRatio = expectedReturn / volatility;
    
    // Estimate other metrics (simplified)
    const sortino = sharpeRatio * 1.2; // Approximate
    const maxDrawdown = volatility * 2; // Rough estimate
    const var95 = -1.645 * volatility; // Parametric VaR
    const var99 = -2.326 * volatility;
    const conditionalVaR = var95 * 1.3; // Approximate CVaR
    
    return {
      expectedReturn,
      volatility,
      sharpeRatio,
      sortino,
      maxDrawdown,
      var95,
      var99,
      conditionalVaR,
    };
  }

  private calculateRiskDecomposition(allocations: PortfolioAllocation[]): OptimizationResult['riskDecomposition'] {
    const weights = allocations.map(a => a.weight);
    const totalRisk = Math.sqrt(this.calculatePortfolioVariance(weights));
    
    // Calculate specific and systematic risk components
    let specificRisk = 0;
    let systematicRisk = 0;
    
    weights.forEach((w, i) => {
      const asset = Array.from(this.assets.values())[i];
      const assetRisk = w * asset.statistics.volatility;
      
      // Approximate decomposition
      specificRisk += assetRisk * (1 - asset.statistics.beta);
      systematicRisk += assetRisk * asset.statistics.beta;
    });
    
    // Concentration risk (Herfindahl index)
    const concentrationRisk = weights.reduce((sum, w) => sum + w * w, 0);
    
    return {
      totalRisk,
      specificRisk,
      systematicRisk,
      concentrationRisk,
    };
  }

  private calculateRebalancing(
    currentPortfolio: { [symbol: string]: number },
    newAllocations: PortfolioAllocation[],
    params: OptimizationParameters
  ): OptimizationResult['rebalancing'] {
    
    let totalTurnover = 0;
    let tradingCosts = 0;
    
    newAllocations.forEach(allocation => {
      const currentWeight = currentPortfolio[allocation.symbol] || 0;
      const weightChange = Math.abs(allocation.weight - currentWeight);
      
      totalTurnover += weightChange;
      
      // Estimate trading costs (simplified)
      const tradingCost = weightChange * 0.002; // 0.2% cost assumption
      tradingCosts += tradingCost;
      
      // Determine rebalance action
      if (weightChange > 0.01) { // 1% threshold
        allocation.rebalanceAction = allocation.weight > currentWeight ? 'buy' : 'sell';
        allocation.rebalanceAmount = weightChange;
      } else {
        allocation.rebalanceAction = 'hold';
        allocation.rebalanceAmount = 0;
      }
    });
    
    // Calculate net benefit (expected alpha minus costs)
    const expectedAlpha = 0.02; // 2% annual alpha assumption
    const netBenefit = expectedAlpha - tradingCosts;
    
    return {
      totalTurnover,
      tradingCosts,
      netBenefit,
      frequency: params.rebalancingFreq,
    };
  }

  private runScenarioAnalysis(allocations: PortfolioAllocation[]): OptimizationResult['scenarios'] {
    const weights = allocations.map(a => a.weight);
    const baseReturn = this.calculateExpectedReturn(weights);
    const baseRisk = Math.sqrt(this.calculatePortfolioVariance(weights));
    
    return {
      bullMarket: {
        return: baseReturn * 1.5,
        risk: baseRisk * 0.8,
      },
      bearMarket: {
        return: baseReturn * -0.5,
        risk: baseRisk * 1.5,
      },
      highVolatility: {
        return: baseReturn * 0.8,
        risk: baseRisk * 2.0,
      },
      normalMarket: {
        return: baseReturn,
        risk: baseRisk,
      },
    };
  }

  // Helper calculation methods
  private calculateSharpeRatio(weights: number[]): number {
    const expectedReturn = this.calculateExpectedReturn(weights);
    const volatility = Math.sqrt(this.calculatePortfolioVariance(weights));
    const riskFreeRate = 0.03; // 3% risk-free rate
    
    return (expectedReturn - riskFreeRate) / volatility;
  }

  private calculateExpectedReturn(weights: number[]): number {
    const assets = Array.from(this.assets.values());
    return weights.reduce((sum, w, i) => sum + w * assets[i].statistics.expectedReturn, 0);
  }

  private calculatePortfolioVariance(weights: number[]): number {
    let variance = 0;
    const n = weights.length;
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const covariance = this.getCovariance(i, j);
        variance += weights[i] * weights[j] * covariance;
      }
    }
    
    return variance;
  }

  private calculateRiskContributions(weights: number[]): number[] {
    const portfolioVariance = this.calculatePortfolioVariance(weights);
    const assets = Array.from(this.assets.values());
    
    return weights.map((w, i) => {
      let marginalContribution = 0;
      for (let j = 0; j < weights.length; j++) {
        marginalContribution += weights[j] * this.getCovariance(i, j);
      }
      return (w * marginalContribution) / portfolioVariance;
    });
  }

  private calculateGradient(weights: number[], objectiveFunction: (w: number[]) => number): number[] {
    const epsilon = 1e-6;
    const gradient = new Array(weights.length);
    
    for (let i = 0; i < weights.length; i++) {
      const weightsPlus = [...weights];
      const weightsMinus = [...weights];
      
      weightsPlus[i] += epsilon;
      weightsMinus[i] -= epsilon;
      
      gradient[i] = (objectiveFunction(weightsPlus) - objectiveFunction(weightsMinus)) / (2 * epsilon);
    }
    
    return gradient;
  }

  private applyConstraints(weights: number[], params: OptimizationParameters): number[] {
    const assets = Array.from(this.assets.values());
    let constrainedWeights = [...weights];
    
    // Apply individual asset constraints
    constrainedWeights = constrainedWeights.map((w, i) => {
      const asset = assets[i];
      return Math.max(
        asset.constraints.minWeight,
        Math.min(asset.constraints.maxWeight, w)
      );
    });
    
    // Apply portfolio constraints
    constrainedWeights = constrainedWeights.map(w => 
      Math.max(params.constraints.minPositionSize, 
      Math.min(params.constraints.maxPositionSize, w))
    );
    
    // Normalize to sum to 1
    const sum = constrainedWeights.reduce((s, w) => s + w, 0);
    if (sum > 0) {
      constrainedWeights = constrainedWeights.map(w => w / sum);
    }
    
    return constrainedWeights;
  }

  private createAllocationFromWeights(weights: number[], assets: Asset[]): PortfolioAllocation[] {
    return weights.map((weight, i) => {
      const asset = assets[i];
      
      return {
        symbol: asset.symbol,
        weight,
        targetQuantity: weight * 100000 / asset.currentPrice, // Assume $100k portfolio
        currentQuantity: 0, // To be filled by caller
        rebalanceAction: 'hold',
        rebalanceAmount: 0,
        contribution: {
          expectedReturn: weight * asset.statistics.expectedReturn,
          risk: weight * asset.statistics.volatility,
          diversificationBenefit: this.calculateDiversificationBenefit(weight, i, weights),
        },
      };
    });
  }

  private calculateDiversificationBenefit(weight: number, assetIndex: number, allWeights: number[]): number {
    // Simplified calculation of diversification benefit
    const standaloneRisk = weight * this.assets.get(Array.from(this.assets.keys())[assetIndex])!.statistics.volatility;
    const portfolioRisk = Math.sqrt(this.calculatePortfolioVariance(allWeights));
    
    return Math.max(0, standaloneRisk - portfolioRisk);
  }

  // Matrix operations and data management
  private updateCorrelationMatrix() {
    const assets = Array.from(this.assets.values());
    const n = assets.length;
    
    this.correlationMatrix = Array(n).fill(0).map(() => Array(n).fill(0));
    this.covarianceMatrix = Array(n).fill(0).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          this.correlationMatrix[i][j] = 1;
          this.covarianceMatrix[i][j] = Math.pow(assets[i].statistics.volatility, 2);
        } else {
          // Use stored correlation or estimate
          const correlation = assets[i].statistics.correlation[assets[j].symbol] || 
                            this.estimateCorrelation(assets[i].symbol, assets[j].symbol);
          
          this.correlationMatrix[i][j] = correlation;
          this.covarianceMatrix[i][j] = correlation * 
            assets[i].statistics.volatility * assets[j].statistics.volatility;
        }
      }
    }
  }

  private estimateCorrelation(symbol1: string, symbol2: string): number {
    // Simplified correlation estimation
    if (symbol1 === symbol2) return 1;
    
    // Crypto assets tend to be more correlated
    const cryptoCorrelation = 0.6 + Math.random() * 0.3; // 0.6-0.9
    return cryptoCorrelation;
  }

  private getCovariance(i: number, j: number): number {
    if (this.covarianceMatrix[i] && this.covarianceMatrix[i][j] !== undefined) {
      return this.covarianceMatrix[i][j];
    }
    return 0;
  }

  private async updateAssetStatistics() {
    // Update expected returns, volatilities, etc. based on recent data
    // This would typically involve fetching new market data and recalculating statistics
    
    this.assets.forEach((asset, symbol) => {
      // Update with market regime adjustments
      asset.statistics.expectedReturn *= this.getRegimeAdjustment(asset);
      
      // Update with sentiment adjustments
      const sentimentScore = this.sentimentScores.get(symbol) || 0;
      asset.statistics.expectedReturn += sentimentScore * 0.05; // 5% max adjustment
      
      // Update features
      asset.features.marketRegime = this.marketRegime;
      asset.features.sentimentScore = sentimentScore;
    });
  }

  private getRegimeAdjustment(asset: Asset): number {
    // Adjust expected returns based on market regime
    switch (this.marketRegime) {
      case 'bull_trend':
        return 1.2; // 20% boost
      case 'bear_trend':
        return 0.8; // 20% reduction
      case 'high_volatility':
        return 0.9; // 10% reduction
      case 'ranging':
        return 1.0; // No change
      default:
        return 1.0;
    }
  }

  private getConstraintDescriptions(params: OptimizationParameters): string[] {
    const descriptions = [
      `Max position size: ${(params.constraints.maxPositionSize * 100).toFixed(1)}%`,
      `Min position size: ${(params.constraints.minPositionSize * 100).toFixed(1)}%`,
      `Risk tolerance: ${(params.riskTolerance * 100).toFixed(0)}%`,
    ];
    
    if (params.targetReturn) {
      descriptions.push(`Target return: ${(params.targetReturn * 100).toFixed(1)}%`);
    }
    
    if (params.maxRisk) {
      descriptions.push(`Max risk: ${(params.maxRisk * 100).toFixed(1)}%`);
    }
    
    return descriptions;
  }

  // Backtesting functionality
  public async backtestStrategy(
    params: OptimizationParameters,
    startDate: number,
    endDate: number,
    benchmarkSymbol: string = 'BTC'
  ): Promise<BacktestResult> {
    
    const dailyReturns: number[] = [];
    const cumReturns: number[] = [0];
    const rebalanceDates: number[] = [];
    const turnovers: number[] = [];
    const costs: number[] = [];
    
    // Simulate backtesting (simplified)
    const days = Math.floor((endDate - startDate) / (24 * 60 * 60 * 1000));
    let currentPortfolio: { [symbol: string]: number } = {};
    
    for (let day = 0; day < days; day++) {
      const date = startDate + day * 24 * 60 * 60 * 1000;
      
      // Rebalance based on frequency
      const shouldRebalance = this.shouldRebalance(date, params.rebalancingFreq, rebalanceDates);
      
      if (shouldRebalance || day === 0) {
        const optimization = await this.optimizePortfolio(currentPortfolio, params);
        
        // Calculate turnover and costs
        let turnover = 0;
        let cost = 0;
        
        optimization.allocations.forEach(allocation => {
          const currentWeight = currentPortfolio[allocation.symbol] || 0;
          const weightChange = Math.abs(allocation.weight - currentWeight);
          turnover += weightChange;
          cost += weightChange * 0.002; // 0.2% trading cost
          
          currentPortfolio[allocation.symbol] = allocation.weight;
        });
        
        rebalanceDates.push(date);
        turnovers.push(turnover);
        costs.push(cost);
      }
      
      // Calculate daily return
      const dayReturn = this.simulateDailyReturn(currentPortfolio);
      dailyReturns.push(dayReturn);
      
      const cumReturn = cumReturns[cumReturns.length - 1] + dayReturn;
      cumReturns.push(cumReturn);
    }
    
    // Calculate performance metrics
    const totalReturn = cumReturns[cumReturns.length - 1];
    const annualizedReturn = Math.pow(1 + totalReturn, 252 / days) - 1;
    const volatility = this.calculateVolatility(dailyReturns) * Math.sqrt(252);
    const sharpeRatio = annualizedReturn / volatility;
    const maxDrawdown = this.calculateMaxDrawdown(cumReturns);
    const winRate = dailyReturns.filter(r => r > 0).length / dailyReturns.length;
    const profitFactor = this.calculateProfitFactor(dailyReturns);
    
    // Benchmark comparison (simplified)
    const benchmarkReturns = this.simulateBenchmarkReturns(days);
    const benchmarkTotalReturn = benchmarkReturns.reduce((sum, r) => sum + r, 0);
    const alpha = totalReturn - benchmarkTotalReturn;
    const beta = this.calculateBeta(dailyReturns, benchmarkReturns);
    const trackingError = this.calculateVolatility(
      dailyReturns.map((r, i) => r - benchmarkReturns[i])
    ) * Math.sqrt(252);
    
    return {
      period: { start: startDate, end: endDate },
      returns: dailyReturns,
      cumReturns,
      performance: {
        totalReturn,
        annualizedReturn,
        volatility,
        sharpeRatio,
        maxDrawdown,
        winRate,
        profitFactor,
      },
      benchmark: {
        name: benchmarkSymbol,
        returns: benchmarkReturns,
        totalReturn: benchmarkTotalReturn,
        alpha,
        beta,
        trackingError,
      },
      rebalances: {
        dates: rebalanceDates,
        turnovers,
        costs,
      },
    };
  }

  // Additional helper methods for backtesting
  private shouldRebalance(date: number, frequency: string, rebalanceDates: number[]): boolean {
    if (rebalanceDates.length === 0) return true;
    
    const lastRebalance = rebalanceDates[rebalanceDates.length - 1];
    const daysSinceRebalance = (date - lastRebalance) / (24 * 60 * 60 * 1000);
    
    switch (frequency) {
      case 'daily': return daysSinceRebalance >= 1;
      case 'weekly': return daysSinceRebalance >= 7;
      case 'monthly': return daysSinceRebalance >= 30;
      case 'quarterly': return daysSinceRebalance >= 90;
      default: return false;
    }
  }

  private simulateDailyReturn(portfolio: { [symbol: string]: number }): number {
    let portfolioReturn = 0;
    
    Object.entries(portfolio).forEach(([symbol, weight]) => {
      const asset = this.assets.get(symbol);
      if (asset) {
        // Simulate daily return based on asset statistics
        const dailyReturn = this.generateRandomReturn(
          asset.statistics.expectedReturn / 252, // Daily expected return
          asset.statistics.volatility / Math.sqrt(252) // Daily volatility
        );
        portfolioReturn += weight * dailyReturn;
      }
    });
    
    return portfolioReturn;
  }

  private generateRandomReturn(expectedReturn: number, volatility: number): number {
    // Generate random return using normal distribution
    const randomNormal = this.boxMullerTransform();
    return expectedReturn + volatility * randomNormal;
  }

  private boxMullerTransform(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  private calculateVolatility(returns: number[]): number {
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / returns.length;
    return Math.sqrt(variance);
  }

  private calculateMaxDrawdown(cumReturns: number[]): number {
    let maxDrawdown = 0;
    let peak = cumReturns[0];
    
    cumReturns.forEach(value => {
      if (value > peak) {
        peak = value;
      } else {
        const drawdown = (peak - value) / (1 + peak);
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
    });
    
    return maxDrawdown;
  }

  private calculateProfitFactor(returns: number[]): number {
    const profits = returns.filter(r => r > 0).reduce((sum, r) => sum + r, 0);
    const losses = Math.abs(returns.filter(r => r < 0).reduce((sum, r) => sum + r, 0));
    return losses > 0 ? profits / losses : Infinity;
  }

  private calculateBeta(portfolioReturns: number[], benchmarkReturns: number[]): number {
    const covariance = this.calculateCovariance(portfolioReturns, benchmarkReturns);
    const benchmarkVariance = this.calculateVolatility(benchmarkReturns) ** 2;
    return benchmarkVariance > 0 ? covariance / benchmarkVariance : 0;
  }

  private calculateCovariance(returns1: number[], returns2: number[]): number {
    const mean1 = returns1.reduce((sum, r) => sum + r, 0) / returns1.length;
    const mean2 = returns2.reduce((sum, r) => sum + r, 0) / returns2.length;
    
    const covariance = returns1.reduce((sum, r1, i) => {
      const r2 = returns2[i];
      return sum + (r1 - mean1) * (r2 - mean2);
    }, 0) / returns1.length;
    
    return covariance;
  }

  private simulateBenchmarkReturns(days: number): number[] {
    const benchmarkReturns: number[] = [];
    
    for (let i = 0; i < days; i++) {
      // Simulate benchmark (e.g., Bitcoin) returns
      const dailyReturn = this.generateRandomReturn(0.15 / 252, 0.8 / Math.sqrt(252));
      benchmarkReturns.push(dailyReturn);
    }
    
    return benchmarkReturns;
  }

  private async performPeriodicOptimization() {
    // Perform automatic reoptimization
    const defaultParams: OptimizationParameters = {
      objective: 'max_sharpe',
      riskTolerance: 0.6,
      constraints: {
        maxPositionSize: 0.3,
        minPositionSize: 0.05,
        maxTurnover: 0.5,
        maxTradingCost: 0.01,
        maxCorrelation: 0.8,
        minDiversification: 3,
        maxConcentration: 0.5,
      },
      preferences: {
        preferredAssets: ['BTC', 'ETH'],
        avoidedAssets: [],
        liquidityPreference: 0.7,
      },
      rebalancingFreq: 'weekly',
      lookbackPeriod: 252,
      forecastHorizon: 30,
    };
    
    try {
      await this.optimizePortfolio({}, defaultParams);
    } catch (error) {
      console.error('Periodic optimization failed:', error);
    }
  }

  // Public API methods
  public addAsset(asset: Asset) {
    this.assets.set(asset.symbol, asset);
    this.updateCorrelationMatrix();
  }

  public removeAsset(symbol: string) {
    this.assets.delete(symbol);
    this.updateCorrelationMatrix();
  }

  public updateMarketRegime(regime: string) {
    this.marketRegime = regime;
  }

  public updateSentimentScore(symbol: string, score: number) {
    this.sentimentScores.set(symbol, score);
  }

  public getOptimizationHistory(limit: number = 100): OptimizationResult[] {
    return this.optimizationHistory.slice(-limit);
  }

  public subscribeToOptimizations(callback: (result: OptimizationResult) => void) {
    this.on('optimizationComplete', callback);
  }
}

export const portfolioOptimizer = new PortfolioOptimizer();
