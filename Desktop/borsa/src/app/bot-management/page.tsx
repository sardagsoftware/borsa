'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { coinMarketCapService, CoinData } from '@/services/CoinMarketCapService';
import { emitSignalNotification } from '@/components/SignalNotification';

interface Bot {
  id: string;
  name: string;
  strategy: string;
  status: 'running' | 'stopped' | 'paused';
  profit: number;
  trades: number;
  winRate: number;
  uptime: number;
  config?: BotConfig;
}

interface BotConfig {
  indicators: string[];
  timeframe: string;
  riskLevel: 'low' | 'medium' | 'high';
  stopLoss: number;
  takeProfit: number;
  symbol: string;
  exchange: string;
}

interface BotStats {
  totalBots: number;
  activeBots: number;
  totalProfit: number;
  totalTrades: number;
}

const INDICATORS = [
  { id: 'RSI', name: 'RSI (Relative Strength Index)', description: 'Momentum göstergesi' },
  { id: 'MACD', name: 'MACD', description: 'Trend takip göstergesi' },
  { id: 'EMA', name: 'EMA (Exponential Moving Average)', description: 'Hareketli ortalama' },
  { id: 'SMA', name: 'SMA (Simple Moving Average)', description: 'Basit hareketli ortalama' },
  { id: 'BB', name: 'Bollinger Bands', description: 'Volatilite göstergesi' },
  { id: 'ATR', name: 'ATR (Average True Range)', description: 'Volatilite ölçümü' },
  { id: 'STOCH', name: 'Stochastic Oscillator', description: 'Momentum göstergesi' },
  { id: 'ADX', name: 'ADX (Average Directional Index)', description: 'Trend gücü' }
];

const TIMEFRAMES = [
  { value: '1m', label: '1 Dakika', description: 'Scalping için ideal' },
  { value: '5m', label: '5 Dakika', description: 'Hızlı işlemler' },
  { value: '15m', label: '15 Dakika', description: 'Kısa vadeli' },
  { value: '30m', label: '30 Dakika', description: 'Orta vadeli' },
  { value: '1h', label: '1 Saat', description: 'Swing trading' },
  { value: '4h', label: '4 Saat', description: 'Günlük analiz' },
  { value: '1d', label: '1 Gün', description: 'Uzun vadeli' }
];

const EXCHANGES = [
  { id: 'binance', name: 'Binance', volume: '76B' },
  { id: 'coinbase', name: 'Coinbase', volume: '14B' },
  { id: 'kraken', name: 'Kraken', volume: '8B' },
  { id: 'bybit', name: 'Bybit', volume: '45B' },
  { id: 'okx', name: 'OKX', volume: '32B' },
  { id: 'huobi', name: 'Huobi', volume: '12B' },
  { id: 'kucoin', name: 'KuCoin', volume: '9B' },
  { id: 'gateio', name: 'Gate.io', volume: '7.5B' },
  { id: 'bitfinex', name: 'Bitfinex', volume: '5B' },
  { id: 'mexc', name: 'MEXC', volume: '6B' }
];

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
  const [topCoins, setTopCoins] = useState<CoinData[]>([]);
  const [loadingCoins, setLoadingCoins] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    strategy: 'Custom',
    symbol: 'BTCUSDT',
    interval: '5m',
    indicators: [] as string[],
    riskLevel: 'medium' as 'low' | 'medium' | 'high',
    stopLoss: 2,
    takeProfit: 5,
    exchange: 'binance'
  });

  useEffect(() => {
    fetchBots();
    fetchTopCoins();
    const interval = setInterval(fetchBots, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchTopCoins = async () => {
    try {
      const result = await coinMarketCapService.getTopNCoins(50);
      setTopCoins(result);
    } catch (error) {
      console.error('Top coins fetch error:', error);
    } finally {
      setLoadingCoins(false);
    }
  };

  const toggleIndicator = (indicatorId: string) => {
    setFormData(prev => ({
      ...prev,
      indicators: prev.indicators.includes(indicatorId)
        ? prev.indicators.filter(id => id !== indicatorId)
        : [...prev.indicators, indicatorId]
    }));
  };

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

    if (formData.indicators.length === 0) {
      alert('En az bir gösterge seçin');
      return;
    }

    setCreating(true);
    try {
      const botConfig: BotConfig = {
        indicators: formData.indicators,
        timeframe: formData.interval,
        riskLevel: formData.riskLevel,
        stopLoss: formData.stopLoss,
        takeProfit: formData.takeProfit,
        symbol: formData.symbol,
        exchange: formData.exchange
      };

      const response = await fetch('/api/quantum-pro/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          config: botConfig
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Bot başarıyla oluşturuldu ve aktif edildi!');

        // Emit notification for bot creation
        emitSignalNotification({
          id: `bot-created-${Date.now()}`,
          botName: formData.name,
          botRoute: '/bot-management',
          symbol: formData.symbol,
          action: 'BUY',
          confidence: 85,
          price: 0,
          timestamp: new Date(),
          reasoning: [
            `Yeni bot oluşturuldu: ${formData.indicators.join(', ')} göstergeleri ile`,
            `Risk seviyesi: ${formData.riskLevel.toUpperCase()}`,
            `Stop Loss: ${formData.stopLoss}% | Take Profit: ${formData.takeProfit}%`
          ]
        });

        setShowCreateModal(false);
        setFormData({
          name: '',
          strategy: 'Custom',
          symbol: 'BTCUSDT',
          interval: '5m',
          indicators: [],
          riskLevel: 'medium',
          stopLoss: 2,
          takeProfit: 5,
          exchange: 'binance'
        });
        fetchBots();
      } else {
        alert('❌ Hata: ' + data.error);
      }
    } catch (error) {
      console.error('Bot creation error:', error);
      alert('❌ Bot oluşturulurken hata oluştu');
    } finally {
      setCreating(false);
    }
  };

  const deleteBot = async (botId: string) => {
    if (!confirm('Bu botu silmek istediğinizden emin misiniz?')) return;

    try {
      await fetch('/api/quantum-pro/bots', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId })
      });
      fetchBots();
    } catch (error) {
      console.error('Bot delete error:', error);
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
                      <button
                        onClick={() => deleteBot(bot.id)}
                        className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg hover:bg-red-500/40 transition-all text-sm"
                        title="Botu sil"
                      >
                        🗑️ Sil
                      </button>
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

      {/* Enhanced Create Bot Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-emerald-500/30 p-8 max-w-4xl w-full my-8 shadow-2xl shadow-emerald-500/10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  🤖 Özel Bot Oluştur
                </h2>
                <p className="text-slate-400 text-sm mt-1">Kendi trading stratejinizi yapılandırın</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white transition-colors text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {/* Bot Name */}
              <div>
                <label className="block text-emerald-300 text-sm font-semibold mb-2">Bot Adı *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Örn: BTC Quantum Pro v2"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Symbol Selection from CoinMarketCap */}
              <div>
                <label className="block text-emerald-300 text-sm font-semibold mb-2">Trading Çifti *</label>
                <select
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Seçin...</option>
                  {loadingCoins ? (
                    <option disabled>Yükleniyor...</option>
                  ) : (
                    topCoins.map(coin => (
                      <option key={coin.symbol} value={`${coin.symbol}USDT`}>
                        {coin.symbol}/USDT - #{coin.rank} {coin.name} (${coin.price.toFixed(2)})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Exchange Selection */}
              <div>
                <label className="block text-emerald-300 text-sm font-semibold mb-2">Borsa Seçimi *</label>
                <div className="grid grid-cols-5 gap-2">
                  {EXCHANGES.map(exchange => (
                    <button
                      key={exchange.id}
                      onClick={() => setFormData({ ...formData, exchange: exchange.id })}
                      className={`px-3 py-2 rounded-lg border-2 transition-all text-xs font-semibold ${
                        formData.exchange === exchange.id
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {exchange.name}
                      <div className="text-[10px] text-slate-500">{exchange.volume}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Technical Indicators */}
              <div>
                <label className="block text-emerald-300 text-sm font-semibold mb-2">
                  Teknik Göstergeler * (En az 1 seçin)
                </label>
                <div className="grid md:grid-cols-2 gap-3">
                  {INDICATORS.map(indicator => (
                    <button
                      key={indicator.id}
                      onClick={() => toggleIndicator(indicator.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        formData.indicators.includes(indicator.id)
                          ? 'bg-emerald-500/20 border-emerald-500'
                          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-bold ${
                          formData.indicators.includes(indicator.id) ? 'text-emerald-300' : 'text-white'
                        }`}>
                          {indicator.name}
                        </span>
                        {formData.indicators.includes(indicator.id) && (
                          <span className="text-emerald-400">✓</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{indicator.description}</p>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Seçilen: {formData.indicators.length} gösterge
                </p>
              </div>

              {/* Timeframe Selection */}
              <div>
                <label className="block text-emerald-300 text-sm font-semibold mb-2">Zaman Dilimi *</label>
                <div className="grid grid-cols-7 gap-2">
                  {TIMEFRAMES.map(tf => (
                    <button
                      key={tf.value}
                      onClick={() => setFormData({ ...formData, interval: tf.value })}
                      className={`px-3 py-3 rounded-lg border-2 transition-all ${
                        formData.interval === tf.value
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <div className="font-bold text-sm">{tf.label}</div>
                      <div className="text-[10px] text-slate-500">{tf.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Risk Level */}
              <div>
                <label className="block text-emerald-300 text-sm font-semibold mb-2">Risk Seviyesi *</label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setFormData({ ...formData, riskLevel: 'low' })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.riskLevel === 'low'
                        ? 'bg-green-500/20 border-green-500'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-2xl mb-2">🛡️</div>
                    <div className={`font-bold ${formData.riskLevel === 'low' ? 'text-green-300' : 'text-white'}`}>
                      Düşük Risk
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Muhafazakar • Küçük pozisyonlar</p>
                  </button>

                  <button
                    onClick={() => setFormData({ ...formData, riskLevel: 'medium' })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.riskLevel === 'medium'
                        ? 'bg-yellow-500/20 border-yellow-500'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-2xl mb-2">⚖️</div>
                    <div className={`font-bold ${formData.riskLevel === 'medium' ? 'text-yellow-300' : 'text-white'}`}>
                      Orta Risk
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Dengeli • Standart pozisyonlar</p>
                  </button>

                  <button
                    onClick={() => setFormData({ ...formData, riskLevel: 'high' })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.riskLevel === 'high'
                        ? 'bg-red-500/20 border-red-500'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-2xl mb-2">🚀</div>
                    <div className={`font-bold ${formData.riskLevel === 'high' ? 'text-red-300' : 'text-white'}`}>
                      Yüksek Risk
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Agresif • Büyük pozisyonlar</p>
                  </button>
                </div>
              </div>

              {/* Stop Loss & Take Profit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-emerald-300 text-sm font-semibold mb-2">Stop Loss % *</label>
                  <input
                    type="number"
                    min="0.1"
                    max="50"
                    step="0.1"
                    value={formData.stopLoss}
                    onChange={(e) => setFormData({ ...formData, stopLoss: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Zarar durdurma yüzdesi</p>
                </div>

                <div>
                  <label className="block text-emerald-300 text-sm font-semibold mb-2">Take Profit % *</label>
                  <input
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={formData.takeProfit}
                    onChange={(e) => setFormData({ ...formData, takeProfit: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Kar alma yüzdesi</p>
                </div>
              </div>

              {/* Configuration Summary */}
              <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-lg p-4">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  📋 Yapılandırma Özeti
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-slate-400">Bot Adı:</div>
                  <div className="text-white font-semibold">{formData.name || '-'}</div>

                  <div className="text-slate-400">Trading Çifti:</div>
                  <div className="text-white font-semibold">{formData.symbol || '-'}</div>

                  <div className="text-slate-400">Borsa:</div>
                  <div className="text-white font-semibold">{formData.exchange.toUpperCase()}</div>

                  <div className="text-slate-400">Göstergeler:</div>
                  <div className="text-white font-semibold">{formData.indicators.join(', ') || 'Seçilmedi'}</div>

                  <div className="text-slate-400">Zaman Dilimi:</div>
                  <div className="text-white font-semibold">{formData.interval}</div>

                  <div className="text-slate-400">Risk Seviyesi:</div>
                  <div className="text-white font-semibold">{formData.riskLevel.toUpperCase()}</div>

                  <div className="text-slate-400">Stop Loss / Take Profit:</div>
                  <div className="text-white font-semibold">{formData.stopLoss}% / {formData.takeProfit}%</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="flex-1 px-6 py-4 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 transition-all font-semibold disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  onClick={handleCreateBot}
                  disabled={creating || !formData.name || formData.indicators.length === 0}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                >
                  {creating ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Oluşturuluyor...
                    </span>
                  ) : (
                    '🚀 Bot Oluştur ve Aktif Et'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}