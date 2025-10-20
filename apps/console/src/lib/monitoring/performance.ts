/**
 * 📊 Performance Monitoring - p95/p99 Tracking
 *
 * Real-time performance metrics with percentile calculations
 * Target: p95 < 2000ms, p99 < 5000ms, first paint < 1500ms
 *
 * @module lib/monitoring/performance
 * @white-hat Compliant
 */

// ============================================================================
// Types
// ============================================================================

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  p50: number;
  p75: number;
  p95: number;
  p99: number;
  count: number;
}

// ============================================================================
// Performance Metrics Store
// ============================================================================

class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private readonly maxSamples = 1000; // Keep last 1000 samples per metric

  /**
   * Record a performance metric
   */
  record(name: string, value: number, metadata?: Record<string, any>): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const samples = this.metrics.get(name)!;
    samples.push(value);

    // Trim to max samples (rolling window)
    if (samples.length > this.maxSamples) {
      samples.shift();
    }

    // Send to telemetry (fire-and-forget)
    this.sendToTelemetry({
      name,
      value,
      timestamp: Date.now(),
      metadata,
    });
  }

  /**
   * Get statistics for a metric
   */
  getStats(name: string): PerformanceStats | null {
    const samples = this.metrics.get(name);

    if (!samples || samples.length === 0) {
      return null;
    }

    const sorted = [...samples].sort((a, b) => a - b);

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: sorted.reduce((a, b) => a + b, 0) / sorted.length,
      median: this.percentile(sorted, 50),
      p50: this.percentile(sorted, 50),
      p75: this.percentile(sorted, 75),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
      count: sorted.length,
    };
  }

  /**
   * Calculate percentile from sorted array
   */
  private percentile(sorted: number[], p: number): number {
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (lower === upper) {
      return sorted[lower];
    }

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Get all metric names
   */
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  /**
   * Send to telemetry backend (fire-and-forget)
   */
  private async sendToTelemetry(metric: PerformanceMetric): Promise<void> {
    try {
      // Only send to telemetry in production
      if (process.env.NODE_ENV !== 'production') {
        return;
      }

      await fetch('/api/telemetry/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      });
    } catch (error) {
      // Silent fail - telemetry should not block execution
      console.error('[Telemetry] Failed to send metric:', error);
    }
  }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor();

// ============================================================================
// Performance Timing Helpers
// ============================================================================

/**
 * Measure execution time of async function
 *
 * @example
 * ```typescript
 * const result = await measureAsync('api_call', async () => {
 *   return await fetch('/api/data');
 * });
 * ```
 */
export async function measureAsync<T>(
  metricName: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const start = performance.now();

  try {
    const result = await fn();
    const duration = performance.now() - start;

    perfMonitor.record(metricName, duration, {
      ...metadata,
      success: true,
    });

    return result;
  } catch (error) {
    const duration = performance.now() - start;

    perfMonitor.record(metricName, duration, {
      ...metadata,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * Measure execution time of sync function
 */
export function measureSync<T>(
  metricName: string,
  fn: () => T,
  metadata?: Record<string, any>
): T {
  const start = performance.now();

  try {
    const result = fn();
    const duration = performance.now() - start;

    perfMonitor.record(metricName, duration, {
      ...metadata,
      success: true,
    });

    return result;
  } catch (error) {
    const duration = performance.now() - start;

    perfMonitor.record(metricName, duration, {
      ...metadata,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

// ============================================================================
// Web Vitals (Client-Side)
// ============================================================================

/**
 * Track Core Web Vitals (CWV)
 * - LCP: Largest Contentful Paint (< 2.5s)
 * - FID: First Input Delay (< 100ms)
 * - CLS: Cumulative Layout Shift (< 0.1)
 */
export function trackWebVitals(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // LCP - Largest Contentful Paint
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;

        if (lastEntry) {
          perfMonitor.record('web_vitals_lcp', lastEntry.renderTime || lastEntry.loadTime);
        }
      });

      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (error) {
      console.error('[WebVitals] LCP tracking failed:', error);
    }

    // FID - First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          perfMonitor.record('web_vitals_fid', (entry as any).processingStart - entry.startTime);
        }
      });

      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch (error) {
      console.error('[WebVitals] FID tracking failed:', error);
    }

    // CLS - Cumulative Layout Shift
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            perfMonitor.record('web_vitals_cls', clsValue);
          }
        }
      });

      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (error) {
      console.error('[WebVitals] CLS tracking failed:', error);
    }
  }

  // First Paint
  if (window.performance && window.performance.getEntriesByType) {
    const paintEntries = window.performance.getEntriesByType('paint');
    for (const entry of paintEntries) {
      if (entry.name === 'first-paint') {
        perfMonitor.record('first_paint', entry.startTime);
      }
      if (entry.name === 'first-contentful-paint') {
        perfMonitor.record('first_contentful_paint', entry.startTime);
      }
    }
  }
}

// ============================================================================
// Performance Alerts
// ============================================================================

/**
 * Check if performance targets are met
 * Target: p95 < 2000ms, p99 < 5000ms
 */
export function checkPerformanceTargets(metricName: string): {
  passed: boolean;
  issues: string[];
} {
  const stats = perfMonitor.getStats(metricName);
  const issues: string[] = [];

  if (!stats) {
    return { passed: true, issues: ['No data available'] };
  }

  // Check p95 target
  if (stats.p95 > 2000) {
    issues.push(`p95 (${Math.round(stats.p95)}ms) exceeds target (2000ms)`);
  }

  // Check p99 target
  if (stats.p99 > 5000) {
    issues.push(`p99 (${Math.round(stats.p99)}ms) exceeds target (5000ms)`);
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}

// ============================================================================
// Performance Dashboard Data
// ============================================================================

/**
 * Get performance dashboard data
 */
export function getPerformanceDashboard(): {
  metrics: Array<{
    name: string;
    stats: PerformanceStats;
    targetsMet: boolean;
    issues: string[];
  }>;
  summary: {
    totalMetrics: number;
    targetsMet: number;
    targetsNotMet: number;
  };
} {
  const metricNames = perfMonitor.getMetricNames();
  const metrics = [];

  let targetsMet = 0;
  let targetsNotMet = 0;

  for (const name of metricNames) {
    const stats = perfMonitor.getStats(name);
    if (!stats) continue;

    const check = checkPerformanceTargets(name);

    metrics.push({
      name,
      stats,
      targetsMet: check.passed,
      issues: check.issues,
    });

    if (check.passed) {
      targetsMet++;
    } else {
      targetsNotMet++;
    }
  }

  return {
    metrics,
    summary: {
      totalMetrics: metrics.length,
      targetsMet,
      targetsNotMet,
    },
  };
}

// ============================================================================
// Export All
// ============================================================================

export { perfMonitor as default };

// Auto-initialize web vitals tracking (client-side)
if (typeof window !== 'undefined') {
  // Track web vitals after page load
  if (document.readyState === 'complete') {
    trackWebVitals();
  } else {
    window.addEventListener('load', trackWebVitals);
  }
}

console.log('✅ Performance monitoring initialized (p95/p99 tracking enabled)');
