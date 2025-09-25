'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Search, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { getStocks, getCryptos } from '@/lib/api';
import { Stock, Crypto, WatchlistItem } from '@/types/market';
import StockCard from '@/components/StockCard';
import CryptoCard from '@/components/CryptoCard';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'stocks' | 'crypto'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'change' | 'price'>('name');

  useEffect(() => {
    fetchWatchlistData();
    // Load watchlist from localStorage
    const savedWatchlist = localStorage.getItem('borsa-watchlist');
    if (savedWatchlist) {
      setWatchlist(JSON.parse(savedWatchlist));
    }
  }, []);

  const fetchWatchlistData = async () => {
    try {
      setLoading(true);
      const [stocksResponse, cryptosResponse] = await Promise.all([
        getStocks(),
        getCryptos(),
      ]);

      if (stocksResponse.data) setStocks(stocksResponse.data);
      if (cryptosResponse.data) setCryptos(cryptosResponse.data);
    } catch (error) {
      console.error('Failed to fetch watchlist data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = (symbol: string, type: 'stock' | 'crypto') => {
    const newItem: WatchlistItem = {
      type,
      symbol,
      addedAt: new Date().toISOString(),
    };

    const updatedWatchlist = [...watchlist, newItem];
    setWatchlist(updatedWatchlist);
    localStorage.setItem('borsa-watchlist', JSON.stringify(updatedWatchlist));
  };

  const removeFromWatchlist = (symbol: string) => {
    const updatedWatchlist = watchlist.filter(item => item.symbol !== symbol);
    setWatchlist(updatedWatchlist);
    localStorage.setItem('borsa-watchlist', JSON.stringify(updatedWatchlist));
  };

  const isInWatchlist = (symbol: string) => {
    return watchlist.some(item => item.symbol === symbol);
  };

  const getWatchlistItems = () => {
    const watchlistItems: (Stock | Crypto)[] = [];
    
    watchlist.forEach(item => {
      if (item.type === 'stock') {
        const stock = stocks.find(s => s.symbol === item.symbol);
        if (stock) watchlistItems.push(stock);
      } else {
        const crypto = cryptos.find(c => c.symbol.toLowerCase() === item.symbol.toLowerCase());
        if (crypto) watchlistItems.push(crypto);
      }
    });

    // Filter by search term
    const filtered = watchlistItems.filter(item => {
      const name = item.name;
      const symbol = item.symbol;
      const searchLower = searchTerm.toLowerCase();
      
      return name.toLowerCase().includes(searchLower) || 
             symbol.toLowerCase().includes(searchLower);
    });

    // Filter by type
    const typeFiltered = filterType === 'all' ? filtered : 
      filtered.filter(item => {
        if (filterType === 'stocks') return 'pe' in item;
        if (filterType === 'crypto') return 'marketCapRank' in item;
        return true;
      });

    // Sort
    return typeFiltered.sort((a, b) => {
      switch (sortBy) {
        case 'change':
          return b.changePercent - a.changePercent;
        case 'price':
          return b.price - a.price;
        case 'name':
        default:
          const aName = a.name;
          const bName = b.name;
          return aName.localeCompare(bName);
      }
    });
  };

  const watchlistItems = getWatchlistItems();

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
          <h1 className="text-4xl font-bold neon-text mb-4">İzleme Listesi</h1>
          <p className="text-xl text-gray-300">
            Favori hisse senetlerinizi ve kripto paralarınızı takip edin
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Arama yapın..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-accent-1"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-800 rounded-lg p-1">
              {[
                { key: 'all', label: 'Tümü' },
                { key: 'stocks', label: 'Hisse' },
                { key: 'crypto', label: 'Kripto' },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setFilterType(filter.key as 'all' | 'stocks' | 'crypto')}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    filterType === filter.key
                      ? 'bg-accent-1 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'change' | 'price')}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent-1"
            >
              <option value="name">Ada Göre</option>
              <option value="change">Değişime Göre</option>
              <option value="price">Fiyata Göre</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-400">Toplam İzlenen</p>
                <p className="text-xl font-bold text-white">{watchlist.length}</p>
              </div>
            </div>
          </div>

          <div className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gain" />
              <div>
                <p className="text-sm text-gray-400">Yükselenler</p>
                <p className="text-xl font-bold text-white">
                  {watchlistItems.filter(item => item.changePercent > 0).length}
                </p>
              </div>
            </div>
          </div>

          <div className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-loss" />
              <div>
                <p className="text-sm text-gray-400">Düşenler</p>
                <p className="text-xl font-bold text-white">
                  {watchlistItems.filter(item => item.changePercent < 0).length}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Watchlist Items */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {watchlistItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Star className="w-24 h-24 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">
              İzleme listeniz boş
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Favori hisse senetlerinizi ve kripto paralarınızı ekleyerek takibe başlayın.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/dashboard'}
              className="gradient-bg text-white px-6 py-3 rounded-lg font-semibold"
            >
              Dashboard&apos;a Git
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {watchlistItems.map((item, index) => (
              <motion.div
                key={`${item.symbol}-${index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {'pe' in item ? (
                  <StockCard 
                    stock={item as Stock} 
                    onAddToWatchlist={(symbol) => {
                      if (isInWatchlist(symbol)) {
                        removeFromWatchlist(symbol);
                      } else {
                        addToWatchlist(symbol, 'stock');
                      }
                    }}
                  />
                ) : (
                  <CryptoCard 
                    crypto={item as Crypto} 
                    onAddToWatchlist={(_id) => {
                      if (isInWatchlist((item as Crypto).symbol)) {
                        removeFromWatchlist((item as Crypto).symbol);
                      } else {
                        addToWatchlist((item as Crypto).symbol, 'crypto');
                      }
                    }}
                  />
                )}
                
                {/* Remove from watchlist button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => removeFromWatchlist(item.symbol)}
                  className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                  title="İzleme listesinden çıkar"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}