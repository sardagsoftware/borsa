/**
 * useCoinScanner Hook
 *
 * Otomatik coin tarama sistemi için React hook
 * - Background scanning
 * - Periodic re-scan
 * - Signal notifications
 */

import { useState, useEffect, useCallback } from 'react';
import {
  performFullScan,
  getCoinSignal,
  getAllSignals,
  getScannerStatus,
  type CoinSignal,
} from '@/lib/market/coin-scanner';
import type { MarketData } from '@/lib/market/market-data';

interface ScannerState {
  signals: CoinSignal[];
  isScanning: boolean;
  progress: number;
  lastScanTime: number;
  signalCount: number;
}

export function useCoinScanner(marketData: MarketData[]) {
  const [state, setState] = useState<ScannerState>({
    signals: [],
    isScanning: false,
    progress: 0,
    lastScanTime: 0,
    signalCount: 0,
  });

  const [newSignals, setNewSignals] = useState<CoinSignal[]>([]);

  // Update scanner status
  const updateStatus = useCallback(() => {
    const status = getScannerStatus();
    const signals = getAllSignals();

    setState({
      signals,
      isScanning: status.isScanning,
      progress: status.progress,
      lastScanTime: status.lastScanTime,
      signalCount: status.signalCount,
    });
  }, []);

  // Manual scan trigger
  const startScan = useCallback(async () => {
    if (marketData.length === 0) return;

    console.log('[useCoinScanner] Starting manual scan...');

    const coins = marketData.map(coin => ({
      symbol: coin.symbol,
      price: coin.price,
    }));

    // Store previous signals for comparison
    const previousSignals = new Set(getAllSignals().map(s => s.symbol));

    await performFullScan(coins);

    // Check for new signals
    const currentSignals = getAllSignals();
    const newlyDetected = currentSignals.filter(
      signal => !previousSignals.has(signal.symbol)
    );

    if (newlyDetected.length > 0) {
      console.log(`[useCoinScanner] 🎯 ${newlyDetected.length} new signals detected!`);
      setNewSignals(newlyDetected);
    }

    updateStatus();
  }, [marketData, updateStatus]);

  // Initial scan DISABLED - User must click "Tara" button
  // Performance optimization: Don't auto-scan on load
  // useEffect(() => {
  //   if (marketData.length === 0) return;
  //   console.log('[useCoinScanner] Market data loaded, starting initial scan...');
  //   startScan();
  // }, [marketData.length]);

  // Periodic re-scan DISABLED for performance
  // Only scan when user clicks "Tara" button
  // useEffect(() => {
  //   if (marketData.length === 0) return;
  //   const intervalId = setInterval(() => {
  //     console.log('[useCoinScanner] ⏰ Periodic scan triggered (5 min)');
  //     startScan();
  //   }, 5 * 60 * 1000);
  //   return () => clearInterval(intervalId);
  // }, [marketData.length, startScan]);

  // Update status every 2 seconds while scanning
  useEffect(() => {
    if (!state.isScanning) return;

    const intervalId = setInterval(() => {
      updateStatus();
    }, 2000);

    return () => clearInterval(intervalId);
  }, [state.isScanning, updateStatus]);

  // Check if coin has signal
  const hasSignal = useCallback((symbol: string): boolean => {
    const signal = getCoinSignal(symbol);
    return signal !== null && signal.signalCount > 0;
  }, []);

  // Get signal for coin
  const getSignal = useCallback((symbol: string): CoinSignal | null => {
    return getCoinSignal(symbol);
  }, []);

  // Clear new signals notification
  const clearNewSignals = useCallback(() => {
    setNewSignals([]);
  }, []);

  return {
    // Scanner state
    signals: state.signals,
    isScanning: state.isScanning,
    progress: state.progress,
    lastScanTime: state.lastScanTime,
    signalCount: state.signalCount,

    // New signals (for notifications)
    newSignals,
    clearNewSignals,

    // Methods
    startScan,
    hasSignal,
    getSignal,
  };
}
