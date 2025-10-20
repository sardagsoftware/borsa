/**
 * BACKTEST ENGINE
 * Historical performance testing for strategies
 */

export interface BacktestResult {
  strategy: string;
  period: string; // "30d", "7d", etc.
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // percentage
  avgReturn: number; // percentage
  totalReturn: number; // percentage
  maxDrawdown: number; // percentage
  sharpeRatio: number;
  profitFactor: number;
  bestTrade: number; // percentage
  worstTrade: number; // percentage
  avgWinningTrade: number;
  avgLosingTrade: number;
  lastUpdated: number;
}

// Mock backtest data (gerçek backtest için historical data gerekli)
const MOCK_BACKTEST_DATA: Record<string, BacktestResult> = {
  'ma-crossover-pullback': {
    strategy: 'MA Crossover Pullback',
    period: '30d',
    totalTrades: 45,
    winningTrades: 31,
    losingTrades: 14,
    winRate: 68.9,
    avgReturn: 3.2,
    totalReturn: 144.0,
    maxDrawdown: -12.5,
    sharpeRatio: 1.85,
    profitFactor: 2.4,
    bestTrade: 18.5,
    worstTrade: -8.2,
    avgWinningTrade: 5.8,
    avgLosingTrade: -3.1,
    lastUpdated: Date.now(),
  },
  'rsi-divergence': {
    strategy: 'RSI Divergence',
    period: '30d',
    totalTrades: 38,
    winningTrades: 27,
    losingTrades: 11,
    winRate: 71.1,
    avgReturn: 3.8,
    totalReturn: 144.4,
    maxDrawdown: -9.8,
    sharpeRatio: 2.1,
    profitFactor: 2.8,
    bestTrade: 22.3,
    worstTrade: -6.5,
    avgWinningTrade: 6.2,
    avgLosingTrade: -2.8,
    lastUpdated: Date.now(),
  },
  'macd-histogram': {
    strategy: 'MACD Histogram',
    period: '30d',
    totalTrades: 42,
    winningTrades: 30,
    losingTrades: 12,
    winRate: 71.4,
    avgReturn: 3.5,
    totalReturn: 147.0,
    maxDrawdown: -10.2,
    sharpeRatio: 1.95,
    profitFactor: 2.6,
    bestTrade: 20.1,
    worstTrade: -7.8,
    avgWinningTrade: 5.9,
    avgLosingTrade: -3.0,
    lastUpdated: Date.now(),
  },
  'bollinger-squeeze': {
    strategy: 'Bollinger Squeeze',
    period: '30d',
    totalTrades: 28,
    winningTrades: 21,
    losingTrades: 7,
    winRate: 75.0,
    avgReturn: 4.1,
    totalReturn: 114.8,
    maxDrawdown: -8.5,
    sharpeRatio: 2.3,
    profitFactor: 3.2,
    bestTrade: 24.5,
    worstTrade: -5.9,
    avgWinningTrade: 6.8,
    avgLosingTrade: -2.5,
    lastUpdated: Date.now(),
  },
  'ema-ribbon': {
    strategy: 'EMA Ribbon',
    period: '30d',
    totalTrades: 35,
    winningTrades: 27,
    losingTrades: 8,
    winRate: 77.1,
    avgReturn: 4.3,
    totalReturn: 150.5,
    maxDrawdown: -7.8,
    sharpeRatio: 2.5,
    profitFactor: 3.5,
    bestTrade: 26.2,
    worstTrade: -5.2,
    avgWinningTrade: 7.1,
    avgLosingTrade: -2.3,
    lastUpdated: Date.now(),
  },
};

/**
 * Get backtest result for strategy
 */
export function getBacktestResult(strategyKey: string): BacktestResult | null {
  return MOCK_BACKTEST_DATA[strategyKey] || null;
}

/**
 * Get all backtest results
 */
export function getAllBacktestResults(): BacktestResult[] {
  return Object.values(MOCK_BACKTEST_DATA);
}

/**
 * Get top performing strategies
 */
export function getTopStrategies(limit: number = 5): BacktestResult[] {
  return getAllBacktestResults()
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, limit);
}

/**
 * Calculate combined success rate (weighted by win rate)
 */
export function getCombinedSuccessRate(): number {
  const results = getAllBacktestResults();
  if (results.length === 0) return 0;

  const totalWinRate = results.reduce((sum, r) => sum + r.winRate, 0);
  return Math.round(totalWinRate / results.length * 10) / 10;
}

/**
 * Get performance summary
 */
export interface PerformanceSummary {
  avgWinRate: number;
  avgReturn: number;
  totalStrategies: number;
  bestStrategy: string;
  bestWinRate: number;
}

export function getPerformanceSummary(): PerformanceSummary {
  const results = getAllBacktestResults();

  if (results.length === 0) {
    return {
      avgWinRate: 0,
      avgReturn: 0,
      totalStrategies: 0,
      bestStrategy: 'N/A',
      bestWinRate: 0,
    };
  }

  const best = results.reduce((best, current) =>
    current.winRate > best.winRate ? current : best
  );

  return {
    avgWinRate: getCombinedSuccessRate(),
    avgReturn: Math.round(results.reduce((sum, r) => sum + r.avgReturn, 0) / results.length * 10) / 10,
    totalStrategies: results.length,
    bestStrategy: best.strategy,
    bestWinRate: best.winRate,
  };
}
