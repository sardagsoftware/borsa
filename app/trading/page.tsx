/**
 * AILYDIAN GLOBAL TRADER - Trading Dashboard
 * Multi-asset trading interface with real-time data
 * © 2025 Emrah Şardağ - Ultra Pro Edition
 */

'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Search,
  Globe2,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Bitcoin,
  BarChart3,
  Zap,
  Bell,
  Settings,
  Star,
  Bot
} from 'lucide-react';

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  assetType: 'stocks' | 'crypto' | 'commodities' | 'forex' | 'derivatives';
  exchange: string;
}

interface MarketOverview {
  totalMarketCap: number;
  totalVolume: number;
  activeMarkets: number;
  topGainers: MarketData[];
  topLosers: MarketData[];
}

const POPULAR_SYMBOLS = [
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stocks', exchange: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stocks', exchange: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stocks', exchange: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stocks', exchange: 'NASDAQ' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stocks', exchange: 'NASDAQ' },
  { symbol: 'BTC/USD', name: 'Bitcoin', type: 'crypto', exchange: 'Binance' },
  { symbol: 'ETH/USD', name: 'Ethereum', type: 'crypto', exchange: 'Binance' },
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', type: 'forex', exchange: 'FXCM' },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', type: 'forex', exchange: 'FXCM' },
  { symbol: 'GOLD', name: 'Gold Futures', type: 'commodities', exchange: 'COMEX' },
];

const MARKET_CATEGORIES = [
  { id: 'stocks', label: 'Stocks', icon: TrendingUp, color: 'text-blue-400' },
  { id: 'crypto', label: 'Crypto', icon: Bitcoin, color: 'text-orange-400' },
  { id: 'forex', label: 'Forex', icon: DollarSign, color: 'text-green-400' },
  { id: 'commodities', label: 'Commodities', icon: BarChart3, color: 'text-yellow-400' },
  { id: 'derivatives', label: 'Derivatives', icon: Activity, color: 'text-purple-400' },
];

export default function TradingDashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [selectedAssetType, setSelectedAssetType] = useState<'stocks' | 'crypto' | 'commodities' | 'forex' | 'derivatives'>('stocks');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [searchQuery, setSearchQuery] = useState('');
  const [watchlist, setWatchlist] = useState<string[]>(['AAPL', 'GOOGL', 'BTC/USD']);
  const [marketOverview, setMarketOverview] = useState<MarketOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load market overview data
  const loadMarketOverview = useCallback(async () => {
    setIsLoading(true);
    try {
      // Mock data for demo - in production, this would come from your API
      const overview: MarketOverview = {
        totalMarketCap: 45234567890123,
        totalVolume: 1234567890123,
        activeMarkets: 247,
        topGainers: [
          { symbol: 'NVDA', price: 875.50, change: 45.30, changePercent: 5.46, volume: 15234567, assetType: 'stocks', exchange: 'NASDAQ' },
          { symbol: 'AMD', price: 142.75, change: 8.25, changePercent: 6.13, volume: 8765432, assetType: 'stocks', exchange: 'NASDAQ' },
          { symbol: 'PLTR', price: 23.80, change: 1.85, changePercent: 8.43, volume: 12345678, assetType: 'stocks', exchange: 'NYSE' },
        ],
        topLosers: [
          { symbol: 'META', price: 512.30, change: -25.70, changePercent: -4.78, volume: 9876543, assetType: 'stocks', exchange: 'NASDAQ' },
          { symbol: 'NFLX', price: 425.60, change: -18.90, changePercent: -4.25, volume: 6543210, assetType: 'stocks', exchange: 'NASDAQ' },
          { symbol: 'PYPL', price: 67.85, change: -2.45, changePercent: -3.48, volume: 11234567, assetType: 'stocks', exchange: 'NASDAQ' },
        ]
      };
      setMarketOverview(overview);
    } catch (error) {
      console.error('Failed to load market overview:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load market overview on component mount
  useEffect(() => {
    loadMarketOverview();
    const interval = setInterval(loadMarketOverview, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [loadMarketOverview]);

  // Handle symbol selection
  const handleSymbolSelect = useCallback((symbol: string, assetType: 'stocks' | 'crypto' | 'commodities' | 'forex' | 'derivatives') => {
    setSelectedSymbol(symbol);
    setSelectedAssetType(assetType);
  }, []);

  // Add/remove from watchlist
  const toggleWatchlist = useCallback((symbol: string) => {
    setWatchlist(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  }, []);

  // Filter symbols based on search
  const filteredSymbols = POPULAR_SYMBOLS.filter(item => 
    item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatNumber = (num: number): string => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-green-400 bg-clip-text text-transparent">
                AILYDIAN Global Trader
              </h1>
              <p className="text-gray-400 mt-2">Ultra Pro Edition - Real-time Global Markets</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Market Overview */}
          {marketOverview && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-black/50 border-gray-800 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Market Cap</p>
                    <p className="text-xl font-bold text-white">{formatNumber(marketOverview.totalMarketCap)}</p>
                  </div>
                  <Globe2 className="w-8 h-8 text-blue-400" />
                </div>
              </Card>
              <Card className="bg-black/50 border-gray-800 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">24h Volume</p>
                    <p className="text-xl font-bold text-white">{formatNumber(marketOverview.totalVolume)}</p>
                  </div>
                  <Activity className="w-8 h-8 text-green-400" />
                </div>
              </Card>
              <Card className="bg-black/50 border-gray-800 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Active Markets</p>
                    <p className="text-xl font-bold text-white">{marketOverview.activeMarkets}</p>
                  </div>
                  <Zap className="w-8 h-8 text-yellow-400" />
                </div>
              </Card>
              <Card className="bg-black/50 border-gray-800 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Watchlist</p>
                    <p className="text-xl font-bold text-white">{watchlist.length}</p>
                  </div>
                  <Star className="w-8 h-8 text-purple-400" />
                </div>
              </Card>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Market Categories & Search */}
          <div className="lg:col-span-1 space-y-4">
            {/* Temporary Simplified AI Copilot */}
            <Card className="bg-black/50 border-gray-800 p-4" style={{ height: 400 }}>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Bot className="w-5 h-5 mr-2 text-blue-400" />
                AI Trading Copilot
              </h3>
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Bot className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">AI Assistant is being optimized</p>
                </div>
              </div>
            </Card>

            {/* Market Categories */}
            <Card className="bg-black/50 border-gray-800 p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Markets</h3>
              <div className="space-y-2">
                {MARKET_CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  return (
                    <Button
                      key={category.id}
                      variant={selectedAssetType === category.id ? "primary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedAssetType(category.id as any)}
                    >
                      <Icon className={`w-4 h-4 mr-2 ${category.color}`} />
                      {category.label}
                    </Button>
                  );
                })}
              </div>
            </Card>

            {/* Symbol Search */}
            <Card className="bg-black/50 border-gray-800 p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Search Symbols</h3>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  placeholder="Search symbols..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2 text-sm"
                />
              </div>
              
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {filteredSymbols.map((item) => (
                  <div
                    key={item.symbol}
                    className="flex items-center justify-between p-2 hover:bg-gray-800 rounded cursor-pointer"
                    onClick={() => handleSymbolSelect(item.symbol, item.type as any)}
                  >
                    <div>
                      <p className="text-white font-medium">{item.symbol}</p>
                      <p className="text-xs text-gray-400">{item.name}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWatchlist(item.symbol);
                        }}
                        className="p-1"
                      >
                        <Star 
                          className={`w-4 h-4 ${
                            watchlist.includes(item.symbol) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-400'
                          }`} 
                        />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Top Gainers/Losers */}
            {marketOverview && (
              <Card className="bg-black/50 border-gray-800 p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Market Movers</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-green-400 mb-2">Top Gainers</h4>
                    {marketOverview.topGainers.map((stock) => (
                      <div
                        key={stock.symbol}
                        className="flex items-center justify-between p-2 hover:bg-gray-800 rounded cursor-pointer"
                        onClick={() => handleSymbolSelect(stock.symbol, stock.assetType)}
                      >
                        <div>
                          <p className="text-white text-sm font-medium">{stock.symbol}</p>
                          <p className="text-xs text-gray-400">{formatNumber(stock.price)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 text-sm">+{stock.changePercent.toFixed(2)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-red-400 mb-2">Top Losers</h4>
                    {marketOverview.topLosers.map((stock) => (
                      <div
                        key={stock.symbol}
                        className="flex items-center justify-between p-2 hover:bg-gray-800 rounded cursor-pointer"
                        onClick={() => handleSymbolSelect(stock.symbol, stock.assetType)}
                      >
                        <div>
                          <p className="text-white text-sm font-medium">{stock.symbol}</p>
                          <p className="text-xs text-gray-400">{formatNumber(stock.price)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-red-400 text-sm">{stock.changePercent.toFixed(2)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Main Chart Area */}
          <div className="lg:col-span-3">
            {/* Simplified Trading Chart Placeholder */}
            <Card className="bg-black/90 border-gray-800" style={{ height: 600 }}>
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {selectedSymbol}
                      <span className="ml-2 text-sm text-gray-400 uppercase">{selectedAssetType}</span>
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-2xl font-mono text-white">
                        ${(100 + Math.random() * 100).toFixed(2)}
                      </span>
                      <span className="text-sm font-medium text-green-400">
                        +{(Math.random() * 5).toFixed(2)} ({(Math.random() * 2).toFixed(2)}%)
                      </span>
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {['1m', '5m', '15m', '1h', '4h', '1D', '1W'].map((tf) => (
                    <Button
                      key={tf}
                      variant={selectedTimeframe === tf.toLowerCase() ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedTimeframe(tf.toLowerCase())}
                      className="px-3 py-1 text-xs"
                    >
                      {tf}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center h-96 bg-black">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Advanced Trading Chart</h3>
                  <p className="text-gray-400">Real-time trading charts are being optimized for production</p>
                </div>
              </div>
            </Card>

            {/* Additional Trading Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Card className="bg-black/50 border-gray-800 p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Watchlist</h3>
                <div className="space-y-2">
                  {watchlist.map((symbol) => {
                    const item = POPULAR_SYMBOLS.find(s => s.symbol === symbol);
                    return (
                      <div
                        key={symbol}
                        className="flex items-center justify-between p-2 hover:bg-gray-800 rounded cursor-pointer"
                        onClick={() => {
                          const item = POPULAR_SYMBOLS.find(s => s.symbol === symbol);
                          if (item) handleSymbolSelect(symbol, item.type as any);
                        }}
                      >
                        <div>
                          <p className="text-white font-medium">{symbol}</p>
                          <p className="text-xs text-gray-400">{item?.name}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWatchlist(symbol);
                          }}
                          className="p-1"
                        >
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="bg-black/50 border-gray-800 p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Symbol:</span>
                    <span className="text-white font-medium">{selectedSymbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Asset Type:</span>
                    <span className="text-white font-medium capitalize">{selectedAssetType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Timeframe:</span>
                    <span className="text-white font-medium">{selectedTimeframe}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Market Status:</span>
                    <span className="text-green-400 font-medium">Live</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Update:</span>
                    <span className="text-white font-medium">{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
