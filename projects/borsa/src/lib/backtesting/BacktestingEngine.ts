import { EventEmitter } from 'events';
import { Candle, MarketData } from '../engines/UniversalMarketDataEngine';

export interface BacktestResult {
  strategy: string;
  symbol: string;
  period: { start: Date; end: Date };
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  totalReturnPercent: number;
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  calmarRatio: number;
  sortinoRatio: number;
  volatility: number;
  trades: BacktestTrade[];
  equityCurve: EquityPoint[];
  monthlyReturns: MonthlyReturn[];
}

export interface BacktestTrade {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryDate: Date;
  exitDate: Date;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  reason: string;
  holdingPeriod: number; // hours
}

export interface EquityPoint {
  date: Date;
  equity: number;
  drawdown: number;
  drawdownPercent: number;
}

export interface MonthlyReturn {
  year: number;
  month: number;
  return: number;
  returnPercent: number;
}

export interface MonteCarloResult {
  scenario: number;
  finalCapital: number;
  maxDrawdown: number;
  sharpeRatio: number;
  totalTrades: number;
  winRate: number;
}

export interface WalkForwardResult {
  period: { start: Date; end: Date };
  inSamplePeriod: { start: Date; end: Date };
  outOfSamplePeriod: { start: Date; end: Date };
  inSampleReturn: number;
  outOfSampleReturn: number;
  parameters: { [key: string]: any };
  consistency: number;
}

export class BacktestingEngine extends EventEmitter {
  private isRunning = false;
  private currentBacktest?: BacktestResult;
  private historicalData = new Map<string, Candle[]>();
  
  constructor() {
    super();
    console.log('📈 Advanced Backtesting Engine başlatıldı');
  }

  public async runBacktest(config: {
    strategy: string;
    symbol: string;
    startDate: Date;
    endDate: Date;
    initialCapital: number;
    parameters: { [key: string]: any };
  }): Promise<BacktestResult> {
    
    if (this.isRunning) {
      throw new Error('Başka bir backtest çalışıyor');
    }

    this.isRunning = true;
    console.log(`🧪 Backtest başlatıldı: ${config.strategy} - ${config.symbol}`);
    
    try {
      // Historical data al
      const data = await this.getHistoricalData(config.symbol, config.startDate, config.endDate);
      
      // Strategy'yi çalıştır
      const result = await this.executeStrategy(config, data);
      
      // Performance metrikleri hesapla
      result.sharpeRatio = this.calculateSharpeRatio(result.equityCurve);
      result.maxDrawdown = this.calculateMaxDrawdown(result.equityCurve).amount;
      result.maxDrawdownPercent = this.calculateMaxDrawdown(result.equityCurve).percent;
      result.calmarRatio = this.calculateCalmarRatio(result.totalReturnPercent, result.maxDrawdownPercent);
      result.sortinoRatio = this.calculateSortinoRatio(result.equityCurve);
      result.volatility = this.calculateVolatility(result.equityCurve);
      result.profitFactor = this.calculateProfitFactor(result.trades);
      result.winRate = this.calculateWinRate(result.trades);
      
      this.currentBacktest = result;
      this.emit('backtestComplete', result);
      
      console.log(`✅ Backtest tamamlandı - Return: ${result.totalReturnPercent.toFixed(2)}%`);
      return result;
      
    } catch (error) {
      console.error('❌ Backtest hatası:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  public async runMonteCarloSimulation(config: {
    strategy: string;
    symbol: string;
    startDate: Date;
    endDate: Date;
    initialCapital: number;
    parameters: { [key: string]: any };
    scenarios: number;
  }): Promise<MonteCarloResult[]> {
    
    console.log(`🎲 Monte Carlo Simulation başlatıldı - ${config.scenarios} senaryo`);
    
    const results: MonteCarloResult[] = [];
    
    for (let i = 0; i < config.scenarios; i++) {
      // Random parametreler generate et
      const randomParams = this.generateRandomParameters(config.parameters);
      
      try {
        const backtestResult = await this.runBacktest({
          ...config,
          parameters: randomParams
        });
        
        results.push({
          scenario: i + 1,
          finalCapital: backtestResult.finalCapital,
          maxDrawdown: backtestResult.maxDrawdown,
          sharpeRatio: backtestResult.sharpeRatio,
          totalTrades: backtestResult.totalTrades,
          winRate: backtestResult.winRate
        });
        
        // Progress emit et
        this.emit('monteCarloProgress', {
          completed: i + 1,
          total: config.scenarios,
          percent: ((i + 1) / config.scenarios) * 100
        });
        
      } catch (error) {
        console.error(`Scenario ${i + 1} hatası:`, error);
      }
    }
    
    console.log(`✅ Monte Carlo Simulation tamamlandı - ${results.length}/${config.scenarios} başarılı`);
    this.emit('monteCarloComplete', results);
    
    return results;
  }

  public async runWalkForwardAnalysis(config: {
    strategy: string;
    symbol: string;
    startDate: Date;
    endDate: Date;
    initialCapital: number;
    parameters: { [key: string]: any };
    inSampleMonths: number;
    outOfSampleMonths: number;
  }): Promise<WalkForwardResult[]> {
    
    console.log(`🚶 Walk Forward Analysis başlatıldı`);
    
    const results: WalkForwardResult[] = [];
    const totalMonths = this.getMonthsBetweenDates(config.startDate, config.endDate);
    const stepSize = config.inSampleMonths + config.outOfSampleMonths;
    
    for (let i = 0; i <= totalMonths - stepSize; i += config.outOfSampleMonths) {
      const periodStart = this.addMonthsToDate(config.startDate, i);
      const inSampleEnd = this.addMonthsToDate(periodStart, config.inSampleMonths);
      const periodEnd = this.addMonthsToDate(inSampleEnd, config.outOfSampleMonths);
      
      try {
        // In-sample optimization
        const inSampleResult = await this.runBacktest({
          ...config,
          startDate: periodStart,
          endDate: inSampleEnd
        });
        
        // Out-of-sample testing
        const outOfSampleResult = await this.runBacktest({
          ...config,
          startDate: inSampleEnd,
          endDate: periodEnd
        });
        
        const consistency = this.calculateConsistency(
          inSampleResult.totalReturnPercent,
          outOfSampleResult.totalReturnPercent
        );
        
        results.push({
          period: { start: periodStart, end: periodEnd },
          inSamplePeriod: { start: periodStart, end: inSampleEnd },
          outOfSamplePeriod: { start: inSampleEnd, end: periodEnd },
          inSampleReturn: inSampleResult.totalReturnPercent,
          outOfSampleReturn: outOfSampleResult.totalReturnPercent,
          parameters: config.parameters,
          consistency
        });
        
      } catch (error) {
        console.error(`Walk forward period error:`, error);
      }
    }
    
    console.log(`✅ Walk Forward Analysis tamamlandı - ${results.length} period`);
    this.emit('walkForwardComplete', results);
    
    return results;
  }

  private async getHistoricalData(symbol: string, start: Date, end: Date): Promise<Candle[]> {
    // Simulated historical data
    const data: Candle[] = [];
    const startTime = start.getTime();
    const endTime = end.getTime();
    const interval = 60 * 60 * 1000; // 1 hour
    
    let currentPrice = 100 + Math.random() * 1000;
    
    for (let time = startTime; time <= endTime; time += interval) {
      const volatility = 0.02;
      const change = (Math.random() - 0.5) * volatility;
      
      currentPrice = currentPrice * (1 + change);
      
      const candle: Candle = {
        timestamp: time,
        open: currentPrice * 0.999,
        high: currentPrice * 1.002,
        low: currentPrice * 0.998,
        close: currentPrice,
        volume: 1000 + Math.random() * 10000
      };
      
      data.push(candle);
    }
    
    return data;
  }

  private async executeStrategy(
    config: { strategy: string; symbol: string; initialCapital: number; parameters: any },
    data: Candle[]
  ): Promise<BacktestResult> {
    
    const trades: BacktestTrade[] = [];
    const equityCurve: EquityPoint[] = [];
    let capital = config.initialCapital;
    let position: { side: 'LONG' | 'SHORT'; entryPrice: number; quantity: number; entryDate: Date } | null = null;
    
    // Strategy execution simulated
    for (let i = 20; i < data.length; i++) {
      const currentCandle = data[i];
      const historicalData = data.slice(Math.max(0, i - 20), i);
      
      // Simple moving average strategy
      const sma10 = this.calculateSMA(historicalData.map(c => c.close), 10);
      const sma20 = this.calculateSMA(historicalData.map(c => c.close), 20);
      const currentPrice = currentCandle.close;
      
      // Entry signals
      if (!position && sma10 > sma20 && Math.random() > 0.7) {
        // Long entry
        const quantity = Math.floor(capital * 0.1 / currentPrice); // 10% of capital
        if (quantity > 0) {
          position = {
            side: 'LONG',
            entryPrice: currentPrice,
            quantity,
            entryDate: new Date(currentCandle.timestamp)
          };
        }
      }
      
      // Exit signals
      if (position && (sma10 < sma20 || Math.random() > 0.95)) {
        const exitPrice = currentPrice;
        const pnl = (exitPrice - position.entryPrice) * position.quantity;
        capital += pnl;
        
        const trade: BacktestTrade = {
          id: `trade_${trades.length + 1}`,
          symbol: config.symbol,
          side: position.side,
          entryDate: position.entryDate,
          exitDate: new Date(currentCandle.timestamp),
          entryPrice: position.entryPrice,
          exitPrice: exitPrice,
          quantity: position.quantity,
          pnl,
          pnlPercent: (pnl / (position.entryPrice * position.quantity)) * 100,
          reason: 'Strategy signal',
          holdingPeriod: (currentCandle.timestamp - position.entryDate.getTime()) / (1000 * 60 * 60)
        };
        
        trades.push(trade);
        position = null;
      }
      
      // Calculate current equity
      let currentEquity = capital;
      if (position) {
        const unrealizedPnl = (currentPrice - position.entryPrice) * position.quantity;
        currentEquity += unrealizedPnl;
      }
      
      const maxEquity = Math.max(...equityCurve.map(p => p.equity), currentEquity);
      const drawdown = maxEquity - currentEquity;
      const drawdownPercent = maxEquity > 0 ? (drawdown / maxEquity) * 100 : 0;
      
      equityCurve.push({
        date: new Date(currentCandle.timestamp),
        equity: currentEquity,
        drawdown,
        drawdownPercent
      });
    }
    
    const totalReturn = capital - config.initialCapital;
    const totalReturnPercent = (totalReturn / config.initialCapital) * 100;
    
    // Monthly returns hesapla
    const monthlyReturns = this.calculateMonthlyReturns(equityCurve);
    
    // Win/Loss statistics
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    
    return {
      strategy: config.strategy,
      symbol: config.symbol,
      period: {
        start: new Date(data[0].timestamp),
        end: new Date(data[data.length - 1].timestamp)
      },
      initialCapital: config.initialCapital,
      finalCapital: capital,
      totalReturn,
      totalReturnPercent,
      sharpeRatio: 0, // Will be calculated
      maxDrawdown: 0, // Will be calculated
      maxDrawdownPercent: 0, // Will be calculated
      winRate: winningTrades.length / trades.length * 100 || 0,
      profitFactor: 0, // Will be calculated
      avgWin: winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0,
      avgLoss: losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + Math.abs(t.pnl), 0) / losingTrades.length : 0,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      calmarRatio: 0, // Will be calculated
      sortinoRatio: 0, // Will be calculated
      volatility: 0, // Will be calculated
      trades,
      equityCurve,
      monthlyReturns
    };
  }

  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  private calculateSharpeRatio(equityCurve: EquityPoint[]): number {
    if (equityCurve.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const prevEquity = equityCurve[i - 1].equity;
      const currentEquity = equityCurve[i].equity;
      if (prevEquity > 0) {
        returns.push((currentEquity - prevEquity) / prevEquity);
      }
    }
    
    if (returns.length === 0) return 0;
    
    const meanReturn = returns.reduce((a, b) => a + b) / returns.length;
    const stdDev = Math.sqrt(returns.reduce((acc, r) => acc + Math.pow(r - meanReturn, 2), 0) / returns.length);
    
    return stdDev > 0 ? (meanReturn * Math.sqrt(252)) / (stdDev * Math.sqrt(252)) : 0;
  }

  private calculateMaxDrawdown(equityCurve: EquityPoint[]): { amount: number; percent: number } {
    let maxEquity = 0;
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;
    
    for (const point of equityCurve) {
      if (point.equity > maxEquity) {
        maxEquity = point.equity;
      }
      
      const drawdown = maxEquity - point.equity;
      const drawdownPercent = maxEquity > 0 ? (drawdown / maxEquity) * 100 : 0;
      
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
      
      if (drawdownPercent > maxDrawdownPercent) {
        maxDrawdownPercent = drawdownPercent;
      }
    }
    
    return { amount: maxDrawdown, percent: maxDrawdownPercent };
  }

  private calculateCalmarRatio(annualReturn: number, maxDrawdown: number): number {
    return maxDrawdown > 0 ? annualReturn / maxDrawdown : 0;
  }

  private calculateSortinoRatio(equityCurve: EquityPoint[]): number {
    if (equityCurve.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const prevEquity = equityCurve[i - 1].equity;
      const currentEquity = equityCurve[i].equity;
      if (prevEquity > 0) {
        returns.push((currentEquity - prevEquity) / prevEquity);
      }
    }
    
    const meanReturn = returns.reduce((a, b) => a + b) / returns.length;
    const downside = returns.filter(r => r < 0);
    
    if (downside.length === 0) return Infinity;
    
    const downsideStdDev = Math.sqrt(downside.reduce((acc, r) => acc + Math.pow(r, 2), 0) / downside.length);
    
    return downsideStdDev > 0 ? (meanReturn * Math.sqrt(252)) / (downsideStdDev * Math.sqrt(252)) : 0;
  }

  private calculateVolatility(equityCurve: EquityPoint[]): number {
    if (equityCurve.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const prevEquity = equityCurve[i - 1].equity;
      const currentEquity = equityCurve[i].equity;
      if (prevEquity > 0) {
        returns.push((currentEquity - prevEquity) / prevEquity);
      }
    }
    
    const meanReturn = returns.reduce((a, b) => a + b) / returns.length;
    const variance = returns.reduce((acc, r) => acc + Math.pow(r - meanReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance * 252) * 100; // Annualized volatility in %
  }

  private calculateProfitFactor(trades: BacktestTrade[]): number {
    const profits = trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const losses = Math.abs(trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
    
    return losses > 0 ? profits / losses : profits > 0 ? Infinity : 0;
  }

  private calculateWinRate(trades: BacktestTrade[]): number {
    if (trades.length === 0) return 0;
    const winningTrades = trades.filter(t => t.pnl > 0).length;
    return (winningTrades / trades.length) * 100;
  }

  private calculateMonthlyReturns(equityCurve: EquityPoint[]): MonthlyReturn[] {
    const monthlyReturns: MonthlyReturn[] = [];
    let currentMonth = -1;
    let currentYear = -1;
    let monthStartEquity = 0;
    
    for (const point of equityCurve) {
      const date = point.date;
      const month = date.getMonth();
      const year = date.getFullYear();
      
      if (year !== currentYear || month !== currentMonth) {
        if (currentYear !== -1 && monthStartEquity > 0) {
          const previousPoint = equityCurve[equityCurve.indexOf(point) - 1];
          const monthReturn = previousPoint.equity - monthStartEquity;
          const monthReturnPercent = (monthReturn / monthStartEquity) * 100;
          
          monthlyReturns.push({
            year: currentYear,
            month: currentMonth + 1,
            return: monthReturn,
            returnPercent: monthReturnPercent
          });
        }
        
        currentYear = year;
        currentMonth = month;
        monthStartEquity = point.equity;
      }
    }
    
    return monthlyReturns;
  }

  private generateRandomParameters(baseParams: { [key: string]: any }): { [key: string]: any } {
    const randomParams: { [key: string]: any } = {};
    
    for (const [key, value] of Object.entries(baseParams)) {
      if (typeof value === 'number') {
        // Add ±20% randomness
        const variation = value * 0.2;
        randomParams[key] = value + (Math.random() - 0.5) * 2 * variation;
      } else {
        randomParams[key] = value;
      }
    }
    
    return randomParams;
  }

  private getMonthsBetweenDates(start: Date, end: Date): number {
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return months;
  }

  private addMonthsToDate(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  private calculateConsistency(inSample: number, outOfSample: number): number {
    if (inSample === 0) return 0;
    const ratio = outOfSample / inSample;
    return Math.max(0, Math.min(1, ratio)); // Between 0 and 1
  }

  public getCurrentBacktest(): BacktestResult | undefined {
    return this.currentBacktest;
  }

  public isBacktestRunning(): boolean {
    return this.isRunning;
  }

  public generateReport(result: BacktestResult): string {
    let report = `\n📊 BACKTEST RAPORU - ${result.strategy}\n`;
    report += `═══════════════════════════════════════════\n`;
    report += `Symbol: ${result.symbol}\n`;
    report += `Period: ${result.period.start.toLocaleDateString()} - ${result.period.end.toLocaleDateString()}\n`;
    report += `\n💰 PERFORMANS:\n`;
    report += `Initial Capital: $${result.initialCapital.toLocaleString()}\n`;
    report += `Final Capital: $${result.finalCapital.toLocaleString()}\n`;
    report += `Total Return: $${result.totalReturn.toLocaleString()} (${result.totalReturnPercent.toFixed(2)}%)\n`;
    report += `\n📈 RİSK METRİKLERİ:\n`;
    report += `Sharpe Ratio: ${result.sharpeRatio.toFixed(3)}\n`;
    report += `Sortino Ratio: ${result.sortinoRatio.toFixed(3)}\n`;
    report += `Calmar Ratio: ${result.calmarRatio.toFixed(3)}\n`;
    report += `Max Drawdown: $${result.maxDrawdown.toLocaleString()} (${result.maxDrawdownPercent.toFixed(2)}%)\n`;
    report += `Volatility: ${result.volatility.toFixed(2)}%\n`;
    report += `\n🎯 İŞLEM İSTATİSTİKLERİ:\n`;
    report += `Total Trades: ${result.totalTrades}\n`;
    report += `Winning Trades: ${result.winningTrades} (${result.winRate.toFixed(1)}%)\n`;
    report += `Losing Trades: ${result.losingTrades}\n`;
    report += `Profit Factor: ${result.profitFactor.toFixed(2)}\n`;
    report += `Avg Win: $${result.avgWin.toFixed(2)}\n`;
    report += `Avg Loss: $${result.avgLoss.toFixed(2)}\n`;
    report += `═══════════════════════════════════════════\n`;
    
    return report;
  }
}

export default BacktestingEngine;