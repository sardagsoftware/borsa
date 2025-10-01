'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, PauseIcon, ClockIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

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
    <main className="min-h-screen bg-gradient-dark">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Sinyal İzleme Merkezi</h1>
          <p className="text-white/60">
            Tüm trading sinyallerini gerçek zamanlı takip edin ve analiz edin
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="glass-dark rounded-2xl p-6">
            <div className="text-white/60 text-sm mb-2">Toplam Sinyal</div>
            <div className="text-3xl font-bold text-white">{stats.totalSignals}</div>
            <div className="text-primary text-xs mt-2">Tüm zamanlar</div>
          </div>

          <div className="glass border-primary/30 rounded-2xl p-6">
            <div className="text-white/60 text-sm mb-2">Aktif Sinyaller</div>
            <div className="text-3xl font-bold text-white">{stats.activeSignals}</div>
            <div className="text-primary text-xs mt-2 flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              Canlı
            </div>
          </div>

          <div className="glass-dark rounded-2xl p-6">
            <div className="text-white/60 text-sm mb-2">Başarı Oranı</div>
            <div className="text-3xl font-bold text-white">{stats.successRate.toFixed(1)}%</div>
            <div className="text-white/40 text-xs mt-2">Karlı işlemler</div>
          </div>

          <div className="glass-dark rounded-2xl p-6">
            <div className="text-white/60 text-sm mb-2">Ortalama Kar</div>
            <div className="text-3xl font-bold text-white">{stats.avgProfit.toFixed(2)}%</div>
            <div className="text-white/40 text-xs mt-2">İşlem başına</div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-dark rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-white/60 text-sm">Filtre:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === 'all'
                  ? 'bg-primary/30 text-primary border border-primary/50'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
              }`}
            >
              Tümü ({signals.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === 'active'
                  ? 'bg-primary/30 text-primary border border-primary/50'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
              }`}
            >
              Aktif ({signals.filter(s => s.status === 'active').length})
            </button>
            <button
              onClick={() => setFilter('executed')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === 'executed'
                  ? 'bg-primary/30 text-primary border border-primary/50'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
              }`}
            >
              Gerçekleşen ({signals.filter(s => s.status === 'executed').length})
            </button>
            <button
              onClick={fetchSignals}
              className="ml-auto px-4 py-2 glass-dark rounded-lg hover:border-primary/30 transition-all flex items-center gap-2"
            >
              <ArrowPathIcon className="w-4 h-4 text-primary" />
              <span className="text-white">Yenile</span>
            </button>
          </div>
        </div>

        {/* Signals List */}
        <div className="glass-dark rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Sinyal Akışı</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-white/60 mt-4">Sinyaller yükleniyor...</p>
            </div>
          ) : filteredSignals.length === 0 ? (
            <div className="text-center py-12 text-white/60">
              <p>Henüz sinyal bulunmuyor</p>
              <p className="text-xs mt-2 text-white/40">AI modelleri aktif olarak piyasayı analiz ediyor</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSignals.map((signal) => (
                <div
                  key={signal.id}
                  className={`glass rounded-xl p-5 transition-all ${
                    signal.status === 'active'
                      ? 'border-primary/50 hover:border-primary/70'
                      : 'border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`px-6 py-3 rounded-lg font-bold text-lg flex items-center gap-2 ${
                        signal.action === 'BUY'
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : signal.action === 'SELL'
                          ? 'bg-secondary/20 text-secondary border border-secondary/30'
                          : 'bg-white/10 text-white/60 border border-white/20'
                      }`}>
                        {signal.action === 'BUY' ? (
                          <>
                            <ArrowTrendingUpIcon className="w-5 h-5" />
                            <span>AL</span>
                          </>
                        ) : signal.action === 'SELL' ? (
                          <>
                            <ArrowTrendingDownIcon className="w-5 h-5" />
                            <span>SAT</span>
                          </>
                        ) : (
                          <>
                            <PauseIcon className="w-5 h-5" />
                            <span>BEKLE</span>
                          </>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-white text-xl">{signal.symbol}</div>
                        <div className="text-sm text-white/60 mt-1">
                          {new Date(signal.timestamp).toLocaleString('tr-TR')}
                        </div>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 ${
                      signal.status === 'active'
                        ? 'bg-primary/20 text-primary border-primary/30'
                        : signal.status === 'executed'
                        ? 'bg-primary/20 text-primary border-primary/30'
                        : signal.status === 'expired'
                        ? 'bg-white/10 text-white/60 border-white/20'
                        : 'bg-secondary/20 text-secondary border-secondary/30'
                    }`}>
                      {signal.status === 'active' ? (
                        <>
                          <CheckCircleIcon className="w-4 h-4" />
                          <span>Aktif</span>
                        </>
                      ) : signal.status === 'executed' ? (
                        <>
                          <CheckCircleIcon className="w-4 h-4" />
                          <span>Gerçekleşti</span>
                        </>
                      ) : signal.status === 'expired' ? (
                        <>
                          <ClockIcon className="w-4 h-4" />
                          <span>Süre Doldu</span>
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="w-4 h-4" />
                          <span>İptal</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-5 gap-6">
                    <div>
                      <div className="text-xs text-white/40 mb-1">Güven Seviyesi</div>
                      <div className="text-lg font-bold text-primary">
                        {(signal.confidence * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-white/40 mb-1">Fiyat</div>
                      <div className="text-lg font-bold text-white font-mono">
                        ${signal.price.toFixed(2)}
                      </div>
                    </div>

                    {signal.targetPrice && (
                      <div>
                        <div className="text-xs text-white/40 mb-1">Hedef</div>
                        <div className="text-lg font-bold text-primary font-mono">
                          ${signal.targetPrice.toFixed(2)}
                        </div>
                      </div>
                    )}

                    {signal.stopLoss && (
                      <div>
                        <div className="text-xs text-white/40 mb-1">Stop Loss</div>
                        <div className="text-lg font-bold text-secondary font-mono">
                          ${signal.stopLoss.toFixed(2)}
                        </div>
                      </div>
                    )}

                    {signal.profit !== undefined && signal.status === 'executed' && (
                      <div>
                        <div className="text-xs text-white/40 mb-1">Kar/Zarar</div>
                        <div className={`text-lg font-bold ${
                          signal.profit >= 0 ? 'text-primary' : 'text-secondary'
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
            className="glass-dark rounded-xl p-6 hover:border-primary/30 hover:shadow-glow-primary transition-all group"
          >
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
              Quantum Pro AI
            </h3>
            <p className="text-white/60 text-sm">
              AI bot kontrol paneli
            </p>
          </Link>

          <Link
            href="/market-analysis"
            className="glass-dark rounded-xl p-6 hover:border-primary/30 hover:shadow-glow-primary transition-all group"
          >
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
              Piyasa Analizi
            </h3>
            <p className="text-white/60 text-sm">
              Teknik göstergeler ve grafikler
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
              Portföy risk analizi
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
