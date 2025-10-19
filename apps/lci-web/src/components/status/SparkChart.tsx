'use client';

// 📊 SPARK CHART COMPONENT - Canvas-based mini latency chart
// Features: Real-time updates, status coloring, responsive

import { useEffect, useRef } from 'react';
import type { HealthStatus } from '@/types/health';
import { getStatusColor } from '@/lib/health';

interface SparkChartProps {
  data: Array<{ ts: number; ms: number; status: HealthStatus }>;
  width?: number;
  height?: number;
  lineWidth?: number;
  showGrid?: boolean;
  className?: string;
}

export default function SparkChart({
  data,
  width = 200,
  height = 40,
  lineWidth = 2,
  showGrid = false,
  className = '',
}: SparkChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find min/max for scaling
    const values = data.map(d => d.ms);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    // Draw grid (optional)
    if (showGrid) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 0.5;

      // Horizontal lines
      for (let i = 0; i <= 2; i++) {
        const y = (height / 2) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // Draw line chart
    const stepX = width / (data.length - 1 || 1);

    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    data.forEach((point, i) => {
      const x = i * stepX;
      const y = height - ((point.ms - min) / range) * (height - 4) - 2;
      const color = getStatusColor(point.status);

      if (i === 0) {
        ctx.beginPath();
        ctx.moveTo(x, y);
      } else {
        ctx.strokeStyle = color;
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
      }

      // Draw dots
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, lineWidth, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [data, width, height, lineWidth, showGrid]);

  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded ${className}`}
        style={{ width, height }}
      >
        <span className="text-xs text-slate-400">No data</span>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`rounded ${className}`}
      style={{ width, height }}
    />
  );
}

/**
 * Status Spark Chart - Shows colored bars based on status
 */
interface StatusSparkChartProps {
  data: Array<{ ts: number; status: HealthStatus }>;
  width?: number;
  height?: number;
  className?: string;
}

export function StatusSparkChart({
  data,
  width = 200,
  height = 20,
  className = '',
}: StatusSparkChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const barWidth = width / data.length;

    data.forEach((point, i) => {
      const x = i * barWidth;
      const color = getStatusColor(point.status);

      ctx.fillStyle = color;
      ctx.fillRect(x, 0, barWidth - 1, height);
    });
  }, [data, width, height]);

  if (data.length === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`rounded ${className}`}
      style={{ width, height }}
    />
  );
}
