'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Coins, Star, Eye, Trophy } from 'lucide-react';
import { Crypto } from '@/types/market';
import Link from 'next/link';

interface CryptoCardProps {
  crypto: Crypto;
  onAddToWatchlist?: (id: string) => void;
}

export default function CryptoCard({ crypto, onAddToWatchlist }: CryptoCardProps) {
  const isPositive = crypto.changePercent >= 0;
  
  const formatMarketCap = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  const formatVolume = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
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

  const getRankIcon = (rank: number) => {
    if (rank <= 3) return <Trophy className="w-4 h-4" />;
    return <span className="text-xs font-bold">#{rank}</span>;
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
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-1 to-accent-2 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {crypto.symbol.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div className={`absolute -top-1 -right-1 flex items-center gap-1 ${getRankColor(crypto.marketCapRank)}`}>
              {getRankIcon(crypto.marketCapRank)}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white group-hover:text-accent-1 transition-colors">
              {crypto.symbol.toUpperCase()}
            </h3>
            <p className="text-sm text-gray-400 line-clamp-1" title={crypto.name}>
              {crypto.name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddToWatchlist?.(crypto.id)}
            className="p-2 text-gray-400 hover:text-yellow-400 transition-colors"
            title="İzleme listesine ekle"
          >
            <Star className="w-4 h-4" />
          </button>
          <Link
            href={`/crypto/${crypto.id}`}
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
            ${crypto.price.toLocaleString()}
          </span>
          <div className={`flex items-center gap-1 ${isPositive ? 'text-gain' : 'text-loss'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="font-semibold">
              {isPositive ? '+' : ''}{crypto.changePercent.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className={`text-sm ${isPositive ? 'text-gain' : 'text-loss'}`}>
          {isPositive ? '+' : ''}${crypto.change.toFixed(2)} son 24s
        </div>
      </div>

      {/* 24h Range */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-2">24 Saat Aralığı</p>
        <div className="relative">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-loss via-yellow-500 to-gain rounded-full"
              style={{
                width: `${((crypto.price - crypto.low24h) / (crypto.high24h - crypto.low24h)) * 100}%`
              }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>${crypto.low24h.toLocaleString()}</span>
            <span>${crypto.high24h.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">24s Hacim</p>
          <p className="text-sm font-semibold text-white">
            {formatVolume(crypto.volume24h)}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-gray-400 mb-1">Piyasa Değeri</p>
          <p className="text-sm font-semibold text-white">
            {formatMarketCap(crypto.marketCap)}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-1">Dolaşımdaki</p>
          <p className="text-sm font-semibold text-white">
            {formatSupply(crypto.circulatingSupply)}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-1">Toplam Arz</p>
          <p className="text-sm font-semibold text-white">
            {crypto.totalSupply ? formatSupply(crypto.totalSupply) : '∞'}
          </p>
        </div>
      </div>

      {/* ATH Info */}
      <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Tüm Zamanların En Yükseği</span>
          <span className="text-xs text-gray-400">
            {new Date(crypto.athDate).toLocaleDateString('tr-TR')}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">
            ${crypto.ath.toLocaleString()}
          </span>
          <span className="text-xs text-orange-400">
            {(((crypto.price - crypto.ath) / crypto.ath) * 100).toFixed(1)}% ATH&apos;den
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-accent-1" />
          <span className="text-xs text-gray-400">
            Son güncelleme: {new Date(crypto.lastUpdated).toLocaleTimeString('tr-TR', {
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