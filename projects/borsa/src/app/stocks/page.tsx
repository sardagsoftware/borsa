'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Search, Filter, BarChart3, DollarSign } from 'lucide-react';
import { getStocks } from '@/lib/api';
import { Stock } from '@/types/market';
import StockCard from '@/components/StockCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function StocksPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'change' | 'volume'>('name');
  const [filterBy, setFilterBy] = useState<'all' | 'gainers' | 'losers'>('all');

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStocks = async () => {
    try {
      const response = await getStocks();
      if (response.data) {
        setStocks(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStocks = stocks
    .filter(stock => {
      const matchesSearch = stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           stock.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterBy === 'gainers') return matchesSearch && stock.changePercent > 0;
      if (filterBy === 'losers') return matchesSearch && stock.changePercent < 0;
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return b.price - a.price;
        case 'change':
          return b.changePercent - a.changePercent;
        case 'volume':
          return b.volume - a.volume;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const stats = {
    total: stocks.length,
    gainers: stocks.filter(s => s.changePercent > 0).length,
    losers: stocks.filter(s => s.changePercent < 0).length,
    avgChange: stocks.length > 0 
      ? (stocks.reduce((sum, s) => sum + s.changePercent, 0) / stocks.length).toFixed(2)
      : '0'
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
          <h1 className="text-4xl font-bold neon-text mb-4">Hisse Senetleri</h1>
          <p className="text-xl text-gray-300">
            Amerikan hisse senetlerini canlı takip edin
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-accent-1" />
              <div>
                <p className="text-sm text-gray-400">Toplam Hisse</p>
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
              <DollarSign className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-400">Ortalama Değişim</p>
                <p className={`text-xl font-bold ${parseFloat(stats.avgChange) >= 0 ? 'text-gain' : 'text-loss'}`}>
                  {parseFloat(stats.avgChange) >= 0 ? '+' : ''}{stats.avgChange}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
          <div className="w-full md:w-96">
            <Input
              type="text"
              placeholder="Hisse ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-5 h-5" />}
              variant="neon"
            />
          </div>

          <div className="flex gap-4">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as 'all' | 'gainers' | 'losers')}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent-1"
            >
              <option value="all">Tümü</option>
              <option value="gainers">Yükselenler</option>
              <option value="losers">Düşenler</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'change' | 'volume')}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent-1"
            >
              <option value="name">İsme Göre</option>
              <option value="price">Fiyata Göre</option>
              <option value="change">Değişime Göre</option>
              <option value="volume">Hacme Göre</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Stocks Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {filteredStocks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Search className="w-24 h-24 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Hisse bulunamadı
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
            {filteredStocks.map((stock, index) => (
              <motion.div
                key={stock.symbol}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <StockCard stock={stock} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}