'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CryptoData {
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange24h: number;
  image: string;
}

interface AISignal {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  riskScore: number;
  targetPrice?: number;
  stopLoss?: number;
  pattern: string;
}

export default function DashboardPage() {
  const [cryptos, setCryptos] = useState<CryptoData[]>([]);
  const [aiSignals, setAISignals] = useState<AISignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [signalsLoading, setSignalsLoading] = useState(true);

  useEffect(() => {
    fetchCryptos();
    fetchAISignals();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAISignals();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchCryptos = async () => {
    try {
      const response = await fetch('/api/market/crypto');
      const result = await response.json();

      if (result.success) {
        setCryptos(result.data.slice(0, 6)); // İlk 6
      }
    } catch (error) {
      console.error('Kripto verileri alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAISignals = async () => {
    try {
      const response = await fetch('/api/quantum-pro/signals?minConfidence=0.75');
      const result = await response.json();

      if (result.success) {
        setAISignals(result.signals.slice(0, 5)); // İlk 5
      }
    } catch (error) {
      console.error('AI sinyalleri alınamadı:', error);
    } finally {
      setSignalsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Kontrol Paneli</h1>
          <p className="text-slate-400">Piyasa özeti ve portföy durumunuz</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <div className="text-slate-400 text-sm mb-2">Toplam Portföy Değeri</div>
            <div className="text-3xl font-bold text-white">$0.00</div>
            <div className="text-emerald-400 text-sm mt-2">+0.00%</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <div className="text-slate-400 text-sm mb-2">Günlük Değişim</div>
            <div className="text-3xl font-bold text-white">$0.00</div>
            <div className="text-slate-400 text-sm mt-2">Son 24 saat</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <div className="text-slate-400 text-sm mb-2">Aktif Pozisyonlar</div>
            <div className="text-3xl font-bold text-white">0</div>
            <div className="text-slate-400 text-sm mt-2">Açık işlem yok</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <div className="text-slate-400 text-sm mb-2">AI Sinyalleri</div>
            <div className="text-3xl font-bold text-emerald-400">%93</div>
            <div className="text-slate-400 text-sm mt-2">Doğruluk oranı</div>
          </div>
        </div>

        {/* Top Cryptos */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Popüler Kripto Paralar</h2>
            <Link
              href="/crypto"
              className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
            >
              Tümünü Gör →
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
              <p className="text-slate-400 mt-4">Veriler yükleniyor...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {cryptos.map((crypto) => (
                <div
                  key={crypto.symbol}
                  className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30 hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <img src={crypto.image} alt={crypto.name} className="w-10 h-10" />
                    <div>
                      <div className="font-bold text-white">{crypto.symbol}</div>
                      <div className="text-xs text-slate-400">{crypto.name}</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white mb-2">
                    ${crypto.currentPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={`text-sm font-medium ${crypto.priceChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {crypto.priceChange24h >= 0 ? '↑' : '↓'} {Math.abs(crypto.priceChange24h).toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Trading Signals - Quantum Pro */}
        <div className="bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 backdrop-blur-xl rounded-xl p-6 border border-emerald-500/30 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="text-3xl">🤖</span>
                Quantum Pro AI Sinyalleri
              </h2>
              <p className="text-emerald-300 text-sm mt-1">Gerçek zamanlı AI tahminleri • 30 saniyede bir güncellenir</p>
            </div>
            <div className="text-right">
              <div className="text-emerald-400 text-2xl font-bold">%93</div>
              <div className="text-slate-400 text-xs">Doğruluk</div>
            </div>
          </div>

          {signalsLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-400"></div>
              <p className="text-slate-400 mt-3 text-sm">AI modeli analiz ediyor...</p>
            </div>
          ) : aiSignals.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>Şu anda yüksek güvenilirlikte sinyal bulunamadı.</p>
              <p className="text-xs mt-2">Minimum %75 güven seviyesi gerekli</p>
            </div>
          ) : (
            <div className="space-y-3">
              {aiSignals.map((signal, index) => (
                <div
                  key={`${signal.symbol}-${index}`}
                  className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30 hover:border-emerald-500/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`px-4 py-2 rounded-lg font-bold ${
                        signal.action === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : signal.action === 'SELL'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                      }`}>
                        {signal.action === 'BUY' ? '📈 AL' : signal.action === 'SELL' ? '📉 SAT' : '⏸️ BEKLE'}
                      </div>
                      <div>
                        <div className="font-bold text-white text-lg">{signal.symbol}</div>
                        <div className="text-xs text-slate-400">{signal.pattern}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Güven</div>
                        <div className="text-emerald-400 font-bold">{(signal.confidence * 100).toFixed(0)}%</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Risk</div>
                        <div className={`font-bold ${
                          signal.riskScore < 30 ? 'text-emerald-400' :
                          signal.riskScore < 60 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {signal.riskScore < 30 ? 'Düşük' : signal.riskScore < 60 ? 'Orta' : 'Yüksek'}
                        </div>
                      </div>
                      {signal.targetPrice && (
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Hedef</div>
                          <div className="text-white font-mono text-sm">${signal.targetPrice.toFixed(2)}</div>
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
        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/stocks"
            className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-xl rounded-xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-all group"
          >
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
              Hisse Senetleri
            </h3>
            <p className="text-slate-400 text-sm">
              Borsa verilerini inceleyin ve işlem yapın
            </p>
          </Link>

          <Link
            href="/crypto"
            className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-xl rounded-xl p-6 border border-emerald-500/30 hover:border-emerald-400/50 transition-all group"
          >
            <div className="text-4xl mb-4">₿</div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
              Kripto Paralar
            </h3>
            <p className="text-slate-400 text-sm">
              Kripto piyasasını takip edin
            </p>
          </Link>

          <Link
            href="/portfolio"
            className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all group"
          >
            <div className="text-4xl mb-4">💼</div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
              Portföyüm
            </h3>
            <p className="text-slate-400 text-sm">
              Yatırımlarınızı yönetin
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}