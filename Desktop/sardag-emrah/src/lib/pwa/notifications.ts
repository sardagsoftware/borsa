/**
 * PUSH NOTIFICATION SYSTEM
 *
 * Professional, mobile-optimized, zero-error notifications
 * - Auto permission request
 * - Signal notifications
 * - Vibration patterns
 * - Action buttons
 */

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  vibrate?: number[];
  requireInteraction?: boolean;
}

class NotificationManager {
  private permission: NotificationPermission = 'default';
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Initialize PWA and request notification permission
   */
  async initialize(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      // Register service worker
      if ('serviceWorker' in navigator) {
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        console.log('[PWA] Service Worker registered:', this.registration.scope);

        // Update SW if new version available
        this.registration.addEventListener('updatefound', () => {
          console.log('[PWA] New version available, updating...');
        });
      }

      // Request notification permission
      if ('Notification' in window && this.permission === 'default') {
        this.permission = await Notification.requestPermission();
        console.log('[PWA] Notification permission:', this.permission);
      }

      return this.permission === 'granted';
    } catch (error) {
      console.error('[PWA] Initialization error:', error);
      return false;
    }
  }

  /**
   * Check if notifications are supported and granted
   */
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator
    );
  }

  /**
   * Request notification permission (mobile-friendly)
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('[PWA] Notifications not supported');
      return false;
    }

    try {
      // For mobile Safari, we need to request in a user gesture
      if (this.permission === 'default') {
        this.permission = await Notification.requestPermission();
      }

      if (this.permission === 'granted') {
        console.log('[PWA] ✅ Notification permission granted');
        return true;
      } else {
        console.warn('[PWA] ⚠️ Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('[PWA] Permission request failed:', error);
      return false;
    }
  }

  isGranted(): boolean {
    return this.permission === 'granted';
  }

  /**
   * Show notification (uses Service Worker if available)
   */
  async notify(payload: NotificationPayload): Promise<void> {
    if (!this.isSupported()) {
      console.warn('[Notification] Not supported in this browser');
      return;
    }

    if (!this.isGranted()) {
      console.warn('[Notification] Permission not granted');
      return;
    }

    try {
      const options: NotificationOptions & {
        vibrate?: number[];
        actions?: Array<{ action: string; title: string; icon?: string }>;
      } = {
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/icon-72x72.png',
        tag: payload.tag || 'default',
        data: payload.data,
        vibrate: payload.vibrate || [200, 100, 200],
        requireInteraction: payload.requireInteraction || false,
        actions: payload.actions || [],
      };

      // Use Service Worker notification if available
      if (this.registration) {
        await this.registration.showNotification(payload.title, options);
      } else {
        // Fallback to regular notification
        new Notification(payload.title, options);
      }

      console.log('[Notification] Sent:', payload.title);
    } catch (error) {
      console.error('[Notification] Send error:', error);
    }
  }

  /**
   * Trading signal notification (pre-configured)
   */
  async notifySignal(signal: {
    symbol: string;
    type: string;
    message: string;
    strength?: number;
  }): Promise<void> {
    const strength = signal.strength ?? 5;
    const strengthEmoji = strength >= 8 ? '🚀' : strength >= 6 ? '📈' : '🔔';

    await this.notify({
      title: `${strengthEmoji} ${signal.symbol} - ${signal.type}`,
      body: signal.message,
      icon: '/icon-chart-96x96.png',
      badge: '/icon-72x72.png',
      tag: `signal-${signal.symbol}`,
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: true,
      data: signal,
      actions: [
        {
          action: 'view',
          title: 'View Chart',
          icon: '/icon-chart-96x96.png',
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
        },
      ],
    });
  }

  /**
   * Price alert notification
   */
  async notifyPriceAlert(alert: {
    symbol: string;
    price: number;
    direction: 'UP' | 'DOWN';
    target: number;
  }): Promise<void> {
    const emoji = alert.direction === 'UP' ? '📈' : '📉';

    await this.notify({
      title: `${emoji} ${alert.symbol} Price Alert`,
      body: `Price ${alert.direction === 'UP' ? 'above' : 'below'} $${alert.target.toFixed(2)} - Current: $${alert.price.toFixed(2)}`,
      icon: '/icon-192x192.png',
      tag: `price-alert-${alert.symbol}`,
      vibrate: [300, 100, 300],
      requireInteraction: true,
      data: alert,
      actions: [
        {
          action: 'view',
          title: 'View Market',
        },
        {
          action: 'dismiss',
          title: 'OK',
        },
      ],
    });
  }

  /**
   * Generic market alert
   */
  async notifyMarketUpdate(message: string): Promise<void> {
    await this.notify({
      title: '📊 Market Update',
      body: message,
      icon: '/icon-market-96x96.png',
      tag: 'market-update',
      vibrate: [100, 50, 100],
      requireInteraction: false,
    });
  }
}

// Singleton instance
export const notificationManager = new NotificationManager();

// Auto-initialize on module load (client-side only)
if (typeof window !== 'undefined') {
  // Initialize after page load
  if (document.readyState === 'complete') {
    notificationManager.initialize();
  } else {
    window.addEventListener('load', () => {
      notificationManager.initialize();
    });
  }
}

export default notificationManager;
