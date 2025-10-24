"use client";
import { createChart, LineStyle, Time } from "lightweight-charts";
import { useEffect, useRef } from "react";
import type { Candle } from "@/types/ohlc";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { calculateSwingSignals } from "@/lib/signals/swing-trade-signals";
import type { SRLevel } from "@/lib/indicators/support-resistance";

type Props = {
  candles: Candle[];
  bands?: Record<string, { time: number; upper: number; basis: number; lower: number }[]>;
  overlays?: Record<string, { time: number; value: number }[]>;
  srLevels?: SRLevel[];
  dark?: boolean;
  loading?: boolean;
  showSignals?: boolean;
};

export default function ChartCanvas({ candles, bands, overlays, srLevels, dark = true, loading = false, showSignals = true }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: dark ? "#0B0F14" : "#ffffff" },
        textColor: dark ? "#d1d5db" : "#111827",
      },
      grid: {
        vertLines: { color: dark ? "#1f2937" : "#e5e7eb" },
        horzLines: { color: dark ? "#1f2937" : "#e5e7eb" },
      },
      rightPriceScale: { borderColor: dark ? "#374151" : "#d1d5db" },
      timeScale: { borderColor: dark ? "#374151" : "#d1d5db", timeVisible: true },
      crosshair: {
        vertLine: { color: dark ? "#6b7280" : "#9ca3af", style: LineStyle.Dashed },
        horzLine: { color: dark ? "#6b7280" : "#9ca3af", style: LineStyle.Dashed },
      },
      autoSize: true,
    });

    const priceSeries = chart.addCandlestickSeries({
      upColor: "#10b981",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    priceSeries.setData(
      candles.map((c) => ({
        time: (c.time / 1000) as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    // SWING TRADE SİNYALLERİ
    if (showSignals && overlays) {
      const ema50Data = overlays["EMA(50)"];
      const ema200Data = overlays["EMA(200)"];
      const rsiData = overlays["RSI(14)"];
      const macdData = overlays["MACD"] as any; // MACD has different structure
      const bbData = bands?.["BB(20,2)"];

      // Göstergeleri hazırla
      const indicators = {
        ema50: ema50Data?.map((x) => x.value),
        ema200: ema200Data?.map((x) => x.value),
        rsi: rsiData?.map((x) => x.value),
        macd: macdData?.map((x: any) => ({
          macd: x.macd || 0,
          signal: x.signal || 0,
          histogram: x.histogram || 0,
        })),
        bb: bbData?.map((x) => ({
          upper: x.upper,
          middle: x.basis,
          lower: x.lower,
        })),
      };

      const candlesWithSignals = calculateSwingSignals(candles, indicators);

      // Sadece güçlü sinyalleri göster (karmaşayı önlemek için)
      const markers = candlesWithSignals
        .map((c) => {
          if (c.signal === "GÜÇLÜ AL") {
            return {
              time: (c.time / 1000) as Time,
              position: "belowBar" as const,
              color: "#10b981",
              shape: "arrowUp" as const,
              text: `🚀 ${c.strength}%`,
              size: 2,
            };
          } else if (c.signal === "AL") {
            return {
              time: (c.time / 1000) as Time,
              position: "belowBar" as const,
              color: "#34d399",
              shape: "arrowUp" as const,
              text: "✅",
              size: 1,
            };
          } else if (c.signal === "GÜÇLÜ SAT") {
            return {
              time: (c.time / 1000) as Time,
              position: "aboveBar" as const,
              color: "#ef4444",
              shape: "arrowDown" as const,
              text: `📉 ${c.strength}%`,
              size: 2,
            };
          } else if (c.signal === "SAT") {
            return {
              time: (c.time / 1000) as Time,
              position: "aboveBar" as const,
              color: "#f87171",
              shape: "arrowDown" as const,
              text: "⚠️",
              size: 1,
            };
          }
          return null;
        })
        .filter((m) => m !== null);

      if (markers.length > 0) {
        priceSeries.setMarkers(markers as any);
      }
    }

    if (bands) {
      Object.entries(bands).forEach(([, arr]) => {
        const upper = chart.addLineSeries({ color: "#3b82f6", lineWidth: 1 });
        const basis = chart.addLineSeries({ color: "#6b7280", lineWidth: 1, lineStyle: LineStyle.Dotted });
        const lower = chart.addLineSeries({ color: "#3b82f6", lineWidth: 1 });
        upper.setData(arr.map((x) => ({ time: (x.time / 1000) as Time, value: x.upper })));
        basis.setData(arr.map((x) => ({ time: (x.time / 1000) as Time, value: x.basis })));
        lower.setData(arr.map((x) => ({ time: (x.time / 1000) as Time, value: x.lower })));
      });
    }

    if (overlays) {
      Object.entries(overlays).forEach(([, arr]) => {
        const series = chart.addLineSeries({ lineWidth: 2 });
        series.setData(
          arr.filter((x) => Number.isFinite(x.value)).map((x) => ({ time: (x.time / 1000) as Time, value: x.value }))
        );
      });
    }

    // Destek/Direnç seviyelerini çiz
    if (srLevels && srLevels.length > 0 && candles.length > 0) {
      const firstTime = candles[0].time / 1000;
      const lastTime = candles[candles.length - 1].time / 1000;

      srLevels.forEach((level) => {
        const color = level.type === "support" ? "#10b981" : "#ef4444";
        const lineWidth = Math.min(level.strength, 3) as any;
        const lineStyle = level.strength >= 4 ? LineStyle.Solid : LineStyle.Dashed;

        const srLine = chart.addLineSeries({
          color,
          lineWidth,
          lineStyle,
          priceLineVisible: false,
          lastValueVisible: true,
          title: `${level.type.toUpperCase()} ${level.price.toFixed(2)}`
        });

        // Yatay çizgi oluştur
        srLine.setData([
          { time: firstTime as Time, value: level.price },
          { time: lastTime as Time, value: level.price }
        ]);
      });
    }

    const ro = new ResizeObserver(() => chart.applyOptions({ autoSize: true }));
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [candles, dark, bands, overlays, srLevels, showSignals]);

  return (
    <div className="relative w-full h-[70vh] rounded-xl border border-border overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/50 z-10 backdrop-blur-sm">
          <LoadingSpinner size="lg" />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
