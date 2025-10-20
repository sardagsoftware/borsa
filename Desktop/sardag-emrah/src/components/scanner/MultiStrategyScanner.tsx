"use client";

import { useEffect, useRef } from "react";
import { analyzeSymbol, type AggregatedSignal } from "@/lib/strategy-aggregator";
import toast from "react-hot-toast";

/**
 * MULTI-STRATEGY SCANNER - TÜM FUTURES COİNLER
 *
 * - Tüm Binance Futures USDT pairlerini tarar
 * - 6 farklı strateji ile analiz eder:
 *   1. MA7-25-99 Crossover Pullback
 *   2. RSI Divergence
 *   3. MACD Histogram
 *   4. Bollinger Squeeze
 *   5. EMA Ribbon
 *   6. Volume Profile
 * - Batch processing ile rate limit koruması
 * - Her 30 saniyede döngü başlar (daha kapsamlı analiz için)
 * - En az 2 strateji onayı gerektirir
 */

interface MultiStrategyScannerProps {
  enabled?: boolean;
  onSignalFound?: (signal: AggregatedSignal) => void;
}

export default function MultiStrategyScanner({
  enabled = true,
  onSignalFound
}: MultiStrategyScannerProps) {
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
          console.log(`[Multi-Strategy Scanner] 📊 ${allSymbolsRef.current.length} futures pairs loaded for 6-strategy analysis`);
        }
      } catch (error) {
        console.error('[Multi-Strategy Scanner] Failed to load symbols:', error);
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
        const BATCH_SIZE = 20; // 20 coins per batch (smaller because more intensive analysis)
        const startIdx = currentBatchIndexRef.current;
        const batch = allSymbolsRef.current.slice(startIdx, startIdx + BATCH_SIZE);

        console.log(`[Multi-Strategy Scanner] 🔍 Batch ${Math.floor(startIdx / BATCH_SIZE) + 1} - Analyzing ${batch.length} coins with 6 strategies...`);

        for (const symbol of batch) {
          try {
            // Analyze with all 6 strategies
            const analysis = await analyzeSymbol(symbol, '4h');

            // Only notify if at least 2 strategies agree
            if (analysis && analysis.agreementCount >= 2) {
              const signalKey = `${symbol}_${analysis.timestamp}`;

              if (!scannedSignalsRef.current.has(signalKey)) {
                console.log(`[Multi-Strategy Scanner] ✅ MULTI-SIGNAL: ${symbol} (${analysis.agreementCount}/6 strategies, ${analysis.confidenceScore.toFixed(0)}% confidence)`);

                // Determine emoji based on confidence
                let emoji = '🎯';
                if (analysis.confidenceScore >= 80) emoji = '🚀';
                else if (analysis.confidenceScore >= 70) emoji = '🔥';
                else if (analysis.confidenceScore >= 60) emoji = '⚡';

                toast.success(
                  `${emoji} ${symbol.replace('USDT', '')} ÇOKLU SİNYAL!\n\n` +
                  `${analysis.overall}\n` +
                  `✅ ${analysis.agreementCount}/6 Strateji Onayı\n` +
                  `💪 Güven: ${analysis.confidenceScore.toFixed(0)}%`,
                  {
                    icon: emoji,
                    duration: 20000, // 20 seconds for multi-strategy signals
                    style: {
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      fontWeight: 'bold',
                      minWidth: '320px',
                    }
                  }
                );

                if (onSignalFound) onSignalFound(analysis);
                scannedSignalsRef.current.add(signalKey);

                // Clear after 4 hours
                setTimeout(() => scannedSignalsRef.current.delete(signalKey), 14400000);
              }
            }

            // Rate limiting - 200ms between requests
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (err) {
            // Silent continue
            console.error(`[Multi-Strategy Scanner] Error analyzing ${symbol}:`, err);
          }
        }

        // Move to next batch
        currentBatchIndexRef.current += BATCH_SIZE;
        if (currentBatchIndexRef.current >= allSymbolsRef.current.length) {
          currentBatchIndexRef.current = 0; // Restart from beginning
          console.log('[Multi-Strategy Scanner] ♻️ Completed full cycle with 6 strategies, restarting...');
        }

      } catch (error) {
        console.error('[Multi-Strategy Scanner] Batch error:', error);
      } finally {
        isScanningRef.current = false;
      }
    };

    // İlk batch 5 saniye sonra
    const initialTimer = setTimeout(runBatchScan, 5000);

    // Her 30 saniyede bir batch (daha kapsamlı analiz için daha uzun interval)
    const interval = setInterval(runBatchScan, 30000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [enabled, onSignalFound]);

  return null;
}
