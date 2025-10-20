/**
 * Live KPIs Dashboard with Realtime Updates
 * Displays Season 2 metrics with WebSocket streaming
 */

'use client';

import React from 'react';
import { normalizeKpis } from '@/lib/kpis/normalize';
import { useRealtime } from '@/lib/realtime/client/useRealtime';

interface KPIsLiveProps {
  initialData: any;
}

export default function KPIsLive({ initialData }: KPIsLiveProps) {
  // Use realtime hook for live updates
  const { data: realtimeData, connected, stats } = useRealtime<any>('kpis.s2', {
    scopes: ['ops.admin'],
  });

  // Use realtime data if available, otherwise fall back to initial data
  const k = realtimeData ? normalizeKpis(realtimeData) : initialData;

  return (
    <main className="container max-w-6xl py-8">
      {/* Header with connection status */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">S2 • KPI / Telemetry</h1>
        <div className="flex items-center gap-3 text-sm">
          {/* Connection indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
              }`}
            />
            <span className="opacity-80">
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* Stats */}
          {stats.messagesReceived > 0 && (
            <span className="opacity-60 text-xs">
              {stats.messagesReceived} updates
            </span>
          )}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid md:grid-cols-3 gap-3 text-sm">
        <MetricCard
          label="Crash-free"
          value={k.crash_free ?? 'N/A'}
          unit="%"
          target={99.5}
          isGood={k.crash_free >= 99.5}
          live={connected}
        />
        <MetricCard
          label="p95 GPU"
          value={k.p95_gpu_ms ?? 'N/A'}
          unit=" ms"
          target={16.67}
          isGood={k.p95_gpu_ms <= 16.67}
          inverted
          live={connected}
        />
        <MetricCard
          label="Latency"
          value={k.server_latency ?? 'N/A'}
          unit=" ms"
          target={100}
          isGood={k.server_latency <= 100}
          inverted
          live={connected}
        />
        <MetricCard
          label="Retention D1/D7/D30"
          value={`${k.retention?.d1 ?? '–'}/${k.retention?.d7 ?? '–'}/${k.retention?.d30 ?? '–'}`}
          live={connected}
        />
        <MetricCard
          label="Inflation"
          value={k.inflation ?? 'N/A'}
          target={1.0}
          isGood={k.inflation && Math.abs(k.inflation - 1.0) <= 0.1}
          live={connected}
        />
        <MetricCard
          label="Timestamp"
          value={k.ts ?? 'N/A'}
          live={connected}
        />
      </div>

      {/* Debug info (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-black/20 rounded-lg text-xs opacity-60">
          <div>Reconnects: {stats.reconnectCount}</div>
          <div>Messages: {stats.messagesReceived}</div>
          <div>Mode: {realtimeData ? 'Realtime' : 'Initial'}</div>
        </div>
      )}
    </main>
  );
}

/**
 * Metric Card Component
 */
interface MetricCardProps {
  label: string;
  value: any;
  unit?: string;
  target?: number;
  isGood?: boolean;
  inverted?: boolean;
  live?: boolean;
}

function MetricCard({
  label,
  value,
  unit = '',
  target,
  isGood,
  inverted = false,
  live = false,
}: MetricCardProps) {
  const bgColor = isGood
    ? 'bg-green-500/10 border-green-500/30'
    : isGood === false
    ? 'bg-yellow-500/10 border-yellow-500/30'
    : 'bg-white/5 border-white/10';

  return (
    <div
      className={`rounded-lg border p-3 transition-all duration-300 ${bgColor} ${
        live ? 'ring-1 ring-lydian-gold/20' : ''
      }`}
    >
      <div className="text-xs opacity-70 mb-1">{label}</div>
      <div className="text-lg font-bold">
        {value}
        {unit}
      </div>
      {target !== undefined && (
        <div className="text-xs opacity-60 mt-1">
          Target: {target}
          {unit}
        </div>
      )}
    </div>
  );
}
