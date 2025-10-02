'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign, AlertTriangle, Shield } from 'lucide-react';

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  high24h: number;
  low24h: number;
}

interface OrderBook {
  bids: [number, number][];
  asks: [number, number][];
}

export default function LiveTradingPage() {
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [priceData, setPriceData] = useState<PriceData>({
    symbol: 'BTC/USDT',
    price: 42150.50,
    change24h: 2.35,
    volume: 1234567890,
    high24h: 42500,
    low24h: 41000
  });
  const [orderType, setOrderType] = useState<'market' | 'limit'>('limit');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [apiKeySet, setApiKeySet] = useState(false);

  // Simulated real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPriceData(prev => ({
        ...prev,
        price: prev.price + (Math.random() - 0.5) * 50,
        change24h: prev.change24h + (Math.random() - 0.5) * 0.1
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleTrade = () => {
    if (!apiKeySet) {
      alert('⚠️ Please set your Binance API key first in Settings');
      return;
    }

    const confirmation = confirm(
      `⚠️ RISK WARNING\n\n` +
      `You are about to ${side.toUpperCase()} ${amount} ${selectedPair}\n` +
      `${orderType === 'market' ? 'at MARKET PRICE' : `at ${price} USDT`}\n\n` +
      `This is a REAL trade with REAL money.\n` +
      `You may lose your investment.\n\n` +
      `Do you want to continue?`
    );

    if (confirmation) {
      // Here would go the actual Binance API call
      alert(`✅ Order submitted successfully!\n\nThis is a demo. In production, this would execute on Binance.`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark pt-24 pb-12 px-4">
      {/* Warning Banner */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="glass-dark border border-orange-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
            <div className="flex-1">
              <h3 className="text-orange-400 font-semibold">Live Trading Mode - Real Money</h3>
              <p className="text-sm text-gray-400">
                You are trading with real funds on Binance. All trades are executed immediately.
                Always use stop-loss orders to manage risk.
              </p>
            </div>
            <Shield className="w-6 h-6 text-[#10A37F]" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Market Overview & Chart */}
          <div className="lg:col-span-2 space-y-6">

            {/* Price Header */}
            <div className="glass-dark rounded-2xl p-6 border border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-white">{selectedPair}</h2>
                  <p className="text-sm text-gray-400">Live Price</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">
                    ${priceData.price.toFixed(2)}
                  </div>
                  <div className={`flex items-center gap-1 ${priceData.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {priceData.change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="font-semibold">{priceData.change24h.toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              {/* Market Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-400">24h High</p>
                  <p className="text-lg font-semibold text-green-400">${priceData.high24h.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">24h Low</p>
                  <p className="text-lg font-semibold text-red-400">${priceData.low24h.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">24h Volume</p>
                  <p className="text-lg font-semibold text-white">
                    ${(priceData.volume / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>
            </div>

            {/* Chart Placeholder */}
            <div className="glass-dark rounded-2xl p-6 border border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Price Chart</h3>
                <div className="flex gap-2">
                  {['1m', '5m', '15m', '1h', '4h', '1D'].map(tf => (
                    <button
                      key={tf}
                      className="px-3 py-1 rounded-lg text-sm bg-white/5 hover:bg-primary/20 text-gray-400 hover:text-primary transition-colors"
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-96 bg-black/20 rounded-xl flex items-center justify-center border border-white/5">
                <div className="text-center">
                  <Activity className="w-12 h-12 text-primary mx-auto mb-2" />
                  <p className="text-gray-400">TradingView Chart will be integrated here</p>
                  <p className="text-sm text-gray-500 mt-2">Real-time candlestick chart with indicators</p>
                </div>
              </div>
            </div>

            {/* Order Book */}
            <div className="glass-dark rounded-2xl p-6 border border-primary/20">
              <h3 className="text-xl font-bold text-white mb-4">Order Book</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Bids */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">Bids (Buy Orders)</p>
                  <div className="space-y-1">
                    {[42145, 42140, 42135, 42130, 42125].map((price, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-green-400">${price.toFixed(2)}</span>
                        <span className="text-gray-400">{(Math.random() * 2).toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Asks */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">Asks (Sell Orders)</p>
                  <div className="space-y-1">
                    {[42155, 42160, 42165, 42170, 42175].map((price, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-red-400">${price.toFixed(2)}</span>
                        <span className="text-gray-400">{(Math.random() * 2).toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Trading Panel */}
          <div className="space-y-6">

            {/* API Status */}
            {!apiKeySet && (
              <div className="glass-dark rounded-2xl p-4 border border-yellow-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <h4 className="text-yellow-400 font-semibold">API Not Connected</h4>
                </div>
                <p className="text-sm text-gray-400 mb-3">
                  Set your Binance API key to enable live trading
                </p>
                <button className="w-full px-4 py-2 bg-gradient-primary text-white rounded-lg font-semibold hover:shadow-glow-primary transition-all">
                  Connect Binance API
                </button>
              </div>
            )}

            {/* Order Panel */}
            <div className="glass-dark rounded-2xl p-6 border border-primary/20">
              <h3 className="text-xl font-bold text-white mb-4">Place Order</h3>

              {/* Buy/Sell Tabs */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => setSide('buy')}
                  className={`py-3 rounded-lg font-semibold transition-all ${
                    side === 'buy'
                      ? 'bg-green-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  BUY
                </button>
                <button
                  onClick={() => setSide('sell')}
                  className={`py-3 rounded-lg font-semibold transition-all ${
                    side === 'sell'
                      ? 'bg-red-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  SELL
                </button>
              </div>

              {/* Order Type */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => setOrderType('limit')}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    orderType === 'limit'
                      ? 'bg-primary text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Limit
                </button>
                <button
                  onClick={() => setOrderType('market')}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    orderType === 'market'
                      ? 'bg-primary text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Market
                </button>
              </div>

              {/* Price Input (only for limit orders) */}
              {orderType === 'limit' && (
                <div className="mb-4">
                  <label className="text-sm text-gray-400 mb-2 block">Price (USDT)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={priceData.price.toFixed(2)}
                    className="input-glass w-full"
                  />
                </div>
              )}

              {/* Amount Input */}
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">Amount (BTC)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.001"
                  className="input-glass w-full"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {['25%', '50%', '75%', '100%'].map(pct => (
                  <button
                    key={pct}
                    className="py-2 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-gray-400 transition-colors"
                  >
                    {pct}
                  </button>
                ))}
              </div>

              {/* Total */}
              <div className="mb-4 p-3 bg-black/20 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total</span>
                  <span className="text-white font-semibold">
                    {amount && (orderType === 'market' ? priceData.price : parseFloat(price || '0'))
                      ? `$${(parseFloat(amount) * (orderType === 'market' ? priceData.price : parseFloat(price))).toFixed(2)}`
                      : '$0.00'
                    }
                  </span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handleTrade}
                disabled={!apiKeySet || !amount}
                className={`w-full py-4 rounded-xl font-bold transition-all ${
                  side === 'buy'
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                } ${(!apiKeySet || !amount) ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
              >
                {side === 'buy' ? 'BUY' : 'SELL'} {selectedPair.split('/')[0]}
              </button>
            </div>

            {/* Portfolio Summary */}
            <div className="glass-dark rounded-2xl p-6 border border-primary/20">
              <h3 className="text-xl font-bold text-white mb-4">Portfolio</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Available USDT</span>
                  <span className="text-white font-semibold">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Available BTC</span>
                  <span className="text-white font-semibold">0.000000</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-white/10">
                  <span className="text-gray-400">Total Value</span>
                  <span className="text-white font-bold">$0.00</span>
                </div>
              </div>
            </div>

            {/* Recent Trades */}
            <div className="glass-dark rounded-2xl p-6 border border-primary/20">
              <h3 className="text-xl font-bold text-white mb-4">Your Recent Trades</h3>
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No trades yet</p>
                <p className="text-gray-500 text-xs mt-1">Your trading history will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
