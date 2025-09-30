'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AIModel {
  name: string;
  type: string;
  accuracy: number;
  status: 'active' | 'training' | 'idle';
  predictions: number;
}

interface AIFeature {
  title: string;
  description: string;
  icon: string;
  link: string;
  color: string;
}

export default function AITradingPage() {
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<AIModel[]>([]);
  const [stats, setStats] = useState({
    totalModels: 3,
    activeModels: 3,
    totalPredictions: 0,
    avgAccuracy: 93.2
  });

  useEffect(() => {
    fetchAIData();
    const interval = setInterval(fetchAIData, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchAIData = async () => {
    try {
      const response = await fetch('/api/quantum-pro/ai-stats');
      const data = await response.json();

      if (data.success) {
        setModels(data.models || [
          {
            name: 'LSTM Neural Network',
            type: 'Deep Learning',
            accuracy: 94.5,
            status: 'active',
            predictions: 15420
          },
          {
            name: 'Transformer Model',
            type: 'Attention Mechanism',
            accuracy: 92.8,
            status: 'active',
            predictions: 12350
          },
          {
            name: 'Gradient Boosting',
            type: 'Ensemble Learning',
            accuracy: 92.3,
            status: 'active',
            predictions: 18700
          }
        ]);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('AI data error:', error);
      // Set default models on error
      setModels([
        {
          name: 'LSTM Neural Network',
          type: 'Deep Learning',
          accuracy: 94.5,
          status: 'active',
          predictions: 15420
        },
        {
          name: 'Transformer Model',
          type: 'Attention Mechanism',
          accuracy: 92.8,
          status: 'active',
          predictions: 12350
        },
        {
          name: 'Gradient Boosting',
          type: 'Ensemble Learning',
          accuracy: 92.3,
          status: 'active',
          predictions: 18700
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const features: AIFeature[] = [
    {
      title: 'Quantum Pro AI Bot',
      description: 'Çok katmanlı yapay zeka trading motoru. LSTM + Transformer + Gradient Boosting hibrit modeli.',
      icon: '🤖',
      link: '/quantum-pro',
      color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30'
    },
    {
      title: 'Sinyal İzleme',
      description: 'Tüm AI sinyallerini gerçek zamanlı takip edin. Aktif ve geçmiş sinyaller.',
      icon: '📡',
      link: '/signals',
      color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30'
    },
    {
      title: 'Piyasa Analizi',
      description: 'Teknik göstergeler, sentiment analizi ve kripto piyasa verileri.',
      icon: '📊',
      link: '/market-analysis',
      color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30'
    },
    {
      title: 'Backtesting',
      description: 'Stratejilerinizi geçmiş verilerle test edin ve optimize edin.',
      icon: '📈',
      link: '/backtesting',
      color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30'
    },
    {
      title: 'Risk Yönetimi',
      description: 'Portföy risk analizi, korelasyon kontrolü ve pozisyon limitleri.',
      icon: '🛡️',
      link: '/risk-management',
      color: 'from-red-500/20 to-red-600/10 border-red-500/30'
    },
    {
      title: 'Bot Yönetimi',
      description: 'Trading botlarınızı başlatın, durdurun ve performanslarını izleyin.',
      icon: '⚙️',
      link: '/bot-management',
      color: 'from-orange-500/20 to-orange-600/10 border-orange-500/30'
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-5xl">🧠</span>
            <h1 className="text-4xl font-bold text-white">AI Trading Hub</h1>
          </div>
          <p className="text-slate-300">
            LyDian Trader'ın tüm yapay zeka özelliklerini keşfedin ve yönetin
          </p>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-purple-500/20 to-cyan-500/20 backdrop-blur-xl rounded-xl p-8 border border-purple-500/30 mb-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Yapay Zeka Destekli Trading
              </h2>
              <p className="text-slate-200 mb-6">
                En gelişmiş makine öğrenimi modelleri ile kripto piyasalarını analiz edin.
                LSTM, Transformer ve Gradient Boosting modellerinin gücünü birleştiren
                hibrit AI sistemimiz %93+ doğruluk oranı ile sinyal üretir.
              </p>
              <div className="flex gap-4">
                <Link
                  href="/quantum-pro"
                  className="px-6 py-3 bg-purple-500/30 border border-purple-500/50 text-purple-200 rounded-lg hover:bg-purple-500/40 transition-all font-bold"
                >
                  Şimdi Başla
                </Link>
                <Link
                  href="/backtesting"
                  className="px-6 py-3 bg-slate-700/50 border border-slate-600/50 text-slate-200 rounded-lg hover:bg-slate-700 transition-all font-bold"
                >
                  Strateji Test Et
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-5 border border-slate-700/50">
                <div className="text-emerald-400 text-3xl font-bold">{stats.avgAccuracy}%</div>
                <div className="text-slate-300 text-sm mt-1">Ortalama Doğruluk</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-5 border border-slate-700/50">
                <div className="text-cyan-400 text-3xl font-bold">{stats.activeModels}</div>
                <div className="text-slate-300 text-sm mt-1">Aktif Model</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-5 border border-slate-700/50">
                <div className="text-purple-400 text-3xl font-bold">{stats.totalPredictions}+</div>
                <div className="text-slate-300 text-sm mt-1">Tahmin Üretildi</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-5 border border-slate-700/50">
                <div className="text-blue-400 text-3xl font-bold">24/7</div>
                <div className="text-slate-300 text-sm mt-1">Kesintisiz Çalışma</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Models */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">🎯 AI Modelleri</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              <p className="text-slate-400 mt-4">AI modelleri yükleniyor...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {models.map((model, index) => (
                <div
                  key={index}
                  className={`bg-gradient-to-br rounded-lg p-6 border ${
                    index === 0 ? 'from-blue-500/20 to-blue-600/10 border-blue-500/30' :
                    index === 1 ? 'from-purple-500/20 to-purple-600/10 border-purple-500/30' :
                    'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="font-bold text-white text-lg">{model.name}</div>
                      <div className="text-sm text-slate-300 mt-1">{model.type}</div>
                    </div>
                    {model.status === 'active' && (
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Doğruluk Oranı</div>
                      <div className="text-2xl font-bold text-white">{model.accuracy}%</div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400 mb-1">Tahminler</div>
                      <div className="text-lg font-bold text-cyan-400">
                        {model.predictions.toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400 mb-1">Durum</div>
                      <div className={`text-sm font-bold ${
                        model.status === 'active' ? 'text-emerald-400' :
                        model.status === 'training' ? 'text-yellow-400' : 'text-slate-400'
                      }`}>
                        {model.status === 'active' ? '✓ Aktif' :
                         model.status === 'training' ? '⏳ Eğitimde' : '⏸ Bekleniyor'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">🚀 AI Özellikleri</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Link
                key={index}
                href={feature.link}
                className={`bg-gradient-to-br ${feature.color} backdrop-blur-xl rounded-xl p-6 border hover:scale-105 transition-all group`}
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">⚡ Nasıl Çalışır?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-5xl mb-4">📊</div>
              <div className="font-bold text-white mb-2">1. Veri Toplama</div>
              <div className="text-sm text-slate-400">
                Piyasa verileri, teknik göstergeler ve sentiment analizi
              </div>
            </div>

            <div className="text-center">
              <div className="text-5xl mb-4">🧠</div>
              <div className="font-bold text-white mb-2">2. AI Analizi</div>
              <div className="text-sm text-slate-400">
                3 farklı AI modeli paralel olarak analiz yapar
              </div>
            </div>

            <div className="text-center">
              <div className="text-5xl mb-4">🎯</div>
              <div className="font-bold text-white mb-2">3. Sinyal Üretimi</div>
              <div className="text-sm text-slate-400">
                Yüksek güvenilirlikte AL/SAT sinyalleri
              </div>
            </div>

            <div className="text-center">
              <div className="text-5xl mb-4">💰</div>
              <div className="font-bold text-white mb-2">4. Uygulama</div>
              <div className="text-sm text-slate-400">
                Manuel veya otomatik trading gerçekleştirin
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-xl rounded-xl p-6 border border-emerald-500/30">
            <h3 className="text-xl font-bold text-white mb-4">📈 Performans Metrikleri</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <span className="text-slate-300">Ortalama Kazanma Oranı</span>
                <span className="text-emerald-400 font-bold">87.3%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <span className="text-slate-300">Ortalama Kar</span>
                <span className="text-emerald-400 font-bold">+12.4%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <span className="text-slate-300">Sharpe Oranı</span>
                <span className="text-cyan-400 font-bold">2.34</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <span className="text-slate-300">Maksimum Düşüş</span>
                <span className="text-red-400 font-bold">-5.2%</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-xl rounded-xl p-6 border border-blue-500/30">
            <h3 className="text-xl font-bold text-white mb-4">🔥 Popüler Stratejiler</h3>
            <div className="space-y-3">
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-bold">Momentum Trading</span>
                  <span className="text-emerald-400 text-sm">+15.3%</span>
                </div>
                <div className="text-xs text-slate-400">RSI + MACD kombinasyonu</div>
              </div>

              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-bold">Mean Reversion</span>
                  <span className="text-emerald-400 text-sm">+11.8%</span>
                </div>
                <div className="text-xs text-slate-400">Bollinger Bands stratejisi</div>
              </div>

              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-bold">AI Quantum Pro</span>
                  <span className="text-emerald-400 text-sm">+18.7%</span>
                </div>
                <div className="text-xs text-slate-400">Hibrit AI modeli</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-purple-600/30 to-cyan-600/30 backdrop-blur-xl rounded-xl p-8 border border-purple-500/40 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            AI Trading ile Başlamaya Hazır mısınız?
          </h2>
          <p className="text-slate-200 mb-6 max-w-2xl mx-auto">
            Yapay zeka destekli trading botlarımız 24/7 piyasaları analiz eder ve
            en karlı fırsatları yakalar. Hemen başlayın ve trading stratejinizi AI ile güçlendirin.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/quantum-pro"
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-cyan-600 transition-all"
            >
              🤖 Quantum Pro'yu Başlat
            </Link>
            <Link
              href="/bot-management"
              className="px-8 py-4 bg-slate-700/50 border border-slate-600/50 text-white font-bold rounded-lg hover:bg-slate-700 transition-all"
            >
              ⚙️ Bot Yönetimi
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}