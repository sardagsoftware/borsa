'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Stock } from '@/types/market';
import { getStocks } from '@/lib/api';
import { formatCurrency, formatPercent, formatVolume, getChangeColor } from '@/lib/utils';

export function StockTracker() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        const response = await getStocks();
        if (response.error) {
          setError(response.error);
        } else {
          setStocks(response.data);
          setError(null);
        }
      } catch (err) {
        setError('Failed to fetch stock data');
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
    const interval = setInterval(fetchStocks, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Stock Market
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
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
            <Activity className="h-5 w-5" />
            Stock Market - Error
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
          <Activity className="h-5 w-5 text-blue-500" />
          Stock Market
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stocks.map((stock, index) => (
            <motion.div
              key={stock.symbol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {stock.symbol}
                  </span>
                  {stock.change > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stock.name}
                </p>
                <p className="text-xs text-gray-500">
                  Vol: {formatVolume(stock.volume)}
                </p>
              </div>
              
              <div className="text-right space-y-1">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(stock.price)}
                </p>
                <div className="flex items-center gap-1 text-sm">
                  <span className={getChangeColor(stock.change)}>
                    {stock.change > 0 ? '+' : ''}{formatCurrency(stock.change)}
                  </span>
                  <span className={getChangeColor(stock.change)}>
                    ({formatPercent(stock.changePercent)})
                  </span>
                </div>
                {stock.pe && (
                  <p className="text-xs text-gray-500">
                    P/E: {stock.pe}
                  </p>
                )}
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
          <p className="text-xs text-gray-500 text-center">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
}