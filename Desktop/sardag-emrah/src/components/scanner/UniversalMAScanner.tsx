"use client";

import { useEffect, useRef } from "react";
import { detectMACrossoverPullback, type MACrossoverSignal } from "@/lib/signals/ma-crossover-pullback";
import toast from "react-hot-toast";

/**
 * UNIVERSAL MA SCANNER - TÜM FUTURES COİNLER
 *
 * - Tüm Binance Futures USDT pairlerini tarar
 * - Batch processing ile rate limit koruması
 * - Her 15 saniyede döngü başlar
 * - MA7-25-99 stratejisi her coin için çalışır
 */

interface UniversalMAScannerProps {
  enabled?: boolean;
  onSignalFound?: (signal: MACrossoverSignal) => void;
}

export default function UniversalMAScanner({
  enabled = true,
  onSignalFound
}: UniversalMAScannerProps) {
  const scannedSignalsRef = useRef<Set<string>>(new Set());
  const isScanningRef = useRef(false);
  const allSymbolsRef = useRef<string[]>([]);
  const currentBatchIndexRef = useRef(0);

  // Fetch all Futures symbols once
  useEffect(() => {
    if (!enabled) return;

    async function fetchAllSymbols() {
      try {
        const response = await fetch('/api/futures-all');
        if (!response.ok) return;

        const data = await response.json();
        if (data.success && data.data) {
          allSymbolsRef.current = data.data.map((pair: any) => pair.symbol);
          console.log(`[Universal Scanner] 📊 ${allSymbolsRef.current.length} futures pairs loaded`);
        }
      } catch (error) {
        console.error('[Universal Scanner] Failed to load symbols:', error);
      }
    }

    fetchAllSymbols();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const runBatchScan = async () => {
      if (isScanningRef.current) return;
      if (allSymbolsRef.current.length === 0) return;

      isScanningRef.current = true;

      try {
        const BATCH_SIZE = 30; // 30 coin per batch
        const startIdx = currentBatchIndexRef.current;
        const batch = allSymbolsRef.current.slice(startIdx, startIdx + BATCH_SIZE);

        console.log(`[Universal Scanner] 🔍 Batch ${Math.floor(startIdx / BATCH_SIZE) + 1} - Scanning ${batch.length} coins...`);

        for (const symbol of batch) {
          try {
            // Fetch candles
            const response = await fetch(
              `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=4h&limit=200`
            );

            if (!response.ok) continue;

            const data = await response.json();
            const candles = data.map((d: any) => ({
              time: d[0],
              open: parseFloat(d[1]),
              high: parseFloat(d[2]),
              low: parseFloat(d[3]),
              close: parseFloat(d[4]),
              volume: parseFloat(d[5]),
            }));

            // Detect signal
            const signal = detectMACrossoverPullback(symbol, '4h', candles);

            if (signal && signal.strength >= 5) {
              const signalKey = `${signal.symbol}_${signal.timestamp}`;

              if (!scannedSignalsRef.current.has(signalKey)) {
                console.log(`[Universal Scanner] ✅ SIGNAL: ${symbol} (${signal.strength}/10)`);

                toast.success(
                  `🎯 ${signal.symbol.replace('USDT', '')} MA7 PULLBACK!\n\n` +
                  `✅ MA7 Golden Cross\n` +
                  `✅ ${signal.greenCandlesCount} Yeşil Mum\n` +
                  `💪 Güç: ${signal.strength}/10`,
                  {
                    icon: "🚀",
                    duration: 15000,
                    style: {
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      fontWeight: 'bold',
                    }
                  }
                );

                if (onSignalFound) onSignalFound(signal);
                scannedSignalsRef.current.add(signalKey);

                setTimeout(() => scannedSignalsRef.current.delete(signalKey), 14400000);
              }
            }

            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (err) {
            // Silent continue
          }
        }

        // Move to next batch
        currentBatchIndexRef.current += BATCH_SIZE;
        if (currentBatchIndexRef.current >= allSymbolsRef.current.length) {
          currentBatchIndexRef.current = 0; // Restart from beginning
          console.log('[Universal Scanner] ♻️ Completed full cycle, restarting...');
        }

      } catch (error) {
        console.error('[Universal Scanner] Batch error:', error);
      } finally {
        isScanningRef.current = false;
      }
    };

    // İlk batch 3 saniye sonra
    const initialTimer = setTimeout(runBatchScan, 3000);

    // Her 15 saniyede bir batch
    const interval = setInterval(runBatchScan, 15000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [enabled, onSignalFound]);

  return null;
}
