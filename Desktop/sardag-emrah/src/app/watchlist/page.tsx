/**
 * WATCHLIST PAGE
 * User's favorite coins and price alerts
 */

'use client';

import { useEffect, useState } from 'react';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useI18n } from '@/hooks/useI18n';
import WatchlistButton from '@/components/watchlist/WatchlistButton';

export default function WatchlistPage() {
  const { t } = useI18n();
  const { watchlist, activeAlerts, removeCoin, addAlert, removeAlert } = useWatchlist();
  const [showAddAlert, setShowAddAlert] = useState<string | null>(null);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertType, setAlertType] = useState<'ABOVE' | 'BELOW'>('ABOVE');

  const coins = watchlist.coins;

  const handleAddAlert = (symbol: string) => {
    const price = parseFloat(alertPrice);
    if (!isNaN(price) && price > 0) {
      addAlert(symbol, price, alertType);
      setShowAddAlert(null);
      setAlertPrice('');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 pb-24 lg:pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{t('watchlist.title')}</h1>
        <p className="text-gray-400">
          {coins.length} {t('common.search')} • {activeAlerts.length} {t('watchlist.alert')}
        </p>
      </div>

      {/* Coins List */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">📌 {t('watchlist.title')}</h2>

        {coins.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="text-6xl mb-4">⭐</div>
            <p className="text-gray-400 mb-4">{t('watchlist.empty')}</p>
            <p className="text-sm text-gray-500">
              {t('market.title')} sayfasında coin card'ların üstündeki yıldız ikonuna tıklayarak ekleyebilirsiniz
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coins.map((item) => (
              <div
                key={item.symbol}
                className="card p-4 hover:bg-white/5 transition-colors"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <WatchlistButton symbol={item.symbol} size="sm" />
                    <h3 className="font-mono font-bold text-lg">
                      {item.symbol.replace('USDT', '')}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowAddAlert(showAddAlert === item.symbol ? null : item.symbol)}
                    className="px-3 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm transition-colors touch-target"
                  >
                    + {t('watchlist.alert')}
                  </button>
                </div>

                {/* Add Alert Form */}
                {showAddAlert === item.symbol && (
                  <div className="mb-3 p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex gap-2 mb-2">
                      <input
                        type="number"
                        placeholder="Price"
                        value={alertPrice}
                        onChange={(e) => setAlertPrice(e.target.value)}
                        className="flex-1 input"
                      />
                      <select
                        value={alertType}
                        onChange={(e) => setAlertType(e.target.value as 'ABOVE' | 'BELOW')}
                        className="select"
                      >
                        <option value="ABOVE">{t('watchlist.alert_above')}</option>
                        <option value="BELOW">{t('watchlist.alert_below')}</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddAlert(item.symbol)}
                        className="btn btn-primary flex-1 touch-target"
                      >
                        {t('common.save')}
                      </button>
                      <button
                        onClick={() => setShowAddAlert(null)}
                        className="btn touch-target"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="text-sm text-gray-400">
                  {item.notes && (
                    <p className="mb-2 italic">"{item.notes}"</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Added: {new Date(item.addedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">🔔 {t('watchlist.alert')} ({activeAlerts.length})</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="card p-4 border-l-4 border-blue-500"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-mono font-bold">
                    {alert.symbol.replace('USDT', '')}
                  </h3>
                  <button
                    onClick={() => removeAlert(alert.id)}
                    className="text-red-400 hover:text-red-300 text-sm touch-target"
                  >
                    {t('common.delete')}
                  </button>
                </div>

                <div className="text-sm">
                  <p className="text-gray-400 mb-1">
                    ${alert.targetPrice.toLocaleString()} {alert.type === 'ABOVE' ? '⬆️' : '⬇️'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
