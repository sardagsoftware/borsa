/**
 * SHARD_10.4 - Stats Card Component
 * Display usage statistics
 *
 * Security: Metadata only, no sensitive data
 * White Hat: Transparent analytics
 */

'use client';

import React from 'react';

interface StatsCardProps {
  icon: string;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  subtitle?: string;
  color?: string;
}

export default function StatsCard({
  icon,
  label,
  value,
  trend,
  subtitle,
  color = '#10A37F'
}: StatsCardProps) {
  return (
    <div className="bg-[#111827] border border-[#374151] rounded-xl p-6 hover:border-[#10A37F]/50 transition-all">
      {/* Icon & Label */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${color}20` }}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm text-[#9CA3AF]">{label}</p>
          {subtitle && <p className="text-xs text-[#6B7280]">{subtitle}</p>}
        </div>
      </div>

      {/* Value */}
      <div className="flex items-end justify-between">
        <div className="text-3xl font-bold">{formatValue(value)}</div>

        {/* Trend */}
        {trend && (
          <div
            className={`flex items-center gap-1 text-sm font-semibold ${
              trend.direction === 'up' ? 'text-[#10A37F]' : 'text-[#EF4444]'
            }`}
          >
            <span>{trend.direction === 'up' ? '↗' : '↘'}</span>
            <span>{Math.abs(trend.value).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

function formatValue(value: string | number): string {
  if (typeof value === 'string') return value;

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * Stats Grid Component
 */
export function StatsGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {children}
    </div>
  );
}

/**
 * Mini Stats Card (for smaller displays)
 */
export function MiniStatsCard({
  icon,
  label,
  value
}: {
  icon: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3 bg-[#1F2937] rounded-lg p-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-xs text-[#9CA3AF]">{label}</p>
        <p className="text-lg font-bold">{formatValue(value)}</p>
      </div>
    </div>
  );
}
