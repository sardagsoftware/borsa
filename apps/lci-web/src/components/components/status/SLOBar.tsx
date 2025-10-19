'use client';
import React from 'react';

type SLOBarProps = {
  current: number;
  target: number;
  label: string;
  unit?: string;
};

export default function SLOBar({ current, target, label, unit = '%' }: SLOBarProps) {
  const percentage = Math.min((current / target) * 100, 100);
  const isAboveTarget = current >= target;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex items-baseline gap-2">
          <span className={`text-sm font-bold ${isAboveTarget ? 'text-green-600' : 'text-red-600'}`}>
            {current.toFixed(2)}{unit}
          </span>
          <span className="text-xs text-gray-500">/ {target}{unit}</span>
        </div>
      </div>

      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
            isAboveTarget
              ? 'bg-gradient-to-r from-green-400 to-emerald-500'
              : 'bg-gradient-to-r from-red-400 to-rose-500'
          }`}
          style={{ width: `${percentage}%` }}
        />

        {/* Target marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-gray-400"
          style={{ left: '100%' }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Progress: {percentage.toFixed(1)}%</span>
        {isAboveTarget ? (
          <span className="text-green-600 font-medium">✓ Target Met</span>
        ) : (
          <span className="text-red-600 font-medium">✗ Below Target</span>
        )}
      </div>
    </div>
  );
}
