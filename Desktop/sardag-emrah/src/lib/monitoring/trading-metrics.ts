/**
 * TRADING PERFORMANCE METRICS
 *
 * Track trading-specific metrics for UkalAI platform
 * - Strategy accuracy
 * - Signal performance
 * - AI boost effectiveness
 * - User trading success
 *
 * WHITE-HAT PRINCIPLES:
 * - Privacy-first (local storage only)
 * - Anonymous metrics
 * - User can disable
 * - Transparent tracking
 */

export interface SignalPerformance {
  signalId: string;
  symbol: string;
  timestamp: number;

  // Signal details
  direction: 'BUY' | 'SELL';
  confidence: number;
  aiBoost?: number;
  strategies: string[]; // Which strategies agreed

  // Performance (if user reports outcome)
  outcome?: 'win' | 'loss' | 'neutral';
  profitPercent?: number;

  // Metadata
  timeframe?: string;
  entryPrice?: number;
  exitPrice?: number;
}

export interface StrategyStats {
  strategyName: string;
  totalSignals: number;
  wins: number;
  losses: number;
  neutral: number;
  avgConfidence: number;
  avgProfit: number;
  successRate: number; // wins / (wins + losses)
}

export interface TradingSessionMetrics {
  sessionId: string;
  startTime: number;
  endTime?: number;

  // Signals
  totalSignals: number;
  buySignals: number;
  sellSignals: number;

  // Performance
  totalWins: number;
  totalLosses: number;
  avgConfidence: number;
  avgAiBoost: number;

  // User engagement
  coinsViewed: string[];
  strategiesUsed: string[];
  scannerUsed: boolean;
  notificationsEnabled: boolean;
}

class TradingMetricsTracker {
  private currentSession: TradingSessionMetrics;
  private signals: SignalPerformance[] = [];
  private maxSignals = 1000; // Keep last 1000 signals
  private enabled = true;

  constructor() {
    this.enabled = this.hasConsent();
    this.currentSession = this.initSession();

    if (this.enabled) {
      this.loadStoredMetrics();
    }
  }

  /**
   * Check user consent
   */
  private hasConsent(): boolean {
    if (typeof localStorage === 'undefined') return false;
    const consent = localStorage.getItem('analytics_consent');
    return consent !== 'false';
  }

  /**
   * Initialize new session
   */
  private initSession(): TradingSessionMetrics {
    return {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      totalSignals: 0,
      buySignals: 0,
      sellSignals: 0,
      totalWins: 0,
      totalLosses: 0,
      avgConfidence: 0,
      avgAiBoost: 0,
      coinsViewed: [],
      strategiesUsed: [],
      scannerUsed: false,
      notificationsEnabled: false,
    };
  }

  /**
   * Load stored metrics from localStorage
   */
  private loadStoredMetrics(): void {
    try {
      const stored = localStorage.getItem('trading_signals_history');
      if (stored) {
        this.signals = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load trading metrics:', e);
    }
  }

  /**
   * Track a new trading signal
   */
  public trackSignal(signal: Omit<SignalPerformance, 'signalId' | 'timestamp'>): void {
    if (!this.enabled) return;

    const signalWithId: SignalPerformance = {
      ...signal,
      signalId: this.generateId(),
      timestamp: Date.now(),
    };

    // Add to signals array
    this.signals.push(signalWithId);

    // Keep only last N signals
    if (this.signals.length > this.maxSignals) {
      this.signals.shift();
    }

    // Update session metrics
    this.currentSession.totalSignals++;
    if (signal.direction === 'BUY') {
      this.currentSession.buySignals++;
    } else {
      this.currentSession.sellSignals++;
    }

    // Add coin to viewed list
    if (!this.currentSession.coinsViewed.includes(signal.symbol)) {
      this.currentSession.coinsViewed.push(signal.symbol);
    }

    // Add strategies to used list
    for (const strategy of signal.strategies) {
      if (!this.currentSession.strategiesUsed.includes(strategy)) {
        this.currentSession.strategiesUsed.push(strategy);
      }
    }

    // Update averages
    this.updateSessionAverages();

    // Store to localStorage
    this.storeMetrics();

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Signal tracked:', {
        symbol: signal.symbol,
        direction: signal.direction,
        confidence: signal.confidence,
        aiBoost: signal.aiBoost,
        strategies: signal.strategies.length,
      });
    }
  }

  /**
   * Update signal outcome (when user reports result)
   */
  public updateSignalOutcome(
    signalId: string,
    outcome: 'win' | 'loss' | 'neutral',
    profitPercent?: number,
    exitPrice?: number
  ): void {
    if (!this.enabled) return;

    const signal = this.signals.find(s => s.signalId === signalId);
    if (!signal) return;

    signal.outcome = outcome;
    signal.profitPercent = profitPercent;
    signal.exitPrice = exitPrice;

    // Update session stats
    if (outcome === 'win') {
      this.currentSession.totalWins++;
    } else if (outcome === 'loss') {
      this.currentSession.totalLosses++;
    }

    this.storeMetrics();
  }

  /**
   * Update session averages
   */
  private updateSessionAverages(): void {
    const signalsWithConfidence = this.signals.filter(s => s.confidence > 0);
    const signalsWithAiBoost = this.signals.filter(s => s.aiBoost !== undefined && s.aiBoost > 0);

    if (signalsWithConfidence.length > 0) {
      this.currentSession.avgConfidence =
        signalsWithConfidence.reduce((sum, s) => sum + s.confidence, 0) / signalsWithConfidence.length;
    }

    if (signalsWithAiBoost.length > 0) {
      this.currentSession.avgAiBoost =
        signalsWithAiBoost.reduce((sum, s) => sum + (s.aiBoost || 0), 0) / signalsWithAiBoost.length;
    }
  }

  /**
   * Get strategy statistics
   */
  public getStrategyStats(): StrategyStats[] {
    const strategyMap = new Map<string, {
      signals: SignalPerformance[];
      wins: number;
      losses: number;
      neutral: number;
    }>();

    // Group signals by strategy
    for (const signal of this.signals) {
      for (const strategy of signal.strategies) {
        if (!strategyMap.has(strategy)) {
          strategyMap.set(strategy, { signals: [], wins: 0, losses: 0, neutral: 0 });
        }

        const stats = strategyMap.get(strategy)!;
        stats.signals.push(signal);

        if (signal.outcome === 'win') stats.wins++;
        else if (signal.outcome === 'loss') stats.losses++;
        else if (signal.outcome === 'neutral') stats.neutral++;
      }
    }

    // Calculate stats for each strategy
    const strategyStats: StrategyStats[] = [];

    for (const [strategyName, data] of strategyMap.entries()) {
      const totalWithOutcome = data.wins + data.losses;
      const avgConfidence = data.signals.reduce((sum, s) => sum + s.confidence, 0) / data.signals.length;
      const signalsWithProfit = data.signals.filter(s => s.profitPercent !== undefined);
      const avgProfit = signalsWithProfit.length > 0
        ? signalsWithProfit.reduce((sum, s) => sum + (s.profitPercent || 0), 0) / signalsWithProfit.length
        : 0;

      strategyStats.push({
        strategyName,
        totalSignals: data.signals.length,
        wins: data.wins,
        losses: data.losses,
        neutral: data.neutral,
        avgConfidence,
        avgProfit,
        successRate: totalWithOutcome > 0 ? (data.wins / totalWithOutcome) * 100 : 0,
      });
    }

    // Sort by success rate
    return strategyStats.sort((a, b) => b.successRate - a.successRate);
  }

  /**
   * Get current session metrics
   */
  public getSessionMetrics(): TradingSessionMetrics {
    return { ...this.currentSession };
  }

  /**
   * Get overall success rate
   */
  public getOverallSuccessRate(): number {
    const totalWithOutcome = this.currentSession.totalWins + this.currentSession.totalLosses;
    if (totalWithOutcome === 0) return 0;
    return (this.currentSession.totalWins / totalWithOutcome) * 100;
  }

  /**
   * Get AI boost effectiveness
   */
  public getAIBoostEffectiveness(): { withAI: number; withoutAI: number } {
    const signalsWithAI = this.signals.filter(s => s.aiBoost && s.aiBoost > 0 && s.outcome);
    const signalsWithoutAI = this.signals.filter(s => (!s.aiBoost || s.aiBoost === 0) && s.outcome);

    const winsWithAI = signalsWithAI.filter(s => s.outcome === 'win').length;
    const winsWithoutAI = signalsWithoutAI.filter(s => s.outcome === 'win').length;

    const totalWithAI = signalsWithAI.length;
    const totalWithoutAI = signalsWithoutAI.length;

    return {
      withAI: totalWithAI > 0 ? (winsWithAI / totalWithAI) * 100 : 0,
      withoutAI: totalWithoutAI > 0 ? (winsWithoutAI / totalWithoutAI) * 100 : 0,
    };
  }

  /**
   * Store metrics to localStorage
   */
  private storeMetrics(): void {
    try {
      localStorage.setItem('trading_signals_history', JSON.stringify(this.signals));
      localStorage.setItem('trading_session_current', JSON.stringify(this.currentSession));
    } catch (e) {
      console.warn('Failed to store trading metrics:', e);
    }
  }

  /**
   * End current session
   */
  public endSession(): void {
    this.currentSession.endTime = Date.now();
    this.storeMetrics();

    // Start new session
    this.currentSession = this.initSession();
  }

  /**
   * Clear all metrics (user request)
   */
  public static clearMetrics(): void {
    localStorage.removeItem('trading_signals_history');
    localStorage.removeItem('trading_session_current');
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton
export const tradingMetrics = new TradingMetricsTracker();

// Export class for testing
export { TradingMetricsTracker };
