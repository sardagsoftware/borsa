'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, TrendingDown, Star, Plus, DollarSign, BarChart3, Activity, Calendar } from 'lucide-react';
import { getStock } from '@/lib/api';
import { Stock } from '@/types/market';
import LoadingSpinner from '@/components/LoadingSpinner';
import MarketChart from '@/components/MarketChart';

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = params.symbol as string;
  
  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<'1D' | '7D' | '30D' | '90D' | '1Y'>('30D');
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  const fetchStockData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getStock(symbol);
      if (response.data) {
        setStock(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stock data:', error);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    if (symbol) {
      fetchStockData();
    }
  }, [symbol, fetchStockData]);

  const formatMarketCap = (value?: number) => {
    if (!value) return 'N/A';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
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

  if (!stock) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-white mb-4">Hisse Senedi Bulunamadı</h1>
        <p className="text-gray-400 mb-8">{symbol} sembolü için veri bulunamadı.</p>
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

  const isPositive = stock.changePercent >= 0;

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
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white">{stock.symbol}</h1>
                  <div className={`flex items-center gap-1 ${isPositive ? 'text-gain' : 'text-loss'}`}>
                    {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    <span className="font-semibold">
                      {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <p className="text-gray-400">{stock.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-3xl font-bold text-white">${stock.price.toLocaleString()}</p>
                <p className={`text-sm ${isPositive ? 'text-gain' : 'text-loss'}`}>
                  {isPositive ? '+' : ''}${stock.change.toFixed(2)} bugün
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
              <MarketChart data={[stock]} type="stocks" />
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-accent-1" />
                  <span className="text-sm text-gray-400">Piyasa Değeri</span>
                </div>
                <p className="text-lg font-semibold text-white">
                  {formatMarketCap(stock.marketCap)}
                </p>
              </div>

              <div className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-accent-2" />
                  <span className="text-sm text-gray-400">Hacim</span>
                </div>
                <p className="text-lg font-semibold text-white">
                  {(stock.volume >= 1e6 ? `${(stock.volume / 1e6).toFixed(1)}M` : `${(stock.volume / 1e3).toFixed(1)}K`)}
                </p>
              </div>

              <div className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-400">F/K Oranı</span>
                </div>
                <p className="text-lg font-semibold text-white">
                  {stock.pe?.toFixed(1) || 'N/A'}
                </p>
              </div>

              <div className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-400">Temettü</span>
                </div>
                <p className="text-lg font-semibold text-white">
                  {stock.dividendYield ? `${stock.dividendYield.toFixed(2)}%` : 'N/A'}
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
            {/* 52 Week Range */}
            {stock.low52Week && stock.high52Week && (
              <div className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4 gradient-text">52 Hafta Aralığı</h3>
                <div className="space-y-4">
                  <div className="relative">
                    <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-loss via-yellow-500 to-gain rounded-full"
                        style={{
                          width: `${((stock.price - stock.low52Week) / (stock.high52Week - stock.low52Week)) * 100}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-sm">
                      <span className="text-loss">${stock.low52Week.toFixed(2)}</span>
                      <span className="text-gain">${stock.high52Week.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">En Düşük</p>
                      <p className="font-semibold text-white">${stock.low52Week.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">En Yüksek</p>
                      <p className="font-semibold text-white">${stock.high52Week.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                  <Activity className="w-5 h-5 text-blue-400" />
                  <span>Fiyat Alarmı Kur</span>
                </button>
              </div>
            </div>

            {/* Company Info */}
            <div className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4 gradient-text">Şirket Bilgileri</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Sembol:</span>
                  <span className="font-semibold text-white">{stock.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tam Adı:</span>
                  <span className="font-semibold text-white text-right">{stock.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Son Güncelleme:</span>
                  <span className="font-semibold text-white">
                    {new Date(stock.lastUpdated).toLocaleString('tr-TR')}
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