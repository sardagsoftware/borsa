'use client';
import React from 'react';

type P95BarProps = {
  current: number;
  target: number;
  label: string;
};

export default function P95Bar({ current, target, label }: P95BarProps) {
  const percentage = Math.min((current / target) * 100, 150); // Allow overage display
  const isBelowTarget = current <= target;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex items-baseline gap-2">
          <span className={`text-sm font-bold font-mono ${isBelowTarget ? 'text-green-600' : 'text-red-600'}`}>
            {current.toFixed(0)}ms
          </span>
          <span className="text-xs text-gray-500">/ {target}ms</span>
        </div>
      </div>

      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
            isBelowTarget
              ? 'bg-gradient-to-r from-green-400 to-emerald-500'
              : 'bg-gradient-to-r from-red-400 to-rose-500'
          }`}
          style={{ width: `${percentage}%` }}
        />

        {/* Target marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-gray-600"
          style={{ left: '100%' }}
        >
          <div className="absolute -top-1 -left-1 w-3 h-3 border-2 border-gray-600 bg-white rounded-full" />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {isBelowTarget ? (
            <>Under by {(target - current).toFixed(0)}ms</>
          ) : (
            <>Over by {(current - target).toFixed(0)}ms</>
          )}
        </span>
        {isBelowTarget ? (
          <span className="text-green-600 font-medium">✓ Within SLA</span>
        ) : (
          <span className="text-red-600 font-medium">✗ SLA Breach</span>
        )}
      </div>
    </div>
  );
}
