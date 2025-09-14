import { accountManager } from './accounts';
import { vault } from './vault';

interface Balance {
  asset: string;
  free: number;
  locked: number;
  total: number;
  usdValue?: number;
}

interface Position {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  markPrice: number;
  pnl: number;
  pnlPercent: number;
  margin: number;
  leverage: number;
  accountId: string;
  exchange: string;
}

interface ExposureInfo {
  symbol: string;
  totalSize: number;
  netSize: number;
  longSize: number;
  shortSize: number;
  accounts: Array<{
    accountId: string;
    exchange: string;
    size: number;
    side: 'long' | 'short';
  }>;
  totalMargin: number;
  weightedAvgPrice: number;
  unrealizedPnl: number;
}

interface RebalanceAction {
  accountId: string;
  exchange: string;
  symbol: string;
  action: 'buy' | 'sell' | 'close';
  quantity: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

interface PortfolioSnapshot {
  timestamp: Date;
  totalUsdValue: number;
  totalPnl: number;
  totalMargin: number;
  accountCount: number;
  positionCount: number;
  balances: Balance[];
  positions: Position[];
  exposures: ExposureInfo[];
}

export class PortfolioOMS {
  private cache: Map<string, PortfolioSnapshot> = new Map();
  private cacheExpiry: number = 30000; // 30 seconds

  /**
   * Get consolidated balances across all accounts
   */
  async getConsolidatedBalances(userId: string): Promise<Balance[]> {
    const accounts = accountManager.listAccounts(userId);
    const allBalances = new Map<string, Balance>();

    for (const account of accounts) {
      try {
        const credentials = await vault.getCredentials(userId, account.id);
        if (!credentials) continue;

        const balances = await this.fetchAccountBalances(account.exchange, credentials);
        
        for (const balance of balances) {
          const existing = allBalances.get(balance.asset);
          if (existing) {
            existing.free += balance.free;
            existing.locked += balance.locked;
            existing.total += balance.total;
            if (balance.usdValue) {
              existing.usdValue = (existing.usdValue || 0) + balance.usdValue;
            }
          } else {
            allBalances.set(balance.asset, { ...balance });
          }
        }
      } catch (error) {
        console.error(`Failed to fetch balances for ${account.exchange}:`, error);
      }
    }

    return Array.from(allBalances.values()).sort((a, b) => (b.usdValue || 0) - (a.usdValue || 0));
  }

  /**
   * Get consolidated positions across all accounts
   */
  async getConsolidatedPositions(userId: string): Promise<Position[]> {
    const accounts = accountManager.listAccounts(userId);
    const positions: Position[] = [];

    for (const account of accounts) {
      try {
        const credentials = await vault.getCredentials(userId, account.id);
        if (!credentials) continue;

        const accountPositions = await this.fetchAccountPositions(account.exchange, credentials);
        
        positions.push(...accountPositions.map(pos => ({
          ...pos,
          accountId: account.id,
          exchange: account.exchange
        })));
      } catch (error) {
        console.error(`Failed to fetch positions for ${account.exchange}:`, error);
      }
    }

    return positions.sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl));
  }

  /**
   * Calculate symbol exposure across accounts
   */
  async getSymbolExposures(userId: string): Promise<ExposureInfo[]> {
    const positions = await this.getConsolidatedPositions(userId);
    const exposures = new Map<string, ExposureInfo>();

    for (const position of positions) {
      const existing = exposures.get(position.symbol);
      
      if (existing) {
        // Update existing exposure
        existing.totalSize += Math.abs(position.size);
        existing.totalMargin += position.margin;
        existing.unrealizedPnl += position.pnl;
        
        if (position.side === 'long') {
          existing.longSize += position.size;
          existing.netSize += position.size;
        } else {
          existing.shortSize += Math.abs(position.size);
          existing.netSize -= Math.abs(position.size);
        }
        
        existing.accounts.push({
          accountId: position.accountId,
          exchange: position.exchange,
          size: position.size,
          side: position.side
        });
        
        // Recalculate weighted average price
        existing.weightedAvgPrice = this.calculateWeightedPrice(existing.accounts);
      } else {
        // Create new exposure
        exposures.set(position.symbol, {
          symbol: position.symbol,
          totalSize: Math.abs(position.size),
          netSize: position.side === 'long' ? position.size : -Math.abs(position.size),
          longSize: position.side === 'long' ? position.size : 0,
          shortSize: position.side === 'short' ? Math.abs(position.size) : 0,
          accounts: [{
            accountId: position.accountId,
            exchange: position.exchange,
            size: position.size,
            side: position.side
          }],
          totalMargin: position.margin,
          weightedAvgPrice: position.entryPrice,
          unrealizedPnl: position.pnl
        });
      }
    }

    return Array.from(exposures.values()).sort((a, b) => Math.abs(b.netSize) - Math.abs(a.netSize));
  }

  /**
   * Generate rebalancing plan (paper only)
   */
  async generateRebalancePlan(userId: string, options: {
    maxExposurePerSymbol?: number;
    targetLeverage?: number;
    riskBudget?: number;
  } = {}): Promise<RebalanceAction[]> {
    const exposures = await this.getSymbolExposures(userId);
    const actions: RebalanceAction[] = [];
    
    const {
      maxExposurePerSymbol = 50000, // $50k max per symbol
      targetLeverage = 3,
      riskBudget = 10000 // $10k max risk
    } = options;

    for (const exposure of exposures) {
      const totalExposureUsd = Math.abs(exposure.netSize * exposure.weightedAvgPrice);
      
      if (totalExposureUsd > maxExposurePerSymbol) {
        // Need to reduce exposure
        const excessUsd = totalExposureUsd - maxExposurePerSymbol;
        const reduceQuantity = excessUsd / exposure.weightedAvgPrice;
        
        // Find largest position to reduce
        const largestPosition = exposure.accounts.reduce((max, acc) => 
          Math.abs(acc.size) > Math.abs(max.size) ? acc : max
        );
        
        actions.push({
          accountId: largestPosition.accountId,
          exchange: largestPosition.exchange,
          symbol: exposure.symbol,
          action: largestPosition.size > 0 ? 'sell' : 'buy',
          quantity: Math.min(reduceQuantity, Math.abs(largestPosition.size) * 0.5), // Max 50% reduction
          reason: `Reduce ${exposure.symbol} exposure from $${totalExposureUsd.toFixed(0)} to $${maxExposurePerSymbol}`,
          priority: 'high'
        });
      }
      
      // Check for cross-exchange arbitrage opportunities
      if (exposure.accounts.length > 1) {
        const prices = exposure.accounts.map(acc => acc.size / acc.size * exposure.weightedAvgPrice);
        const maxPrice = Math.max(...prices);
        const minPrice = Math.min(...prices);
        
        if ((maxPrice - minPrice) / minPrice > 0.002) { // > 0.2% spread
          actions.push({
            accountId: exposure.accounts[0].accountId,
            exchange: exposure.accounts[0].exchange,
            symbol: exposure.symbol,
            action: 'buy',
            quantity: Math.min(1000, Math.abs(exposure.netSize) * 0.1),
            reason: `Arbitrage opportunity: ${((maxPrice - minPrice) / minPrice * 100).toFixed(2)}% spread`,
            priority: 'medium'
          });
        }
      }
    }

    return actions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Get portfolio snapshot
   */
  async getPortfolioSnapshot(userId: string, useCache: boolean = true): Promise<PortfolioSnapshot> {
    if (useCache) {
      const cached = this.cache.get(userId);
      if (cached && Date.now() - cached.timestamp.getTime() < this.cacheExpiry) {
        return cached;
      }
    }

    const [balances, positions, exposures] = await Promise.all([
      this.getConsolidatedBalances(userId),
      this.getConsolidatedPositions(userId),
      this.getSymbolExposures(userId)
    ]);

    const totalUsdValue = balances.reduce((sum, b) => sum + (b.usdValue || 0), 0);
    const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
    const totalMargin = positions.reduce((sum, p) => sum + p.margin, 0);

    const snapshot: PortfolioSnapshot = {
      timestamp: new Date(),
      totalUsdValue,
      totalPnl,
      totalMargin,
      accountCount: accountManager.listAccounts(userId).length,
      positionCount: positions.length,
      balances,
      positions,
      exposures
    };

    this.cache.set(userId, snapshot);
    return snapshot;
  }

  /**
   * Mock implementation for fetching account balances
   */
  private async fetchAccountBalances(exchange: string, credentials: any): Promise<Balance[]> {
    // Mock implementation - replace with actual exchange API calls
    const mockBalances: Balance[] = [
      {
        asset: 'USDT',
        free: 10000 + Math.random() * 5000,
        locked: 500 + Math.random() * 200,
        total: 0,
        usdValue: 0
      },
      {
        asset: 'BTC',
        free: 0.1 + Math.random() * 0.05,
        locked: 0.01 + Math.random() * 0.005,
        total: 0,
        usdValue: 0
      }
    ];

    // Calculate totals and USD values
    mockBalances.forEach(balance => {
      balance.total = balance.free + balance.locked;
      if (balance.asset === 'USDT') {
        balance.usdValue = balance.total;
      } else if (balance.asset === 'BTC') {
        balance.usdValue = balance.total * 42000; // Mock BTC price
      }
    });

    return mockBalances;
  }

  /**
   * Mock implementation for fetching account positions
   */
  private async fetchAccountPositions(exchange: string, credentials: any): Promise<Omit<Position, 'accountId' | 'exchange'>[]> {
    // Mock implementation - replace with actual exchange API calls
    const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
    const positions = symbols.slice(0, Math.floor(Math.random() * 3) + 1).map(symbol => {
      const side: 'long' | 'short' = Math.random() > 0.5 ? 'long' : 'short';
      const size = (Math.random() * 0.1 + 0.01) * (side === 'short' ? -1 : 1);
      const entryPrice = symbol === 'BTCUSDT' ? 42000 + Math.random() * 1000 :
                        symbol === 'ETHUSDT' ? 2500 + Math.random() * 100 : 
                        300 + Math.random() * 20;
      const markPrice = entryPrice * (1 + (Math.random() - 0.5) * 0.02);
      const pnl = size * (markPrice - entryPrice);

      return {
        symbol,
        side,
        size: Math.abs(size),
        entryPrice,
        markPrice,
        pnl,
        pnlPercent: (pnl / (Math.abs(size) * entryPrice)) * 100,
        margin: Math.abs(size) * entryPrice * 0.1, // 10x leverage
        leverage: 10
      };
    });

    return positions;
  }

  /**
   * Calculate weighted average price from accounts
   */
  private calculateWeightedPrice(accounts: Array<{ size: number; }>): number {
    const totalSize = accounts.reduce((sum, acc) => sum + Math.abs(acc.size), 0);
    if (totalSize === 0) return 0;
    
    return accounts.reduce((sum, acc, index) => {
      // Mock price calculation - in real implementation, fetch actual entry prices
      const mockPrice = 42000 + index * 100;
      return sum + (Math.abs(acc.size) / totalSize) * mockPrice;
    }, 0);
  }

  /**
   * Health check for OMS
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details: any }> {
    try {
      const cacheSize = this.cache.size;
      const accountHealth = await accountManager.healthCheck();
      
      return {
        status: accountHealth.status,
        details: {
          accounts: accountHealth.details,
          cacheSize,
          cacheExpiry: this.cacheExpiry
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: (error as Error).message }
      };
    }
  }

  /**
   * Get rebalancing plan based on current positions and target allocation
   */
  async getRebalancingPlan(userId: string): Promise<RebalanceAction[]> {
    const positions = await this.getConsolidatedPositions(userId);
    const totalValue = positions.reduce((sum, pos) => sum + Math.abs(pos.pnl), 0);
    
    // Simple rebalancing logic - equal weight distribution
    const targetWeight = 1 / positions.length;
    const actions: RebalanceAction[] = [];
    
    positions.forEach(position => {
      const currentValue = Math.abs(position.pnl);
      const currentWeight = currentValue / totalValue;
      const weightDiff = targetWeight - currentWeight;
      
      if (Math.abs(weightDiff) > 0.05) { // 5% threshold
        const action: RebalanceAction = {
          accountId: position.accountId,
          exchange: position.exchange,
          symbol: position.symbol,
          action: weightDiff > 0 ? 'buy' : 'sell',
          quantity: Math.abs(weightDiff * totalValue) / position.markPrice,
          reason: `Rebalance to target weight: ${(targetWeight * 100).toFixed(1)}%`,
          priority: Math.abs(weightDiff) > 0.1 ? 'high' : 'medium'
        };
        actions.push(action);
      }
    });
    
    return actions;
  }

  /**
   * Execute rebalancing plan
   */
  async executeRebalancing(
    userId: string, 
    actions: RebalanceAction[], 
    paperMode: boolean = true
  ): Promise<Array<{ action: RebalanceAction; status: 'success' | 'failed'; error?: string }>> {
    const results = [];
    
    for (const action of actions) {
      try {
        if (paperMode) {
          // Paper trading mode - just simulate
          results.push({
            action,
            status: 'success' as const
          });
        } else {
          // Real execution would go here
          // await this.executeTradeAction(action);
          results.push({
            action,
            status: 'success' as const
          });
        }
      } catch (error) {
        results.push({
          action,
          status: 'failed' as const,
          error: (error as Error).message
        });
      }
    }
    
    return results;
  }
}

// Singleton instance
export const portfolioOMS = new PortfolioOMS();
