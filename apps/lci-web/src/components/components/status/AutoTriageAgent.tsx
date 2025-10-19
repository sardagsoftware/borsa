'use client';
import React, { useEffect, useState } from 'react';
import type { FeatureFlags, Incident } from './types';
import type { RollbackAction } from './autoTypes';

export default function AutoTriageAgent() {
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [rollbackLog, setRollbackLog] = useState<RollbackAction[]>([]);
  const [agentStatus, setAgentStatus] = useState<'idle' | 'active' | 'error'>('idle');

  useEffect(() => {
    // Load feature flags
    const loadFlags = async () => {
      try {
        const res = await fetch('/data/flags.json');
        const data = await res.json();
        setFlags(data);
      } catch (err) {
        console.error('Failed to load feature flags:', err);
        setAgentStatus('error');
      }
    };

    loadFlags();
  }, []);

  useEffect(() => {
    if (!flags?.features.autoTriage) {
      setAgentStatus('idle');
      return;
    }

    setAgentStatus('active');

    const checkForAutoActions = () => {
      const incidentsStored = localStorage.getItem('incidentLog');
      if (!incidentsStored) return;

      try {
        const incidents: Incident[] = JSON.parse(incidentsStored);
        const now = Date.now();
        const windowMs = flags.autoRules.window_seconds * 1000;

        // Get recent SEV-1 incidents
        const recentSev1 = incidents.filter(
          inc => inc.sev === 1 && (now - inc.ts) < windowMs
        );

        // Check for consecutive SEV-1s
        if (recentSev1.length >= flags.autoRules.sev1_consecutive) {
          const hasRollback = recentSev1.some(inc => inc.rollback);

          if (flags.features.autoRollback && hasRollback) {
            // Trigger rollback
            triggerRollback('Consecutive SEV-1 incidents detected');
          }
        }
      } catch (err) {
        console.error('Auto-triage check failed:', err);
      }
    };

    const interval = setInterval(checkForAutoActions, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [flags]);

  const triggerRollback = (reason: string) => {
    const action: RollbackAction = {
      ts: Date.now(),
      trigger: reason,
      status: 'pending'
    };

    console.log('🔄 AUTO-ROLLBACK TRIGGERED:', reason);

    // Simulate rollback process
    setTimeout(() => {
      action.status = 'success';
      action.deploymentId = `deploy-${Date.now()}`;

      setRollbackLog(prev => [...prev, action]);

      // Store in localStorage
      localStorage.setItem('rollbackLog', JSON.stringify([...rollbackLog, action]));

      console.log('✅ AUTO-ROLLBACK SUCCESS:', action.deploymentId);
    }, 3000);

    setRollbackLog(prev => [...prev, action]);
  };

  if (!flags) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
          <span className="text-sm text-gray-600">Loading auto-triage agent...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Auto-Triage Agent</h2>

      {/* Agent Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              agentStatus === 'active' ? 'bg-green-500 animate-pulse' :
              agentStatus === 'error' ? 'bg-red-500' :
              'bg-gray-400'
            }`} />
            <div>
              <h3 className="text-lg font-bold text-gray-900">Agent Status</h3>
              <p className="text-sm text-gray-600 mt-1 capitalize">{agentStatus}</p>
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

        {/* Configuration */}
        <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-500">Environment</div>
            <div className="text-lg font-bold text-gray-900 mt-1 uppercase">{flags.env}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">SEV-1 Threshold</div>
            <div className="text-lg font-bold text-gray-900 mt-1">
              {flags.autoRules.sev1_consecutive} consecutive
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Detection Window</div>
            <div className="text-lg font-bold text-gray-900 mt-1">
              {flags.autoRules.window_seconds}s
            </div>
          </div>
        </div>
      </div>

      {/* Rollback Log */}
      {rollbackLog.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Rollback History</h3>
          <div className="space-y-3">
            {rollbackLog.slice().reverse().map((action, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{action.trigger}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(action.ts).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {action.deploymentId && (
                    <span className="text-xs font-mono text-gray-600 bg-white px-2 py-1 rounded border border-gray-200">
                      {action.deploymentId}
                    </span>
                  )}
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                    action.status === 'success' ? 'bg-green-100 text-green-700 border-green-200' :
                    action.status === 'failed' ? 'bg-red-100 text-red-700 border-red-200' :
                    'bg-amber-100 text-amber-700 border-amber-200'
                  }`}>
                    {action.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
