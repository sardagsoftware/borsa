'use client';
import React, { useState, useEffect, useRef } from 'react';
import type { Incident } from './types';

export default function Heatmap() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadIncidents = () => {
      const stored = localStorage.getItem('incidentLog');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setIncidents(parsed);
        } catch (err) {
          console.error('Failed to parse incidents:', err);
        }
      }
    };

    loadIncidents();
    const interval = setInterval(loadIncidents, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || incidents.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas dimensions
    const cellWidth = 40;
    const cellHeight = 30;
    const cols = 24; // hours
    const rows = 7; // days
    canvas.width = cols * cellWidth;
    canvas.height = rows * cellHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create 7-day heatmap data
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const heatmapData: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(0));

    // Count incidents per hour for last 7 days
    incidents.forEach(inc => {
      const age = now - inc.ts;
      if (age < 7 * dayMs) {
        const dayIndex = Math.floor(age / dayMs);
        const hourIndex = new Date(inc.ts).getHours();
        if (dayIndex < rows && hourIndex < cols) {
          heatmapData[dayIndex][hourIndex]++;
        }
      }
    });

    // Find max for color scale
    const maxCount = Math.max(...heatmapData.flat(), 1);

    // Draw cells
    heatmapData.forEach((row, dayIdx) => {
      row.forEach((count, hourIdx) => {
        const x = hourIdx * cellWidth;
        const y = dayIdx * cellHeight;

        // Color intensity based on count
        const intensity = count / maxCount;
        if (count === 0) {
          ctx.fillStyle = '#f3f4f6'; // gray-100
        } else if (intensity < 0.25) {
          ctx.fillStyle = '#dbeafe'; // blue-100
        } else if (intensity < 0.5) {
          ctx.fillStyle = '#93c5fd'; // blue-300
        } else if (intensity < 0.75) {
          ctx.fillStyle = '#3b82f6'; // blue-500
        } else {
          ctx.fillStyle = '#1e40af'; // blue-700
        }

        ctx.fillRect(x, y, cellWidth - 2, cellHeight - 2);

        // Draw count if > 0
        if (count > 0) {
          ctx.fillStyle = intensity > 0.5 ? '#ffffff' : '#1f2937';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(count.toString(), x + cellWidth / 2, y + cellHeight / 2);
        }
      });
    });

    // Draw labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';

    // Hour labels (top)
    for (let h = 0; h < 24; h += 3) {
      ctx.fillText(
        `${h}h`,
        h * cellWidth + cellWidth / 2,
        canvas.height + 15
      );
    }

  }, [incidents]);

  const dayLabels = ['Today', '1d ago', '2d ago', '3d ago', '4d ago', '5d ago', '6d ago'];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">7-Day Incident Heatmap</h2>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-6">
          {/* Day labels */}
          <div className="flex flex-col gap-[18px] pt-1">
            {dayLabels.map((label, idx) => (
              <div key={idx} className="text-xs text-gray-500 h-[30px] flex items-center">
                {label}
              </div>
            ))}
          </div>

          {/* Heatmap */}
          <div className="overflow-x-auto">
            <canvas ref={canvasRef} className="block" />
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="text-xs text-gray-500">Less</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded" />
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded" />
            <div className="w-4 h-4 bg-blue-300 border border-blue-300 rounded" />
            <div className="w-4 h-4 bg-blue-500 border border-blue-500 rounded" />
            <div className="w-4 h-4 bg-blue-700 border border-blue-700 rounded" />
          </div>
          <span className="text-xs text-gray-500">More</span>
        </div>
      </div>
    </div>
  );
}
