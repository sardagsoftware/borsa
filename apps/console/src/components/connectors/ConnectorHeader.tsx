/**
 * 🎯 Connector Header Component
 * Header with stats and search
 */

import React from 'react';

interface ConnectorHeaderProps {
  totalConnectors: number;
  activeConnectors: number;
  onSearch: (query: string) => void;
}

export const ConnectorHeader: React.FC<ConnectorHeaderProps> = ({
  totalConnectors,
  activeConnectors,
  onSearch
}) => {
  return (
    <div className="space-y-6 mb-8">
      {/* Title & Stats */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600
                     bg-clip-text text-transparent mb-3">
          Global Connector Network
        </h1>
        <p className="text-gray-400 text-lg">
          Premium integrations with world-class APIs • White-hat verified • KVKK/GDPR compliant
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-3xl font-bold text-white">{totalConnectors}</div>
          <div className="text-sm text-gray-400">Total Connectors</div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="text-3xl font-bold text-emerald-400">{activeConnectors}</div>
          <div className="text-sm text-emerald-300">Active</div>
        </div>

        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="text-3xl font-bold text-blue-400">99.8%</div>
          <div className="text-sm text-blue-300">Avg Uptime</div>
        </div>

        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <div className="text-3xl font-bold text-purple-400">52ms</div>
          <div className="text-sm text-purple-300">Avg Latency</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search connectors by name, country, or description..."
          onChange={(e) => onSearch(e.target.value)}
          className="w-full px-6 py-4 pl-14 rounded-xl
                   bg-white/5 border border-white/10
                   focus:bg-white/10 focus:border-amber-400/40
                   text-white placeholder-gray-400
                   transition-all duration-200
                   outline-none"
        />
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
          🔍
        </div>
      </div>
    </div>
  );
};
