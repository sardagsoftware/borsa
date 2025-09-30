'use client';

import { useState } from 'react';
import Link from 'next/link';

interface BacktestResult {
  totalTrades: number;
  winRate: number;
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  avgProfit: number;
  avgLoss: number;
  profitFactor: number;
}

interface Trade {
  date: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  price: number;
  profit: number;
}

export default function BacktestingPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [formData, setFormData] = useState({
    strategy: 'momentum',
    symbol: 'BTC/USDT',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    initialCapital: '10000',
    riskPerTrade: '2'
  });

  const runBacktest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/quantum-pro/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (data.success) {
        setResult(data.result);
        setTrades(data.trades || []);
      }
    } catch (error) {
      console.error('Backtest error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-5xl">📊</span>
            <h1 className="text-4xl font-bold text-white">Strateji Backtesting</h1>
          </div>
          <p className="text-slate-300">
            Trading stratejilerinizi geçmiş verilerle test edin ve optimize edin
          </p>
        </div>

        {/* Backtest Form */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">⚙️ Test Parametreleri</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-slate-300 text-sm mb-2">Strateji</label>
              <select
                value={formData.strategy}
                onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="momentum">Momentum (RSI + MACD)</option>
                <option value="meanReversion">Mean Reversion</option>
                <option value="breakout">Breakout</option>
                <option value="aiQuantum">AI Quantum Pro</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Sembol</label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Başlangıç Tarihi</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Bitiş Tarihi</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Başlangıç Sermayesi ($)</label>
              <input
                type="number"
                value={formData.initialCapital}
                onChange={(e) => setFormData({ ...formData, initialCapital: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Risk / İşlem (%)</label>
              <input
                type="number"
                value={formData.riskPerTrade}
                onChange={(e) => setFormData({ ...formData, riskPerTrade: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={runBacktest}
            disabled={loading}
            className="mt-6 w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-4 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Test Çalışıyor...' : '🚀 Backtest Başlat'}
          </button>
        </div>

        {/* Results */}
        {result && (
          <>
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-xl rounded-xl p-6 border border-emerald-500/30">
                <div className="text-emerald-300 text-sm mb-2">Kazanma Oranı</div>
                <div className="text-3xl font-bold text-white">{result.winRate.toFixed(1)}%</div>
                <div className="text-emerald-400 text-xs mt-2">
                  {result.totalTrades} toplam işlem
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-xl rounded-xl p-6 border border-blue-500/30">
                <div className="text-blue-300 text-sm mb-2">Toplam Getiri</div>
                <div className="text-3xl font-bold text-white">{result.totalReturn.toFixed(2)}%</div>
                <div className="text-blue-400 text-xs mt-2">Net performans</div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30">
                <div className="text-purple-300 text-sm mb-2">Sharpe Oranı</div>
                <div className="text-3xl font-bold text-white">{result.sharpeRatio.toFixed(2)}</div>
                <div className="text-purple-400 text-xs mt-2">Risk/ödül dengesi</div>
              </div>

              <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 backdrop-blur-xl rounded-xl p-6 border border-red-500/30">
                <div className="text-red-300 text-sm mb-2">Max Düşüş</div>
                <div className="text-3xl font-bold text-white">{result.maxDrawdown.toFixed(2)}%</div>
                <div className="text-red-400 text-xs mt-2">En büyük kayıp</div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                <div className="text-slate-400 text-sm mb-2">Ortalama Kar</div>
                <div className="text-2xl font-bold text-emerald-400">${result.avgProfit.toFixed(2)}</div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                <div className="text-slate-400 text-sm mb-2">Ortalama Zarar</div>
                <div className="text-2xl font-bold text-red-400">${result.avgLoss.toFixed(2)}</div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                <div className="text-slate-400 text-sm mb-2">Kar Faktörü</div>
                <div className="text-2xl font-bold text-cyan-400">{result.profitFactor.toFixed(2)}</div>
              </div>
            </div>

            {/* Trade History */}
            {trades.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                <h2 className="text-2xl font-bold text-white mb-6">📋 İşlem Geçmişi</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {trades.map((trade, index) => (
                    <div
                      key={index}
                      className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`px-4 py-2 rounded-lg font-bold ${
                          trade.action === 'BUY'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {trade.action === 'BUY' ? 'AL' : 'SAT'}
                        </div>
                        <div>
                          <div className="font-bold text-white">{trade.symbol}</div>
                          <div className="text-sm text-slate-400">{trade.date}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-mono">${trade.price.toFixed(2)}</div>
                        <div className={`text-sm font-bold ${
                          trade.profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Link
            href="/quantum-pro"
            className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all group"
          >
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
              Quantum Pro AI
            </h3>
            <p className="text-slate-400 text-sm">
              AI botlarını yönetin ve canlı sinyalleri görün
            </p>
          </Link>

          <Link
            href="/risk-management"
            className="bg-gradient-to-br from-red-500/20 to-red-600/10 backdrop-blur-xl rounded-xl p-6 border border-red-500/30 hover:border-red-400/50 transition-all group"
          >
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors">
              Risk Yönetimi
            </h3>
            <p className="text-slate-400 text-sm">
              Portföy riskinizi analiz edin
            </p>
          </Link>

          <Link
            href="/ai-trading"
            className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 backdrop-blur-xl rounded-xl p-6 border border-cyan-500/30 hover:border-cyan-400/50 transition-all group"
          >
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
              AI Trading Hub
            </h3>
            <p className="text-slate-400 text-sm">
              Tüm AI özelliklerini keşfedin
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}