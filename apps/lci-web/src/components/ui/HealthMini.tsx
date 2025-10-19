'use client';

import React from 'react';
import useHealth from './useHealth';
import StatusDot from './StatusDot';

export default function HealthMini() {
  const { upCount, warnCount, downCount, total, upPct } = useHealth(60000);

  return (
    <div className="inline-flex items-center gap-6 px-8 py-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200/50 shadow-lg">
      <div className="flex items-center gap-2">
        <StatusDot status="up" size="md" />
        <div>
          <div className="text-2xl font-bold text-green-600">{upCount}</div>
          <div className="text-xs text-gray-600">Healthy</div>
        </div>
      </div>

      {warnCount > 0 && (
        <div className="flex items-center gap-2">
          <StatusDot status="warn" size="md" />
          <div>
            <div className="text-2xl font-bold text-amber-600">{warnCount}</div>
            <div className="text-xs text-gray-600">Warning</div>
          </div>
        </div>
      )}

      {downCount > 0 && (
        <div className="flex items-center gap-2">
          <StatusDot status="down" size="md" />
          <div>
            <div className="text-2xl font-bold text-red-600">{downCount}</div>
            <div className="text-xs text-gray-600">Down</div>
          </div>
        </div>
      )}

      <div className="border-l border-gray-300 pl-6">
        <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {upPct}%
        </div>
        <div className="text-xs text-gray-600">Uptime</div>
      </div>
    </div>
  );
}
