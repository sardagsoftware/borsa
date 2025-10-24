/**
 * SMART NOTIFICATION SYSTEM
 *
 * Real-time akıllı bildirimler:
 * - Strong signals
 * - Price alerts
 * - Strategy agreements
 * - Critical updates
 */

export type NotificationType =
  | 'STRONG_BUY'
  | 'STRONG_SELL'
  | 'PRICE_ALERT'
  | 'STRATEGY_AGREEMENT'
  | 'STOP_LOSS_WARNING'
  | 'TAKE_PROFIT_HIT';

export type NotificationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface SmartNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  coin: string;
  title: string;
  message: string;
  confidence?: number;
  strategies?: string[];
  action?: string;
  timestamp: number;
  read: boolean;
}

const STORAGE_KEY = 'sardag_notifications';
const MAX_NOTIFICATIONS = 50;

/**
 * Get all notifications
 */
export function getNotifications(): SmartNotification[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Save notifications
 */
function saveNotifications(notifications: SmartNotification[]): void {
  if (typeof window === 'undefined') return;

  try {
    // Keep only last MAX_NOTIFICATIONS
    const limited = notifications.slice(-MAX_NOTIFICATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
  } catch (error) {
    console.error('[SmartNotifier] Save error:', error);
  }
}

/**
 * Add notification
 */
export function addNotification(notification: Omit<SmartNotification, 'id' | 'timestamp' | 'read'>): string {
  const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const newNotification: SmartNotification = {
    ...notification,
    id,
    timestamp: Date.now(),
    read: false,
  };

  const notifications = getNotifications();
  notifications.push(newNotification);
  saveNotifications(notifications);

  // Show browser notification if permitted
  showBrowserNotification(newNotification);

  console.log('[SmartNotifier] Notification added:', newNotification);
  return id;
}

/**
 * Mark notification as read
 */
export function markAsRead(notificationId: string): void {
  const notifications = getNotifications();
  const notification = notifications.find(n => n.id === notificationId);

  if (notification) {
    notification.read = true;
    saveNotifications(notifications);
  }
}

/**
 * Mark all as read
 */
export function markAllAsRead(): void {
  const notifications = getNotifications();
  notifications.forEach(n => n.read = true);
  saveNotifications(notifications);
}

/**
 * Delete notification
 */
export function deleteNotification(notificationId: string): void {
  let notifications = getNotifications();
  notifications = notifications.filter(n => n.id !== notificationId);
  saveNotifications(notifications);
}

/**
 * Clear all notifications
 */
export function clearAllNotifications(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get unread count
 */
export function getUnreadCount(): number {
  const notifications = getNotifications();
  return notifications.filter(n => !n.read).length;
}

/**
 * Show browser notification
 */
function showBrowserNotification(notification: SmartNotification): void {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      const icon = notification.priority === 'HIGH' ? '🚨' : '📊';
      const browserNotif = new Notification(`${icon} ${notification.title}`, {
        body: notification.message,
        icon: '/icon-192.png',
        badge: '/icon-96.png',
        tag: notification.coin, // Group by coin
        requireInteraction: notification.priority === 'HIGH',
      });

      // Auto-close after 10 seconds (except HIGH priority)
      if (notification.priority !== 'HIGH') {
        setTimeout(() => browserNotif.close(), 10000);
      }

      browserNotif.onclick = () => {
        window.focus();
        browserNotif.close();
        // Navigate to coin detail
        const url = `/market?coin=${notification.coin}`;
        window.location.href = url;
      };
    } catch (error) {
      console.error('[SmartNotifier] Browser notification error:', error);
    }
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('[SmartNotifier] Permission request error:', error);
    return false;
  }
}

/**
 * Check if notifications are enabled
 */
export function areNotificationsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  return Notification.permission === 'granted';
}

/**
 * Helper: Create STRONG BUY notification
 */
export function notifyStrongBuy(
  coin: string,
  confidence: number,
  strategies: string[]
): string {
  return addNotification({
    type: 'STRONG_BUY',
    priority: 'HIGH',
    coin,
    title: `🚀 ${coin} - GÜÇLÜ AL SİNYALİ!`,
    message: `${strategies.length} strateji anlaştı! Güven: %${confidence}`,
    confidence,
    strategies,
    action: 'AL',
  });
}

/**
 * Helper: Create price alert notification
 */
export function notifyPriceAlert(
  coin: string,
  currentPrice: number,
  targetPrice: number,
  type: 'ABOVE' | 'BELOW'
): string {
  const symbol = type === 'ABOVE' ? '⬆️' : '⬇️';
  const action = type === 'ABOVE' ? 'üzerine çıktı' : 'altına düştü';

  return addNotification({
    type: 'PRICE_ALERT',
    priority: 'MEDIUM',
    coin,
    title: `${symbol} ${coin} Fiyat Uyarısı`,
    message: `$${currentPrice.toFixed(2)} - Hedef $${targetPrice.toFixed(2)} ${action}`,
  });
}

/**
 * Helper: Create strategy agreement notification
 */
export function notifyStrategyAgreement(
  coin: string,
  agreementCount: number,
  totalStrategies: number,
  confidence: number
): string {
  return addNotification({
    type: 'STRATEGY_AGREEMENT',
    priority: 'MEDIUM',
    coin,
    title: `📊 ${coin} - Strateji Anlaşması`,
    message: `${agreementCount}/${totalStrategies} strateji anlaştı (%${confidence} güven)`,
    confidence,
  });
}
