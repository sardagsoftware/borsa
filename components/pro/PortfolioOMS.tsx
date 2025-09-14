'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  PieChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  AlertCircle,
  BarChart3,
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Position {
  symbol: string;
  exchange: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercent: number;
  allocation: number;
}

interface Balance {
  currency: string;
  total: number;
  available: number;
  locked: number;
  usdValue: number;
}

interface PortfolioData {
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  positions: Position[];
  balances: Balance[];
  exposure: {
    long: number;
    short: number;
    neutral: number;
  };
}

interface RebalanceRecommendation {
  symbol: string;
  action: 'buy' | 'sell';
  quantity: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

interface PortfolioOMSProps {
  portfolio?: PortfolioData;
  rebalanceRecommendations?: RebalanceRecommendation[];
  onRefresh?: () => void;
  onRebalance?: () => void;
  onUpdateSettings?: () => void;
}

const mockPortfolio: PortfolioData = {
  totalValue: 125847.32,
  totalPnL: 8945.67,
  totalPnLPercent: 7.65,
  positions: [
    {
      symbol: 'BTC/USDT',
      exchange: 'binance',
      quantity: 2.5,
      avgPrice: 42500,
      currentPrice: 45200,
      value: 113000,
      pnl: 6750,
      pnlPercent: 6.35,
      allocation: 89.8
    },
    {
      symbol: 'ETH/USDT',
      exchange: 'coinbase',
      quantity: 8.5,
      avgPrice: 2850,
      currentPrice: 2950,
      value: 25075,
      pnl: 850,
      pnlPercent: 3.51,
      allocation: 19.9
    },
    {
      symbol: 'ADA/USDT',
      exchange: 'kraken',
      quantity: 5000,
      avgPrice: 0.52,
      currentPrice: 0.48,
      value: 2400,
      pnl: -200,
      pnlPercent: -7.69,
      allocation: 1.9
    }
  ],
  balances: [
    { currency: 'USDT', total: 5847.32, available: 5847.32, locked: 0, usdValue: 5847.32 },
    { currency: 'BTC', total: 2.5, available: 2.5, locked: 0, usdValue: 113000 },
    { currency: 'ETH', total: 8.5, available: 8.5, locked: 0, usdValue: 25075 },
    { currency: 'ADA', total: 5000, available: 5000, locked: 0, usdValue: 2400 }
  ],
  exposure: {
    long: 85.2,
    short: 0,
    neutral: 14.8
  }
};

const mockRebalanceRecommendations: RebalanceRecommendation[] = [
  {
    symbol: 'BTC/USDT',
    action: 'sell',
    quantity: 0.3,
    reason: 'Overweight in BTC, reduce to target 80% allocation',
    priority: 'high'
  },
  {
    symbol: 'ETH/USDT',
    action: 'buy',
    quantity: 1.2,
    reason: 'Underweight in ETH, increase to target 15% allocation',
    priority: 'medium'
  }
];

export function PortfolioOMS({ 
  portfolio = mockPortfolio,
  rebalanceRecommendations = mockRebalanceRecommendations,
  onRefresh,
  onRebalance,
  onUpdateSettings
}: PortfolioOMSProps) {
  const [showBalances, setShowBalances] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  
  const formatCurrency = (value: number, decimals = 2): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  const formatPercent = (value: number, decimals = 2): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
  };

  const getExchangeIcon = (exchange: string): string => {
    const icons = {
      binance: '🟡',
      coinbase: '🔵', 
      kraken: '🟣',
      kucoin: '🟢',
      bybit: '🟠',
      okx: '⚫'
    };
    return icons[exchange as keyof typeof icons] || '🔑';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <PieChart className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Portfolio OMS</h1>
            <p className="text-gray-600">Multi-account portfolio management and rebalancing</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onUpdateSettings}
            className="flex items-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Button>
          
          <Button 
            size="sm" 
            onClick={onRebalance}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
          >
            <Target className="h-4 w-4" />
            <span>Rebalance</span>
          </Button>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {showBalances ? formatCurrency(portfolio.totalValue) : '••••••'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total P&L</p>
                <p className={cn(
                  "text-2xl font-bold",
                  portfolio.totalPnL >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {showBalances ? formatCurrency(portfolio.totalPnL) : '••••••'}
                </p>
                <p className={cn(
                  "text-sm",
                  portfolio.totalPnL >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatPercent(portfolio.totalPnLPercent)}
                </p>
              </div>
              {portfolio.totalPnL >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Long Exposure</p>
                <p className="text-2xl font-bold text-gray-900">
                  {portfolio.exposure.long.toFixed(1)}%
                </p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Positions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {portfolio.positions.length}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBalances(!showBalances)}
            className="flex items-center space-x-2"
          >
            {showBalances ? (
              <>
                <EyeOff className="h-4 w-4" />
                <span>Hide Values</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span>Show Values</span>
              </>
            )}
          </Button>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Timeframe:</span>
            <select 
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="1h">1H</option>
              <option value="24h">24H</option>
              <option value="7d">7D</option>
              <option value="30d">30D</option>
            </select>
          </div>
        </div>
      </div>

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Symbol</th>
                  <th className="text-left py-2">Exchange</th>
                  <th className="text-right py-2">Quantity</th>
                  <th className="text-right py-2">Avg Price</th>
                  <th className="text-right py-2">Current Price</th>
                  <th className="text-right py-2">Value</th>
                  <th className="text-right py-2">P&L</th>
                  <th className="text-right py-2">Allocation</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.positions.map((position, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-medium">{position.symbol}</td>
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        <span>{getExchangeIcon(position.exchange)}</span>
                        <span className="capitalize">{position.exchange}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right">{position.quantity}</td>
                    <td className="py-3 text-right">{formatCurrency(position.avgPrice)}</td>
                    <td className="py-3 text-right">{formatCurrency(position.currentPrice)}</td>
                    <td className="py-3 text-right font-medium">
                      {showBalances ? formatCurrency(position.value) : '••••••'}
                    </td>
                    <td className={cn(
                      "py-3 text-right font-medium",
                      position.pnl >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      <div>
                        {showBalances ? formatCurrency(position.pnl) : '••••••'}
                      </div>
                      <div className="text-sm">
                        {formatPercent(position.pnlPercent)}
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(position.allocation, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm">{position.allocation.toFixed(1)}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Rebalance Recommendations */}
      {rebalanceRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Rebalance Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rebalanceRecommendations.map((rec, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      rec.priority === 'high' ? 'bg-red-500' :
                      rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    )} />
                    <div>
                      <div className="font-medium">
                        {rec.action.toUpperCase()} {rec.quantity} {rec.symbol}
                      </div>
                      <div className="text-sm text-gray-600">{rec.reason}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-green-100 text-green-800'
                    )}>
                      {rec.priority}
                    </span>
                    <Button size="sm" variant="outline">
                      Apply
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Balances */}
      <Card>
        <CardHeader>
          <CardTitle>Account Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {portfolio.balances.map((balance, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{balance.currency}</span>
                  <span className="text-sm text-gray-600">
                    {showBalances ? formatCurrency(balance.usdValue) : '••••••'}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span>{showBalances ? balance.total.toFixed(4) : '••••••'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available:</span>
                    <span>{showBalances ? balance.available.toFixed(4) : '••••••'}</span>
                  </div>
                  {balance.locked > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Locked:</span>
                      <span className="text-orange-600">
                        {showBalances ? balance.locked.toFixed(4) : '••••••'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
