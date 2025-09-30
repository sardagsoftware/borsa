'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Activity, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface NirvanaSignal {
  symbol: string;
  timeframe: string;
  timestamp: string;
  probBuy: number;
  decision: 'BUY' | 'HOLD' | 'PASS';
  confidence: number;
  indicators: {
    rsi: number;
    macd: number;
    macdSignal: number;
    macdHistogram: number;
    bb_upper: number;
    bb_middle: number;
    bb_lower: number;
    bb_position: string;
    ema_9: number;
    ema_12: number;
    ema_26: number;
    ema_50: number;
    ema_200: number;
    atr: number;
    volume_ratio: number;
  };
  explain: {
    threshold: number;
    votes: number;
    regime: string;
    reasons: string[];
  };
  price: number;
  latencyMs: number;
}

const SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT',
  'XRPUSDT', 'DOGEUSDT', 'DOTUSDT', 'MATICUSDT', 'AVAXUSDT'
];

const TIMEFRAMES = ['15m', '1h', '4h', '1d'];

export default function NirvanaSignalsPage() {
  const [signals, setSignals] = useState<Record<string, NirvanaSignal>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchSignal = async (symbol: string) => {
    setLoading(prev => ({ ...prev, [symbol]: true }));

    try {
      const response = await fetch(`/api/nirvana/signals?symbol=${symbol}&timeframe=${selectedTimeframe}`);
      const data = await response.json();

      if (response.ok) {
        setSignals(prev => ({ ...prev, [symbol]: data }));
      } else {
        console.error(`Failed to fetch signal for ${symbol}:`, data.error);
      }
    } catch (error) {
      console.error(`Error fetching signal for ${symbol}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [symbol]: false }));
    }
  };

  const fetchAllSignals = async () => {
    for (const symbol of SYMBOLS) {
      await fetchSignal(symbol);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  };

  useEffect(() => {
    fetchAllSignals();
  }, [selectedTimeframe]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchAllSignals, 60000); // Every minute
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedTimeframe]);

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'BUY':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg font-bold border border-emerald-500/30">
            <CheckCircle size={16} />
            BUY
          </div>
        );
      case 'HOLD':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg font-bold border border-yellow-500/30">
            <AlertCircle size={16} />
            HOLD
          </div>
        );
      case 'PASS':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-500/20 text-slate-400 rounded-lg font-bold border border-slate-500/30">
            <XCircle size={16} />
            PASS
          </div>
        );
      default:
        return null;
    }
  };

  const getRegimeBadge = (regime: string) => {
    const color = regime.includes('bullish')
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      : regime.includes('bearish')
      ? 'text-red-400 bg-red-500/10 border-red-500/30'
      : 'text-slate-400 bg-slate-500/10 border-slate-500/30';

    return (
      <span className={`px-2 py-1 text-xs rounded-md border ${color}`}>
        {regime.replace(/_/g, ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
              🧠 Nirvana TF Bot
            </h1>
            <p className="text-slate-400 text-sm">
              Advanced TensorFlow-based Trading Signals with Real-time Technical Analysis
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                autoRefresh
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-700/50 text-slate-300 border border-slate-600/30'
              }`}
            >
              {autoRefresh ? 'Auto-Refresh: ON' : 'Auto-Refresh: OFF'}
            </button>
            <button
              onClick={fetchAllSignals}
              disabled={Object.values(loading).some(Boolean)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={16} className={Object.values(loading).some(Boolean) ? 'animate-spin' : ''} />
              Refresh All
            </button>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-2">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf}
              onClick={() => setSelectedTimeframe(tf)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedTimeframe === tf
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-700/50 text-slate-300 border border-slate-600/30 hover:bg-slate-700'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Signals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {SYMBOLS.map(symbol => {
          const signal = signals[symbol];
          const isLoading = loading[symbol];

          return (
            <div
              key={symbol}
              className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 hover:border-emerald-500/30 transition-all"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">{symbol}</h3>
                  {signal && (
                    <p className="text-sm text-slate-400">
                      ${signal.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  )}
                </div>

                {isLoading ? (
                  <div className="animate-spin">
                    <RefreshCw size={24} className="text-emerald-400" />
                  </div>
                ) : signal ? (
                  getDecisionBadge(signal.decision)
                ) : null}
              </div>

              {signal && !isLoading && (
                <>
                  {/* Confidence & Probability */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">Buy Probability</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all"
                            style={{ width: `${signal.probBuy * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-white">{(signal.probBuy * 100).toFixed(0)}%</span>
                      </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">Confidence</p>
                      <p className="text-2xl font-bold text-white">{signal.confidence}%</p>
                    </div>
                  </div>

                  {/* Regime */}
                  <div className="mb-4">
                    <p className="text-xs text-slate-400 mb-2">Market Regime</p>
                    {getRegimeBadge(signal.explain.regime)}
                  </div>

                  {/* Key Indicators */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">RSI (14)</p>
                      <p className={`text-lg font-bold ${
                        signal.indicators.rsi < 30 ? 'text-emerald-400' :
                        signal.indicators.rsi > 70 ? 'text-red-400' :
                        'text-white'
                      }`}>
                        {signal.indicators.rsi.toFixed(1)}
                      </p>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">MACD Hist</p>
                      <p className={`text-lg font-bold ${
                        signal.indicators.macdHistogram > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {signal.indicators.macdHistogram > 0 ? '+' : ''}{signal.indicators.macdHistogram.toFixed(2)}
                      </p>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">BB Position</p>
                      <p className="text-xs font-bold text-white">
                        {signal.indicators.bb_position.replace(/_/g, ' ').toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Reasons */}
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-2">Signal Reasons ({signal.explain.votes} votes)</p>
                    <ul className="space-y-1">
                      {signal.explain.reasons.map((reason, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">✓</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Footer */}
                  <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-500">
                    <span>Latency: {signal.latencyMs}ms</span>
                    <span>{new Date(signal.timestamp).toLocaleTimeString()}</span>
                  </div>
                </>
              )}

              {!signal && !isLoading && (
                <div className="text-center py-8 text-slate-400">
                  <Activity size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No signal data</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}