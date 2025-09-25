'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, TrendingUp, TrendingDown, Star, X } from 'lucide-react';
import { getStocks, getCryptos } from '@/lib/api';
import { Stock, Crypto } from '@/types/market';
import StockCard from '@/components/StockCard';
import CryptoCard from '@/components/CryptoCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface SearchFilters {
  type: 'all' | 'stocks' | 'crypto';
  priceRange: [number, number];
  changeFilter: 'all' | 'gainers' | 'losers';
  marketCapRange: [number, number];
  sortBy: 'name' | 'price' | 'change' | 'volume';
  sortOrder: 'asc' | 'desc';
}

export default function SearchPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    priceRange: [0, 10000],
    changeFilter: 'all',
    marketCapRange: [0, 5000000000000],
    sortBy: 'name',
    sortOrder: 'asc',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stocksResponse, cryptosResponse] = await Promise.all([
        getStocks(),
        getCryptos(),
      ]);

      if (stocksResponse.data) setStocks(stocksResponse.data);
      if (cryptosResponse.data) setCryptos(cryptosResponse.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = useMemo(() => {
    let allItems: (Stock | Crypto)[] = [];

    // Combine data based on type filter
    if (filters.type === 'all' || filters.type === 'stocks') {
      allItems = [...allItems, ...stocks];
    }
    if (filters.type === 'all' || filters.type === 'crypto') {
      allItems = [...allItems, ...cryptos];
    }

    // Search term filter
    if (searchTerm) {
      allItems = allItems.filter(item => {
        const name = item.name.toLowerCase();
        const symbol = item.symbol.toLowerCase();
        const search = searchTerm.toLowerCase();
        return name.includes(search) || symbol.includes(search);
      });
    }

    // Price range filter
    allItems = allItems.filter(item => 
      item.price >= filters.priceRange[0] && item.price <= filters.priceRange[1]
    );

    // Change filter
    if (filters.changeFilter === 'gainers') {
      allItems = allItems.filter(item => item.changePercent > 0);
    } else if (filters.changeFilter === 'losers') {
      allItems = allItems.filter(item => item.changePercent < 0);
    }

    // Market cap filter (only for items that have marketCap)
    allItems = allItems.filter(item => {
      const marketCap = 'marketCap' in item && item.marketCap ? item.marketCap : 0;
      return marketCap >= filters.marketCapRange[0] && marketCap <= filters.marketCapRange[1];
    });

    // Sort
    allItems.sort((a, b) => {
      let aValue: number | string, bValue: number | string;
      
      switch (filters.sortBy) {
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'change':
          aValue = a.changePercent;
          bValue = b.changePercent;
          break;
        case 'volume':
          aValue = 'volume' in a ? a.volume : ('volume24h' in a ? a.volume24h : 0);
          bValue = 'volume' in b ? b.volume : ('volume24h' in b ? b.volume24h : 0);
          break;
        case 'name':
        default:
          aValue = a.name;
          bValue = b.name;
          return filters.sortOrder === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
      }

      return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return allItems;
  }, [stocks, cryptos, searchTerm, filters]);

  const resetFilters = () => {
    setFilters({
      type: 'all',
      priceRange: [0, 10000],
      changeFilter: 'all',
      marketCapRange: [0, 5000000000000],
      sortBy: 'name',
      sortOrder: 'asc',
    });
    setSearchTerm('');
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
          <h1 className="text-4xl font-bold neon-text mb-4">Arama & Keşif</h1>
          <p className="text-xl text-gray-300">
            Hisse senetleri ve kripto paraları keşfedin
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto mb-6">
          <Input
            type="text"
            placeholder="Hisse senedi veya kripto para arayın..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-5 h-5" />}
            variant="neon"
            className="text-lg py-3"
          />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="neon"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtreler {showFilters ? <X className="w-4 h-4" /> : ''}
            </Button>
            
            {(searchTerm || filters.type !== 'all' || filters.changeFilter !== 'all') && (
              <Button
                variant="ghost"
                onClick={resetFilters}
                size="sm"
              >
                Filtreleri Temizle
              </Button>
            )}
          </div>

          <div className="text-sm text-gray-400">
            {filteredResults.length} sonuç bulundu
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tür
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value as 'all' | 'stocks' | 'crypto'})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent-1"
                >
                  <option value="all">Tümü</option>
                  <option value="stocks">Hisse Senetleri</option>
                  <option value="crypto">Kripto Paralar</option>
                </select>
              </div>

              {/* Change Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Değişim
                </label>
                <select
                  value={filters.changeFilter}
                  onChange={(e) => setFilters({...filters, changeFilter: e.target.value as 'all' | 'gainers' | 'losers'})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent-1"
                >
                  <option value="all">Tümü</option>
                  <option value="gainers">Yükselenler</option>
                  <option value="losers">Düşenler</option>
                </select>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sıralama
                </label>
                <div className="flex gap-2">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({...filters, sortBy: e.target.value as 'name' | 'price' | 'change' | 'volume'})}
                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent-1"
                  >
                    <option value="name">İsim</option>
                    <option value="price">Fiyat</option>
                    <option value="change">Değişim</option>
                    <option value="volume">Hacim</option>
                  </select>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => setFilters({...filters, sortOrder: e.target.value as 'asc' | 'desc'})}
                    className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent-1"
                  >
                    <option value="asc">A-Z</option>
                    <option value="desc">Z-A</option>
                  </select>
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fiyat Aralığı ($)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.priceRange[0]}
                    onChange={(e) => setFilters({
                      ...filters, 
                      priceRange: [Number(e.target.value), filters.priceRange[1]]
                    })}
                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent-1"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.priceRange[1]}
                    onChange={(e) => setFilters({
                      ...filters, 
                      priceRange: [filters.priceRange[0], Number(e.target.value)]
                    })}
                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-accent-1"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-accent-1" />
              <div>
                <p className="text-sm text-gray-400">Toplam Sonuç</p>
                <p className="text-xl font-bold text-white">{filteredResults.length}</p>
              </div>
            </div>
          </div>

          <div className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gain" />
              <div>
                <p className="text-sm text-gray-400">Yükselenler</p>
                <p className="text-xl font-bold text-white">
                  {filteredResults.filter(item => item.changePercent > 0).length}
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
                  {filteredResults.filter(item => item.changePercent < 0).length}
                </p>
              </div>
            </div>
          </div>

          <div className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-400">Ortalama Değişim</p>
                <p className="text-xl font-bold text-white">
                  {filteredResults.length > 0 
                    ? `${(filteredResults.reduce((sum, item) => sum + item.changePercent, 0) / filteredResults.length).toFixed(2)}%`
                    : '0%'
                  }
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {filteredResults.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Search className="w-24 h-24 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Sonuç bulunamadı
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Arama kriterlerinizi değiştirerek tekrar deneyin.
            </p>
            <Button onClick={resetFilters}>
              Filtreleri Temizle
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredResults.map((item, index) => (
              <motion.div
                key={`${item.symbol}-${index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                {'pe' in item ? (
                  <StockCard stock={item as Stock} />
                ) : (
                  <CryptoCard crypto={item as Crypto} />
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}