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
    if (risk < 30) return 'text-emerald-400';
    if (risk < 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskBg = (risk: number) => {
    if (risk < 30) return 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30';
    if (risk < 60) return 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30';
    return 'from-red-500/20 to-red-600/10 border-red-500/30';
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-5xl">🛡️</span>
            <h1 className="text-4xl font-bold text-white">Risk Yönetimi</h1>
          </div>
          <p className="text-slate-300">
            Portföy riskinizi gerçek zamanlı izleyin ve optimize edin
          </p>
        </div>

        {/* Risk Alerts */}
        {alerts.length > 0 && (
          <div className="mb-8 space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`backdrop-blur-xl rounded-xl p-4 border flex items-start gap-4 ${
                  alert.type === 'danger'
                    ? 'bg-red-500/20 border-red-500/30'
                    : alert.type === 'warning'
                    ? 'bg-yellow-500/20 border-yellow-500/30'
                    : 'bg-blue-500/20 border-blue-500/30'
                }`}
              >
                <span className="text-2xl">
                  {alert.type === 'danger' ? '🚨' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                <div className="flex-1">
                  <p className="text-white font-medium">{alert.message}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(alert.timestamp).toLocaleTimeString('tr-TR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Risk Metrics */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-xl rounded-xl p-6 border border-blue-500/30">
            <div className="text-blue-300 text-sm mb-2">Portföy Değeri</div>
            <div className="text-3xl font-bold text-white">
              ${metrics.portfolioValue.toLocaleString()}
            </div>
            <div className="text-blue-400 text-xs mt-2">Toplam varlık değeri</div>
          </div>

          <div className={`bg-gradient-to-br backdrop-blur-xl rounded-xl p-6 border ${
            getRiskBg(metrics.totalExposure)
          }`}>
            <div className="text-slate-300 text-sm mb-2">Toplam Maruziyet</div>
            <div className={`text-3xl font-bold ${getRiskColor(metrics.totalExposure)}`}>
              {metrics.totalExposure.toFixed(1)}%
            </div>
            <div className="text-slate-400 text-xs mt-2">Risk maruziyeti</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30">
            <div className="text-purple-300 text-sm mb-2">Çeşitlendirme Skoru</div>
            <div className="text-3xl font-bold text-white">
              {metrics.diversificationScore}/100
            </div>
            <div className="text-purple-400 text-xs mt-2">Portföy dengesi</div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <div className="text-slate-400 text-sm mb-2">Volatilite</div>
            <div className="text-2xl font-bold text-yellow-400">
              {metrics.volatility.toFixed(2)}%
            </div>
            <div className="text-slate-500 text-xs mt-2">30 günlük ortalama</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <div className="text-slate-400 text-sm mb-2">Value at Risk (95%)</div>
            <div className="text-2xl font-bold text-red-400">
              ${metrics.valueAtRisk.toLocaleString()}
            </div>
            <div className="text-slate-500 text-xs mt-2">Günlük maksimum kayıp</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <div className="text-slate-400 text-sm mb-2">Sharpe Oranı</div>
            <div className="text-2xl font-bold text-emerald-400">
              {metrics.sharpeRatio.toFixed(2)}
            </div>
            <div className="text-slate-500 text-xs mt-2">Risk/ödül dengesi</div>
          </div>
        </div>

        {/* Position Risk Analysis */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">📈 Pozisyon Risk Analizi</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
              <p className="text-slate-400 mt-4">Risk analizi yapılıyor...</p>
            </div>
          ) : positions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p>Henüz açık pozisyon bulunmuyor</p>
            </div>
          ) : (
            <div className="space-y-3">
              {positions.map((position, index) => (
                <div
                  key={index}
                  className="bg-slate-900/50 rounded-lg p-5 border border-slate-700/30"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-bold text-white text-xl">{position.symbol}</div>
                      <div className="text-sm text-slate-400">
                        Miktar: {position.size} • Değer: ${position.value.toLocaleString()}
                      </div>
                    </div>
                    <div className={`px-6 py-3 rounded-lg font-bold text-lg ${
                      position.risk < 30
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : position.risk < 60
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      Risk: {position.risk}/100
                    </div>
                  </div>

                  {/* Risk Bar */}
                  <div className="mb-3">
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          position.risk < 30
                            ? 'bg-emerald-500'
                            : position.risk < 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${position.risk}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Correlation */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">Portföy Korelasyonu:</span>
                    <span className={`font-bold ${
                      Math.abs(position.correlation) < 0.3
                        ? 'text-emerald-400'
                        : Math.abs(position.correlation) < 0.7
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`}>
                      {position.correlation.toFixed(2)}
                    </span>
                    <span className="text-slate-500">
                      ({Math.abs(position.correlation) < 0.3 ? 'Düşük' : Math.abs(position.correlation) < 0.7 ? 'Orta' : 'Yüksek'})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Risk Limits */}
        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 backdrop-blur-xl rounded-xl p-6 border border-orange-500/30 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">⚙️ Risk Limitleri</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-slate-300 text-sm mb-2">Maksimum Pozisyon Büyüklüğü (%)</label>
              <input
                type="range"
                min="1"
                max="20"
                defaultValue="10"
                className="w-full"
              />
              <div className="text-orange-400 text-xs mt-1">10% of portfolio</div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Günlük Kayıp Limiti (%)</label>
              <input
                type="range"
                min="1"
                max="10"
                defaultValue="5"
                className="w-full"
              />
              <div className="text-orange-400 text-xs mt-1">5% daily stop</div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Maksimum Açık Pozisyon</label>
              <input
                type="range"
                min="1"
                max="20"
                defaultValue="10"
                className="w-full"
              />
              <div className="text-orange-400 text-xs mt-1">10 eşzamanlı işlem</div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Korelasyon Limiti</label>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="70"
                className="w-full"
              />
              <div className="text-orange-400 text-xs mt-1">0.70 maksimum korelasyon</div>
            </div>
          </div>
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
              AI sinyallerini görüntüleyin
            </p>
          </Link>

          <Link
            href="/backtesting"
            className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-xl rounded-xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-all group"
          >
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
              Backtesting
            </h3>
            <p className="text-slate-400 text-sm">
              Stratejileri test edin
            </p>
          </Link>

          <Link
            href="/signals"
            className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 backdrop-blur-xl rounded-xl p-6 border border-cyan-500/30 hover:border-cyan-400/50 transition-all group"
          >
            <div className="text-4xl mb-4">📡</div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
              Sinyal İzleme
            </h3>
            <p className="text-slate-400 text-sm">
              Tüm sinyalleri takip edin
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}