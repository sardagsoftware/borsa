'use client';
import React, { useState, useEffect } from 'react';
import StatusDot from '../ui/StatusDot';
import Spark from './Spark';
import UptimeBadge from './UptimeBadge';
import type { HealthSnapshot, HealthRow } from './types';

export default function StatusTable() {
  const [snapshots, setSnapshots] = useState<HealthSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      setLoading(false);
    };

    loadSnapshots();
    const interval = setInterval(loadSnapshots, 5000);
    return () => clearInterval(interval);
  }, []);

  const calculateMetrics = (targetName: string) => {
    if (snapshots.length === 0) {
      return { uptime: 0, avgMs: 0, p95: 0, sparkData: [] };
    }

    const targetSnapshots = snapshots
      .map(s => s.items.find(item => item.name === targetName))
      .filter(Boolean) as HealthRow[];

    const upCount = targetSnapshots.filter(t => t.status === 'up').length;
    const uptime = (upCount / targetSnapshots.length) * 100;

    const msTimes = targetSnapshots.filter(t => t.ms > 0).map(t => t.ms);
    const avgMs = msTimes.length > 0 ? msTimes.reduce((a, b) => a + b, 0) / msTimes.length : 0;

    const sortedMs = [...msTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedMs.length * 0.95);
    const p95 = sortedMs[p95Index] || 0;

    const sparkData = targetSnapshots.slice(-30).map(t => t.ms || 0);

    return { uptime, avgMs, p95, sparkData };
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(snapshots, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    if (snapshots.length === 0) return;

    const headers = ['Timestamp', 'Target', 'Status', 'Code', 'Latency (ms)', 'Error'];
    const rows = snapshots.flatMap(snapshot =>
      snapshot.items.map(item => [
        new Date(snapshot.ts).toISOString(),
        item.name,
        item.status,
        item.code,
        item.ms,
        item.err || ''
      ])
    );

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  const latestSnapshot = snapshots[snapshots.length - 1];
  if (!latestSnapshot) {
    return (
      <div className="text-center py-12 text-gray-500">
        No health data available yet. Waiting for first check...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Buttons */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Service Status</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={exportJSON}
            className="px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
          >
            Export JSON
          </button>
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Status Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uptime
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P95 Latency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend (30m)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {latestSnapshot.items.map((item, idx) => {
                const metrics = calculateMetrics(item.name);
                return (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        {item.group && (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                            {item.group}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <StatusDot status={item.status} size="sm" showPulse={true} />
                        <span className="text-sm text-gray-600 capitalize">{item.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <UptimeBadge uptime={metrics.uptime} size="sm" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 font-mono">
                        {metrics.p95.toFixed(0)}ms
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {metrics.sparkData.length > 0 ? (
                        <Spark data={metrics.sparkData} width={80} height={24} showDots={false} />
                      ) : (
                        <span className="text-xs text-gray-400">No data</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
