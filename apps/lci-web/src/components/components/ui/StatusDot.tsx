'use client';
import React from 'react';

type StatusDotProps = {
  status: 'up' | 'warn' | 'down';
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
};

export default function StatusDot({ status, size = 'md', showPulse = true }: StatusDotProps) {
  const sizeMap = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const colorMap = {
    up: 'bg-gradient-to-r from-emerald-400 to-green-500',
    warn: 'bg-gradient-to-r from-amber-400 to-orange-500',
    down: 'bg-gradient-to-r from-red-400 to-rose-500'
  };

  const pulseMap = {
    up: 'animate-pulse bg-emerald-400/30',
    warn: 'animate-pulse bg-amber-400/30',
    down: 'animate-pulse bg-red-400/30'
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      {showPulse && (
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseMap[status]}`} />
      )}
      <span className={`relative inline-flex rounded-full ${sizeMap[size]} ${colorMap[status]}`} />
    </div>
  );
}
