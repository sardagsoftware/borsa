'use client';

import { useState } from 'react';

export default function JournalPage() {
  const [trades, setTrades] = useState([
    {
      id: 1,
      timestamp: '2025-09-13 14:30:25',
      symbol: 'BTCUSDT',
      action: 'BUY',
      price: 66800,
      quantity: 0.05,
      pnl: 156.70,
      isBot: true,
      xaiReason: 'Strong bullish momentum detected: RSI oversold (28), increasing volume (+45%), positive order flow ratio (0.72). Multiple indicators aligned for long position.'
    },
    {
      id: 2,
      timestamp: '2025-09-13 12:15:10',
      symbol: 'ETHUSDT',
      action: 'SELL',
      price: 3420,
      quantity: 1.2,
      pnl: -23.40,
      isBot: false,
      xaiReason: 'Manual trade - user initiated stop loss trigger'
    },
    {
      id: 3,
      timestamp: '2025-09-13 09:45:33',
      symbol: 'SOLUSDT',
      action: 'BUY',
      price: 142.50,
      quantity: 3.5,
      pnl: 89.25,
      isBot: true,
      xaiReason: 'Breakout pattern confirmed: Price broke resistance at $140, volume spike +120%, positive news sentiment score 0.8. Risk/reward ratio 1:3.2 favorable.'
    }
  ]);

  return (
    <div className="min-h-screen bg-binance-dark text-binance-text p-6">
      <h1 className="text-3xl font-bold text-binance-yellow mb-8">📝 Trading Journal & XAI</h1>
      
      <div className="space-y-4">
        {trades.map((trade) => (
          <div key={trade.id} className="bg-binance-panel p-6 rounded-lg border border-gray-700">
            {/* Trade Header */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-4">
                <span className={`px-2 py-1 rounded text-sm font-bold ${
                  trade.action === 'BUY' ? 'bg-binance-green text-black' : 'bg-binance-red text-white'
                }`}>
                  {trade.action}
                </span>
                <span className="font-bold text-lg">{trade.symbol}</span>
                <span className="text-gray-400">{trade.timestamp}</span>
                {trade.isBot && (
                  <span className="px-2 py-1 bg-binance-yellow text-black rounded text-sm font-bold">
                    🤖 BOT
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className={`font-bold text-lg ${trade.pnl > 0 ? 'text-binance-green' : 'text-binance-red'}`}>
                  {trade.pnl > 0 ? '+' : ''}${trade.pnl}
                </div>
                <div className="text-sm text-gray-400">
                  {trade.quantity} @ ${trade.price}
                </div>
              </div>
            </div>
            
            {/* XAI Explanation */}
            <div className="bg-gray-800 p-4 rounded">
              <h4 className="font-bold text-binance-yellow mb-2">🧠 XAI Analysis</h4>
              <p className="text-sm leading-relaxed">{trade.xaiReason}</p>
            </div>
            
            {/* Trade Metrics */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Duration:</span>
                <div className="font-bold">2h 15m</div>
              </div>
              <div>
                <span className="text-gray-400">Max Favorable:</span>
                <div className="text-binance-green">+$89.50</div>
              </div>
              <div>
                <span className="text-gray-400">Max Adverse:</span>
                <div className="text-binance-red">-$12.30</div>
              </div>
              <div>
                <span className="text-gray-400">Risk/Reward:</span>
                <div className="text-binance-yellow">1:2.3</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Journal Stats */}
      <div className="mt-8 bg-binance-panel p-6 rounded-lg border border-gray-700">
        <h2 className="text-xl font-bold mb-4">📊 Journal Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-binance-green">68%</div>
            <div className="text-sm text-gray-400">Win Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-binance-yellow">1.96</div>
            <div className="text-sm text-gray-400">Profit Factor</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-binance-green">$45.20</div>
            <div className="text-sm text-gray-400">Avg Win</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-binance-red">$23.10</div>
            <div className="text-sm text-gray-400">Avg Loss</div>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="font-bold mb-3">🎯 AI Insights</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Most successful setup:</span>
              <span className="text-binance-green">Breakout + Volume spike</span>
            </div>
            <div className="flex justify-between">
              <span>Best performing timeframe:</span>
              <span className="text-binance-green">4H charts</span>
            </div>
            <div className="flex justify-between">
              <span>Risk management grade:</span>
              <span className="text-binance-yellow">B+ (Good)</span>
            </div>
            <div className="flex justify-between">
              <span>Recommendation:</span>
              <span className="text-binance-text">Increase position size on high-confidence signals</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
