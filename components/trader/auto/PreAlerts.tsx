'use client';

import React from 'react';

interface Alert {
  id: string;
  type: 'pre_breakout' | 'regime_change' | 'volatility' | 'volume' | 'correlation';
  symbol: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  data?: any;
}

interface PreAlertsProps {
  alerts: Alert[];
  maxAlerts?: number;
}

const MOCK_ALERTS: Alert[] = [
  {
    id: '1',
    type: 'pre_breakout',
    symbol: 'BTCUSDT',
    message: 'Bollinger Bands & Keltner Channel squeeze detected. Breakout expected within 2-4 hours.',
    severity: 'high',
    timestamp: '2024-01-15T10:45:00Z',
    data: { probability: 0.78, timeframe: '4h' }
  },
  {
    id: '2',
    type: 'regime_change',
    symbol: 'ETHUSDT', 
    message: 'Market regime shifting from RANGE to TREND mode. Volume confirmation pending.',
    severity: 'medium',
    timestamp: '2024-01-15T10:42:00Z',
    data: { fromRegime: 'range', toRegime: 'trend', confidence: 0.65 }
  },
  {
    id: '3',
    type: 'volatility',
    symbol: 'BNBUSDT',
    message: 'Volatility compression detected. ATR at 2-week low, expansion likely.',
    severity: 'medium',
    timestamp: '2024-01-15T10:38:00Z',
    data: { atr: 0.028, percentile: 0.15 }
  },
  {
    id: '4',
    type: 'correlation',
    symbol: 'ADAUSDT',
    message: 'Decoupling from BTC correlation detected. Independent move possible.',
    severity: 'low',
    timestamp: '2024-01-15T10:35:00Z',
    data: { correlation: 0.23, normalCorrelation: 0.76 }
  },
  {
    id: '5',
    type: 'volume',
    symbol: 'SOLUSDT',
    message: 'Unusual volume accumulation detected. Smart money activity suspected.',
    severity: 'critical',
    timestamp: '2024-01-15T10:30:00Z',
    data: { volumeIncrease: 2.4, timeWindow: '1h' }
  }
];

export default function PreAlerts({ alerts = MOCK_ALERTS, maxAlerts = 10 }: PreAlertsProps) {
  
  const getSeverityConfig = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-[#F6465D]',
          text: 'text-white',
          border: 'border-[#F6465D]',
          icon: '🚨',
          pulse: true
        };
      case 'high':
        return {
          bg: 'bg-[#FF8C00]',
          text: 'text-white', 
          border: 'border-[#FF8C00]',
          icon: '⚠️',
          pulse: false
        };
      case 'medium':
        return {
          bg: 'bg-[#F0B90B]',
          text: 'text-black',
          border: 'border-[#F0B90B]',
          icon: 'ℹ️',
          pulse: false
        };
      case 'low':
        return {
          bg: 'bg-blue-600',
          text: 'text-white',
          border: 'border-blue-600', 
          icon: '💡',
          pulse: false
        };
    }
  };

  const getTypeConfig = (type: Alert['type']) => {
    switch (type) {
      case 'pre_breakout':
        return { label: 'Pre-Breakout', color: '#0ECB81' };
      case 'regime_change':
        return { label: 'Regime Change', color: '#F0B90B' };
      case 'volatility':
        return { label: 'Volatility', color: '#FF8C00' };
      case 'volume':
        return { label: 'Volume Alert', color: '#8B5CF6' };
      case 'correlation':
        return { label: 'Correlation', color: '#06B6D4' };
    }
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now.getTime() - alertTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return alertTime.toLocaleDateString();
  };

  const sortedAlerts = [...alerts]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, maxAlerts);

  return (
    <div className="bg-[#1E2329] border-[#2B3139] border rounded-lg">
      
      {/* Header */}
      <div className="p-4 border-b border-[#2B3139]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Pre-Breakout & Regime Alerts</h3>
          <div className="flex items-center gap-4">
            
            {/* Active Alert Count */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#F6465D] rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">
                {alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length} active
              </span>
            </div>

            {/* Severity Summary */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-[#F6465D] rounded-full"></div>
                <span className="text-gray-400">{alerts.filter(a => a.severity === 'critical').length}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-[#FF8C00] rounded-full"></div>
                <span className="text-gray-400">{alerts.filter(a => a.severity === 'high').length}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-[#F0B90B] rounded-full"></div>
                <span className="text-gray-400">{alerts.filter(a => a.severity === 'medium').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="max-h-96 overflow-y-auto">
        {sortedAlerts.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <div className="text-4xl mb-2">🔍</div>
            <div className="font-medium">No Active Alerts</div>
            <div className="text-sm mt-1">System is monitoring for pre-breakout signals...</div>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {sortedAlerts.map((alert) => {
              const severityConfig = getSeverityConfig(alert.severity);
              const typeConfig = getTypeConfig(alert.type);
              
              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-l-4 transition-all duration-200 hover:bg-[#2B3139] ${
                    severityConfig.pulse ? 'animate-pulse' : ''
                  }`}
                  style={{ borderLeftColor: typeConfig.color }}
                >
                  <div className="flex items-start justify-between">
                    
                    {/* Main Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        
                        {/* Type Badge */}
                        <div
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: typeConfig.color + '22',
                            color: typeConfig.color
                          }}
                        >
                          {typeConfig.label}
                        </div>

                        {/* Symbol */}
                        <div className="text-white font-bold">{alert.symbol}</div>

                        {/* Severity Badge */}
                        <div className={`px-2 py-1 rounded text-xs font-medium ${severityConfig.bg} ${severityConfig.text}`}>
                          {severityConfig.icon} {alert.severity.toUpperCase()}
                        </div>
                      </div>

                      {/* Alert Message */}
                      <div className="text-gray-300 text-sm leading-relaxed mb-3">
                        {alert.message}
                      </div>

                      {/* Additional Data */}
                      {alert.data && (
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          {alert.data.probability && (
                            <div>Probability: <span className="text-[#0ECB81]">{(alert.data.probability * 100).toFixed(1)}%</span></div>
                          )}
                          {alert.data.timeframe && (
                            <div>Timeframe: <span className="text-[#F0B90B]">{alert.data.timeframe}</span></div>
                          )}
                          {alert.data.confidence && (
                            <div>Confidence: <span className="text-blue-400">{(alert.data.confidence * 100).toFixed(1)}%</span></div>
                          )}
                          {alert.data.volumeIncrease && (
                            <div>Volume: <span className="text-[#F6465D]">{alert.data.volumeIncrease}x</span></div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="text-right text-xs text-gray-400 ml-4">
                      {formatTime(alert.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#2B3139] text-sm text-gray-400">
        <div className="flex items-center justify-between">
          <div>
            Scanning: {sortedAlerts.length} of {alerts.length} alerts
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#0ECB81] rounded-full animate-pulse"></div>
            <span>Live monitoring active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
