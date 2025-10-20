"use client";
import { useState, useEffect, useMemo } from "react";
import { Clock, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, X } from "lucide-react";
import type { Interval } from "@/types/ohlc";
import { fetchFuturesKlines } from "@/lib/adapters/binance-futures";
import { calculateSwingSignals, multiTimeframeConfirmation, type SwingSignal } from "@/lib/signals/swing-trade-signals";

type TimeframeData = {
  interval: Interval;
  signal: SwingSignal | null;
  strength: number;
  loading: boolean;
};

type Props = {
  symbol: string;
  currentInterval: Interval;
  isMinimized?: boolean;
  onToggle?: () => void;
};

const TIMEFRAME_GROUPS = {
  "4h": { lower: "1h" as Interval, current: "4h" as Interval, higher: "1d" as Interval },
  "1d": { lower: "4h" as Interval, current: "1d" as Interval, higher: "1w" as Interval },
  "1h": { lower: "15m" as Interval, current: "1h" as Interval, higher: "4h" as Interval },
  "15m": { lower: "5m" as Interval, current: "15m" as Interval, higher: "1h" as Interval },
  "1w": { lower: "1d" as Interval, current: "1w" as Interval, higher: "1M" as Interval },
};

export default function MultiTimeframePanel({
  symbol,
  currentInterval,
  isMinimized = false,
  onToggle
}: Props) {
  const [timeframes, setTimeframes] = useState<Record<string, TimeframeData>>({});
  const [isExpanded, setIsExpanded] = useState(true);

  const group = TIMEFRAME_GROUPS[currentInterval as keyof typeof TIMEFRAME_GROUPS] || {
    lower: "1h" as Interval,
    current: currentInterval,
    higher: "1d" as Interval,
  };

  useEffect(() => {
    const intervals = [group.lower, group.current, group.higher];

    intervals.forEach(async (interval) => {
      setTimeframes((prev) => ({
        ...prev,
        [interval]: { interval, signal: null, strength: 0, loading: true },
      }));

      try {
        const candles = await fetchFuturesKlines(symbol, interval, 200);

        // Basit göstergeler hesapla (gerçek uygulamada worker kullan)
        const signals = calculateSwingSignals(candles, {
          // Gerçek göstergeler buraya gelecek - şimdilik basit
        });

        const latestSignal = signals[signals.length - 1];

        setTimeframes((prev) => ({
          ...prev,
          [interval]: {
            interval,
            signal: latestSignal?.signal || null,
            strength: latestSignal?.strength || 0,
            loading: false,
          },
        }));
      } catch (err) {
        console.error(`Failed to fetch ${interval} data:`, err);
        setTimeframes((prev) => ({
          ...prev,
          [interval]: { interval, signal: null, strength: 0, loading: false },
        }));
      }
    });
  }, [symbol, currentInterval, group.lower, group.current, group.higher]);

  const confirmation = useMemo(() => {
    const current = timeframes[group.current]?.signal;
    const higher = timeframes[group.higher]?.signal;
    const lower = timeframes[group.lower]?.signal;

    if (!current) return null;

    return multiTimeframeConfirmation(current, higher || undefined, lower || undefined);
  }, [timeframes, group]);

  if (isMinimized) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-4 bottom-4 z-50 btn bg-bg-card border border-border p-3 shadow-2xl hover:scale-105 transition-transform"
        title="Multi-Timeframe Paneli Göster"
      >
        <Clock className="w-5 h-5 text-accent-yellow" />
        {confirmation && confirmation.confirmed && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent-green rounded-full flex items-center justify-center">
            <span className="text-[10px]">✓</span>
          </div>
        )}
      </button>
    );
  }

  const getSignalColor = (signal: SwingSignal | null) => {
    if (!signal) return "text-white/30";
    if (signal === "GÜÇLÜ AL" || signal === "AL") return "text-accent-green";
    if (signal === "GÜÇLÜ SAT" || signal === "SAT") return "text-accent-red";
    return "text-white/50";
  };

  const getSignalIcon = (signal: SwingSignal | null) => {
    if (!signal) return <Minus className="w-4 h-4" />;
    if (signal === "GÜÇLÜ AL" || signal === "AL") return <TrendingUp className="w-4 h-4" />;
    if (signal === "GÜÇLÜ SAT" || signal === "SAT") return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  return (
    <div className="fixed right-4 bottom-4 z-50 w-80 md:w-96 bg-bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-right">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-bg to-bg-card cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent-yellow" />
          <div>
            <h3 className="font-bold text-sm">🕐 Çoklu Zaman Analizi</h3>
            <div className="text-xs opacity-50 font-mono">{symbol}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggle} className="btn p-1 hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Timeframes */}
          <div className="p-4 space-y-3">
            {[group.higher, group.current, group.lower].map((interval) => {
              const data = timeframes[interval];
              const isCurrent = interval === group.current;

              return (
                <div
                  key={interval}
                  className={`p-3 rounded-lg border transition-all ${
                    isCurrent
                      ? "bg-accent-yellow/10 border-accent-yellow/30"
                      : "bg-white/5 border-border-light hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`font-mono font-bold text-sm ${isCurrent ? "text-accent-yellow" : ""}`}>
                        {interval.toUpperCase()}
                      </div>
                      {isCurrent && (
                        <div className="text-xs bg-accent-yellow/20 text-accent-yellow px-2 py-0.5 rounded">
                          Aktif
                        </div>
                      )}
                    </div>

                    {data?.loading ? (
                      <div className="text-xs opacity-50">Yükleniyor...</div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className={`${getSignalColor(data?.signal || null)}`}>
                          {getSignalIcon(data?.signal || null)}
                        </div>
                        <div className={`font-mono text-sm font-bold ${getSignalColor(data?.signal || null)}`}>
                          {data?.signal || "NÖTR"}
                        </div>
                        {data?.strength !== undefined && (
                          <div className={`text-xs opacity-70 ${getSignalColor(data?.signal || null)}`}>
                            ({data.strength}%)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Confirmation Status */}
          {confirmation && (
            <div className="p-4 border-t border-border">
              <div
                className={`p-4 rounded-xl ${
                  confirmation.confirmed
                    ? confirmation.confidence >= 80
                      ? "bg-accent-green/20 border-2 border-accent-green/30"
                      : "bg-accent-yellow/20 border-2 border-accent-yellow/30"
                    : "bg-accent-red/20 border-2 border-accent-red/30"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-bold">
                    {confirmation.confirmed ? "✅ ONAYLANDI" : "⚠️ UYUMSUZ"}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="text-xs opacity-50">Güven:</div>
                    <div className="font-mono font-bold text-lg">
                      {confirmation.confidence}%
                    </div>
                  </div>
                </div>
                <div className="text-xs opacity-70">
                  {confirmation.explanation}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border bg-white/5 text-center text-xs opacity-50">
            Zaman dilimleri arası korelasyon analizi
          </div>
        </>
      )}
    </div>
  );
}
