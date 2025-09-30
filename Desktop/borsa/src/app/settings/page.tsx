'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'api' | 'notifications' | 'trading' | 'security'>('api');
  const [saved, setSaved] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    binance: { key: '', secret: '', enabled: false },
    coinbase: { key: '', secret: '', enabled: false },
    kraken: { key: '', secret: '', enabled: false }
  });

  const [notifications, setNotifications] = useState({
    email: true,
    telegram: false,
    discord: false,
    signals: true,
    trades: true,
    risks: true
  });

  const [tradingSettings, setTradingSettings] = useState({
    autoTrade: false,
    maxPositionSize: 10,
    dailyLossLimit: 5,
    minConfidence: 75,
    useStopLoss: true,
    useTakeProfit: true
  });

  const handleSave = async () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    // API call to save settings
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-5xl">⚙️</span>
            <h1 className="text-4xl font-bold text-white">Ayarlar</h1>
          </div>
          <p className="text-slate-300">
            Platform ayarlarınızı yönetin ve trading botlarınızı yapılandırın
          </p>
        </div>

        {/* Save Notification */}
        {saved && (
          <div className="bg-emerald-500/20 backdrop-blur-xl rounded-xl p-4 border border-emerald-500/30 mb-6 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <span className="text-emerald-300 font-medium">Ayarlar başarıyla kaydedildi!</span>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-2 border border-slate-700/50 mb-8">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('api')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'api'
                  ? 'bg-orange-500/30 text-orange-300 border border-orange-500/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🔑 API Anahtarları
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'notifications'
                  ? 'bg-orange-500/30 text-orange-300 border border-orange-500/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🔔 Bildirimler
            </button>
            <button
              onClick={() => setActiveTab('trading')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'trading'
                  ? 'bg-orange-500/30 text-orange-300 border border-orange-500/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📈 Trading Ayarları
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'security'
                  ? 'bg-orange-500/30 text-orange-300 border border-orange-500/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🛡️ Güvenlik
            </button>
          </div>
        </div>

        {/* API Keys Tab */}
        {activeTab === 'api' && (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">🔑 Exchange API Anahtarları</h2>
            <div className="space-y-6">
              {/* Binance */}
              <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🟡</span>
                    <h3 className="text-xl font-bold text-white">Binance</h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={apiKeys.binance.enabled}
                      onChange={(e) => setApiKeys({
                        ...apiKeys,
                        binance: { ...apiKeys.binance, enabled: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 text-sm mb-2">API Key</label>
                    <input
                      type="text"
                      value={apiKeys.binance.key}
                      onChange={(e) => setApiKeys({
                        ...apiKeys,
                        binance: { ...apiKeys.binance, key: e.target.value }
                      })}
                      placeholder="API anahtarınızı girin"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm mb-2">API Secret</label>
                    <input
                      type="password"
                      value={apiKeys.binance.secret}
                      onChange={(e) => setApiKeys({
                        ...apiKeys,
                        binance: { ...apiKeys.binance, secret: e.target.value }
                      })}
                      placeholder="API secret'ınızı girin"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Coinbase */}
              <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔵</span>
                    <h3 className="text-xl font-bold text-white">Coinbase</h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={apiKeys.coinbase.enabled}
                      onChange={(e) => setApiKeys({
                        ...apiKeys,
                        coinbase: { ...apiKeys.coinbase, enabled: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 text-sm mb-2">API Key</label>
                    <input
                      type="text"
                      value={apiKeys.coinbase.key}
                      onChange={(e) => setApiKeys({
                        ...apiKeys,
                        coinbase: { ...apiKeys.coinbase, key: e.target.value }
                      })}
                      placeholder="API anahtarınızı girin"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm mb-2">API Secret</label>
                    <input
                      type="password"
                      value={apiKeys.coinbase.secret}
                      onChange={(e) => setApiKeys({
                        ...apiKeys,
                        coinbase: { ...apiKeys.coinbase, secret: e.target.value }
                      })}
                      placeholder="API secret'ınızı girin"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">🔔 Bildirim Tercihleri</h2>

            <div className="space-y-6">
              <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700/30">
                <h3 className="text-lg font-bold text-white mb-4">Bildirim Kanalları</h3>
                <div className="space-y-4">
                  {Object.entries({
                    email: { label: 'E-posta', icon: '📧' },
                    telegram: { label: 'Telegram', icon: '✈️' },
                    discord: { label: 'Discord', icon: '💬' }
                  }).map(([key, { label, icon }]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{icon}</span>
                        <span className="text-white font-medium">{label}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications[key as keyof typeof notifications]}
                          onChange={(e) => setNotifications({
                            ...notifications,
                            [key]: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700/30">
                <h3 className="text-lg font-bold text-white mb-4">Bildirim Türleri</h3>
                <div className="space-y-4">
                  {Object.entries({
                    signals: { label: 'Yeni AI Sinyalleri', icon: '📡' },
                    trades: { label: 'İşlem Bildirimleri', icon: '💰' },
                    risks: { label: 'Risk Uyarıları', icon: '⚠️' }
                  }).map(([key, { label, icon }]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{icon}</span>
                        <span className="text-white font-medium">{label}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications[key as keyof typeof notifications]}
                          onChange={(e) => setNotifications({
                            ...notifications,
                            [key]: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trading Settings Tab */}
        {activeTab === 'trading' && (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">📈 Trading Ayarları</h2>

            <div className="space-y-6">
              <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700/30">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Otomatik Trading</h3>
                    <p className="text-sm text-slate-400 mt-1">
                      AI sinyallerini otomatik olarak gerçekleştir
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tradingSettings.autoTrade}
                      onChange={(e) => setTradingSettings({
                        ...tradingSettings,
                        autoTrade: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700/30 space-y-6">
                <div>
                  <label className="block text-white font-medium mb-2">
                    Maksimum Pozisyon Büyüklüğü: {tradingSettings.maxPositionSize}%
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={tradingSettings.maxPositionSize}
                    onChange={(e) => setTradingSettings({
                      ...tradingSettings,
                      maxPositionSize: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                  <div className="text-xs text-slate-400 mt-1">
                    Portföyün maksimum %{tradingSettings.maxPositionSize}'i tek işlemde kullanılabilir
                  </div>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    Günlük Kayıp Limiti: {tradingSettings.dailyLossLimit}%
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={tradingSettings.dailyLossLimit}
                    onChange={(e) => setTradingSettings({
                      ...tradingSettings,
                      dailyLossLimit: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                  <div className="text-xs text-slate-400 mt-1">
                    Günlük kayıp %{tradingSettings.dailyLossLimit}'e ulaştığında trading durdurulur
                  </div>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    Minimum Güven Seviyesi: {tradingSettings.minConfidence}%
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={tradingSettings.minConfidence}
                    onChange={(e) => setTradingSettings({
                      ...tradingSettings,
                      minConfidence: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                  <div className="text-xs text-slate-400 mt-1">
                    Sadece %{tradingSettings.minConfidence} ve üzeri güven seviyeli sinyaller kullanılır
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700/30">
                <h3 className="text-lg font-bold text-white mb-4">Risk Yönetimi</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                    <div>
                      <span className="text-white font-medium">Stop Loss Kullan</span>
                      <p className="text-xs text-slate-400 mt-1">Otomatik zarar durdurma</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tradingSettings.useStopLoss}
                        onChange={(e) => setTradingSettings({
                          ...tradingSettings,
                          useStopLoss: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                    <div>
                      <span className="text-white font-medium">Take Profit Kullan</span>
                      <p className="text-xs text-slate-400 mt-1">Otomatik kar al</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tradingSettings.useTakeProfit}
                        onChange={(e) => setTradingSettings({
                          ...tradingSettings,
                          useTakeProfit: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">🛡️ Güvenlik</h2>

            <div className="space-y-6">
              <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700/30">
                <h3 className="text-lg font-bold text-white mb-4">İki Faktörlü Doğrulama (2FA)</h3>
                <button className="px-6 py-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg hover:bg-emerald-500/30 transition-all">
                  2FA'yı Etkinleştir
                </button>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700/30">
                <h3 className="text-lg font-bold text-white mb-4">Şifre Değiştir</h3>
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="Mevcut şifre"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                  />
                  <input
                    type="password"
                    placeholder="Yeni şifre"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                  />
                  <input
                    type="password"
                    placeholder="Yeni şifre (tekrar)"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                  />
                  <button className="px-6 py-3 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-all">
                    Şifreyi Güncelle
                  </button>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                <h3 className="text-lg font-bold text-red-400 mb-2">Tehlikeli Bölge</h3>
                <p className="text-sm text-slate-300 mb-4">
                  Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecektir.
                </p>
                <button className="px-6 py-3 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg hover:bg-red-500/30 transition-all">
                  Hesabı Sil
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all"
          >
            💾 Ayarları Kaydet
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Link
            href="/quantum-pro"
            className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all group"
          >
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
              Quantum Pro AI
            </h3>
            <p className="text-slate-400 text-sm">
              Ana AI trading paneli
            </p>
          </Link>

          <Link
            href="/bot-management"
            className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-xl rounded-xl p-6 border border-emerald-500/30 hover:border-emerald-400/50 transition-all group"
          >
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
              Bot Yönetimi
            </h3>
            <p className="text-slate-400 text-sm">
              Botları başlat/durdur
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
              Portföy güvenliği
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}