'use client';

import { useState } from 'react';

export default function PortfolioPage() {
  const [portfolioData, setPortfolioData] = useState({
    totalValue: 12450.75,
    dailyPnL: 234.56,
    allocations: [
      { symbol: 'BTCUSDT', allocation: 45, value: 5602.84, pnl: 156.7 },
      { symbol: 'ETHUSDT', allocation: 30, value: 3735.23, pnl: 89.4 },
      { symbol: 'SOLUSDT', allocation: 15, value: 1867.61, pnl: -12.5 },
      { symbol: 'ADAUSDT', allocation: 10, value: 1245.07, pnl: 1.0 },
    ]
  });

  const [optimizationMethod, setOptimizationMethod] = useState('markowitz');

  return (
    <div className="min-h-screen bg-binance-dark text-binance-text p-6">
      <h1 className="text-3xl font-bold text-binance-yellow mb-8">💼 Portfolio Management</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Portfolio Overview */}
        <div className="bg-binance-panel p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4">📊 Portfolio Overview</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-lg">
              <span>Total Value:</span>
              <span className="text-binance-yellow font-bold">${portfolioData.totalValue}</span>
            </div>
            <div className="flex justify-between">
              <span>Daily P&L:</span>
              <span className={`font-bold ${portfolioData.dailyPnL > 0 ? 'text-binance-green' : 'text-binance-red'}`}>
                ${portfolioData.dailyPnL} (+1.92%)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Sharpe Ratio:</span>
              <span className="text-binance-green">1.85</span>
            </div>
            <div className="flex justify-between">
              <span>Max Drawdown:</span>
              <span className="text-binance-red">-3.2%</span>
            </div>
          </div>
        </div>

        {/* Allocation Chart */}
        <div className="bg-binance-panel p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4">🥧 Asset Allocation</h2>
          <div className="space-y-3">
            {portfolioData.allocations.map((asset, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ 
                      backgroundColor: ['#F0B90B', '#0ECB81', '#F6465D', '#46A7F5'][index] 
                    }}
                  ></div>
                  <span>{asset.symbol}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{asset.allocation}%</div>
                  <div className="text-sm text-gray-400">${asset.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Optimization Methods */}
        <div className="bg-binance-panel p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4">🎯 Optimization</h2>
          <div className="space-y-3">
            <select 
              value={optimizationMethod}
              onChange={(e) => setOptimizationMethod(e.target.value)}
              className="w-full bg-binance-dark border border-gray-600 rounded px-3 py-2"
            >
              <option value="markowitz">Markowitz (Mean-Variance)</option>
              <option value="kelly">Kelly Criterion</option>
              <option value="black_litterman">Black-Litterman</option>
              <option value="hrp">Hierarchical Risk Parity</option>
              <option value="equal_weight">Equal Weight</option>
            </select>
            
            <div className="mt-4 p-3 bg-gray-800 rounded">
              <h4 className="font-bold text-binance-yellow mb-2">Recommended Weights:</h4>
              <div className="text-sm space-y-1">
                <div>BTC: 42% (-3%)</div>
                <div>ETH: 28% (-2%)</div>
                <div>SOL: 18% (+3%)</div>
                <div>ADA: 12% (+2%)</div>
              </div>
            </div>
            
            <button className="w-full bg-binance-green text-black py-2 rounded font-bold">
              Apply Optimization
            </button>
          </div>
        </div>

        {/* Correlation Matrix */}
        <div className="bg-binance-panel p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4">🔗 Correlations</h2>
          <div className="grid grid-cols-4 gap-1 text-xs">
            <div></div>
            <div className="text-center font-bold">BTC</div>
            <div className="text-center font-bold">ETH</div>
            <div className="text-center font-bold">SOL</div>
            
            <div className="font-bold">BTC</div>
            <div className="bg-binance-green text-center p-1 rounded">1.00</div>
            <div className="bg-green-700 text-center p-1 rounded">0.85</div>
            <div className="bg-green-600 text-center p-1 rounded">0.72</div>
            
            <div className="font-bold">ETH</div>
            <div className="bg-green-700 text-center p-1 rounded">0.85</div>
            <div className="bg-binance-green text-center p-1 rounded">1.00</div>
            <div className="bg-green-600 text-center p-1 rounded">0.68</div>
            
            <div className="font-bold">SOL</div>
            <div className="bg-green-600 text-center p-1 rounded">0.72</div>
            <div className="bg-green-600 text-center p-1 rounded">0.68</div>
            <div className="bg-binance-green text-center p-1 rounded">1.00</div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-binance-panel p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4">📈 Performance</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>7D Return:</span>
              <span className="text-binance-green">+5.67%</span>
            </div>
            <div className="flex justify-between">
              <span>30D Return:</span>
              <span className="text-binance-green">+12.34%</span>
            </div>
            <div className="flex justify-between">
              <span>YTD Return:</span>
              <span className="text-binance-green">+89.45%</span>
            </div>
            <div className="flex justify-between">
              <span>Alpha:</span>
              <span className="text-binance-green">0.23</span>
            </div>
            <div className="flex justify-between">
              <span>Beta:</span>
              <span className="text-binance-yellow">1.15</span>
            </div>
            <div className="flex justify-between">
              <span>Information Ratio:</span>
              <span className="text-binance-green">0.67</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
