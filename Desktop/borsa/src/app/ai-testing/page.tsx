'use client';

import { useState, useEffect } from 'react';

interface PredictionResult {
  prediction: number;
  confidence: number;
  action: string;
  model_name: string;
  model_type: string;
  entry_price?: number;
  stop_loss?: number;
  take_profit?: number;
}

interface ModelInfo {
  name: string;
  type: string;
  version: string;
  parameters: number;
  active: boolean;
}

interface CoinData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
}

interface WatchlistCoin {
  coin: CoinData;
  prediction?: PredictionResult;
  addedAt: string;
}

export default function AITestingPage() {
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);
  const [timeframe, setTimeframe] = useState('1h');
  const [selectedModel, setSelectedModel] = useState('ensemble');
  const [loading, setLoading] = useState(false);
  const [loadingCoins, setLoadingCoins] = useState(false);
  const [autoBotRunning, setAutoBotRunning] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [topCoins, setTopCoins] = useState<CoinData[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistCoin[]>([]);
  const [error, setError] = useState('');
  const [activeModels, setActiveModels] = useState<string[]>(['ensemble']);

  // Top 100 coinleri yükle
  const loadTop100Coins = async () => {
    setLoadingCoins(true);
    try {
      const response = await fetch('/api/trading/top100');
      const data = await response.json();

      if (data.success && data.data) {
        const coins = data.data.slice(0, 50).map((item: any) => ({
          symbol: item.coin.symbol,
          name: item.coin.name,
          price: item.coin.price,
          change24h: item.coin.change24h,
          marketCap: item.coin.marketCap,
          volume24h: item.coin.volume24h,
        }));
        setTopCoins(coins);
        if (coins.length > 0 && !selectedCoin) {
          setSelectedCoin(coins[0]);
        }
      }
    } catch (err) {
      console.error('Top 100 yüklenemedi:', err);
      setError('Coinler yüklenemedi');
    } finally {
      setLoadingCoins(false);
    }
  };

  // AI Tahmin yap
  const runPrediction = async (coin?: CoinData) => {
    const targetCoin = coin || selectedCoin;
    if (!targetCoin) {
      setError('Lütfen bir coin seçin');
      return null;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: targetCoin.symbol,
          timeframe,
          model: selectedModel,
        }),
      });

      const data = await response.json();

      if (data.success && data.prediction) {
        const result = {
          ...data.prediction,
          entry_price: targetCoin.price,
          stop_loss: targetCoin.price * 0.97, // 3% stop loss
          take_profit: targetCoin.price * 1.05, // 5% take profit
        };

        if (!coin) {
          setPredictionResult(result);
        }

        return result;
      } else {
        setError(data.error || 'Tahmin başarısız');
        return null;
      }
    } catch (err: any) {
      console.error('Tahmin hatası:', err);
      setError('Tahmin yapılamadı: ' + err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Watchlist'e ekle
  const addToWatchlist = async () => {
    if (!selectedCoin) return;

    // Zaten varsa ekleme
    if (watchlist.find(w => w.coin.symbol === selectedCoin.symbol)) {
      setError('Bu coin zaten izleme listesinde');
      return;
    }

    // Tahmin yap
    const prediction = await runPrediction(selectedCoin);

    const newItem: WatchlistCoin = {
      coin: selectedCoin,
      prediction: prediction || undefined,
      addedAt: new Date().toISOString(),
    };

    setWatchlist(prev => [newItem, ...prev]);
  };

  // Watchlist'ten çıkar
  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(prev => prev.filter(w => w.coin.symbol !== symbol));
  };

  // Auto Bot başlat/durdur
  const toggleAutoBot = () => {
    setAutoBotRunning(!autoBotRunning);

    if (!autoBotRunning) {
      // Auto bot başladı
      console.log('🤖 Auto Bot başlatıldı - Arka planda çalışıyor');
      // Burada gerçek auto bot logic'i çalışacak
      setError('');
    } else {
      console.log('⏸️ Auto Bot durduruldu');
    }
  };

  // Model aktif/pasif toggle
  const toggleModel = (modelName: string) => {
    setActiveModels(prev => {
      if (prev.includes(modelName)) {
        return prev.filter(m => m !== modelName);
      } else {
        return [...prev, modelName];
      }
    });
  };

  // Component mount
  useEffect(() => {
    loadTop100Coins();
  }, []);

  // Auto bot çalışırken watchlist güncellemesi
  useEffect(() => {
    if (!autoBotRunning) return;

    const interval = setInterval(async () => {
      // Her 30 saniyede watchlist'i güncelle
      const updatedWatchlist = await Promise.all(
        watchlist.map(async (item) => {
          const prediction = await runPrediction(item.coin);
          return {
            ...item,
            prediction: prediction || item.prediction,
          };
        })
      );
      setWatchlist(updatedWatchlist);
    }, 30000); // 30 saniye

    return () => clearInterval(interval);
  }, [autoBotRunning, watchlist]);

  const availableModels = [
    { id: 'ensemble', name: 'Ensemble AI', icon: '🎯', color: 'emerald' },
    { id: 'transformer', name: 'Transformer', icon: '🤖', color: 'cyan' },
    { id: 'xgboost', name: 'XGBoost', icon: '📊', color: 'purple' },
    { id: 'lstm', name: 'LSTM Neural', icon: '🧠', color: 'blue' },
    { id: 'random_forest', name: 'Random Forest', icon: '🌲', color: 'green' },
    { id: 'gradient_boost', name: 'Gradient Boost', icon: '⚡', color: 'orange' },
  ];

  const timeframes = [
    { id: '15m', label: '15 Dakika' },
    { id: '1h', label: '1 Saat' },
    { id: '4h', label: '4 Saat' },
    { id: '1d', label: '1 Gün' },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-purple-900 py-6">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header - Fixed */}
        <div className="sticky top-20 z-40 bg-gradient-to-r from-slate-900/95 to-purple-900/95 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30 shadow-2xl mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">🧠 AI Testing Center</h1>
              <p className="text-slate-300 text-sm">Premium AI Models • Real-time Analysis • Auto Trading</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Auto Bot Toggle */}
              <button
                onClick={toggleAutoBot}
                className={`px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
                  autoBotRunning
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white animate-pulse'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                }`}
              >
                {autoBotRunning ? '🤖 Auto Bot: ÇALIŞIYOR' : '⏸️ Auto Bot: DURDUR'}
              </button>

              {/* Quick Actions */}
              <button
                onClick={loadTop100Coins}
                disabled={loadingCoins}
                className="px-4 py-3 bg-purple-500/20 text-purple-300 rounded-xl hover:bg-purple-500/30 transition-all font-semibold disabled:opacity-50"
              >
                {loadingCoins ? '⏳' : '🔄'} Yenile
              </button>
            </div>
          </div>

          {/* Active Models Bar */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-400">Aktif Modeller:</span>
            {availableModels.map((model) => (
              <button
                key={model.id}
                onClick={() => toggleModel(model.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeModels.includes(model.id)
                    ? `bg-${model.color}-500/30 text-${model.color}-300 border border-${model.color}-500/50`
                    : 'bg-slate-700/30 text-slate-500 border border-slate-600/30'
                }`}
              >
                {model.icon} {model.name}
              </button>
            ))}
            <span className="text-xs text-slate-500 ml-2">
              ({activeModels.length} / {availableModels.length} aktif)
            </span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Coin Selection */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden sticky top-60">
              <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-purple-500/10 to-cyan-500/10">
                <h2 className="text-lg font-bold text-white">📊 Top 50 Coins</h2>
                <p className="text-xs text-slate-400 mt-1">Click to analyze</p>
              </div>

              <div className="max-h-[600px] overflow-y-auto">
                {loadingCoins ? (
                  <div className="p-8 text-center">
                    <div className="text-4xl mb-2">⏳</div>
                    <div className="text-slate-400">Loading...</div>
                  </div>
                ) : topCoins.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {topCoins.map((coin, idx) => {
                      const isInWatchlist = watchlist.find(w => w.coin.symbol === coin.symbol);
                      return (
                        <button
                          key={coin.symbol}
                          onClick={() => setSelectedCoin(coin)}
                          className={`w-full text-left p-3 rounded-lg transition-all ${
                            selectedCoin?.symbol === coin.symbol
                              ? 'bg-gradient-to-r from-purple-500/30 to-cyan-500/30 border border-purple-500/50'
                              : 'bg-slate-700/30 hover:bg-slate-600/30 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 font-mono w-6">#{idx + 1}</span>
                              <div>
                                <div className="font-bold text-white text-sm">{coin.symbol}</div>
                                <div className="text-xs text-slate-400">{coin.name}</div>
                              </div>
                            </div>
                            {isInWatchlist && <span className="text-emerald-400 text-xs">⭐</span>}
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white font-mono">
                              ${coin.price >= 1 ? coin.price.toLocaleString() : coin.price.toFixed(6)}
                            </span>
                            <span className={`font-bold ${coin.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {coin.change24h >= 0 ? '↑' : '↓'} {Math.abs(coin.change24h).toFixed(2)}%
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="text-4xl mb-2">📊</div>
                    <div className="text-slate-400">No coins loaded</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center - Analysis Panel */}
          <div className="lg:col-span-6 space-y-6">
            {/* Selected Coin Info */}
            {selectedCoin && (
              <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border-2 border-purple-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-3xl font-bold text-white">{selectedCoin.symbol}</div>
                    <div className="text-sm text-slate-300">{selectedCoin.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      ${selectedCoin.price >= 1 ? selectedCoin.price.toLocaleString() : selectedCoin.price.toFixed(6)}
                    </div>
                    <div className={`text-sm font-bold ${selectedCoin.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {selectedCoin.change24h >= 0 ? '📈' : '📉'} {selectedCoin.change24h.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400">24h Volume</div>
                    <div className="text-white font-bold">${(selectedCoin.volume24h / 1e9).toFixed(2)}B</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400">Market Cap</div>
                    <div className="text-white font-bold">${(selectedCoin.marketCap / 1e9).toFixed(2)}B</div>
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Controls */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-bold text-white mb-4">⚙️ Analysis Settings</h3>

              {/* Timeframe Selection */}
              <div className="mb-4">
                <label className="text-sm text-slate-400 mb-2 block">Timeframe</label>
                <div className="grid grid-cols-4 gap-2">
                  {timeframes.map((tf) => (
                    <button
                      key={tf.id}
                      onClick={() => setTimeframe(tf.id)}
                      className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                        timeframe === tf.id
                          ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                          : 'bg-slate-700/30 text-slate-400 hover:bg-slate-600/30'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Selection */}
              <div className="mb-6">
                <label className="text-sm text-slate-400 mb-2 block">AI Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500/50"
                >
                  {availableModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.icon} {model.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => runPrediction()}
                  disabled={loading || !selectedCoin}
                  className="py-3 px-6 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-cyan-600 transition-all disabled:opacity-50 shadow-lg"
                >
                  {loading ? '⏳ Analyzing...' : '🚀 Analyze Now'}
                </button>

                <button
                  onClick={addToWatchlist}
                  disabled={!selectedCoin}
                  className="py-3 px-6 bg-emerald-500/20 text-emerald-300 font-bold rounded-xl hover:bg-emerald-500/30 transition-all disabled:opacity-50 border border-emerald-500/50"
                >
                  ⭐ Add to Watch
                </button>
              </div>
            </div>

            {/* Prediction Result */}
            {predictionResult && (
              <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-2 border-emerald-500/50 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">🎯 AI Prediction Result</h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <div className="text-sm text-slate-400 mb-1">Action</div>
                    <div className={`text-2xl font-bold ${
                      predictionResult.action === 'BUY' ? 'text-emerald-400' :
                      predictionResult.action === 'SELL' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {predictionResult.action === 'BUY' && '📈 BUY'}
                      {predictionResult.action === 'SELL' && '📉 SELL'}
                      {predictionResult.action === 'HOLD' && '⏸️ HOLD'}
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <div className="text-sm text-slate-400 mb-1">Confidence</div>
                    <div className="text-2xl font-bold text-cyan-400">
                      {(predictionResult.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <div className="text-xs text-slate-400">Entry</div>
                    <div className="text-white font-mono text-sm">
                      ${predictionResult.entry_price?.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-red-500/20 rounded-lg p-3">
                    <div className="text-xs text-red-400">Stop Loss</div>
                    <div className="text-red-300 font-mono text-sm">
                      ${predictionResult.stop_loss?.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-emerald-500/20 rounded-lg p-3">
                    <div className="text-xs text-emerald-400">Take Profit</div>
                    <div className="text-emerald-300 font-mono text-sm">
                      ${predictionResult.take_profit?.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Model</div>
                  <div className="text-sm text-white font-semibold">
                    {predictionResult.model_name} ({predictionResult.model_type})
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Watchlist */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 sticky top-60">
              <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">⭐ Watch List</h2>
                  <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded">
                    {watchlist.length} coins
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Auto-updated every 30s</p>
              </div>

              <div className="max-h-[600px] overflow-y-auto">
                {watchlist.length > 0 ? (
                  <div className="p-2 space-y-2">
                    {watchlist.map((item) => (
                      <div
                        key={item.coin.symbol}
                        className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-bold text-white text-sm">{item.coin.symbol}</div>
                            <div className="text-xs text-slate-400">{item.coin.name}</div>
                          </div>
                          <button
                            onClick={() => removeFromWatchlist(item.coin.symbol)}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Price:</span>
                            <span className="text-white font-mono">
                              ${item.coin.price >= 1 ? item.coin.price.toLocaleString() : item.coin.price.toFixed(6)}
                            </span>
                          </div>

                          {item.prediction && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Signal:</span>
                                <span className={`font-bold ${
                                  item.prediction.action === 'BUY' ? 'text-emerald-400' :
                                  item.prediction.action === 'SELL' ? 'text-red-400' : 'text-yellow-400'
                                }`}>
                                  {item.prediction.action}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Confidence:</span>
                                <span className="text-cyan-400 font-bold">
                                  {(item.prediction.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="mt-2 text-xs text-slate-500">
                          Added: {new Date(item.addedAt).toLocaleTimeString('tr-TR')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="text-4xl mb-2">⭐</div>
                    <div className="text-slate-400 text-sm mb-1">No coins in watchlist</div>
                    <div className="text-xs text-slate-500">
                      Add coins to monitor<br />AI predictions in real-time
                    </div>
                  </div>
                )}
              </div>

              {/* Auto Bot Status */}
              {autoBotRunning && (
                <div className="p-4 border-t border-slate-700/50 bg-emerald-500/10">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-emerald-400 font-semibold">
                      Auto Bot Active - Monitoring {watchlist.length} coins
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="fixed bottom-6 right-6 bg-red-500/10 border-2 border-red-500/50 rounded-xl p-4 max-w-md z-50">
            <div className="flex items-start gap-3">
              <span className="text-2xl">❌</span>
              <div className="flex-1">
                <div className="font-bold text-red-400 text-sm">Error</div>
                <div className="text-xs text-red-300">{error}</div>
              </div>
              <button
                onClick={() => setError('')}
                className="text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Success Notification */}
        {autoBotRunning && (
          <div className="fixed bottom-6 left-6 bg-emerald-500/10 border-2 border-emerald-500/50 rounded-xl p-4 max-w-md z-50">
            <div className="flex items-start gap-3">
              <span className="text-2xl animate-pulse">🤖</span>
              <div>
                <div className="font-bold text-emerald-400 text-sm">Auto Bot Running</div>
                <div className="text-xs text-emerald-300">
                  Background analysis active • Updates every 30s
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
