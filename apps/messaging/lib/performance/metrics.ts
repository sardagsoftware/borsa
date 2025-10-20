/**
 * SHARD_13.1 - Performance Metrics
 * Web Vitals and performance monitoring
 *
 * Metrics: LCP, FID, CLS, TTFB, FCP
 * White Hat: User-centric performance
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

export interface WebVitals {
  lcp?: PerformanceMetric; // Largest Contentful Paint
  fid?: PerformanceMetric; // First Input Delay
  cls?: PerformanceMetric; // Cumulative Layout Shift
  fcp?: PerformanceMetric; // First Contentful Paint
  ttfb?: PerformanceMetric; // Time to First Byte
}

/**
 * Web Vitals thresholds (Google standards)
 */
const THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 }, // ms
  fid: { good: 100, poor: 300 }, // ms
  cls: { good: 0.1, poor: 0.25 }, // score
  fcp: { good: 1800, poor: 3000 }, // ms
  ttfb: { good: 800, poor: 1800 } // ms
};

/**
 * Get performance rating
 */
export function getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metric as keyof typeof THRESHOLDS];

  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Measure LCP (Largest Contentful Paint)
 */
export function measureLCP(callback: (metric: PerformanceMetric) => void): void {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;

      const value = lastEntry.renderTime || lastEntry.loadTime;

      callback({
        name: 'LCP',
        value,
        rating: getRating('lcp', value),
        timestamp: Date.now()
      });
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (error) {
    console.error('[PERF] LCP measurement error:', error);
  }
}

/**
 * Measure FID (First Input Delay)
 */
export function measureFID(callback: (metric: PerformanceMetric) => void): void {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstEntry = entries[0] as any;

      const value = firstEntry.processingStart - firstEntry.startTime;

      callback({
        name: 'FID',
        value,
        rating: getRating('fid', value),
        timestamp: Date.now()
      });
    });

    observer.observe({ type: 'first-input', buffered: true });
  } catch (error) {
    console.error('[PERF] FID measurement error:', error);
  }
}

/**
 * Measure CLS (Cumulative Layout Shift)
 */
export function measureCLS(callback: (metric: PerformanceMetric) => void): void {
  if (!('PerformanceObserver' in window)) return;

  let clsValue = 0;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;

          callback({
            name: 'CLS',
            value: clsValue,
            rating: getRating('cls', clsValue),
            timestamp: Date.now()
          });
        }
      });
    });

    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (error) {
    console.error('[PERF] CLS measurement error:', error);
  }
}

/**
 * Measure FCP (First Contentful Paint)
 */
export function measureFCP(callback: (metric: PerformanceMetric) => void): void {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstEntry = entries[0] as any;

      const value = firstEntry.startTime;

      callback({
        name: 'FCP',
        value,
        rating: getRating('fcp', value),
        timestamp: Date.now()
      });

      observer.disconnect();
    });

    observer.observe({ type: 'paint', buffered: true });
  } catch (error) {
    console.error('[PERF] FCP measurement error:', error);
  }
}

/**
 * Measure TTFB (Time to First Byte)
 */
export function measureTTFB(callback: (metric: PerformanceMetric) => void): void {
  if (!performance || !performance.timing) return;

  try {
    // Use Navigation Timing API
    const timing = performance.timing;
    const value = timing.responseStart - timing.requestStart;

    callback({
      name: 'TTFB',
      value,
      rating: getRating('ttfb', value),
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('[PERF] TTFB measurement error:', error);
  }
}

/**
 * Measure all Web Vitals
 */
export function measureWebVitals(callback: (vitals: WebVitals) => void): void {
  const vitals: WebVitals = {};

  measureLCP((metric) => {
    vitals.lcp = metric;
    callback(vitals);
  });

  measureFID((metric) => {
    vitals.fid = metric;
    callback(vitals);
  });

  measureCLS((metric) => {
    vitals.cls = metric;
    callback(vitals);
  });

  measureFCP((metric) => {
    vitals.fcp = metric;
    callback(vitals);
  });

  measureTTFB((metric) => {
    vitals.ttfb = metric;
    callback(vitals);
  });
}

/**
 * Get performance score (0-100)
 */
export function getPerformanceScore(vitals: WebVitals): number {
  let score = 0;
  let count = 0;

  Object.values(vitals).forEach((metric) => {
    if (metric) {
      count++;
      if (metric.rating === 'good') score += 100;
      else if (metric.rating === 'needs-improvement') score += 50;
      else score += 0;
    }
  });

  return count > 0 ? Math.round(score / count) : 0;
}

/**
 * Format metric value
 */
export function formatMetricValue(name: string, value: number): string {
  if (name === 'CLS') {
    return value.toFixed(3);
  }
  return `${Math.round(value)} ms`;
}

/**
 * Get metric color
 */
export function getMetricColor(rating: 'good' | 'needs-improvement' | 'poor'): string {
  switch (rating) {
    case 'good':
      return '#10A37F';
    case 'needs-improvement':
      return '#F59E0B';
    case 'poor':
      return '#EF4444';
  }
}

/**
 * Report Web Vitals to analytics
 */
export function reportWebVitals(vitals: WebVitals): void {
  // In production, send to analytics service
  if (process.env.NODE_ENV === 'production') {
    // fetch('/api/analytics/web-vitals', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(vitals)
    // });
  }

  console.log('[PERF] Web Vitals:', vitals);
}

/**
 * Get resource timing
 */
export function getResourceTiming(): PerformanceResourceTiming[] {
  if (!performance || !performance.getEntriesByType) return [];

  return performance.getEntriesByType('resource') as PerformanceResourceTiming[];
}

/**
 * Get largest resources
 */
export function getLargestResources(limit: number = 10): Array<{
  name: string;
  size: number;
  duration: number;
  type: string;
}> {
  const resources = getResourceTiming();

  return resources
    .map((r) => ({
      name: r.name,
      size: r.transferSize || 0,
      duration: r.duration,
      type: r.initiatorType
    }))
    .sort((a, b) => b.size - a.size)
    .slice(0, limit);
}

/**
 * Get performance summary
 */
export function getPerformanceSummary(): {
  totalResources: number;
  totalSize: number;
  totalDuration: number;
  largestResource: string;
} {
  const resources = getResourceTiming();

  const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
  const totalDuration = resources.reduce((sum, r) => sum + r.duration, 0);

  const largest = resources.reduce((max, r) =>
    (r.transferSize || 0) > (max.transferSize || 0) ? r : max
  , resources[0]);

  return {
    totalResources: resources.length,
    totalSize,
    totalDuration,
    largestResource: largest?.name || 'N/A'
  };
}
