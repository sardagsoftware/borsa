import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, TrendingDown, AlertTriangle, Shield, 
  Activity, Zap, Target, BarChart3 
} from 'lucide-react';

interface RiskMetric {
  id: string;
  name: string;
  value: number;
  threshold: number;
  status: 'safe' | 'warning' | 'danger';
  trend: 'up' | 'down' | 'stable';
  description: string;
}

interface HedgePosition {
  id: string;
  asset: string;
  strategy: string;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  hedgeRatio: number;
  pnl: number;
  status: 'active' | 'pending' | 'closed';
}

const RiskAnalyticsDashboard: React.FC = () => {
  const [riskMetrics, setRiskMetrics] = useState<RiskMetric[]>([]);
  const [hedgePositions, setHedgePositions] = useState<HedgePosition[]>([]);
  const [overallRiskScore, setOverallRiskScore] = useState(0);

  const mockRiskMetrics: RiskMetric[] = [
    {
      id: '1',
      name: 'Value at Risk (VaR)',
      value: 125000,
      threshold: 150000,
      status: 'safe',
      trend: 'down',
      description: '95% confidence, 1-day horizon'
    },
    {
      id: '2',
      name: 'Conditional VaR',
      value: 185000,
      threshold: 200000,
      status: 'warning',
      trend: 'up',
      description: 'Expected loss beyond VaR'
    },
    {
      id: '3',
      name: 'Portfolio Beta',
      value: 1.25,
      threshold: 1.5,
      status: 'safe',
      trend: 'stable',
      description: 'Market sensitivity measure'
    },
    {
      id: '4',
      name: 'Leverage Ratio',
      value: 2.8,
      threshold: 3.0,
      status: 'warning',
      trend: 'up',
      description: 'Total exposure / equity'
    }
  ];

  const mockHedgePositions: HedgePosition[] = [
    {
      id: '1',
      asset: 'ETH',
      strategy: 'Delta Neutral',
      delta: 0.05,
      gamma: 0.02,
      theta: -0.08,
      vega: 0.15,
      hedgeRatio: 0.85,
      pnl: 2500,
      status: 'active'
    },
    {
      id: '2',
      asset: 'BTC',
      strategy: 'Gamma Hedge',
      delta: -0.12,
      gamma: 0.45,
      theta: -0.15,
      vega: 0.08,
      hedgeRatio: 0.72,
      pnl: -850,
      status: 'active'
    }
  ];

  useEffect(() => {
    setRiskMetrics(mockRiskMetrics);
    setHedgePositions(mockHedgePositions);
    
    // Calculate overall risk score
    const avgRiskScore = mockRiskMetrics.reduce((sum, metric) => {
      const normalizedValue = (metric.value / metric.threshold) * 100;
      return sum + normalizedValue;
    }, 0) / mockRiskMetrics.length;
    
    setOverallRiskScore(avgRiskScore);
  }, []);

  const getRiskColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'danger': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-red-500" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-green-500" />;
      default: return <Activity className="h-3 w-3 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Risk Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Overall Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">
                {overallRiskScore.toFixed(1)}
                <span className="text-lg text-gray-500 ml-2">/ 100</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Risk utilization score
              </p>
            </div>
            <div className={`p-4 rounded-full ${
              overallRiskScore <= 60 ? 'bg-green-100' :
              overallRiskScore <= 80 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <Shield className={`h-8 w-8 ${
                overallRiskScore <= 60 ? 'text-green-600' :
                overallRiskScore <= 80 ? 'text-yellow-600' : 'text-red-600'
              }`} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {riskMetrics.map((metric) => (
          <Card key={metric.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                {getTrendIcon(metric.trend)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {typeof metric.value === 'number' && metric.value > 1000
                    ? `$${metric.value.toLocaleString()}`
                    : metric.value.toFixed(2)
                  }
                </div>
                <div className="flex items-center justify-between">
                  <Badge className={getRiskColor(metric.status)}>
                    {metric.status.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    Limit: {typeof metric.threshold === 'number' && metric.threshold > 1000
                      ? `$${metric.threshold.toLocaleString()}`
                      : metric.threshold.toFixed(2)
                    }
                  </span>
                </div>
                <p className="text-xs text-gray-600">{metric.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Hedge Positions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Active Hedge Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {hedgePositions.map((position) => (
              <div key={position.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="font-medium text-lg">{position.asset}</div>
                    <Badge variant="secondary">{position.strategy}</Badge>
                    <Badge variant={position.status === 'active' ? 'default' : 'secondary'}>
                      {position.status}
                    </Badge>
                  </div>
                  <div className={`text-lg font-bold ${
                    position.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {position.pnl >= 0 ? '+' : ''}${position.pnl.toLocaleString()}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Delta</div>
                    <div className={`font-medium ${
                      Math.abs(position.delta) <= 0.1 ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {position.delta.toFixed(3)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Gamma</div>
                    <div className="font-medium">{position.gamma.toFixed(3)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Theta</div>
                    <div className={`font-medium ${
                      position.theta < 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {position.theta.toFixed(3)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Vega</div>
                    <div className="font-medium">{position.vega.toFixed(3)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Hedge Ratio</div>
                    <div className={`font-medium ${
                      position.hedgeRatio >= 0.8 ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {(position.hedgeRatio * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" variant="outline">
                      Adjust
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Risk Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <div>
                  <div className="font-medium">Leverage Approaching Limit</div>
                  <div className="text-sm text-gray-600">Current: 2.8x, Limit: 3.0x</div>
                </div>
              </div>
              <Button size="sm" variant="outline">
                Review
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium">CVaR Increased</div>
                  <div className="text-sm text-gray-600">+12% from yesterday</div>
                </div>
              </div>
              <Button size="sm" variant="outline">
                Analyze
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium">Hedge Effectiveness High</div>
                  <div className="text-sm text-gray-600">85% average hedge ratio maintained</div>
                </div>
              </div>
              <Button size="sm" variant="outline">
                Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskAnalyticsDashboard;
