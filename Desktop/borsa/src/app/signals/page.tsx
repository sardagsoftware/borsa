'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Signal {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  price: number;
  targetPrice?: number;
  stopLoss?: number;
  status: 'active' | 'executed' | 'expired' | 'cancelled';
  timestamp: number;
  profit?: number;
}

interface SignalStats {
  totalSignals: number;
  activeSignals: number;
  successRate: number;
  avgProfit: number;
}

export default function SignalsPage() {
  const [loading, setLoading] = useState(true);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'executed'>('all');
  const [stats, setStats] = useState<SignalStats>({
    totalSignals: 0,
    activeSignals: 0,
    successRate: 0,
    avgProfit: 0
  });

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchSignals = async () => {
    try {
      const response = await fetch('/api/quantum-pro/monitor');
      const data = await response.json();

      if (data.success) {
        setSignals(data.signals || []);
        setStats({
          totalSignals: data.signals?.length || 0,
          activeSignals: data.signals?.filter((s: Signal) => s.status === 'active').length || 0,
          successRate: data.stats?.successRate || 0,
          avgProfit: data.stats?.avgProfit || 0
        });
      }
    } catch (error) {
      console.error('Signals error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSignals = signals.filter(signal => {
    if (filter === 'all') return true;
    return signal.status === filter;
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-5xl">📡</span>
            <h1 className="text-4xl font-bold text-white">Sinyal İzleme Merkezi</h1>
          </div>
          <p className="text-slate-300">
            Tüm trading sinyallerini gerçek zamanlı takip edin ve analiz edin
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 backdrop-blur-xl rounded-xl p-6 border border-cyan-500/30">
            <div className="text-cyan-300 text-sm mb-2">Toplam Sinyal</div>
            <div className="text-3xl font-bold text-white">{stats.totalSignals}</div>
            <div className="text-cyan-400 text-xs mt-2">Tüm zamanlar</div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-xl rounded-xl p-6 border border-emerald-500/30">
            <div className="text-emerald-300 text-sm mb-2">Aktif Sinyaller</div>
            <div className="text-3xl font-bold text-white">{stats.activeSignals}</div>
            <div className="text-emerald-400 text-xs mt-2">
              <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-1"></span>
              Canlı
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30">
            <div className="text-purple-300 text-sm mb-2">Başarı Oranı</div>
            <div className="text-3xl font-bold text-white">{stats.successRate.toFixed(1)}%</div>
            <div className="text-purple-400 text-xs mt-2">Karlı işlemler</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-xl rounded-xl p-6 border border-blue-500/30">
            <div className="text-blue-300 text-sm mb-2">Ortalama Kar</div>
            <div className="text-3xl font-bold text-white">{stats.avgProfit.toFixed(2)}%</div>
            <div className="text-blue-400 text-xs mt-2">İşlem başına</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm">Filtre:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === 'all'
                  ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                  : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700'
              }`}
            >
              Tümü ({signals.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === 'active'
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                  : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700'
              }`}
            >
              Aktif ({signals.filter(s => s.status === 'active').length})
            </button>
            <button
              onClick={() => setFilter('executed')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === 'executed'
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                  : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700'
              }`}
            >
              Gerçekleşen ({signals.filter(s => s.status === 'executed').length})
            </button>
            <button
              onClick={fetchSignals}
              className="ml-auto px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-all"
            >
              🔄 Yenile
            </button>
          </div>
        </div>

        {/* Signals List */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">⚡ Sinyal Akışı</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              <p className="text-slate-400 mt-4">Sinyaller yükleniyor...</p>
            </div>
          ) : filteredSignals.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p>Henüz sinyal bulunmuyor</p>
              <p className="text-xs mt-2">AI modelleri aktif olarak piyasayı analiz ediyor</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSignals.map((signal) => (
                <div
                  key={signal.id}
                  className={`bg-slate-900/50 rounded-lg p-5 border transition-all ${
                    signal.status === 'active'
                      ? 'border-purple-500/50 hover:border-purple-400/70'
                      : 'border-slate-700/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`px-6 py-3 rounded-lg font-bold text-lg ${
                        signal.action === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : signal.action === 'SELL'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                      }`}>
                        {signal.action === 'BUY' ? '📈 AL' : signal.action === 'SELL' ? '📉 SAT' : '⏸️ BEKLE'}
                      </div>
                      <div>
                        <div className="font-bold text-white text-xl">{signal.symbol}</div>
                        <div className="text-sm text-slate-400 mt-1">
                          {new Date(signal.timestamp).toLocaleString('tr-TR')}
                        </div>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-lg border text-sm font-medium ${
                      signal.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : signal.status === 'executed'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : signal.status === 'expired'
                        ? 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      {signal.status === 'active' ? '✓ Aktif' :
                       signal.status === 'executed' ? '✅ Gerçekleşti' :
                       signal.status === 'expired' ? '⏰ Süre Doldu' : '❌ İptal'}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-5 gap-6">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Güven Seviyesi</div>
                      <div className="text-lg font-bold text-emerald-400">
                        {(signal.confidence * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500 mb-1">Fiyat</div>
                      <div className="text-lg font-bold text-white font-mono">
                        ${signal.price.toFixed(2)}
                      </div>
                    </div>

                    {signal.targetPrice && (
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Hedef</div>
                        <div className="text-lg font-bold text-emerald-400 font-mono">
                          ${signal.targetPrice.toFixed(2)}
                        </div>
                      </div>
                    )}

                    {signal.stopLoss && (
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Stop Loss</div>
                        <div className="text-lg font-bold text-red-400 font-mono">
                          ${signal.stopLoss.toFixed(2)}
                        </div>
                      </div>
                    )}

                    {signal.profit !== undefined && signal.status === 'executed' && (
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Kar/Zarar</div>
                        <div className={`text-lg font-bold ${
                          signal.profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {signal.profit >= 0 ? '+' : ''}{signal.profit.toFixed(2)}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/quantum-pro"
            className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all group"
          >
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
              Quantum Pro AI
            </h3>
            <p className="text-slate-400 text-sm">
              AI bot kontrol paneli
            </p>
          </Link>

          <Link
            href="/market-analysis"
            className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 backdrop-blur-xl rounded-xl p-6 border border-cyan-500/30 hover:border-cyan-400/50 transition-all group"
          >
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
              Piyasa Analizi
            </h3>
            <p className="text-slate-400 text-sm">
              Teknik göstergeler ve grafikler
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
              Portföy risk analizi
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}