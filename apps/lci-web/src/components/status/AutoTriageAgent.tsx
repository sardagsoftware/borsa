'use client';

import React, { useState, useEffect } from 'react';

type FeatureFlags = {
  env: string;
  features: {
    autoTriage: boolean;
    autoRollback: boolean;
  };
  autoRules: {
    sev1_consecutive: number;
    window_seconds: number;
  };
};

export default function AutoTriageAgent() {
  const [flags, setFlags] = useState<FeatureFlags | null>(null);

  useEffect(() => {
    fetch('/data/flags.json')
      .then(r => r.json())
      .then(setFlags)
      .catch(console.error);
  }, []);

  if (!flags) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Auto-Triage Agent</h2>
            <p className="text-sm text-gray-600 mt-1">Status: Active</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
            flags.features.autoTriage
              ? 'bg-green-100 text-green-700 border-green-200'
              : 'bg-gray-100 text-gray-700 border-gray-200'
          }`}>
            Auto-Triage: {flags.features.autoTriage ? 'ON' : 'OFF'}
          </span>
          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
            flags.features.autoRollback
              ? 'bg-amber-100 text-amber-700 border-amber-200'
              : 'bg-gray-100 text-gray-700 border-gray-200'
          }`}>
            Auto-Rollback: {flags.features.autoRollback ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div>
          <div className="text-sm text-gray-500">Environment</div>
          <div className="text-lg font-bold text-gray-900 mt-1 uppercase">{flags.env}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">SEV-1 Threshold</div>
          <div className="text-lg font-bold text-gray-900 mt-1">{flags.autoRules.sev1_consecutive} consecutive</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Detection Window</div>
          <div className="text-lg font-bold text-gray-900 mt-1">{flags.autoRules.window_seconds}s</div>
        </div>
      </div>
    </div>
  );
}
