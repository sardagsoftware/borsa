"use client";

import { useEffect, useRef } from "react";
import { scanMultipleSymbols, type MACrossoverSignal } from "@/lib/signals/ma-crossover-pullback";
import toast from "react-hot-toast";
import { notificationManager } from "@/lib/pwa/notifications";

/**
 * MA CROSSOVER PULLBACK BACKGROUND SCANNER
 *
 * Tüm coinler için otomatik tarama yapar:
 * - 20 popüler coin
 * - Her 15 saniyede bir
 * - Arka planda çalışır
 * - Sinyal bulunca toast notification gösterir
 */

interface MACrossoverScannerProps {
  enabled?: boolean;
  onSignalFound?: (signal: MACrossoverSignal) => void;
}

// Taranacak coinler (MinimalTopbar'dan aynı liste)
const POPULAR_COINS = [
  "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT",
  "XRPUSDT", "ADAUSDT", "DOGEUSDT", "AVAXUSDT",
  "DOTUSDT", "MATICUSDT", "LINKUSDT", "UNIUSDT",
  "ATOMUSDT", "LTCUSDT", "ETCUSDT", "NEARUSDT",
  "APTUSDT", "FILUSDT", "ARBUSDT", "OPUSDT"
];

export default function MACrossoverScanner({
  enabled = true,
  onSignalFound
}: MACrossoverScannerProps) {
  const scannedSignalsRef = useRef<Set<string>>(new Set());
  const isScanningRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const runScan = async () => {
      // Eğer tarama devam ediyorsa, yeni tarama başlatma
      if (isScanningRef.current) return;

      isScanningRef.current = true;

      try {
        console.log('[MA Scanner] 🔍 Tüm coinler taranıyor...');

        const signals = await scanMultipleSymbols(POPULAR_COINS, '4h');

        if (signals.length > 0) {
          console.log(`[MA Scanner] ✅ ${signals.length} sinyal bulundu!`);

          signals.forEach((signal) => {
            const signalKey = `${signal.symbol}_${signal.timestamp}`;

            // Daha önce gösterildi mi kontrol et
            if (scannedSignalsRef.current.has(signalKey)) return;

            // Toast notification göster
            toast.success(
              `🎯 ${signal.symbol.replace('USDT', '')} MA7 PULLBACK!\n\n` +
              `✅ MA7 Golden Cross\n` +
              `✅ ${signal.greenCandlesCount} Yeşil Mum\n` +
              `✅ MA7 Touch: $${signal.ma7.toFixed(2)}\n` +
              `💪 Güç: ${signal.strength}/10`,
              {
                icon: "🚀",
                duration: 12000,
                id: signalKey,
                style: {
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: '#fff',
                  fontWeight: 'bold',
                  whiteSpace: 'pre-line',
                }
              }
            );

            // Browser notification göster (mobilde çalışır)
            notificationManager.notifySignal({
              symbol: signal.symbol.replace('USDT', ''),
              type: 'MA7 PULLBACK',
              message: `✅ MA7 Golden Cross • ${signal.greenCandlesCount} Yeşil Mum • Güç: ${signal.strength}/10`,
              strength: signal.strength,
            }).catch(err => {
              console.warn('[MA Scanner] Browser notification failed:', err);
            });

            // Callback varsa çağır
            if (onSignalFound) {
              onSignalFound(signal);
            }

            // Sinyal gösterildi olarak işaretle
            scannedSignalsRef.current.add(signalKey);

            // 4 saat sonra temizle
            setTimeout(() => {
              scannedSignalsRef.current.delete(signalKey);
            }, 14400000); // 4 saat
          });
        } else {
          console.log('[MA Scanner] ℹ️ Henüz sinyal bulunamadı');
        }
      } catch (error) {
        console.error('[MA Scanner] Hata:', error);
        // Hata olsa bile sessizce devam et
      } finally {
        isScanningRef.current = false;
      }
    };

    // İlk tarama 5 saniye sonra (sayfa yüklendikten sonra)
    const initialTimer = setTimeout(runScan, 5000);

    // Her 15 saniyede bir tarama (15000ms)
    const interval = setInterval(runScan, 15000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [enabled, onSignalFound]);

  // Bu component UI render etmez, sadece arka planda çalışır
  return null;
}
