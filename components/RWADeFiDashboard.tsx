"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Shield, AlertTriangle, 
  DollarSign, PieChart as PieChartIcon, Activity,
  Wallet, Lock, Unlock, Eye, EyeOff, Settings,
  Plus, Minus, RefreshCw, ExternalLink, Info
} from 'lucide-react';
// AILYDIAN SDK Integration
import { toast } from "sonner";
import { useFn, useStream } from "@/components/lib/sdk-hooks";
import { isDemo } from "@/lib/env";

interface RWAAsset {
  id: string;
  name: string;
  symbol: string;
  tokenAddress: string;
  totalSupply: string;
  currentPrice: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  apy: number;
  tvl: number;
  riskScore: number;
  category: 'real_estate' | 'commodities' | 'bonds' | 'equity' | 'infrastructure';
  status: 'active' | 'pending' | 'paused';
  metadata: {
    location?: string;
    assetValue: number;
    lastValuation: string;
    documents: string[];
  };
}

interface DeFiPosition {
  id: string;
  protocol: string;
  asset: string;
  amount: number;
  apy: number;
  value: number;
  rewards: number;
  strategy: string;
  riskLevel: 'low' | 'medium' | 'high';
  autoCompound: boolean;
}

interface PortfolioData {
  totalValue: number;
  totalPnL: number;
  pnLPercent: number;
  rwaAllocation: number;
  defiAllocation: number;
  cashAllocation: number;
  dailyPnL: Array<{date: string; pnl: number}>;
  assetDistribution: Array<{name: string; value: number; color: string}>;
  performanceMetrics: {
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    volatility: number;
  };
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

const RWATokenizationPanel: React.FC = () => {
  const [assets, setAssets] = useState<RWAAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<RWAAsset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenizeAmount, setTokenizeAmount] = useState('');

  const mockRWAAssets: RWAAsset[] = [
    {
      id: '1',
      name: 'Manhattan Premium Office',
      symbol: 'MPO',
      tokenAddress: '0x1234...5678',
      totalSupply: '1000000',
      currentPrice: 50.25,
      marketCap: 50250000,
      volume24h: 125000,
      priceChange24h: 2.3,
      apy: 8.5,
      tvl: 45000000,
      riskScore: 25,
      category: 'real_estate',
      status: 'active',
      metadata: {
        location: 'New York, NY',
        assetValue: 52000000,
        lastValuation: '2024-12-01',
        documents: ['valuation.pdf', 'legal.pdf']
      }
    },
    {
      id: '2', 
      name: 'Gold Reserve Fund',
      symbol: 'GRF',
      tokenAddress: '0x8765...4321',
      totalSupply: '500000',
      currentPrice: 125.80,
      marketCap: 62900000,
      volume24h: 89000,
      priceChange24h: -1.2,
      apy: 5.2,
      tvl: 60000000,
      riskScore: 15,
      category: 'commodities',
      status: 'active',
      metadata: {
        location: 'Swiss Vault',
        assetValue: 65000000,
        lastValuation: '2024-11-28',
        documents: ['audit.pdf', 'custody.pdf']
      }
    }
  ];

  useEffect(() => {
    setAssets(mockRWAAssets);
  }, []);

  const handleTokenize = async () => {
    if (!selectedAsset || !tokenizeAmount) return;
    
    setIsLoading(true);
    try {
      // Call tokenization API
      const response = await fetch('/api/tokenization/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: selectedAsset.id,
          amount: tokenizeAmount,
          tokenSymbol: selectedAsset.symbol
        })
      });
      
      if (response.ok) {
        // Handle success
        console.log('Tokenization initiated');
      }
    } catch (error) {
      console.error('Tokenization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            RWA Asset Tokenization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset) => (
              <Card 
                key={asset.id} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedAsset?.id === asset.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedAsset(asset)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{asset.name}</h3>
                      <p className="text-sm text-gray-500">{asset.symbol}</p>
                    </div>
                    <Badge variant={asset.status === 'active' ? 'default' : 'secondary'}>
                      {asset.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Price:</span>
                      <span className="font-medium">${asset.currentPrice.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm">24h Change:</span>
                      <span className={`flex items-center text-sm ${
                        asset.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {asset.priceChange24h >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {asset.priceChange24h.toFixed(2)}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm">APY:</span>
                      <span className="font-medium text-green-600">{asset.apy}%</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm">Risk Score:</span>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          asset.riskScore <= 30 ? 'bg-green-500' :
                          asset.riskScore <= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm">{asset.riskScore}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {selectedAsset && (
            <div className="mt-6 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-semibold mb-3">Tokenize {selectedAsset.name}</h4>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm text-gray-600">Amount to Tokenize</label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={tokenizeAmount}
                    onChange={(e) => setTokenizeAmount(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleTokenize}
                  disabled={isLoading || !tokenizeAmount}
                  className="px-8"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                  Tokenize
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const DeFiYieldFarming: React.FC = () => {
  const [positions, setPositions] = useState<DeFiPosition[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState('');
  
  const mockPositions: DeFiPosition[] = [
    {
      id: '1',
      protocol: 'Aave',
      asset: 'USDC',
      amount: 50000,
      apy: 12.5,
      value: 52500,
      rewards: 1250,
      strategy: 'Lending',
      riskLevel: 'low',
      autoCompound: true
    },
    {
      id: '2',
      protocol: 'Compound',
      asset: 'ETH',
      amount: 25,
      apy: 8.3,
      value: 62500,
      rewards: 890,
      strategy: 'Lending',
      riskLevel: 'medium',
      autoCompound: false
    },
    {
      id: '3',
      protocol: 'Lido',
      asset: 'stETH',
      amount: 30,
      apy: 15.2,
      value: 75000,
      rewards: 2100,
      strategy: 'Staking',
      riskLevel: 'medium',
      autoCompound: true
    }
  ];
  
  useEffect(() => {
    setPositions(mockPositions);
  }, []);
  
  const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);
  const totalRewards = positions.reduce((sum, pos) => sum + pos.rewards, 0);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-green-600 mt-1">+5.2% from last week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalRewards.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Unclaimed rewards</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg APY</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {(positions.reduce((sum, pos) => sum + pos.apy, 0) / positions.length).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Weighted average</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>DeFi Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {positions.map((position) => (
              <div key={position.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    position.riskLevel === 'low' ? 'bg-green-500' :
                    position.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <h4 className="font-medium">{position.protocol}</h4>
                    <p className="text-sm text-gray-500">{position.asset} • {position.strategy}</p>
                  </div>
                </div>
                
                <div className="text-right space-y-1">
                  <div className="font-medium">{position.amount.toLocaleString()} {position.asset}</div>
                  <div className="text-sm text-gray-500">${position.value.toLocaleString()}</div>
                </div>
                
                <div className="text-right space-y-1">
                  <div className="font-medium text-green-600">{position.apy}% APY</div>
                  <div className="text-sm text-green-600">+${position.rewards}</div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {position.autoCompound && (
                    <Badge variant="secondary" className="text-xs">Auto</Badge>
                  )}
                  <Button size="sm" variant="outline">
                    Manage
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const OptionsTrading: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState('');
  const [optionType, setOptionType] = useState<'call' | 'put'>('call');
  const [strike, setStrike] = useState('');
  const [expiration, setExpiration] = useState('');
  
  const greeksData = [
    { name: 'Delta', value: 0.65, description: 'Price sensitivity' },
    { name: 'Gamma', value: 0.035, description: 'Delta sensitivity' },
    { name: 'Theta', value: -0.12, description: 'Time decay' },
    { name: 'Vega', value: 0.28, description: 'Volatility sensitivity' },
    { name: 'Rho', value: 0.08, description: 'Interest rate sensitivity' }
  ];
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Options Chain</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={optionType} onValueChange={(value) => setOptionType(value as 'call' | 'put')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="call">Calls</TabsTrigger>
                <TabsTrigger value="put">Puts</TabsTrigger>
              </TabsList>
              
              <TabsContent value="call" className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Strike</th>
                        <th className="text-left p-2">Premium</th>
                        <th className="text-left p-2">Volume</th>
                        <th className="text-left p-2">IV</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="p-2">$2,500</td>
                        <td className="p-2 text-green-600">$125.50</td>
                        <td className="p-2">1,245</td>
                        <td className="p-2">28.5%</td>
                      </tr>
                      <tr className="border-b hover:bg-gray-50 bg-blue-50">
                        <td className="p-2 font-medium">$2,550</td>
                        <td className="p-2 text-green-600 font-medium">$89.25</td>
                        <td className="p-2">2,156</td>
                        <td className="p-2">31.2%</td>
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="p-2">$2,600</td>
                        <td className="p-2 text-green-600">$65.75</td>
                        <td className="p-2">956</td>
                        <td className="p-2">29.8%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              
              <TabsContent value="put" className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Strike</th>
                        <th className="text-left p-2">Premium</th>
                        <th className="text-left p-2">Volume</th>
                        <th className="text-left p-2">IV</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="p-2">$2,400</td>
                        <td className="p-2 text-red-600">$45.25</td>
                        <td className="p-2">687</td>
                        <td className="p-2">32.1%</td>
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="p-2">$2,450</td>
                        <td className="p-2 text-red-600">$78.50</td>
                        <td className="p-2">1,423</td>
                        <td className="p-2">30.5%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Greeks Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {greeksData.map((greek) => (
              <div key={greek.name} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{greek.name}</div>
                  <div className="text-xs text-gray-500">{greek.description}</div>
                </div>
                <div className={`text-right font-mono ${
                  greek.value >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {greek.value >= 0 ? '+' : ''}{greek.value.toFixed(3)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const PortfolioDashboard: React.FC = () => {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [timeframe, setTimeframe] = useState('7d');
  
  const mockPortfolioData: PortfolioData = {
    totalValue: 1250000,
    totalPnL: 85000,
    pnLPercent: 7.3,
    rwaAllocation: 45,
    defiAllocation: 35,
    cashAllocation: 20,
    dailyPnL: [
      { date: '2024-12-01', pnl: 2500 },
      { date: '2024-12-02', pnl: -1200 },
      { date: '2024-12-03', pnl: 3800 },
      { date: '2024-12-04', pnl: 1950 },
      { date: '2024-12-05', pnl: -850 },
      { date: '2024-12-06', pnl: 4200 },
      { date: '2024-12-07', pnl: 2100 }
    ],
    assetDistribution: [
      { name: 'RWA Tokens', value: 45, color: '#8884d8' },
      { name: 'DeFi Positions', value: 35, color: '#82ca9d' },
      { name: 'Cash & Stables', value: 20, color: '#ffc658' }
    ],
    performanceMetrics: {
      sharpeRatio: 1.85,
      maxDrawdown: 8.2,
      winRate: 68.5,
      volatility: 12.3
    }
  };
  
  useEffect(() => {
    setPortfolioData(mockPortfolioData);
  }, []);
  
  if (!portfolioData) return <div>Loading...</div>;
  
  return (
    <div className="space-y-6">
      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${portfolioData.totalValue.toLocaleString()}</div>
            <div className={`flex items-center text-sm mt-1 ${
              portfolioData.pnLPercent >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {portfolioData.pnLPercent >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {portfolioData.pnLPercent >= 0 ? '+' : ''}{portfolioData.pnLPercent}% (${portfolioData.totalPnL.toLocaleString()})
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Sharpe Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{portfolioData.performanceMetrics.sharpeRatio}</div>
            <div className="text-xs text-gray-500 mt-1">Risk-adjusted return</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Max Drawdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{portfolioData.performanceMetrics.maxDrawdown}%</div>
            <div className="text-xs text-gray-500 mt-1">Maximum loss from peak</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{portfolioData.performanceMetrics.winRate}%</div>
            <div className="text-xs text-gray-500 mt-1">Profitable positions</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={portfolioData.dailyPnL}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'P&L']}
                />
                <Area 
                  type="monotone" 
                  dataKey="pnl" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={portfolioData.assetDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {portfolioData.assetDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Allocation Progress Bars */}
      <Card>
        <CardHeader>
          <CardTitle>Allocation Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span>RWA Tokens</span>
              <span className="font-medium">{portfolioData.rwaAllocation}%</span>
            </div>
            <Progress value={portfolioData.rwaAllocation} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <span>DeFi Positions</span>
              <span className="font-medium">{portfolioData.defiAllocation}%</span>
            </div>
            <Progress value={portfolioData.defiAllocation} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <span>Cash & Stables</span>
              <span className="font-medium">{portfolioData.cashAllocation}%</span>
            </div>
            <Progress value={portfolioData.cashAllocation} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const RWADeFiDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('portfolio');
  
  // AILYDIAN SDK Integration - Real-time data hooks
  const { data: rwaRegistry } = useFn("getRWARegistry", {}, []);
  const { data: greeks } = useFn("getGreeks", { 
    symbol: "ETH", 
    expiry: "2025-12-27", 
    strike: 3000, 
    type: "CALL" 
  }, []);
  const { data: bridgeRisk } = useFn("getBridgeRisk", { 
    from: "ethereum", 
    to: "polygon", 
    amountUsd: 100000 
  }, []);
  const liveVault = useStream<{ tvl: number; apy: number }>("vault");
  
  // Handler functions with SDK integration
  const onDeposit = async (vaultId: string, amount: number) => {
    if (amount <= 0) return toast.error("Miktar girin");
    try {
      const r = await client.call("depositVault", { vaultId, amount });
      toast.success(`Deposit ok • tx=${r.txHash || "demo"} • Demo: ${String(isDemo())}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const onWithdraw = async (vaultId: string, shares: number) => {
    if (shares <= 0) return toast.error("Miktar girin");
    try {
      const r = await client.call("withdrawVault", { vaultId, shares });
      toast.success(`Withdraw ok • tx=${r.txHash || "demo"}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const onTokenizeAsset = async (type: string, valueUsd: number) => {
    try {
      const r = await client.call("tokenizeAsset", { 
        type, 
        valueUsd, 
        metadataUrl: "ipfs://demo-metadata" 
      });
      toast.success(`Asset tokenized • Token: ${r.token || "demo"}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const copilotRun = async (cmd: string) => {
    try {
      if (/tokenize/i.test(cmd)) {
        await client.call("tokenizeAsset", { 
          type: "realestate", 
          valueUsd: 1_000_000, 
          metadataUrl: "ipfs://..." 
        });
      }
      if (/vault/i.test(cmd)) {
        await client.call("depositVault", { 
          vaultId: "vault-usdc-stable", 
          amount: 50000 
        });
      }
      toast.success("Copilot işlemleri tetiklendi");
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AILYDIAN Global Trader Ultra Pro</h1>
          <p className="text-gray-600 mt-2">Advanced RWA + DeFi Portfolio Management</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="rwa" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              RWA Assets
            </TabsTrigger>
            <TabsTrigger value="defi" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              DeFi Farming
            </TabsTrigger>
            <TabsTrigger value="options" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Options
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="portfolio">
            <PortfolioDashboard />
          </TabsContent>
          
          <TabsContent value="rwa">
            <RWATokenizationPanel />
          </TabsContent>
          
          <TabsContent value="defi">
            <DeFiYieldFarming />
          </TabsContent>
          
          <TabsContent value="options">
            <OptionsTrading />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RWADeFiDashboard;
