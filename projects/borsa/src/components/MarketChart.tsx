'use client';

import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Stock, Crypto } from '@/types/market';
import { getPriceHistory } from '@/lib/api';

interface MarketChartProps {
  data: Stock[] | Crypto[];
  type: 'stocks' | 'crypto';
}

export default function MarketChart({ data, type }: MarketChartProps) {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [chartData, setChartData] = useState<Array<{ date: string; price: number; volume: number; timestamp: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'area'>('area');

  useEffect(() => {
    if (data.length > 0) {
      const firstItem = data[0];
      const symbol = type === 'stocks' ? (firstItem as Stock).symbol : (firstItem as Crypto).symbol;
      setSelectedSymbol(symbol);
    }
  }, [data, type]);

  const fetchChartData = useCallback(async (symbol: string) => {
    setLoading(true);
    try {
      const response = await getPriceHistory(symbol, type === 'stocks' ? 'stock' : 'crypto', 30);
      if (response.data) {
        const formattedData = response.data.map(item => ({
          date: new Date(item.timestamp).toLocaleDateString('tr-TR', { 
            month: 'short', 
            day: 'numeric' 
          }),
          price: item.price,
          volume: item.volume || 0,
          timestamp: item.timestamp
        }));
        setChartData(formattedData);
      }
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    if (selectedSymbol) {
      fetchChartData(selectedSymbol);
    }
  }, [selectedSymbol, fetchChartData]);

  const selectedItem = data.find(item => 
    type === 'stocks' 
      ? (item as Stock).symbol === selectedSymbol
      : (item as Crypto).symbol === selectedSymbol
  );

  const isPositive = selectedItem ? selectedItem.changePercent >= 0 : true;
  const gradientId = `gradient-${selectedSymbol}`;

  return (
    <div className="space-y-4">
      {/* Chart Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-1"
          >
            {data.map(item => {
              const symbol = type === 'stocks' ? (item as Stock).symbol : (item as Crypto).symbol;
              const name = type === 'stocks' ? (item as Stock).name : (item as Crypto).name;
              return (
                <option key={symbol} value={symbol}>
                  {symbol} - {name}
                </option>
              );
            })}
          </select>

          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setChartType('area')}
              className={`p-2 rounded-md transition-colors ${
                chartType === 'area' 
                  ? 'bg-accent-1 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <AreaChart className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`p-2 rounded-md transition-colors ${
                chartType === 'line' 
                  ? 'bg-accent-1 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" />
            </button>
          </div>
        </div>

        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 text-right"
          >
            <div>
              <p className="text-2xl font-bold">${selectedItem.price.toLocaleString()}</p>
              <div className={`flex items-center gap-1 ${isPositive ? 'text-gain' : 'text-loss'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="font-semibold">
                  {isPositive ? '+' : ''}{selectedItem.changePercent.toFixed(2)}%
                </span>
                <span className="text-sm text-gray-400">
                  (${selectedItem.change > 0 ? '+' : ''}{selectedItem.change.toFixed(2)})
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-80 w-full"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-1"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop 
                      offset="5%" 
                      stopColor={isPositive ? '#10b981' : '#ef4444'} 
                      stopOpacity={0.3}
                    />
                    <stop 
                      offset="95%" 
                      stopColor={isPositive ? '#10b981' : '#ef4444'} 
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={['dataMin * 0.98', 'dataMax * 1.02']}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Fiyat']}
                  labelStyle={{ color: '#9CA3AF' }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={isPositive ? '#10b981' : '#ef4444'}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  dot={false}
                />
              </AreaChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={['dataMin * 0.98', 'dataMax * 1.02']}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Fiyat']}
                  labelStyle={{ color: '#9CA3AF' }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={isPositive ? '#10b981' : '#ef4444'}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ 
                    r: 6, 
                    fill: isPositive ? '#10b981' : '#ef4444',
                    stroke: '#fff',
                    strokeWidth: 2
                  }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Chart Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-gray-400">Son 30 Gün</p>
          <p className="font-semibold text-white">
            {chartData.length > 0 ? `${chartData.length} veri noktası` : 'Yükleniyor...'}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-gray-400">En Yüksek</p>
          <p className="font-semibold text-gain">
            ${chartData.length > 0 ? Math.max(...chartData.map(d => d.price)).toLocaleString() : '---'}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-gray-400">En Düşük</p>
          <p className="font-semibold text-loss">
            ${chartData.length > 0 ? Math.min(...chartData.map(d => d.price)).toLocaleString() : '---'}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-gray-400">Ortalama</p>
          <p className="font-semibold text-white">
            ${chartData.length > 0 ? (chartData.reduce((sum, d) => sum + d.price, 0) / chartData.length).toLocaleString() : '---'}
          </p>
        </div>
      </div>
    </div>
  );
}