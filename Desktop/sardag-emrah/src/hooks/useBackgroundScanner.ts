/**
 * BACKGROUND SCANNER HOOK
 *
 * Background scanner ile entegrasyon
 * - Auto-refresh her 30 saniyede
 * - Real-time signal updates
 * - Smart notifications
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { getBackgroundScanner, type ScanResult } from '@/lib/signals/background-scanner';

export interface UseBackgroundScannerResult {
  results: ScanResult[];
  buySignals: ScanResult[];
  isRunning: boolean;
  lastScan: number;
  scanCount: number;
  getResultForSymbol: (symbol: string) => ScanResult | undefined;
  forceScan: () => Promise<void>;
}

/**
 * Hook for using background scanner in components
 */
export function useBackgroundScanner(): UseBackgroundScannerResult {
  const [results, setResults] = useState<ScanResult[]>([]);
  const [buySignals, setBuySignals] = useState<ScanResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastScan, setLastScan] = useState(0);
  const [scanCount, setScanCount] = useState(0);

  // Get scanner instance
  const scanner = getBackgroundScanner();

  // Subscribe to scan results
  useEffect(() => {
    // Initial load
    setResults(scanner.getAllResults());
    setBuySignals(scanner.getBuySignals());

    const state = scanner.getState();
    setIsRunning(state.isRunning);
    setLastScan(state.lastScan);
    setScanCount(state.scanCount);

    // Subscribe to updates
    const unsubscribe = scanner.subscribe((newResults) => {
      setResults(newResults);
      setBuySignals(newResults.filter(
        r => r.analysis.badge === 'BUY' || r.analysis.badge === 'STRONG BUY'
      ));

      const state = scanner.getState();
      setIsRunning(state.isRunning);
      setLastScan(state.lastScan);
      setScanCount(state.scanCount);
    });

    // Start scanner if not running
    if (!scanner.getState().isRunning) {
      scanner.start();
    }

    return () => {
      unsubscribe();
    };
  }, []);

  // Get result for specific symbol
  const getResultForSymbol = useCallback((symbol: string) => {
    return scanner.getResult(symbol);
  }, [results]);

  // Force immediate scan
  const forceScan = useCallback(async () => {
    await scanner.forceScan();
  }, []);

  return {
    results,
    buySignals,
    isRunning,
    lastScan,
    scanCount,
    getResultForSymbol,
    forceScan,
  };
}

/**
 * Hook for smart notifications
 */
export function useSignalNotifications(onNotification?: (result: ScanResult) => void) {
  const scanner = getBackgroundScanner();

  useEffect(() => {
    if (!onNotification) return;

    const unsubscribe = scanner.onNotification((result) => {
      onNotification(result);
    });

    return () => {
      unsubscribe();
    };
  }, [onNotification]);
}

/**
 * Hook for auto-refresh with custom interval
 */
export function useAutoRefresh(callback: () => void | Promise<void>, interval: number = 30000) {
  useEffect(() => {
    // Initial call
    callback();

    // Set up interval
    const id = setInterval(() => {
      callback();
    }, interval);

    return () => {
      clearInterval(id);
    };
  }, [callback, interval]);
}
