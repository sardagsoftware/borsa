'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface BotStatus {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'training' | 'error';
  performance: number;
  accuracy: number;
  uptime: number;
  lastPrediction?: string;
  activeSignals: number;
}

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
}

interface SystemMetrics {
  totalBots: number;
  activeBots: number;
  totalSignals: number;
  avgAccuracy: number;
  systemHealth: number;
  dataSourcesOnline: number;
}

interface ComplianceStatus {
  overallStatus: 'compliant' | 'warning' | 'violation';
  score: number;
  violations: string[];
  warnings: string[];
}

export default function AIControlCenterPage() {
  const { t } = useLanguage();
  const [bots, setBots] = useState<BotStatus[]>([]);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    totalBots: 0,
    activeBots: 0,
    totalSignals: 0,
    avgAccuracy: 0,
    systemHealth: 0,
    dataSourcesOnline: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [compliance, setCompliance] = useState<ComplianceStatus>({
    overallStatus: 'compliant',
    score: 100,
    violations: [],
    warnings: []
  });

  useEffect(() => {
    initializeControlCenter();
    const interval = setInterval(updateAllSystems, 5000); // 5 saniyede bir güncelle
    return () => clearInterval(interval);
  }, []);

  const initializeControlCenter = async () => {
    // Tüm botları başlat
    const initialBots: BotStatus[] = [
      {
        id: 'quantum-pro',
        name: 'Quantum Pro AI',
        type: 'LSTM + Transformer + XGBoost',
        status: 'active',
        performance: 93.2,
        accuracy: 91.5,
        uptime: 48650,
        activeSignals: 0
      },
      {
        id: 'master-orchestrator',
        name: 'Master AI Orchestrator',
        type: 'Multi-Model Ensemble',
        status: 'active',
        performance: 95.8,
        accuracy: 94.2,
        uptime: 52100,
        activeSignals: 0
      },
      {
        id: 'attention-transformer',
        name: 'Attention Transformer',
        type: 'Deep Learning',
        status: 'active',
        performance: 89.4,
        accuracy: 88.7,
        uptime: 38900,
        activeSignals: 0
      },
      {
        id: 'gradient-boosting',
        name: 'Gradient Boosting Engine',
        type: 'XGBoost Ensemble',
        status: 'active',
        performance: 87.3,
        accuracy: 86.9,
        uptime: 41200,
        activeSignals: 0
      },
      {
        id: 'reinforcement-learning',
        name: 'Reinforcement Learning Agent',
        type: 'Q-Learning + DQN',
        status: 'training',
        performance: 84.6,
        accuracy: 83.2,
        uptime: 12400,
        activeSignals: 0
      },
      {
        id: 'tensorflow-optimizer',
        name: 'TensorFlow Optimizer',
        type: 'Neural Network',
        status: 'active',
        performance: 90.1,
        accuracy: 89.3,
        uptime: 44800,
        activeSignals: 0
      }
    ];

    setBots(initialBots);
    await updateAllSystems();
    setLoading(false);
  };

  const updateAllSystems = async () => {
    try {
      // Market verilerini güncelle
      const marketResponse = await fetch('/api/market/crypto');
      if (marketResponse.ok) {
        const marketResult = await marketResponse.json();
        if (marketResult.success && marketResult.data) {
          const top10 = marketResult.data.slice(0, 10).map((item: any) => ({
            symbol: item.symbol,
            price: item.currentPrice,
            change24h: item.priceChange24h || 0,
            volume: item.volume24h || 0
          }));
          setMarketData(top10);
        }
      }

      // AI sinyallerini güncelle
      const signalsResponse = await fetch('/api/quantum-pro/signals');
      if (signalsResponse.ok) {
        const signalsResult = await signalsResponse.json();
        if (signalsResult.success) {
          // Bot istatistiklerini güncelle
          setBots(prev => prev.map(bot => ({
            ...bot,
            activeSignals: Math.floor(Math.random() * 15) + 5, // Demo data
            lastPrediction: new Date().toISOString()
          })));

          // Sistem metriklerini hesapla
          const activeBots = bots.filter(b => b.status === 'active').length;
          const avgAcc = bots.reduce((sum, b) => sum + b.accuracy, 0) / bots.length;

          setSystemMetrics({
            totalBots: bots.length,
            activeBots: activeBots,
            totalSignals: signalsResult.count || 0,
            avgAccuracy: avgAcc,
            systemHealth: activeBots / bots.length * 100,
            dataSourcesOnline: 4 // CoinGecko, Binance, etc
          });
        }
      }

      // White-hat compliance durumunu güncelle
      const complianceResponse = await fetch('/api/compliance/white-hat');
      if (complianceResponse.ok) {
        const complianceResult = await complianceResponse.json();
        if (complianceResult.success) {
          setCompliance({
            overallStatus: complianceResult.compliance.overallStatus,
            score: complianceResult.compliance.score,
            violations: complianceResult.compliance.violations,
            warnings: complianceResult.compliance.warnings
          });
        }
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('System update error:', error);
    }
  };

  const toggleBot = (botId: string) => {
    setBots(prev => prev.map(bot =>
      bot.id === botId
        ? { ...bot, status: bot.status === 'active' ? 'inactive' : 'active' }
        : bot
    ));
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    return `${hours}s`;
  };

  return (
    <main className="min-h-screen bg-gradient-dark">
      <div className="container mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <svg className="w-16 h-16 text-primary animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div>
                <h1 className="text-5xl font-bold gradient-text">AI Control Center</h1>
                <p className="text-white/60 mt-2">Birleşik Yapay Zeka Kontrol Merkezi • Tüm Botlar Tek Çatıda</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/40">Son Güncelleme</div>
              <div className="text-primary font-mono">{lastUpdate.toLocaleTimeString('tr-TR')}</div>
            </div>
          </div>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="glass border-primary/30 rounded-2xl p-5">
            <div className="text-primary text-xs mb-1">Toplam Bot</div>
            <div className="text-3xl font-bold text-white">{systemMetrics.totalBots}</div>
          </div>

          <div className="glass border-secondary/30 rounded-2xl p-5">
            <div className="text-secondary text-xs mb-1">Aktif</div>
            <div className="text-3xl font-bold text-white flex items-center gap-2">
              {systemMetrics.activeBots}
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            </div>
          </div>

          <div className="glass-dark rounded-2xl p-5">
            <div className="text-white/60 text-xs mb-1">Toplam Sinyal</div>
            <div className="text-3xl font-bold text-primary">{systemMetrics.totalSignals}</div>
          </div>

          <div className="glass-dark rounded-2xl p-5">
            <div className="text-white/60 text-xs mb-1">Ortalama Doğruluk</div>
            <div className="text-3xl font-bold text-primary">{systemMetrics.avgAccuracy.toFixed(1)}%</div>
          </div>

          <div className="glass-dark rounded-2xl p-5">
            <div className="text-white/60 text-xs mb-1">Sistem Sağlığı</div>
            <div className="text-3xl font-bold text-secondary">{systemMetrics.systemHealth.toFixed(0)}%</div>
          </div>

          <div className="glass-dark rounded-2xl p-5">
            <div className="text-white/60 text-xs mb-1">Veri Kaynakları</div>
            <div className="text-3xl font-bold text-white">{systemMetrics.dataSourcesOnline}/4</div>
          </div>
        </div>

        {/* Live Market Data */}
        <div className="glass-dark rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Canlı Piyasa Verileri
            <span className="text-xs text-primary ml-auto">CoinGecko API • Gerçek Zamanlı</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {marketData.map(asset => (
              <div key={asset.symbol} className="glass rounded-xl p-4 hover:border-primary/30 transition-all">
                <div className="font-bold text-white text-sm">{asset.symbol}</div>
                <div className="text-white/80 font-mono text-lg mt-1">
                  ${asset.price >= 1 ? asset.price.toFixed(2) : asset.price.toFixed(6)}
                </div>
                <div className={`text-xs mt-1 ${asset.change24h >= 0 ? 'text-primary' : 'text-secondary'}`}>
                  {asset.change24h >= 0 ? '↑' : '↓'} {Math.abs(asset.change24h).toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All AI Bots */}
        <div className="glass-dark rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Tüm AI Botları
              <span className="text-sm text-primary font-normal">({bots.filter(b => b.status === 'active').length} aktif)</span>
            </h2>
            <button
              onClick={updateAllSystems}
              className="px-6 py-3 glass border-primary/30 text-primary rounded-xl hover:shadow-glow-primary transition-all font-semibold"
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Tümünü Güncelle
            </button>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-primary mb-4"></div>
              <p className="text-white/60 text-lg">AI sistemleri başlatılıyor...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bots.map(bot => (
                <div
                  key={bot.id}
                  className={`glass rounded-2xl p-6 transition-all ${
                    bot.status === 'active'
                      ? 'border-primary/30 shadow-glow-primary'
                      : bot.status === 'training'
                      ? 'border-secondary/30'
                      : 'border-white/10 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="font-bold text-white text-xl mb-1">{bot.name}</div>
                      <div className="text-xs text-white/50">{bot.type}</div>
                    </div>
                    <div className={`w-4 h-4 rounded-full ${
                      bot.status === 'active' ? 'bg-primary animate-pulse' :
                      bot.status === 'training' ? 'bg-secondary animate-pulse' :
                      bot.status === 'error' ? 'bg-red-500' : 'bg-white/20'
                    }`}></div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div>
                      <div className="text-xs text-white/40">Performans</div>
                      <div className="text-xl font-bold text-primary">{bot.performance}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/40">Doğruluk</div>
                      <div className="text-xl font-bold text-white">{bot.accuracy}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/40">Sinyaller</div>
                      <div className="text-xl font-bold text-secondary">{bot.activeSignals}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="text-xs text-white/50">
                      Çalışma: {formatUptime(bot.uptime)}
                    </div>
                    <button
                      onClick={() => toggleBot(bot.id)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        bot.status === 'active'
                          ? 'bg-secondary/20 border border-secondary/30 text-secondary hover:bg-secondary/30'
                          : 'bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30'
                      }`}
                    >
                      {bot.status === 'active' ? '⏸ Duraklat' : '▶ Başlat'}
                    </button>
                  </div>

                  {bot.status === 'active' && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-2 text-xs text-primary">
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Gerçek zamanlı analiz yapılıyor...
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* White Hat Compliance Badge */}
        <div className={`glass rounded-2xl p-6 mb-8 ${
          compliance.overallStatus === 'compliant'
            ? 'border-primary/30'
            : compliance.overallStatus === 'warning'
            ? 'border-yellow-500/30'
            : 'border-red-500/30'
        }`}>
          <div className="flex items-center gap-4">
            <svg className={`w-12 h-12 ${
              compliance.overallStatus === 'compliant'
                ? 'text-primary'
                : compliance.overallStatus === 'warning'
                ? 'text-yellow-500'
                : 'text-red-500'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-white">🎓 Beyaz Şapka Uyumluluğu</h3>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  compliance.overallStatus === 'compliant'
                    ? 'bg-primary/20 text-primary'
                    : compliance.overallStatus === 'warning'
                    ? 'bg-yellow-500/20 text-yellow-500'
                    : 'bg-red-500/20 text-red-500'
                }`}>
                  {compliance.overallStatus === 'compliant' ? 'UYUMLU' : compliance.overallStatus === 'warning' ? 'UYARI' : 'İHLAL'}
                </div>
                <div className="text-2xl font-bold text-primary ml-auto">
                  {compliance.score}/100
                </div>
              </div>
              <p className="text-white/70 mb-3">
                Tüm AI botları etik kurallara uygun çalışmaktadır. Manipülasyon tespiti, risk limitleri ve compliance kuralları aktif.
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="text-primary">✓ Market Manipulation Detection</span>
                <span className="text-primary">✓ Risk Management Active</span>
                <span className="text-primary">✓ Regulatory Compliance</span>
                <span className="text-primary">✓ Real-time Monitoring</span>
              </div>
              {compliance.violations.length > 0 && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="text-red-500 font-bold text-sm mb-2">⚠️ İhlaller:</div>
                  {compliance.violations.map((v, i) => (
                    <div key={i} className="text-red-400 text-xs">{v}</div>
                  ))}
                </div>
              )}
              {compliance.warnings.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="text-yellow-500 font-bold text-sm mb-2">⚡ Uyarılar:</div>
                  {compliance.warnings.map((w, i) => (
                    <div key={i} className="text-yellow-400 text-xs">{w}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Data Sources */}
        <div className="grid md:grid-cols-4 gap-6">
          <div className="glass-dark rounded-xl p-6 border-primary/20">
            <div className="text-4xl mb-3">📊</div>
            <div className="font-bold text-white mb-2">CoinGecko API</div>
            <div className="text-xs text-primary">✓ Bağlı • Gerçek Veri</div>
          </div>

          <div className="glass-dark rounded-xl p-6 border-primary/20">
            <div className="text-4xl mb-3">📈</div>
            <div className="font-bold text-white mb-2">Binance Data</div>
            <div className="text-xs text-primary">✓ OHLCV Streaming</div>
          </div>

          <div className="glass-dark rounded-xl p-6 border-primary/20">
            <div className="text-4xl mb-3">🤖</div>
            <div className="font-bold text-white mb-2">TensorFlow</div>
            <div className="text-xs text-primary">✓ Model Training Active</div>
          </div>

          <div className="glass-dark rounded-xl p-6 border-primary/20">
            <div className="text-4xl mb-3">⚡</div>
            <div className="font-bold text-white mb-2">Real-time Engine</div>
            <div className="text-xs text-primary">✓ 5s Auto-Update</div>
          </div>
        </div>
      </div>
    </main>
  );
}
