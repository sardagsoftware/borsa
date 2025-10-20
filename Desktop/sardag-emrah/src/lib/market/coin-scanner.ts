/**
 * AUTOMATIC COIN SCANNER
 *
 * Sürekli çalışan background scanner
 * - 200 coin otomatik analiz
 * - 24h ve 4h timeframe taraması
 * - MA Crossover, SR, Volume, MTF sinyalleri
 * - Zero-error white-hat kuralları
 */

import { analyzeTimeframe, type TimeframeAnalysis } from './coin-analyzer';

// ============================================================
// SIGNAL TYPES
// ============================================================

export interface CoinSignal {
  symbol: string;
  currentPrice: number;
  timestamp: number;

  // Active Signals
  signals: {
    maCrossover24h: boolean;
    maCrossover4h: boolean;
    supportBreak24h: boolean;
    supportBreak4h: boolean;
    resistanceBreak24h: boolean;
    resistanceBreak4h: boolean;
    volumeSpike24h: boolean;
    volumeSpike4h: boolean;
    mtfAlignment: boolean; // 24h ve 4h aynı yönde
  };

  // Signal Count (for priority)
  signalCount: number;

  // Analysis Data
  tf24h: TimeframeAnalysis | null;
  tf4h: TimeframeAnalysis | null;
}

// ============================================================
// SCANNER STATE
// ============================================================

interface ScannerState {
  signals: Map<string, CoinSignal>;
  lastScanTime: number;
  isScanning: boolean;
  scanProgress: number;
  errorCount: number;
}

const scannerState: ScannerState = {
  signals: new Map(),
  lastScanTime: 0,
  isScanning: false,
  scanProgress: 0,
  errorCount: 0,
};

// ============================================================
// SCAN SINGLE COIN
// ============================================================

async function scanCoin(symbol: string, currentPrice: number): Promise<CoinSignal | null> {
  try {
    // Analyze 24h and 4h timeframes
    const [tf24h, tf4h] = await Promise.all([
      analyzeTimeframe(symbol, '1d'), // 24h günlük
      analyzeTimeframe(symbol, '4h'),
    ]);

    if (!tf24h || !tf4h) {
      return null;
    }

    // Detect signals
    const signals = {
      // MA Crossover signals
      maCrossover24h: tf24h.maCrossover,
      maCrossover4h: tf4h.maCrossover,

      // Support/Resistance breaks
      supportBreak24h: tf24h.supportLevel ? currentPrice < tf24h.supportLevel * 1.005 : false,
      supportBreak4h: tf4h.supportLevel ? currentPrice < tf4h.supportLevel * 1.005 : false,
      resistanceBreak24h: tf24h.resistanceLevel ? currentPrice > tf24h.resistanceLevel * 0.995 : false,
      resistanceBreak4h: tf4h.resistanceLevel ? currentPrice > tf4h.resistanceLevel * 0.995 : false,

      // Volume spikes
      volumeSpike24h: tf24h.volumeStatus === 'HIGH',
      volumeSpike4h: tf4h.volumeStatus === 'HIGH',

      // Multi-timeframe alignment
      mtfAlignment: tf24h.trend === tf4h.trend && tf24h.trend !== 'NEUTRAL',
    };

    // Count active signals
    const signalCount = Object.values(signals).filter(s => s).length;

    return {
      symbol,
      currentPrice,
      timestamp: Date.now(),
      signals,
      signalCount,
      tf24h,
      tf4h,
    };
  } catch (error) {
    console.error(`[Scanner] Error scanning ${symbol}:`, error);
    return null;
  }
}

// ============================================================
// BATCH SCAN WITH RATE LIMITING
// ============================================================

async function scanBatch(
  symbols: string[],
  prices: Map<string, number>,
  batchSize: number = 10,
  delayMs: number = 2000
): Promise<CoinSignal[]> {
  const results: CoinSignal[] = [];

  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);

    // Scan batch in parallel
    const batchPromises = batch.map(symbol => {
      const price = prices.get(symbol) || 0;
      return scanCoin(symbol, price);
    });

    const batchResults = await Promise.all(batchPromises);

    // Filter out nulls and add to results
    batchResults.forEach(result => {
      if (result && result.signalCount > 0) {
        results.push(result);
      }
    });

    // Update progress
    scannerState.scanProgress = Math.round(((i + batchSize) / symbols.length) * 100);

    // Rate limiting delay (except for last batch)
    if (i + batchSize < symbols.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

// ============================================================
// FULL SCAN
// ============================================================

export async function performFullScan(
  coins: Array<{ symbol: string; price: number }>
): Promise<void> {
  if (scannerState.isScanning) {
    console.log('[Scanner] Scan already in progress, skipping...');
    return;
  }

  try {
    scannerState.isScanning = true;
    scannerState.scanProgress = 0;
    scannerState.errorCount = 0;

    console.log(`[Scanner] 🔍 Starting scan of ${coins.length} coins...`);

    const symbols = coins.map(c => c.symbol);
    const priceMap = new Map(coins.map(c => [c.symbol, c.price]));

    // Scan in batches (10 coins per batch, 2s delay between batches)
    const results = await scanBatch(symbols, priceMap, 10, 2000);

    // Update scanner state
    scannerState.signals.clear();
    results.forEach(signal => {
      scannerState.signals.set(signal.symbol, signal);
    });

    scannerState.lastScanTime = Date.now();
    scannerState.isScanning = false;
    scannerState.scanProgress = 100;

    console.log(`[Scanner] ✅ Scan complete! Found ${results.length} coins with signals`);

    // Log top signals
    const topSignals = results
      .sort((a, b) => b.signalCount - a.signalCount)
      .slice(0, 10);

    console.log('[Scanner] 🏆 Top 10 signals:', topSignals.map(s => ({
      symbol: s.symbol,
      signals: s.signalCount,
    })));
  } catch (error) {
    console.error('[Scanner] Full scan error:', error);
    scannerState.isScanning = false;
    scannerState.errorCount++;
  }
}

// ============================================================
// GET SIGNALS
// ============================================================

export function getCoinSignal(symbol: string): CoinSignal | null {
  return scannerState.signals.get(symbol) || null;
}

export function getAllSignals(): CoinSignal[] {
  return Array.from(scannerState.signals.values())
    .sort((a, b) => b.signalCount - a.signalCount);
}

export function getScannerStatus() {
  return {
    isScanning: scannerState.isScanning,
    progress: scannerState.scanProgress,
    lastScanTime: scannerState.lastScanTime,
    signalCount: scannerState.signals.size,
    errorCount: scannerState.errorCount,
  };
}

// ============================================================
// CLEAR SIGNALS
// ============================================================

export function clearSignals(): void {
  scannerState.signals.clear();
  console.log('[Scanner] Signals cleared');
}

export default {
  performFullScan,
  getCoinSignal,
  getAllSignals,
  getScannerStatus,
  clearSignals,
};
