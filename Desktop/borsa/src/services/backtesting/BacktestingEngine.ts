/**
 * Backtesting Engine for AI Trading Strategies
 * Historical performance analysis with Sharpe ratio, win rate, max drawdown
 */

interface Trade {
  symbol: string;
  action: 'BUY' | 'SELL';
  price: number;
  amount: number;
  timestamp: number;
  signal: {
    confidence: number;
    indicators: any;
  };
}

interface Position {
  symbol: string;
  entryPrice: number;
  amount: number;
  entryTime: number;
  stopLoss: number;
  targetPrice: number;
}

interface BacktestResult {
  symbol: string;
  timeframe: string;
  period: {
    start: number;
    end: number;
    days: number;
  };
  performance: {
    totalReturn: number; // %
    sharpeRatio: number;
    winRate: number; // %
    profitFactor: number;
    maxDrawdown: number; // %
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    averageWin: number;
    averageLoss: number;
    largestWin: number;
    largestLoss: number;
  };
  equity: {
    initial: number;
    final: number;
    peak: number;
  };
  trades: Trade[];
  equityCurve: { timestamp: number; value: number }[];
}

export class BacktestingEngine {
  private initialCapital = 10000; // $10,000
  private positionSize = 0.1; // 10% per trade
  private maxPositions = 5;
  private commission = 0.001; // 0.1%

  constructor(config?: {
    initialCapital?: number;
    positionSize?: number;
    maxPositions?: number;
    commission?: number;
  }) {
    if (config) {
      this.initialCapital = config.initialCapital ?? this.initialCapital;
      this.positionSize = config.positionSize ?? this.positionSize;
      this.maxPositions = config.maxPositions ?? this.maxPositions;
      this.commission = config.commission ?? this.commission;
    }
  }

  /**
   * Run backtest on historical data with AI signals
   */
  async runBacktest(
    symbol: string,
    historicalData: any[],
    signals: any[],
    timeframe: string
  ): Promise<BacktestResult> {
    let cash = this.initialCapital;
    let positions: Position[] = [];
    let trades: Trade[] = [];
    let equityCurve: { timestamp: number; value: number }[] = [];
    let peak = this.initialCapital;

    // Sort data by timestamp
    historicalData.sort((a, b) => a.timestamp - b.timestamp);
    signals.sort((a, b) => a.timestamp - b.timestamp);

    // Simulate trading
    for (const candle of historicalData) {
      const currentPrice = candle.close;
      const timestamp = candle.timestamp;

      // Check for exit conditions (stop loss / target)
      for (let i = positions.length - 1; i >= 0; i--) {
        const position = positions[i];

        let exitReason: 'STOP_LOSS' | 'TARGET' | null = null;
        let exitPrice = currentPrice;

        // Stop loss hit
        if (currentPrice <= position.stopLoss) {
          exitReason = 'STOP_LOSS';
          exitPrice = position.stopLoss;
        }
        // Target hit
        else if (currentPrice >= position.targetPrice) {
          exitReason = 'TARGET';
          exitPrice = position.targetPrice;
        }

        if (exitReason) {
          // Close position
          const proceeds = position.amount * exitPrice * (1 - this.commission);
          cash += proceeds;

          trades.push({
            symbol: position.symbol,
            action: 'SELL',
            price: exitPrice,
            amount: position.amount,
            timestamp,
            signal: { confidence: 0, indicators: {} },
          });

          positions.splice(i, 1);
        }
      }

      // Check for new buy signals
      const signal = signals.find(
        s => Math.abs(s.timestamp - timestamp) < 3600000 && s.action === 'BUY'
      );

      if (signal && positions.length < this.maxPositions && cash > 0) {
        // Calculate position size
        const investAmount = cash * this.positionSize;
        const amount = investAmount / currentPrice;
        const cost = amount * currentPrice * (1 + this.commission);

        if (cost <= cash) {
          // Open position
          positions.push({
            symbol,
            entryPrice: currentPrice,
            amount,
            entryTime: timestamp,
            stopLoss: signal.stopLoss,
            targetPrice: signal.targetPrice,
          });

          trades.push({
            symbol,
            action: 'BUY',
            price: currentPrice,
            amount,
            timestamp,
            signal: {
              confidence: signal.confidence,
              indicators: signal.indicators,
            },
          });

          cash -= cost;
        }
      }

      // Calculate equity
      const positionsValue = positions.reduce(
        (sum, p) => sum + p.amount * currentPrice,
        0
      );
      const equity = cash + positionsValue;

      equityCurve.push({ timestamp, value: equity });

      if (equity > peak) {
        peak = equity;
      }
    }

    // Close all remaining positions at final price
    const finalPrice = historicalData[historicalData.length - 1].close;
    for (const position of positions) {
      const proceeds = position.amount * finalPrice * (1 - this.commission);
      cash += proceeds;

      trades.push({
        symbol: position.symbol,
        action: 'SELL',
        price: finalPrice,
        amount: position.amount,
        timestamp: historicalData[historicalData.length - 1].timestamp,
        signal: { confidence: 0, indicators: {} },
      });
    }

    const finalEquity = cash;

    // Calculate metrics
    const performance = this.calculatePerformanceMetrics(
      trades,
      equityCurve,
      peak
    );

    return {
      symbol,
      timeframe,
      period: {
        start: historicalData[0].timestamp,
        end: historicalData[historicalData.length - 1].timestamp,
        days: Math.floor(
          (historicalData[historicalData.length - 1].timestamp -
            historicalData[0].timestamp) /
            86400000
        ),
      },
      performance,
      equity: {
        initial: this.initialCapital,
        final: finalEquity,
        peak,
      },
      trades,
      equityCurve,
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(
    trades: Trade[],
    equityCurve: { timestamp: number; value: number }[],
    peak: number
  ) {
    // Group trades into pairs (buy/sell)
    const tradePairs: { entry: Trade; exit: Trade; pnl: number }[] = [];
    const buyTrades = trades.filter(t => t.action === 'BUY');
    const sellTrades = trades.filter(t => t.action === 'SELL');

    for (let i = 0; i < Math.min(buyTrades.length, sellTrades.length); i++) {
      const entry = buyTrades[i];
      const exit = sellTrades[i];
      const pnl = (exit.price - entry.price) * entry.amount;
      tradePairs.push({ entry, exit, pnl });
    }

    // Win/Loss statistics
    const winningTrades = tradePairs.filter(t => t.pnl > 0);
    const losingTrades = tradePairs.filter(t => t.pnl < 0);

    const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));

    const winRate = tradePairs.length > 0
      ? (winningTrades.length / tradePairs.length) * 100
      : 0;

    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;

    const averageWin = winningTrades.length > 0
      ? totalWins / winningTrades.length
      : 0;

    const averageLoss = losingTrades.length > 0
      ? totalLosses / losingTrades.length
      : 0;

    const largestWin = winningTrades.length > 0
      ? Math.max(...winningTrades.map(t => t.pnl))
      : 0;

    const largestLoss = losingTrades.length > 0
      ? Math.min(...losingTrades.map(t => t.pnl))
      : 0;

    // Total return
    const initialEquity = equityCurve[0]?.value || this.initialCapital;
    const finalEquity = equityCurve[equityCurve.length - 1]?.value || initialEquity;
    const totalReturn = ((finalEquity - initialEquity) / initialEquity) * 100;

    // Maximum drawdown
    let maxDrawdown = 0;
    let runningPeak = equityCurve[0]?.value || this.initialCapital;

    for (const point of equityCurve) {
      if (point.value > runningPeak) {
        runningPeak = point.value;
      }
      const drawdown = ((runningPeak - point.value) / runningPeak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Sharpe ratio (simplified - assumes daily returns)
    const returns: number[] = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const dailyReturn =
        (equityCurve[i].value - equityCurve[i - 1].value) /
        equityCurve[i - 1].value;
      returns.push(dailyReturn);
    }

    const avgReturn = returns.length > 0
      ? returns.reduce((a, b) => a + b, 0) / returns.length
      : 0;

    const stdDev = returns.length > 0
      ? Math.sqrt(
          returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
            returns.length
        )
      : 0;

    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

    return {
      totalReturn,
      sharpeRatio,
      winRate,
      profitFactor,
      maxDrawdown,
      totalTrades: tradePairs.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      averageWin,
      averageLoss,
      largestWin,
      largestLoss,
    };
  }

  /**
   * Run Monte Carlo simulation for strategy robustness
   */
  async runMonteCarloSimulation(
    baseResult: BacktestResult,
    iterations: number = 1000
  ): Promise<{
    meanReturn: number;
    stdDeviation: number;
    probabilityOfProfit: number;
    var95: number; // Value at Risk (95%)
    confidence95: [number, number]; // 95% confidence interval
  }> {
    const returns: number[] = [];

    for (let i = 0; i < iterations; i++) {
      // Shuffle trades randomly
      const shuffledTrades = [...baseResult.trades].sort(() => Math.random() - 0.5);

      // Calculate return for shuffled sequence
      let equity = baseResult.equity.initial;
      for (const trade of shuffledTrades) {
        if (trade.action === 'BUY') {
          equity -= trade.amount * trade.price;
        } else {
          equity += trade.amount * trade.price;
        }
      }

      const returnPct = ((equity - baseResult.equity.initial) / baseResult.equity.initial) * 100;
      returns.push(returnPct);
    }

    returns.sort((a, b) => a - b);

    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDeviation = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length
    );

    const probabilityOfProfit = (returns.filter(r => r > 0).length / returns.length) * 100;
    const var95 = returns[Math.floor(returns.length * 0.05)];

    const confidence95: [number, number] = [
      returns[Math.floor(returns.length * 0.025)],
      returns[Math.floor(returns.length * 0.975)],
    ];

    return {
      meanReturn,
      stdDeviation,
      probabilityOfProfit,
      var95,
      confidence95,
    };
  }
}

// Singleton instance
let engineInstance: BacktestingEngine | null = null;

export function getBacktestEngine(config?: any): BacktestingEngine {
  if (!engineInstance) {
    engineInstance = new BacktestingEngine(config);
  }
  return engineInstance;
}