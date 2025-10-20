"use client";

import { useMemo } from "react";

/**
 * SPARKLINE CHART COMPONENT
 *
 * Performanslı mini chart (SVG-based)
 * - 200 coin için optimize
 * - Smooth curves
 * - Gradient fill
 */

interface SparklineChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
}

export default function SparklineChart({
  data,
  width = 120,
  height = 40,
  color = "#10b981",
  showArea = true,
}: SparklineChartProps) {
  const { pathD, fillPathD, min, max } = useMemo(() => {
    if (data.length === 0) {
      return { pathD: "", fillPathD: "", min: 0, max: 0 };
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Calculate points
    const xStep = width / (data.length - 1 || 1);
    const points = data.map((value, index) => {
      const x = index * xStep;
      const y = height - ((value - min) / range) * height;
      return { x, y };
    });

    // Create smooth path (Bezier curves)
    let pathD = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];

      // Control points for smooth curve
      const cpX = (p0.x + p1.x) / 2;

      pathD += ` Q ${cpX} ${p0.y}, ${p1.x} ${p1.y}`;
    }

    // Fill path (area under curve)
    let fillPathD = pathD;
    fillPathD += ` L ${width} ${height} L 0 ${height} Z`;

    return { pathD, fillPathD, min, max };
  }, [data, width, height]);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-500 text-xs"
        style={{ width, height }}
      >
        No data
      </div>
    );
  }

  // Determine trend color
  const isPositive = data[data.length - 1] >= data[0];
  const trendColor = isPositive ? "#10b981" : "#ef4444";
  const finalColor = color || trendColor;

  return (
    <svg
      width={width}
      height={height}
      className="sparkline-chart"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {/* Area fill (gradient) */}
      {showArea && (
        <>
          <defs>
            <linearGradient id={`gradient-${Math.random()}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={finalColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={finalColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <path
            d={fillPathD}
            fill={`url(#gradient-${Math.random()})`}
            stroke="none"
          />
        </>
      )}

      {/* Line path */}
      <path
        d={pathD}
        fill="none"
        stroke={finalColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}
