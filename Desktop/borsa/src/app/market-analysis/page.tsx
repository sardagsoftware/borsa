'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: number;
  marketCap: number;
}

interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  strength: number;
}

interface MarketSentiment {
  overall: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  fear_greed_index: number;
  trending_coins: string[];
  volume_trend: 'UP' | 'DOWN' | 'STABLE';
}

export default function MarketAnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [cryptos, setCryptos] = useState<CryptoData[]>([]);
  const [indicators, setIndicators] = useState<TechnicalIndicator[]>([]);
  const [sentiment, setSentiment] = useState<MarketSentiment>({
    overall: 'NEUTRAL',
    fear_greed_index: 50,
    trending_coins: [],
    volume_trend: 'STABLE'
  });

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const fetchMarketData = async () => {
    try {
      const response = await fetch(`/api/market/analysis?symbol=${selectedSymbol}`);
      const data = await response.json();

      if (data.success) {
        setCryptos(data.topCoins || []);
        setIndicators(data.indicators || []);
        setSentiment(data.sentiment || sentiment);
      }
    } catch (error) {
      console.error('Market data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'BULLISH') return 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400';
    if (sentiment === 'BEARISH') return 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400';
    return 'from-slate-500/20 to-slate-600/10 border-slate-500/30 text-slate-400';
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-5xl">📊</span>
            <h1 className="text-4xl font-bold text-white">Piyasa Analizi</h1>
          </div>
          <p className="text-slate-300">
            Gerçek zamanlı kripto piyasa verileri, teknik göstergeler ve sentiment analizi
          </p>
        </div>

        {/* Market Sentiment */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className={`bg-gradient-to-br backdrop-blur-xl rounded-xl p-6 border ${
            getSentimentColor(sentiment.overall)
          }`}>
            <div className="text-sm mb-2 opacity-80">Piyasa Duyarlılığı</div>
            <div className="text-3xl font-bold">
              {sentiment.overall === 'BULLISH' ? '🐂 Boğa' :
               sentiment.overall === 'BEARISH' ? '🐻 Ayı' : '⚖️ Nötr'}
            </div>
            <div className="text-xs mt-2 opacity-70">Genel trend</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <div className="text-slate-400 text-sm mb-2">Korku & Açgözlülük</div>
            <div className="text-3xl font-bold text-white">{sentiment.fear_greed_index}</div>
            <div className="text-slate-500 text-xs mt-2">
              {sentiment.fear_greed_index < 25 ? 'Aşırı Korku' :
               sentiment.fear_greed_index < 45 ? 'Korku' :
               sentiment.fear_greed_index < 55 ? 'Nötr' :
               sentiment.fear_greed_index < 75 ? 'Açgözlülük' : 'Aşırı Açgözlülük'}
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <div className="text-slate-400 text-sm mb-2">Hacim Trendi</div>
            <div className={`text-3xl font-bold ${
              sentiment.volume_trend === 'UP' ? 'text-emerald-400' :
              sentiment.volume_trend === 'DOWN' ? 'text-red-400' : 'text-slate-400'
            }`}>
              {sentiment.volume_trend === 'UP' ? '↗️ Artan' :
               sentiment.volume_trend === 'DOWN' ? '↘️ Azalan' : '→ Stabil'}
            </div>
            <div className="text-slate-500 text-xs mt-2">24 saatlik</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <div className="text-slate-400 text-sm mb-2">Analiz Edilen Coin</div>
            <div className="text-3xl font-bold text-cyan-400">{cryptos.length}</div>
            <div className="text-slate-500 text-xs mt-2">Top marketcap</div>
          </div>
        </div>

        {/* Symbol Selector */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/50 mb-8">
          <div className="flex items-center gap-3 overflow-x-auto">
            <span className="text-slate-400 text-sm whitespace-nowrap">Sembol:</span>
            {['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT', 'ADA/USDT'].map(symbol => (
              <button
                key={symbol}
                onClick={() => setSelectedSymbol(symbol)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  selectedSymbol === symbol
                    ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                    : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700'
                }`}
              >
                {symbol.split('/')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Technical Indicators */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">📈 Teknik Göstergeler - {selectedSymbol}</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
              <p className="text-slate-400 mt-4">Göstergeler hesaplanıyor...</p>
            </div>
          ) : indicators.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p>Teknik gösterge verisi yükleniyor...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {indicators.map((indicator, index) => (
                <div
                  key={index}
                  className="bg-slate-900/50 rounded-lg p-5 border border-slate-700/30"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bold text-white">{indicator.name}</div>
                      <div className="text-sm text-slate-400 mt-1 font-mono">
                        {indicator.value.toFixed(2)}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      indicator.signal === 'BUY'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : indicator.signal === 'SELL'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }`}>
                      {indicator.signal === 'BUY' ? '↗️ AL' :
                       indicator.signal === 'SELL' ? '↘️ SAT' : '→ NÖTR'}
                    </div>
                  </div>

                  {/* Strength Bar */}
                  <div>
                    <div className="text-xs text-slate-500 mb-1">
                      Güç: {indicator.strength}/100
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          indicator.signal === 'BUY' ? 'bg-emerald-500' :
                          indicator.signal === 'SELL' ? 'bg-red-500' : 'bg-slate-500'
                        }`}
                        style={{ width: `${indicator.strength}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Cryptos */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">🏆 En İyi Kripto Paralar</h2>
          <div className="space-y-3">
            {cryptos.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p>Kripto verileri yükleniyor...</p>
              </div>
            ) : (
              cryptos.map((crypto, index) => (
                <div
                  key={index}
                  className="bg-slate-900/50 rounded-lg p-5 border border-slate-700/30 hover:border-cyan-500/50 transition-all cursor-pointer"
                  onClick={() => setSelectedSymbol(`${crypto.symbol}/USDT`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-slate-500">#{index + 1}</div>
                      <div>
                        <div className="font-bold text-white text-lg">{crypto.symbol}</div>
                        <div className="text-sm text-slate-400">{crypto.name}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Fiyat</div>
                        <div className="text-white font-mono font-bold">
                          ${crypto.price.toLocaleString()}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-500">24s Değişim</div>
                        <div className={`font-bold ${
                          crypto.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(2)}%
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-500">Hacim (24s)</div>
                        <div className="text-cyan-400 font-mono">
                          ${(crypto.volume / 1e9).toFixed(2)}B
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-500">Market Cap</div>
                        <div className="text-purple-400 font-mono">
                          ${(crypto.marketCap / 1e9).toFixed(2)}B
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Trending */}
        {sentiment.trending_coins.length > 0 && (
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-600/10 backdrop-blur-xl rounded-xl p-6 border border-yellow-500/30 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">🔥 Trend Coinler</h2>
            <div className="flex flex-wrap gap-3">
              {sentiment.trending_coins.map((coin, index) => (
                <div
                  key={index}
                  className="bg-slate-900/50 px-4 py-2 rounded-lg border border-yellow-500/30 text-yellow-400 font-bold"
                >
                  {coin}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/quantum-pro"
            className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all group"
          >
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
              AI Trading
            </h3>
            <p className="text-slate-400 text-sm">
              Otomatik sinyal üretimi
            </p>
          </Link>

          <Link
            href="/signals"
            className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 backdrop-blur-xl rounded-xl p-6 border border-cyan-500/30 hover:border-cyan-400/50 transition-all group"
          >
            <div className="text-4xl mb-4">📡</div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
              Sinyaller
            </h3>
            <p className="text-slate-400 text-sm">
              Aktif trading sinyalleri
            </p>
          </Link>

          <Link
            href="/backtesting"
            className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-xl rounded-xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-all group"
          >
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
              Backtest
            </h3>
            <p className="text-slate-400 text-sm">
              Strateji testleri
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}