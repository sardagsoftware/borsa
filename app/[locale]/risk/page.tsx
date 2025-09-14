'use client';

import { useState, useEffect } from 'react';

export default function RiskPage() {
  const [riskMetrics, setRiskMetrics] = useState({
    var95: 1250.0,
    cvar95: 1890.5,
    maxDrawdown: 5.2,
    sharpeRatio: 1.85,
    dailyPnL: 234.56,
  });

  const [stressResults, setStressResults] = useState([
    { scenario: 'Market Crash -20%', pnl: -1200, probability: 0.05 },
    { scenario: 'Flash Crash -10%', pnl: -650, probability: 0.15 },
    { scenario: 'Volatility Spike +50%', pnl: -300, probability: 0.25 },
  ]);

  return (
    <div className="min-h-screen bg-binance-dark text-binance-text p-6">
      <h1 className="text-3xl font-bold text-binance-yellow mb-8">⚠️ Risk Management</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Metrics */}
        <div className="bg-binance-panel p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4">📊 Risk Metrics</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>VaR (95%):</span>
              <span className="text-binance-red font-bold">${riskMetrics.var95}</span>
            </div>
            <div className="flex justify-between">
              <span>CVaR (95%):</span>
              <span className="text-binance-red font-bold">${riskMetrics.cvar95}</span>
            </div>
            <div className="flex justify-between">
              <span>Max Drawdown:</span>
              <span className="text-binance-red">{riskMetrics.maxDrawdown}%</span>
            </div>
            <div className="flex justify-between">
              <span>Sharpe Ratio:</span>
              <span className="text-binance-green">{riskMetrics.sharpeRatio}</span>
            </div>
            <div className="flex justify-between">
              <span>Daily P&L:</span>
              <span className={`font-bold ${riskMetrics.dailyPnL > 0 ? 'text-binance-green' : 'text-binance-red'}`}>
                ${riskMetrics.dailyPnL}
              </span>
            </div>
          </div>
        </div>

        {/* Stress Test Results */}
        <div className="bg-binance-panel p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4">🔥 Stress Test</h2>
          <div className="space-y-3">
            {stressResults.map((result, index) => (
              <div key={index} className="p-3 bg-gray-800 rounded">
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{result.scenario}</span>
                  <span className="text-binance-red font-bold">${result.pnl}</span>
                </div>
                <div className="text-xs text-gray-400">
                  Probability: {(result.probability * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Settings */}
        <div className="bg-binance-panel p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4">⚙️ Risk Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Max Daily Loss ($)</label>
              <input 
                type="number" 
                className="w-full bg-binance-dark border border-gray-600 rounded px-3 py-2"
                defaultValue="500"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Max Single Trade (%)</label>
              <input 
                type="number" 
                className="w-full bg-binance-dark border border-gray-600 rounded px-3 py-2"
                defaultValue="1.0"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Stop Loss (%)</label>
              <input 
                type="number" 
                className="w-full bg-binance-dark border border-gray-600 rounded px-3 py-2"
                defaultValue="2.0"
              />
            </div>
            <button className="w-full bg-binance-yellow text-black py-2 rounded font-bold">
              Update Settings
            </button>
          </div>
        </div>

        {/* Compliance Check */}
        <div className="bg-binance-panel p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4">✅ Compliance</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Leverage Limit:</span>
              <span className="text-binance-green">✓ 10x (Max: 20x)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Daily Loss Limit:</span>
              <span className="text-binance-green">✓ $234 / $500</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Position Size:</span>
              <span className="text-binance-green">✓ 0.8% / 1.0%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Region Rules:</span>
              <span className="text-binance-green">✓ Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
