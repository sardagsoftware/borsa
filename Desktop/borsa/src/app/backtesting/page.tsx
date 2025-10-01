'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChartBarIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

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
    <main className="min-h-screen bg-gradient-dark">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Strateji Backtesting</h1>
          <p className="text-white/60">
            Trading stratejilerinizi geçmiş verilerle test edin ve optimize edin
          </p>
        </div>

        {/* Backtest Form */}
        <div className="glass-dark rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Test Parametreleri</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white/60 text-sm mb-2">Strateji</label>
              <select
                value={formData.strategy}
                onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
                className="w-full glass-dark rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none"
              >
                <option value="momentum">Momentum (RSI + MACD)</option>
                <option value="meanReversion">Mean Reversion</option>
                <option value="breakout">Breakout</option>
                <option value="aiQuantum">AI Quantum Pro</option>
              </select>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">Sembol</label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                className="w-full glass-dark rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">Başlangıç Tarihi</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full glass-dark rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">Bitiş Tarihi</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full glass-dark rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">Başlangıç Sermayesi ($)</label>
              <input
                type="number"
                value={formData.initialCapital}
                onChange={(e) => setFormData({ ...formData, initialCapital: e.target.value })}
                className="w-full glass-dark rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">Risk / İşlem (%)</label>
              <input
                type="number"
                value={formData.riskPerTrade}
                onChange={(e) => setFormData({ ...formData, riskPerTrade: e.target.value })}
                className="w-full glass-dark rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={runBacktest}
            disabled={loading}
            className="mt-6 w-full bg-gradient-primary text-white font-bold py-4 rounded-xl hover:shadow-glow-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Test Çalışıyor...</span>
              </>
            ) : (
              <>
                <RocketLaunchIcon className="w-5 h-5" />
                <span>Backtest Başlat</span>
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <>
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <div className="glass border-primary/30 rounded-2xl p-6">
                <div className="text-white/60 text-sm mb-2">Kazanma Oranı</div>
                <div className="text-3xl font-bold text-white">{result.winRate.toFixed(1)}%</div>
                <div className="text-primary text-xs mt-2">
                  {result.totalTrades} toplam işlem
                </div>
              </div>

              <div className="glass-dark rounded-2xl p-6">
                <div className="text-white/60 text-sm mb-2">Toplam Getiri</div>
                <div className="text-3xl font-bold text-white">{result.totalReturn.toFixed(2)}%</div>
                <div className="text-white/40 text-xs mt-2">Net performans</div>
              </div>

              <div className="glass-dark rounded-2xl p-6">
                <div className="text-white/60 text-sm mb-2">Sharpe Oranı</div>
                <div className="text-3xl font-bold text-white">{result.sharpeRatio.toFixed(2)}</div>
                <div className="text-white/40 text-xs mt-2">Risk/ödül dengesi</div>
              </div>

              <div className="glass-dark rounded-2xl p-6">
                <div className="text-white/60 text-sm mb-2">Max Düşüş</div>
                <div className="text-3xl font-bold text-white">{result.maxDrawdown.toFixed(2)}%</div>
                <div className="text-secondary text-xs mt-2">En büyük kayıp</div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="glass-dark rounded-2xl p-6">
                <div className="text-white/60 text-sm mb-2">Ortalama Kar</div>
                <div className="text-2xl font-bold text-primary">${result.avgProfit.toFixed(2)}</div>
              </div>

              <div className="glass-dark rounded-2xl p-6">
                <div className="text-white/60 text-sm mb-2">Ortalama Zarar</div>
                <div className="text-2xl font-bold text-secondary">${result.avgLoss.toFixed(2)}</div>
              </div>

              <div className="glass-dark rounded-2xl p-6">
                <div className="text-white/60 text-sm mb-2">Kar Faktörü</div>
                <div className="text-2xl font-bold text-primary">{result.profitFactor.toFixed(2)}</div>
              </div>
            </div>

            {/* Trade History */}
            {trades.length > 0 && (
              <div className="glass-dark rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-white mb-6">İşlem Geçmişi</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {trades.map((trade, index) => (
                    <div
                      key={index}
                      className="glass rounded-xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`px-4 py-2 rounded-lg font-bold ${
                          trade.action === 'BUY'
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : 'bg-secondary/20 text-secondary border border-secondary/30'
                        }`}>
                          {trade.action === 'BUY' ? 'AL' : 'SAT'}
                        </div>
                        <div>
                          <div className="font-bold text-white">{trade.symbol}</div>
                          <div className="text-sm text-white/60">{trade.date}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-mono">${trade.price.toFixed(2)}</div>
                        <div className={`text-sm font-bold ${
                          trade.profit >= 0 ? 'text-primary' : 'text-secondary'
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
            className="glass-dark rounded-xl p-6 hover:border-primary/30 hover:shadow-glow-primary transition-all group"
          >
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
              Quantum Pro AI
            </h3>
            <p className="text-white/60 text-sm">
              AI botlarını yönetin ve canlı sinyalleri görün
            </p>
          </Link>

          <Link
            href="/risk-management"
            className="glass-dark rounded-xl p-6 hover:border-primary/30 hover:shadow-glow-primary transition-all group"
          >
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
              Risk Yönetimi
            </h3>
            <p className="text-white/60 text-sm">
              Portföy riskinizi analiz edin
            </p>
          </Link>

          <Link
            href="/ai-trading"
            className="glass-dark rounded-xl p-6 hover:border-primary/30 hover:shadow-glow-primary transition-all group"
          >
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
              AI Trading Hub
            </h3>
            <p className="text-white/60 text-sm">
              Tüm AI özelliklerini keşfedin
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
