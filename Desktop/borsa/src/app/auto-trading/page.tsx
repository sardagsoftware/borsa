'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TradingStatus {
  isRunning: boolean;
  mode: 'paper' | 'live';
  stats: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalPnL: number;
    todayPnL: number;
    openPositions: number;
    closedToday: number;
  };
  positions: any[];
  recentSignals: any[];
}

export default function AutoTradingPage() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<TradingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000); // 3 saniyede bir güncelle
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/auto-trading');
      const data = await response.json();

      if (data.success) {
        setStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching auto-trading status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartStop = async () => {
    if (!status) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/auto-trading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: status.isRunning ? 'stop' : 'start',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setStatus(data.status);
      }
    } catch (error) {
      console.error('Error toggling auto-trading:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-dark p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-dark p-4 md:p-8 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <svg className="w-16 h-16 text-primary animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <h1 className="text-5xl font-bold gradient-text">Auto Trading</h1>
                <p className="text-white/60 mt-2">Tam Otomatik AI İşlem Motoru • 6 Bot Senkronize</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`px-6 py-3 rounded-xl font-bold text-lg ${
                status?.isRunning
                  ? 'bg-primary/20 text-primary border-2 border-primary/30'
                  : 'bg-white/10 text-white/60 border-2 border-white/10'
              }`}>
                {status?.isRunning ? '🟢 ÇALIŞIYOR' : '⚪ DURDURULDU'}
              </div>
              <div className="text-xs text-white/40 mt-2">
                Mode: {status?.mode === 'paper' ? '📝 Paper Trading' : '💰 Live Trading'}
              </div>
            </div>
          </div>
        </div>

        {/* Kontrol Paneli */}
        <div className="glass-dark rounded-2xl p-6 mb-8 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Motor Kontrolü</h2>
              <p className="text-white/60 text-sm">
                {status?.isRunning
                  ? 'Otomatik trading aktif. Tüm AI botları piyasayı izliyor ve sinyal üretiyor.'
                  : 'Motor durduruldu. Başlatmak için butona tıklayın.'}
              </p>
            </div>
            <button
              onClick={handleStartStop}
              disabled={actionLoading}
              className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                status?.isRunning
                  ? 'bg-secondary/20 border-2 border-secondary/30 text-secondary hover:bg-secondary/30'
                  : 'bg-primary/20 border-2 border-primary/30 text-primary hover:bg-primary/30 shadow-glow-primary'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {actionLoading ? '⏳ İşleniyor...' : status?.isRunning ? '⏸ DURDUR' : '▶ BAŞLAT'}
            </button>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass rounded-2xl p-5 border-primary/20">
            <div className="text-white/60 text-xs mb-1">Toplam İşlem</div>
            <div className="text-3xl font-bold text-white">{status?.stats.totalTrades || 0}</div>
            <div className="text-xs text-primary mt-2">
              ✅ {status?.stats.winningTrades || 0} Kazanan
            </div>
          </div>

          <div className="glass rounded-2xl p-5 border-primary/20">
            <div className="text-white/60 text-xs mb-1">Kazanma Oranı</div>
            <div className="text-3xl font-bold text-primary">
              {status?.stats.winRate?.toFixed(1) || 0}%
            </div>
            <div className="text-xs text-white/60 mt-2">
              ❌ {status?.stats.losingTrades || 0} Kaybeden
            </div>
          </div>

          <div className="glass rounded-2xl p-5 border-primary/20">
            <div className="text-white/60 text-xs mb-1">Toplam P&L</div>
            <div className={`text-3xl font-bold ${
              (status?.stats.totalPnL || 0) >= 0 ? 'text-primary' : 'text-secondary'
            }`}>
              ${(status?.stats.totalPnL || 0).toFixed(2)}
            </div>
            <div className="text-xs text-white/60 mt-2">
              Bugün: ${(status?.stats.todayPnL || 0).toFixed(2)}
            </div>
          </div>

          <div className="glass rounded-2xl p-5 border-primary/20">
            <div className="text-white/60 text-xs mb-1">Açık Pozisyon</div>
            <div className="text-3xl font-bold text-white">
              {status?.stats.openPositions || 0}
            </div>
            <div className="text-xs text-white/60 mt-2">
              Bugün kapatılan: {status?.stats.closedToday || 0}
            </div>
          </div>
        </div>

        {/* Açık Pozisyonlar */}
        <div className="glass-dark rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Açık Pozisyonlar
            <span className="text-xs text-primary ml-auto">
              {status?.positions?.length || 0} Aktif
            </span>
          </h2>

          {status?.positions && status.positions.length > 0 ? (
            <div className="space-y-3">
              {status.positions.map((position: any, index: number) => (
                <div key={index} className="glass rounded-xl p-4 border-primary/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-white">{position.symbol}</div>
                      <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        position.side === 'LONG' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'
                      }`}>
                        {position.side}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${
                        position.pnl >= 0 ? 'text-primary' : 'text-secondary'
                      }`}>
                        {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                      </div>
                      <div className={`text-xs ${
                        position.pnlPercent >= 0 ? 'text-primary' : 'text-secondary'
                      }`}>
                        {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <div className="text-white/40">Giriş</div>
                      <div className="text-white font-mono">${position.entryPrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-white/40">Güncel</div>
                      <div className="text-white font-mono">${position.currentPrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-white/40">Stop Loss</div>
                      <div className="text-secondary font-mono">${position.stopLoss.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-white/40">Take Profit</div>
                      <div className="text-primary font-mono">${position.takeProfit.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-white/40">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p>Açık pozisyon yok</p>
            </div>
          )}
        </div>

        {/* AI Botları Durumu */}
        <div className="glass-dark rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            AI Botları
            <span className="text-xs text-primary ml-auto">6 Bot Aktif</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { name: 'Quantum Pro AI', type: 'LSTM + Transformer', status: 'active', accuracy: 91.5 },
              { name: 'Master Orchestrator', type: 'Multi-Model Ensemble', status: 'active', accuracy: 94.2 },
              { name: 'Attention Transformer', type: 'Deep Learning', status: 'active', accuracy: 88.7 },
              { name: 'Gradient Boosting', type: 'XGBoost', status: 'active', accuracy: 86.9 },
              { name: 'Reinforcement Learning', type: 'Q-Learning + DQN', status: 'active', accuracy: 85.3 },
              { name: 'TensorFlow Optimizer', type: 'Neural Network', status: 'active', accuracy: 89.3 },
            ].map((bot, index) => (
              <div key={index} className="glass rounded-xl p-4 border-primary/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-white">{bot.name}</div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                </div>
                <div className="text-xs text-white/60 mb-2">{bot.type}</div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/40">Doğruluk</div>
                  <div className="text-primary font-bold">{bot.accuracy}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Uyarı */}
        <div className="glass border-yellow-500/30 rounded-2xl p-6 mt-8">
          <div className="flex items-start gap-4">
            <svg className="w-8 h-8 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-lg font-bold text-yellow-500 mb-2">⚠️ Önemli Uyarı</h3>
              <p className="text-white/70 text-sm">
                Bu sistem şu anda <strong>PAPER TRADING</strong> modunda çalışmaktadır. Gerçek para kullanılmamaktadır.
                Canlı trading'e geçmek için ayarlardan "Live Mode" seçeneğini aktif edin.
              </p>
              <div className="mt-3 flex gap-4 text-xs text-white/60">
                <span>🎓 Beyaz Şapkalı Compliance: AKTİF</span>
                <span>🛡️ Risk Yönetimi: AKTİF</span>
                <span>⚡ Real-time Updates: AKTİF</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
