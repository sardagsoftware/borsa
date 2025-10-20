/**
 * SKELETON LOADER COMPONENT
 *
 * Content placeholder with shimmer effect
 * - Multiple variants (text, card, avatar, etc.)
 * - Customizable size and shape
 * - Shimmer animation
 *
 * WHITE-HAT:
 * - Accessible (proper ARIA labels)
 * - Respects prefers-reduced-motion
 * - Improves perceived performance
 */

'use client';

import { prefersReducedMotion } from '@/lib/animations/animations';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  className?: string;
  animate?: boolean;
}

/**
 * Base Skeleton Component
 */
export function Skeleton({
  variant = 'rectangular',
  width = '100%',
  height = variant === 'text' ? '1em' : variant === 'circular' ? '40px' : '120px',
  className = '',
  animate = true,
}: SkeletonProps) {
  const reduced = prefersReducedMotion();
  const shouldAnimate = animate && !reduced;

  const borderRadiusMap = {
    text: '4px',
    circular: '50%',
    rectangular: '0',
    rounded: '8px',
  };

  return (
    <div
      className={`bg-white/5 ${shouldAnimate ? 'skeleton-shimmer' : ''} ${className}`}
      style={{
        width,
        height,
        borderRadius: borderRadiusMap[variant],
      }}
      role="status"
      aria-label="Loading"
      aria-live="polite"
    >
      <span className="sr-only">Loading content...</span>
    </div>
  );
}

/**
 * Skeleton Text
 * Multiple lines of text placeholder
 */
export function SkeletonText({
  lines = 3,
  gap = '8px',
  lastLineWidth = '70%',
  className = '',
}: {
  lines?: number;
  gap?: string;
  lastLineWidth?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`} style={{ gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton Card
 * Card placeholder with image + content
 */
export function SkeletonCard({
  hasImage = true,
  hasAvatar = false,
  lines = 3,
  className = '',
}: {
  hasImage?: boolean;
  hasAvatar?: boolean;
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`bg-bg-card border border-border rounded-lg p-4 ${className}`}>
      {/* Image */}
      {hasImage && (
        <Skeleton
          variant="rounded"
          height="160px"
          className="mb-4"
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        {hasAvatar && (
          <Skeleton
            variant="circular"
            width="40px"
            height="40px"
          />
        )}
        <div className="flex-1">
          <Skeleton
            variant="text"
            width="60%"
            height="16px"
            className="mb-2"
          />
          <Skeleton
            variant="text"
            width="40%"
            height="12px"
          />
        </div>
      </div>

      {/* Content */}
      <SkeletonText lines={lines} />
    </div>
  );
}

/**
 * Skeleton List
 * Multiple skeleton items
 */
export function SkeletonList({
  count = 5,
  gap = '12px',
  itemHeight = '60px',
  className = '',
}: {
  count?: number;
  gap?: string;
  itemHeight?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col ${className}`} style={{ gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton variant="circular" width="48px" height="48px" />
          <div className="flex-1">
            <Skeleton variant="text" width="70%" height="16px" className="mb-2" />
            <Skeleton variant="text" width="50%" height="12px" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton Table
 * Table placeholder
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className = '',
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" height="16px" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" height="14px" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton Coin Card
 * Crypto coin card placeholder
 */
export function SkeletonCoinCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-bg-card border border-border rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width="32px" height="32px" />
          <div>
            <Skeleton variant="text" width="80px" height="14px" className="mb-1" />
            <Skeleton variant="text" width="60px" height="12px" />
          </div>
        </div>
        <Skeleton variant="rectangular" width="60px" height="24px" />
      </div>

      {/* Price */}
      <Skeleton variant="text" width="120px" height="24px" className="mb-2" />

      {/* Change */}
      <Skeleton variant="text" width="80px" height="16px" className="mb-3" />

      {/* Chart */}
      <Skeleton variant="rounded" height="80px" />
    </div>
  );
}

export default Skeleton;
