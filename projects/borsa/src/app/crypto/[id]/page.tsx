'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, TrendingDown, Star, Plus, Coins, BarChart3, Trophy, Calendar } from 'lucide-react';
import { getCrypto } from '@/lib/api';
import { Crypto } from '@/types/market';
import LoadingSpinner from '@/components/LoadingSpinner';
import MarketChart from '@/components/MarketChart';

export default function CryptoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [crypto, setCrypto] = useState<Crypto | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<'1D' | '7D' | '30D' | '90D' | '1Y'>('30D');
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  const fetchCryptoData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCrypto(id);
      if (response.data) {
        setCrypto(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch crypto data:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchCryptoData();
    }
  }, [id, fetchCryptoData]);

  const formatMarketCap = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  const formatSupply = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toLocaleString();
  };

  const getRankColor = (rank: number) => {
    if (rank <= 3) return 'text-yellow-400';
    if (rank <= 10) return 'text-accent-1';
    if (rank <= 50) return 'text-accent-2';
    return 'text-gray-400';
  };

  const toggleWatchlist = () => {
    setIsWatchlisted(!isWatchlisted);
    // TODO: API call to add/remove from watchlist
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!crypto) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-white mb-4">Kripto Para Bulunamadı</h1>
        <p className="text-gray-400 mb-8">{id} için veri bulunamadı.</p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 gradient-bg text-white rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri Dön
        </button>
      </div>
    );
  }

  const isPositive = crypto.changePercent >= 0;

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-16 z-40 bg-dark-bg/95 backdrop-blur-lg border-b border-gray-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-1 to-accent-2 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {crypto.symbol.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  {crypto.marketCapRank <= 3 && (
                    <Trophy className={`w-4 h-4 absolute -top-1 -right-1 ${getRankColor(crypto.marketCapRank)}`} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-white">{crypto.symbol.toUpperCase()}</h1>
                    <span className={`text-xs px-2 py-1 rounded-full ${getRankColor(crypto.marketCapRank)} bg-gray-800`}>
                      #{crypto.marketCapRank}
                    </span>
                    <div className={`flex items-center gap-1 ${isPositive ? 'text-gain' : 'text-loss'}`}>
                      {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      <span className="font-semibold">
                        {isPositive ? '+' : ''}{crypto.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-400">{crypto.name}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-3xl font-bold text-white">${crypto.price.toLocaleString()}</p>
                <p className={`text-sm ${isPositive ? 'text-gain' : 'text-loss'}`}>
                  {isPositive ? '+' : ''}${crypto.change.toFixed(2)} son 24s
                </p>
              </div>
              <button
                onClick={toggleWatchlist}
                className={`p-3 rounded-lg transition-all ${
                  isWatchlisted 
                    ? 'bg-yellow-500 text-white' 
                    : 'neon-border text-gray-400 hover:text-yellow-400'
                }`}
              >
                <Star className="w-5 h-5" fill={isWatchlisted ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Chart */}
            <div className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold gradient-text">Fiyat Grafiği</h2>
                <div className="flex bg-gray-800 rounded-lg p-1">
                  {['1D', '7D', '30D', '90D', '1Y'].map((period) => (
                    <button
                      key={period}
                      onClick={() => setChartPeriod(period as '1D' | '7D' | '30D' | '90D' | '1Y')}
                      className={`px-3 py-1 rounded-md text-sm transition-colors ${
                        chartPeriod === period
                          ? 'bg-accent-1 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              <MarketChart data={[crypto]} type="crypto" />
            </div>

            {/* 24h Range */}
            <div className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4 gradient-text">24 Saat Aralığı</h3>
              <div className="relative mb-4">
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-loss via-yellow-500 to-gain rounded-full"
                    style={{
                      width: `${((crypto.price - crypto.low24h) / (crypto.high24h - crypto.low24h)) * 100}%`
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-loss">${crypto.low24h.toLocaleString()}</span>
                  <span className="text-gain">${crypto.high24h.toLocaleString()}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">24s En Düşük</p>
                  <p className="font-semibold text-white">${crypto.low24h.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400">24s En Yüksek</p>
                  <p className="font-semibold text-white">${crypto.high24h.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-accent-1" />
                  <span className="text-sm text-gray-400">Piyasa Değeri</span>
                </div>
                <p className="text-lg font-semibold text-white">
                  {formatMarketCap(crypto.marketCap)}
                </p>
              </div>

              <div className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-4 h-4 text-accent-2" />
                  <span className="text-sm text-gray-400">24s Hacim</span>
                </div>
                <p className="text-lg font-semibold text-white">
                  {formatMarketCap(crypto.volume24h)}
                </p>
              </div>

              <div className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-gray-400">Sıralama</span>
                </div>
                <p className="text-lg font-semibold text-white">
                  #{crypto.marketCapRank}
                </p>
              </div>

              <div className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-400">Dolaşımda</span>
                </div>
                <p className="text-lg font-semibold text-white">
                  {formatSupply(crypto.circulatingSupply)}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Info Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* ATH Info */}
            <div className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4 gradient-text">Tüm Zamanların En Yükseği</h3>
              <div className="space-y-4">
                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                  <p className="text-3xl font-bold text-white mb-2">
                    ${crypto.ath.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-400 mb-2">
                    {new Date(crypto.athDate).toLocaleDateString('tr-TR')}
                  </p>
                  <p className="text-sm text-orange-400">
            {(((crypto.price - crypto.ath) / crypto.ath) * 100).toFixed(1)}% ATH&apos;den
                  </p>
                </div>
              </div>
            </div>

            {/* Supply Info */}
            <div className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4 gradient-text">Arz Bilgileri</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Dolaşımdaki:</span>
                  <span className="font-semibold text-white">{formatSupply(crypto.circulatingSupply)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Toplam Arz:</span>
                  <span className="font-semibold text-white">
                    {crypto.totalSupply ? formatSupply(crypto.totalSupply) : '∞'}
                  </span>
                </div>
                {crypto.totalSupply && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Dolaşım Oranı</span>
                      <span>{((crypto.circulatingSupply / crypto.totalSupply) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent-1 rounded-full"
                        style={{ width: `${(crypto.circulatingSupply / crypto.totalSupply) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4 gradient-text">Hızlı İşlemler</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors">
                  <Plus className="w-5 h-5 text-accent-1" />
                  <span>Portföye Ekle</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span>İzleme Listesine Ekle</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <span>Fiyat Alarmı Kur</span>
                </button>
              </div>
            </div>

            {/* Crypto Info */}
            <div className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4 gradient-text">Kripto Bilgileri</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Sembol:</span>
                  <span className="font-semibold text-white">{crypto.symbol.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tam Adı:</span>
                  <span className="font-semibold text-white text-right">{crypto.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sıralama:</span>
                  <span className="font-semibold text-white">#{crypto.marketCapRank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Son Güncelleme:</span>
                  <span className="font-semibold text-white">
                    {new Date(crypto.lastUpdated).toLocaleString('tr-TR')}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}