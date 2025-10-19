'use client';

import React, { useState, useEffect } from 'react';
import useHealth from '../ui/useHealth';

type SLAData = {
  groups: {
    [key: string]: {
      uptimeTarget: number;
      p95TargetMs: number;
    };
  };
};

export default function GroupSLACards() {
  const { rows } = useHealth(60000);
  const [slaData, setSlaData] = useState<SLAData | null>(null);

  useEffect(() => {
    fetch('/data/sla.json')
      .then(r => r.json())
      .then(setSlaData)
      .catch(console.error);
  }, []);

  if (!slaData) return null;

  const groupStats: { [key: string]: { uptime: number; p95: number } } = {};

  // Calculate stats per group
  Object.keys(slaData.groups).forEach(groupName => {
    const groupRows = rows.filter(r => r.group === groupName);
    const upCount = groupRows.filter(r => r.status === 'up').length;
    const uptime = groupRows.length > 0 ? (upCount / groupRows.length) * 100 : 0;
    const p95 = groupRows.length > 0
      ? groupRows.map(r => r.ms).sort((a, b) => b - a)[Math.floor(groupRows.length * 0.05)] || 0
      : 0;

    groupStats[groupName] = { uptime, p95 };
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">SLA Performance by Group</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(slaData.groups).map(([groupName, targets]) => {
          const stats = groupStats[groupName] || { uptime: 0, p95: 0 };
          const uptimeMet = stats.uptime >= targets.uptimeTarget;
          const p95Met = stats.p95 <= targets.p95TargetMs;

          return (
            <div key={groupName} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">{groupName}</h3>
                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                  uptimeMet && p95Met
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : 'bg-amber-100 text-amber-700 border-amber-200'
                }`}>
                  {uptimeMet && p95Met ? '✓ SLA Met' : '⚠ Below SLA'}
                </span>
              </div>

              <div className="space-y-4">
                {/* Uptime */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Uptime</span>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-sm font-bold ${uptimeMet ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.uptime.toFixed(2)}%
                      </span>
                      <span className="text-xs text-gray-500">/ {targets.uptimeTarget}%</span>
                    </div>
                  </div>
                  <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                    <div
                      className={`absolute top-0 left-0 h-full rounded-full ${
                        uptimeMet ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'
                      }`}
                      style={{ width: `${Math.min(stats.uptime, 100)}%` }}
                    />
                  </div>
                </div>

                {/* P95 Latency */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">P95 Latency</span>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-sm font-bold font-mono ${p95Met ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.round(stats.p95)}ms
                      </span>
                      <span className="text-xs text-gray-500">/ {targets.p95TargetMs}ms</span>
                    </div>
                  </div>
                  <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                    <div
                      className={`absolute top-0 left-0 h-full rounded-full ${
                        p95Met ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'
                      }`}
                      style={{ width: `${Math.min((stats.p95 / targets.p95TargetMs) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
