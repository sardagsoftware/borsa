/**
 * BACKGROUND SCANNER SERVICE
 *
 * 7/24 sürekli çalışan otomatik scanner
 * - Her 30 saniyede bir tüm coinleri tarar
 * - Signal strength hesaplar
 * - Güçlü sinyallerde bildirim gönderir
 * - Auto-refresh için data sağlar
 */

import type { SignalAnalysis } from './signal-strength';
import { calculateSignalStrength, convertScannerSignals, shouldNotify } from './signal-strength';

export interface ScanResult {
  symbol: string;
  analysis: SignalAnalysis;
  timestamp: number;
  price: number;
  change24h: number;
}

export interface ScannerState {
  isRunning: boolean;
  lastScan: number;
  results: Map<string, ScanResult>;
  scanCount: number;
  errors: string[];
}

class BackgroundScanner {
  private intervalId: NodeJS.Timeout | null = null;
  private state: ScannerState = {
    isRunning: false,
    lastScan: 0,
    results: new Map(),
    scanCount: 0,
    errors: [],
  };
  private listeners: Set<(results: ScanResult[]) => void> = new Set();
  private notificationListeners: Set<(result: ScanResult) => void> = new Set();
  private scanInterval = 30000; // 30 seconds
  private previousResults: Map<string, SignalAnalysis> = new Map();

  /**
   * Start the background scanner
   */
  start(): void {
    if (this.state.isRunning) {
      console.log('[BackgroundScanner] Already running');
      return;
    }

    console.log('[BackgroundScanner] Starting...');
    this.state.isRunning = true;

    // Initial scan
    this.scan();

    // Set up interval
    this.intervalId = setInterval(() => {
      this.scan();
    }, this.scanInterval);
  }

  /**
   * Stop the background scanner
   */
  stop(): void {
    if (!this.state.isRunning) {
      return;
    }

    console.log('[BackgroundScanner] Stopping...');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.state.isRunning = false;
  }

  /**
   * Perform a scan of all coins
   */
  private async scan(): Promise<void> {
    try {
      console.log(`[BackgroundScanner] Scanning... (${this.state.scanCount + 1})`);

      // Fetch signals from API (get top 100 for comprehensive coverage)
      const response = await fetch('/api/scanner/signals?limit=100&type=BUY');
      if (!response.ok) {
        throw new Error(`Scanner API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.signals) {
        throw new Error('Invalid API response');
      }

      const apiSignals = data.signals || [];

      // Process each symbol
      const newResults: ScanResult[] = [];

      for (const signalData of apiSignals) {
        const { symbol, signal, confidence, strategies, price } = signalData;

        // Convert API data to strategy signals format
        const strategySignals = [];
        for (let i = 0; i < strategies; i++) {
          strategySignals.push({
            name: `Strategy ${i + 1}`,
            signal: signal as 'BUY' | 'SELL' | 'NEUTRAL',
            strength: confidence || 50,
            confidence: confidence || 50,
          });
        }

        // Calculate signal strength
        const analysis = calculateSignalStrength(strategySignals);

        const result: ScanResult = {
          symbol,
          analysis,
          timestamp: Date.now(),
          price: price || 0,
          change24h: 0, // Not provided by API
        };

        newResults.push(result);
        this.state.results.set(symbol, result);

        // Check if should notify
        const previous = this.previousResults.get(symbol);
        if (shouldNotify(analysis, previous)) {
          this.notifyListeners(result);
        }

        // Update previous
        this.previousResults.set(symbol, analysis);
      }

      // Update state
      this.state.lastScan = Date.now();
      this.state.scanCount++;

      // Notify all listeners
      this.broadcastResults(newResults);

      console.log(`[BackgroundScanner] Scan complete. Found ${newResults.length} results.`);
      console.log(`[BackgroundScanner] BUY signals: ${newResults.filter(r => r.analysis.badge === 'BUY').length}`);
      console.log(`[BackgroundScanner] STRONG BUY signals: ${newResults.filter(r => r.analysis.badge === 'STRONG BUY').length}`);

    } catch (error: any) {
      console.error('[BackgroundScanner] Scan error:', error);
      this.state.errors.push(error.message);

      // Keep only last 10 errors
      if (this.state.errors.length > 10) {
        this.state.errors = this.state.errors.slice(-10);
      }
    }
  }

  /**
   * Subscribe to scan results
   */
  subscribe(listener: (results: ScanResult[]) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Subscribe to notifications (only BUY/STRONG_BUY)
   */
  onNotification(listener: (result: ScanResult) => void): () => void {
    this.notificationListeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.notificationListeners.delete(listener);
    };
  }

  /**
   * Broadcast results to all listeners
   */
  private broadcastResults(results: ScanResult[]): void {
    this.listeners.forEach(listener => {
      try {
        listener(results);
      } catch (error) {
        console.error('[BackgroundScanner] Listener error:', error);
      }
    });
  }

  /**
   * Notify listeners of strong signals
   */
  private notifyListeners(result: ScanResult): void {
    this.notificationListeners.forEach(listener => {
      try {
        listener(result);
      } catch (error) {
        console.error('[BackgroundScanner] Notification listener error:', error);
      }
    });
  }

  /**
   * Get current state
   */
  getState(): ScannerState {
    return { ...this.state };
  }

  /**
   * Get result for specific symbol
   */
  getResult(symbol: string): ScanResult | undefined {
    return this.state.results.get(symbol);
  }

  /**
   * Get all results
   */
  getAllResults(): ScanResult[] {
    return Array.from(this.state.results.values());
  }

  /**
   * Get BUY/STRONG_BUY results only
   */
  getBuySignals(): ScanResult[] {
    return this.getAllResults().filter(
      r => r.analysis.badge === 'BUY' || r.analysis.badge === 'STRONG BUY'
    );
  }

  /**
   * Set scan interval (in milliseconds)
   */
  setScanInterval(interval: number): void {
    if (interval < 10000) {
      console.warn('[BackgroundScanner] Interval too short, using 10s minimum');
      interval = 10000;
    }

    this.scanInterval = interval;

    // Restart if running
    if (this.state.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Force immediate scan
   */
  forceScan(): Promise<void> {
    return this.scan();
  }
}

// Singleton instance
let scannerInstance: BackgroundScanner | null = null;

/**
 * Get background scanner singleton
 */
export function getBackgroundScanner(): BackgroundScanner {
  if (!scannerInstance) {
    scannerInstance = new BackgroundScanner();
  }
  return scannerInstance;
}

/**
 * Auto-start scanner on import (client-side only)
 */
if (typeof window !== 'undefined') {
  const scanner = getBackgroundScanner();

  // Start scanner when page loads
  if (document.readyState === 'complete') {
    scanner.start();
  } else {
    window.addEventListener('load', () => {
      scanner.start();
    });
  }

  // Stop scanner when page unloads
  window.addEventListener('beforeunload', () => {
    scanner.stop();
  });
}
