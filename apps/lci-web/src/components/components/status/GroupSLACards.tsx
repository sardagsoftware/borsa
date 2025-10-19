'use client';
import React, { useState, useEffect } from 'react';
import SLOBar from './SLOBar';
import P95Bar from './P95Bar';
import type { HealthSnapshot, SLAGroup } from './types';

export default function GroupSLACards() {
  const [snapshots, setSnapshots] = useState<HealthSnapshot[]>([]);
  const [slaGroups, setSlaGroups] = useState<Record<string, SLAGroup>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load snapshots
    const loadSnapshots = () => {
      const stored = localStorage.getItem('healthRingBuffer');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSnapshots(parsed);
        } catch (err) {
          console.error('Failed to parse snapshots:', err);
        }
      }
    };

    // Load SLA groups
    const loadSLA = async () => {
      try {
        const res = await fetch('/data/sla.json');
        const data = await res.json();
        setSlaGroups(data.groups);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load SLA config:', err);
        setLoading(false);
      }
    };

    loadSnapshots();
    loadSLA();

    const interval = setInterval(loadSnapshots, 5000);
    return () => clearInterval(interval);
  }, []);

  const calculateGroupMetrics = (groupName: string) => {
    if (snapshots.length === 0) {
      return { uptime: 0, p95: 0 };
    }

    // Get all targets for this group
    const groupTargets = snapshots[0]?.items.filter(item => item.group === groupName) || [];
    const targetNames = groupTargets.map(t => t.name);

    if (targetNames.length === 0) {
      return { uptime: 0, p95: 0 };
    }

    // Calculate uptime
    let totalUpCount = 0;
    let totalChecks = 0;

    targetNames.forEach(name => {
      const targetSnapshots = snapshots
        .map(s => s.items.find(item => item.name === name))
        .filter(Boolean);

      const upCount = targetSnapshots.filter(t => t!.status === 'up').length;
      totalUpCount += upCount;
      totalChecks += targetSnapshots.length;
    });

    const uptime = totalChecks > 0 ? (totalUpCount / totalChecks) * 100 : 0;

    // Calculate P95 latency
    const allLatencies: number[] = [];
    targetNames.forEach(name => {
      const targetSnapshots = snapshots
        .map(s => s.items.find(item => item.name === name))
        .filter(Boolean);

      targetSnapshots.forEach(t => {
        if (t!.ms > 0) {
          allLatencies.push(t!.ms);
        }
      });
    });

    const sortedLatencies = [...allLatencies].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedLatencies.length * 0.95);
    const p95 = sortedLatencies[p95Index] || 0;

    return { uptime, p95 };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">SLA Performance by Group</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(slaGroups).map(([groupName, sla]) => {
          const metrics = calculateGroupMetrics(groupName);

          return (
            <div
              key={groupName}
              className="bg-white rounded-xl border border-gray-200 p-6 space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">{groupName}</h3>
                <div className="flex items-center gap-2">
                  {metrics.uptime >= sla.uptimeTarget && metrics.p95 <= sla.p95TargetMs ? (
                    <span className="px-3 py-1 text-xs font-bold bg-green-100 text-green-700 rounded-full border border-green-200">
                      ✓ SLA Met
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-full border border-red-200">
                      ✗ SLA Breach
                    </span>
                  )}
                </div>
              </div>

              {/* Uptime SLO */}
              <SLOBar
                current={metrics.uptime}
                target={sla.uptimeTarget}
                label="Uptime"
                unit="%"
              />

              {/* P95 Latency */}
              <P95Bar
                current={metrics.p95}
                target={sla.p95TargetMs}
                label="P95 Latency"
              />

              {/* Stats */}
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {metrics.uptime.toFixed(2)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Current Uptime</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 font-mono">
                      {metrics.p95.toFixed(0)}ms
                    </div>
                    <div className="text-xs text-gray-500 mt-1">P95 Latency</div>
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
