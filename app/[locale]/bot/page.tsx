'use client';

import { useState, useEffect } from 'react';

interface BotSignal {
  signal: number;
  symbol: string;
  action: string;
  timestamp: Date;
  regime?: string;
  prebreakout?: number;
  risk?: number;
}

export default function BotPage() {
  const [botStatus, setBotStatus] = useState({
    mode: 'semi',
    signal: 72.5,
    lastAction: 'BUY BTCUSDT',
    trades: 12,
    pnl: 234.56,
    isRunning: true,
  });

  const [signals, setSignals] = useState<BotSignal[]>([]);

  useEffect(() => {
    // Connect to bot signal stream
    const eventSource = new EventSource('/api/bot');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setSignals(prev => [data, ...prev.slice(0, 9)]);
      setBotStatus(prev => ({ ...prev, signal: data.signal }));
    };

    return () => eventSource.close();
  }, []);

  const handleKillSwitch = () => {
    fetch('/api/healthz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'kill_switch' }),
    });
    setBotStatus(prev => ({ ...prev, isRunning: false }));
  };

  return (
    <div className="min-h-screen bg-binance-dark text-binance-text p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-binance-yellow">🤖 AI Trading Bot</h1>
        <button 
          onClick={handleKillSwitch}
          className="bg-binance-red text-white px-6 py-2 rounded font-bold text-xl"
        >
          🛑 KILL SWITCH
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Bot Status */}
        <div className="bg-binance-panel p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4">📊 Bot Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={`font-bold ${botStatus.isRunning ? 'text-binance-green' : 'text-binance-red'}`}>
                {botStatus.isRunning ? '● ACTIVE' : '● STOPPED'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Mode:</span>
              <span className="text-binance-yellow font-bold">{botStatus.mode.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span>Current Signal:</span>
              <span className={`font-bold ${botStatus.signal > 0 ? 'text-binance-green' : 'text-binance-red'}`}>
                {botStatus.signal > 0 ? '+' : ''}{botStatus.signal.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Last Action:</span>
              <span className="text-binance-text">{botStatus.lastAction}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Trades:</span>
              <span className="text-binance-text">{botStatus.trades}</span>
            </div>
            <div className="flex justify-between">
              <span>Bot P&L:</span>
              <span className={`font-bold ${botStatus.pnl > 0 ? 'text-binance-green' : 'text-binance-red'}`}>
                ${botStatus.pnl}
              </span>
            </div>
          </div>
        </div>

        {/* Bot Settings */}
        <div className="bg-binance-panel p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4">⚙️ Bot Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Trading Mode</label>
              <select 
                value={botStatus.mode}
                onChange={(e) => setBotStatus(prev => ({ ...prev, mode: e.target.value as any }))}
                className="w-full bg-binance-dark border border-gray-600 rounded px-3 py-2"
              >
                <option value="semi">Semi Auto (Requires Approval)</option>
                <option value="auto">Full Auto (High Risk)</option>
                <option value="off">Manual Only</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm mb-1">Signal Threshold</label>
              <input 
                type="number" 
                className="w-full bg-binance-dark border border-gray-600 rounded px-3 py-2"
                defaultValue="50"
                min="0"
                max="100"
              />
            </div>
            
            <div>
              <label className="block text-sm mb-1">Position Size (%)</label>
              <input 
                type="number" 
                className="w-full bg-binance-dark border border-gray-600 rounded px-3 py-2"
                defaultValue="0.5"
                step="0.1"
                min="0.1"
                max="2.0"
              />
            </div>
            
            <button className="w-full bg-binance-yellow text-black py-2 rounded font-bold">
              Update Settings
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Signals */}
        <div className="bg-binance-panel p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4">📡 Live Signals</h2>
          <div className="space-y-2">
            {signals.map((signal, index) => (
              <div key={index} className="p-3 bg-gray-800 rounded flex justify-between items-center">
                <div>
                  <div className="font-bold">{signal.symbol}</div>
                  <div className="text-sm text-gray-400">
                    {new Date(signal.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold text-lg ${signal.signal > 0 ? 'text-binance-green' : 'text-binance-red'}`}>
                    {signal.signal > 0 ? '+' : ''}{signal.signal.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-400">{signal.regime}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Policy Engine */}
        <div className="bg-binance-panel p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4">🧠 Policy Engine</h2>
          <div className="space-y-4">
            <div className="p-3 bg-gray-800 rounded">
              <h4 className="font-bold text-binance-green mb-2">✅ Active Rules</h4>
              <ul className="text-sm space-y-1">
                <li>• Signal threshold: ±50</li>
                <li>• Max position size: 1%</li>
                <li>• Daily loss limit: $500</li>
                <li>• Risk/reward ratio: 1:2</li>
              </ul>
            </div>
            
            <div className="p-3 bg-gray-800 rounded">
              <h4 className="font-bold text-binance-yellow mb-2">⚠️ Guards</h4>
              <ul className="text-sm space-y-1">
                <li>• Market volatility check</li>
                <li>• Correlation limits</li>
                <li>• Drawdown protection</li>
                <li>• Time-based filters</li>
              </ul>
            </div>
            
            <div className="p-3 bg-gray-800 rounded">
              <h4 className="font-bold text-binance-text mb-2">📈 Performance</h4>
              <div className="text-sm space-y-1">
                <div>Win Rate: <span className="text-binance-green">68%</span></div>
                <div>Avg Win: <span className="text-binance-green">+$45</span></div>
                <div>Avg Loss: <span className="text-binance-red">-$23</span></div>
                <div>Profit Factor: <span className="text-binance-green">1.96</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
