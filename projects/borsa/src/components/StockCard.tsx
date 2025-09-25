'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Star, Eye } from 'lucide-react';
import { Stock } from '@/types/market';
import Link from 'next/link';

interface StockCardProps {
  stock: Stock;
  onAddToWatchlist?: (symbol: string) => void;
}

export default function StockCard({ stock, onAddToWatchlist }: StockCardProps) {
  const isPositive = stock.changePercent >= 0;
  
  const formatMarketCap = (value?: number) => {
    if (!value) return 'N/A';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  const formatVolume = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toLocaleString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      className="group neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 hover:shadow-lg hover:shadow-accent-1/20 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white group-hover:text-accent-1 transition-colors">
            {stock.symbol}
          </h3>
          <p className="text-sm text-gray-400 line-clamp-1" title={stock.name}>
            {stock.name}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddToWatchlist?.(stock.symbol)}
            className="p-2 text-gray-400 hover:text-yellow-400 transition-colors"
            title="İzleme listesine ekle"
          >
            <Star className="w-4 h-4" />
          </button>
          <Link
            href={`/stock/${stock.symbol}`}
            className="p-2 text-gray-400 hover:text-accent-1 transition-colors"
            title="Detayları görüntüle"
          >
            <Eye className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Price */}
      <div className="mb-4">
        <div className="flex items-end gap-2 mb-2">
          <span className="text-3xl font-bold text-white">
            ${stock.price.toLocaleString()}
          </span>
          <div className={`flex items-center gap-1 ${isPositive ? 'text-gain' : 'text-loss'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="font-semibold">
              {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className={`text-sm ${isPositive ? 'text-gain' : 'text-loss'}`}>
          {isPositive ? '+' : ''}${stock.change.toFixed(2)} bugün
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">Hacim</p>
          <p className="text-sm font-semibold text-white">
            {formatVolume(stock.volume)}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-gray-400 mb-1">Piyasa Değeri</p>
          <p className="text-sm font-semibold text-white">
            {formatMarketCap(stock.marketCap)}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-1">F/K Oranı</p>
          <p className="text-sm font-semibold text-white">
            {stock.pe ? stock.pe.toFixed(1) : 'N/A'}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-1">Temettü</p>
          <p className="text-sm font-semibold text-white">
            {stock.dividendYield ? `${stock.dividendYield.toFixed(2)}%` : 'N/A'}
          </p>
        </div>
      </div>

      {/* 52 Week Range */}
      {stock.low52Week && stock.high52Week && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2">52 Hafta Aralığı</p>
          <div className="relative">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-loss via-yellow-500 to-gain rounded-full"
                style={{
                  width: `${((stock.price - stock.low52Week) / (stock.high52Week - stock.low52Week)) * 100}%`
                }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-400">
              <span>${stock.low52Week.toFixed(2)}</span>
              <span>${stock.high52Week.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-accent-1" />
          <span className="text-xs text-gray-400">
            Son güncelleme: {new Date(stock.lastUpdated).toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${isPositive ? 'bg-gain pulse-glow' : 'bg-loss'}`} />
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>
    </motion.div>
  );
}