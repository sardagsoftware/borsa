/**
 * SETTINGS PAGE
 * User preferences and configuration
 */

'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import {
  getUserPreferences,
  saveUserPreferences,
  updatePreference,
  resetPreferences,
  type UserPreferences,
} from '@/lib/storage/user-preferences';
import { getTheme, setTheme } from '@/lib/theme/theme-manager';

export default function SettingsPage() {
  const { t } = useI18n();
  const [prefs, setPrefs] = useState<UserPreferences>(getUserPreferences());
  const [saved, setSaved] = useState(false);

  const handleChange = (key: keyof UserPreferences, value: any) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    updatePreference(key, value);

    // Show saved message
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    // Handle theme change
    if (key === 'theme') {
      setTheme(value);
    }
  };

  const handleReset = () => {
    if (confirm('Reset all settings to defaults?')) {
      resetPreferences();
      setPrefs(getUserPreferences());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 pb-24 lg:pb-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('settings.title')}</h1>
          <p className="text-gray-400">Customize your trading experience</p>
        </div>
        {saved && (
          <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {t('common.success')}
          </div>
        )}
      </div>

      {/* Language */}
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">🌍 {t('settings.language')}</h2>
        <LanguageSwitcher />
      </div>

      {/* Theme */}
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">🎨 {t('settings.theme')}</h2>
        <div className="grid grid-cols-3 gap-4">
          {(['dark', 'light', 'auto'] as const).map((theme) => (
            <button
              key={theme}
              onClick={() => handleChange('theme', theme)}
              className={`p-4 rounded-lg border-2 transition-all touch-target ${
                prefs.theme === theme
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">
                  {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '🔄'}
                </div>
                <p className="text-sm font-medium">
                  {theme === 'dark' ? t('settings.theme_dark') :
                   theme === 'light' ? t('settings.theme_light') :
                   t('settings.theme_auto')}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Market Settings */}
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">📊 Market Settings</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Default Market Type</label>
            <select
              value={prefs.defaultMarketType}
              onChange={(e) => handleChange('defaultMarketType', e.target.value)}
              className="select w-full"
            >
              <option value="futures">Futures</option>
              <option value="spot">Spot</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Default Sort</label>
            <select
              value={prefs.defaultSort}
              onChange={(e) => handleChange('defaultSort', e.target.value)}
              className="select w-full"
            >
              <option value="7d">7d Change</option>
              <option value="24h">24h Change</option>
              <option value="volume">Volume</option>
              <option value="rank">Rank</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Default Timeframe</label>
            <select
              value={prefs.defaultTimeframe}
              onChange={(e) => handleChange('defaultTimeframe', e.target.value)}
              className="select w-full"
            >
              <option value="1h">1 Hour</option>
              <option value="4h">4 Hours</option>
              <option value="1d">1 Day</option>
              <option value="1w">1 Week</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">🔔 {t('settings.notifications')}</h2>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 cursor-pointer touch-target">
            <span className="font-medium">{t('settings.notifications_enabled')}</span>
            <input
              type="checkbox"
              checked={prefs.notificationsEnabled}
              onChange={(e) => handleChange('notificationsEnabled', e.target.checked)}
              className="w-5 h-5"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 cursor-pointer touch-target">
            <span className="font-medium">{t('settings.sound_enabled')}</span>
            <input
              type="checkbox"
              checked={prefs.soundEnabled}
              onChange={(e) => handleChange('soundEnabled', e.target.checked)}
              className="w-5 h-5"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 cursor-pointer touch-target">
            <span className="font-medium">Push Notifications</span>
            <input
              type="checkbox"
              checked={prefs.pushEnabled}
              onChange={(e) => handleChange('pushEnabled', e.target.checked)}
              className="w-5 h-5"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 cursor-pointer touch-target">
            <span className="font-medium">Email Notifications</span>
            <input
              type="checkbox"
              checked={prefs.emailEnabled}
              onChange={(e) => handleChange('emailEnabled', e.target.checked)}
              className="w-5 h-5"
            />
          </label>
        </div>
      </div>

      {/* Scanner Settings */}
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">🔍 Scanner Settings</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Scan Interval (minutes): {prefs.scanInterval}
            </label>
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={prefs.scanInterval}
              onChange={(e) => handleChange('scanInterval', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5 min</span>
              <span>120 min</span>
            </div>
          </div>

          <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 cursor-pointer touch-target">
            <span className="font-medium">Auto-Scan Enabled</span>
            <input
              type="checkbox"
              checked={prefs.autoScanEnabled}
              onChange={(e) => handleChange('autoScanEnabled', e.target.checked)}
              className="w-5 h-5"
            />
          </label>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Minimum Confidence: {prefs.minConfidence}%
            </label>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={prefs.minConfidence}
              onChange={(e) => handleChange('minConfidence', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>50%</span>
              <span>95%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Display Preferences */}
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">👁️ {t('settings.display')}</h2>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 cursor-pointer touch-target">
            <span className="font-medium">{t('settings.compact_view')}</span>
            <input
              type="checkbox"
              checked={prefs.compactView}
              onChange={(e) => handleChange('compactView', e.target.checked)}
              className="w-5 h-5"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 cursor-pointer touch-target">
            <span className="font-medium">{t('settings.show_traditional')}</span>
            <input
              type="checkbox"
              checked={prefs.showTraditionalMarkets}
              onChange={(e) => handleChange('showTraditionalMarkets', e.target.checked)}
              className="w-5 h-5"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 cursor-pointer touch-target">
            <span className="font-medium">Show Top 10 Only</span>
            <input
              type="checkbox"
              checked={prefs.showTop10}
              onChange={(e) => handleChange('showTop10', e.target.checked)}
              className="w-5 h-5"
            />
          </label>
        </div>
      </div>

      {/* Advanced Features */}
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">⚙️ {t('settings.advanced')}</h2>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 cursor-pointer touch-target">
            <div>
              <span className="font-medium block">{t('settings.enable_groq')}</span>
              <span className="text-xs text-gray-500">AI-enhanced signal confidence (+15%)</span>
            </div>
            <input
              type="checkbox"
              checked={prefs.enableGroqAI}
              onChange={(e) => handleChange('enableGroqAI', e.target.checked)}
              className="w-5 h-5"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 cursor-pointer touch-target">
            <div>
              <span className="font-medium block">{t('settings.enable_backtest')}</span>
              <span className="text-xs text-gray-500">Historical strategy performance</span>
            </div>
            <input
              type="checkbox"
              checked={prefs.enableBacktest}
              onChange={(e) => handleChange('enableBacktest', e.target.checked)}
              className="w-5 h-5"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 cursor-pointer touch-target">
            <div>
              <span className="font-medium block">{t('settings.enable_portfolio')}</span>
              <span className="text-xs text-gray-500">Track your trading positions</span>
            </div>
            <input
              type="checkbox"
              checked={prefs.enablePortfolio}
              onChange={(e) => handleChange('enablePortfolio', e.target.checked)}
              className="w-5 h-5"
            />
          </label>
        </div>
      </div>

      {/* Reset Button */}
      <div className="flex justify-center">
        <button
          onClick={handleReset}
          className="btn text-red-400 hover:bg-red-500/20 touch-target"
        >
          {t('common.reset')} to Defaults
        </button>
      </div>
    </div>
  );
}
