/**
 * LOADING SPINNER COMPONENT
 *
 * Beautiful loading spinners
 * - Multiple variants
 * - Size options
 * - Color customization
 *
 * WHITE-HAT:
 * - Accessible (role="status", aria-label)
 * - Respects prefers-reduced-motion
 * - Lightweight animation
 */

'use client';

import { prefersReducedMotion } from '@/lib/animations/animations';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars';
  color?: string;
  label?: string;
  className?: string;
}

/**
 * Loading Spinner
 */
export function LoadingSpinner({
  size = 'md',
  variant = 'spinner',
  color = 'currentColor',
  label = 'Loading...',
  className = '',
}: LoadingSpinnerProps) {
  const reduced = prefersReducedMotion();

  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  };

  const sizeValue = sizeMap[size];

  if (variant === 'dots') {
    return (
      <div
        className={`flex items-center justify-center gap-1 ${className}`}
        role="status"
        aria-label={label}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`rounded-full ${reduced ? '' : 'animate-pulse'}`}
            style={{
              width: sizeValue / 4,
              height: sizeValue / 4,
              backgroundColor: color,
              animationDelay: `${i * 150}ms`,
            }}
          />
        ))}
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div
        className={`rounded-full ${reduced ? '' : 'animate-pulse'} ${className}`}
        style={{
          width: sizeValue,
          height: sizeValue,
          backgroundColor: color,
        }}
        role="status"
        aria-label={label}
      >
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  if (variant === 'bars') {
    return (
      <div
        className={`flex items-center justify-center gap-1 ${className}`}
        role="status"
        aria-label={label}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={reduced ? '' : 'animate-pulse'}
            style={{
              width: sizeValue / 8,
              height: sizeValue,
              backgroundColor: color,
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  // Default: spinner
  return (
    <div
      className={`inline-block ${reduced ? '' : 'animate-spin'} ${className}`}
      style={{
        width: sizeValue,
        height: sizeValue,
      }}
      role="status"
      aria-label={label}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color }}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * Fullscreen Loading
 * Cover entire screen with loading indicator
 */
export function FullscreenLoading({
  message = 'Loading...',
}: {
  message?: string;
}) {
  return (
    <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <LoadingSpinner size="xl" />
        <div className="mt-4 text-sm text-gray-400">{message}</div>
      </div>
    </div>
  );
}

/**
 * Inline Loading
 * Small loading indicator for inline use
 */
export function InlineLoading({
  text = 'Loading...',
}: {
  text?: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <LoadingSpinner size="sm" />
      <span>{text}</span>
    </div>
  );
}

export default LoadingSpinner;
