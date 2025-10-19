'use client';

// 🗓️ HEATMAP CHART - 7-day incident visualization
// Canvas-based heatmap with hover tooltips

import { useEffect, useRef, useState } from 'react';
import type { HealthSnapshot } from '@/types/health';

interface HeatmapChartProps {
  snapshots: HealthSnapshot[];
  width?: number;
  height?: number;
  className?: string;
}

interface HeatmapCell {
  day: number;
  hour: number;
  incidents: number;
  total: number;
}

export default function HeatmapChart({
  snapshots,
  width = 800,
  height = 200,
  className = '',
}: HeatmapChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || snapshots.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Grid dimensions
    const days = 7;
    const hours = 24;
    const cellW = width / hours;
    const cellH = height / days;

    // Calculate incident counts per hour
    const grid: number[][] = Array(days)
      .fill(0)
      .map(() => Array(hours).fill(0));

    snapshots.forEach(snap => {
      const date = new Date(snap.ts);
      const dayOfWeek = (date.getDay() + 6) % 7; // Monday = 0
      const hour = date.getHours();
      const incidents = snap.items.filter(i => i.status !== 'up').length;
      grid[dayOfWeek][hour] += incidents;
    });

    // Find max for color scaling
    const maxCount = Math.max(...grid.flat(), 1);

    // Render heatmap
    grid.forEach((row, d) => {
      row.forEach((count, h) => {
        const intensity = count / maxCount;
        const alpha = 0.2 + intensity * 0.8;

        // Aurora Matrix purple gradient
        if (count === 0) {
          ctx.fillStyle = '#F8FAFC'; // Slate 50 for zero
        } else {
          ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`; // Violet gradient
        }

        ctx.fillRect(h * cellW, d * cellH, cellW - 1, cellH - 1);

        // Draw text for high incident counts
        if (count > 0) {
          ctx.fillStyle = alpha > 0.5 ? '#FFFFFF' : '#1E293B';
          ctx.font = '10px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            count.toString(),
            h * cellW + cellW / 2,
            d * cellH + cellH / 2
          );
        }
      });
    });

    // Draw grid lines
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 0.5;

    // Vertical lines (hours)
    for (let h = 0; h <= hours; h++) {
      ctx.beginPath();
      ctx.moveTo(h * cellW, 0);
      ctx.lineTo(h * cellW, height);
      ctx.stroke();
    }

    // Horizontal lines (days)
    for (let d = 0; d <= days; d++) {
      ctx.beginPath();
      ctx.moveTo(0, d * cellH);
      ctx.lineTo(width, d * cellH);
      ctx.stroke();
    }
  }, [snapshots, width, height]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cellW = width / 24;
    const cellH = height / 7;

    const hour = Math.floor(x / cellW);
    const day = Math.floor(y / cellH);

    if (hour >= 0 && hour < 24 && day >= 0 && day < 7) {
      // Calculate incidents for this cell
      const cellSnapshots = snapshots.filter(snap => {
        const date = new Date(snap.ts);
        const snapDay = (date.getDay() + 6) % 7;
        const snapHour = date.getHours();
        return snapDay === day && snapHour === hour;
      });

      const incidents = cellSnapshots.reduce(
        (sum, snap) => sum + snap.items.filter(i => i.status !== 'up').length,
        0
      );

      setHoveredCell({
        day,
        hour,
        incidents,
        total: cellSnapshots.length,
      });
    } else {
      setHoveredCell(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
  };

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className={`relative ${className}`}>
      {/* Day labels */}
      <div className="flex mb-2">
        <div className="w-12" />
        <div className="flex-1 text-xs text-slate-500 flex justify-between px-2">
          {Array.from({ length: 24 }, (_, i) => (
            <span key={i}>{i % 6 === 0 ? `${i}h` : ''}</span>
          ))}
        </div>
      </div>

      <div className="flex">
        {/* Day labels (vertical) */}
        <div className="w-12 flex flex-col justify-around text-xs text-slate-500">
          {dayNames.map(day => (
            <span key={day}>{day}</span>
          ))}
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="rounded border border-slate-200 dark:border-slate-800 cursor-crosshair"
          style={{ width, height }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div className="absolute top-0 right-0 bg-slate-900 text-white text-xs p-2 rounded shadow-lg">
          <div className="font-medium">
            {dayNames[hoveredCell.day]} {hoveredCell.hour}:00
          </div>
          <div className="text-slate-300">
            {hoveredCell.incidents} incidents ({hoveredCell.total} checks)
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
        <span>Fewer incidents</span>
        <div className="flex gap-0.5">
          {[0.2, 0.4, 0.6, 0.8, 1.0].map((alpha, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded"
              style={{ backgroundColor: `rgba(139, 92, 246, ${alpha})` }}
            />
          ))}
        </div>
        <span>More incidents</span>
      </div>
    </div>
  );
}
