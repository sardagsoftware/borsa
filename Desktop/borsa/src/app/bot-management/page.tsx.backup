'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Bot {
  id: string;
  name: string;
  strategy: string;
  status: 'running' | 'stopped' | 'paused';
  profit: number;
  trades: number;
  winRate: number;
  uptime: number;
}

interface BotStats {
  totalBots: number;
  activeBots: number;
  totalProfit: number;
  totalTrades: number;
}

export default function BotManagementPage() {
  const [loading, setLoading] = useState(true);
  const [bots, setBots] = useState<Bot[]>([]);
  const [stats, setStats] = useState<BotStats>({
    totalBots: 0,
    activeBots: 0,
    totalProfit: 0,
    totalTrades: 0
  });

  useEffect(() => {
    fetchBots();
    const interval = setInterval(fetchBots, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchBots = async () => {
    try {
      const response = await fetch('/api/quantum-pro/bots');
      const data = await response.json();

      if (data.success) {
        setBots(data.bots || []);
        setStats({
          totalBots: data.bots?.length || 0,
          activeBots: data.bots?.filter((b: Bot) => b.status === 'running').length || 0,
          totalProfit: data.stats?.totalProfit || 0,
          totalTrades: data.stats?.totalTrades || 0
        });
      }
    } catch (error) {
      console.error('Bots error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBot = async (botId: string, action: 'start' | 'stop' | 'pause') => {
    try {
      await fetch('/api/quantum-pro/bots/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId, action })
      });
      fetchBots();
    } catch (error) {
      console.error('Bot control error:', error);
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}s ${minutes}d`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-5xl">🤖</span>
            <h1 className="text-4xl font-bold text-white">Bot Yönetimi</h1>
          </div>
          <p className="text-slate-300">
            Trading botlarınızı başlatın, durdurun ve performanslarını izleyin
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 backdrop-blur-xl rounded-xl p-6 border border-cyan-500/30">
            <div className="text-cyan-300 text-sm mb-2">Toplam Bot</div>
            <div className="text-3xl font-bold text-white">{stats.totalBots}</div>
            <div className="text-cyan-400 text-xs mt-2">Kayıtlı botlar</div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-xl rounded-xl p-6 border border-emerald-500/30">
            <div className="text-emerald-300 text-sm mb-2">Aktif Botlar</div>
            <div className="text-3xl font-bold text-white flex items-center gap-2">
              {stats.activeBots}
              <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
            </div>
            <div className="text-emerald-400 text-xs mt-2">Çalışan</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30">
            <div className="text-purple-300 text-sm mb-2">Toplam Kar</div>
            <div className="text-3xl font-bold text-white">
              ${stats.totalProfit.toLocaleString()}
            </div>
            <div className="text-purple-400 text-xs mt-2">Tüm botlar</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-xl rounded-xl p-6 border border-blue-500/30">
            <div className="text-blue-300 text-sm mb-2">Toplam İşlem</div>
            <div className="text-3xl font-bold text-white">{stats.totalTrades}</div>
            <div className="text-blue-400 text-xs mt-2">Gerçekleşen</div>
          </div>
        </div>

        {/* Create New Bot */}
        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 backdrop-blur-xl rounded-xl p-6 border border-yellow-500/30 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">➕ Yeni Bot Oluştur</h3>
              <p className="text-yellow-300 text-sm">
                Önceden tanımlanmış stratejilerle hızlıca bot kurun
              </p>
            </div>
            <button className="px-6 py-3 bg-yellow-500/30 border border-yellow-500/50 text-yellow-300 rounded-lg hover:bg-yellow-500/40 transition-all font-bold">
              Bot Ekle
            </button>
          </div>
        </div>

        {/* Bots List */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">🔧 Bot Listesi</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
              <p className="text-slate-400 mt-4">Botlar yükleniyor...</p>
            </div>
          ) : bots.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p>Henüz bot oluşturulmamış</p>
              <p className="text-xs mt-2">İlk botunuzu oluşturmak için yukarıdaki butonu kullanın</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bots.map((bot) => (
                <div
                  key={bot.id}
                  className={`bg-slate-900/50 rounded-lg p-6 border transition-all ${
                    bot.status === 'running'
                      ? 'border-emerald-500/50'
                      : 'border-slate-700/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">
                        {bot.status === 'running' ? '🟢' : bot.status === 'paused' ? '🟡' : '🔴'}
                      </div>
                      <div>
                        <div className="font-bold text-white text-xl">{bot.name}</div>
                        <div className="text-sm text-slate-400 mt-1">
                          Strateji: <span className="text-cyan-400">{bot.strategy}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Çalışma Süresi: {formatUptime(bot.uptime)}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {bot.status === 'running' ? (
                        <>
                          <button
                            onClick={() => toggleBot(bot.id, 'pause')}
                            className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded-lg hover:bg-yellow-500/30 transition-all text-sm"
                          >
                            ⏸️ Duraklat
                          </button>
                          <button
                            onClick={() => toggleBot(bot.id, 'stop')}
                            className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg hover:bg-red-500/30 transition-all text-sm"
                          >
                            ⏹️ Durdur
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => toggleBot(bot.id, 'start')}
                          className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg hover:bg-emerald-500/30 transition-all text-sm"
                        >
                          ▶️ Başlat
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-6 pt-4 border-t border-slate-700/50">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Kar/Zarar</div>
                      <div className={`text-lg font-bold ${
                        bot.profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {bot.profit >= 0 ? '+' : ''}${bot.profit.toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500 mb-1">İşlem Sayısı</div>
                      <div className="text-lg font-bold text-white">{bot.trades}</div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500 mb-1">Kazanma Oranı</div>
                      <div className="text-lg font-bold text-cyan-400">
                        {bot.winRate.toFixed(1)}%
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500 mb-1">Durum</div>
                      <div className={`text-lg font-bold ${
                        bot.status === 'running' ? 'text-emerald-400' :
                        bot.status === 'paused' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {bot.status === 'running' ? '✓ Çalışıyor' :
                         bot.status === 'paused' ? '⏸ Duraklatıldı' : '⏹ Durduruldu'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bot Strategies */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">📚 Mevcut Stratejiler</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-lg p-5 border border-blue-500/30">
              <div className="text-2xl mb-3">📈</div>
              <div className="font-bold text-white mb-2">Momentum Trading</div>
              <div className="text-sm text-slate-300 mb-3">
                RSI ve MACD göstergelerine dayalı trend takibi
              </div>
              <div className="text-xs text-blue-400">Orta risk • Yüksek frekans</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-lg p-5 border border-purple-500/30">
              <div className="text-2xl mb-3">🎯</div>
              <div className="font-bold text-white mb-2">Mean Reversion</div>
              <div className="text-sm text-slate-300 mb-3">
                Bollinger Bands ile aşırı alım/satım analizi
              </div>
              <div className="text-xs text-purple-400">Düşük risk • Orta frekans</div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-lg p-5 border border-emerald-500/30">
              <div className="text-2xl mb-3">🤖</div>
              <div className="font-bold text-white mb-2">AI Quantum Pro</div>
              <div className="text-sm text-slate-300 mb-3">
                LSTM + Transformer + XGBoost hibrit model
              </div>
              <div className="text-xs text-emerald-400">Yüksek risk • AI destekli</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/quantum-pro"
            className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all group"
          >
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
              AI Sinyaller
            </h3>
            <p className="text-slate-400 text-sm">
              Canlı AI sinyal akışı
            </p>
          </Link>

          <Link
            href="/backtesting"
            className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-xl rounded-xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-all group"
          >
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
              Strateji Testi
            </h3>
            <p className="text-slate-400 text-sm">
              Botlarınızı test edin
            </p>
          </Link>

          <Link
            href="/settings"
            className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 backdrop-blur-xl rounded-xl p-6 border border-orange-500/30 hover:border-orange-400/50 transition-all group"
          >
            <div className="text-4xl mb-4">⚙️</div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
              Ayarlar
            </h3>
            <p className="text-slate-400 text-sm">
              API ve bildirim ayarları
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}