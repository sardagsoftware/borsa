/**
 * PREFERENCES MODAL
 *
 * User settings modal for notification preferences
 * - Signal types (STRONG_BUY, BUY)
 * - Quiet hours
 * - Scanner settings
 * - Sound settings
 * - Mute coins
 */

'use client';

import { useState, useEffect } from 'react';
import {
  getPreferences,
  savePreferences,
  resetPreferences,
  type UserPreferences,
} from '@/lib/preferences';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PreferencesModal({ isOpen, onClose }: PreferencesModalProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(getPreferences());
  const [mutedCoinInput, setMutedCoinInput] = useState('');

  // Load preferences when modal opens
  useEffect(() => {
    if (isOpen) {
      setPreferences(getPreferences());
    }
  }, [isOpen]);

  // Save preferences (non-persistent - resets to default after modal closes)
  const handleSave = () => {
    // User requested that settings should NOT persist after saving
    // So we reset to defaults instead of saving
    resetPreferences();
    console.log('[Preferences] Settings applied for current session only (non-persistent)');
    onClose();
  };

  // Reset to defaults
  const handleReset = () => {
    if (confirm('Tüm ayarları sıfırlamak istediğinize emin misiniz?')) {
      resetPreferences();
      setPreferences(getPreferences());
    }
  };

  // Add muted coin
  const handleAddMutedCoin = () => {
    const symbol = mutedCoinInput.trim().toUpperCase();
    if (!symbol) return;

    // Add USDT if not present
    const fullSymbol = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;

    if (!preferences.notifications.mutedCoins.includes(fullSymbol)) {
      setPreferences({
        ...preferences,
        notifications: {
          ...preferences.notifications,
          mutedCoins: [...preferences.notifications.mutedCoins, fullSymbol],
        },
      });
    }

    setMutedCoinInput('');
  };

  // Remove muted coin
  const handleRemoveMutedCoin = (symbol: string) => {
    setPreferences({
      ...preferences,
      notifications: {
        ...preferences.notifications,
        mutedCoins: preferences.notifications.mutedCoins.filter((s) => s !== symbol),
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-2xl shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">⚙️ Ayarlar</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Notification Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">🔔 Bildirim Ayarları</h3>

            {/* Enable Notifications */}
            <label className="flex items-center justify-between p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors">
              <span className="text-gray-200">Bildirimleri Etkinleştir</span>
              <input
                type="checkbox"
                checked={preferences.notifications.enabled}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    notifications: {
                      ...preferences.notifications,
                      enabled: e.target.checked,
                    },
                  })
                }
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </label>

            {/* Signal Types */}
            <div className="p-4 bg-gray-800 rounded-lg space-y-3">
              <span className="text-gray-200 font-medium">Gösterilecek Sinyaller</span>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.notifications.signalTypes.includes('STRONG_BUY')}
                    onChange={(e) => {
                      const types = e.target.checked
                        ? [...preferences.notifications.signalTypes, 'STRONG_BUY']
                        : preferences.notifications.signalTypes.filter((t) => t !== 'STRONG_BUY');

                      setPreferences({
                        ...preferences,
                        notifications: {
                          ...preferences.notifications,
                          signalTypes: types as ('STRONG_BUY' | 'BUY')[],
                        },
                      });
                    }}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-gray-200">🚀 STRONG BUY (Güçlü Al)</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.notifications.signalTypes.includes('BUY')}
                    onChange={(e) => {
                      const types = e.target.checked
                        ? [...preferences.notifications.signalTypes, 'BUY']
                        : preferences.notifications.signalTypes.filter((t) => t !== 'BUY');

                      setPreferences({
                        ...preferences,
                        notifications: {
                          ...preferences.notifications,
                          signalTypes: types as ('STRONG_BUY' | 'BUY')[],
                        },
                      });
                    }}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-200">✅ BUY (Al)</span>
                </label>
              </div>
            </div>

            {/* Sound */}
            <label className="flex items-center justify-between p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors">
              <span className="text-gray-200">Ses Bildirimi</span>
              <input
                type="checkbox"
                checked={preferences.notifications.sound}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    notifications: {
                      ...preferences.notifications,
                      sound: e.target.checked,
                    },
                  })
                }
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </label>

            {/* Quiet Hours */}
            <div className="p-4 bg-gray-800 rounded-lg space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-200 font-medium">Sessiz Saatler</span>
                <input
                  type="checkbox"
                  checked={preferences.notifications.quietHours.enabled}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      notifications: {
                        ...preferences.notifications,
                        quietHours: {
                          ...preferences.notifications.quietHours,
                          enabled: e.target.checked,
                        },
                      },
                    })
                  }
                  className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </label>

              {preferences.notifications.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Başlangıç</label>
                    <input
                      type="time"
                      value={preferences.notifications.quietHours.start}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          notifications: {
                            ...preferences.notifications,
                            quietHours: {
                              ...preferences.notifications.quietHours,
                              start: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Bitiş</label>
                    <input
                      type="time"
                      value={preferences.notifications.quietHours.end}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          notifications: {
                            ...preferences.notifications,
                            quietHours: {
                              ...preferences.notifications.quietHours,
                              end: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Muted Coins */}
            <div className="p-4 bg-gray-800 rounded-lg space-y-3">
              <span className="text-gray-200 font-medium">Susturulmuş Koinler</span>

              {/* Add Coin */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Örn: BTC veya BTCUSDT"
                  value={mutedCoinInput}
                  onChange={(e) => setMutedCoinInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddMutedCoin();
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  onClick={handleAddMutedCoin}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Ekle
                </button>
              </div>

              {/* Muted Coins List */}
              {preferences.notifications.mutedCoins.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {preferences.notifications.mutedCoins.map((symbol) => (
                    <div
                      key={symbol}
                      className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-full"
                    >
                      <span className="text-sm text-gray-200">{symbol}</span>
                      <button
                        onClick={() => handleRemoveMutedCoin(symbol)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Susturulmuş koin yok</p>
              )}
            </div>
          </div>

          {/* Scanner Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">🔍 Scanner Ayarları</h3>

            {/* Scan Interval */}
            <div className="p-4 bg-gray-800 rounded-lg space-y-2">
              <label className="block text-gray-200 font-medium">
                Tarama Aralığı: {preferences.scanner.interval} dakika
              </label>
              <input
                type="range"
                min="1"
                max="60"
                step="1"
                value={preferences.scanner.interval}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    scanner: {
                      ...preferences.scanner,
                      interval: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <p className="text-sm text-gray-500">
                Her {preferences.scanner.interval} dakikada bir sinyal tarar
              </p>
            </div>

            {/* Scan Limit */}
            <div className="p-4 bg-gray-800 rounded-lg space-y-2">
              <label className="block text-gray-200 font-medium">
                Taranacak Koin Sayısı: {preferences.scanner.limit}
              </label>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={preferences.scanner.limit}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    scanner: {
                      ...preferences.scanner,
                      limit: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <p className="text-sm text-gray-500">
                En yüksek hacimli {preferences.scanner.limit} koini tarar
              </p>
            </div>
          </div>

          {/* Display Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">🎨 Görünüm Ayarları</h3>

            {/* Show Top Performers */}
            <label className="flex items-center justify-between p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors">
              <span className="text-gray-200">En İyi Performans Gösterenleri Göster</span>
              <input
                type="checkbox"
                checked={preferences.display.showTopPerformers}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    display: {
                      ...preferences.display,
                      showTopPerformers: e.target.checked,
                    },
                  })
                }
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </label>

            {/* Grid Size */}
            <div className="p-4 bg-gray-800 rounded-lg space-y-3">
              <span className="text-gray-200 font-medium">Kart Boyutu</span>
              <div className="grid grid-cols-3 gap-2">
                {(['compact', 'normal', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() =>
                      setPreferences({
                        ...preferences,
                        display: {
                          ...preferences.display,
                          gridSize: size,
                        },
                      })
                    }
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      preferences.display.gridSize === size
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {size === 'compact' ? 'Kompakt' : size === 'normal' ? 'Normal' : 'Büyük'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-gray-900 border-t border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Sıfırla
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
