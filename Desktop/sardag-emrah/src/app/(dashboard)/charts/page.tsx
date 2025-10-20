"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useChartStore } from "@/store/useChartStore";
import { usePriceAlertStore } from "@/store/usePriceAlertStore";
import { useCandles } from "@/hooks/useCandles";
import { scanVolumeBreakout } from "@/lib/scan/volume-breakout";
import type { WorkerOut } from "@/types/indicator";
import toast from "react-hot-toast";
import { INDICATOR_PRESETS } from "@/lib/constants/indicator-presets";
import { canShowNotifications, showPriceAlertNotification } from "@/lib/utils/notifications";
import { calculateSupportResistance } from "@/lib/indicators/support-resistance";
import { detectMACrossoverPullback, type MACrossoverSignal } from "@/lib/signals/ma-crossover-pullback";
import MinimalTopbar from "@/components/premium/MinimalTopbar";
import BottomNav from "@/components/premium/BottomNav";
import FloatingActionButton from "@/components/premium/FloatingActionButton";
import DrawerPanel from "@/components/premium/DrawerPanel";
import SignalPanel from "@/components/signals/SignalPanel";
import MultiTimeframePanel from "@/components/signals/MultiTimeframePanel";
import AlertPanel from "@/components/alerts/AlertPanel";
import QuickReference from "@/components/ui/QuickReference";
import WatchlistPanel from "@/components/ui/WatchlistPanel";
import PriceAlerts from "@/components/ui/PriceAlerts";
import MACrossoverScanner from "@/components/scanner/MACrossoverScanner";

const ChartCanvas = dynamic(() => import("@/components/chart/ChartCanvas"), { ssr: false });

type DrawerType = "signals" | "mtf" | "alerts" | "reference" | "watchlist" | "price-alerts" | null;

export default function PremiumChartsPage() {
  const { symbol, tf, market, preset, dark, pushAlert } = useChartStore();
  const { checkAlerts } = usePriceAlertStore();
  const { candles, loading } = useCandles(symbol, tf, market);
  const [overlays, setOverlays] = useState<Record<string, any[]>>({});
  const [bands, setBands] = useState<Record<string, any[]>>({});
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);
  const [isMobile, setIsMobile] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const alertedLevelsRef = useRef<Set<string>>(new Set());
  const lastAlertTimeRef = useRef<number>(0);
  const maCrossoverSignalsRef = useRef<Set<string>>(new Set()); // MA Crossover Pullback sinyalleri tracking

  // Mobil detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Initialize worker
  useEffect(() => {
    try {
      workerRef.current = new Worker(new URL("@/workers/indicator-worker.ts", import.meta.url));
      workerRef.current.onmessage = (ev: MessageEvent<WorkerOut>) => {
        const { overlays, bands, errors } = ev.data || {};
        if (errors?.length) {
          errors.forEach((err) => toast.error(`Indicator error: ${err}`));
        }
        setOverlays(overlays || {});
        setBands(bands || {});
      };
      workerRef.current.onerror = (err) => {
        console.error("[Worker] Error:", err);
      };
    } catch (err) {
      console.error("[Worker] Failed to initialize:", err);
    }
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (candles.length === 0 || !workerRef.current) return;

    // Debounce: Worker'a çok sık mesaj göndermeyi önle
    const timer = setTimeout(() => {
      try {
        const presetConfig = INDICATOR_PRESETS[preset];
        workerRef.current!.postMessage({
          candles,
          overlays: presetConfig.indicators,
          sr: { pivot: true, zigzag: { deviationPct: 5 } },
        });
      } catch (err) {
        console.error("[Worker] Post message failed:", err);
      }
    }, 100); // 100ms debounce

    return () => clearTimeout(timer);
  }, [candles, preset]);

  // Check price alerts
  useEffect(() => {
    if (candles.length === 0) return;
    const latestCandle = candles[candles.length - 1];
    const currentPrice = latestCandle.close;
    const triggeredAlerts = checkAlerts(symbol, currentPrice);
    triggeredAlerts.forEach((alert) => {
      toast.success(
        `🔔 Fiyat Alarmı: ${symbol} ${alert.condition === 'above' ? 'üstünde' : 'altında'} $${alert.targetPrice.toFixed(2)}`,
        { duration: 5000 }
      );
      if (typeof window !== "undefined") {
        const notificationsEnabled = localStorage.getItem("price-alerts-notifications") === "true";
        if (notificationsEnabled && canShowNotifications()) {
          showPriceAlertNotification({
            symbol: alert.symbol,
            targetPrice: alert.targetPrice,
            currentPrice,
            condition: alert.condition as "above" | "below",
          });
        }
      }
    });
  }, [candles, symbol, checkAlerts]);

  const srLevels = useMemo(() => {
    // Chart için S/R hesaplama - sadece chart render için
    // Alert sistemi ayrı çalışıyor (1d verilerle)
    if (candles.length < 50) return [];

    // Son 100 mum yeterli (performans için)
    const recentCandles = candles.slice(-100);
    return calculateSupportResistance(recentCandles, 20, 0.002);
  }, [candles]);

  const handleScan = () => {
    if (candles.length < 50) {
      toast.error("Tarama için yeterli veri yok");
      return;
    }
    try {
      const alerts = scanVolumeBreakout(symbol, tf, candles, 3, 10);
      if (alerts.length === 0) {
        toast("Hacim patlaması tespit edilmedi", { icon: "ℹ️" });
      } else {
        alerts.forEach(pushAlert);
        toast.success(`${alerts.length} adet patlama tespit edildi`);
      }
    } catch (err) {
      toast.error("Tarama başarısız");
    }
  };

  const indicators = useMemo(() => {
    return {
      ema50: overlays["EMA(50)"]?.map((x) => x.value),
      ema200: overlays["EMA(200)"]?.map((x) => x.value),
      rsi: overlays["RSI(14)"]?.map((x) => x.value),
      macd: overlays["MACD"]?.map((x) => ({
        macd: x.macd || 0,
        signal: x.signal || 0,
        histogram: x.histogram || 0,
      })),
      bb: bands["BB(20,2)"]?.map((x) => ({
        upper: x.upper,
        middle: x.basis,
        lower: x.lower,
      })),
    };
  }, [overlays, bands]);

  const toggleDrawer = (drawer: DrawerType) => {
    setActiveDrawer(activeDrawer === drawer ? null : drawer);
  };

  // OTOMATIK HACIM PATLAMASI TESPİTİ - Her 60 saniyede bir (optimize)
  useEffect(() => {
    if (tf !== "4h" || candles.length < 50) return;

    const autoScan = () => {
      try {
        // Son 50 mum yeterli (performans)
        const recentCandles = candles.slice(-50);
        const alerts = scanVolumeBreakout(symbol, tf, recentCandles, 3, 10);

        if (alerts.length > 0) {
          // İlk alert'i ekle (en önemlisi)
          pushAlert(alerts[0]);

          toast.success(`🚨 Hacim patlaması tespit edildi!`, {
            duration: 5000,
            id: `volume-${Date.now()}`, // Duplicate prevention
          });

          // Otomatik alerts drawer'ı aç
          setActiveDrawer("alerts");
        }
      } catch (err) {
        console.error("[Auto Scan] Error:", err);
      }
    };

    // İlk tarama 5 saniye sonra (chart yüklendikten sonra)
    const initialTimer = setTimeout(autoScan, 5000);

    // Her 60 saniyede bir otomatik tarama (30 saniye yerine)
    const interval = setInterval(autoScan, 60000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [candles, symbol, tf, pushAlert]);

  // OTOMATIK MTF DRAWER - Sembol değiştiğinde
  useEffect(() => {
    if (candles.length > 0) {
      // Sembol değiştiğinde otomatik MTF drawer aç
      setActiveDrawer("mtf");

      // 5 saniye sonra otomatik kapat (kullanıcı görsün diye)
      const timer = setTimeout(() => {
        setActiveDrawer(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [symbol]); // Sadece symbol değişince tetiklenir

  // DESTEK/DİRENÇ UYARISI - SADECE 1D İÇİN (Optimize edilmiş)
  useEffect(() => {
    // Sadece yeni candle geldiğinde kontrol et (son candle değişti mi?)
    if (candles.length === 0) return;

    const now = Date.now();
    const lastAlertTime = lastAlertTimeRef.current;

    // Throttle: En fazla 2 dakikada bir kontrol et
    if (now - lastAlertTime < 120000) return;

    // 1D destek/direnç seviyeleri için ayrı hesaplama
    const fetchAndCheckDailySR = async () => {
      try {
        // 1D candles çek (200 mum)
        const response = await fetch(
          `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=1d&limit=200`
        );

        if (!response.ok) return;

        const dailyData = await response.json();
        const dailyCandles = dailyData.map((d: any) => ({
          time: d[0],
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
          volume: parseFloat(d[5]),
        }));

        // 1D destek/direnç hesapla (daha geniş lookback)
        const dailySR = calculateSupportResistance(dailyCandles, 30, 0.01); // 30 periyot, %1 tolerance

        // Sadece GÜÇLÜ seviyeleri al (strength >= 7)
        const strongLevels = dailySR.filter((level) => level.strength >= 7);

        if (strongLevels.length === 0) return;

        const currentPrice = candles[candles.length - 1].close;
        const threshold = currentPrice * 0.01; // %1 yakınlık (1d için daha geniş)

        strongLevels.forEach((level) => {
          const distance = Math.abs(currentPrice - level.price);
          const levelKey = `${level.type}_${level.price.toFixed(0)}`;

          // Eğer bu seviyeden daha önce uyarı verdiyse atla
          if (alertedLevelsRef.current.has(levelKey)) return;

          if (distance <= threshold) {
            const type = level.type === "support" ? "Destek" : "Direnç";

            // SADECE destek için uyarı ver (support only)
            if (level.type === "support") {
              toast(
                `🎯 1D GÜÇLÜ ${type}: $${level.price.toFixed(2)} (Güç: ${level.strength}/10)`,
                {
                  icon: "🟢",
                  duration: 10000, // 10 saniye göster
                  id: levelKey, // Duplicate prevention
                }
              );

              // Bu seviyeden uyarı verildi olarak işaretle
              alertedLevelsRef.current.add(levelKey);

              // 1 saat sonra bu seviyeyi temizle (tekrar uyarı verebilmesi için)
              setTimeout(() => {
                alertedLevelsRef.current.delete(levelKey);
              }, 3600000);
            }
          }
        });

        // Son alert zamanını güncelle
        lastAlertTimeRef.current = now;
      } catch (error) {
        console.error('[1D S/R Alert] Error:', error);
      }
    };

    fetchAndCheckDailySR();
  }, [symbol, candles]);

  // MA CROSSOVER PULLBACK SİNYALİ - TÜM KOİNLER İÇİN (KRİTİK!)
  useEffect(() => {
    // Sadece 4h timeframe için kontrol et
    if (tf !== "4h") return;
    if (candles.length < 100) return; // Minimum 100 mum gerekli

    const checkMACrossoverPullback = () => {
      try {
        // Mevcut coin için sinyal tespit et
        const signal = detectMACrossoverPullback(symbol, tf, candles);

        if (!signal) return;

        // Sinyal daha önce gösterildi mi kontrol et
        const signalKey = `${signal.symbol}_${signal.timestamp}`;
        if (maCrossoverSignalsRef.current.has(signalKey)) return;

        // Sadece güçlü sinyalleri göster (strength >= 5)
        if (signal.strength < 5) return;

        // Sinyal toast notification
        toast.success(
          `🚀 ${signal.symbol} MA7 PULLBACK ENTRY!\n\n` +
          `✅ MA7 x MA25 Golden Cross\n` +
          `✅ ${signal.greenCandlesCount} Yeşil Mum Ardışık\n` +
          `✅ MA7'ye Dokundu (${signal.ma7.toFixed(2)})\n\n` +
          `💪 Sinyal Gücü: ${signal.strength}/10\n` +
          `💰 Fiyat: $${signal.currentPrice.toFixed(2)}`,
          {
            icon: "🎯",
            duration: 15000, // 15 saniye göster (önemli)
            id: signalKey,
            style: {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '14px',
              maxWidth: '500px',
              whiteSpace: 'pre-line',
            }
          }
        );

        // Alerts sistemine de ekle
        pushAlert({
          id: signalKey,
          symbol: signal.symbol,
          tf: signal.timeframe,
          time: signal.timestamp,
          type: 'MA_PULLBACK',
          direction: 'UP', // MA Crossover Pullback is bullish
          price: signal.currentPrice,
          message: signal.message,
          interval: signal.timeframe,
          strength: signal.strength,
          timestamp: signal.timestamp,
        });

        // Sinyal gösterildi olarak işaretle
        maCrossoverSignalsRef.current.add(signalKey);

        // Otomatik signals drawer'ı aç
        setActiveDrawer("signals");

        // 2 saat sonra bu sinyali temizle (tekrar uyarı verebilmesi için)
        setTimeout(() => {
          maCrossoverSignalsRef.current.delete(signalKey);
        }, 7200000); // 2 saat
      } catch (error) {
        console.error('[MA Crossover Pullback] Error:', error);
        // Hata olsa bile sessizce devam et (zero error guarantee)
      }
    };

    // İlk kontrol 3 saniye sonra (chart yüklendikten sonra)
    const initialTimer = setTimeout(checkMACrossoverPullback, 3000);

    // Her 2 dakikada bir kontrol et (performans için)
    const interval = setInterval(checkMACrossoverPullback, 120000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [candles, symbol, tf, pushAlert]);

  // Current price for display
  const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : 0;
  const priceChange = useMemo(() => {
    if (candles.length < 2) return { value: 0, percent: 0 };
    const first = candles[0].close;
    const last = candles[candles.length - 1].close;
    const value = last - first;
    const percent = ((value / first) * 100);
    return { value, percent };
  }, [candles]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-[#0a0e1a] via-[#0f1419] to-[#0a0e1a] overflow-hidden">
      {/* Premium Minimal Topbar */}
      <MinimalTopbar
        symbol={symbol}
        interval={tf}
        price={currentPrice}
        change={priceChange.percent}
        onScan={handleScan}
      />

      {/* Full-screen Chart - No padding, No margins */}
      <div className="flex-1 relative">
        <ChartCanvas
          candles={candles}
          bands={bands}
          overlays={overlays}
          srLevels={srLevels}
          dark={dark}
          loading={loading}
        />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <div className="text-sm opacity-70">Veriler yükleniyor...</div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation (Mobile) */}
      {isMobile && (
        <BottomNav
          activeDrawer={activeDrawer}
          onDrawerToggle={toggleDrawer}
        />
      )}

      {/* Floating Action Button (Desktop) */}
      {!isMobile && (
        <FloatingActionButton
          onAction={(action) => {
            if (action === "scan") handleScan();
            else toggleDrawer(action as DrawerType);
          }}
        />
      )}

      {/* Drawer Panels */}
      <DrawerPanel
        isOpen={activeDrawer === "signals"}
        onClose={() => setActiveDrawer(null)}
        title="📊 Swing Trade Sinyalleri"
        position="left"
      >
        <SignalPanel
          candles={candles}
          indicators={indicators}
          symbol={symbol}
          interval={tf}
          isMinimized={false}
        />
      </DrawerPanel>

      <DrawerPanel
        isOpen={activeDrawer === "mtf"}
        onClose={() => setActiveDrawer(null)}
        title="🕐 Çoklu Zaman Analizi"
        position="right"
      >
        <MultiTimeframePanel
          symbol={symbol}
          currentInterval={tf}
          isMinimized={false}
        />
      </DrawerPanel>

      <DrawerPanel
        isOpen={activeDrawer === "alerts"}
        onClose={() => setActiveDrawer(null)}
        title="⚡ Hacim Alarmları"
        position="right"
      >
        <AlertPanel />
      </DrawerPanel>

      <DrawerPanel
        isOpen={activeDrawer === "reference"}
        onClose={() => setActiveDrawer(null)}
        title="📚 Hızlı Referans"
        position="right"
      >
        <QuickReference />
      </DrawerPanel>

      <DrawerPanel
        isOpen={activeDrawer === "watchlist"}
        onClose={() => setActiveDrawer(null)}
        title="⭐ İzleme Listesi"
        position="left"
      >
        <WatchlistPanel />
      </DrawerPanel>

      <DrawerPanel
        isOpen={activeDrawer === "price-alerts"}
        onClose={() => setActiveDrawer(null)}
        title="🔔 Fiyat Alarmları"
        position="right"
      >
        <PriceAlerts />
      </DrawerPanel>

      {/* MA CROSSOVER PULLBACK BACKGROUND SCANNER - TÜM COİNLER */}
      <MACrossoverScanner
        enabled={true}
        onSignalFound={(signal) => {
          // Sinyal bulunduğunda alerts sistemine ekle
          pushAlert({
            id: `${signal.symbol}_${signal.timestamp}`,
            symbol: signal.symbol,
            tf: signal.timeframe,
            time: signal.timestamp,
            type: 'MA_PULLBACK',
            direction: 'UP', // MA Crossover Pullback is bullish
            price: signal.currentPrice,
            message: signal.message,
            interval: signal.timeframe,
            strength: signal.strength,
            timestamp: signal.timestamp,
          });
        }}
      />
    </div>
  );
}
