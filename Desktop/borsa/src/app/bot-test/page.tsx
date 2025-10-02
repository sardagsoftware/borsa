'use client';

import { useState, useEffect } from 'react';

interface BotSignal {
  bot_id: string;
  bot_name: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  risk_reward_ratio: number;
  reasoning: string;
}

interface BotTestResult {
  symbol: string;
  price: number;
  signals: BotSignal[];
  ensemble_signal: 'BUY' | 'SELL' | 'HOLD';
  ensemble_confidence: number;
  timestamp: string;
}

interface CoinData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
}

export default function BotTestPage() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);
  const [testResult, setTestResult] = useState<BotTestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCoins, setLoadingCoins] = useState(false);
  const [error, setError] = useState('');
  const [testHistory, setTestHistory] = useState<any[]>([]);

  // Load top 100 coins
  const loadTopCoins = async () => {
    setLoadingCoins(true);
    setError('');
    try {
      const response = await fetch('/api/trading/top100');
      const data = await response.json();

      if (data.success && data.data) {
        const coinList = data.data.map((item: any) => ({
          symbol: item.coin.symbol,
          name: item.coin.name,
          price: item.coin.price,
          change24h: item.coin.change24h,
          volume24h: item.coin.volume24h,
          marketCap: item.coin.marketCap,
        }));
        setCoins(coinList);
        if (coinList.length > 0 && !selectedCoin) {
          setSelectedCoin(coinList[0]);
        }
      } else {
        setError('Top 100 coinler yüklenemedi');
      }
    } catch (err: any) {
      console.error('Load coins error:', err);
      setError('Coin verileri alınamadı: ' + err.message);
    } finally {
      setLoadingCoins(false);
    }
  };

  // Test AI bots with real data
  const testBotsWithRealData = async () => {
    if (!selectedCoin) {
      setError('Lütfen bir coin seçin');
      return;
    }

    setLoading(true);
    setError('');
    setTestResult(null);

    try {
      // Call bot signal API
      const response = await fetch('/api/trading/signals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: selectedCoin.symbol,
          timeframe: '1h',
        }),
      });

      const data = await response.json();

      if (data.success && data.signals) {
        setTestResult({
          symbol: selectedCoin.symbol,
          price: selectedCoin.price,
          signals: data.signals,
          ensemble_signal: data.ensemble_signal,
          ensemble_confidence: data.ensemble_confidence,
          timestamp: new Date().toISOString(),
        });

        // Add to history
        setTestHistory(prev => [
          {
            coin: selectedCoin,
            result: data,
            timestamp: new Date().toISOString(),
          },
          ...prev.slice(0, 9)
        ]);
      } else {
        setError(data.error || 'Bot sinyalleri alınamadı');
      }
    } catch (err: any) {
      console.error('Bot test error:', err);
      setError('Bot testi başarısız: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load coins on mount
  useEffect(() => {
    loadTopCoins();
  }, []);

  // Get signal color
  const getSignalColor = (signal: string) => {
    if (signal === 'BUY') return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/50';
    if (signal === 'SELL') return 'text-red-400 bg-red-500/20 border-red-500/50';
    return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
  };

  // Get bot icon
  const getBotIcon = (botName: string) => {
    if (botName.includes('Ensemble')) return '🎯';
    if (botName.includes('Transformer')) return '🤖';
    if (botName.includes('XGBoost')) return '📊';
    if (botName.includes('Reinforcement')) return '🧠';
    if (botName.includes('TensorFlow')) return '⚡';
    if (botName.includes('Quantum')) return '🔮';
    return '🤖';
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🤖 AI Bot Test Merkezi</h1>
          <p className="text-slate-300">6 AI Trading Bot • Gerçek Zamanlı Veriler • Paper Trading Mode</p>
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-lg">
            <span className="text-emerald-400 font-bold">✅ WHITE-HAT COMPLIANT</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-300">Paper Trading Only (Güvenli Mod)</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Coin List */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">🏆 Top 100 Coinler</h2>
                <button
                  onClick={loadTopCoins}
                  disabled={loadingCoins}
                  className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-all text-sm font-semibold disabled:opacity-50"
                >
                  {loadingCoins ? '⏳' : '🔄'}
                </button>
              </div>

              {loadingCoins ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">⏳</div>
                  <div className="text-slate-400">Yükleniyor...</div>
                </div>
              ) : coins.length > 0 ? (
                <div className="space-y-2 max-h-[700px] overflow-y-auto">
                  {coins.slice(0, 50).map((coin, idx) => (
                    <div
                      key={coin.symbol}
                      onClick={() => setSelectedCoin(coin)}
                      className={`rounded-lg p-3 border cursor-pointer transition-all ${
                        selectedCoin?.symbol === coin.symbol
                          ? 'bg-emerald-500/20 border-emerald-500/50 shadow-lg'
                          : 'bg-slate-700/30 border-slate-600/30 hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 font-mono">#{idx + 1}</span>
                            <span className="font-bold text-white">{coin.symbol}</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">{coin.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-white text-sm">
                            ${coin.price >= 1 ? coin.price.toLocaleString() : coin.price.toFixed(6)}
                          </div>
                          <div className={`text-xs font-bold ${coin.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {coin.change24h >= 0 ? '↑' : '↓'} {Math.abs(coin.change24h).toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📊</div>
                  <div className="text-slate-400">Coinleri yüklemek için butona tıklayın</div>
                </div>
              )}
            </div>
          </div>

          {/* Middle Column - Test Control */}
          <div className="lg:col-span-1 space-y-6">
            {/* Selected Coin */}
            {selectedCoin && (
              <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-2 border-emerald-500/50 rounded-xl p-6">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Seçili Kripto Para</h3>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-2xl font-bold text-white">{selectedCoin.symbol}</div>
                    <div className="text-sm text-slate-300">{selectedCoin.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">
                      ${selectedCoin.price >= 1 ? selectedCoin.price.toLocaleString() : selectedCoin.price.toFixed(6)}
                    </div>
                    <div className={`text-sm font-bold ${selectedCoin.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {selectedCoin.change24h >= 0 ? '📈' : '📉'} {selectedCoin.change24h.toFixed(2)}%
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-700/30 rounded p-2">
                    <div className="text-slate-400">24s Hacim</div>
                    <div className="text-white font-mono">${(selectedCoin.volume24h / 1e6).toFixed(2)}M</div>
                  </div>
                  <div className="bg-slate-700/30 rounded p-2">
                    <div className="text-slate-400">Piyasa Değeri</div>
                    <div className="text-white font-mono">${(selectedCoin.marketCap / 1e9).toFixed(2)}B</div>
                  </div>
                </div>
              </div>
            )}

            {/* Test Button */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <h2 className="text-xl font-bold text-white mb-4">⚙️ Bot Testi</h2>

              <div className="space-y-4">
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-2">Test Edilecek Botlar:</div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs">🎯 Ensemble</span>
                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">🤖 Transformer</span>
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">📊 XGBoost</span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">🧠 RL</span>
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">⚡ TensorFlow</span>
                    <span className="px-2 py-1 bg-pink-500/20 text-pink-400 rounded text-xs">🔮 Quantum</span>
                  </div>
                </div>

                <button
                  onClick={testBotsWithRealData}
                  disabled={loading || !selectedCoin}
                  className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all disabled:opacity-50 text-lg shadow-lg"
                >
                  {loading ? '⏳ Botlar Test Ediliyor...' : '🚀 Tüm Botları Test Et'}
                </button>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-400">⚠️</span>
                    <div className="text-xs text-yellow-300">
                      <div className="font-bold mb-1">Paper Trading Modu</div>
                      <div className="text-yellow-400/80">
                        Tüm testler sanal para ile yapılır. Gerçek para kullanılmaz. Risk yönetimi aktif.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">❌</span>
                  <div>
                    <div className="font-bold text-red-400 mb-1 text-lg">Hata</div>
                    <div className="text-sm text-red-300">{error}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-1 space-y-6">
            {/* Test Results */}
            {testResult && (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                <h2 className="text-xl font-bold text-white mb-4">📊 Bot Sinyalleri</h2>

                {/* Ensemble Result */}
                <div className="mb-6 p-4 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-2 border-emerald-500/50 rounded-xl">
                  <div className="text-sm text-slate-400 mb-2">🎯 Ensemble Karar (6 Bot Ortalaması)</div>
                  <div className="flex items-center justify-between">
                    <div className={`text-3xl font-bold ${getSignalColor(testResult.ensemble_signal)}`}>
                      {testResult.ensemble_signal === 'BUY' && '📈 AL'}
                      {testResult.ensemble_signal === 'SELL' && '📉 SAT'}
                      {testResult.ensemble_signal === 'HOLD' && '⏸️ BEKLE'}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-400">Güven</div>
                      <div className="text-2xl font-bold text-emerald-400">
                        {(testResult.ensemble_confidence * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Individual Bot Signals */}
                <div className="space-y-3">
                  <div className="text-sm font-bold text-slate-300 mb-2">Bot Detayları:</div>
                  {testResult.signals && testResult.signals.map((signal, idx) => (
                    <div key={idx} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getBotIcon(signal.bot_name)}</span>
                          <div>
                            <div className="font-bold text-white text-sm">{signal.bot_name}</div>
                            <div className="text-xs text-slate-400">{signal.bot_id}</div>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-lg border text-sm font-bold ${getSignalColor(signal.signal)}`}>
                          {signal.signal}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                        <div className="bg-slate-600/20 rounded p-2">
                          <div className="text-slate-400">Güven</div>
                          <div className="text-emerald-400 font-mono font-bold">
                            {(signal.confidence * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div className="bg-slate-600/20 rounded p-2">
                          <div className="text-slate-400">R/R Oranı</div>
                          <div className="text-cyan-400 font-mono font-bold">
                            1:{signal.risk_reward_ratio.toFixed(2)}
                          </div>
                        </div>
                        <div className="bg-slate-600/20 rounded p-2">
                          <div className="text-slate-400">Stop Loss</div>
                          <div className="text-red-400 font-mono">
                            ${signal.stop_loss.toFixed(2)}
                          </div>
                        </div>
                        <div className="bg-slate-600/20 rounded p-2">
                          <div className="text-slate-400">Take Profit</div>
                          <div className="text-emerald-400 font-mono">
                            ${signal.take_profit.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {signal.reasoning && (
                        <div className="mt-3 pt-3 border-t border-slate-600/30">
                          <div className="text-xs text-slate-400 mb-1">Analiz:</div>
                          <div className="text-xs text-slate-300">{signal.reasoning}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System Info */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-bold text-white mb-3">🛡️ Güvenlik & Uyumluluk</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✅</span>
                  <span className="text-slate-300">White-Hat Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✅</span>
                  <span className="text-slate-300">Paper Trading Only (Gerçek para yok)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✅</span>
                  <span className="text-slate-300">Risk Management Aktif (2% max loss)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✅</span>
                  <span className="text-slate-300">Gerçek Zamanlı Binance Verileri</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✅</span>
                  <span className="text-slate-300">200+ Teknik Gösterge</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✅</span>
                  <span className="text-slate-300">SOC Room Monitoring 24/7</span>
                </div>
              </div>
            </div>

            {/* Test History */}
            {testHistory.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                <h2 className="text-lg font-bold text-white mb-4">📜 Test Geçmişi</h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {testHistory.map((item, idx) => (
                    <div key={idx} className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-bold text-white">{item.coin.symbol}</span>
                          <span className="text-xs text-slate-400 ml-2">
                            {new Date(item.timestamp).toLocaleTimeString('tr-TR')}
                          </span>
                        </div>
                        <span className={`text-sm font-bold px-2 py-1 rounded ${getSignalColor(item.result.ensemble_signal)}`}>
                          {item.result.ensemble_signal}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
