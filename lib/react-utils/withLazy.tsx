/**
 * React Lazy Loading Utility with Suspense
 * @file withLazy.tsx
 * @description Helper for code-splitting with React.lazy and Suspense
 */

import React, { Suspense } from 'react';

/**
 * Wraps a lazy-loaded component with Suspense
 * @template T Component type
 * @param factory Dynamic import function
 * @param fallback Optional loading fallback (defaults to "Loading...")
 * @returns Wrapped component with Suspense
 *
 * @example
 * ```tsx
 * const LazyDashboard = withLazy(
 *   () => import('./Dashboard'),
 *   <Spinner />
 * );
 *
 * // Usage
 * <LazyDashboard userId={123} />
 * ```
 */
export function withLazy<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
): React.FC<React.ComponentProps<T>> {
  const LazyComponent = React.lazy(factory);

  const Wrapped: React.FC<React.ComponentProps<T>> = (props) => {
    return (
      <Suspense fallback={fallback ?? <div>Loading...</div>}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };

  // Preserve display name for debugging
  Wrapped.displayName = `withLazy(${LazyComponent.displayName || 'Component'})`;

  return Wrapped;
}

/**
 * Simple loading spinner component
 */
export const DefaultLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

/**
 * Lazy load with default spinner
 */
export function withLazySpinner<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.FC<React.ComponentProps<T>> {
  return withLazy(factory, <DefaultLoadingFallback />);
}
