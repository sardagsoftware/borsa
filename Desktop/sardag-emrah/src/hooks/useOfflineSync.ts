/**
 * OFFLINE SYNC HOOK
 *
 * Automatically sync data to IndexedDB for offline access
 * Works with market data, signals, and traditional markets
 */

'use client';

import { useEffect, useState } from 'react';
import { MarketDataStore, SignalStore, TraditionalMarketStore, isIndexedDBAvailable } from '@/lib/offline/indexeddb-store';

export interface OfflineStatus {
  isOnline: boolean;
  isIndexedDBAvailable: boolean;
  lastSync: number | null;
  pendingSync: number;
}

export function useOfflineSync() {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isIndexedDBAvailable: false,
    lastSync: null,
    pendingSync: 0,
  });

  useEffect(() => {
    // Check IndexedDB availability
    setStatus(prev => ({
      ...prev,
      isIndexedDBAvailable: isIndexedDBAvailable(),
    }));

    // Online/Offline listeners
    const handleOnline = () => {
      console.log('[Offline Sync] Back online!');
      setStatus(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      console.log('[Offline Sync] Gone offline!');
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Sync market data to IndexedDB
   */
  const syncMarketData = async (symbol: string, data: any) => {
    if (!isIndexedDBAvailable()) return false;

    try {
      await MarketDataStore.set(symbol, data);
      setStatus(prev => ({ ...prev, lastSync: Date.now() }));
      return true;
    } catch (error) {
      console.error('[Offline Sync] Market data sync error:', error);
      return false;
    }
  };

  /**
   * Sync signal analysis to IndexedDB
   */
  const syncSignal = async (symbol: string, timeframe: string, analysis: any) => {
    if (!isIndexedDBAvailable()) return false;

    try {
      await SignalStore.set(symbol, timeframe, analysis);
      setStatus(prev => ({ ...prev, lastSync: Date.now() }));
      return true;
    } catch (error) {
      console.error('[Offline Sync] Signal sync error:', error);
      return false;
    }
  };

  /**
   * Sync traditional market data to IndexedDB
   */
  const syncTraditionalMarket = async (symbol: string, data: any) => {
    if (!isIndexedDBAvailable()) return false;

    try {
      await TraditionalMarketStore.set(symbol, data);
      setStatus(prev => ({ ...prev, lastSync: Date.now() }));
      return true;
    } catch (error) {
      console.error('[Offline Sync] Traditional market sync error:', error);
      return false;
    }
  };

  /**
   * Get offline market data
   */
  const getOfflineMarketData = async (symbol: string) => {
    if (!isIndexedDBAvailable()) return null;

    try {
      const entry = await MarketDataStore.get(symbol);
      return entry?.data || null;
    } catch (error) {
      console.error('[Offline Sync] Get offline market data error:', error);
      return null;
    }
  };

  /**
   * Get offline signal
   */
  const getOfflineSignal = async (symbol: string, timeframe: string) => {
    if (!isIndexedDBAvailable()) return null;

    try {
      const entry = await SignalStore.get(symbol, timeframe);
      return entry?.analysis || null;
    } catch (error) {
      console.error('[Offline Sync] Get offline signal error:', error);
      return null;
    }
  };

  /**
   * Get offline traditional market
   */
  const getOfflineTraditionalMarket = async (symbol: string) => {
    if (!isIndexedDBAvailable()) return null;

    try {
      const entry = await TraditionalMarketStore.get(symbol);
      return entry?.data || null;
    } catch (error) {
      console.error('[Offline Sync] Get offline traditional market error:', error);
      return null;
    }
  };

  return {
    status,
    syncMarketData,
    syncSignal,
    syncTraditionalMarket,
    getOfflineMarketData,
    getOfflineSignal,
    getOfflineTraditionalMarket,
  };
}
