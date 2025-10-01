'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface RiskMetrics {
  portfolioValue: number;
  totalExposure: number;
  diversificationScore: number;
  volatility: number;
  valueAtRisk: number;
  sharpeRatio: number;
}

interface Position {
  symbol: string;
  size: number;
  value: number;
  risk: number;
  correlation: number;
}

interface Alert {
  type: 'warning' | 'danger' | 'info';
  message: string;
  timestamp: number;
}

export default function RiskManagementPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<RiskMetrics>({
    portfolioValue: 0,
    totalExposure: 0,
    diversificationScore: 0,
    volatility: 0,
    valueAtRisk: 0,
    sharpeRatio: 0
  });
  const [positions, setPositions] = useState<Position[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    fetchRiskData();
    const interval = setInterval(fetchRiskData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRiskData = async () => {
    try {
      const response = await fetch('/api/quantum-pro/risk-check');
      const data = await response.json();

      if (data.success) {
        setMetrics(data.metrics);
        setPositions(data.positions || []);
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Risk data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk < 30) return 'text-primary';
    if (risk < 60) return 'text-yellow-400';
    return 'text-secondary';
  };

  const getRiskBg = (risk: number) => {
    if (risk < 30) return 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30';
    if (risk < 60) return 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30';
    return 'from-red-500/20 to-red-600/10 border-red-500/30';
  };

  return (
    <main className="min-h-screen bg-gradient-dark">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Risk Yönetimi</h1>
          <p className="text-white/60">
            Portföy riskinizi gerçek zamanlı izleyin ve optimize edin
          </p>
        </div>

        {/* Risk Alerts */}
        {alerts.length > 0 && (
          <div className="mb-8 space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`glass rounded-xl p-4 flex items-start gap-4 ${
                  alert.type === 'danger'
                    ? 'border-secondary/50'
                    : alert.type === 'warning'
                    ? 'border-yellow-400/50'
                    : 'border-primary/50'
                }`}
              >
                <div className="flex-1">
                  <p className="text-white font-medium">{alert.message}</p>
                  <p className="text-xs text-white/40 mt-1">
                    {new Date(alert.timestamp).toLocaleTimeString('tr-TR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Risk Metrics */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="glass-dark rounded-2xl p-6">
            <div className="text-white/60 text-sm mb-2">Portföy Değeri</div>
            <div className="text-3xl font-bold text-white">
              ${metrics.portfolioValue.toLocaleString()}
            </div>
            <div className="text-primary text-xs mt-2">Toplam varlık değeri</div>
          </div>

          <div className={`glass rounded-2xl p-6 ${
            metrics.totalExposure < 30 ? 'border-primary/30' :
            metrics.totalExposure < 60 ? 'border-yellow-400/30' : 'border-secondary/30'
          }`}>
            <div className="text-white/60 text-sm mb-2">Toplam Maruziyet</div>
            <div className={`text-3xl font-bold ${getRiskColor(metrics.totalExposure)}`}>
              {metrics.totalExposure.toFixed(1)}%
            </div>
            <div className="text-white/40 text-xs mt-2">Risk maruziyeti</div>
          </div>

          <div className="glass-dark rounded-2xl p-6">
            <div className="text-white/60 text-sm mb-2">Çeşitlendirme Skoru</div>
            <div className="text-3xl font-bold text-white">
              {metrics.diversificationScore}/100
            </div>
            <div className="text-white/40 text-xs mt-2">Portföy dengesi</div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="glass-dark rounded-2xl p-6">
            <div className="text-white/60 text-sm mb-2">Volatilite</div>
            <div className="text-2xl font-bold text-yellow-400">
              {metrics.volatility.toFixed(2)}%
            </div>
            <div className="text-white/40 text-xs mt-2">30 günlük ortalama</div>
          </div>

          <div className="glass-dark rounded-2xl p-6">
            <div className="text-white/60 text-sm mb-2">Value at Risk (95%)</div>
            <div className="text-2xl font-bold text-secondary">
              ${metrics.valueAtRisk.toLocaleString()}
            </div>
            <div className="text-white/40 text-xs mt-2">Günlük maksimum kayıp</div>
          </div>

          <div className="glass-dark rounded-2xl p-6">
            <div className="text-white/60 text-sm mb-2">Sharpe Oranı</div>
            <div className="text-2xl font-bold text-primary">
              {metrics.sharpeRatio.toFixed(2)}
            </div>
            <div className="text-white/40 text-xs mt-2">Risk/ödül dengesi</div>
          </div>
        </div>

        {/* Position Risk Analysis */}
        <div className="glass-dark rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Pozisyon Risk Analizi</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-white/60 mt-4">Risk analizi yapılıyor...</p>
            </div>
          ) : positions.length === 0 ? (
            <div className="text-center py-12 text-white/60">
              <p>Henüz açık pozisyon bulunmuyor</p>
            </div>
          ) : (
            <div className="space-y-3">
              {positions.map((position, index) => (
                <div
                  key={index}
                  className="glass rounded-xl p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-bold text-white text-xl">{position.symbol}</div>
                      <div className="text-sm text-white/60">
                        Miktar: {position.size} • Değer: ${position.value.toLocaleString()}
                      </div>
                    </div>
                    <div className={`px-6 py-3 rounded-lg font-bold text-lg ${
                      position.risk < 30
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : position.risk < 60
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-secondary/20 text-secondary border border-secondary/30'
                    }`}>
                      Risk: {position.risk}/100
                    </div>
                  </div>

                  {/* Risk Bar */}
                  <div className="mb-3">
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          position.risk < 30
                            ? 'bg-primary'
                            : position.risk < 60
                            ? 'bg-yellow-500'
                            : 'bg-secondary'
                        }`}
                        style={{ width: `${position.risk}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Correlation */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white/60">Portföy Korelasyonu:</span>
                    <span className={`font-bold ${
                      Math.abs(position.correlation) < 0.3
                        ? 'text-primary'
                        : Math.abs(position.correlation) < 0.7
                        ? 'text-yellow-400'
                        : 'text-secondary'
                    }`}>
                      {position.correlation.toFixed(2)}
                    </span>
                    <span className="text-white/40">
                      ({Math.abs(position.correlation) < 0.3 ? 'Düşük' : Math.abs(position.correlation) < 0.7 ? 'Orta' : 'Yüksek'})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Risk Limits */}
        <div className="glass border-secondary/30 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Risk Limitleri</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white/60 text-sm mb-2">Maksimum Pozisyon Büyüklüğü (%)</label>
              <input
                type="range"
                min="1"
                max="20"
                defaultValue="10"
                className="w-full"
              />
              <div className="text-secondary text-xs mt-1">10% of portfolio</div>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">Günlük Kayıp Limiti (%)</label>
              <input
                type="range"
                min="1"
                max="10"
                defaultValue="5"
                className="w-full"
              />
              <div className="text-secondary text-xs mt-1">5% daily stop</div>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">Maksimum Açık Pozisyon</label>
              <input
                type="range"
                min="1"
                max="20"
                defaultValue="10"
                className="w-full"
              />
              <div className="text-secondary text-xs mt-1">10 eşzamanlı işlem</div>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">Korelasyon Limiti</label>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="70"
                className="w-full"
              />
              <div className="text-secondary text-xs mt-1">0.70 maksimum korelasyon</div>
            </div>
          </div>
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
              AI sinyallerini görüntüleyin
            </p>
          </Link>

          <Link
            href="/backtesting"
            className="glass-dark rounded-xl p-6 hover:border-primary/30 hover:shadow-glow-primary transition-all group"
          >
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
              Backtesting
            </h3>
            <p className="text-white/60 text-sm">
              Stratejileri test edin
            </p>
          </Link>

          <Link
            href="/signals"
            className="glass-dark rounded-xl p-6 hover:border-primary/30 hover:shadow-glow-primary transition-all group"
          >
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
              Sinyal İzleme
            </h3>
            <p className="text-white/60 text-sm">
              Tüm sinyalleri takip edin
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}