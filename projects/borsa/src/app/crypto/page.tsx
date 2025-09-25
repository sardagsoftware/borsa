'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Search, Coins, Trophy, BarChart3 } from 'lucide-react';
import { getCryptos } from '@/lib/api';
import { Crypto } from '@/types/market';
import CryptoCard from '@/components/CryptoCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import Input from '@/components/ui/Input';

export default function CryptoPage() {
  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'rank' | 'name' | 'price' | 'change' | 'volume'>('rank');
  const [filterBy, setFilterBy] = useState<'all' | 'gainers' | 'losers' | 'top10'>('all');

  useEffect(() => {
    fetchCryptos();
    const interval = setInterval(fetchCryptos, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCryptos = async () => {
    try {
      const response = await getCryptos();
      if (response.data) {
        setCryptos(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch cryptos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCryptos = cryptos
    .filter(crypto => {
      const matchesSearch = crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterBy === 'gainers') return matchesSearch && crypto.changePercent > 0;
      if (filterBy === 'losers') return matchesSearch && crypto.changePercent < 0;
      if (filterBy === 'top10') return matchesSearch && crypto.marketCapRank <= 10;
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rank':
          return a.marketCapRank - b.marketCapRank;
        case 'price':
          return b.price - a.price;
        case 'change':
          return b.changePercent - a.changePercent;
        case 'volume':
          return b.volume24h - a.volume24h;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const stats = {
    total: cryptos.length,
    gainers: cryptos.filter(c => c.changePercent > 0).length,
    losers: cryptos.filter(c => c.changePercent < 0).length,
    totalMarketCap: cryptos.reduce((sum, c) => sum + c.marketCap, 0),
    avgChange: cryptos.length > 0 
      ? (cryptos.reduce((sum, c) => sum + c.changePercent, 0) / cryptos.length).toFixed(2)
      : '0'
  };

  const formatMarketCap = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold neon-text mb-4">Kripto Paralar</h1>
          <p className="text-xl text-gray-300">
            En popüler kripto paraları canlı takip edin
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-accent-1" />
              <div>
                <p className="text-sm text-gray-400">Toplam Kripto</p>
                <p className="text-xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gain" />
              <div>
                <p className="text-sm text-gray-400">Yükselenler</p>
                <p className="text-xl font-bold text-white">{stats.gainers}</p>
              </div>
            </div>
          </div>

          <div className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-loss" />
              <div>
                <p className="text-sm text-gray-400">Düşenler</p>
                <p className="text-xl font-bold text-white">{stats.losers}</p>
              </div>
            </div>
          </div>

          <div className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-400">Toplam Piyasa</p>
                <p className="text-xl font-bold text-white">
                  {formatMarketCap(stats.totalMarketCap)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top 3 Cryptos */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold gradient-text mb-4 text-center">🏆 Top 3 Kripto</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cryptos
              .sort((a, b) => a.marketCapRank - b.marketCapRank)
              .slice(0, 3)
              .map((crypto, index) => (
                <motion.div
                  key={crypto.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="relative"
                >
                  <div className="absolute -top-2 -right-2 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm
                      ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'}`}>
                      {index + 1}
                    </div>
                  </div>
                  <CryptoCard crypto={crypto} />
                </motion.div>
              ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
          <div className="w-full md:w-96">
            <Input
              type="text"
              placeholder="Kripto ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-5 h-5" />}
              variant="neon"
            />
          </div>

          <div className="flex gap-4">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as 'all' | 'gainers' | 'losers' | 'top10')}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent-1"
            >
              <option value="all">Tümü</option>
              <option value="top10">Top 10</option>
              <option value="gainers">Yükselenler</option>
              <option value="losers">Düşenler</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rank' | 'name' | 'price' | 'change' | 'volume')}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent-1"
            >
              <option value="rank">Sıralamaya Göre</option>
              <option value="name">İsme Göre</option>
              <option value="price">Fiyata Göre</option>
              <option value="change">Değişime Göre</option>
              <option value="volume">Hacme Göre</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Cryptos Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {filteredCryptos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Search className="w-24 h-24 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Kripto bulunamadı
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Arama kriterlerinizi değiştirerek tekrar deneyin.
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredCryptos.map((crypto, index) => (
              <motion.div
                key={crypto.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                {crypto.marketCapRank <= 10 && (
                  <div className="absolute -top-2 -left-2 z-10">
                    <Trophy className="w-6 h-6 text-yellow-400" />
                  </div>
                )}
                <CryptoCard crypto={crypto} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}