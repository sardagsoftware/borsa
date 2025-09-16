/**
 * AILYDIAN Auto-Trader AI Dashboard
 * Advanced AI trading system interface with ML signals and risk management
 * © 2025 Emrah Şardağ - Ultra Pro Edition
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  BarChart3,
  Zap,
  Target,
  Shield,
  Clock,
  RefreshCw,
  Play,
  Pause,
  Settings
} from 'lucide-react';

// Types
interface TradingSignal {
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entry_price: number;
  stop_loss?: number;
  take_profit?: number;
  risk_score: number;
  timestamp: string;
}

interface TradingPerformance {
  total_return: number;
  daily_return: number;
  weekly_return: number;
  monthly_return: number;
  sharpe_ratio: number;
  win_rate: number;
  total_trades: number;
  active_positions: number;
  timestamp: string;
}

interface BacktestResult {
  total_return: number;
  sharpe_ratio: number;
  max_drawdown: number;
  win_rate: number;
  total_trades: number;
  profitable_trades: number;
}

const AutoTraderDashboard: React.FC = () => {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [performance, setPerformance] = useState<TradingPerformance | null>(null);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [selectedSymbols, setSelectedSymbols] = useState(['AAPL', 'GOOGL', 'MSFT', 'TSLA']);
  const [serviceStatus, setServiceStatus] = useState<'healthy' | 'error' | 'loading'>('loading');

  // Popular trading symbols
  const popularSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'AMD', 'NFLX', 'UBER'];

  // Check service health
  const checkServiceHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/auto-trader/health');
      if (response.ok) {
        setServiceStatus('healthy');
      } else {
        setServiceStatus('error');
      }
    } catch (error) {
      console.error('Auto-trader health check failed:', error);
      setServiceStatus('error');
    }
  }, []);

  // Generate trading signal
  const generateSignal = async (symbol: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auto-trader/generate-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol })
      });

      if (response.ok) {
        const signal = await response.json();
        setSignals(prev => {
          const updated = prev.filter(s => s.symbol !== symbol);
          return [signal, ...updated].slice(0, 10);
        });
      }
    } catch (error) {
      console.error('Error generating signal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load performance data
  const loadPerformance = async () => {
    try {
      const response = await fetch('/api/auto-trader/trading-performance');
      if (response.ok) {
        const data = await response.json();
        setPerformance(data);
      }
    } catch (error) {
      console.error('Error loading performance:', error);
    }
  };

  // Run backtest
  const runBacktest = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auto-trader/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbols: selectedSymbols,
          start_date: '2023-01-01',
          end_date: '2024-01-01',
          initial_capital: 10000
        })
      });

      if (response.ok) {
        const result = await response.json();
        setBacktestResult(result);
      }
    } catch (error) {
      console.error('Error running backtest:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate signals
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isAutoMode) {
      interval = setInterval(() => {
        const randomSymbol = selectedSymbols[Math.floor(Math.random() * selectedSymbols.length)];
        generateSignal(randomSymbol);
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoMode, selectedSymbols]);

  // Initial load
  useEffect(() => {
    checkServiceHealth();
    loadPerformance();
    
    // Generate initial signals
    selectedSymbols.slice(0, 3).forEach(symbol => {
      setTimeout(() => generateSignal(symbol), Math.random() * 2000);
    });
  }, [checkServiceHealth]);

  // Signal styling
  const getSignalStyle = (signal: string, confidence: number) => {
    const opacity = 0.5 + (confidence * 0.5);
    
    switch (signal) {
      case 'BUY':
        return {
          backgroundColor: `rgba(34, 197, 94, ${opacity})`,
          borderColor: 'rgb(34, 197, 94)',
          color: 'white'
        };
      case 'SELL':
        return {
          backgroundColor: `rgba(239, 68, 68, ${opacity})`,
          borderColor: 'rgb(239, 68, 68)',
          color: 'white'
        };
      default:
        return {
          backgroundColor: `rgba(156, 163, 175, ${opacity})`,
          borderColor: 'rgb(156, 163, 175)',
          color: 'white'
        };
    }
  };

  // Risk level styling
  const getRiskStyle = (risk: number) => {
    if (risk < 0.3) return 'text-green-400';
    if (risk < 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
              🤖 AILYDIAN Auto-Trader AI
            </h1>
            <p className="text-slate-400 text-lg">Advanced AI-powered trading system with machine learning signals</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full border ${
              serviceStatus === 'healthy' ? 'border-green-500 text-green-400' :
              serviceStatus === 'error' ? 'border-red-500 text-red-400' : 'border-yellow-500 text-yellow-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                serviceStatus === 'healthy' ? 'bg-green-400' :
                serviceStatus === 'error' ? 'bg-red-400' : 'bg-yellow-400'
              }`} />
              <span className="text-sm font-medium">
                {serviceStatus === 'healthy' ? 'AI Online' : serviceStatus === 'error' ? 'AI Offline' : 'Loading...'}
              </span>
            </div>
            
            <button
              onClick={() => setIsAutoMode(!isAutoMode)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                isAutoMode ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              {isAutoMode ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isAutoMode ? 'Auto ON' : 'Auto OFF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      {performance && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <span className={`text-2xl font-bold ${performance.total_return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(performance.total_return * 100).toFixed(2)}%
              </span>
            </div>
            <p className="text-slate-400 text-sm">Total Return</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold text-blue-400">
                {performance.sharpe_ratio.toFixed(2)}
              </span>
            </div>
            <p className="text-slate-400 text-sm">Sharpe Ratio</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-bold text-purple-400">
                {(performance.win_rate * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-slate-400 text-sm">Win Rate</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-cyan-400" />
              <span className="text-2xl font-bold text-cyan-400">
                {performance.active_positions}
              </span>
            </div>
            <p className="text-slate-400 text-sm">Active Positions</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Trading Signals */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center">
              <Brain className="w-6 h-6 mr-2 text-cyan-400" />
              AI Trading Signals
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={runBacktest}
                disabled={isLoading}
                className="flex items-center space-x-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm">Backtest</span>
              </button>
              <button
                onClick={() => selectedSymbols.forEach(symbol => generateSignal(symbol))}
                disabled={isLoading}
                className="flex items-center space-x-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="text-sm">Refresh</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {signals.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No trading signals generated yet</p>
                <p className="text-sm mt-2">AI is analyzing market conditions...</p>
              </div>
            ) : (
              signals.map((signal, index) => (
                <div
                  key={`${signal.symbol}-${index}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-600"
                  style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className="px-3 py-1 rounded-full border-2 font-bold text-sm"
                      style={getSignalStyle(signal.signal, signal.confidence)}
                    >
                      {signal.signal}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{signal.symbol}</p>
                      <p className="text-slate-400 text-sm">${signal.entry_price?.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-400">Confidence:</span>
                      <span className="font-bold text-cyan-400">{(signal.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span className={`text-sm font-medium ${getRiskStyle(signal.risk_score)}`}>
                        Risk: {(signal.risk_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Control Panel & Backtest Results */}
        <div className="space-y-6">
          {/* Symbol Selection */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-slate-400" />
              Trading Universe
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {popularSymbols.map(symbol => (
                <label key={symbol} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSymbols.includes(symbol)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSymbols(prev => [...prev, symbol]);
                      } else {
                        setSelectedSymbols(prev => prev.filter(s => s !== symbol));
                      }
                    }}
                    className="w-4 h-4 text-cyan-600 rounded"
                  />
                  <span className="text-sm">{symbol}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Backtest Results */}
          {backtestResult && (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-purple-400" />
                Backtest Results
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                  <p className="text-2xl font-bold text-green-400">
                    {(backtestResult.total_return * 100).toFixed(2)}%
                  </p>
                  <p className="text-sm text-slate-400">Total Return</p>
                </div>
                <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-400">
                    {backtestResult.sharpe_ratio.toFixed(2)}
                  </p>
                  <p className="text-sm text-slate-400">Sharpe Ratio</p>
                </div>
                <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-400">
                    {(backtestResult.win_rate * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-slate-400">Win Rate</p>
                </div>
                <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-400">
                    {backtestResult.total_trades}
                  </p>
                  <p className="text-sm text-slate-400">Total Trades</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutoTraderDashboard;
