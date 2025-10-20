/**
 * SHARD_13.2 - Performance Optimizer
 * Lazy loading, code splitting, caching strategies
 *
 * Optimization: Bundle size, load time, caching
 * White Hat: User experience first
 */

/**
 * Preload component
 * Note: lazyLoad moved to separate .tsx file if needed
 */
export function preloadComponent<T>(
  factory: () => Promise<{ default: T }>
): void {
  factory();
}

/**
 * Prefetch resource
 */
export function prefetchResource(url: string, type: 'script' | 'style' | 'font' | 'image' = 'script'): void {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  link.as = type;

  document.head.appendChild(link);
}

/**
 * Preconnect to origin
 */
export function preconnectOrigin(origin: string): void {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = origin;
  link.crossOrigin = 'anonymous';

  document.head.appendChild(link);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Request idle callback wrapper
 */
export function requestIdleTask(
  callback: () => void,
  options?: { timeout?: number }
): void {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback, options);
  } else {
    setTimeout(callback, 1);
  }
}

/**
 * Intersection Observer for lazy loading
 */
export function createIntersectionObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') return null;

  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry);
      }
    });
  }, options);
}

/**
 * Lazy load image
 */
export function lazyLoadImage(img: HTMLImageElement): void {
  const src = img.dataset.src;
  if (!src) return;

  const observer = createIntersectionObserver((entry) => {
    img.src = src;
    img.removeAttribute('data-src');
    observer?.unobserve(entry.target);
  });

  if (observer) {
    observer.observe(img);
  } else {
    // Fallback
    img.src = src;
  }
}

/**
 * Get cache strategy
 */
export function getCacheStrategy(url: string): 'no-cache' | 'cache-first' | 'network-first' {
  // Static assets: cache-first
  if (/\.(js|css|woff2|png|jpg|svg)$/.test(url)) {
    return 'cache-first';
  }

  // API calls: network-first
  if (url.includes('/api/')) {
    return 'network-first';
  }

  // Default: no-cache
  return 'no-cache';
}

/**
 * Format bytes
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Get bundle size recommendations
 */
export function getBundleRecommendations(size: number): string[] {
  const recommendations: string[] = [];

  if (size > 500 * 1024) {
    recommendations.push('Bundle size exceeds 500KB - consider code splitting');
  }

  if (size > 300 * 1024) {
    recommendations.push('Use dynamic imports for large components');
  }

  if (size > 200 * 1024) {
    recommendations.push('Enable tree shaking for unused code');
  }

  if (recommendations.length === 0) {
    recommendations.push('Bundle size is optimal');
  }

  return recommendations;
}

/**
 * Optimize images
 */
export interface ImageOptimization {
  format: 'webp' | 'avif' | 'jpg' | 'png';
  quality: number;
  width?: number;
  height?: number;
}

export function getImageOptimization(
  originalSize: number,
  viewport: 'mobile' | 'tablet' | 'desktop'
): ImageOptimization {
  const sizes = {
    mobile: { width: 768 },
    tablet: { width: 1024 },
    desktop: { width: 1920 }
  };

  return {
    format: 'webp',
    quality: 80,
    width: sizes[viewport].width
  };
}

/**
 * Performance budget
 */
export interface PerformanceBudget {
  lcp: number; // ms
  fid: number; // ms
  cls: number; // score
  totalSize: number; // bytes
  scriptSize: number; // bytes
  imageSize: number; // bytes
}

export const PERFORMANCE_BUDGET: PerformanceBudget = {
  lcp: 2500,
  fid: 100,
  cls: 0.1,
  totalSize: 500 * 1024, // 500 KB
  scriptSize: 200 * 1024, // 200 KB
  imageSize: 300 * 1024 // 300 KB
};

/**
 * Check performance budget
 */
export function checkPerformanceBudget(
  actual: Partial<PerformanceBudget>
): { passed: boolean; violations: string[] } {
  const violations: string[] = [];

  if (actual.lcp && actual.lcp > PERFORMANCE_BUDGET.lcp) {
    violations.push(`LCP: ${actual.lcp}ms exceeds budget of ${PERFORMANCE_BUDGET.lcp}ms`);
  }

  if (actual.fid && actual.fid > PERFORMANCE_BUDGET.fid) {
    violations.push(`FID: ${actual.fid}ms exceeds budget of ${PERFORMANCE_BUDGET.fid}ms`);
  }

  if (actual.cls && actual.cls > PERFORMANCE_BUDGET.cls) {
    violations.push(`CLS: ${actual.cls} exceeds budget of ${PERFORMANCE_BUDGET.cls}`);
  }

  if (actual.totalSize && actual.totalSize > PERFORMANCE_BUDGET.totalSize) {
    violations.push(
      `Total size: ${formatBytes(actual.totalSize)} exceeds budget of ${formatBytes(PERFORMANCE_BUDGET.totalSize)}`
    );
  }

  return {
    passed: violations.length === 0,
    violations
  };
}
