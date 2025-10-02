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

interface CoinAnalysis {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  ensemble_signal: 'BUY' | 'SELL' | 'HOLD';
  ensemble_confidence: number;
  buy_bots: number;
  sell_bots: number;
  hold_bots: number;
  avg_risk_reward: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  signals: BotSignal[];
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
  const [analyzedCoins, setAnalyzedCoins] = useState<CoinAnalysis[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<CoinAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCoins, setLoadingCoins] = useState(false);
  const [scanningAll, setScanningAll] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL' | 'HOLD'>('BUY');

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

  // Analyze single coin
  const analyzeCoin = async (coin: CoinData): Promise<CoinAnalysis | null> => {
    try {
      const response = await fetch('/api/trading/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: coin.symbol, timeframe: '1h' }),
      });

      const data = await response.json();

      if (data.success && data.signals) {
        const buyBots = data.signals.filter((s: BotSignal) => s.signal === 'BUY').length;
        const sellBots = data.signals.filter((s: BotSignal) => s.signal === 'SELL').length;
        const holdBots = data.signals.filter((s: BotSignal) => s.signal === 'HOLD').length;

        const avgRR = data.signals.reduce((sum: number, s: BotSignal) => sum + s.risk_reward_ratio, 0) / data.signals.length;

        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
        if (avgRR >= 2.5 && data.ensemble_confidence >= 0.75) riskLevel = 'LOW';
        else if (avgRR < 1.5 || data.ensemble_confidence < 0.5) riskLevel = 'HIGH';

        return {
          symbol: coin.symbol,
          name: coin.name,
          price: coin.price,
          change24h: coin.change24h,
          volume24h: coin.volume24h,
          marketCap: coin.marketCap,
          ensemble_signal: data.ensemble_signal,
          ensemble_confidence: data.ensemble_confidence,
          buy_bots: buyBots,
          sell_bots: sellBots,
          hold_bots: holdBots,
          avg_risk_reward: avgRR,
          risk_level: riskLevel,
          signals: data.signals,
        };
      }
      return null;
    } catch (err) {
      console.error(`Error analyzing ${coin.symbol}:`, err);
      return null;
    }
  };

  // Scan all top 100 coins
  const scanAllCoins = async () => {
    if (coins.length === 0) {
      setError('Önce coinleri yükleyin');
      return;
    }

    setScanningAll(true);
    setError('');
    setScanProgress(0);
    setAnalyzedCoins([]);

    const results: CoinAnalysis[] = [];
    const totalCoins = Math.min(coins.length, 50); // İlk 50 coin

    for (let i = 0; i < totalCoins; i++) {
      const coin = coins[i];
      const analysis = await analyzeCoin(coin);

      if (analysis) {
        results.push(analysis);
        setAnalyzedCoins([...results]);
      }

      setScanProgress(((i + 1) / totalCoins) * 100);

      // Rate limiting - 200ms delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setScanningAll(false);
    setScanProgress(100);
  };

  // Quick analyze selected coin
  const quickAnalyze = async (coin: CoinData) => {
    setLoading(true);
    const analysis = await analyzeCoin(coin);
    if (analysis) {
      setSelectedCoin(analysis);
      // Add to analyzed list if not already there
      if (!analyzedCoins.find(c => c.symbol === analysis.symbol)) {
        setAnalyzedCoins(prev => [analysis, ...prev]);
      }
    }
    setLoading(false);
  };

  // Auto-load coins on mount
  useEffect(() => {
    loadTopCoins();
  }, []);

  // Filter analyzed coins
  const filteredCoins = analyzedCoins.filter(coin => {
    if (filter === 'ALL') return true;
    return coin.ensemble_signal === filter;
  });

  // Sort by confidence (best first)
  const sortedCoins = [...filteredCoins].sort((a, b) => b.ensemble_confidence - a.ensemble_confidence);

  // Get top 10 BUY recommendations
  const topBuyRecommendations = analyzedCoins
    .filter(c => c.ensemble_signal === 'BUY')
    .sort((a, b) => {
      const scoreA = a.ensemble_confidence * a.avg_risk_reward * (a.buy_bots / 6);
      const scoreB = b.ensemble_confidence * b.avg_risk_reward * (b.buy_bots / 6);
      return scoreB - scoreA;
    })
    .slice(0, 10);

  const getSignalColor = (signal: string) => {
    if (signal === 'BUY') return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/50';
    if (signal === 'SELL') return 'text-red-400 bg-red-500/20 border-red-500/50';
    return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
  };

  const getRiskColor = (risk: string) => {
    if (risk === 'LOW') return 'text-emerald-400 bg-emerald-500/20';
    if (risk === 'HIGH') return 'text-red-400 bg-red-500/20';
    return 'text-yellow-400 bg-yellow-500/20';
  };

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
          <h1 className="text-4xl font-bold text-white mb-2">🤖 AI Trading Bot Analiz Merkezi</h1>
          <p className="text-slate-300">6 AI Bot • Top 100 Coin Tarama • Akıllı AL/SAT Önerileri</p>
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-lg">
            <span className="text-emerald-400 font-bold">✅ WHITE-HAT COMPLIANT</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-300">Paper Trading Only</span>
          </div>
        </div>

        {/* Main Control Panel */}
        <div className="grid lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-4 bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={loadTopCoins}
                  disabled={loadingCoins}
                  className="px-6 py-3 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all font-semibold disabled:opacity-50"
                >
                  {loadingCoins ? '⏳ Yükleniyor...' : '📥 Top 100 Yükle'}
                </button>

                <button
                  onClick={scanAllCoins}
                  disabled={scanningAll || coins.length === 0}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all disabled:opacity-50 shadow-lg"
                >
                  {scanningAll ? `⏳ Taranıyor... ${scanProgress.toFixed(0)}%` : '🚀 Tüm Coinleri Tara (AI Analiz)'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Filtre:</span>
                <button onClick={() => setFilter('ALL')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${filter === 'ALL' ? 'bg-slate-600 text-white' : 'bg-slate-700/30 text-slate-400'}`}>
                  Tümü ({analyzedCoins.length})
                </button>
                <button onClick={() => setFilter('BUY')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${filter === 'BUY' ? 'bg-emerald-500/30 text-emerald-400' : 'bg-slate-700/30 text-slate-400'}`}>
                  AL ({analyzedCoins.filter(c => c.ensemble_signal === 'BUY').length})
                </button>
                <button onClick={() => setFilter('SELL')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${filter === 'SELL' ? 'bg-red-500/30 text-red-400' : 'bg-slate-700/30 text-slate-400'}`}>
                  SAT ({analyzedCoins.filter(c => c.ensemble_signal === 'SELL').length})
                </button>
                <button onClick={() => setFilter('HOLD')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${filter === 'HOLD' ? 'bg-yellow-500/30 text-yellow-400' : 'bg-slate-700/30 text-slate-400'}`}>
                  BEKLE ({analyzedCoins.filter(c => c.ensemble_signal === 'HOLD').length})
                </button>
              </div>
            </div>

            {scanningAll && (
              <div className="mt-4">
                <div className="w-full bg-slate-700/30 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300 rounded-full"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Top 10 Recommendations */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-2 border-emerald-500/50 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">🏆 Top 10 AL ÖNERİLERİ</h2>

              {topBuyRecommendations.length > 0 ? (
                <div className="space-y-3">
                  {topBuyRecommendations.map((coin, idx) => {
                    const score = (coin.ensemble_confidence * coin.avg_risk_reward * (coin.buy_bots / 6) * 100).toFixed(0);
                    return (
                      <div
                        key={coin.symbol}
                        onClick={() => setSelectedCoin(coin)}
                        className="bg-slate-800/50 rounded-lg p-4 border border-emerald-500/30 cursor-pointer hover:bg-slate-700/50 transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold text-lg">#{idx + 1}</span>
                            <div>
                              <div className="font-bold text-white">{coin.symbol}</div>
                              <div className="text-xs text-slate-400">{coin.name}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-emerald-400 font-bold text-lg">{score}</div>
                            <div className="text-xs text-slate-400">AI Skor</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="bg-slate-700/30 rounded p-2 text-center">
                            <div className="text-slate-400">Güven</div>
                            <div className="text-emerald-400 font-bold">{(coin.ensemble_confidence * 100).toFixed(0)}%</div>
                          </div>
                          <div className="bg-slate-700/30 rounded p-2 text-center">
                            <div className="text-slate-400">R/R</div>
                            <div className="text-cyan-400 font-bold">1:{coin.avg_risk_reward.toFixed(1)}</div>
                          </div>
                          <div className={`rounded p-2 text-center ${getRiskColor(coin.risk_level)}`}>
                            <div className="text-xs opacity-80">Risk</div>
                            <div className="font-bold">{coin.risk_level}</div>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-emerald-400">✅ {coin.buy_bots}/6 Bot AL Diyor</span>
                          <span className="text-white font-mono">${coin.price >= 1 ? coin.price.toLocaleString() : coin.price.toFixed(6)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <div className="text-slate-400 mb-4">Henüz analiz yapılmadı</div>
                  <div className="text-sm text-slate-500">
                    "Tüm Coinleri Tara" butonuna tıklayarak<br />
                    AI botların analizini başlatın
                  </div>
                </div>
              )}
            </div>

            {/* Unanalyzed Coins List */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <h2 className="text-lg font-bold text-white mb-4">📊 Top 100 Coin Listesi</h2>

              {loadingCoins ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">⏳</div>
                  <div className="text-slate-400">Yükleniyor...</div>
                </div>
              ) : coins.length > 0 ? (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {coins.slice(0, 100).map((coin, idx) => {
                    const analyzed = analyzedCoins.find(c => c.symbol === coin.symbol);
                    return (
                      <div
                        key={coin.symbol}
                        onClick={() => quickAnalyze(coin)}
                        className={`rounded-lg p-3 border cursor-pointer transition-all ${
                          analyzed
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-slate-700/30 border-slate-600/30 hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 font-mono w-8">#{idx + 1}</span>
                            <div>
                              <div className="font-bold text-white text-sm">{coin.symbol}</div>
                              <div className="text-xs text-slate-400">{coin.name}</div>
                            </div>
                            {analyzed && <span className="text-emerald-400 text-xs">✓</span>}
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-white text-xs">
                              ${coin.price >= 1 ? coin.price.toLocaleString() : coin.price.toFixed(6)}
                            </div>
                            <div className={`text-xs font-bold ${coin.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {coin.change24h >= 0 ? '↑' : '↓'} {Math.abs(coin.change24h).toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📊</div>
                  <div className="text-slate-400">Coinleri yüklemek için butona tıklayın</div>
                </div>
              )}
            </div>
          </div>

          {/* Middle Column - Analyzed Coins Grid */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <h2 className="text-xl font-bold text-white mb-4">
                📈 Analiz Edilen Coinler ({sortedCoins.length})
              </h2>

              {sortedCoins.length > 0 ? (
                <div className="space-y-3 max-h-[800px] overflow-y-auto">
                  {sortedCoins.map((coin) => (
                    <div
                      key={coin.symbol}
                      onClick={() => setSelectedCoin(coin)}
                      className={`rounded-lg p-4 border cursor-pointer transition-all ${
                        selectedCoin?.symbol === coin.symbol
                          ? 'bg-emerald-500/20 border-emerald-500/50 shadow-lg'
                          : 'bg-slate-700/30 border-slate-600/30 hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-bold text-white text-lg">{coin.symbol}</div>
                          <div className="text-xs text-slate-400">{coin.name}</div>
                        </div>
                        <div className={`px-3 py-1 rounded-lg border font-bold ${getSignalColor(coin.ensemble_signal)}`}>
                          {coin.ensemble_signal}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-slate-600/20 rounded p-2 text-center">
                          <div className="text-xs text-slate-400">Güven</div>
                          <div className="text-emerald-400 font-bold text-sm">
                            {(coin.ensemble_confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                        <div className="bg-slate-600/20 rounded p-2 text-center">
                          <div className="text-xs text-slate-400">R/R</div>
                          <div className="text-cyan-400 font-bold text-sm">
                            1:{coin.avg_risk_reward.toFixed(1)}
                          </div>
                        </div>
                        <div className={`rounded p-2 text-center ${getRiskColor(coin.risk_level)}`}>
                          <div className="text-xs opacity-80">Risk</div>
                          <div className="font-bold text-sm">{coin.risk_level}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex gap-2">
                          <span className="text-emerald-400">✅ {coin.buy_bots}</span>
                          <span className="text-red-400">❌ {coin.sell_bots}</span>
                          <span className="text-yellow-400">⏸️ {coin.hold_bots}</span>
                        </div>
                        <div className="text-white font-mono">
                          ${coin.price >= 1 ? coin.price.toLocaleString() : coin.price.toFixed(6)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🤖</div>
                  <div className="text-slate-400 mb-2">Henüz analiz yok</div>
                  <div className="text-sm text-slate-500">
                    Sol taraftaki listeden bir coin seçin<br />
                    veya tüm coinleri tarayın
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Detailed Analysis */}
          <div className="lg:col-span-1">
            {selectedCoin ? (
              <div className="space-y-6">
                {/* Coin Header */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-2 border-emerald-500/50 rounded-xl p-6">
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

                  {/* Ensemble Decision */}
                  <div className={`p-4 rounded-xl border-2 mb-3 ${getSignalColor(selectedCoin.ensemble_signal)}`}>
                    <div className="text-sm opacity-80 mb-1">🎯 AI Ensemble Kararı</div>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold">
                        {selectedCoin.ensemble_signal === 'BUY' && '📈 AL'}
                        {selectedCoin.ensemble_signal === 'SELL' && '📉 SAT'}
                        {selectedCoin.ensemble_signal === 'HOLD' && '⏸️ BEKLE'}
                      </div>
                      <div className="text-2xl font-bold">
                        {(selectedCoin.ensemble_confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Bot Votes */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-emerald-500/20 rounded p-2 text-center">
                      <div className="text-emerald-400 text-2xl font-bold">{selectedCoin.buy_bots}</div>
                      <div className="text-xs text-emerald-400">AL</div>
                    </div>
                    <div className="bg-red-500/20 rounded p-2 text-center">
                      <div className="text-red-400 text-2xl font-bold">{selectedCoin.sell_bots}</div>
                      <div className="text-xs text-red-400">SAT</div>
                    </div>
                    <div className="bg-yellow-500/20 rounded p-2 text-center">
                      <div className="text-yellow-400 text-2xl font-bold">{selectedCoin.hold_bots}</div>
                      <div className="text-xs text-yellow-400">BEKLE</div>
                    </div>
                  </div>
                </div>

                {/* Individual Bot Signals */}
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                  <h3 className="text-lg font-bold text-white mb-4">🤖 Bot Detayları</h3>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {selectedCoin.signals.map((signal, idx) => (
                      <div key={idx} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                        <div className="flex items-center justify-between mb-3">
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

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-600/20 rounded p-2">
                            <div className="text-slate-400">Güven</div>
                            <div className="text-emerald-400 font-bold">
                              {(signal.confidence * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div className="bg-slate-600/20 rounded p-2">
                            <div className="text-slate-400">R/R</div>
                            <div className="text-cyan-400 font-bold">
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
                            <div className="text-xs text-slate-400 mb-1">💡 Analiz:</div>
                            <div className="text-xs text-slate-300">{signal.reasoning}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👈</div>
                  <div className="text-xl text-white mb-2">Coin Seçin</div>
                  <div className="text-sm text-slate-400">
                    Detaylı analiz için bir coin seçin
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-500/10 border-2 border-red-500/50 rounded-xl p-4 max-w-md">
            <div className="flex items-start gap-3">
              <span className="text-2xl">❌</span>
              <div>
                <div className="font-bold text-red-400 text-sm">Hata</div>
                <div className="text-xs text-red-300">{error}</div>
              </div>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 ml-auto">✕</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
