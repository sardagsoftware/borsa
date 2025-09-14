'use client';

import React from 'react';
import { useRegime } from '@/lib/ui/regime';

interface RegimeIndicatorProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function RegimeIndicator({ 
  className = '', 
  showLabel = true,
  size = 'md' 
}: RegimeIndicatorProps) {
  const { regime, isTransitioning } = useRegime();

  const getRegimeInfo = () => {
    switch (regime) {
      case 'shock':
        return { 
          label: 'High Volatility', 
          color: 'text-warn',
          bg: 'bg-warn/20',
          border: 'border-warn/30',
          icon: '⚡',
          description: 'Market experiencing high volatility'
        };
      case 'elevated':
        return { 
          label: 'Elevated Risk', 
          color: 'text-accent1',
          bg: 'bg-accent1/20',
          border: 'border-accent1/30',
          icon: '📈',
          description: 'Market conditions are elevated'
        };
      case 'calm':
      default:
        return { 
          label: 'Normal Conditions', 
          color: 'text-brand1',
          bg: 'bg-brand1/20',
          border: 'border-brand1/30',
          icon: '🌊',
          description: 'Market conditions are calm'
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1 text-xs',
          icon: 'text-xs',
          dot: 'w-1 h-1',
        };
      case 'lg':
        return {
          container: 'px-4 py-2 text-base',
          icon: 'text-base',
          dot: 'w-3 h-3',
        };
      case 'md':
      default:
        return {
          container: 'px-3 py-1.5 text-sm',
          icon: 'text-sm',
          dot: 'w-2 h-2',
        };
    }
  };

  const info = getRegimeInfo();
  const sizeClasses = getSizeClasses();

  return (
    <div 
      className={`
        flex items-center gap-2 rounded-lg border transition-all duration-300
        ${info.bg} ${info.border} ${sizeClasses.container}
        ${className}
      `}
      title={info.description}
    >
      <span className={sizeClasses.icon}>{info.icon}</span>
      
      {showLabel && (
        <span className={`font-medium ${info.color}`}>
          {info.label}
        </span>
      )}
      
      {isTransitioning && (
        <div className={`
          rounded-full bg-current animate-pulse 
          ${sizeClasses.dot}
        `} />
      )}
    </div>
  );
}

// Compact dot-only indicator
export function RegimeDot({ className = '' }: { className?: string }) {
  const { regime, isTransitioning } = useRegime();

  const getRegimeColor = () => {
    switch (regime) {
      case 'shock':
        return 'bg-warn';
      case 'elevated':
        return 'bg-accent1';
      case 'calm':
      default:
        return 'bg-brand1';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`
        w-2 h-2 rounded-full transition-colors duration-300
        ${getRegimeColor()}
      `} />
      
      {isTransitioning && (
        <div className={`
          absolute inset-0 w-2 h-2 rounded-full animate-ping
          ${getRegimeColor()} opacity-75
        `} />
      )}
    </div>
  );
}

// Status bar component with regime info
export function RegimeStatusBar({ className = '' }: { className?: string }) {
  const { regime, metrics, history } = useRegime();

  const getStatusMessage = () => {
    const changeCount = history.length;
    const lastChange = history[history.length - 1];
    
    if (changeCount === 0) {
      return `Market regime: ${regime}`;
    }

    const timeSinceChange = lastChange 
      ? Math.round((Date.now() - lastChange.timestamp) / 60000) 
      : 0;

    return `${regime.toUpperCase()} regime for ${timeSinceChange}min`;
  };

  return (
    <div className={`
      flex items-center justify-between px-3 py-2 
      bg-panel/50 border border-white/10 rounded-lg
      ${className}
    `}>
      <div className="flex items-center gap-2">
        <RegimeDot />
        <span className="text-sm text-muted">
          {getStatusMessage()}
        </span>
      </div>
      
      {metrics && (
        <div className="flex items-center gap-4 text-xs text-muted">
          <span>Vol: {(metrics.volatility * 100).toFixed(0)}%</span>
          <span>Spread: {(metrics.spread * 100).toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
}
