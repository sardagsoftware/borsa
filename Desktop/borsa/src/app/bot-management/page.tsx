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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    strategy: 'Scalping',
    symbol: 'BTCUSDT',
    interval: '5m'
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

  const handleCreateBot = async () => {
    if (!formData.name.trim()) {
      alert('Lütfen bot adı girin');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/quantum-pro/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        alert('Bot başarıyla oluşturuldu!');
        setShowCreateModal(false);
        setFormData({
          name: '',
          strategy: 'Scalping',
          symbol: 'BTCUSDT',
          interval: '5m'
        });
        fetchBots();
      } else {
        alert('Hata: ' + data.error);
      }
    } catch (error) {
      console.error('Bot creation error:', error);
      alert('Bot oluşturulurken hata oluştu');
    } finally {
      setCreating(false);
    }
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
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-yellow-500/30 border border-yellow-500/50 text-yellow-300 rounded-lg hover:bg-yellow-500/40 transition-all font-bold"
            >
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

      {/* Create Bot Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 p-8 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">🤖 Yeni Bot Oluştur</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm mb-2">Bot Adı</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Örn: BTC Scalper Pro"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">Strateji</label>
                <select
                  value={formData.strategy}
                  onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                >
                  <option value="Scalping">Scalping</option>
                  <option value="Swing Trading">Swing Trading</option>
                  <option value="Grid Trading">Grid Trading</option>
                  <option value="DCA">DCA (Dollar Cost Averaging)</option>
                  <option value="Arbitrage">Arbitrage</option>
                  <option value="Market Making">Market Making</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm mb-2">Sembol</label>
                  <select
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  >
                    <option value="BTCUSDT">BTC/USDT</option>
                    <option value="ETHUSDT">ETH/USDT</option>
                    <option value="BNBUSDT">BNB/USDT</option>
                    <option value="SOLUSDT">SOL/USDT</option>
                    <option value="ADAUSDT">ADA/USDT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm mb-2">Zaman Aralığı</label>
                  <select
                    value={formData.interval}
                    onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  >
                    <option value="1m">1 Dakika</option>
                    <option value="5m">5 Dakika</option>
                    <option value="15m">15 Dakika</option>
                    <option value="1h">1 Saat</option>
                    <option value="4h">4 Saat</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 transition-all"
                >
                  İptal
                </button>
                <button
                  onClick={handleCreateBot}
                  disabled={creating}
                  className="flex-1 px-6 py-3 bg-yellow-500 border border-yellow-600 text-slate-900 rounded-lg hover:bg-yellow-400 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Oluşturuluyor...' : 'Bot Oluştur'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}