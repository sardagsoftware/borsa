'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Search } from 'lucide-react';

interface CryptoData {
  id: string;
  rank: number;
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  marketCap: number;
  volume24h: number;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    fetchCryptos();
    const interval = setInterval(fetchCryptos, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchCryptos = async () => {
    try {
      const response = await fetch('/api/market/coinmarketcap');
      const result = await response.json();

      if (result.success) {
        setCryptos(result.data);
      }
    } catch (error) {
      console.error('Kripto verileri alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCryptos = cryptos
    .filter(crypto => {
      if (filter === 'gainers') return crypto.priceChange24h > 0;
      if (filter === 'losers') return crypto.priceChange24h < 0;
      return true;
    })
    .filter(crypto => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        crypto.name.toLowerCase().includes(search) ||
        crypto.symbol.toLowerCase().includes(search)
      );
    });

  const totalPages = Math.ceil(filteredCryptos.length / itemsPerPage);
  const paginatedCryptos = filteredCryptos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Kripto Paralar</h1>
              <p className="text-slate-400">Top 100 kripto para - Canlı fiyatlar ve piyasa verileri</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Kripto ara (isim veya sembol)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <button
            onClick={() => {
              setFilter('all');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            Tümü ({cryptos.length})
          </button>
          <button
            onClick={() => {
              setFilter('gainers');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'gainers'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <TrendingUp size={16} />
            Yükselenler
          </button>
          <button
            onClick={() => {
              setFilter('losers');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'losers'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <TrendingDown size={16} />
            Düşenler
          </button>
          <div className="ml-auto text-slate-400 text-sm flex items-center">
            {filteredCryptos.length} sonuç bulundu
          </div>
        </div>

        {/* Crypto List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500"></div>
            <p className="text-slate-400 mt-6 text-lg">Yükleniyor...</p>
            <p className="text-slate-500 text-sm mt-2">Top 100 kripto para verisi</p>
          </div>
        ) : filteredCryptos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg">Sonuç bulunamadı</p>
            <p className="text-slate-500 text-sm mt-2">Lütfen arama teriminizi değiştirin</p>
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
                  {paginatedCryptos.map((crypto) => (
                    <tr
                      key={crypto.id}
                      className="border-t border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-6 py-4 text-slate-400 font-bold">{crypto.rank}</td>
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
                        ${(crypto.volume24h / 1000000).toFixed(2)}M
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredCryptos.length > itemsPerPage && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-slate-800/50 text-slate-300 rounded-lg hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Önceki
            </button>
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    currentPage === page
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-slate-800/50 text-slate-300 rounded-lg hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Sonraki
            </button>
          </div>
        )}

        {/* Last Update */}
        <div className="text-center mt-6 text-slate-500 text-sm">
          Son güncelleme: {new Date().toLocaleTimeString('tr-TR')} • Top 100 Kripto • Kaynak: CoinGecko API
        </div>
      </div>
    </main>
  );
}