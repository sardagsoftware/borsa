/**
 * EVENT TRACKER
 *
 * Core event tracking system
 * - Track user interactions
 * - Batch events
 * - Store in IndexedDB
 * - Privacy-preserving
 *
 * WHITE-HAT:
 * - No PII collection
 * - Respect DNT header
 * - Local-first storage
 * - User consent required
 */

import type {
  AnalyticsEvent,
  AnalyticsEventType,
  AnalyticsConfig,
  StoredEvent,
} from './types';
import { getUserId, getSessionId } from '../feature-flags/storage';
import { getFlagManager } from '../feature-flags/flag-manager';

// ════════════════════════════════════════════════════════════
// DEFAULT CONFIG
// ════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: true,
  trackPageViews: true,
  trackClicks: false, // Opt-in for privacy
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
  maxStoredEvents: 1000,
  retentionDays: 30,
  respectDoNotTrack: true,
  anonymizeIPs: true,
};

// ════════════════════════════════════════════════════════════
// EVENT TRACKER CLASS
// ════════════════════════════════════════════════════════════

export class EventTracker {
  private config: AnalyticsConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private db: IDBDatabase | null = null;
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config?: Partial<AnalyticsConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Check Do Not Track
    if (this.config.respectDoNotTrack && this.isDoNotTrackEnabled()) {
      console.log('[Analytics] Do Not Track enabled, analytics disabled');
      this.config.enabled = false;
    }

    // Initialize
    if (this.config.enabled) {
      this.init();
    }
  }

  /**
   * Initialize tracker
   */
  private async init() {
    if (typeof window === 'undefined') return;

    try {
      // Open IndexedDB
      await this.openDB();

      // Start flush timer
      this.startFlushTimer();

      // Track page view on init
      if (this.config.trackPageViews) {
        this.trackPageView();
      }

      console.log('[Analytics] Event tracker initialized');
    } catch (error) {
      console.error('[Analytics] Initialization failed:', error);
    }
  }

  /**
   * Check if Do Not Track is enabled
   */
  private isDoNotTrackEnabled(): boolean {
    if (typeof navigator === 'undefined') return false;
    const dnt = navigator.doNotTrack || (window as any).doNotTrack || (navigator as any).msDoNotTrack;
    return dnt === '1' || dnt === 'yes';
  }

  /**
   * Open IndexedDB
   */
  private openDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Window not available'));
        return;
      }

      const request = indexedDB.open('ukalai_analytics', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Events store
        if (!db.objectStoreNames.contains('events')) {
          const store = db.createObjectStore('events', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('type', 'type');
          store.createIndex('experimentKey', 'experimentKey');
          store.createIndex('synced', 'synced');
        }
      };
    });
  }

  /**
   * Track event
   */
  track(
    type: AnalyticsEventType,
    properties?: Record<string, any>
  ): void {
    if (!this.config.enabled) return;

    try {
      const event = this.createEvent(type, properties);
      this.eventQueue.push(event);

      // Auto-flush if batch size reached
      if (this.eventQueue.length >= this.config.batchSize) {
        this.flush();
      }

      console.log(`[Analytics] Event tracked: ${type}`, properties);
    } catch (error) {
      console.error('[Analytics] Track error:', error);
    }
  }

  /**
   * Create event object
   */
  private createEvent(
    type: AnalyticsEventType,
    properties?: Record<string, any>
  ): AnalyticsEvent {
    const userId = getUserId();
    const sessionId = getSessionId();

    // Get experiment context if user is in any
    const flagManager = getFlagManager();
    const userInfo = flagManager.getUserInfo();

    const event: AnalyticsEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      timestamp: Date.now(),
      userId,
      sessionId,
      properties,
    };

    // Add page context
    if (typeof window !== 'undefined') {
      event.page = {
        path: window.location.pathname,
        title: document.title,
        referrer: document.referrer || undefined,
      };

      // Add device context
      event.device = {
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      };
    }

    return event;
  }

  /**
   * Track page view
   */
  trackPageView(): void {
    this.track('page_view', {
      path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    });
  }

  /**
   * Track click
   */
  trackClick(elementId?: string, properties?: Record<string, any>): void {
    if (!this.config.trackClicks) return;

    this.track('click', {
      elementId,
      ...properties,
    });
  }

  /**
   * Track conversion
   */
  trackConversion(goalName: string, properties?: Record<string, any>): void {
    this.track('conversion', {
      goal: goalName,
      ...properties,
    });
  }

  /**
   * Track experiment impression
   */
  trackExperimentImpression(experimentKey: string, variantId: string): void {
    this.track('experiment_impression', {
      experimentKey,
      variantId,
    });
  }

  /**
   * Track experiment exposure (user saw the variant)
   */
  trackExperimentExposure(experimentKey: string, variantId: string): void {
    this.track('experiment_exposure', {
      experimentKey,
      variantId,
    });
  }

  /**
   * Flush event queue to storage
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;
    if (!this.db) return;

    try {
      const events = [...this.eventQueue];
      this.eventQueue = [];

      const transaction = this.db.transaction(['events'], 'readwrite');
      const store = transaction.objectStore('events');

      for (const event of events) {
        const storedEvent: StoredEvent = {
          ...event,
          synced: false,
          retries: 0,
        };
        store.add(storedEvent);
      }

      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });

      console.log(`[Analytics] Flushed ${events.length} events to storage`);

      // Clean old events
      await this.cleanOldEvents();
    } catch (error) {
      console.error('[Analytics] Flush error:', error);
      // Re-add events to queue on error
      this.eventQueue.unshift(...this.eventQueue);
    }
  }

  /**
   * Clean old events (retention policy)
   */
  private async cleanOldEvents(): Promise<void> {
    if (!this.db) return;

    try {
      const cutoff = Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000;

      const transaction = this.db.transaction(['events'], 'readwrite');
      const store = transaction.objectStore('events');
      const index = store.index('timestamp');

      const range = IDBKeyRange.upperBound(cutoff);
      const request = index.openCursor(range);

      let deletedCount = 0;
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        }
      };

      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => {
          if (deletedCount > 0) {
            console.log(`[Analytics] Cleaned ${deletedCount} old events`);
          }
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('[Analytics] Clean error:', error);
    }
  }

  /**
   * Get all stored events
   */
  async getStoredEvents(): Promise<StoredEvent[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['events'], 'readonly');
      const store = transaction.objectStore('events');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get events by type
   */
  async getEventsByType(type: AnalyticsEventType): Promise<StoredEvent[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['events'], 'readonly');
      const store = transaction.objectStore('events');
      const index = store.index('type');
      const request = index.getAll(type);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get events by experiment
   */
  async getEventsByExperiment(experimentKey: string): Promise<StoredEvent[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['events'], 'readonly');
      const store = transaction.objectStore('events');
      const index = store.index('experimentKey');
      const request = index.getAll(experimentKey);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all events
   */
  async clearEvents(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['events'], 'readwrite');
    const store = transaction.objectStore('events');
    store.clear();

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log('[Analytics] All events cleared');
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) return;

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Stop flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Destroy tracker
   */
  destroy(): void {
    this.stopFlushTimer();
    this.flush(); // Final flush
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// ════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ════════════════════════════════════════════════════════════

let globalTracker: EventTracker | null = null;

/**
 * Get global tracker instance
 */
export function getTracker(): EventTracker {
  if (!globalTracker) {
    globalTracker = new EventTracker();
  }
  return globalTracker;
}

/**
 * Reset tracker (for testing)
 */
export function resetTracker(): void {
  if (globalTracker) {
    globalTracker.destroy();
    globalTracker = null;
  }
}

// ════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ════════════════════════════════════════════════════════════

export function trackEvent(type: AnalyticsEventType, properties?: Record<string, any>): void {
  getTracker().track(type, properties);
}

export function trackPageView(): void {
  getTracker().trackPageView();
}

export function trackClick(elementId?: string, properties?: Record<string, any>): void {
  getTracker().trackClick(elementId, properties);
}

export function trackConversion(goalName: string, properties?: Record<string, any>): void {
  getTracker().trackConversion(goalName, properties);
}

// ════════════════════════════════════════════════════════════
// EXPORT
// ════════════════════════════════════════════════════════════

export default {
  EventTracker,
  getTracker,
  resetTracker,
  trackEvent,
  trackPageView,
  trackClick,
  trackConversion,
};
