'use client';
import React from 'react';

type UptimeBadgeProps = {
  uptime: number;
  size?: 'sm' | 'md' | 'lg';
};

export default function UptimeBadge({ uptime, size = 'md' }: UptimeBadgeProps) {
  const sizeMap = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const getColorClass = (pct: number) => {
    if (pct >= 99.9) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (pct >= 99.5) return 'bg-green-100 text-green-700 border-green-200';
    if (pct >= 99.0) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (pct >= 95.0) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold border ${sizeMap[size]} ${getColorClass(uptime)}`}
    >
      {uptime.toFixed(2)}%
    </span>
  );
}
