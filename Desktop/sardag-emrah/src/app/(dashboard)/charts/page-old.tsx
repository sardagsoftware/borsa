"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Topbar from "@/components/toolbar/Topbar";
import AlertPanel from "@/components/alerts/AlertPanel";
import StatsPanel from "@/components/chart/StatsPanel";
import SignalPanel from "@/components/signals/SignalPanel";
import MultiTimeframePanel from "@/components/signals/MultiTimeframePanel";
import QuickReference from "@/components/ui/QuickReference";
import WatchlistPanel from "@/components/ui/WatchlistPanel";
import PriceAlerts from "@/components/ui/PriceAlerts";
import { useChartStore } from "@/store/useChartStore";
import { usePriceAlertStore } from "@/store/usePriceAlertStore";
import { useCandles } from "@/hooks/useCandles";
import { scanVolumeBreakout } from "@/lib/scan/volume-breakout";
import type { WorkerOut } from "@/types/indicator";
import toast from "react-hot-toast";
import { INDICATOR_PRESETS } from "@/lib/constants/indicator-presets";
import { canShowNotifications, showPriceAlertNotification } from "@/lib/utils/notifications";
import { calculateSupportResistance } from "@/lib/indicators/support-resistance";

const ChartCanvas = dynamic(() => import("@/components/chart/ChartCanvas"), { ssr: false });

export default function ChartsPage() {
  const { symbol, tf, market, preset, dark, pushAlert } = useChartStore();
  const { checkAlerts } = usePriceAlertStore();
  const { candles, loading } = useCandles(symbol, tf, market);
  const [overlays, setOverlays] = useState<Record<string, any[]>>({});
  const [bands, setBands] = useState<Record<string, any[]>>({});
  const [isSignalPanelMinimized, setIsSignalPanelMinimized] = useState(false);
  const [isMtfPanelMinimized, setIsMtfPanelMinimized] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  // Initialize worker only once
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
    try {
      const presetConfig = INDICATOR_PRESETS[preset];
      workerRef.current.postMessage({
        candles,
        overlays: presetConfig.indicators,
        sr: { pivot: true, zigzag: { deviationPct: 5 } },
      });
    } catch (err) {
      console.error("[Worker] Post message failed:", err);
    }
  }, [candles, preset]);

  // Check price alerts when candles update
  useEffect(() => {
    if (candles.length === 0) return;

    const latestCandle = candles[candles.length - 1];
    const currentPrice = latestCandle.close;

    const triggeredAlerts = checkAlerts(symbol, currentPrice);
    triggeredAlerts.forEach((alert) => {
      // Show toast notification
      toast.success(
        `🔔 Fiyat Alarmı: ${symbol} ${alert.condition === 'above' ? 'üstünde' : 'altında'} $${alert.targetPrice.toFixed(2)}`,
        { duration: 5000 }
      );

      // Show browser notification if enabled
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

  // Destek/Direnç seviyelerini hesapla
  const srLevels = useMemo(() => {
    if (candles.length < 50) return [];
    return calculateSupportResistance(candles, 20, 0.002);
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

  // Göstergeleri hazırla (SignalPanel için)
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

  return (
    <div className="h-screen flex flex-col bg-bg overflow-hidden">
      <Topbar onScan={handleScan} />
      <div className="flex-1 overflow-auto p-2 md:p-4">
        <div className="max-w-[1600px] mx-auto">
          <StatsPanel candles={candles} symbol={symbol} interval={tf} />
          <div className="card p-2 md:p-4 mt-4">
            <ChartCanvas candles={candles} bands={bands} overlays={overlays} srLevels={srLevels} dark={dark} loading={loading} />
          </div>
          <div className="mt-4 pb-20 md:pb-4">
            <AlertPanel />
          </div>
          <div className="text-xs opacity-50 text-center mt-4 pb-4">
            Sardag Emrah • Binance Futures ⚡ • Swing Trade Sinyalleri
          </div>
        </div>
      </div>

      {/* Yeni Sinyal Panelleri */}
      <SignalPanel
        candles={candles}
        indicators={indicators}
        symbol={symbol}
        interval={tf}
        isMinimized={isSignalPanelMinimized}
        onToggle={() => setIsSignalPanelMinimized(!isSignalPanelMinimized)}
      />

      <MultiTimeframePanel
        symbol={symbol}
        currentInterval={tf}
        isMinimized={isMtfPanelMinimized}
        onToggle={() => setIsMtfPanelMinimized(!isMtfPanelMinimized)}
      />

      {/* Diğer Paneller */}
      <QuickReference />
      <WatchlistPanel />
      <PriceAlerts />
    </div>
  );
}
