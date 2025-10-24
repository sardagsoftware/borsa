/**
 * PORTFOLIO PAGE
 * Track trading positions and P&L
 */

'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/hooks/useI18n';
import {
  getPortfolio,
  getPortfolioStats,
  addPosition,
  closePosition,
  deletePosition,
  type Position,
  type Portfolio,
} from '@/lib/portfolio/portfolio-manager';

export default function PortfolioPage() {
  const { t } = useI18n();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    symbol: '',
    side: 'LONG' as 'LONG' | 'SHORT',
    entryPrice: '',
    quantity: '',
    stopLoss: '',
    takeProfit: '',
    notes: '',
  });

  // Load portfolio
  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = () => {
    // Get current prices (would come from market data in real app)
    const currentPrices: Record<string, number> = {};
    const stats = getPortfolioStats(currentPrices);
    setPortfolio(stats);
  };

  const handleAddPosition = () => {
    if (!formData.symbol || !formData.entryPrice || !formData.quantity) {
      alert('Please fill required fields');
      return;
    }

    addPosition({
      symbol: formData.symbol.toUpperCase(),
      side: formData.side,
      entryPrice: parseFloat(formData.entryPrice),
      quantity: parseFloat(formData.quantity),
      stopLoss: formData.stopLoss ? parseFloat(formData.stopLoss) : undefined,
      takeProfit: formData.takeProfit ? parseFloat(formData.takeProfit) : undefined,
      notes: formData.notes || undefined,
    });

    // Reset form
    setFormData({
      symbol: '',
      side: 'LONG',
      entryPrice: '',
      quantity: '',
      stopLoss: '',
      takeProfit: '',
      notes: '',
    });
    setShowAddForm(false);
    loadPortfolio();
  };

  const handleClosePosition = (posId: string, exitPrice: string) => {
    const price = parseFloat(exitPrice);
    if (isNaN(price) || price <= 0) {
      alert('Invalid exit price');
      return;
    }

    closePosition(posId, price);
    loadPortfolio();
  };

  const handleDeletePosition = (posId: string) => {
    if (confirm('Are you sure you want to delete this position?')) {
      deletePosition(posId);
      loadPortfolio();
    }
  };

  if (!portfolio) {
    return (
      <div className="container mx-auto px-4 py-6 pb-24 lg:pb-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const openPositions = portfolio.positions.filter((p) => p.status === 'OPEN');
  const closedPositions = portfolio.positions.filter((p) => p.status === 'CLOSED');

  return (
    <div className="container mx-auto px-4 py-6 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('portfolio.title')}</h1>
          <p className="text-gray-400">
            {portfolio.openPositions} {t('portfolio.open_positions')} • {portfolio.closedPositions} {t('portfolio.closed_positions')}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary touch-target"
        >
          + {t('portfolio.add_position')}
        </button>
      </div>

      {/* Add Position Form */}
      {showAddForm && (
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">{t('portfolio.add_position')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Symbol *</label>
              <input
                type="text"
                placeholder="BTCUSDT"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">{t('portfolio.side')} *</label>
              <select
                value={formData.side}
                onChange={(e) => setFormData({ ...formData, side: e.target.value as 'LONG' | 'SHORT' })}
                className="select w-full"
              >
                <option value="LONG">LONG</option>
                <option value="SHORT">SHORT</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">{t('portfolio.entry_price')} *</label>
              <input
                type="number"
                step="0.01"
                placeholder="50000"
                value={formData.entryPrice}
                onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">{t('portfolio.quantity')} *</label>
              <input
                type="number"
                step="0.0001"
                placeholder="0.1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Stop Loss</label>
              <input
                type="number"
                step="0.01"
                placeholder="48000"
                value={formData.stopLoss}
                onChange={(e) => setFormData({ ...formData, stopLoss: e.target.value })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Take Profit</label>
              <input
                type="number"
                step="0.01"
                placeholder="55000"
                value={formData.takeProfit}
                onChange={(e) => setFormData({ ...formData, takeProfit: e.target.value })}
                className="input w-full"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Notes</label>
            <textarea
              placeholder="Trading notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input w-full"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <button onClick={handleAddPosition} className="btn btn-primary touch-target">
              {t('common.save')}
            </button>
            <button onClick={() => setShowAddForm(false)} className="btn touch-target">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Portfolio Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <p className="text-sm text-gray-400 mb-1">{t('portfolio.total_pnl')}</p>
          <p className={`text-2xl font-bold ${portfolio.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${portfolio.totalPnL.toFixed(2)}
          </p>
          <p className={`text-sm ${portfolio.totalPnLPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {portfolio.totalPnLPercent >= 0 ? '+' : ''}{portfolio.totalPnLPercent.toFixed(2)}%
          </p>
        </div>

        <div className="card p-4">
          <p className="text-sm text-gray-400 mb-1">{t('portfolio.win_rate')}</p>
          <p className="text-2xl font-bold text-blue-400">{portfolio.winRate.toFixed(1)}%</p>
          <p className="text-sm text-gray-400">
            {portfolio.winningTrades}W / {portfolio.losingTrades}L
          </p>
        </div>

        <div className="card p-4">
          <p className="text-sm text-gray-400 mb-1">Total Invested</p>
          <p className="text-2xl font-bold">${portfolio.totalInvested.toFixed(2)}</p>
        </div>

        <div className="card p-4">
          <p className="text-sm text-gray-400 mb-1">Current Value</p>
          <p className="text-2xl font-bold">${portfolio.currentValue.toFixed(2)}</p>
        </div>
      </div>

      {/* Open Positions */}
      {openPositions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">📈 {t('portfolio.open_positions')} ({openPositions.length})</h2>

          <div className="space-y-4">
            {openPositions.map((pos) => (
              <div key={pos.id} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-mono font-bold text-lg">{pos.symbol}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      pos.side === 'LONG' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {pos.side}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const exitPrice = prompt('Exit price:');
                      if (exitPrice) handleClosePosition(pos.id, exitPrice);
                    }}
                    className="btn btn-success text-sm touch-target"
                  >
                    {t('portfolio.close_position')}
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">{t('portfolio.entry_price')}</p>
                    <p className="font-mono">${pos.entryPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">{t('portfolio.quantity')}</p>
                    <p className="font-mono">{pos.quantity}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Unrealized P&L</p>
                    <p className={`font-mono font-bold ${(pos.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${(pos.pnl || 0).toFixed(2)} ({(pos.pnlPercent || 0) >= 0 ? '+' : ''}{(pos.pnlPercent || 0).toFixed(2)}%)
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Date</p>
                    <p className="text-xs">{new Date(pos.entryDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {pos.notes && (
                  <p className="mt-3 text-sm text-gray-400 italic">"{pos.notes}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Closed Positions */}
      {closedPositions.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">📊 {t('portfolio.closed_positions')} ({closedPositions.length})</h2>

          <div className="space-y-4">
            {closedPositions.map((pos) => (
              <div key={pos.id} className="card p-4 opacity-75">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-mono font-bold">{pos.symbol}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      pos.side === 'LONG' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {pos.side}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      (pos.pnl || 0) >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {(pos.pnl || 0) >= 0 ? '✅ WIN' : '❌ LOSS'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeletePosition(pos.id)}
                    className="text-red-400 hover:text-red-300 text-sm touch-target"
                  >
                    {t('common.delete')}
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Entry</p>
                    <p className="font-mono">${pos.entryPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Exit</p>
                    <p className="font-mono">${(pos.exitPrice || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Quantity</p>
                    <p className="font-mono">{pos.quantity}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">P&L</p>
                    <p className={`font-mono font-bold ${(pos.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${(pos.pnl || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Return</p>
                    <p className={`font-mono font-bold ${(pos.pnlPercent || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {(pos.pnlPercent || 0) >= 0 ? '+' : ''}{(pos.pnlPercent || 0).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {portfolio.positions.length === 0 && (
        <div className="card p-8 text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-400 mb-4">No positions yet</p>
          <button onClick={() => setShowAddForm(true)} className="btn btn-primary touch-target">
            + {t('portfolio.add_position')}
          </button>
        </div>
      )}
    </div>
  );
}
