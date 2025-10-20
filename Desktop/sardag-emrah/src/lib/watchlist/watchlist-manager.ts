/**
 * WATCHLIST MANAGER
 *
 * Kullanıcının favori coinlerini ve price alert'lerini yönetir
 */

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  type: 'ABOVE' | 'BELOW';
  createdAt: number;
  triggered: boolean;
  notified: boolean;
}

export interface WatchlistItem {
  symbol: string;
  addedAt: number;
  notes?: string;
}

export interface Watchlist {
  coins: WatchlistItem[];
  alerts: PriceAlert[];
}

const STORAGE_KEY = 'sardag_watchlist';

/**
 * Get watchlist from localStorage
 */
export function getWatchlist(): Watchlist {
  if (typeof window === 'undefined') {
    return { coins: [], alerts: [] };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { coins: [], alerts: [] };
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('[Watchlist] Error loading:', error);
    return { coins: [], alerts: [] };
  }
}

/**
 * Save watchlist to localStorage
 */
function saveWatchlist(watchlist: Watchlist): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
  } catch (error) {
    console.error('[Watchlist] Error saving:', error);
  }
}

/**
 * Add coin to watchlist
 */
export function addToWatchlist(symbol: string, notes?: string): void {
  const watchlist = getWatchlist();

  // Check if already exists
  if (watchlist.coins.some(c => c.symbol === symbol)) {
    console.log('[Watchlist] Coin already in watchlist:', symbol);
    return;
  }

  watchlist.coins.push({
    symbol,
    addedAt: Date.now(),
    notes,
  });

  saveWatchlist(watchlist);
  console.log('[Watchlist] Added:', symbol);
}

/**
 * Remove coin from watchlist
 */
export function removeFromWatchlist(symbol: string): void {
  const watchlist = getWatchlist();
  watchlist.coins = watchlist.coins.filter(c => c.symbol !== symbol);
  saveWatchlist(watchlist);
  console.log('[Watchlist] Removed:', symbol);
}

/**
 * Check if coin is in watchlist
 */
export function isInWatchlist(symbol: string): boolean {
  const watchlist = getWatchlist();
  return watchlist.coins.some(c => c.symbol === symbol);
}

/**
 * Get all watchlist coins
 */
export function getWatchlistCoins(): string[] {
  const watchlist = getWatchlist();
  return watchlist.coins.map(c => c.symbol);
}

/**
 * Add price alert
 */
export function addPriceAlert(
  symbol: string,
  targetPrice: number,
  type: 'ABOVE' | 'BELOW'
): string {
  const watchlist = getWatchlist();

  const alert: PriceAlert = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    symbol,
    targetPrice,
    type,
    createdAt: Date.now(),
    triggered: false,
    notified: false,
  };

  watchlist.alerts.push(alert);
  saveWatchlist(watchlist);

  console.log('[Watchlist] Alert added:', alert);
  return alert.id;
}

/**
 * Remove price alert
 */
export function removePriceAlert(alertId: string): void {
  const watchlist = getWatchlist();
  watchlist.alerts = watchlist.alerts.filter(a => a.id !== alertId);
  saveWatchlist(watchlist);
  console.log('[Watchlist] Alert removed:', alertId);
}

/**
 * Check price alerts
 */
export function checkPriceAlerts(currentPrices: Record<string, number>): PriceAlert[] {
  const watchlist = getWatchlist();
  const triggered: PriceAlert[] = [];

  watchlist.alerts.forEach(alert => {
    if (alert.triggered) return;

    const currentPrice = currentPrices[alert.symbol];
    if (!currentPrice) return;

    let shouldTrigger = false;

    if (alert.type === 'ABOVE' && currentPrice >= alert.targetPrice) {
      shouldTrigger = true;
    } else if (alert.type === 'BELOW' && currentPrice <= alert.targetPrice) {
      shouldTrigger = true;
    }

    if (shouldTrigger) {
      alert.triggered = true;
      triggered.push(alert);
      console.log('[Watchlist] Alert triggered:', alert);
    }
  });

  if (triggered.length > 0) {
    saveWatchlist(watchlist);
  }

  return triggered;
}

/**
 * Get active alerts
 */
export function getActiveAlerts(): PriceAlert[] {
  const watchlist = getWatchlist();
  return watchlist.alerts.filter(a => !a.triggered);
}

/**
 * Clear all triggered alerts
 */
export function clearTriggeredAlerts(): void {
  const watchlist = getWatchlist();
  watchlist.alerts = watchlist.alerts.filter(a => !a.triggered);
  saveWatchlist(watchlist);
  console.log('[Watchlist] Cleared triggered alerts');
}

/**
 * Export watchlist (for backup)
 */
export function exportWatchlist(): string {
  const watchlist = getWatchlist();
  return JSON.stringify(watchlist, null, 2);
}

/**
 * Import watchlist (from backup)
 */
export function importWatchlist(jsonString: string): boolean {
  try {
    const watchlist: Watchlist = JSON.parse(jsonString);

    // Validate structure
    if (!Array.isArray(watchlist.coins) || !Array.isArray(watchlist.alerts)) {
      throw new Error('Invalid watchlist format');
    }

    saveWatchlist(watchlist);
    console.log('[Watchlist] Imported successfully');
    return true;
  } catch (error) {
    console.error('[Watchlist] Import error:', error);
    return false;
  }
}
