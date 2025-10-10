/**
 * 📊 Connector Stats Strip Component
 * Horizontal stats bar showing key connector metrics
 */

import React from 'react';

interface ConnectorStatsStripProps {
  totalConnectors: number;
  activeConnectors: number;
  avgUptime?: number;
  avgLatency?: number;
  compact?: boolean;
}

export const ConnectorStatsStrip: React.FC<ConnectorStatsStripProps> = ({
  totalConnectors,
  activeConnectors,
  avgUptime = 99.8,
  avgLatency = 52,
  compact = false
}) => {
  const stats = [
    {
      label: 'Total Connectors',
      value: totalConnectors,
      color: 'white',
      bg: 'bg-white/5',
      border: 'border-white/10'
    },
    {
      label: 'Active',
      value: activeConnectors,
      color: 'emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20'
    },
    {
      label: 'Avg Uptime',
      value: `${avgUptime}%`,
      color: 'blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20'
    },
    {
      label: 'Avg Latency',
      value: `${avgLatency}ms`,
      color: 'purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20'
    }
  ];

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-${compact ? '3' : '4'}`}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`${compact ? 'p-3' : 'p-4'} rounded-xl ${stat.bg} border ${stat.border}
                     hover:scale-105 transition-transform duration-200`}
        >
          <div className={`${compact ? 'text-2xl' : 'text-3xl'} font-bold text-${stat.color}`}>
            {stat.value}
          </div>
          <div className={`${compact ? 'text-xs' : 'text-sm'} text-gray-400 mt-1`}>
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
};
