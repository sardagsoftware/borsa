/**
 * SIGNAL NOTIFIER - Auto Notifications for Strong Buy Signals
 *
 * Features:
 * - Background scanning every 5 minutes
 * - Browser notifications for STRONG_BUY signals
 * - Click notification → Go to coin
 * - Track shown notifications (avoid duplicates)
 * - Analytics and error logging
 */

import { trackScanner, trackNotification, trackSignal } from '@/lib/monitoring/analytics';
import { logError, logHighError } from '@/lib/monitoring/error-logger';

interface SignalResult {
  symbol: string;
  signal: 'STRONG_BUY' | 'BUY';
  confidence: number;
  strategies: number;
  price: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  timestamp: number;
}

interface ScanResponse {
  success: boolean;
  scanned: number;
  found: number;
  signals: SignalResult[];
  timestamp: number;
}

// Track notified signals to avoid duplicates
const notifiedSignals = new Set<string>();

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  trackNotification('permission_request');

  if (!('Notification' in window)) {
    console.warn('[Signal Notifier] Browser does not support notifications');
    logError('Notification API not supported', 'low', 'requestNotificationPermission');
    trackNotification('permission_not_supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    trackNotification('permission_already_granted');
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('[Signal Notifier] Notification permission denied');
    trackNotification('permission_denied');
    return false;
  }

  // Request permission
  const permission = await Notification.requestPermission();
  const granted = permission === 'granted';

  trackNotification(granted ? 'permission_granted' : 'permission_rejected');

  return granted;
}

/**
 * Check if notifications are enabled
 */
export function areNotificationsEnabled(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

/**
 * Show notification for a signal
 */
export function showSignalNotification(signal: SignalResult): void {
  if (!areNotificationsEnabled()) {
    console.warn('[Signal Notifier] Notifications not enabled');
    return;
  }

  // Create unique key for this signal (symbol + timestamp rounded to 5 min)
  const roundedTime = Math.floor(signal.timestamp / (5 * 60 * 1000)) * (5 * 60 * 1000);
  const notificationKey = `${signal.symbol}-${roundedTime}`;

  // Check if already notified
  if (notifiedSignals.has(notificationKey)) {
    console.log(`[Signal Notifier] Already notified for ${signal.symbol}`);
    return;
  }

  // Mark as notified
  notifiedSignals.add(notificationKey);

  // Clean old notifications (keep last 100)
  if (notifiedSignals.size > 100) {
    const keysArray = Array.from(notifiedSignals);
    notifiedSignals.delete(keysArray[0]);
  }

  const symbolDisplay = signal.symbol.replace('USDT', '');
  const emoji = signal.signal === 'STRONG_BUY' ? '🚀' : '✅';
  const title = `${emoji} ${symbolDisplay} - AL SİNYALİ`;
  const body = `${signal.strategies}/6 Strateji • %${signal.confidence.toFixed(0)} Güven\nGiriş: $${signal.entryPrice.toFixed(2)}`;

  try {
    const notification = new Notification(title, {
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      tag: signal.symbol, // Group by symbol
      requireInteraction: true, // Don't auto-close
      data: {
        symbol: signal.symbol,
        url: `/market?symbol=${signal.symbol}`,
      },
    });

    // Handle notification click
    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      window.location.href = `/market?symbol=${signal.symbol}`;
      notification.close();
      trackNotification('notification_clicked', signal.symbol);
    };

    console.log(`[Signal Notifier] ✅ Notification shown for ${signal.symbol}`);

    // Track notification
    trackNotification('notification_shown', signal.symbol);
    trackSignal(signal.symbol, signal.signal, signal.confidence, {
      strategies: signal.strategies,
      entryPrice: signal.entryPrice,
    });
  } catch (error) {
    console.error('[Signal Notifier] Error showing notification:', error);
    logHighError(
      'Failed to show notification',
      'showSignalNotification',
      error as Error,
      { symbol: signal.symbol }
    );
  }
}

/**
 * Scan for signals and show notifications
 */
export async function scanAndNotify(limit: number = 20): Promise<ScanResponse | null> {
  const scanStartTime = Date.now();

  try {
    console.log('[Signal Notifier] 🔍 Scanning for signals...');
    trackScanner('scan_started', { limit });

    const response = await fetch(`/api/scanner/signals?limit=${limit}&type=STRONG_BUY`);

    if (!response.ok) {
      throw new Error(`Scanner API error: ${response.status}`);
    }

    const data: ScanResponse = await response.json();
    const scanDuration = Date.now() - scanStartTime;

    console.log(
      `[Signal Notifier] Scan complete: ${data.found} signals from ${data.scanned} coins`
    );

    // Track scan completion
    trackScanner('scan_completed', {
      limit,
      scanned: data.scanned,
      found: data.found,
      duration: scanDuration,
    });

    // Show notifications for new signals
    if (data.signals && data.signals.length > 0 && areNotificationsEnabled()) {
      for (const signal of data.signals) {
        showSignalNotification(signal);
      }
    }

    return data;
  } catch (error) {
    console.error('[Signal Notifier] Scan error:', error);

    const scanDuration = Date.now() - scanStartTime;

    // Log error
    logHighError('Scanner failed', 'scanAndNotify', error as Error, {
      limit,
      duration: scanDuration,
    });

    // Track scan failure
    trackScanner('scan_failed', {
      limit,
      duration: scanDuration,
      error: error instanceof Error ? error.message : String(error),
    });

    return null;
  }
}

/**
 * Start background scanner (runs every 5 minutes)
 */
export function startBackgroundScanner(intervalMinutes: number = 5): () => void {
  console.log(`[Signal Notifier] 🚀 Starting background scanner (every ${intervalMinutes} min)`);

  // Run immediately
  scanAndNotify();

  // Then run every N minutes
  const intervalMs = intervalMinutes * 60 * 1000;
  const intervalId = setInterval(() => {
    scanAndNotify();
  }, intervalMs);

  // Return cleanup function
  return () => {
    console.log('[Signal Notifier] Stopping background scanner');
    clearInterval(intervalId);
  };
}

/**
 * Get scanner status
 */
export function getScannerStatus(): {
  notificationsEnabled: boolean;
  notifiedCount: number;
} {
  return {
    notificationsEnabled: areNotificationsEnabled(),
    notifiedCount: notifiedSignals.size,
  };
}

/**
 * Register Background Sync with Service Worker
 * This allows scanning even when browser is closed (Chrome/Edge)
 */
export async function registerBackgroundSync(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[Signal Notifier] Service Worker not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Background Sync API (Chrome/Edge)
    if ('sync' in registration) {
      // Register single sync
      await (registration as any).sync.register('scanner-sync');
      console.log('[Signal Notifier] ✅ Background sync registered');
      return true;
    } else {
      console.warn('[Signal Notifier] Background Sync API not supported');
      return false;
    }
  } catch (error) {
    console.error('[Signal Notifier] Background sync registration error:', error);
    return false;
  }
}

/**
 * Register Periodic Background Sync (Chrome only)
 * This enables truly periodic scanning (every N minutes)
 */
export async function registerPeriodicSync(intervalMinutes: number = 5): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[Signal Notifier] Service Worker not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Periodic Sync API (Chrome only - requires permission)
    if ('periodicSync' in registration) {
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync' as any
      });

      if (status.state === 'granted' || status.state === 'prompt') {
        await (registration as any).periodicSync.register('scanner-periodic', {
          minInterval: intervalMinutes * 60 * 1000 // Convert to milliseconds
        });
        console.log(`[Signal Notifier] ✅ Periodic sync registered (every ${intervalMinutes} min)`);
        return true;
      } else {
        console.warn('[Signal Notifier] Periodic sync permission denied');
        return false;
      }
    } else {
      console.warn('[Signal Notifier] Periodic Sync API not supported (Chrome only)');
      return false;
    }
  } catch (error) {
    console.error('[Signal Notifier] Periodic sync registration error:', error);
    return false;
  }
}

/**
 * Scan with retry logic (3 attempts with exponential backoff)
 */
async function scanWithRetry(maxRetries = 3): Promise<ScanResponse | null> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await scanAndNotify();
    } catch (error) {
      lastError = error as Error;
      console.warn(`[Signal Notifier] Retry ${i + 1}/${maxRetries} after error:`, error);

      // Exponential backoff: 2s, 4s, 8s
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i + 1) * 1000));
      }
    }
  }

  console.error('[Signal Notifier] All retries failed:', lastError);
  return null;
}

/**
 * Check system health before scanning
 */
async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch('/api/health', {
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) return false;

    const data = await response.json();
    const isHealthy = data.status !== 'unhealthy';

    if (!isHealthy) {
      console.warn('[Signal Notifier] System unhealthy:', data);
    }

    return isHealthy;
  } catch (error) {
    console.error('[Signal Notifier] Health check failed:', error);
    return false;
  }
}

/**
 * Enhanced background scanner with Service Worker support
 * Tries to use Service Worker first, falls back to client-side if not available
 */
export async function startBackgroundScannerEnhanced(intervalMinutes: number = 5): Promise<() => void> {
  console.log(`[Signal Notifier] 🚀 Starting enhanced background scanner (every ${intervalMinutes} min)`);

  // Track scanner start
  trackScanner('scanner_started', {
    intervalMinutes,
    mode: 'enhanced',
  });

  // Health check first
  const isHealthy = await checkHealth();

  if (!isHealthy) {
    console.warn('[Signal Notifier] ⚠️ System health check failed, scanner may not work properly');
    logError('Health check failed on scanner start', 'medium', 'startBackgroundScannerEnhanced');
    trackScanner('health_check_failed');
  } else {
    console.log('[Signal Notifier] ✅ System health check passed');
    trackScanner('health_check_passed');
  }

  // Try to register periodic sync (Chrome)
  const periodicSyncSupported = await registerPeriodicSync(intervalMinutes);

  if (periodicSyncSupported) {
    console.log('[Signal Notifier] ✅ Using Periodic Sync (Chrome) - works even when browser closed!');
    trackScanner('sync_mode_periodic');
  } else {
    // Fallback: register one-time background sync
    const backgroundSyncSupported = await registerBackgroundSync();

    if (backgroundSyncSupported) {
      console.log('[Signal Notifier] ✅ Using Background Sync - limited but better than nothing');
      trackScanner('sync_mode_background');
    } else {
      console.log('[Signal Notifier] ⚠️ Service Worker not available, using client-side scanning');
      trackScanner('sync_mode_client');
    }
  }

  // Always run client-side scanner as well (for immediate feedback)
  scanWithRetry(); // Run immediately

  const intervalMs = intervalMinutes * 60 * 1000;
  const intervalId = setInterval(() => {
    scanWithRetry();
  }, intervalMs);

  // Return cleanup function
  return () => {
    console.log('[Signal Notifier] Stopping enhanced background scanner');
    trackScanner('scanner_stopped', { intervalMinutes });
    clearInterval(intervalId);
  };
}
