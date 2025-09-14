'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';

interface CoinData {
  rank: number;
  name: string;
  symbol: string;
  price: number;
  price_change_24h: number;
  market_cap: number;
  volume_24h: number;
}

interface CryptoTickerProps {
  showTop?: number;
  autoScroll?: boolean;
  updateInterval?: number;
}

export const CryptoPriceTicker: React.FC<CryptoTickerProps> = ({
  showTop = 20,
  autoScroll = true,
  updateInterval = 30000
}) => {
  const t = useTranslations();
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Fallback data from existing Binance API
  const fetchFallbackData = useCallback(async () => {
    try {
      const symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI'];
      const response = await fetch(`/api/crypto/prices?symbols=${symbols.join(',')}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const fallbackCoins = Object.entries(data.data).map(([symbol, info]: [string, unknown], index) => {
          const coinInfo = info as { price?: number; change24h?: number };
          return {
            rank: index + 1,
            name: symbol === 'BTC' ? 'Bitcoin' : 
                  symbol === 'ETH' ? 'Ethereum' : 
                  symbol === 'BNB' ? 'Binance Coin' : 
                  symbol === 'SOL' ? 'Solana' : symbol,
            symbol: symbol,
            price: coinInfo.price || 0,
            price_change_24h: coinInfo.change24h || 0,
            market_cap: (coinInfo.price || 0) * 1000000, // Mock market cap
            volume_24h: (coinInfo.price || 0) * 100000   // Mock volume
          };
        });
        
        setCoins(fallbackCoins.slice(0, showTop));
        setError(null);
      }
    } catch (err) {
      console.error('Fallback data fetch error:', err);
      setError('Failed to fetch cryptocurrency data');
    }
  }, [showTop]);

  // Fetch CoinMarketCap data
  const fetchCoinMarketCapData = useCallback(async () => {
    try {
      const response = await fetch(`/api/crypto/coinmarketcap?limit=${showTop}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setCoins(data.data.slice(0, showTop));
        setLastUpdate(new Date().toLocaleTimeString('tr-TR'));
        setError(null);
      } else {
        throw new Error('CoinMarketCap data fetch failed');
      }
    } catch (err) {
      console.error('CoinMarketCap fetch error:', err);
      setError((err as Error).message);
      
      // Fallback to Binance data if CoinMarketCap fails
      await fetchFallbackData();
    } finally {
      setLoading(false);
    }
  }, [showTop, fetchFallbackData]);

  // Initial fetch and interval setup
  useEffect(() => {
    fetchCoinMarketCapData();
    
    if (updateInterval > 0) {
      const interval = setInterval(fetchCoinMarketCapData, updateInterval);
      return () => clearInterval(interval);
    }
  }, [fetchCoinMarketCapData, updateInterval]);

  // Format price with appropriate precision
  const formatPrice = (price: number) => {
    if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else if (price >= 0.01) {
      return `$${price.toFixed(4)}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  };

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1e9) {
      return `$${(num / 1e9).toFixed(2)}B`;
    } else if (num >= 1e6) {
      return `$${(num / 1e6).toFixed(2)}M`;
    } else if (num >= 1e3) {
      return `$${(num / 1e3).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
          <span className="text-gray-300 text-sm">
            {t('crypto.loading') || 'Kripto veriler yükleniyor...'}
          </span>
        </div>
      </div>
    );
  }

  if (error && coins.length === 0) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
        <div className="text-red-400 text-sm text-center">
          ⚠️ {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 bg-yellow-500/10 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-yellow-500 font-semibold text-sm">
              {t('crypto.realtime') || 'Gerçek Zamanlı'} - Top {showTop}
            </span>
          </div>
          <div className="text-gray-400 text-xs">
            {t('crypto.lastUpdate') || 'Son güncelleme'}: {lastUpdate}
          </div>
        </div>
      </div>

      {/* Scrolling Ticker */}
      <div className="relative overflow-hidden">
        <div 
          className={`flex space-x-6 py-3 px-4 ${autoScroll ? 'animate-scroll' : ''}`}
          style={{
            animationDuration: autoScroll ? `${coins.length * 3}s` : 'none'
          }}
        >
          {coins.concat(coins).map((coin, index) => (
            <div 
              key={`${coin.symbol}-${index}`}
              className="flex-shrink-0 flex items-center space-x-3 min-w-[280px]"
            >
              {/* Rank */}
              <div className="text-gray-500 text-xs font-mono w-6 text-center">
                #{coin.rank}
              </div>
              
              {/* Coin Info */}
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="text-white font-bold text-sm">{coin.symbol}</span>
                  <span className="text-gray-400 text-xs">{coin.name}</span>
                </div>
                
                <div className="flex items-center space-x-2 mt-1">
                  {/* Price */}
                  <span className="text-yellow-500 font-mono text-sm">
                    {formatPrice(coin.price)}
                  </span>
                  
                  {/* 24h Change */}
                  <span 
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      coin.price_change_24h >= 0 
                        ? 'text-green-400 bg-green-900/30' 
                        : 'text-red-400 bg-red-900/30'
                    }`}
                  >
                    {coin.price_change_24h >= 0 ? '+' : ''}
                    {coin.price_change_24h.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Market Data */}
              <div className="flex flex-col text-xs text-gray-400">
                <div>
                  <span className="text-gray-500">Vol:</span> {formatNumber(coin.volume_24h)}
                </div>
                <div>
                  <span className="text-gray-500">Cap:</span> {formatNumber(coin.market_cap)}
                </div>
              </div>

              {/* Separator */}
              <div className="w-px h-8 bg-gray-700/50"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer with source attribution */}
      <div className="px-4 py-1 bg-gray-900/50 border-t border-gray-700/50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {t('crypto.source') || 'Veri Kaynağı'}: CoinMarketCap + Binance API
          </span>
          <div className="flex items-center space-x-2">
            <span>AiLydian Trader Pro</span>
            <div className="w-1 h-1 bg-yellow-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoPriceTicker;