/**
 * AI Signal Card Component
 *
 * Displays real-time AI trading signals from Railway microservices
 * Includes technical indicators, confidence scores, and visual signals
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface AISignalProps {
  symbol: string;
  timeframe: string;
  autoRefresh?: boolean;
}

interface SignalData {
  success: boolean;
  signal?: {
    symbol: string;
    timeframe: string;
    action: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    currentPrice: number;
    timestamp: number;
    source: string;
    version: string;
    indicators: {
      rsi: {
        value: number;
        signal: string;
        weight: number;
      };
      macd: {
        value: number;
        signal: string;
        histogram: number;
        weight: number;
      };
      bollinger: {
        upper: number;
        middle: number;
        lower: number;
        position: string;
        weight: number;
      };
      volume: {
        ratio: number;
        trend: string;
        isHighVolume: boolean;
        weight: number;
      };
      trend: {
        direction: string;
        ema9: number;
        ema21: number;
        ema50: number;
        weight: number;
      };
    };
    metadata: {
      requestId: string;
      processingTime: number;
      dataPoints: number;
      algorithm: string;
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    };
  };
  error?: string;
}

export default function AISignalCard({ symbol, timeframe, autoRefresh = true }: AISignalProps) {
  const [signalData, setSignalData] = useState<SignalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchSignal = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ai/signal?symbol=${symbol}&timeframe=${timeframe}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch signal');
      }

      setSignalData(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  // Initial fetch
  useEffect(() => {
    fetchSignal();
  }, [fetchSignal]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchSignal();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchSignal]);

  // Loading state
  if (loading && !signalData) {
    return (
      <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-blue-700/50 p-8">
        <div className="flex items-center justify-center gap-3">
          <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-blue-300 font-medium">Loading AI signal...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !signalData?.success) {
    return (
      <div className="rounded-2xl bg-red-900/20 backdrop-blur-sm border border-red-700/50 p-8">
        <div className="text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h3 className="text-lg font-semibold text-red-300 mb-2">Signal Error</h3>
          <p className="text-red-200 mb-4">{error || signalData?.error || 'Unknown error'}</p>
          <button
            onClick={fetchSignal}
            className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { signal } = signalData;
  if (!signal) return null;

  // Action colors
  const actionColors = {
    BUY: 'text-green-400 bg-green-500/20 border-green-500',
    SELL: 'text-red-400 bg-red-500/20 border-red-500',
    HOLD: 'text-yellow-400 bg-yellow-500/20 border-yellow-500',
  };

  // Risk level colors
  const riskColors = {
    LOW: 'text-green-400',
    MEDIUM: 'text-yellow-400',
    HIGH: 'text-red-400',
  };

  // Confidence percentage
  const confidencePercent = (signal.confidence * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Main Signal Card */}
      <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-blue-700/50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 p-6 border-b border-blue-700/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {signal.symbol}
              </h2>
              <p className="text-sm text-blue-300">
                {signal.timeframe} • {new Date(signal.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <div className={`px-6 py-3 rounded-xl border-2 font-bold text-xl ${actionColors[signal.action]}`}>
              {signal.action}
            </div>
          </div>

          {/* Price & Confidence */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-blue-300 mb-1">Current Price</p>
              <p className="text-2xl font-bold text-white">
                ${signal.currentPrice.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-300 mb-1">Confidence</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                    style={{ width: `${confidencePercent}%` }}
                  />
                </div>
                <span className="text-xl font-bold text-white">{confidencePercent}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trading Levels */}
        <div className="p-6 grid grid-cols-3 gap-4 border-b border-slate-700/50">
          <div>
            <p className="text-sm text-blue-300 mb-1">Entry Price</p>
            <p className="text-lg font-bold text-white">${signal.entryPrice.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-green-400 mb-1">Take Profit</p>
            <p className="text-lg font-bold text-green-400">${signal.takeProfit.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-red-400 mb-1">Stop Loss</p>
            <p className="text-lg font-bold text-red-400">${signal.stopLoss.toLocaleString()}</p>
          </div>
        </div>

        {/* Technical Indicators */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Technical Indicators</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {/* RSI */}
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-blue-300">RSI</span>
                <span className="text-sm text-slate-400">{signal.indicators.rsi.signal}</span>
              </div>
              <p className="text-2xl font-bold text-white">{signal.indicators.rsi.value.toFixed(2)}</p>
            </div>

            {/* MACD */}
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-blue-300">MACD</span>
                <span className="text-sm text-slate-400">{signal.indicators.macd.signal}</span>
              </div>
              <p className="text-2xl font-bold text-white">{signal.indicators.macd.value.toFixed(2)}</p>
            </div>

            {/* Bollinger Bands */}
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-blue-300">Bollinger Bands</span>
                <span className="text-sm text-slate-400">{signal.indicators.bollinger.position}</span>
              </div>
              <div className="flex gap-2 text-xs text-slate-400">
                <span>U: {signal.indicators.bollinger.upper.toFixed(0)}</span>
                <span>M: {signal.indicators.bollinger.middle.toFixed(0)}</span>
                <span>L: {signal.indicators.bollinger.lower.toFixed(0)}</span>
              </div>
            </div>

            {/* Volume */}
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-blue-300">Volume</span>
                <span className="text-sm text-slate-400">{signal.indicators.volume.trend}</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {signal.indicators.volume.isHighVolume ? '🔥 High' : '📊 Normal'}
              </p>
            </div>

            {/* Trend */}
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700 md:col-span-2">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-blue-300">Trend (EMA)</span>
                <span className="text-sm text-slate-400">{signal.indicators.trend.direction}</span>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-slate-400">EMA9: {signal.indicators.trend.ema9.toFixed(2)}</span>
                <span className="text-slate-400">EMA21: {signal.indicators.trend.ema21.toFixed(2)}</span>
                <span className="text-slate-400">EMA50: {signal.indicators.trend.ema50.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metadata Footer */}
        <div className="p-4 bg-slate-900/50 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
          <div className="flex gap-4">
            <span>Risk: <span className={riskColors[signal.metadata.riskLevel]}>{signal.metadata.riskLevel}</span></span>
            <span>Processing: {signal.metadata.processingTime}ms</span>
            <span>Data Points: {signal.metadata.dataPoints}</span>
          </div>
          <div>
            {lastUpdate && (
              <span>Updated: {lastUpdate.toLocaleTimeString()}</span>
            )}
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={fetchSignal}
          disabled={loading}
          className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold transition-colors shadow-lg shadow-blue-500/30"
        >
          {loading ? 'Loading...' : '🔄 Refresh Signal'}
        </button>
      </div>
    </div>
  );
}
