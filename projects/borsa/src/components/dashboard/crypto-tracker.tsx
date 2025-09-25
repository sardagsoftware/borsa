'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Coins, Crown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Crypto } from '@/types/market';
import { getCryptos } from '@/lib/api';
import { formatCurrency, formatPercent, formatMarketCap, getChangeColor } from '@/lib/utils';

export function CryptoTracker() {
  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCryptos = async () => {
      try {
        setLoading(true);
        const response = await getCryptos();
        if (response.error) {
          setError(response.error);
        } else {
          setCryptos(response.data);
          setError(null);
        }
      } catch (err) {
        setError('Failed to fetch crypto data');
      } finally {
        setLoading(false);
      }
    };

    fetchCryptos();
    const interval = setInterval(fetchCryptos, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-orange-500" />
            Cryptocurrency Market
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-500">
            <Coins className="h-5 w-5" />
            Cryptocurrency Market - Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-orange-500" />
          Cryptocurrency Market
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cryptos.map((crypto, index) => (
            <motion.div
              key={crypto.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {crypto.symbol.charAt(0)}
                    </span>
                  </div>
                  {crypto.marketCapRank <= 3 && (
                    <Crown className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
                  )}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {crypto.symbol.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                      #{crypto.marketCapRank}
                    </span>
                    {crypto.change > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {crypto.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Cap: {formatMarketCap(crypto.marketCap)}
                  </p>
                </div>
              </div>
              
              <div className="text-right space-y-1">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(crypto.price)}
                </p>
                <div className="flex items-center gap-1 text-sm">
                  <span className={getChangeColor(crypto.change)}>
                    {crypto.change > 0 ? '+' : ''}{formatCurrency(crypto.change)}
                  </span>
                  <span className={getChangeColor(crypto.change)}>
                    ({formatPercent(crypto.changePercent)})
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  <p>24h High: {formatCurrency(crypto.high24h)}</p>
                  <p>24h Low: {formatCurrency(crypto.low24h)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 pt-4 border-t border-gray-100"
        >
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
            <span>Powered by market data</span>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}