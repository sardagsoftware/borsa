'use client';
import React from 'react';
import Link from 'next/link';
import useHealth from './useHealth';
import StatusDot from './StatusDot';

export default function HealthMini() {
  const { loading, upCount, downCount, warnCount, total, upPct } = useHealth(60000);

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
        <div className="w-2 h-2 rounded-full bg-gray-400/50 animate-pulse" />
        <span className="text-sm text-gray-400">Checking...</span>
      </div>
    );
  }

  const overallStatus = downCount > 0 ? 'down' : warnCount > 0 ? 'warn' : 'up';

  return (
    <Link
      href="/status"
      className="group inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
    >
      <StatusDot status={overallStatus} size="md" showPulse={true} />

      <div className="flex flex-col">
        <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
          {overallStatus === 'up' ? 'All Systems Operational' :
           overallStatus === 'warn' ? 'Partial Degradation' :
           'Service Disruption'}
        </span>
        <span className="text-xs text-white/50">
          {upCount}/{total} services up • {upPct}% uptime
        </span>
      </div>

      <svg
        className="w-4 h-4 text-white/40 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
