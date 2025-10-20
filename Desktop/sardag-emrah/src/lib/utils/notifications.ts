/**
 * Browser Notification API wrapper for price alerts
 */

export type NotificationPermission = "default" | "granted" | "denied";

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.warn("Browser does not support notifications");
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission as NotificationPermission;
}

/**
 * Check if notifications are supported and granted
 */
export function canShowNotifications(): boolean {
  return (
    "Notification" in window &&
    Notification.permission === "granted"
  );
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!("Notification" in window)) {
    return "denied";
  }
  return Notification.permission as NotificationPermission;
}

export type PriceAlertNotificationOptions = {
  symbol: string;
  targetPrice: number;
  currentPrice: number;
  condition: "above" | "below";
};

/**
 * Show a price alert notification
 */
export function showPriceAlertNotification(options: PriceAlertNotificationOptions) {
  if (!canShowNotifications()) {
    console.warn("Cannot show notification - permission not granted");
    return;
  }

  const { symbol, targetPrice, currentPrice, condition } = options;
  const emoji = condition === "above" ? "📈" : "📉";
  const conditionText = condition === "above" ? "surpassed" : "fell below";

  const notification = new Notification(`${emoji} ${symbol} Price Alert`, {
    body: `${symbol} ${conditionText} $${targetPrice.toFixed(2)}\nCurrent: $${currentPrice.toFixed(2)}`,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: `price-alert-${symbol}-${targetPrice}`,
    requireInteraction: false,
    silent: false,
  });

  // Auto-close after 10 seconds
  setTimeout(() => {
    notification.close();
  }, 10000);

  // Click handler - focus the window
  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  return notification;
}

/**
 * Test notification - for checking if notifications work
 */
export function showTestNotification() {
  if (!canShowNotifications()) {
    console.warn("Cannot show test notification - permission not granted");
    return;
  }

  const notification = new Notification("🔔 Test Notification", {
    body: "Browser notifications are working correctly!",
    icon: "/favicon.ico",
    tag: "test-notification",
    requireInteraction: false,
  });

  setTimeout(() => {
    notification.close();
  }, 5000);

  return notification;
}
