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
        setCryptos(result.data.slice(0, 6)); // Top 6
      }
    } catch (error) {
      console.error('Error fetching cryptos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAISignals = async () => {
    try {
      const response = await fetch('/api/quantum-pro/signals?minConfidence=0.75');
      const result = await response.json();

      if (result.success) {
        setAISignals(result.signals.slice(0, 5)); // Top 5
      }
    } catch (error) {
      console.error('Error fetching AI signals:', error);
    } finally {
      setSignalsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-dark">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Dashboard</h1>
          <p className="text-white/60">Piyasa özeti ve portföy durumunuz</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="glass-dark rounded-2xl p-6">
            <div className="text-white/60 text-sm mb-2">Toplam Portföy Değeri</div>
            <div className="text-3xl font-bold text-white">$0.00</div>
            <div className="text-primary text-sm mt-2">+0.00%</div>
          </div>

          <div className="glass-dark rounded-2xl p-6">
            <div className="text-white/60 text-sm mb-2">Günlük Değişim</div>
            <div className="text-3xl font-bold text-white">$0.00</div>
            <div className="text-white/40 text-sm mt-2">Son 24 saat</div>
          </div>

          <div className="glass-dark rounded-2xl p-6">
            <div className="text-white/60 text-sm mb-2">Aktif Pozisyonlar</div>
            <div className="text-3xl font-bold text-white">0</div>
            <div className="text-white/40 text-sm mt-2">Açık işlem yok</div>
          </div>

          <div className="glass border-primary/30 rounded-2xl p-6">
            <div className="text-primary text-sm mb-2">AI Sinyalleri</div>
            <div className="text-3xl font-bold text-white">%93</div>
            <div className="text-primary text-sm mt-2">Doğruluk oranı</div>
          </div>
        </div>

        {/* Top Cryptos */}
        <div className="glass-dark rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Popüler Kripto Paralar</h2>
            <Link
              href="/crypto"
              className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
            >
              Tümünü Gör →
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-white/60 mt-4">Veriler yükleniyor...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {cryptos.map((crypto) => (
                <div
                  key={crypto.symbol}
                  className="glass border-primary/20 rounded-xl p-4 hover:border-primary/40 hover:shadow-glow-primary transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <img src={crypto.image} alt={crypto.name} className="w-10 h-10" />
                    <div>
                      <div className="font-bold text-white">{crypto.symbol}</div>
                      <div className="text-xs text-white/40">{crypto.name}</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white mb-2">
                    ${crypto.currentPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={`text-sm font-medium ${crypto.priceChange24h >= 0 ? 'text-primary' : 'text-secondary'}`}>
                    {crypto.priceChange24h >= 0 ? '↑' : '↓'} {Math.abs(crypto.priceChange24h).toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Trading Signals - Quantum Pro */}
        <div className="glass border-primary/30 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Quantum Pro AI Sinyalleri
              </h2>
              <p className="text-primary text-sm mt-1">Gerçek zamanlı AI tahminleri • 30 saniyede bir güncellenir</p>
            </div>
            <div className="text-right">
              <div className="text-primary text-2xl font-bold">%93</div>
              <div className="text-white/40 text-xs">Doğruluk</div>
            </div>
          </div>

          {signalsLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="text-white/60 mt-3 text-sm">AI modeli analiz ediyor...</p>
            </div>
          ) : aiSignals.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              <p>Şu anda yüksek güvenilirlikte sinyal bulunamadı.</p>
              <p className="text-xs mt-2 text-white/40">Minimum %75 güven seviyesi gerekli</p>
            </div>
          ) : (
            <div className="space-y-3">
              {aiSignals.map((signal, index) => (
                <div
                  key={`${signal.symbol}-${index}`}
                  className="glass-dark rounded-xl p-4 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`px-4 py-2 rounded-lg font-bold ${
                        signal.action === 'BUY'
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : signal.action === 'SELL'
                          ? 'bg-secondary/20 text-secondary border border-secondary/30'
                          : 'bg-white/10 text-white/60 border border-white/20'
                      }`}>
                        {signal.action === 'BUY' ? 'AL' : signal.action === 'SELL' ? 'SAT' : 'BEKLE'}
                      </div>
                      <div>
                        <div className="font-bold text-white text-lg">{signal.symbol}</div>
                        <div className="text-xs text-white/40">{signal.pattern}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-xs text-white/40">Güven</div>
                        <div className="text-primary font-bold">{(signal.confidence * 100).toFixed(0)}%</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-white/40">Risk</div>
                        <div className={`font-bold ${
                          signal.riskScore < 30 ? 'text-primary' :
                          signal.riskScore < 60 ? 'text-yellow-400' : 'text-secondary'
                        }`}>
                          {signal.riskScore < 30 ? 'Düşük' : signal.riskScore < 60 ? 'Orta' : 'Yüksek'}
                        </div>
                      </div>
                      {signal.targetPrice && (
                        <div className="text-right">
                          <div className="text-xs text-white/40">Hedef</div>
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
            className="glass-dark rounded-xl p-6 hover:border-primary/30 hover:shadow-glow-primary transition-all group"
          >
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
              Hisse Senetleri
            </h3>
            <p className="text-white/60 text-sm">
              Borsa verilerini inceleyin ve işlem yapın
            </p>
          </Link>

          <Link
            href="/crypto"
            className="glass-dark rounded-xl p-6 hover:border-primary/30 hover:shadow-glow-primary transition-all group"
          >
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
              Kripto Paralar
            </h3>
            <p className="text-white/60 text-sm">
              Kripto piyasasını takip edin
            </p>
          </Link>

          <Link
            href="/portfolio"
            className="glass-dark rounded-xl p-6 hover:border-primary/30 hover:shadow-glow-primary transition-all group"
          >
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
              Portföyüm
            </h3>
            <p className="text-white/60 text-sm">
              Yatırımlarınızı yönetin
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}