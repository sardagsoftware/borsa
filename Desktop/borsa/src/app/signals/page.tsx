'use client';

import { useEffect, useState } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';

interface Signal {
  id: string;
  coin: {
    symbol: string;
    name: string;
    price: number;
    change24h: number;
  };
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  timeframe: string;
  expiresAt: number;
  createdAt: number;
  status: 'active' | 'expired' | 'executed';
  botVotes: {
    buy: number;
    sell: number;
    hold: number;
  };
  reasoning: string;
}

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [autoScan, setAutoScan] = useState(false);
  const [filter, setFilter] = useState<'all' | 'BUY' | 'SELL' | 'active' | 'expired'>('all');
  const { addNotification } = useNotifications();

  // Scan for signals
  const scanForSignals = async () => {
    setScanning(true);
    try {
      // Get top 50 coins
      const coinsResponse = await fetch('/api/trading/top100');
      const coinsData = await coinsResponse.json();

      if (!coinsData.success || !coinsData.data) {
        throw new Error('Failed to load coins');
      }

      const coins = coinsData.data.slice(0, 30); // Scan top 30 coins
      const newSignals: Signal[] = [];

      for (const item of coins) {
        const coin = item.coin;

        // Get AI signals for this coin
        const signalResponse = await fetch('/api/trading/signals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: coin.symbol,
            timeframe: '1h',
          }),
        });

        const signalData = await signalResponse.json();

        if (signalData.success && signalData.ensemble_signal === 'BUY' && signalData.ensemble_confidence >= 0.65) {
          // Create signal with 15-minute expiry
          const expiresAt = Date.now() + (15 * 60 * 1000); // 15 minutes
          const createdAt = Date.now();

          const buyBots = signalData.signals.filter((s: any) => s.signal === 'BUY').length;
          const sellBots = signalData.signals.filter((s: any) => s.signal === 'SELL').length;
          const holdBots = signalData.signals.filter((s: any) => s.signal === 'HOLD').length;

          const signal: Signal = {
            id: `signal-${coin.symbol}-${createdAt}`,
            coin: {
              symbol: coin.symbol,
              name: coin.name,
              price: coin.price,
              change24h: coin.change24h,
            },
            action: signalData.ensemble_signal,
            confidence: signalData.ensemble_confidence,
            entryPrice: coin.price,
            stopLoss: coin.price * 0.97, // 3% stop loss
            takeProfit: coin.price * 1.08, // 8% take profit
            riskReward: 2.67, // (8% / 3%)
            timeframe: '1h',
            expiresAt,
            createdAt,
            status: 'active',
            botVotes: {
              buy: buyBots,
              sell: sellBots,
              hold: holdBots,
            },
            reasoning: signalData.signals[0]?.reasoning || 'AI ensemble analysis indicates strong buy opportunity',
          };

          newSignals.push(signal);

          // Send notification for new signal
          addNotification({
            type: 'signal',
            title: '🚀 Yeni AL Sinyali!',
            message: `${coin.symbol} için güçlü alım fırsatı tespit edildi`,
            coin: coin.symbol,
            action: 'BUY',
            price: coin.price,
            confidence: signalData.ensemble_confidence,
            expiresAt,
            autoClose: false,
          });
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Add new signals and remove duplicates
      setSignals(prev => {
        const combined = [...newSignals, ...prev];
        const unique = combined.filter((signal, index, self) =>
          index === self.findIndex((s) => s.coin.symbol === signal.coin.symbol && s.status === 'active')
        );
        return unique;
      });

    } catch (error) {
      console.error('Signal scan error:', error);
      addNotification({
        type: 'error',
        title: 'Tarama Hatası',
        message: 'Sinyaller taranırken bir hata oluştu',
        autoClose: true,
      });
    } finally {
      setScanning(false);
    }
  };

  // Check for expired signals
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setSignals(prev =>
        prev.map(signal => {
          if (signal.status === 'active' && signal.expiresAt < now) {
            // Send expiration notification
            addNotification({
              type: 'warning',
              title: '⏱️ Süre Doldu',
              message: `${signal.coin.symbol} için alım fırsatı süresi doldu`,
              coin: signal.coin.symbol,
              autoClose: true,
            });
            return { ...signal, status: 'expired' as const };
          }
          return signal;
        })
      );
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [addNotification]);

  // Auto-scan mode
  useEffect(() => {
    if (!autoScan) return;

    const interval = setInterval(() => {
      scanForSignals();
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [autoScan]);

  // Initial scan
  useEffect(() => {
    scanForSignals();
  }, []);

  const filteredSignals = signals.filter(signal => {
    if (filter === 'all') return true;
    if (filter === 'active') return signal.status === 'active';
    if (filter === 'expired') return signal.status === 'expired';
    if (filter === 'BUY' || filter === 'SELL') return signal.action === filter;
    return true;
  });

  const activeSignals = signals.filter(s => s.status === 'active');
  const buySignals = signals.filter(s => s.action === 'BUY');

  const getTimeLeft = (expiresAt: number) => {
    const now = Date.now();
    const timeLeft = expiresAt - now;

    if (timeLeft <= 0) return 'Süresi doldu';

    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}dk ${seconds}sn`;
    }
    return `${seconds}sn`;
  };

  const getProgressPercentage = (expiresAt: number, createdAt: number) => {
    const now = Date.now();
    const total = expiresAt - createdAt;
    const elapsed = now - createdAt;
    return Math.max(0, Math.min(100, ((total - elapsed) / total) * 100));
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 py-6">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="sticky top-20 z-40 bg-gradient-to-r from-slate-900/95 to-emerald-900/95 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/30 shadow-2xl mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">🎯 Trading Signals</h1>
              <p className="text-slate-300 text-sm">Real-time AI Analysis • Auto-expiring Opportunities • 6 AI Bots</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Auto Scan Toggle */}
              <button
                onClick={() => setAutoScan(!autoScan)}
                className={`px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
                  autoScan
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white animate-pulse'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                }`}
              >
                {autoScan ? '🔄 Auto Scan: ON' : '⏸️ Auto Scan: OFF'}
              </button>

              {/* Manual Scan */}
              <button
                onClick={scanForSignals}
                disabled={scanning}
                className="px-6 py-3 bg-emerald-500/20 text-emerald-300 rounded-xl hover:bg-emerald-500/30 transition-all font-semibold disabled:opacity-50"
              >
                {scanning ? '⏳ Scanning...' : '🚀 Scan Now'}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-400">Total Signals</div>
              <div className="text-2xl font-bold text-white">{signals.length}</div>
            </div>
            <div className="bg-emerald-500/20 rounded-lg p-3">
              <div className="text-xs text-emerald-400">Active Signals</div>
              <div className="text-2xl font-bold text-emerald-300">{activeSignals.length}</div>
            </div>
            <div className="bg-cyan-500/20 rounded-lg p-3">
              <div className="text-xs text-cyan-400">Buy Signals</div>
              <div className="text-2xl font-bold text-cyan-300">{buySignals.length}</div>
            </div>
            <div className="bg-purple-500/20 rounded-lg p-3">
              <div className="text-xs text-purple-400">Scan Status</div>
              <div className="text-sm font-bold text-purple-300">
                {autoScan ? 'Auto (5min)' : 'Manual'}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-400">Filter:</span>
            {(['all', 'BUY', 'active', 'expired'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === f
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                    : 'bg-slate-700/30 text-slate-400 hover:bg-slate-600/30'
                }`}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Signals Grid */}
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSignals.length > 0 ? (
            filteredSignals.map((signal) => {
              const timeLeft = getTimeLeft(signal.expiresAt);
              const progress = getProgressPercentage(signal.expiresAt, signal.createdAt);
              const isExpired = signal.status === 'expired';

              return (
                <div
                  key={signal.id}
                  className={`rounded-2xl border-2 p-6 transition-all ${
                    isExpired
                      ? 'bg-slate-800/30 border-slate-600/30 opacity-60'
                      : signal.action === 'BUY'
                      ? 'bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/20'
                      : 'bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/50'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-2xl font-bold text-white">{signal.coin.symbol}</div>
                      <div className="text-sm text-slate-400">{signal.coin.name}</div>
                    </div>
                    <div className={`px-4 py-2 rounded-xl border-2 font-bold text-lg ${
                      signal.action === 'BUY'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-red-500/20 text-red-300 border-red-500/50'
                    }`}>
                      {signal.action === 'BUY' ? '📈 BUY' : '📉 SELL'}
                    </div>
                  </div>

                  {/* Price & Confidence */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400">Entry Price</div>
                      <div className="text-white font-mono text-lg font-bold">
                        ${signal.entryPrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400">Confidence</div>
                      <div className="text-cyan-400 text-lg font-bold">
                        {(signal.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Targets */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-emerald-500/20 rounded-lg p-2 text-center">
                      <div className="text-xs text-emerald-400">Take Profit</div>
                      <div className="text-emerald-300 font-mono text-sm font-bold">
                        ${signal.takeProfit.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-red-500/20 rounded-lg p-2 text-center">
                      <div className="text-xs text-red-400">Stop Loss</div>
                      <div className="text-red-300 font-mono text-sm font-bold">
                        ${signal.stopLoss.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-cyan-500/20 rounded-lg p-2 text-center">
                      <div className="text-xs text-cyan-400">R/R</div>
                      <div className="text-cyan-300 text-sm font-bold">
                        1:{signal.riskReward.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  {/* Bot Votes */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs text-slate-400">Bot Votes:</span>
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-bold">
                      ✅ {signal.botVotes.buy}
                    </span>
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded font-bold">
                      ❌ {signal.botVotes.sell}
                    </span>
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded font-bold">
                      ⏸️ {signal.botVotes.hold}
                    </span>
                  </div>

                  {/* Reasoning */}
                  <div className="bg-slate-700/30 rounded-lg p-3 mb-4">
                    <div className="text-xs text-slate-400 mb-1">💡 Analysis</div>
                    <div className="text-xs text-slate-300">{signal.reasoning}</div>
                  </div>

                  {/* Time Left & Progress */}
                  {!isExpired ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400">Time Left:</span>
                        <span className={`text-sm font-bold ${
                          progress > 50 ? 'text-emerald-400' : progress > 20 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          ⏱️ {timeLeft}
                        </span>
                      </div>
                      <div className="w-full bg-slate-700/30 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${
                            progress > 50
                              ? 'bg-emerald-500'
                              : progress > 20
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-2 bg-red-500/20 rounded-lg">
                      <span className="text-red-400 font-bold text-sm">⏱️ Expired</span>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="mt-3 text-xs text-slate-500 text-center">
                    Created: {new Date(signal.createdAt).toLocaleString('tr-TR')}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <div className="text-xl text-white mb-2">No Signals Found</div>
              <div className="text-slate-400 mb-4">
                {scanning ? 'Scanning for opportunities...' : 'Click "Scan Now" to find trading opportunities'}
              </div>
              {!scanning && (
                <button
                  onClick={scanForSignals}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg"
                >
                  🚀 Start Scanning
                </button>
              )}
            </div>
          )}
        </div>

        {/* Scanning Indicator */}
        {scanning && (
          <div className="fixed bottom-6 left-6 bg-emerald-500/10 border-2 border-emerald-500/50 rounded-xl p-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              <div>
                <div className="font-bold text-emerald-400 text-sm">Scanning Markets...</div>
                <div className="text-xs text-emerald-300">Analyzing top 30 coins with AI</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
