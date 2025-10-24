/**
 * ANALYTICS TRACKER
 *
 * Track user actions and events
 * - Page views
 * - Button clicks
 * - Signal notifications
 * - Scanner activity
 * - Performance metrics
 */

export type EventCategory =
  | 'page_view'
  | 'user_action'
  | 'scanner'
  | 'notification'
  | 'signal'
  | 'performance'
  | 'error';

export interface AnalyticsEvent {
  id: string;
  timestamp: number;
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
  sessionId?: string;
  userId?: string;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private maxEvents = 500; // Keep last 500 events in memory
  private enabled = true;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    console.log(`[Analytics] Session started: ${this.sessionId}`);
  }

  /**
   * Track an event
   */
  track(
    category: EventCategory,
    action: string,
    label?: string,
    value?: number,
    metadata?: Record<string, any>
  ): void {
    if (!this.enabled) return;

    const event: AnalyticsEvent = {
      id: this.generateId(),
      timestamp: Date.now(),
      category,
      action,
      label,
      value,
      metadata,
      sessionId: this.sessionId,
    };

    // Add to memory
    this.events.push(event);

    // Keep only last N events
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[Analytics] ${this.getCategoryEmoji(category)} ${category}/${action}`,
        label || '',
        value !== undefined ? `(${value})` : '',
        metadata || ''
      );
    }

    // TODO: Send to analytics service (Google Analytics, Mixpanel, etc.)
    // this.sendToRemote(event);
  }

  /**
   * Track page view
   */
  trackPageView(page: string, metadata?: Record<string, any>): void {
    this.track('page_view', 'view', page, undefined, metadata);
  }

  /**
   * Track user action
   */
  trackAction(action: string, label?: string, value?: number, metadata?: Record<string, any>): void {
    this.track('user_action', action, label, value, metadata);
  }

  /**
   * Track scanner activity
   */
  trackScanner(action: string, metadata?: Record<string, any>): void {
    this.track('scanner', action, undefined, undefined, metadata);
  }

  /**
   * Track notification
   */
  trackNotification(action: string, label?: string, metadata?: Record<string, any>): void {
    this.track('notification', action, label, undefined, metadata);
  }

  /**
   * Track signal
   */
  trackSignal(
    symbol: string,
    signalType: 'STRONG_BUY' | 'BUY' | 'NEUTRAL',
    confidence: number,
    metadata?: Record<string, any>
  ): void {
    this.track('signal', signalType, symbol, confidence, metadata);
  }

  /**
   * Track performance metric
   */
  trackPerformance(metric: string, value: number, metadata?: Record<string, any>): void {
    this.track('performance', metric, undefined, value, metadata);
  }

  /**
   * Get all events
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Get events by category
   */
  getEventsByCategory(category: EventCategory): AnalyticsEvent[] {
    return this.events.filter((e) => e.category === category);
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 20): AnalyticsEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Get event statistics
   */
  getStats(): {
    total: number;
    byCategory: Record<EventCategory, number>;
    sessionId: string;
    sessionDuration: number;
    topActions: Array<{ action: string; count: number }>;
  } {
    const stats = {
      total: this.events.length,
      byCategory: {
        page_view: 0,
        user_action: 0,
        scanner: 0,
        notification: 0,
        signal: 0,
        performance: 0,
        error: 0,
      } as Record<EventCategory, number>,
      sessionId: this.sessionId,
      sessionDuration: 0,
      topActions: [] as Array<{ action: string; count: number }>,
    };

    // Count by category
    this.events.forEach((event) => {
      stats.byCategory[event.category]++;
    });

    // Calculate session duration
    if (this.events.length > 0) {
      const firstEvent = this.events[0];
      const lastEvent = this.events[this.events.length - 1];
      stats.sessionDuration = lastEvent.timestamp - firstEvent.timestamp;
    }

    // Get top actions
    const actionCounts = new Map<string, number>();
    this.events.forEach((event) => {
      const key = `${event.category}/${event.action}`;
      actionCounts.set(key, (actionCounts.get(key) || 0) + 1);
    });

    stats.topActions = Array.from(actionCounts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  }

  /**
   * Clear all events
   */
  clearEvents(): void {
    this.events = [];
    console.log('[Analytics] All events cleared');
  }

  /**
   * Enable/disable tracking
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`[Analytics] Tracking ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get emoji for category
   */
  private getCategoryEmoji(category: EventCategory): string {
    switch (category) {
      case 'page_view':
        return '📄';
      case 'user_action':
        return '👆';
      case 'scanner':
        return '🔍';
      case 'notification':
        return '🔔';
      case 'signal':
        return '🚨';
      case 'performance':
        return '⚡';
      case 'error':
        return '❌';
      default:
        return '📊';
    }
  }

  /**
   * Send event to remote analytics service (placeholder)
   */
  private async sendToRemote(event: AnalyticsEvent): Promise<void> {
    // TODO: Implement remote analytics
    // Example: Send to Google Analytics, Mixpanel, custom backend, etc.
    //
    // try {
    //   await fetch('/api/analytics/track', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(event)
    //   });
    // } catch (err) {
    //   console.error('[Analytics] Failed to send event to remote:', err);
    // }
  }
}

// Singleton instance
let analyticsInstance: Analytics | null = null;

/**
 * Get analytics instance
 */
export function getAnalytics(): Analytics {
  if (!analyticsInstance) {
    analyticsInstance = new Analytics();
  }
  return analyticsInstance;
}

/**
 * Convenience functions
 */
export function trackPageView(page: string, metadata?: Record<string, any>): void {
  getAnalytics().trackPageView(page, metadata);
}

export function trackAction(action: string, label?: string, value?: number, metadata?: Record<string, any>): void {
  getAnalytics().trackAction(action, label, value, metadata);
}

export function trackScanner(action: string, metadata?: Record<string, any>): void {
  getAnalytics().trackScanner(action, metadata);
}

export function trackNotification(action: string, label?: string, metadata?: Record<string, any>): void {
  getAnalytics().trackNotification(action, label, metadata);
}

export function trackSignal(
  symbol: string,
  signalType: 'STRONG_BUY' | 'BUY' | 'NEUTRAL',
  confidence: number,
  metadata?: Record<string, any>
): void {
  getAnalytics().trackSignal(symbol, signalType, confidence, metadata);
}

export function trackPerformance(metric: string, value: number, metadata?: Record<string, any>): void {
  getAnalytics().trackPerformance(metric, value, metadata);
}

/**
 * Setup analytics with page view tracking
 */
export function setupAnalytics(): void {
  if (typeof window === 'undefined') return;

  // Track initial page view
  trackPageView(window.location.pathname);

  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      trackAction('page_visible');
    } else {
      trackAction('page_hidden');
    }
  });

  // Track performance metrics
  if ('performance' in window && 'getEntriesByType' in window.performance) {
    const perfObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          trackPerformance('page_load_time', navEntry.loadEventEnd - navEntry.fetchStart);
          trackPerformance('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart);
        }

        if (entry.entryType === 'paint') {
          trackPerformance(entry.name, entry.startTime);
        }
      });
    });

    try {
      perfObserver.observe({ entryTypes: ['navigation', 'paint'] });
    } catch (error) {
      console.warn('[Analytics] Performance observer not supported:', error);
    }
  }

  console.log('[Analytics] ✅ Analytics setup complete');
}

/**
 * Get analytics dashboard data
 */
export function getAnalyticsDashboard(): {
  stats: ReturnType<Analytics['getStats']>;
  recentEvents: AnalyticsEvent[];
  topSignals: Array<{ symbol: string; count: number }>;
  notificationStats: {
    total: number;
    byAction: Record<string, number>;
  };
} {
  const analytics = getAnalytics();
  const stats = analytics.getStats();
  const recentEvents = analytics.getRecentEvents(20);

  // Get signal statistics
  const signalEvents = analytics.getEventsByCategory('signal');
  const signalCounts = new Map<string, number>();
  signalEvents.forEach((event) => {
    if (event.label) {
      signalCounts.set(event.label, (signalCounts.get(event.label) || 0) + 1);
    }
  });

  const topSignals = Array.from(signalCounts.entries())
    .map(([symbol, count]) => ({ symbol, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Get notification statistics
  const notificationEvents = analytics.getEventsByCategory('notification');
  const notificationStats = {
    total: notificationEvents.length,
    byAction: {} as Record<string, number>,
  };

  notificationEvents.forEach((event) => {
    notificationStats.byAction[event.action] = (notificationStats.byAction[event.action] || 0) + 1;
  });

  return {
    stats,
    recentEvents,
    topSignals,
    notificationStats,
  };
}
