'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, DollarSign, Globe } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MarketSummary } from '@/types/market';
import { getMarketSummary } from '@/lib/api';
import { formatMarketCap, formatPercent, getChangeColor } from '@/lib/utils';

export function MarketSummaryComponent() {
  const [marketData, setMarketData] = useState<MarketSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarketSummary = async () => {
      try {
        setLoading(true);
        const response = await getMarketSummary();
        if (response.error) {
          setError(response.error);
        } else {
          setMarketData(response.data);
          setError(null);
        }
      } catch (err) {
        setError('Failed to fetch market summary');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketSummary();
    const interval = setInterval(fetchMarketSummary, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !marketData) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-red-600">{error || 'No market data available'}</p>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      title: 'Total Market Cap',
      value: formatMarketCap(marketData.totalMarketCap),
      change: marketData.marketCapChange24h,
      icon: DollarSign,
      color: 'text-blue-500',
    },
    {
      title: '24h Volume',
      value: formatMarketCap(marketData.totalVolume24h),
      icon: BarChart3,
      color: 'text-green-500',
    },
    {
      title: 'BTC Dominance',
      value: `${marketData.btcDominance.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-orange-500',
    },
    {
      title: 'Active Coins',
      value: marketData.activeCurrencies.toLocaleString(),
      icon: Globe,
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  {stat.change !== undefined && (
                    <p className={`text-sm ${getChangeColor(stat.change)}`}>
                      {stat.change > 0 ? '+' : ''}{formatPercent(stat.change)}
                    </p>
                  )}
                </div>
                <div className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-800`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}