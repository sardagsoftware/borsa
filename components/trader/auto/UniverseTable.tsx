'use client';

import React, { useState } from 'react';

interface UniverseEntry {
  id: string;
  symbol: string;
  marketCap: number;
  price: number;
  change24h: number;
  volume24h: number;
  futuresSymbol?: string;
  liquidityScore: number;
  volatility: number;
  signal: number; // -100 to +100
  lastUpdate: string;
  status: 'active' | 'paused' | 'excluded';
}

interface UniverseTableProps {
  data: UniverseEntry[];
  loading: boolean;
}

const MOCK_DATA: UniverseEntry[] = [
  {
    id: 'btc',
    symbol: 'BTC',
    marketCap: 821000000000,
    price: 42350.75,
    change24h: 2.47,
    volume24h: 18500000000,
    futuresSymbol: 'BTCUSDT',
    liquidityScore: 98.5,
    volatility: 3.2,
    signal: 73,
    lastUpdate: '2024-01-15T10:30:00Z',
    status: 'active'
  },
  {
    id: 'eth',
    symbol: 'ETH',
    marketCap: 289000000000,
    price: 2587.45,
    change24h: 1.89,
    volume24h: 12300000000,
    futuresSymbol: 'ETHUSDT',
    liquidityScore: 95.2,
    volatility: 4.1,
    signal: 61,
    lastUpdate: '2024-01-15T10:30:00Z',
    status: 'active'
  },
  {
    id: 'bnb',
    symbol: 'BNB',
    marketCap: 45600000000,
    price: 312.89,
    change24h: -0.76,
    volume24h: 1850000000,
    futuresSymbol: 'BNBUSDT',
    liquidityScore: 87.3,
    volatility: 2.8,
    signal: -28,
    lastUpdate: '2024-01-15T10:29:45Z',
    status: 'active'
  },
];

export default function UniverseTable({ data = MOCK_DATA, loading }: UniverseTableProps) {
  const [sortBy, setSortBy] = useState<keyof UniverseEntry>('marketCap');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish'>('all');

  const handleSort = (column: keyof UniverseEntry) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  const formatNumber = (num: number, type: 'currency' | 'percentage' | 'score' | 'large') => {
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(num);
      case 'percentage':
        return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
      case 'score':
        return num.toFixed(1);
      case 'large':
        if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
        if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
        if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
        return `$${num.toFixed(2)}`;
      default:
        return num.toString();
    }
  };

  const getSignalColor = (signal: number) => {
    if (signal >= 50) return 'text-[#0ECB81]';
    if (signal >= 20) return 'text-[#F0B90B]';
    if (signal >= -20) return 'text-gray-400';
    if (signal >= -50) return 'text-orange-400';
    return 'text-[#F6465D]';
  };

  const getSignalBar = (signal: number) => {
    const width = Math.abs(signal);
    const color = signal >= 0 ? '#0ECB81' : '#F6465D';
    return (
      <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${width}%`,
            backgroundColor: color,
            marginLeft: signal < 0 ? `${100 - width}%` : '0'
          }}
        ></div>
      </div>
    );
  };

  const filteredData = data.filter(item => {
    if (filter === 'bullish') return item.signal > 20;
    if (filter === 'bearish') return item.signal < -20;
    return true;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    const aVal = a[sortBy] ?? 0;
    const bVal = b[sortBy] ?? 0;
    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  if (loading) {
    return (
      <div className="bg-[#1E2329] border-[#2B3139] border rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-800 rounded mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1E2329] border-[#2B3139] border rounded-lg">
      
      {/* Header */}
      <div className="p-4 border-b border-[#2B3139]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Top 100 Universe</h3>
          <div className="flex items-center gap-4">
            
            {/* Filter Buttons */}
            <div className="flex bg-[#2B3139] rounded-lg p-1">
              {[
                { key: 'all', label: 'All' },
                { key: 'bullish', label: 'Bullish' },
                { key: 'bearish', label: 'Bearish' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    filter === key
                      ? 'bg-[#0ECB81] text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className="text-sm text-gray-400">
              {sortedData.length} symbols • {sortedData.filter(s => s.signal > 20).length} bullish • {sortedData.filter(s => s.signal < -20).length} bearish
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2B3139] text-gray-400 text-sm">
              <th className="text-left p-3 font-medium">Rank</th>
              <th className="text-left p-3 font-medium cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('symbol')}>
                Symbol {sortBy === 'symbol' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-right p-3 font-medium cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('price')}>
                Price {sortBy === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-right p-3 font-medium cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('change24h')}>
                24h {sortBy === 'change24h' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-right p-3 font-medium cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('marketCap')}>
                Market Cap {sortBy === 'marketCap' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-right p-3 font-medium cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('volume24h')}>
                Volume {sortBy === 'volume24h' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-center p-3 font-medium cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('liquidityScore')}>
                Liquidity {sortBy === 'liquidityScore' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-center p-3 font-medium cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('signal')}>
                Signal {sortBy === 'signal' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-center p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, index) => (
              <tr key={item.id} className="border-b border-[#2B3139] hover:bg-[#2B3139] transition-colors">
                <td className="p-3 text-gray-400 font-medium">{index + 1}</td>
                <td className="p-3">
                  <div className="flex flex-col">
                    <span className="text-white font-bold">{item.symbol}</span>
                    {item.futuresSymbol && (
                      <span className="text-xs text-gray-400">{item.futuresSymbol}</span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-right text-white font-mono">
                  {formatNumber(item.price, 'currency')}
                </td>
                <td className="p-3 text-right">
                  <div className={`flex items-center justify-end gap-1 ${
                    item.change24h >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'
                  }`}>
                    {item.change24h >= 0 ? (
                      <span className="text-xs">▲</span>
                    ) : (
                      <span className="text-xs">▼</span>
                    )}
                    <span className="font-mono">{formatNumber(item.change24h, 'percentage')}</span>
                  </div>
                </td>
                <td className="p-3 text-right text-gray-300 font-mono">
                  {formatNumber(item.marketCap, 'large')}
                </td>
                <td className="p-3 text-right text-gray-300 font-mono">
                  {formatNumber(item.volume24h, 'large')}
                </td>
                <td className="p-3 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`font-mono text-sm ${
                      item.liquidityScore >= 90 ? 'text-[#0ECB81]' :
                      item.liquidityScore >= 70 ? 'text-[#F0B90B]' : 'text-gray-400'
                    }`}>
                      {formatNumber(item.liquidityScore, 'score')}
                    </span>
                    <div className={`w-8 h-1 rounded-full ${
                      item.liquidityScore >= 90 ? 'bg-[#0ECB81]' :
                      item.liquidityScore >= 70 ? 'bg-[#F0B90B]' : 'bg-gray-600'
                    }`}></div>
                  </div>
                </td>
                <td className="p-3 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className={`font-mono text-sm font-bold ${getSignalColor(item.signal)}`}>
                      {item.signal > 0 ? '+' : ''}{item.signal}
                    </span>
                    {getSignalBar(item.signal)}
                  </div>
                </td>
                <td className="p-3 text-center">
                  <div className={`w-2 h-2 rounded-full mx-auto ${
                    item.status === 'active' ? 'bg-[#0ECB81]' :
                    item.status === 'paused' ? 'bg-[#F0B90B]' : 'bg-gray-600'
                  }`}></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#2B3139] text-sm text-gray-400">
        Last updated: {new Date().toLocaleString()} • Scanning every 30s • Real-time futures data
      </div>
    </div>
  );
}
