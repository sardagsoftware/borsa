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

  return (
    <span
      className={`
        ${sizeMap[size]}
        ${colorMap[status]}
        rounded-full
        ${showPulse ? 'animate-pulse' : ''}
      `}
    />
  );
}
