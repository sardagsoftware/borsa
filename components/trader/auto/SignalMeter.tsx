'use client';

import React from 'react';

interface SignalMeterProps {
  symbol: string;
  signal: number; // -100 to +100
  confidence: number; // 0 to 100
  lastUpdate: string;
  components?: {
    trend: number;
    momentum: number;
    volume: number;
    microstructure: number;
    regime: number;
  };
}

export default function SignalMeter({
  symbol,
  signal,
  confidence,
  lastUpdate,
  components = {
    trend: 0,
    momentum: 0,
    volume: 0,
    microstructure: 0,
    regime: 0
  }
}: SignalMeterProps) {
  
  const getSignalColor = (value: number) => {
    if (value >= 50) return '#0ECB81'; // Strong Bullish
    if (value >= 20) return '#F0B90B'; // Weak Bullish
    if (value >= -20) return '#848E9C'; // Neutral
    if (value >= -50) return '#FF8C00'; // Weak Bearish
    return '#F6465D'; // Strong Bearish
  };

  const getSignalLabel = (value: number) => {
    if (value >= 50) return 'STRONG BUY';
    if (value >= 20) return 'BUY';
    if (value >= -20) return 'NEUTRAL';
    if (value >= -50) return 'SELL';
    return 'STRONG SELL';
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const CircularMeter = ({ value, size = 120 }: { value: number; size?: number }) => {
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (Math.abs(value) / 100) * circumference;
    
    return (
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background Circle */}
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#2B3139"
            strokeWidth="8"
          />
          {/* Progress Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getSignalColor(value)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        
        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div 
            className="text-2xl font-bold"
            style={{ color: getSignalColor(value) }}
          >
            {value > 0 ? '+' : ''}{value}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {getSignalLabel(value)}
          </div>
        </div>
      </div>
    );
  };

  const ComponentBar = ({ label, value }: { label: string; value: number }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-400 w-20">{label}</span>
      <div className="flex-1 mx-3">
        <div className="h-2 bg-[#2B3139] rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${Math.abs(value)}%`,
              backgroundColor: getSignalColor(value),
              marginLeft: value < 0 ? `${100 - Math.abs(value)}%` : '0'
            }}
          />
        </div>
      </div>
      <span 
        className="text-sm font-mono w-12 text-right"
        style={{ color: getSignalColor(value) }}
      >
        {value > 0 ? '+' : ''}{value}
      </span>
    </div>
  );

  return (
    <div className="bg-[#1E2329] border-[#2B3139] border rounded-lg p-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">{symbol}</h3>
          <div className="text-sm text-gray-400">
            Updated: {formatTime(lastUpdate)}
          </div>
        </div>
        
        {/* Confidence Indicator */}
        <div className="text-right">
          <div className="text-sm text-gray-400">Confidence</div>
          <div className={`text-lg font-bold ${
            confidence >= 80 ? 'text-[#0ECB81]' :
            confidence >= 60 ? 'text-[#F0B90B]' :
            'text-gray-400'
          }`}>
            {confidence}%
          </div>
        </div>
      </div>

      {/* Main Signal Display */}
      <div className="flex items-center justify-center mb-8">
        <CircularMeter value={signal} />
      </div>

      {/* Signal Components */}
      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-300 mb-3">Signal Components</div>
        
        <ComponentBar label="Trend" value={components.trend} />
        <ComponentBar label="Momentum" value={components.momentum} />
        <ComponentBar label="Volume" value={components.volume} />
        <ComponentBar label="Micro" value={components.microstructure} />
        <ComponentBar label="Regime" value={components.regime} />
      </div>

      {/* Signal History Sparkline */}
      <div className="mt-6 pt-4 border-t border-[#2B3139]">
        <div className="text-sm text-gray-400 mb-2">24h Signal History</div>
        <div className="h-12 bg-[#2B3139] rounded flex items-end justify-end px-2">
          {/* Mock sparkline data */}
          {[15, 22, 18, 31, 42, 38, 45, 52, 48, 41, 35, 28, 33, 38, 42, 45, 41, 37, 32, 28, 31, 35, 42, signal].map((value, i) => (
            <div
              key={i}
              className="w-1 mx-px transition-all duration-300"
              style={{
                height: `${(Math.abs(value) / 100) * 100}%`,
                backgroundColor: getSignalColor(value),
                minHeight: '2px'
              }}
            />
          ))}
        </div>
      </div>

      {/* Action Recommendation */}
      <div className={`mt-4 p-3 rounded-lg text-center font-medium ${
        Math.abs(signal) >= 50 ? 'bg-opacity-20' : 'bg-opacity-10'
      }`} style={{
        backgroundColor: getSignalColor(signal) + '33',
        color: getSignalColor(signal)
      }}>
        {Math.abs(signal) >= 70 ? '🚨 HIGH CONVICTION SIGNAL' :
         Math.abs(signal) >= 50 ? '⚠️ MODERATE SIGNAL' :
         Math.abs(signal) >= 30 ? 'ℹ️ WEAK SIGNAL' :
         '⏸️ NO CLEAR DIRECTION'}
      </div>
    </div>
  );
}
