/**
 * useWatchlist Hook
 *
 * React hook for watchlist management
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
  getWatchlistCoins,
  addPriceAlert,
  removePriceAlert,
  checkPriceAlerts,
  getActiveAlerts,
  clearTriggeredAlerts,
  type Watchlist,
  type PriceAlert,
} from '@/lib/watchlist/watchlist-manager';

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<Watchlist>({ coins: [], alerts: [] });
  const [triggeredAlerts, setTriggeredAlerts] = useState<PriceAlert[]>([]);

  // Load watchlist on mount
  useEffect(() => {
    const loaded = getWatchlist();
    setWatchlist(loaded);
  }, []);

  // Add coin to watchlist
  const addCoin = useCallback((symbol: string, notes?: string) => {
    addToWatchlist(symbol, notes);
    const updated = getWatchlist();
    setWatchlist(updated);
  }, []);

  // Remove coin from watchlist
  const removeCoin = useCallback((symbol: string) => {
    removeFromWatchlist(symbol);
    const updated = getWatchlist();
    setWatchlist(updated);
  }, []);

  // Check if coin is in watchlist
  const isCoinInWatchlist = useCallback((symbol: string) => {
    return isInWatchlist(symbol);
  }, []);

  // Toggle coin in watchlist
  const toggleCoin = useCallback((symbol: string, notes?: string) => {
    if (isInWatchlist(symbol)) {
      removeCoin(symbol);
    } else {
      addCoin(symbol, notes);
    }
  }, [addCoin, removeCoin]);

  // Add price alert
  const addAlert = useCallback((
    symbol: string,
    targetPrice: number,
    type: 'ABOVE' | 'BELOW'
  ) => {
    const alertId = addPriceAlert(symbol, targetPrice, type);
    const updated = getWatchlist();
    setWatchlist(updated);
    return alertId;
  }, []);

  // Remove price alert
  const removeAlert = useCallback((alertId: string) => {
    removePriceAlert(alertId);
    const updated = getWatchlist();
    setWatchlist(updated);
  }, []);

  // Check alerts with current prices
  const checkAlerts = useCallback((currentPrices: Record<string, number>) => {
    const triggered = checkPriceAlerts(currentPrices);
    if (triggered.length > 0) {
      setTriggeredAlerts(prev => [...prev, ...triggered]);
      const updated = getWatchlist();
      setWatchlist(updated);
    }
  }, []);

  // Clear triggered alerts
  const clearTriggered = useCallback(() => {
    clearTriggeredAlerts();
    setTriggeredAlerts([]);
    const updated = getWatchlist();
    setWatchlist(updated);
  }, []);

  // Get watchlist coins symbols
  const coins = watchlist.coins.map(c => c.symbol);
  const activeAlerts = watchlist.alerts.filter(a => !a.triggered);

  return {
    watchlist,
    coins,
    activeAlerts,
    triggeredAlerts,
    addCoin,
    removeCoin,
    toggleCoin,
    isCoinInWatchlist,
    addAlert,
    removeAlert,
    checkAlerts,
    clearTriggered,
  };
}
