'use client';

// 📊 SLA PROGRESS COMPONENT - Visual progress bars for SLA targets
// Shows uptime and P95 latency vs targets

import type { SLAGroup, GroupMetrics } from '@/types/health';

interface SLAProgressProps {
  group: SLAGroup;
  metrics: GroupMetrics;
  className?: string;
}

export default function SLAProgress({
  group,
  metrics,
  className = '',
}: SLAProgressProps) {
  const uptimeProgress = (metrics.uptimePct / group.uptimeTarget) * 100;
  const p95Progress = Math.max(0, 100 - (metrics.p95 / group.p95TargetMs) * 100);

  const uptimeMet = metrics.uptimePct >= group.uptimeTarget;
  const p95Met = metrics.p95 <= group.p95TargetMs;

  return (
    <div
      className={`rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {group.name}
        </h3>
        <div className="text-xs text-slate-500">
          {metrics.samples} samples
        </div>
      </div>

      {/* Uptime Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Uptime
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {metrics.uptimePct.toFixed(2)}%
            </span>
            <span className="text-xs text-slate-500">
              / {group.uptimeTarget}%
            </span>
            {uptimeMet ? (
              <span className="text-emerald-500">✓</span>
            ) : (
              <span className="text-red-500">✗</span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              uptimeMet
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                : 'bg-gradient-to-r from-amber-500 to-red-500'
            }`}
            style={{ width: `${Math.min(100, uptimeProgress)}%` }}
          />
        </div>
      </div>

      {/* P95 Latency Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            P95 Latency
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {metrics.p95}ms
            </span>
            <span className="text-xs text-slate-500">
              / {group.p95TargetMs}ms
            </span>
            {p95Met ? (
              <span className="text-emerald-500">✓</span>
            ) : (
              <span className="text-red-500">✗</span>
            )}
          </div>
        </div>

        {/* Progress bar (inverted - lower is better) */}
        <div className="h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              p95Met
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                : 'bg-gradient-to-r from-amber-500 to-red-500'
            }`}
            style={{ width: `${Math.min(100, p95Progress)}%` }}
          />
        </div>
      </div>

      {/* Status badge */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
            uptimeMet && p95Met
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          {uptimeMet && p95Met ? '✓ SLA Met' : '⚠️ SLA At Risk'}
        </div>
      </div>
    </div>
  );
}

/**
 * SLA Grid - Multiple groups
 */
interface SLAGridProps {
  groups: Array<{ group: SLAGroup; metrics: GroupMetrics }>;
  className?: string;
}

export function SLAGrid({ groups, className = '' }: SLAGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {groups.map((item, idx) => (
        <SLAProgress key={idx} group={item.group} metrics={item.metrics} />
      ))}
    </div>
  );
}
