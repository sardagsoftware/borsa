/**
 * BACKTEST PAGE
 * Strategy performance analysis and backtest results
 */

'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import {
  getAllBacktestResults,
  getTopStrategies,
  getCombinedSuccessRate,
  getPerformanceSummary,
  type BacktestResult,
} from '@/lib/backtest/backtest-engine';

export default function BacktestPage() {
  const { t } = useI18n();
  const [results, setResults] = useState<BacktestResult[]>([]);
  const [topStrategies, setTopStrategies] = useState<BacktestResult[]>([]);
  const [successRate, setSuccessRate] = useState(0);
  const [summary, setSummary] = useState(getPerformanceSummary());

  useEffect(() => {
    setResults(getAllBacktestResults());
    setTopStrategies(getTopStrategies(3));
    setSuccessRate(getCombinedSuccessRate());
    setSummary(getPerformanceSummary());
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 pb-24 lg:pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{t('backtest.title')}</h1>
        <p className="text-gray-400">
          Historical performance analysis of trading strategies (Last 30 days)
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <p className="text-sm text-gray-400 mb-1">Combined Success Rate</p>
          <p className="text-3xl font-bold text-green-400">{successRate}%</p>
          <p className="text-xs text-gray-500 mt-1">Avg across all strategies</p>
        </div>

        <div className="card p-4">
          <p className="text-sm text-gray-400 mb-1">Total Strategies</p>
          <p className="text-3xl font-bold text-blue-400">{summary.totalStrategies}</p>
          <p className="text-xs text-gray-500 mt-1">Active backtested</p>
        </div>

        <div className="card p-4">
          <p className="text-sm text-gray-400 mb-1">Best Strategy</p>
          <p className="text-xl font-bold text-yellow-400">{summary.bestStrategy}</p>
          <p className="text-xs text-green-400 mt-1">{summary.bestWinRate}% win rate</p>
        </div>

        <div className="card p-4">
          <p className="text-sm text-gray-400 mb-1">Avg Return</p>
          <p className="text-3xl font-bold text-purple-400">{summary.avgReturn}%</p>
          <p className="text-xs text-gray-500 mt-1">Per trade</p>
        </div>
      </div>

      {/* Top Performers */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">🏆 Top 3 Strategies</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topStrategies.map((strategy, index) => (
            <div
              key={strategy.strategy}
              className={`card p-6 border-2 ${
                index === 0 ? 'border-yellow-500' :
                index === 1 ? 'border-gray-400' :
                'border-orange-600'
              }`}
            >
              {/* Medal */}
              <div className="text-center mb-4">
                <div className="text-5xl mb-2">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </div>
                <h3 className="font-bold text-lg">{strategy.strategy}</h3>
              </div>

              {/* Stats */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Win Rate:</span>
                  <span className="font-bold text-green-400">{strategy.winRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Return:</span>
                  <span className="font-bold text-blue-400">+{strategy.totalReturn}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sharpe Ratio:</span>
                  <span className="font-bold">{strategy.sharpeRatio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Profit Factor:</span>
                  <span className="font-bold">{strategy.profitFactor}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Strategies */}
      <div>
        <h2 className="text-2xl font-bold mb-4">📊 All Strategy Results</h2>

        <div className="space-y-4">
          {results.map((result) => (
            <div key={result.strategy} className="card p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{result.strategy}</h3>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    result.winRate >= 75 ? 'bg-green-500/20 text-green-400' :
                    result.winRate >= 70 ? 'bg-lime-500/20 text-lime-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {result.winRate}% Win Rate
                  </span>
                </div>
              </div>

              {/* Main Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">{t('backtest.total_trades')}</p>
                  <p className="text-lg font-bold">{result.totalTrades}</p>
                  <p className="text-xs text-green-400">{result.winningTrades}W</p>
                  <p className="text-xs text-red-400">{result.losingTrades}L</p>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-1">{t('backtest.total_return')}</p>
                  <p className="text-lg font-bold text-blue-400">+{result.totalReturn}%</p>
                  <p className="text-xs text-gray-500">Avg: +{result.avgReturn}%</p>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-1">{t('backtest.sharpe_ratio')}</p>
                  <p className="text-lg font-bold text-purple-400">{result.sharpeRatio}</p>
                  <p className="text-xs text-gray-500">Risk-adjusted</p>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-1">{t('backtest.profit_factor')}</p>
                  <p className="text-lg font-bold text-green-400">{result.profitFactor}</p>
                  <p className="text-xs text-gray-500">Profit/Loss ratio</p>
                </div>
              </div>

              {/* Advanced Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Max Drawdown</p>
                  <p className="text-sm font-bold text-red-400">{result.maxDrawdown}%</p>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-1">Best Trade</p>
                  <p className="text-sm font-bold text-green-400">+{result.bestTrade}%</p>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-1">Worst Trade</p>
                  <p className="text-sm font-bold text-red-400">{result.worstTrade}%</p>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-1">Avg Win/Loss</p>
                  <p className="text-sm font-bold">
                    <span className="text-green-400">+{result.avgWinningTrade}%</span>
                    {' / '}
                    <span className="text-red-400">{result.avgLosingTrade}%</span>
                  </p>
                </div>
              </div>

              {/* Performance Bar */}
              <div className="mt-4">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                  <span>Performance Score</span>
                  <span className="ml-auto">{result.winRate}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      result.winRate >= 75 ? 'bg-green-500' :
                      result.winRate >= 70 ? 'bg-lime-500' :
                      'bg-yellow-500'
                    }`}
                    style={{ width: `${result.winRate}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 card p-4 bg-yellow-500/10 border-l-4 border-yellow-500">
        <p className="text-sm text-yellow-200">
          ⚠️ <strong>Disclaimer:</strong> Past performance does not guarantee future results.
          These backtest results are based on historical data and simulated trades.
          Always do your own research and trade responsibly.
        </p>
      </div>
    </div>
  );
}
