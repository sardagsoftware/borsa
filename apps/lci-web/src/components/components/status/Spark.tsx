'use client';
import React, { useRef, useEffect } from 'react';

type SparkProps = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
};

export default function Spark({
  data,
  width = 100,
  height = 30,
  color = '#3b82f6',
  showDots = false
}: SparkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate scales
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const xStep = width / (data.length - 1 || 1);

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    data.forEach((val, i) => {
      const x = i * xStep;
      const y = height - ((val - min) / range) * height;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw dots if enabled
    if (showDots) {
      ctx.fillStyle = color;
      data.forEach((val, i) => {
        const x = i * xStep;
        const y = height - ((val - min) / range) * height;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }, [data, width, height, color, showDots]);

  return (
    <canvas
      ref={canvasRef}
      className="inline-block"
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
}
