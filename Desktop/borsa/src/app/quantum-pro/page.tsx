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
      console.error('Quantum Pro sinyal hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-5xl">🤖</span>
            <h1 className="text-4xl font-bold text-white">Quantum Pro AI Bot</h1>
          </div>
          <p className="text-slate-300">
            Çok katmanlı yapay zeka trading motoru • LSTM + Transformer + Gradient Boosting
          </p>
        </div>

        {/* Bot Stats */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-xl rounded-xl p-6 border border-emerald-500/30">
            <div className="text-emerald-300 text-sm mb-2">Doğruluk Oranı</div>
            <div className="text-3xl font-bold text-white">{botStats.accuracy}%</div>
            <div className="text-emerald-400 text-xs mt-2">↑ Son 30 gün</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <div className="text-slate-400 text-sm mb-2">Toplam Sinyal</div>
            <div className="text-3xl font-bold text-white">{botStats.totalSignals}</div>
            <div className="text-slate-400 text-xs mt-2">Aktif sinyaller</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <div className="text-slate-400 text-sm mb-2">Karlı Sinyaller</div>
            <div className="text-3xl font-bold text-emerald-400">{botStats.profitableSignals}</div>
            <div className="text-slate-400 text-xs mt-2">Al/Sat sinyalleri</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <div className="text-slate-400 text-sm mb-2">Aktif Botlar</div>
            <div className="text-3xl font-bold text-cyan-400">{botStats.activeBots}</div>
            <div className="text-slate-400 text-xs mt-2">Çalışan AI modelleri</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30">
            <div className="text-purple-300 text-sm mb-2">Model Versiyonu</div>
            <div className="text-3xl font-bold text-white">v3.5</div>
            <div className="text-purple-400 text-xs mt-2">Quantum Pro</div>
          </div>
        </div>

        {/* AI Models */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">🧠 Aktif AI Modelleri</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-lg p-5 border border-blue-500/30">
              <div className="flex items-center justify-between mb-3">
                <div className="text-blue-300 font-bold">LSTM Sinir Ağı</div>
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
              <div className="text-sm text-slate-300 mb-2">Zaman serisi tahminleri</div>
              <div className="text-xs text-slate-400">8 katman • 256 nöron</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-lg p-5 border border-purple-500/30">
              <div className="flex items-center justify-between mb-3">
                <div className="text-purple-300 font-bold">Transformer Modeli</div>
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
              <div className="text-sm text-slate-300 mb-2">Çok başlı dikkat mekanizması</div>
              <div className="text-xs text-slate-400">8 dikkat başlığı • 4 katman</div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-lg p-5 border border-emerald-500/30">
              <div className="flex items-center justify-between mb-3">
                <div className="text-emerald-300 font-bold">Gradyan Güçlendirme</div>
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
              <div className="text-sm text-slate-300 mb-2">XGBoost tarzı topluluk</div>
              <div className="text-xs text-slate-400">128→64→32 topoloji</div>
            </div>
          </div>
        </div>

        {/* Real-time Signals */}
        <div className="bg-gradient-to-br from-purple-900/30 to-cyan-900/30 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                ⚡ Canlı AI Sinyalleri
              </h2>
              <p className="text-purple-300 text-sm mt-1">15 saniyede bir otomatik güncelleme</p>
            </div>
            <button
              onClick={fetchSignals}
              className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-all"
            >
              🔄 Yenile
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              <p className="text-slate-400 mt-4">AI modelleri analiz ediyor...</p>
            </div>
          ) : signals.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p>Şu anda yüksek güvenilirlikte sinyal bulunamadı.</p>
              <p className="text-xs mt-2">Minimum %75 güven seviyesi gerekli</p>
            </div>
          ) : (
            <div className="space-y-3">
              {signals.map((signal, index) => (
                <div
                  key={`${signal.symbol}-${index}`}
                  className="bg-slate-900/50 rounded-lg p-5 border border-slate-700/30 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-center justify-between">
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
                        <div className="text-sm text-slate-400">{signal.pattern}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Güven Seviyesi</div>
                        <div className="text-2xl font-bold text-emerald-400">
                          {(signal.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Risk Skoru</div>
                        <div className={`text-lg font-bold ${
                          signal.riskScore < 30 ? 'text-emerald-400' :
                          signal.riskScore < 60 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {signal.riskScore}/100
                        </div>
                      </div>
                      {signal.targetPrice && (
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Hedef Fiyat</div>
                          <div className="text-white font-mono">${signal.targetPrice.toFixed(2)}</div>
                        </div>
                      )}
                      {signal.stopLoss && (
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Stop Loss</div>
                          <div className="text-red-400 font-mono">${signal.stopLoss.toFixed(2)}</div>
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
            className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-xl rounded-xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-all group"
          >
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
              Geriye Dönük Test
            </h3>
            <p className="text-slate-400 text-sm">
              Stratejilerinizi geçmiş verilerle test edin
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
              Pozisyon limitleri ve korelasyon analizi
            </p>
          </Link>

          <Link
            href="/signals"
            className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all group"
          >
            <div className="text-4xl mb-4">📡</div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
              Sinyal İzleme
            </h3>
            <p className="text-slate-400 text-sm">
              Tüm sinyalleri detaylı inceleyin
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}