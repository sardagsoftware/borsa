'use client';

import { useState, useEffect } from 'react';

export default function TradingTerminal() {
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [orderType, setOrderType] = useState('limit');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [botMode, setBotMode] = useState('semi');

  return (
    <div className="min-h-screen bg-binance-dark text-binance-text">
      {/* Header */}
      <div className="bg-binance-panel border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-binance-yellow">⚡ AiLydian Borsa - Trader</h1>
            <select 
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="bg-binance-dark border border-gray-600 rounded px-3 py-1"
            >
              <option>BTCUSDT</option>
              <option>ETHUSDT</option>
              <option>SOLUSDT</option>
            </select>
            <span className="text-binance-green text-2xl font-mono">$67,234.50</span>
            <span className="text-binance-green">+2.34%</span>
          </div>
          
          {/* Bot Controls */}
          <div className="flex items-center space-x-4">
            <select 
              value={botMode}
              onChange={(e) => setBotMode(e.target.value)}
              className="bg-binance-dark border border-gray-600 rounded px-3 py-1"
            >
              <option value="semi">Semi Auto</option>
              <option value="auto">Full Auto</option>
              <option value="off">Manual Only</option>
            </select>
            <div className="text-sm">
              <span className="text-binance-text">Signal: </span>
              <span className="text-binance-green font-bold">+85.2</span>
            </div>
            <button className="bg-binance-red text-white px-3 py-1 rounded font-bold">
              🛑 KILL
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-screen">
        {/* Sol Panel: Depth Chart & Order Book */}
        <div className="w-1/4 bg-binance-panel border-r border-gray-700 p-4">
          <h3 className="text-lg font-bold mb-4">📊 Depth Chart</h3>
          <div className="h-48 bg-binance-dark rounded border border-gray-600 mb-4 flex items-center justify-center">
            <span className="text-gray-500">Depth Chart (Canvas)</span>
          </div>
          
          <h3 className="text-lg font-bold mb-4">📖 Order Book</h3>
          <div className="space-y-1">
            {/* Ask Orders (Kırmızı) */}
            <div className="text-sm">
              <div className="text-binance-red font-bold mb-2">ASK</div>
              {[67250, 67249, 67248, 67247, 67246].map((p, i) => (
                <div key={i} className="flex justify-between hover:bg-red-900/20 px-1">
                  <span className="text-binance-red">${p}</span>
                  <span className="text-gray-400">1.23</span>
                </div>
              ))}
            </div>
            
            {/* Spread */}
            <div className="text-center py-2 border-y border-gray-600">
              <span className="text-binance-yellow">Spread: $1.50</span>
            </div>
            
            {/* Bid Orders (Yeşil) */}
            <div className="text-sm">
              <div className="text-binance-green font-bold mb-2">BID</div>
              {[67245, 67244, 67243, 67242, 67241].map((p, i) => (
                <div key={i} className="flex justify-between hover:bg-green-900/20 px-1">
                  <span className="text-binance-green">${p}</span>
                  <span className="text-gray-400">2.45</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Orta Panel: Price Chart */}
        <div className="flex-1 bg-binance-panel p-4">
          <div className="h-full bg-binance-dark rounded border border-gray-600 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-500 mb-4">TradingView Chart (Lightweight Charts)</div>
              <div className="text-binance-green text-6xl font-mono">📈</div>
              <div className="text-gray-400 mt-4">AI Signal Overlay + Indicators</div>
            </div>
          </div>
        </div>

        {/* Sağ Panel: Order Form */}
        <div className="w-1/4 bg-binance-panel border-l border-gray-700 p-4">
          <h3 className="text-lg font-bold mb-4">📝 Order Form</h3>
          
          {/* Order Type Tabs */}
          <div className="flex mb-4">
            <button 
              className={`flex-1 py-2 px-3 rounded-l ${orderType === 'limit' ? 'bg-binance-yellow text-black' : 'bg-gray-600'}`}
              onClick={() => setOrderType('limit')}
            >
              Limit
            </button>
            <button 
              className={`flex-1 py-2 px-3 rounded-r ${orderType === 'market' ? 'bg-binance-yellow text-black' : 'bg-gray-600'}`}
              onClick={() => setOrderType('market')}
            >
              Market
            </button>
          </div>
          
          {/* Price Input */}
          <div className="mb-4">
            <label className="block text-sm mb-1">Price</label>
            <input 
              type="number" 
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-binance-dark border border-gray-600 rounded px-3 py-2"
              placeholder="67234.50"
            />
          </div>
          
          {/* Quantity Input */}
          <div className="mb-4">
            <label className="block text-sm mb-1">Quantity</label>
            <input 
              type="number" 
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-binance-dark border border-gray-600 rounded px-3 py-2"
              placeholder="0.001"
            />
          </div>
          
          {/* Risk Preview */}
          <div className="mb-4 p-3 bg-gray-800 rounded">
            <h4 className="text-sm font-bold text-binance-yellow mb-2">⚠️ Risk Preview</h4>
            <div className="text-xs space-y-1">
              <div>Max Loss: <span className="text-binance-red">-$67.23</span></div>
              <div>Fee Est: <span className="text-gray-400">$0.34</span></div>
              <div>Slippage: <span className="text-gray-400">0.02%</span></div>
            </div>
          </div>
          
          {/* Buy/Sell Buttons */}
          <div className="space-y-2">
            <button className="w-full bg-binance-green text-black py-3 rounded font-bold">
              🟢 BUY / LONG
            </button>
            <button className="w-full bg-binance-red text-white py-3 rounded font-bold">
              🔴 SELL / SHORT
            </button>
          </div>
        </div>
      </div>

      {/* Alt Panel: Positions, Orders, Balances */}
      <div className="bg-binance-panel border-t border-gray-700 p-4 h-48">
        <div className="flex space-x-6">
          <div className="flex-1">
            <h4 className="font-bold mb-2">🎯 Positions</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>BTCUSDT</span>
                <span className="text-binance-green">+0.05 BTC</span>
                <span className="text-binance-green">+$234.50</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <h4 className="font-bold mb-2">📋 Orders</h4>
            <div className="text-sm text-gray-400">No active orders</div>
          </div>
          
          <div className="flex-1">
            <h4 className="font-bold mb-2">💰 Balance</h4>
            <div className="text-sm">
              <div>USDT: <span className="text-binance-yellow">5,432.10</span></div>
              <div>BTC: <span className="text-binance-yellow">0.1234</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
