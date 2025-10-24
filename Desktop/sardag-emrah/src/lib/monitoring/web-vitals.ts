/**
 * WEB VITALS MONITORING
 *
 * Privacy-first Core Web Vitals tracking
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay)
 * - CLS (Cumulative Layout Shift)
 * - FCP (First Contentful Paint)
 * - TTFB (Time to First Byte)
 *
 * WHITE-HAT PRINCIPLES:
 * - Local-only tracking (no external services without consent)
 * - User can disable
 * - Transparent data collection
 * - Privacy preserving
 */

export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint (target: <2500ms)
  fid?: number; // First Input Delay (target: <100ms)
  cls?: number; // Cumulative Layout Shift (target: <0.1)
  fcp?: number; // First Contentful Paint (target: <1800ms)
  ttfb?: number; // Time to First Byte (target: <800ms)

  // Additional metrics
  domLoad?: number; // DOM load time
  windowLoad?: number; // Window load time
  resourceLoad?: number; // Resource load time

  // Custom metrics
  timeToInteractive?: number;
  firstPaint?: number;

  // Timestamp
  timestamp: number;
  url: string;
}

class WebVitalsMonitor {
  private metrics: PerformanceMetrics = {
    timestamp: Date.now(),
    url: typeof window !== 'undefined' ? window.location.href : '',
  };

  private enabled = true;
  private reported = false;

  constructor() {
    if (typeof window === 'undefined') return;

    // Check if user has consented to analytics
    this.enabled = this.hasConsent();

    if (this.enabled) {
      this.initMonitoring();
    }
  }

  /**
   * Check if user has consented to analytics
   * WHITE-HAT: Respect user privacy choices
   */
  private hasConsent(): boolean {
    if (typeof localStorage === 'undefined') return false;

    const consent = localStorage.getItem('analytics_consent');
    // Default to true for now, but in production you should ask user
    return consent !== 'false';
  }

  /**
   * Initialize Web Vitals monitoring
   */
  private initMonitoring(): void {
    // Use native Performance APIs
    this.measureNavigationTiming();
    this.measurePaintTiming();

    // Modern browsers support Web Vitals via PerformanceObserver
    if ('PerformanceObserver' in window) {
      this.observeLCP();
      this.observeFID();
      this.observeCLS();
    }

    // Report metrics after page load
    if (document.readyState === 'complete') {
      this.reportMetrics();
    } else {
      window.addEventListener('load', () => this.reportMetrics(), { once: true });
    }
  }

  /**
   * Measure Navigation Timing
   */
  private measureNavigationTiming(): void {
    if (!('performance' in window)) return;

    const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!perfData) return;

    this.metrics.ttfb = perfData.responseStart - perfData.requestStart;
    this.metrics.domLoad = perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart;
    this.metrics.windowLoad = perfData.loadEventEnd - perfData.loadEventStart;
    this.metrics.resourceLoad = perfData.loadEventEnd - perfData.fetchStart;
  }

  /**
   * Measure Paint Timing
   */
  private measurePaintTiming(): void {
    if (!('performance' in window)) return;

    const paintEntries = window.performance.getEntriesByType('paint');

    for (const entry of paintEntries) {
      if (entry.name === 'first-paint') {
        this.metrics.firstPaint = entry.startTime;
      } else if (entry.name === 'first-contentful-paint') {
        this.metrics.fcp = entry.startTime;
      }
    }
  }

  /**
   * Observe Largest Contentful Paint (LCP)
   * Target: < 2.5s (good), < 4s (needs improvement), >= 4s (poor)
   */
  private observeLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };

        // LCP is the renderTime or loadTime of the largest contentful paint
        this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime;
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      // PerformanceObserver not supported
      console.warn('LCP observation not supported');
    }
  }

  /**
   * Observe First Input Delay (FID)
   * Target: < 100ms (good), < 300ms (needs improvement), >= 300ms (poor)
   */
  private observeFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as PerformanceEventTiming;
          // FID is the delay between when the user first interacts and when the browser responds
          this.metrics.fid = fidEntry.processingStart - fidEntry.startTime;
        }
      });

      observer.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      console.warn('FID observation not supported');
    }
  }

  /**
   * Observe Cumulative Layout Shift (CLS)
   * Target: < 0.1 (good), < 0.25 (needs improvement), >= 0.25 (poor)
   */
  private observeCLS(): void {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShiftEntry = entry as LayoutShift;
          // Only count layout shifts that aren't user-initiated
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
            this.metrics.cls = clsValue;
          }
        }
      });

      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.warn('CLS observation not supported');
    }
  }

  /**
   * Report metrics (local storage + console)
   * WHITE-HAT: Store locally, don't send to external services without consent
   */
  private reportMetrics(): void {
    if (this.reported) return;
    this.reported = true;

    // Update timestamp and URL
    this.metrics.timestamp = Date.now();
    this.metrics.url = window.location.href;

    // Store in localStorage (privacy-first)
    this.storeMetrics();

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      this.logMetrics();
    }

    // Emit event for app-level tracking
    this.emitMetricsEvent();
  }

  /**
   * Store metrics locally (privacy-first)
   */
  private storeMetrics(): void {
    try {
      const stored = localStorage.getItem('web_vitals_history');
      const history: PerformanceMetrics[] = stored ? JSON.parse(stored) : [];

      // Keep last 50 sessions
      history.push(this.metrics);
      if (history.length > 50) {
        history.shift();
      }

      localStorage.setItem('web_vitals_history', JSON.stringify(history));
      localStorage.setItem('web_vitals_latest', JSON.stringify(this.metrics));
    } catch (e) {
      console.warn('Failed to store Web Vitals:', e);
    }
  }

  /**
   * Log metrics to console
   */
  private logMetrics(): void {
    console.group('🚀 Web Vitals Performance Metrics');

    if (this.metrics.lcp) {
      const lcpRating = this.metrics.lcp < 2500 ? '✅ GOOD' : this.metrics.lcp < 4000 ? '⚠️ NEEDS IMPROVEMENT' : '❌ POOR';
      console.log(`LCP (Largest Contentful Paint): ${this.metrics.lcp.toFixed(0)}ms ${lcpRating}`);
    }

    if (this.metrics.fid) {
      const fidRating = this.metrics.fid < 100 ? '✅ GOOD' : this.metrics.fid < 300 ? '⚠️ NEEDS IMPROVEMENT' : '❌ POOR';
      console.log(`FID (First Input Delay): ${this.metrics.fid.toFixed(0)}ms ${fidRating}`);
    }

    if (this.metrics.cls !== undefined) {
      const clsRating = this.metrics.cls < 0.1 ? '✅ GOOD' : this.metrics.cls < 0.25 ? '⚠️ NEEDS IMPROVEMENT' : '❌ POOR';
      console.log(`CLS (Cumulative Layout Shift): ${this.metrics.cls.toFixed(3)} ${clsRating}`);
    }

    if (this.metrics.fcp) {
      const fcpRating = this.metrics.fcp < 1800 ? '✅ GOOD' : this.metrics.fcp < 3000 ? '⚠️ NEEDS IMPROVEMENT' : '❌ POOR';
      console.log(`FCP (First Contentful Paint): ${this.metrics.fcp.toFixed(0)}ms ${fcpRating}`);
    }

    if (this.metrics.ttfb) {
      const ttfbRating = this.metrics.ttfb < 800 ? '✅ GOOD' : this.metrics.ttfb < 1800 ? '⚠️ NEEDS IMPROVEMENT' : '❌ POOR';
      console.log(`TTFB (Time to First Byte): ${this.metrics.ttfb.toFixed(0)}ms ${ttfbRating}`);
    }

    console.log('\n📊 Additional Metrics:');
    if (this.metrics.domLoad) console.log(`DOM Load: ${this.metrics.domLoad.toFixed(0)}ms`);
    if (this.metrics.windowLoad) console.log(`Window Load: ${this.metrics.windowLoad.toFixed(0)}ms`);
    if (this.metrics.firstPaint) console.log(`First Paint: ${this.metrics.firstPaint.toFixed(0)}ms`);

    console.groupEnd();
  }

  /**
   * Emit custom event for app-level tracking
   */
  private emitMetricsEvent(): void {
    if (typeof window === 'undefined') return;

    const event = new CustomEvent('web-vitals-measured', {
      detail: this.metrics,
    });

    window.dispatchEvent(event);
  }

  /**
   * Get current metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get metrics history from localStorage
   */
  public static getHistory(): PerformanceMetrics[] {
    try {
      const stored = localStorage.getItem('web_vitals_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Calculate average metrics from history
   */
  public static getAverageMetrics(): Partial<PerformanceMetrics> {
    const history = this.getHistory();
    if (history.length === 0) return {};

    const sum: Record<string, number> = {};
    const count: Record<string, number> = {};

    for (const metrics of history) {
      for (const [key, value] of Object.entries(metrics)) {
        if (typeof value === 'number') {
          sum[key] = (sum[key] || 0) + value;
          count[key] = (count[key] || 0) + 1;
        }
      }
    }

    const avg: Record<string, number | string> = {};
    for (const [key, value] of Object.entries(sum)) {
      avg[key] = value / count[key];
    }

    return avg as Partial<PerformanceMetrics>;
  }

  /**
   * Enable/disable monitoring (user preference)
   * WHITE-HAT: Respect user choice
   */
  public static setConsent(enabled: boolean): void {
    localStorage.setItem('analytics_consent', enabled ? 'true' : 'false');

    if (!enabled) {
      // Clear stored data if user opts out
      localStorage.removeItem('web_vitals_history');
      localStorage.removeItem('web_vitals_latest');
    }
  }
}

// Export singleton instance
export const webVitalsMonitor = new WebVitalsMonitor();

// Export class for testing
export { WebVitalsMonitor };

// Type for layout shift entry
interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}
