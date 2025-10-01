'use client';

import { useEffect, useState } from 'react';

interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  marketCap: number;
  marketCapRank: number;
  totalVolume: number;
  priceChange1h: number;
  priceChange24h: number;
  priceChange7d: number;
  high24h: number;
  low24h: number;
}

export default function CryptoPage() {
  const [cryptos, setCryptos] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchCryptos();
    const interval = setInterval(fetchCryptos, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchCryptos = async () => {
    try {
      const response = await fetch('/api/market/crypto');
      const result = await response.json();

      if (result.success) {
        setCryptos(result.data);
      }
    } catch (error) {
      console.error('Error fetching cryptos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCryptos = cryptos.filter(crypto => {
    if (filter === 'gainers') return crypto.priceChange24h > 0;
    if (filter === 'losers') return crypto.priceChange24h < 0;
    return true;
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">₿ Kripto Paralar</h1>
          <p className="text-slate-400">Canlı kripto para fiyatları ve piyasa verileri</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            Tümü ({cryptos.length})
          </button>
          <button
            onClick={() => setFilter('gainers')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'gainers'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            Yükselenler 📈
          </button>
          <button
            onClick={() => setFilter('losers')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'losers'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            Düşenler 📉
          </button>
        </div>

        {/* Crypto List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500"></div>
            <p className="text-slate-400 mt-6 text-lg">Canlı veriler yükleniyor...</p>
            <p className="text-slate-500 text-sm mt-2">CoinGecko API</p>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50">
                  <tr className="text-left text-slate-400 text-sm">
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Kripto Para</th>
                    <th className="px-6 py-4 text-right">Fiyat</th>
                    <th className="px-6 py-4 text-right">1s</th>
                    <th className="px-6 py-4 text-right">24s</th>
                    <th className="px-6 py-4 text-right">7g</th>
                    <th className="px-6 py-4 text-right">Piyasa Değeri</th>
                    <th className="px-6 py-4 text-right">Hacim (24s)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCryptos.map((crypto) => (
                    <tr
                      key={crypto.id}
                      className="border-t border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-6 py-4 text-slate-400">{crypto.marketCapRank}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={crypto.image} alt={crypto.name} className="w-8 h-8" />
                          <div>
                            <div className="font-semibold text-white">{crypto.name}</div>
                            <div className="text-xs text-slate-400">{crypto.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-white font-semibold">
                        ${crypto.currentPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`px-6 py-4 text-right font-medium ${
                        crypto.priceChange1h >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {crypto.priceChange1h >= 0 ? '↑' : '↓'} {Math.abs(crypto.priceChange1h).toFixed(2)}%
                      </td>
                      <td className={`px-6 py-4 text-right font-medium ${
                        crypto.priceChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {crypto.priceChange24h >= 0 ? '↑' : '↓'} {Math.abs(crypto.priceChange24h).toFixed(2)}%
                      </td>
                      <td className={`px-6 py-4 text-right font-medium ${
                        crypto.priceChange7d >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {crypto.priceChange7d >= 0 ? '↑' : '↓'} {Math.abs(crypto.priceChange7d).toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 text-right text-slate-300">
                        ${(crypto.marketCap / 1000000000).toFixed(2)}B
                      </td>
                      <td className="px-6 py-4 text-right text-slate-300">
                        ${(crypto.totalVolume / 1000000).toFixed(2)}M
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Last Update */}
        <div className="text-center mt-6 text-slate-500 text-sm">
          Son güncelleme: {new Date().toLocaleTimeString('tr-TR')} • Kaynak: CoinGecko API
        </div>
      </div>
    </main>
  );
}