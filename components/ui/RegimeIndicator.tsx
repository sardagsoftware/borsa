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
  const regimeData = useRegime();

  const getRegimeInfo = () => {
    switch (regimeData.regime) {
      case 'volatile':
        return { 
          label: 'High Volatility', 
          color: 'text-warn',
          bg: 'bg-warn/20',
          border: 'border-warn/30',
          icon: '⚡',
          description: 'Market experiencing high volatility'
        };
      case 'bull':
        return { 
          label: 'Bull Market', 
          color: 'text-accent1',
          bg: 'bg-accent1/20',
          border: 'border-accent1/30',
          icon: '📈',
          description: 'Market in uptrend'
        };
      case 'bear':
        return { 
          label: 'Bear Market', 
          color: 'text-red-500',
          bg: 'bg-red-500/20',
          border: 'border-red-500/30',
          icon: '🐻',
          description: 'Market in downtrend'
        };
      case 'sideways':
      default:
        return { 
          label: 'Sideways Market', 
          color: 'text-brand1',
          bg: 'bg-brand1/20',
          border: 'border-brand1/30',
          icon: '🌊',
          description: 'Market moving sideways'
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1 text-xs',
          icon: 'text-sm',
          dot: 'w-1.5 h-1.5'
        };
      case 'lg':
        return {
          container: 'px-4 py-3 text-base',
          icon: 'text-lg',
          dot: 'w-3 h-3'
        };
      case 'md':
      default:
        return {
          container: 'px-3 py-2 text-sm',
          icon: 'text-base',
          dot: 'w-2 h-2'
        };
    }
  };

  const regimeInfo = getRegimeInfo();
  const sizeClasses = getSizeClasses();

  return (
    <div className={`
      inline-flex items-center gap-2 rounded-lg
      ${regimeInfo.bg} ${regimeInfo.border} ${regimeInfo.color}
      ${sizeClasses.container} ${className}
      transition-all duration-200 border
    `}>
      <div className={`
        flex items-center justify-center
        ${sizeClasses.icon}
      `}>
        {regimeInfo.icon}
      </div>
      
      {showLabel && (
        <span className="font-medium whitespace-nowrap">
          {regimeInfo.label}
        </span>
      )}
      
      <div className={`
        relative rounded-full
        ${regimeInfo.color} ${sizeClasses.dot}
        opacity-80
      `}>
        {/* Pulse animation based on confidence */}
        <div className={`
          absolute inset-0 rounded-full animate-ping
          ${regimeInfo.color} opacity-30
        `} 
        style={{
          animationDuration: `${2 - regimeData.confidence}s`
        }} />
      </div>
    </div>
  );
}

// Simple regime dot component
export function RegimeDot({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const regimeData = useRegime();

  const getRegimeColor = () => {
    switch (regimeData.regime) {
      case 'volatile':
        return 'bg-warn';
      case 'bull':
        return 'bg-accent1';
      case 'bear':
        return 'bg-red-500';
      case 'sideways':
      default:
        return 'bg-brand1';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'w-1.5 h-1.5';
      case 'lg': return 'w-3 h-3';
      case 'md':
      default: return 'w-2 h-2';
    }
  };

  return (
    <div className={`
      relative rounded-full ${getRegimeColor()} ${getSizeClass()}
    `}>
      <div className={`
        absolute inset-0 rounded-full animate-ping
        ${getRegimeColor()} opacity-75
      `} />
    </div>
  );
}

// Status bar component with regime info
export function RegimeStatusBar({ className = '' }: { className?: string }) {
  const regimeData = useRegime();

  const getStatusMessage = () => {
    return `${regimeData.regime.toUpperCase()} regime (${(regimeData.confidence * 100).toFixed(0)}% confidence)`;
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
      
      {regimeData.volatility && (
        <div className="flex items-center gap-3 text-xs text-muted">
          <span>Vol: {(regimeData.volatility * 100).toFixed(0)}%</span>
          <span>Trend: {regimeData.trend}</span>
        </div>
      )}
    </div>
  );
}
