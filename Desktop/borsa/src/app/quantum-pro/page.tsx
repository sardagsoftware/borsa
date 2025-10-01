'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AISignal {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  riskScore: number;
  targetPrice?: number;
  stopLoss?: number;
  pattern: string;
  timestamp: number;
}

interface BotStats {
  totalSignals: number;
  accuracy: number;
  profitableSignals: number;
  activeBots: number;
  totalProfit: number;
}

export default function QuantumProPage() {
  const [signals, setSignals] = useState<AISignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [botStats, setBotStats] = useState<BotStats>({
    totalSignals: 0,
    accuracy: 93.2,
    profitableSignals: 0,
    activeBots: 3,
    totalProfit: 0
  });

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 15000); // 15 saniyede bir
    return () => clearInterval(interval);
  }, []);

  const fetchSignals = async () => {
    try {
      const response = await fetch('/api/quantum-pro/signals?minConfidence=0.75');
      const result = await response.json();

      if (result.success) {
        setSignals(result.signals);
        setBotStats(prev => ({
          ...prev,
          totalSignals: result.count,
          profitableSignals: result.signals.filter((s: AISignal) => s.action !== 'HOLD').length
        }));
      }
    } catch (error) {
      console.error('Quantum Pro signals error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-dark">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <svg className="w-14 h-14 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h1 className="text-4xl font-bold gradient-text">Quantum Pro AI Bot</h1>
          </div>
          <p className="text-white/60">
            Çok katmanlı yapay zeka trading motoru • LSTM + Transformer + Gradient Boosting
          </p>
        </div>

        {/* Bot Stats */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <div className="glass border-primary/30 rounded-2xl p-6">
            <div className="text-primary text-sm mb-2">Doğruluk Oranı</div>
            <div className="text-3xl font-bold text-white">{botStats.accuracy}%</div>
            <div className="text-primary text-xs mt-2">↑ Son 30 gün</div>
          </div>

          <div className="glass-dark rounded-2xl p-6">
            <div className="text-white/60 text-sm mb-2">Toplam Sinyal</div>
            <div className="text-3xl font-bold text-white">{botStats.totalSignals}</div>
            <div className="text-white/40 text-xs mt-2">Aktif sinyaller</div>
          </div>

          <div className="glass-dark rounded-2xl p-6">
            <div className="text-white/60 text-sm mb-2">Karlı Sinyaller</div>
            <div className="text-3xl font-bold text-primary">{botStats.profitableSignals}</div>
            <div className="text-white/40 text-xs mt-2">Al/Sat sinyalleri</div>
          </div>

          <div className="glass-dark rounded-2xl p-6">
            <div className="text-white/60 text-sm mb-2">Aktif Botlar</div>
            <div className="text-3xl font-bold text-secondary">{botStats.activeBots}</div>
            <div className="text-white/40 text-xs mt-2">Çalışan AI modelleri</div>
          </div>

          <div className="glass border-secondary/30 rounded-2xl p-6">
            <div className="text-secondary text-sm mb-2">Model Versiyonu</div>
            <div className="text-3xl font-bold text-white">v3.5</div>
            <div className="text-secondary text-xs mt-2">Quantum Pro</div>
          </div>
        </div>

        {/* AI Models */}
        <div className="glass-dark rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Aktif AI Modelleri
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="glass rounded-xl p-5 border-primary/20 hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="text-white font-bold">LSTM Neural Network</div>
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
              </div>
              <div className="text-sm text-white/70 mb-2">Zaman serisi tahminleri</div>
              <div className="text-xs text-white/50">8 katman • 256 nöron</div>
            </div>

            <div className="glass rounded-xl p-5 border-secondary/20 hover:border-secondary/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="text-white font-bold">Transformer Model</div>
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
              </div>
              <div className="text-sm text-white/70 mb-2">Multi-head attention</div>
              <div className="text-xs text-white/50">8 attention heads • 4 layer</div>
            </div>

            <div className="glass rounded-xl p-5 border-primary/20 hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="text-white font-bold">Gradient Boosting</div>
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
              </div>
              <div className="text-sm text-white/70 mb-2">XGBoost-style ensemble</div>
              <div className="text-xs text-white/50">128→64→32 topology</div>
            </div>
          </div>
        </div>

        {/* Real-time Signals */}
        <div className="glass-dark rounded-2xl p-6 border-primary/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Canlı AI Sinyalleri
              </h2>
              <p className="text-primary text-sm mt-1">15 saniyede bir otomatik güncelleme</p>
            </div>
            <button
              onClick={fetchSignals}
              className="px-4 py-2 glass border-primary/30 text-primary rounded-xl hover:shadow-glow-primary transition-all"
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Yenile
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-white/60 mt-4">AI modelleri analiz ediyor...</p>
            </div>
          ) : signals.length === 0 ? (
            <div className="text-center py-12 text-white/60">
              <p>Şu anda yüksek güvenilirlikte sinyal bulunamadı.</p>
              <p className="text-xs mt-2 text-white/40">Minimum %75 güven seviyesi gerekli</p>
            </div>
          ) : (
            <div className="space-y-3">
              {signals.map((signal, index) => (
                <div
                  key={`${signal.symbol}-${index}`}
                  className="glass-dark rounded-xl p-5 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`px-6 py-3 rounded-xl font-bold text-lg ${
                        signal.action === 'BUY'
                          ? 'glass border-primary/30 text-primary'
                          : signal.action === 'SELL'
                          ? 'glass border-secondary/30 text-secondary'
                          : 'glass-dark text-white/60'
                      }`}>
                        {signal.action === 'BUY' ? (
                          <span className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            AL
                          </span>
                        ) : signal.action === 'SELL' ? (
                          <span className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                            </svg>
                            SAT
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            BEKLE
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-white text-xl">{signal.symbol}</div>
                        <div className="text-sm text-white/50">{signal.pattern}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <div className="text-xs text-white/50">Güven Seviyesi</div>
                        <div className="text-2xl font-bold text-primary">
                          {(signal.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-white/50">Risk Skoru</div>
                        <div className={`text-lg font-bold ${
                          signal.riskScore < 30 ? 'text-primary' :
                          signal.riskScore < 60 ? 'text-secondary' : 'text-red-400'
                        }`}>
                          {signal.riskScore}/100
                        </div>
                      </div>
                      {signal.targetPrice && (
                        <div className="text-right">
                          <div className="text-xs text-white/50">Hedef Fiyat</div>
                          <div className="text-white font-mono">${signal.targetPrice.toFixed(2)}</div>
                        </div>
                      )}
                      {signal.stopLoss && (
                        <div className="text-right">
                          <div className="text-xs text-white/50">Stop Loss</div>
                          <div className="text-secondary font-mono">${signal.stopLoss.toFixed(2)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Link
            href="/backtesting"
            className="glass-dark rounded-2xl p-6 hover:border-primary/30 transition-all group"
          >
            <svg className="w-12 h-12 text-primary mb-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
              Backtesting
            </h3>
            <p className="text-white/60 text-sm">
              Stratejilerinizi geçmiş verilerle test edin
            </p>
          </Link>

          <Link
            href="/risk-management"
            className="glass-dark rounded-2xl p-6 hover:border-primary/30 transition-all group"
          >
            <svg className="w-12 h-12 text-primary mb-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
              Risk Yönetimi
            </h3>
            <p className="text-white/60 text-sm">
              Pozisyon limitleri ve korelasyon analizi
            </p>
          </Link>

          <Link
            href="/signals"
            className="glass-dark rounded-2xl p-6 hover:border-primary/30 transition-all group"
          >
            <svg className="w-12 h-12 text-primary mb-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
              Sinyal İzleme
            </h3>
            <p className="text-white/60 text-sm">
              Tüm sinyalleri detaylı inceleyin
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}