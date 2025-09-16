import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Treemap
} from 'recharts';
import { 
  TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon, 
  Calendar, Download, Filter, RefreshCw, Eye, Settings,
  DollarSign, Percent, Activity, Target
} from 'lucide-react';

interface PerformanceMetric {
  period: string;
  totalReturn: number;
  sharpeRatio: number;
  volatility: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
}

interface AssetPerformance {
  asset: string;
  allocation: number;
  return: number;
  value: number;
  change24h: number;
}

interface Strategy {
  id: string;
  name: string;
  type: 'rwa' | 'defi' | 'options' | 'hedge';
  allocation: number;
  return: number;
  risk: number;
  status: 'active' | 'paused' | 'closed';
}

interface ChartData {
  date: string;
  portfolioValue: number;
  benchmark: number;
  drawdown: number;
}

const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [assetPerformance, setAssetPerformance] = useState<AssetPerformance[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('1M');

  useEffect(() => {
    // Mock data
    setMetrics([
      {
        period: '1M',
        totalReturn: 8.5,
        sharpeRatio: 1.8,
        volatility: 15.2,
        maxDrawdown: -5.3,
        winRate: 68.5,
        profitFactor: 2.1
      },
      {
        period: '3M',
        totalReturn: 22.8,
        sharpeRatio: 1.6,
        volatility: 18.7,
        maxDrawdown: -12.1,
        winRate: 65.2,
        profitFactor: 1.9
      },
      {
        period: '6M',
        totalReturn: 45.2,
        sharpeRatio: 1.9,
        volatility: 21.3,
        maxDrawdown: -18.5,
        winRate: 69.8,
        profitFactor: 2.3
      },
      {
        period: '1Y',
        totalReturn: 78.9,
        sharpeRatio: 2.1,
        volatility: 24.1,
        maxDrawdown: -22.8,
        winRate: 71.2,
        profitFactor: 2.8
      }
    ]);

    setAssetPerformance([
      { asset: 'RWA Tokens', allocation: 35, return: 12.5, value: 525000, change24h: 2.8 },
      { asset: 'DeFi Pools', allocation: 25, return: 18.2, value: 375000, change24h: -1.2 },
      { asset: 'Options Strategies', allocation: 20, return: 8.9, value: 300000, change24h: 0.5 },
      { asset: 'Hedge Positions', allocation: 15, return: 6.1, value: 225000, change24h: 1.8 },
      { asset: 'Cash & Stablecoins', allocation: 5, return: 4.2, value: 75000, change24h: 0.0 }
    ]);

    setStrategies([
      {
        id: '1',
        name: 'Real Estate RWA Strategy',
        type: 'rwa',
        allocation: 35,
        return: 12.5,
        risk: 2.8,
        status: 'active'
      },
      {
        id: '2',
        name: 'Yield Farming Alpha',
        type: 'defi',
        allocation: 25,
        return: 18.2,
        risk: 4.2,
        status: 'active'
      },
      {
        id: '3',
        name: 'Covered Call Strategy',
        type: 'options',
        allocation: 20,
        return: 8.9,
        risk: 3.1,
        status: 'active'
      },
      {
        id: '4',
        name: 'Market Neutral Hedge',
        type: 'hedge',
        allocation: 15,
        return: 6.1,
        risk: 1.5,
        status: 'paused'
      }
    ]);

    // Generate sample chart data
    const generateChartData = () => {
      const data = [];
      const startValue = 1000000;
      let portfolioValue = startValue;
      let benchmarkValue = startValue;
      
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        
        portfolioValue *= (1 + (Math.random() - 0.45) * 0.02);
        benchmarkValue *= (1 + (Math.random() - 0.48) * 0.015);
        
        data.push({
          date: date.toISOString().split('T')[0],
          portfolioValue: Math.round(portfolioValue),
          benchmark: Math.round(benchmarkValue),
          drawdown: Math.min(0, ((portfolioValue / Math.max(...data.map(d => d?.portfolioValue || portfolioValue))) - 1) * 100)
        });
      }
      return data;
    };

    setChartData(generateChartData());
  }, []);

  const currentMetrics = metrics.find(m => m.period === selectedPeriod) || metrics[0];
  const totalPortfolioValue = assetPerformance.reduce((sum, asset) => sum + asset.value, 0);

  const getStrategyColor = (type: string) => {
    switch (type) {
      case 'rwa': return '#3B82F6';
      case 'defi': return '#10B981';
      case 'options': return '#F59E0B';
      case 'hedge': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const PerformanceOverview = () => (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Performance Overview</h3>
        <div className="flex items-center gap-2">
          {['1M', '3M', '6M', '1Y', 'ALL'].map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Return</p>
                <p className="text-lg font-bold text-green-600">
                  +{currentMetrics?.totalReturn.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Sharpe Ratio</p>
                <p className="text-lg font-bold text-gray-900">
                  {currentMetrics?.sharpeRatio.toFixed(2)}
                </p>
              </div>
              <Target className="h-4 w-4 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Volatility</p>
                <p className="text-lg font-bold text-gray-900">
                  {currentMetrics?.volatility.toFixed(1)}%
                </p>
              </div>
              <Activity className="h-4 w-4 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Max Drawdown</p>
                <p className="text-lg font-bold text-red-600">
                  {currentMetrics?.maxDrawdown.toFixed(1)}%
                </p>
              </div>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Win Rate</p>
                <p className="text-lg font-bold text-gray-900">
                  {currentMetrics?.winRate.toFixed(1)}%
                </p>
              </div>
              <Percent className="h-4 w-4 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Profit Factor</p>
                <p className="text-lg font-bold text-gray-900">
                  {currentMetrics?.profitFactor.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance vs Benchmark</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="portfolioValue" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Portfolio"
                />
                <Line 
                  type="monotone" 
                  dataKey="benchmark" 
                  stroke="#6B7280" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Benchmark"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Asset Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetPerformance}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="allocation"
                  >
                    {assetPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getStrategyColor(['rwa', 'defi', 'options', 'hedge', 'cash'][index])} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance by Asset</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assetPerformance.map((asset, index) => (
                <div key={asset.asset} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{backgroundColor: getStrategyColor(['rwa', 'defi', 'options', 'hedge', 'cash'][index])}}
                    ></div>
                    <div>
                      <p className="font-medium text-gray-900">{asset.asset}</p>
                      <p className="text-sm text-gray-600">${asset.value.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${asset.return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {asset.return > 0 ? '+' : ''}{asset.return.toFixed(1)}%
                    </p>
                    <p className={`text-sm ${asset.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {asset.change24h > 0 ? '+' : ''}{asset.change24h.toFixed(1)}% 24h
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const StrategyAnalysis = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Strategy Analysis</h3>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Strategy Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Strategy Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Strategy</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Allocation</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Return</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Risk Score</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {strategies.map((strategy) => (
                  <tr key={strategy.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{strategy.name}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span 
                        className="inline-flex px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{backgroundColor: getStrategyColor(strategy.type)}}
                      >
                        {strategy.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{strategy.allocation}%</p>
                        <Progress value={strategy.allocation} className="h-2 mt-1" />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className={`font-medium ${strategy.return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {strategy.return > 0 ? '+' : ''}{strategy.return.toFixed(1)}%
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {strategy.risk.toFixed(1)}/10
                        </span>
                        <Progress value={strategy.risk * 10} className="h-2 flex-1" />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(strategy.status)}`}>
                        {strategy.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Strategy Return Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strategies}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="return" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const RiskAnalysis = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Risk Analysis</h3>

      {/* Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Portfolio VaR (95%)</p>
                <p className="text-2xl font-bold text-red-600">-$45,230</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Beta</p>
                <p className="text-2xl font-bold text-gray-900">1.15</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Correlation</p>
                <p className="text-2xl font-bold text-gray-900">0.72</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Risk Score</p>
                <p className="text-2xl font-bold text-yellow-600">6.8/10</p>
              </div>
              <Target className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drawdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Drawdown Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="drawdown" 
                  stroke="#EF4444" 
                  fill="#FEF2F2"
                  name="Drawdown %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Risk by Strategy */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Distribution by Strategy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {strategies.map((strategy) => (
              <div key={strategy.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{backgroundColor: getStrategyColor(strategy.type)}}
                  ></div>
                  <div>
                    <p className="font-medium text-gray-900">{strategy.name}</p>
                    <p className="text-sm text-gray-600">Allocation: {strategy.allocation}%</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">Risk: {strategy.risk.toFixed(1)}/10</p>
                  <div className="w-20 mt-1">
                    <Progress value={strategy.risk * 10} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const CustomReports = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Custom Reports</h3>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Available Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                'Monthly Performance Summary',
                'Strategy Attribution Report', 
                'Risk Management Report',
                'Tax Loss Harvesting Report',
                'Compliance Report',
                'Asset Allocation Analysis'
              ].map((report, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">{report}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Report Frequency
                </label>
                <select className="w-full p-2 border border-gray-300 rounded-lg">
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                  <option>Quarterly</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Include Metrics
                </label>
                <div className="space-y-2">
                  {[
                    'Performance Returns',
                    'Risk Metrics',
                    'Asset Allocation',
                    'Transaction History',
                    'Tax Information'
                  ].map((metric, index) => (
                    <label key={index} className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm text-gray-700">{metric}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Delivery Method
                </label>
                <div className="space-y-2">
                  {[
                    'Email',
                    'Dashboard',
                    'API Export',
                    'PDF Download'
                  ].map((method, index) => (
                    <label key={index} className="flex items-center gap-2">
                      <input type="radio" name="delivery" defaultChecked={index === 0} />
                      <span className="text-sm text-gray-700">{method}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button className="w-full">
                Save Report Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Performance</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <PerformanceOverview />
        </TabsContent>

        <TabsContent value="strategies" className="space-y-6">
          <StrategyAnalysis />
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <RiskAnalysis />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <CustomReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
