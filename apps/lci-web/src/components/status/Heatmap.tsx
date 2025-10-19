'use client';

import React from 'react';

export default function Heatmap() {
  // Generate 7 days of sample data
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Simulate incident density (0-10)
  const data = days.map(() =>
    hours.map(() => Math.floor(Math.random() * 5))
  );

  const getColor = (value: number) => {
    if (value === 0) return 'bg-gray-100';
    if (value <= 2) return 'bg-green-200';
    if (value <= 4) return 'bg-amber-300';
    return 'bg-red-400';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">7-Day Incident Heatmap</h3>

      <div className="space-y-2">
        {days.map((day, dayIndex) => (
          <div key={day} className="flex items-center gap-2">
            <div className="w-12 text-xs text-gray-600">{day}</div>
            <div className="flex gap-1 flex-1">
              {data[dayIndex].map((value, hourIndex) => (
                <div
                  key={hourIndex}
                  className={`h-6 flex-1 rounded ${getColor(value)} hover:ring-2 hover:ring-blue-400 transition-all cursor-pointer`}
                  title={`${day} ${hourIndex}:00 - ${value} incidents`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded bg-gray-100" />
          <div className="w-4 h-4 rounded bg-green-200" />
          <div className="w-4 h-4 rounded bg-amber-300" />
          <div className="w-4 h-4 rounded bg-red-400" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
