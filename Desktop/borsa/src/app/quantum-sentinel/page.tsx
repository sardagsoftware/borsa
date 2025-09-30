'use client';

/**
 * QUANTUM SENTINEL - CONTROL DASHBOARD
 * Single-button interface with real-time monitoring
 *
 * Features:
 * - One-click start/stop
 * - Live performance metrics
 * - Agent status visualization
 * - Real-time signal feed
 * - Risk monitoring
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface BotState {
  isRunning: boolean;
  currentSymbol: string | null;
  lastSignalTime: number;
  totalTrades: number;
  winRate: number;
  currentPnL: number;
  sharpeRatio: number;
  activeAgents: string[];
  lastDecisions: any[];
  systemHealth: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
}

interface PerformanceStats {
  totalTrades: number;
  winRate: number;
  sharpeRatio: number;
  currentPnL: number;
  avgConfidence: number;
}

interface AgentDecision {
  agent: string;
  action: 'BUY' | 'SELL' | 'HOLD' | 'CLOSE';
  confidence: number;
  reasoning: string[];
  riskScore: number;
  timeframe: string;
}

interface TradingSignal {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD' | 'CLOSE';
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  positionSize: number;
  reasoning: string[];
  timestamp: number;
  agents: AgentDecision[];
}

export default function QuantumSentinelPage() {
  const router = useRouter();
  const [botState, setBotState] = useState<BotState | null>(null);
  const [performance, setPerformance] = useState<PerformanceStats | null>(null);
  const [latestSignal, setLatestSignal] = useState<TradingSignal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');

  // Fetch status on mount and every 5 seconds
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/quantum-sentinel/status');

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setBotState(data.state);
        setPerformance(data.performance);
      }
    } catch (err) {
      console.error('Error fetching status:', err);
    }
  };

  const handleStart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/quantum-sentinel/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: selectedSymbol })
      });

      const data = await response.json();

      if (data.success) {
        setBotState(data.state);
        // Generate initial signal
        await generateSignal();
      } else {
        setError(data.message || 'Failed to start');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/quantum-sentinel/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setBotState(data.state);
      } else {
        setError(data.message || 'Failed to stop');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSignal = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/quantum-sentinel/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: selectedSymbol })
      });

      const data = await response.json();

      if (data.success) {
        setLatestSignal(data.signal);
      } else {
        setError(data.message || 'Failed to generate signal');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'OPTIMAL': return 'text-green-500';
      case 'DEGRADED': return 'text-yellow-500';
      case 'CRITICAL': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY': return 'text-green-500 bg-green-500/10';
      case 'SELL': return 'text-red-500 bg-red-500/10';
      case 'HOLD': return 'text-yellow-500 bg-yellow-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-white mb-2">
            ⚛️ QUANTUM SENTINEL
          </h1>
          <p className="text-purple-300 text-lg">
            Multi-Agent AI Trading System with Quantum Computing Integration
          </p>
        </div>

        {/* Main Control Panel */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Control Center</h2>
              {botState && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-300">Status:</span>
                  <span className={`font-bold ${botState.isRunning ? 'text-green-400' : 'text-gray-400'}`}>
                    {botState.isRunning ? '🟢 ACTIVE' : '⚪ INACTIVE'}
                  </span>
                  {botState.systemHealth && (
                    <>
                      <span className="text-gray-500">|</span>
                      <span className={`font-bold ${getHealthColor(botState.systemHealth)}`}>
                        {botState.systemHealth}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Symbol Selector */}
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              disabled={botState?.isRunning}
              className="bg-white/10 text-white px-4 py-2 rounded-lg border border-white/20 disabled:opacity-50"
            >
              <option value="BTCUSDT">BTC/USDT</option>
              <option value="ETHUSDT">ETH/USDT</option>
              <option value="BNBUSDT">BNB/USDT</option>
              <option value="SOLUSDT">SOL/USDT</option>
              <option value="ADAUSDT">ADA/USDT</option>
            </select>
          </div>

          {/* Big Button */}
          <div className="flex justify-center mb-6">
            {botState?.isRunning ? (
              <button
                onClick={handleStop}
                disabled={isLoading}
                className="w-64 h-64 rounded-full bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold text-3xl shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-4"
              >
                <span className="text-6xl">🛑</span>
                <span>STOP</span>
                {isLoading && <span className="text-sm">Stopping...</span>}
              </button>
            ) : (
              <button
                onClick={handleStart}
                disabled={isLoading}
                className="w-64 h-64 rounded-full bg-gradient-to-br from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold text-3xl shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-4 animate-pulse"
              >
                <span className="text-6xl">🚀</span>
                <span>START</span>
                {isLoading && <span className="text-sm">Initializing...</span>}
              </button>
            )}
          </div>

          {/* Generate Signal Button */}
          {botState?.isRunning && (
            <div className="flex justify-center">
              <button
                onClick={generateSignal}
                disabled={isLoading}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
              >
                {isLoading ? 'Analyzing...' : '🎯 Generate Signal'}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-center">
              {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Agents */}
          {botState && botState.activeAgents.length > 0 && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">🤖 Active Agents</h3>
              <div className="space-y-2">
                {botState.activeAgents.map((agent, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-200">{agent}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          {performance && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">📊 Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Trades:</span>
                  <span className="text-white font-bold">{performance.totalTrades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Win Rate:</span>
                  <span className={`font-bold ${performance.winRate >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {performance.winRate.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Sharpe Ratio:</span>
                  <span className="text-white font-bold">{performance.sharpeRatio.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Avg Confidence:</span>
                  <span className="text-white font-bold">
                    {(performance.avgConfidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Latest Signal */}
        {latestSignal && (
          <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">🎯 Latest Signal</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Signal Summary */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-gray-300">Symbol:</span>
                  <span className="text-white font-bold text-lg">{latestSignal.symbol}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-300">Action:</span>
                  <span className={`px-4 py-2 rounded-lg font-bold text-lg ${getActionColor(latestSignal.action)}`}>
                    {latestSignal.action}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-300">Confidence:</span>
                  <span className="text-white font-bold">{(latestSignal.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-300">Entry Price:</span>
                  <span className="text-white font-bold">${latestSignal.entryPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Risk Management */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-gray-300">Stop Loss:</span>
                  <span className="text-red-400 font-bold">${latestSignal.stopLoss.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-300">Take Profit:</span>
                  <span className="text-green-400 font-bold">${latestSignal.takeProfit.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-300">Position Size:</span>
                  <span className="text-white font-bold">{(latestSignal.positionSize * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-300">Risk/Reward:</span>
                  <span className="text-white font-bold">1:2</span>
                </div>
              </div>
            </div>

            {/* Agent Decisions */}
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-white mb-3">Agent Decisions:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {latestSignal.agents.map((agent, idx) => (
                  <div key={idx} className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 font-semibold">{agent.agent}</span>
                      <span className={`px-3 py-1 rounded text-sm font-bold ${getActionColor(agent.action)}`}>
                        {agent.action}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-400">Confidence:</span>
                      <span className="text-white">{(agent.confidence * 100).toFixed(0)}%</span>
                      <span className="text-gray-500">|</span>
                      <span className="text-gray-400">Risk:</span>
                      <span className="text-white">{agent.riskScore.toFixed(0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reasoning */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Analysis Reasoning:</h4>
              <div className="space-y-2">
                {latestSignal.reasoning.slice(0, 8).map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-gray-300">
                    <span className="text-purple-400">•</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}