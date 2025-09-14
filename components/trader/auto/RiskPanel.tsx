'use client';

import React from 'react';

interface RiskMetrics {
  dailyPnL: number;
  maxDailyLoss: number;
  totalPositions: number;
  maxPositions: number;
  portfolioRisk: number; // As percentage
  maxPortfolioRisk: number;
  avgPositionSize: number;
  maxPositionSize: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  var95: number; // Value at Risk 95%
}

interface RiskPanelProps {
  metrics: RiskMetrics;
}

const MOCK_METRICS: RiskMetrics = {
  dailyPnL: 127.45,
  maxDailyLoss: 600,
  totalPositions: 3,
  maxPositions: 5,
  portfolioRisk: 2.1,
  maxPortfolioRisk: 5.0,
  avgPositionSize: 0.8,
  maxPositionSize: 2.0,
  winRate: 73.4,
  sharpeRatio: 1.87,
  maxDrawdown: -3.2,
  var95: -45.2
};

export default function RiskPanel({ metrics = MOCK_METRICS }: RiskPanelProps) {
  
  const getRiskColor = (current: number, max: number, isPercentage = false) => {
    const ratio = Math.abs(current) / Math.abs(max);
    if (ratio >= 0.9) return '#F6465D'; // Critical
    if (ratio >= 0.7) return '#FF8C00'; // High
    if (ratio >= 0.5) return '#F0B90B'; // Medium
    return '#0ECB81'; // Safe
  };

  const getRiskLevel = (current: number, max: number) => {
    const ratio = Math.abs(current) / Math.abs(max);
    if (ratio >= 0.9) return 'CRITICAL';
    if (ratio >= 0.7) return 'HIGH';
    if (ratio >= 0.5) return 'MEDIUM';
    return 'SAFE';
  };

  const formatCurrency = (amount: number) => {
    const sign = amount >= 0 ? '+' : '';
    return `${sign}$${amount.toFixed(2)}`;
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const ProgressBar = ({ 
    current, 
    max, 
    label, 
    isPercentage = false,
    showWarning = false 
  }: { 
    current: number; 
    max: number; 
    label: string;
    isPercentage?: boolean;
    showWarning?: boolean;
  }) => {
    const percentage = Math.min((Math.abs(current) / Math.abs(max)) * 100, 100);
    const color = getRiskColor(current, max, isPercentage);
    const level = getRiskLevel(current, max);
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">{label}</span>
          <div className="flex items-center gap-2">
            <span className="text-white font-mono">
              {isPercentage ? formatPercentage(current) : formatCurrency(current)}
            </span>
            <span className="text-gray-500">/</span>
            <span className="text-gray-400 font-mono">
              {isPercentage ? formatPercentage(max) : formatCurrency(max)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-[#2B3139] rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${percentage}%`,
                backgroundColor: color
              }}
            />
          </div>
          <div 
            className="text-xs font-bold px-2 py-1 rounded"
            style={{ 
              backgroundColor: color + '22',
              color: color 
            }}
          >
            {level}
          </div>
        </div>
        
        {showWarning && percentage >= 70 && (
          <div className="text-xs text-orange-400 flex items-center gap-1">
            ⚠️ Approaching limit - consider reducing exposure
          </div>
        )}
      </div>
    );
  };

  const MetricCard = ({ 
    title, 
    value, 
    subValue, 
    color, 
    trend 
  }: { 
    title: string; 
    value: string; 
    subValue?: string; 
    color: string;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <div className="bg-[#2B3139] rounded-lg p-4">
      <div className="text-sm text-gray-400 mb-1">{title}</div>
      <div className="flex items-center gap-2">
        <div className="text-xl font-bold" style={{ color }}>
          {value}
        </div>
        {trend && (
          <div className={`text-sm ${
            trend === 'up' ? 'text-[#0ECB81]' :
            trend === 'down' ? 'text-[#F6465D]' : 'text-gray-400'
          }`}>
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
          </div>
        )}
      </div>
      {subValue && (
        <div className="text-xs text-gray-500 mt-1">{subValue}</div>
      )}
    </div>
  );

  const isHighRisk = 
    Math.abs(metrics.dailyPnL) / metrics.maxDailyLoss >= 0.7 ||
    metrics.totalPositions / metrics.maxPositions >= 0.8 ||
    metrics.portfolioRisk / metrics.maxPortfolioRisk >= 0.7;

  return (
    <div className="bg-[#1E2329] border-[#2B3139] border rounded-lg">
      
      {/* Header */}
      <div className="p-4 border-b border-[#2B3139]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Risk Management</h3>
          <div className="flex items-center gap-3">
            
            {/* Overall Risk Status */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
              isHighRisk 
                ? 'bg-[#F6465D] bg-opacity-20 text-[#F6465D]' 
                : 'bg-[#0ECB81] bg-opacity-20 text-[#0ECB81]'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isHighRisk ? 'bg-[#F6465D] animate-pulse' : 'bg-[#0ECB81]'
              }`}></div>
              <span className="text-sm font-medium">
                {isHighRisk ? 'HIGH RISK' : 'SAFE'}
              </span>
            </div>

            {/* Guards Status */}
            <div className="text-sm text-gray-400 flex items-center gap-1">
              🛡️ Guards: <span className="text-[#0ECB81]">Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Risk Limits */}
        <div className="space-y-4">
          <h4 className="text-white font-medium">Risk Limits</h4>
          
          <ProgressBar
            current={metrics.dailyPnL}
            max={metrics.maxDailyLoss}
            label="Daily P&L vs Max Loss"
            showWarning={true}
          />
          
          <ProgressBar
            current={metrics.totalPositions}
            max={metrics.maxPositions}
            label="Active Positions"
          />
          
          <ProgressBar
            current={metrics.portfolioRisk}
            max={metrics.maxPortfolioRisk}
            label="Portfolio Risk"
            isPercentage={true}
            showWarning={true}
          />
          
          <ProgressBar
            current={metrics.avgPositionSize}
            max={metrics.maxPositionSize}
            label="Avg Position Size"
            isPercentage={true}
          />
        </div>

        {/* Performance Metrics */}
        <div className="space-y-4">
          <h4 className="text-white font-medium">Performance Metrics</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              title="Win Rate"
              value={`${metrics.winRate}%`}
              subValue="Last 30 days"
              color={metrics.winRate >= 70 ? '#0ECB81' : metrics.winRate >= 50 ? '#F0B90B' : '#F6465D'}
              trend={metrics.winRate >= 70 ? 'up' : metrics.winRate >= 50 ? 'neutral' : 'down'}
            />
            
            <MetricCard
              title="Sharpe Ratio"
              value={metrics.sharpeRatio.toFixed(2)}
              subValue="Risk-adjusted return"
              color={metrics.sharpeRatio >= 1.5 ? '#0ECB81' : metrics.sharpeRatio >= 1 ? '#F0B90B' : '#F6465D'}
              trend={metrics.sharpeRatio >= 1.5 ? 'up' : 'neutral'}
            />
            
            <MetricCard
              title="Max Drawdown"
              value={formatPercentage(metrics.maxDrawdown)}
              subValue="Peak to trough"
              color={metrics.maxDrawdown >= -5 ? '#0ECB81' : metrics.maxDrawdown >= -10 ? '#F0B90B' : '#F6465D'}
              trend={metrics.maxDrawdown >= -5 ? 'up' : 'down'}
            />
            
            <MetricCard
              title="VaR (95%)"
              value={formatCurrency(metrics.var95)}
              subValue="Daily value at risk"
              color={metrics.var95 >= -50 ? '#0ECB81' : metrics.var95 >= -100 ? '#F0B90B' : '#F6465D'}
            />
          </div>
        </div>

        {/* Risk Controls */}
        <div className="space-y-3">
          <h4 className="text-white font-medium">Active Controls</h4>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Stop Loss</span>
              <span className="text-[#0ECB81]">✓ Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Take Profit</span>
              <span className="text-[#0ECB81]">✓ Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Position Sizing</span>
              <span className="text-[#0ECB81]">✓ Kelly Criterion</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Correlation Filter</span>
              <span className="text-[#0ECB81]">✓ Max 0.8</span>
            </div>
          </div>
        </div>

        {/* Emergency Actions */}
        {isHighRisk && (
          <div className="border border-[#F6465D] border-opacity-30 bg-[#F6465D] bg-opacity-10 rounded-lg p-4">
            <div className="flex items-center gap-2 text-[#F6465D] font-medium mb-2">
              🚨 Risk Alert - Recommended Actions
            </div>
            <div className="text-sm text-gray-300 space-y-1">
              {Math.abs(metrics.dailyPnL) / metrics.maxDailyLoss >= 0.7 && (
                <div>• Consider reducing position sizes or closing losing trades</div>
              )}
              {metrics.totalPositions / metrics.maxPositions >= 0.8 && (
                <div>• Position limit approaching - avoid new trades</div>
              )}
              {metrics.portfolioRisk / metrics.maxPortfolioRisk >= 0.7 && (
                <div>• Portfolio risk high - diversify or hedge positions</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
