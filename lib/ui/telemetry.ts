import { nanoid } from "nanoid";

export interface TelemetryEvent {
  eventType: 'ui_ab_exposure' | 'ui_primary_action' | 'ui_interaction' | 'ui_theme_change';
  sessionId?: string;
  data: Record<string, any>;
}

class TelemetryClient {
  private sessionId: string;
  private isEnabled: boolean;
  private queue: TelemetryEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  
  constructor() {
    this.sessionId = nanoid();
    this.isEnabled = typeof window !== 'undefined' && 
                     !window.location.hostname.includes('localhost'); // Disable on localhost
    
    // Flush queue periodically
    if (this.isEnabled) {
      this.startPeriodicFlush();
    }
  }
  
  /**
   * Track A/B test exposure (call when theme is applied)
   */
  trackExposure(variant: string, regime: string, path: string) {
    this.track('ui_ab_exposure', {
      variant,
      regime,
      path,
      timestamp: Date.now(),
      viewport: this.getViewport(),
      userAgent: navigator.userAgent.substring(0, 100)
    });
  }
  
  /**
   * Track primary user actions (button clicks, form submissions)
   */
  trackAction(action: string, details: Record<string, any> = {}) {
    this.track('ui_primary_action', {
      action,
      path: window.location.pathname,
      timestamp: Date.now(),
      ...details
    });
  }
  
  /**
   * Track theme changes
   */
  trackThemeChange(fromRegime: string, toRegime: string, trigger: 'auto' | 'manual' | 'market') {
    this.track('ui_theme_change', {
      fromRegime,
      toRegime,
      trigger,
      path: window.location.pathname,
      timestamp: Date.now()
    });
  }
  
  /**
   * Track general UI interactions
   */
  trackInteraction(element: string, action: string, context: Record<string, any> = {}) {
    this.track('ui_interaction', {
      element,
      action,
      path: window.location.pathname,
      timestamp: Date.now(),
      ...context
    });
  }
  
  /**
   * Add event to queue
   */
  private track(eventType: TelemetryEvent['eventType'], data: Record<string, any>) {
    if (!this.isEnabled) {
      console.log('📊 [TELEMETRY DEBUG]:', eventType, data);
      return;
    }
    
    this.queue.push({
      eventType,
      sessionId: this.sessionId,
      data
    });
    
    // Flush immediately for critical events
    if (eventType === 'ui_ab_exposure') {
      this.flush();
    }
  }
  
  /**
   * Send queued events to server
   */
  private async flush() {
    if (this.queue.length === 0) return;
    
    const events = [...this.queue];
    this.queue = [];
    
    try {
      for (const event of events) {
        await fetch('/api/telemetry/ui', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event)
        });
      }
    } catch (error) {
      console.error('Failed to send telemetry:', error);
      // Re-queue failed events (with limit to prevent infinite growth)
      if (this.queue.length < 100) {
        this.queue.unshift(...events);
      }
    }
  }
  
  /**
   * Start periodic flush every 30 seconds
   */
  private startPeriodicFlush() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, 30000);
  }
  
  /**
   * Get viewport dimensions
   */
  private getViewport() {
    if (typeof window === 'undefined') return { width: 0, height: 0 };
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }
  
  /**
   * Cleanup on page unload
   */
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(); // Final flush
  }
}

// Singleton instance
let telemetryClient: TelemetryClient | null = null;

export function getTelemetryClient(): TelemetryClient {
  if (!telemetryClient) {
    telemetryClient = new TelemetryClient();
    
    // Cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        telemetryClient?.destroy();
      });
    }
  }
  
  return telemetryClient;
}

// Convenience exports
export const telemetry = {
  trackExposure: (variant: string, regime: string, path: string) => 
    getTelemetryClient().trackExposure(variant, regime, path),
    
  trackAction: (action: string, details?: Record<string, any>) => 
    getTelemetryClient().trackAction(action, details),
    
  trackThemeChange: (from: string, to: string, trigger: 'auto' | 'manual' | 'market') => 
    getTelemetryClient().trackThemeChange(from, to, trigger),
    
  trackInteraction: (element: string, action: string, context?: Record<string, any>) => 
    getTelemetryClient().trackInteraction(element, action, context)
};
