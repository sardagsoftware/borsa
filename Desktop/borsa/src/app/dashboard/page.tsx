/**
 * AILYDIAN BORSA - Dashboard
 *
 * Real-Time AI Trading Signals Dashboard
 * Production-grade interface for Railway AI microservices
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AISignalCard from '@/components/AISignalCard';

// Popular trading pairs
const TRADING_PAIRS = [
  'BTCUSDT',
  'ETHUSDT',
  'BNBUSDT',
  'SOLUSDT',
  'XRPUSDT',
  'ADAUSDT',
];

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'];

export default function DashboardPage() {
  const [selectedPair, setSelectedPair] = useState('BTCUSDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-blue-800/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white font-bold text-xl">AI</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">AILYDIAN BORSA</h1>
                <p className="text-xs text-blue-300">AI Trading Dashboard</p>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              {/* Auto-refresh toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  autoRefresh
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                {autoRefresh ? '● Live' : 'Manual'}
              </button>

              <div className="w-2 h-2 rounded-full bg-green-500 signal-active" title="Railway AI Connected" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Controls */}
        <div className="mb-8 grid md:grid-cols-2 gap-6">
          {/* Trading Pair Selector */}
          <div>
            <label className="block text-sm font-medium text-blue-300 mb-2">
              Trading Pair
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TRADING_PAIRS.map((pair) => (
                <button
                  key={pair}
                  onClick={() => setSelectedPair(pair)}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                    selectedPair === pair
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                      : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700'
                  }`}
                >
                  {pair.replace('USDT', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Timeframe Selector */}
          <div>
            <label className="block text-sm font-medium text-blue-300 mb-2">
              Timeframe
            </label>
            <div className="grid grid-cols-6 gap-2">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`px-3 py-3 rounded-lg font-semibold transition-all ${
                    selectedTimeframe === tf
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/50'
                      : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AI Signal Card */}
        <AISignalCard
          symbol={selectedPair}
          timeframe={selectedTimeframe}
          autoRefresh={autoRefresh}
        />

        {/* Info Footer */}
        <div className="mt-8 p-6 rounded-xl bg-slate-800/30 border border-blue-700/30">
          <h3 className="text-lg font-semibold text-white mb-3">About AI Signals</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-blue-200">
            <div>
              <p className="font-semibold text-white mb-1">Multi-Indicator Analysis</p>
              <p>Combines RSI, MACD, Bollinger Bands, EMA trends, and volume analysis</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">Confidence Scoring</p>
              <p>Weighted consensus algorithm provides probability-based recommendations</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">Real-Time Data</p>
              <p>Live Binance market data processed by Railway AI microservices</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
