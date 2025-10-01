'use client';

import { useState, useEffect } from 'react';

interface CoinData {
  rank: number;
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  signal?: 'BUY' | 'SELL' | 'HOLD';
  confidence?: number;
  image?: string;
}

export default function WatchlistPage() {
  const [top100Coins, setTop100Coins] = useState<CoinData[]>([]);
  const [scanResults, setScanResults] = useState<CoinData[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  // Fetch top 100 coins on mount
  useEffect(() => {
    fetchTop100Coins();
    // Load watchlist from localStorage
    const saved = localStorage.getItem('watchlist');
    if (saved) {
      setWatchlist(JSON.parse(saved));
    }
  }, []);

  const fetchTop100Coins = async () => {
    try {
      const response = await fetch('/api/market/coinmarketcap');
      const data = await response.json();

      if (data.success) {
        setTop100Coins(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch top 100 coins:', err);
    }
  };

  const scanTop100 = async () => {
    if (isScanning) return;

    setIsScanning(true);
    setScanProgress(0);
    setScanResults([]);

    try {
      const results: CoinData[] = [];

      for (let i = 0; i < top100Coins.length; i++) {
        const coin = top100Coins[i];
        setScanProgress(Math.round(((i + 1) / top100Coins.length) * 100));

        try {
          // 🎯 GERÇEK QUANTUM SENTINEL ANALİZİ - Teknik göstergeler ile
          const response = await fetch('/api/quantum-sentinel/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol: `${coin.symbol}USDT` })
          });

          const data = await response.json();

          if (data.success && data.signal) {
            const signal = data.signal;

            // 🎯 SADECE AL (BUY) SİNYALLERİNİ EKLE
            if (signal.action === 'BUY') {
              results.push({
                ...coin,
                signal: 'BUY',
                confidence: signal.confidence
              });
            }
          }
        } catch (coinError) {
          console.log(`⚠️ ${coin.symbol} analiz edilemedi, atlanıyor...`);
          // Continue with next coin
        }

        // Delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Sort by confidence (highest first) - En yüksek confidence üstte
      results.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
      setScanResults(results);

      console.log(`✅ Tarama tamamlandı: ${results.length} AL sinyali bulundu`);

    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
      setScanProgress(100);
    }
  };


  const toggleWatchlist = (symbol: string) => {
    const newWatchlist = watchlist.includes(symbol)
      ? watchlist.filter(s => s !== symbol)
      : [...watchlist, symbol];

    setWatchlist(newWatchlist);
    localStorage.setItem('watchlist', JSON.stringify(newWatchlist));
  };

  const watchlistCoins = top100Coins.filter(coin => watchlist.includes(coin.symbol));

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-3">👁️ İzleme Listesi & Kripto Tarayıcı</h1>
          <p className="text-slate-300 text-lg">Top 100 kripto para AI analizi ile favori varlıklarınızı takip edin</p>
        </div>

        {/* Top 100 Coins Scanner */}
        <div className="mb-8 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl p-8 border border-cyan-500/30 shadow-2xl shadow-cyan-500/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-4xl">🔍</span>
              Top 100 Kripto Tarayıcı
              {top100Coins.length > 0 && (
                <span className="text-sm bg-cyan-500/20 px-4 py-2 rounded-full text-cyan-400 font-semibold">
                  {top100Coins.length} Coin Yüklendi
                </span>
              )}
            </h2>

            <button
              onClick={scanTop100}
              disabled={isScanning || top100Coins.length === 0}
              className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/30 text-lg flex items-center gap-3"
            >
              {isScanning ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Taranıyor... %{scanProgress}
                </>
              ) : (
                <>
                  <span>⚛️</span>
                  Quantum Tarama Başlat
                </>
              )}
            </button>
          </div>

          {/* Progress Bar */}
          {isScanning && (
            <div className="mb-6">
              <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Scan Results */}
          {scanResults.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span>📊</span>
                AI Sinyalleri
                <span className="ml-auto text-sm bg-emerald-500/20 px-4 py-2 rounded-full text-emerald-400">
                  {scanResults.length} Sonuç
                </span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2">
                {scanResults.map((coin) => (
                  <div
                    key={coin.symbol}
                    className="p-5 bg-gradient-to-br from-slate-700/30 to-slate-800/30 rounded-xl border border-slate-600/30 hover:border-cyan-500/40 transition-all shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {coin.image && (
                          <img src={coin.image} alt={coin.symbol} className="w-8 h-8 rounded-full" />
                        )}
                        <div>
                          <div className="font-bold text-white text-lg">{coin.symbol}</div>
                          <div className="text-slate-400 text-xs">#{coin.rank} {coin.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-4 py-1.5 rounded-lg text-sm font-bold shadow-md ${
                          coin.signal === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          coin.signal === 'SELL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {coin.signal === 'BUY' ? '📈 AL' : coin.signal === 'SELL' ? '📉 SAT' : '⏸️ BEKLE'}
                        </span>
                        <button
                          onClick={() => toggleWatchlist(coin.symbol)}
                          className={`p-2 rounded-lg transition-all ${
                            watchlist.includes(coin.symbol)
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              : 'bg-slate-700/50 text-slate-400 border border-slate-600/30 hover:bg-slate-700'
                          }`}
                          title={watchlist.includes(coin.symbol) ? 'İzleme listesinden çıkar' : 'İzleme listesine ekle'}
                        >
                          {watchlist.includes(coin.symbol) ? '⭐' : '☆'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Fiyat:</span>
                        <span className="text-white font-semibold">${coin.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">24s Değişim:</span>
                        <span className={`font-semibold ${coin.priceChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {coin.priceChange24h >= 0 ? '↑' : '↓'} {Math.abs(coin.priceChange24h).toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">AI Güven:</span>
                        <span className="text-cyan-400 font-semibold">{((coin.confidence || 0) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Hacim:</span>
                        <span className="text-white font-mono text-xs">${(coin.volume24h / 1000000).toFixed(1)}M</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results Message */}
          {!isScanning && scanResults.length === 0 && scanProgress > 0 && (
            <div className="text-center py-12 text-slate-400">
              <span className="text-5xl mb-4 block">🔍</span>
              <p className="text-lg">Güçlü sinyal bulunamadı. Piyasa analizi devam ediyor...</p>
            </div>
          )}
        </div>

        {/* Watchlist Section */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <span>⭐</span>
            Favori Listem
            {watchlist.length > 0 && (
              <span className="text-sm bg-yellow-500/20 px-4 py-2 rounded-full text-yellow-400">
                {watchlist.length} Coin
              </span>
            )}
          </h2>

          {watchlistCoins.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {watchlistCoins.map((coin) => (
                <div
                  key={coin.symbol}
                  className="p-5 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl border border-yellow-500/20 hover:border-yellow-500/40 transition-all shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {coin.image && (
                        <img src={coin.image} alt={coin.symbol} className="w-10 h-10 rounded-full" />
                      )}
                      <div>
                        <div className="font-bold text-white text-xl">{coin.symbol}</div>
                        <div className="text-slate-400 text-sm">#{coin.rank} {coin.name}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleWatchlist(coin.symbol)}
                      className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-all"
                      title="Listeden çıkar"
                    >
                      ⭐
                    </button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Fiyat:</span>
                      <span className="text-white font-bold text-lg">${coin.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">24s:</span>
                      <span className={`font-bold ${coin.priceChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {coin.priceChange24h >= 0 ? '↑' : '↓'} {Math.abs(coin.priceChange24h).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Piyasa Değeri:</span>
                      <span className="text-white font-mono text-xs">${(coin.marketCap / 1000000000).toFixed(2)}B</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Hacim:</span>
                      <span className="text-white font-mono text-xs">${(coin.volume24h / 1000000).toFixed(1)}M</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-6">⭐</div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Favori Listeniz Boş
              </h3>
              <p className="text-slate-400 mb-6">
                Yukarıdaki AI analiz sonuçlarından yıldız butonuna tıklayarak coin ekleyin.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
