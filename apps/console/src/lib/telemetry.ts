/**
 * 📊 Telemetry Helper
 * Fire-and-forget async telemetry to /api/ui-telemetry
 * 
 * @module lib/telemetry
 * @white-hat Compliant
 */

export interface TelemetryEvent {
  type: string;
  data?: any;
  timestamp?: string;
  sessionId?: string;
  userId?: string;
}

export interface TelemetryConfig {
  endpoint?: string;
  batchSize?: number;
  batchInterval?: number;
  enabled?: boolean;
}

class TelemetryService {
  private queue: TelemetryEvent[] = [];
  private config: Required<TelemetryConfig>;
  private sessionId: string;
  private flushTimer?: NodeJS.Timeout;

  constructor(config: TelemetryConfig = {}) {
    this.config = {
      endpoint: config.endpoint || '/api/ui-telemetry',
      batchSize: config.batchSize || 10,
      batchInterval: config.batchInterval || 5000,
      enabled: config.enabled !== false,
    };

    this.sessionId = this.generateSessionId();

    // Start auto-flush
    if (this.config.enabled) {
      this.startAutoFlush();
    }

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startAutoFlush() {
    this.flushTimer = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush();
      }
    }, this.config.batchInterval);
  }

  /**
   * Track an event (async, fire-and-forget)
   */
  track(type: string, data?: any): void {
    if (!this.config.enabled) return;

    const event: TelemetryEvent = {
      type,
      data,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    };

    this.queue.push(event);

    // Auto-flush if queue is full
    if (this.queue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Track user action
   */
  trackAction(action: string, params?: any): void {
    this.track('user_action', { action, params });
  }

  /**
   * Track page view
   */
  trackPageView(path: string): void {
    this.track('page_view', { path, referrer: document.referrer });
  }

  /**
   * Track error
   */
  trackError(error: Error, context?: any): void {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      context,
    });
  }

  /**
   * Track performance metric
   */
  trackPerformance(metric: string, value: number, tags?: Record<string, string>): void {
    this.track('performance', { metric, value, tags });
  }

  /**
   * Track connector call
   */
  trackConnectorCall(connectorId: string, action: string, duration: number, success: boolean): void {
    this.track('connector_call', {
      connectorId,
      action,
      duration,
      success,
    });
  }

  /**
   * Track intent
   */
  trackIntent(intentId: string, action: string, score: number): void {
    this.track('intent', {
      intentId,
      action,
      score,
    });
  }

  /**
   * Flush queue to server
   */
  async flush(): Promise<void> {
    if (!this.config.enabled || this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
        credentials: 'include',
        keepalive: true, // Important for beforeunload
      });
    } catch (error) {
      // Fire-and-forget, don't throw
      console.warn('Telemetry flush failed (non-critical):', error);
    }
  }

  /**
   * Disable telemetry
   */
  disable(): void {
    this.config.enabled = false;
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
  }

  /**
   * Enable telemetry
   */
  enable(): void {
    this.config.enabled = true;
    this.startAutoFlush();
  }
}

// Singleton instance
export const telemetry = new TelemetryService();

// Convenience exports
export const track = telemetry.track.bind(telemetry);
export const trackAction = telemetry.trackAction.bind(telemetry);
export const trackPageView = telemetry.trackPageView.bind(telemetry);
export const trackError = telemetry.trackError.bind(telemetry);
export const trackPerformance = telemetry.trackPerformance.bind(telemetry);
export const trackConnectorCall = telemetry.trackConnectorCall.bind(telemetry);
export const trackIntent = telemetry.trackIntent.bind(telemetry);

console.log('✅ Telemetry service initialized');
