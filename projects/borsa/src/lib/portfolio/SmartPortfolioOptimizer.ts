import { EventEmitter } from 'events';
import { MarketData } from '../engines/UniversalMarketDataEngine';

export interface Asset {
  symbol: string;
  name: string;
  type: 'CRYPTO' | 'STOCK' | 'COMMODITY' | 'BOND' | 'FOREX';
  currentPrice: number;
  expectedReturn: number;
  volatility: number;
  beta?: number;
  marketCap?: number;
}

export interface PortfolioAllocation {
  symbol: string;
  weight: number;
  targetWeight: number;
  currentValue: number;
  expectedReturn: number;
  risk: number;
  sharpeContribution: number;
}

export interface OptimizationResult {
  allocations: PortfolioAllocation[];
  expectedReturn: number;
  expectedVolatility: number;
  sharpeRatio: number;
  diversificationRatio: number;
  maxDrawdown: number;
  var95: number; // Value at Risk 95%
  cvar95: number; // Conditional Value at Risk 95%
  optimizationMethod: string;
  constraints: OptimizationConstraints;
  timestamp: number;
}

export interface OptimizationConstraints {
  maxAssetWeight: number;
  minAssetWeight: number;
  maxSectorWeight?: number;
  minCash?: number;
  allowShortSelling: boolean;
  riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  rebalanceFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
}

export interface BlackLittermanView {
  assets: string[];
  expectedReturn: number;
  confidence: number;
  reasoning: string;
}

export class SmartPortfolioOptimizer extends EventEmitter {
  private assets: Map<string, Asset> = new Map();
  private correlationMatrix: Map<string, Map<string, number>> = new Map();
  private currentOptimization?: OptimizationResult;
  private views: BlackLittermanView[] = [];
  
  // Risk-free rate (assumed 3% annually)
  private riskFreeRate = 0.03;
  
  constructor() {
    super();
    this.initializeOptimizer();
  }

  private initializeOptimizer(): void {
    console.log('📊 Smart Portfolio Optimizer başlatıldı');
    
    // Sample assets initialization
    this.addSampleAssets();
    this.calculateCorrelations();
  }

  private addSampleAssets(): void {
    const sampleAssets: Asset[] = [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        type: 'CRYPTO',
        currentPrice: 43000,
        expectedReturn: 0.15, // 15% annual expected return
        volatility: 0.80, // 80% volatility
        marketCap: 850000000000
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        type: 'CRYPTO',
        currentPrice: 2800,
        expectedReturn: 0.18,
        volatility: 0.85,
        marketCap: 340000000000
      },
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        type: 'STOCK',
        currentPrice: 175,
        expectedReturn: 0.12,
        volatility: 0.25,
        beta: 1.2,
        marketCap: 2800000000000
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corp.',
        type: 'STOCK',
        currentPrice: 380,
        expectedReturn: 0.11,
        volatility: 0.22,
        beta: 0.9,
        marketCap: 2900000000000
      },
      {
        symbol: 'GLD',
        name: 'Gold ETF',
        type: 'COMMODITY',
        currentPrice: 180,
        expectedReturn: 0.06,
        volatility: 0.16,
        beta: -0.1
      },
      {
        symbol: 'TLT',
        name: 'Treasury Bonds',
        type: 'BOND',
        currentPrice: 95,
        expectedReturn: 0.04,
        volatility: 0.12,
        beta: -0.3
      }
    ];

    sampleAssets.forEach(asset => {
      this.assets.set(asset.symbol, asset);
    });
  }

  private calculateCorrelations(): void {
    // Simulated correlation matrix
    const symbols = Array.from(this.assets.keys());
    
    symbols.forEach(symbol1 => {
      this.correlationMatrix.set(symbol1, new Map());
      
      symbols.forEach(symbol2 => {
        let correlation: number;
        
        if (symbol1 === symbol2) {
          correlation = 1.0;
        } else {
          const asset1 = this.assets.get(symbol1)!;
          const asset2 = this.assets.get(symbol2)!;
          
          // Same asset type = higher correlation
          if (asset1.type === asset2.type) {
            correlation = 0.6 + Math.random() * 0.3; // 0.6 to 0.9
          } else if (
            (asset1.type === 'CRYPTO' && asset2.type === 'STOCK') ||
            (asset1.type === 'STOCK' && asset2.type === 'CRYPTO')
          ) {
            correlation = 0.2 + Math.random() * 0.4; // 0.2 to 0.6
          } else {
            correlation = -0.1 + Math.random() * 0.3; // -0.1 to 0.2
          }
        }
        
        this.correlationMatrix.get(symbol1)!.set(symbol2, correlation);
      });
    });
  }

  public async optimizePortfolio(
    totalValue: number,
    constraints: OptimizationConstraints,
    method: 'MARKOWITZ' | 'BLACK_LITTERMAN' | 'RISK_PARITY' | 'EQUAL_WEIGHT' = 'MARKOWITZ'
  ): Promise<OptimizationResult> {
    
    console.log(`🎯 Portfolio optimizasyonu başlatıldı: ${method}`);
    
    let result: OptimizationResult;
    
    switch (method) {
      case 'MARKOWITZ':
        result = await this.markowitzOptimization(totalValue, constraints);
        break;
      case 'BLACK_LITTERMAN':
        result = await this.blackLittermanOptimization(totalValue, constraints);
        break;
      case 'RISK_PARITY':
        result = await this.riskParityOptimization(totalValue, constraints);
        break;
      case 'EQUAL_WEIGHT':
        result = await this.equalWeightOptimization(totalValue, constraints);
        break;
      default:
        throw new Error(`Desteklenmeyen optimizasyon metodu: ${method}`);
    }
    
    this.currentOptimization = result;
    this.emit('optimizationComplete', result);
    
    console.log(`✅ Portfolio optimizasyonu tamamlandı - Sharpe: ${result.sharpeRatio.toFixed(3)}`);
    return result;
  }

  private async markowitzOptimization(
    totalValue: number,
    constraints: OptimizationConstraints
  ): Promise<OptimizationResult> {
    
    const assets = Array.from(this.assets.values());
    const n = assets.length;
    
    // Mean-Variance Optimization
    const weights = this.calculateOptimalWeights(assets, constraints);
    
    return this.createOptimizationResult(
      assets,
      weights,
      totalValue,
      constraints,
      'MARKOWITZ'
    );
  }

  private async blackLittermanOptimization(
    totalValue: number,
    constraints: OptimizationConstraints
  ): Promise<OptimizationResult> {
    
    const assets = Array.from(this.assets.values());
    
    // Black-Litterman Model
    // 1. Market equilibrium returns
    const equilibriumReturns = this.calculateEquilibriumReturns(assets);
    
    // 2. Incorporate views
    const blReturns = this.applyBlackLittermanViews(equilibriumReturns, assets);
    
    // 3. Optimize with adjusted returns
    const weights = this.calculateOptimalWeights(assets, constraints, blReturns);
    
    return this.createOptimizationResult(
      assets,
      weights,
      totalValue,
      constraints,
      'BLACK_LITTERMAN'
    );
  }

  private async riskParityOptimization(
    totalValue: number,
    constraints: OptimizationConstraints
  ): Promise<OptimizationResult> {
    
    const assets = Array.from(this.assets.values());
    const n = assets.length;
    
    // Risk Parity - equal risk contribution
    const weights = this.calculateRiskParityWeights(assets);
    
    return this.createOptimizationResult(
      assets,
      weights,
      totalValue,
      constraints,
      'RISK_PARITY'
    );
  }

  private async equalWeightOptimization(
    totalValue: number,
    constraints: OptimizationConstraints
  ): Promise<OptimizationResult> {
    
    const assets = Array.from(this.assets.values());
    const n = assets.length;
    
    // Equal weight allocation
    const equalWeight = 1 / n;
    const weights = new Array(n).fill(equalWeight);
    
    return this.createOptimizationResult(
      assets,
      weights,
      totalValue,
      constraints,
      'EQUAL_WEIGHT'
    );
  }

  private calculateOptimalWeights(
    assets: Asset[],
    constraints: OptimizationConstraints,
    customReturns?: number[]
  ): number[] {
    
    const n = assets.length;
    
    // Use custom returns if provided (Black-Litterman)
    const returns = customReturns || assets.map(a => a.expectedReturn);
    
    // Build covariance matrix
    const covMatrix = this.buildCovarianceMatrix(assets);
    
    // Quadratic Programming for Mean-Variance Optimization
    // Simplified implementation - in production use proper QP solver
    
    const weights: number[] = [];
    let remainingWeight = 1.0;
    
    // Risk-adjusted scoring
    for (let i = 0; i < n; i++) {
      const asset = assets[i];
      const expectedReturn = returns[i];
      const risk = asset.volatility;
      
      // Sharpe-like score with risk adjustment
      let score = (expectedReturn - this.riskFreeRate) / risk;
      
      // Apply risk tolerance adjustment
      if (constraints.riskTolerance === 'CONSERVATIVE') {
        score *= (asset.type === 'BOND' || asset.type === 'COMMODITY') ? 1.5 : 0.7;
      } else if (constraints.riskTolerance === 'AGGRESSIVE') {
        score *= (asset.type === 'CRYPTO' || asset.type === 'STOCK') ? 1.5 : 0.7;
      }
      
      weights.push(Math.max(score, 0));
    }
    
    // Normalize weights
    const totalScore = weights.reduce((sum, w) => sum + w, 0);
    const normalizedWeights = weights.map(w => w / totalScore);
    
    // Apply constraints
    return this.applyConstraints(normalizedWeights, constraints);
  }

  private calculateEquilibriumReturns(assets: Asset[]): number[] {
    // Reverse-engineering market implied returns
    return assets.map(asset => {
      // Simple equilibrium return based on risk premium
      const riskPremium = asset.volatility * 0.5; // Risk premium proportional to vol
      return this.riskFreeRate + riskPremium;
    });
  }

  private applyBlackLittermanViews(
    equilibriumReturns: number[],
    assets: Asset[]
  ): number[] {
    
    if (this.views.length === 0) {
      return equilibriumReturns;
    }
    
    // Simplified Black-Litterman implementation
    const adjustedReturns = [...equilibriumReturns];
    
    this.views.forEach(view => {
      view.assets.forEach(symbol => {
        const index = assets.findIndex(a => a.symbol === symbol);
        if (index >= 0) {
          // Blend equilibrium and view returns based on confidence
          const blendRatio = view.confidence;
          adjustedReturns[index] = 
            (1 - blendRatio) * equilibriumReturns[index] + 
            blendRatio * view.expectedReturn;
        }
      });
    });
    
    return adjustedReturns;
  }

  private calculateRiskParityWeights(assets: Asset[]): number[] {
    // Risk Parity - weights inversely proportional to volatility
    const invVol = assets.map(a => 1 / a.volatility);
    const totalInvVol = invVol.reduce((sum, v) => sum + v, 0);
    
    return invVol.map(v => v / totalInvVol);
  }

  private buildCovarianceMatrix(assets: Asset[]): number[][] {
    const n = assets.length;
    const covMatrix: number[][] = [];
    
    for (let i = 0; i < n; i++) {
      covMatrix[i] = [];
      for (let j = 0; j < n; j++) {
        const correlation = this.correlationMatrix.get(assets[i].symbol)?.get(assets[j].symbol) || 0;
        const covariance = correlation * assets[i].volatility * assets[j].volatility;
        covMatrix[i][j] = covariance;
      }
    }
    
    return covMatrix;
  }

  private applyConstraints(
    weights: number[],
    constraints: OptimizationConstraints
  ): number[] {
    
    const adjustedWeights = [...weights];
    
    // Apply min/max weight constraints
    for (let i = 0; i < adjustedWeights.length; i++) {
      adjustedWeights[i] = Math.max(constraints.minAssetWeight, adjustedWeights[i]);
      adjustedWeights[i] = Math.min(constraints.maxAssetWeight, adjustedWeights[i]);
    }
    
    // Renormalize to sum to 1
    const total = adjustedWeights.reduce((sum, w) => sum + w, 0);
    return adjustedWeights.map(w => w / total);
  }

  private createOptimizationResult(
    assets: Asset[],
    weights: number[],
    totalValue: number,
    constraints: OptimizationConstraints,
    method: string
  ): OptimizationResult {
    
    // Calculate portfolio metrics
    const expectedReturn = this.calculatePortfolioReturn(assets, weights);
    const expectedVolatility = this.calculatePortfolioVolatility(assets, weights);
    const sharpeRatio = (expectedReturn - this.riskFreeRate) / expectedVolatility;
    
    // Create allocations
    const allocations: PortfolioAllocation[] = assets.map((asset, i) => ({
      symbol: asset.symbol,
      weight: weights[i],
      targetWeight: weights[i],
      currentValue: totalValue * weights[i],
      expectedReturn: asset.expectedReturn,
      risk: asset.volatility,
      sharpeContribution: this.calculateSharpeContribution(asset, weights[i], expectedReturn, expectedVolatility)
    }));
    
    // Risk metrics
    const var95 = this.calculateVaR(expectedReturn, expectedVolatility, 0.95);
    const cvar95 = this.calculateCVaR(expectedReturn, expectedVolatility, 0.95);
    const diversificationRatio = this.calculateDiversificationRatio(assets, weights);
    const maxDrawdown = this.estimateMaxDrawdown(expectedVolatility);
    
    return {
      allocations,
      expectedReturn,
      expectedVolatility,
      sharpeRatio,
      diversificationRatio,
      maxDrawdown,
      var95,
      cvar95,
      optimizationMethod: method,
      constraints,
      timestamp: Date.now()
    };
  }

  private calculatePortfolioReturn(assets: Asset[], weights: number[]): number {
    return assets.reduce((sum, asset, i) => sum + asset.expectedReturn * weights[i], 0);
  }

  private calculatePortfolioVolatility(assets: Asset[], weights: number[]): number {
    let variance = 0;
    
    for (let i = 0; i < assets.length; i++) {
      for (let j = 0; j < assets.length; j++) {
        const correlation = this.correlationMatrix.get(assets[i].symbol)?.get(assets[j].symbol) || 0;
        const covariance = correlation * assets[i].volatility * assets[j].volatility;
        variance += weights[i] * weights[j] * covariance;
      }
    }
    
    return Math.sqrt(variance);
  }

  private calculateSharpeContribution(
    asset: Asset, 
    weight: number, 
    portfolioReturn: number, 
    portfolioVol: number
  ): number {
    const assetSharpe = (asset.expectedReturn - this.riskFreeRate) / asset.volatility;
    const portfolioSharpe = (portfolioReturn - this.riskFreeRate) / portfolioVol;
    
    return weight * (assetSharpe - portfolioSharpe);
  }

  private calculateVaR(expectedReturn: number, volatility: number, confidence: number): number {
    // Parametric VaR assuming normal distribution
    const zScore = this.getZScore(confidence);
    return -(expectedReturn - zScore * volatility);
  }

  private calculateCVaR(expectedReturn: number, volatility: number, confidence: number): number {
    // Expected Shortfall (CVaR)
    const zScore = this.getZScore(confidence);
    const pdfZ = Math.exp(-0.5 * zScore * zScore) / Math.sqrt(2 * Math.PI);
    
    return -(expectedReturn - volatility * pdfZ / (1 - confidence));
  }

  private getZScore(confidence: number): number {
    // Z-score for normal distribution
    if (confidence === 0.95) return 1.645;
    if (confidence === 0.99) return 2.326;
    if (confidence === 0.90) return 1.282;
    
    // Simplified approximation
    return Math.sqrt(2) * this.erfInv(2 * confidence - 1);
  }

  private erfInv(x: number): number {
    // Approximate inverse error function
    const a = 0.147;
    const lnx = Math.log(1 - x * x);
    const part1 = 2 / (Math.PI * a) + lnx / 2;
    const part2 = lnx / a;
    
    return Math.sign(x) * Math.sqrt(Math.sqrt(part1 * part1 - part2) - part1);
  }

  private calculateDiversificationRatio(assets: Asset[], weights: number[]): number {
    // Diversification Ratio = Weighted Average Vol / Portfolio Vol
    const weightedAvgVol = assets.reduce((sum, asset, i) => sum + weights[i] * asset.volatility, 0);
    const portfolioVol = this.calculatePortfolioVolatility(assets, weights);
    
    return portfolioVol > 0 ? weightedAvgVol / portfolioVol : 1;
  }

  private estimateMaxDrawdown(volatility: number): number {
    // Simplified maximum drawdown estimation
    return volatility * Math.sqrt(2 * Math.log(252)); // Assuming daily rebalancing
  }

  public addView(view: BlackLittermanView): void {
    this.views.push(view);
    console.log(`📋 Black-Litterman görüşü eklendi: ${view.assets.join(', ')}`);
  }

  public clearViews(): void {
    this.views = [];
    console.log('🗑️ Tüm Black-Litterman görüşleri temizlendi');
  }

  public updateAsset(symbol: string, updates: Partial<Asset>): void {
    const asset = this.assets.get(symbol);
    if (asset) {
      Object.assign(asset, updates);
      this.assets.set(symbol, asset);
      console.log(`📊 ${symbol} asset bilgileri güncellendi`);
    }
  }

  public async rebalancePortfolio(
    currentAllocations: { symbol: string; currentWeight: number }[],
    targetAllocations: PortfolioAllocation[]
  ): Promise<{ symbol: string; action: 'BUY' | 'SELL'; amount: number; reasoning: string }[]> {
    
    const rebalanceTrades: { symbol: string; action: 'BUY' | 'SELL'; amount: number; reasoning: string }[] = [];
    
    for (const target of targetAllocations) {
      const current = currentAllocations.find(c => c.symbol === target.symbol);
      const currentWeight = current?.currentWeight || 0;
      const weightDiff = target.targetWeight - currentWeight;
      
      if (Math.abs(weightDiff) > 0.01) { // 1% threshold
        const action = weightDiff > 0 ? 'BUY' : 'SELL';
        const amount = Math.abs(weightDiff);
        const reasoning = `Hedef ağırlık: ${(target.targetWeight * 100).toFixed(1)}%, Mevcut: ${(currentWeight * 100).toFixed(1)}%`;
        
        rebalanceTrades.push({
          symbol: target.symbol,
          action,
          amount,
          reasoning
        });
      }
    }
    
    console.log(`⚖️ Rebalancing: ${rebalanceTrades.length} işlem gerekiyor`);
    return rebalanceTrades;
  }

  public generateEfficinetFrontier(
    steps: number = 20
  ): { expectedReturn: number; volatility: number; sharpeRatio: number }[] {
    
    const assets = Array.from(this.assets.values());
    const minReturn = Math.min(...assets.map(a => a.expectedReturn));
    const maxReturn = Math.max(...assets.map(a => a.expectedReturn));
    
    const frontier: { expectedReturn: number; volatility: number; sharpeRatio: number }[] = [];
    
    for (let i = 0; i <= steps; i++) {
      const targetReturn = minReturn + (maxReturn - minReturn) * (i / steps);
      
      // Optimize for minimum variance given target return
      const weights = this.calculateMinVarianceWeights(assets, targetReturn);
      const volatility = this.calculatePortfolioVolatility(assets, weights);
      const sharpeRatio = (targetReturn - this.riskFreeRate) / volatility;
      
      frontier.push({
        expectedReturn: targetReturn,
        volatility,
        sharpeRatio
      });
    }
    
    return frontier;
  }

  private calculateMinVarianceWeights(assets: Asset[], targetReturn: number): number[] {
    // Simplified minimum variance calculation for given return
    // In production, use proper quadratic programming solver
    
    const n = assets.length;
    const weights = new Array(n).fill(1 / n);
    
    // Iterative approach to adjust weights toward target return
    for (let iter = 0; iter < 100; iter++) {
      const currentReturn = this.calculatePortfolioReturn(assets, weights);
      const returnDiff = targetReturn - currentReturn;
      
      if (Math.abs(returnDiff) < 0.001) break;
      
      // Adjust weights based on individual asset returns
      for (let i = 0; i < n; i++) {
        const adjustment = returnDiff * 0.01 * (assets[i].expectedReturn > currentReturn ? 1 : -1);
        weights[i] = Math.max(0.01, Math.min(0.5, weights[i] + adjustment));
      }
      
      // Normalize
      const total = weights.reduce((sum, w) => sum + w, 0);
      for (let i = 0; i < n; i++) {
        weights[i] /= total;
      }
    }
    
    return weights;
  }

  public getCurrentOptimization(): OptimizationResult | undefined {
    return this.currentOptimization;
  }

  public getAssets(): Map<string, Asset> {
    return new Map(this.assets);
  }

  public getCorrelationMatrix(): Map<string, Map<string, number>> {
    return new Map(this.correlationMatrix);
  }

  public generateOptimizationReport(result: OptimizationResult): string {
    let report = `\n📊 PORTFOLIO OPTIMIZATION RAPORU\n`;
    report += `═══════════════════════════════════════════\n`;
    report += `Method: ${result.optimizationMethod}\n`;
    report += `Optimization Date: ${new Date(result.timestamp).toLocaleString()}\n`;
    report += `\n🎯 PORTFOLIO METRİKLERİ:\n`;
    report += `Expected Return: ${(result.expectedReturn * 100).toFixed(2)}%\n`;
    report += `Expected Volatility: ${(result.expectedVolatility * 100).toFixed(2)}%\n`;
    report += `Sharpe Ratio: ${result.sharpeRatio.toFixed(3)}\n`;
    report += `Diversification Ratio: ${result.diversificationRatio.toFixed(3)}\n`;
    report += `\n📉 RİSK METRİKLERİ:\n`;
    report += `VaR (95%): ${(result.var95 * 100).toFixed(2)}%\n`;
    report += `CVaR (95%): ${(result.cvar95 * 100).toFixed(2)}%\n`;
    report += `Max Drawdown: ${(result.maxDrawdown * 100).toFixed(2)}%\n`;
    report += `\n💰 ALLOCATION:\n`;
    
    result.allocations.forEach(alloc => {
      report += `${alloc.symbol}: ${(alloc.weight * 100).toFixed(1)}% `;
      report += `($${alloc.currentValue.toLocaleString()})\n`;
    });
    
    report += `═══════════════════════════════════════════\n`;
    
    return report;
  }
}

export default SmartPortfolioOptimizer;