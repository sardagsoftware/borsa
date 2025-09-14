'use client';

import React, { useState } from 'react';

interface JournalEntry {
  id: string;
  timestamp: string;
  type: 'signal' | 'decision' | 'order' | 'fill' | 'pnl' | 'error';
  symbol: string;
  action: string;
  details: string;
  data?: any;
  status: 'success' | 'warning' | 'error' | 'info';
}

interface JournalViewProps {
  entries: JournalEntry[];
  maxEntries?: number;
}

const MOCK_ENTRIES: JournalEntry[] = [
  {
    id: '1',
    timestamp: '2024-01-15T10:45:30Z',
    type: 'signal',
    symbol: 'BTCUSDT',
    action: 'Generated Strong Buy Signal',
    details: 'Ensemble score: +73, Confidence: 87%. All indicators aligned: Trend(+65), Momentum(+78), Volume(+82), Micro(+68), Regime(TREND)',
    status: 'success',
    data: { signal: 73, confidence: 0.87 }
  },
  {
    id: '2', 
    timestamp: '2024-01-15T10:45:32Z',
    type: 'decision',
    symbol: 'BTCUSDT',
    action: 'Policy Decision: BUY',
    details: 'Risk checks passed. Position size: 1.2% (Kelly: 1.8%, Risk-adjusted: 1.2%). Entry: $42,350.75',
    status: 'success',
    data: { positionSize: 1.2, kelly: 1.8, entry: 42350.75 }
  },
  {
    id: '3',
    timestamp: '2024-01-15T10:45:35Z',
    type: 'order',
    symbol: 'BTCUSDT',
    action: 'Market Buy Order Placed',
    details: 'Order ID: 1234567890. Quantity: 0.028 BTC (~$1,200). Stop: $41,500, Target: $43,800',
    status: 'info',
    data: { orderId: '1234567890', quantity: 0.028, stop: 41500, target: 43800 }
  },
  {
    id: '4',
    timestamp: '2024-01-15T10:45:37Z',
    type: 'fill',
    symbol: 'BTCUSDT',
    action: 'Order Filled',
    details: 'Filled at $42,351.20 (slippage: +$0.45). Position opened successfully.',
    status: 'success',
    data: { fillPrice: 42351.20, slippage: 0.45 }
  },
  {
    id: '5',
    timestamp: '2024-01-15T10:44:15Z',
    type: 'signal',
    symbol: 'ETHUSDT',
    action: 'Generated Buy Signal',
    details: 'Ensemble score: +58, Confidence: 72%. Pre-breakout detected on 4H timeframe.',
    status: 'success',
    data: { signal: 58, confidence: 0.72 }
  },
  {
    id: '6',
    timestamp: '2024-01-15T10:44:17Z',
    type: 'decision',
    symbol: 'ETHUSDT', 
    action: 'Policy Decision: HOLD',
    details: 'Signal strength below minimum threshold (60). Correlation with BTC too high (0.89). Waiting for better opportunity.',
    status: 'warning',
    data: { reason: 'threshold', correlation: 0.89 }
  },
  {
    id: '7',
    timestamp: '2024-01-15T10:42:22Z',
    type: 'pnl',
    symbol: 'ADAUSDT',
    action: 'Position Closed - Profit',
    details: 'Sold 2,450 ADA at $0.487 (bought at $0.464). Profit: +$56.35 (+4.96%). Hold time: 2h 34m',
    status: 'success',
    data: { pnl: 56.35, percentage: 4.96, holdTime: '2h 34m' }
  },
  {
    id: '8',
    timestamp: '2024-01-15T10:40:45Z',
    type: 'error',
    symbol: 'BNBUSDT',
    action: 'Order Rejected',
    details: 'Insufficient margin for position size. Required: $890, Available: $745. Order cancelled.',
    status: 'error',
    data: { required: 890, available: 745 }
  }
];

export default function JournalView({ entries = MOCK_ENTRIES, maxEntries = 50 }: JournalViewProps) {
  const [filter, setFilter] = useState<'all' | 'signal' | 'order' | 'pnl' | 'error'>('all');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('all');

  const getTypeConfig = (type: JournalEntry['type']) => {
    switch (type) {
      case 'signal':
        return { icon: '📊', color: '#0ECB81', label: 'Signal' };
      case 'decision':
        return { icon: '🧠', color: '#F0B90B', label: 'Decision' };
      case 'order':
        return { icon: '📤', color: '#06B6D4', label: 'Order' };
      case 'fill':
        return { icon: '✅', color: '#0ECB81', label: 'Fill' };
      case 'pnl':
        return { icon: '💰', color: '#0ECB81', label: 'P&L' };
      case 'error':
        return { icon: '❌', color: '#F6465D', label: 'Error' };
    }
  };

  const getStatusConfig = (status: JournalEntry['status']) => {
    switch (status) {
      case 'success':
        return { bg: 'bg-[#0ECB81]', text: 'text-black' };
      case 'warning':
        return { bg: 'bg-[#F0B90B]', text: 'text-black' };
      case 'error':
        return { bg: 'bg-[#F6465D]', text: 'text-white' };
      case 'info':
        return { bg: 'bg-blue-600', text: 'text-white' };
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const symbols = Array.from(new Set(entries.map(e => e.symbol)));
  
  const filteredEntries = entries
    .filter(entry => filter === 'all' || entry.type === filter)
    .filter(entry => selectedSymbol === 'all' || entry.symbol === selectedSymbol)
    .slice(0, maxEntries);

  return (
    <div className="bg-[#1E2329] border-[#2B3139] border rounded-lg">
      
      {/* Header */}
      <div className="p-4 border-b border-[#2B3139]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Bot Journal</h3>
          
          <div className="flex items-center gap-4">
            
            {/* Type Filter */}
            <div className="flex bg-[#2B3139] rounded-lg p-1">
              {[
                { key: 'all', label: 'All' },
                { key: 'signal', label: 'Signals' },
                { key: 'order', label: 'Orders' },
                { key: 'pnl', label: 'P&L' },
                { key: 'error', label: 'Errors' }
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

            {/* Symbol Filter */}
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="bg-[#2B3139] border-[#3B4049] border rounded-lg px-3 py-1 text-sm text-white"
            >
              <option value="all">All Symbols</option>
              {symbols.map(symbol => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </select>

            {/* Entry Count */}
            <div className="text-sm text-gray-400">
              {filteredEntries.length} entries
            </div>
          </div>
        </div>
      </div>

      {/* Journal Entries */}
      <div className="max-h-96 overflow-y-auto">
        {filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <div className="text-4xl mb-2">📝</div>
            <div className="font-medium">No Journal Entries</div>
            <div className="text-sm mt-1">Bot activity will appear here...</div>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredEntries.map((entry) => {
              const typeConfig = getTypeConfig(entry.type);
              const statusConfig = getStatusConfig(entry.status);
              
              return (
                <div
                  key={entry.id}
                  className="p-4 rounded-lg border-l-4 hover:bg-[#2B3139] transition-all duration-200"
                  style={{ borderLeftColor: typeConfig.color }}
                >
                  <div className="flex items-start justify-between">
                    
                    {/* Main Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        
                        {/* Type Icon & Label */}
                        <div 
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: typeConfig.color + '22',
                            color: typeConfig.color
                          }}
                        >
                          <span>{typeConfig.icon}</span>
                          <span>{typeConfig.label}</span>
                        </div>

                        {/* Symbol */}
                        <div className="text-white font-bold text-sm">{entry.symbol}</div>

                        {/* Status */}
                        <div className={`px-2 py-1 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                          {entry.status.toUpperCase()}
                        </div>
                      </div>

                      {/* Action */}
                      <div className="text-gray-200 font-medium text-sm mb-1">
                        {entry.action}
                      </div>

                      {/* Details */}
                      <div className="text-gray-400 text-sm leading-relaxed">
                        {entry.details}
                      </div>

                      {/* Additional Data */}
                      {entry.data && (
                        <div className="mt-2 p-2 bg-[#2B3139] rounded text-xs text-gray-400 font-mono">
                          {JSON.stringify(entry.data, null, 2)}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="text-xs text-gray-500 ml-4 text-right">
                      <div>{formatTime(entry.timestamp)}</div>
                      <div className="mt-1">
                        {new Date(entry.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-[#2B3139]">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-6">
            <div>Signals: {entries.filter(e => e.type === 'signal').length}</div>
            <div>Orders: {entries.filter(e => e.type === 'order').length}</div>
            <div>P&L Events: {entries.filter(e => e.type === 'pnl').length}</div>
            <div>Errors: {entries.filter(e => e.type === 'error').length}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#0ECB81] rounded-full animate-pulse"></div>
            <span>Live logging active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
