"use client";

/**
 * MONITORING INITIALIZATION
 *
 * Client-side monitoring initialization
 * - Web Vitals (Core Web Vitals)
 * - Trading Metrics
 * - Privacy-first, local-only tracking
 */

import { useEffect } from 'react';

export function InitMonitoring() {
  useEffect(() => {
    // Dynamically import monitoring modules (client-side only)
    const initMonitoring = async () => {
      try {
        // Import Web Vitals monitor
        const { webVitalsMonitor } = await import('@/lib/monitoring/web-vitals');

        // Import Trading Metrics
        const { tradingMetrics } = await import('@/lib/monitoring/trading-metrics');

        // Log initialization
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Monitoring initialized:', {
            webVitals: !!webVitalsMonitor,
            tradingMetrics: !!tradingMetrics,
          });
        }

        // Listen for Web Vitals events
        window.addEventListener('web-vitals-measured', (event: Event) => {
          const customEvent = event as CustomEvent;
          if (process.env.NODE_ENV === 'development') {
            console.log('📊 Web Vitals measured:', customEvent.detail);
          }
        });
      } catch (error) {
        console.error('Failed to initialize monitoring:', error);
      }
    };

    initMonitoring();
  }, []);

  return null; // This component doesn't render anything
}
