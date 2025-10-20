"use client";
import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, X } from "lucide-react";
import type { Candle } from "@/types/ohlc";
import { calculateSwingSignals, type SwingSignal } from "@/lib/signals/swing-trade-signals";
import { formatDate } from "@/lib/utils/format";

type Props = {
  candles: Candle[];
  indicators: {
    ema50?: number[];
    ema200?: number[];
    macd?: { macd: number; signal: number; histogram: number }[];
    rsi?: number[];
    bb?: { upper: number; middle: number; lower: number }[];
  };
  symbol: string;
  interval: string;
  isMinimized?: boolean;
  onToggle?: () => void;
};

export default function SignalPanel({
  candles,
  indicators,
  symbol,
  interval,
  isMinimized = false,
  onToggle
}: Props) {
  const latestSignal = useMemo(() => {
    if (candles.length === 0) return null;

    const signals = calculateSwingSignals(candles, indicators);
    return signals[signals.length - 1];
  }, [candles, indicators]);

  if (isMinimized) {
    return (
      <button
        onClick={onToggle}
        className="fixed left-4 bottom-4 z-50 btn bg-bg-card border border-border p-3 shadow-2xl hover:scale-105 transition-transform"
        title="Sinyal Panelini Göster"
      >
        {latestSignal?.signal === "GÜÇLÜ AL" && <span className="text-2xl">🚀</span>}
        {latestSignal?.signal === "AL" && <span className="text-2xl">✅</span>}
        {latestSignal?.signal === "NÖTR" && <span className="text-2xl">⚪</span>}
        {latestSignal?.signal === "SAT" && <span className="text-2xl">⚠️</span>}
        {latestSignal?.signal === "GÜÇLÜ SAT" && <span className="text-2xl">📉</span>}
      </button>
    );
  }

  if (!latestSignal) {
    return (
      <div className="fixed left-4 bottom-4 z-50 w-80 md:w-96 bg-bg-card border border-border rounded-xl shadow-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">📊 Sinyal Analizi</h3>
          <button onClick={onToggle} className="btn p-1 hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="text-xs opacity-50 text-center py-8">
          Yeterli veri yok. Lütfen bekleyin...
        </div>
      </div>
    );
  }

  const signalColor = {
    "GÜÇLÜ AL": "text-accent-green",
    "AL": "text-accent-green",
    "NÖTR": "text-white opacity-70",
    "SAT": "text-accent-red",
    "GÜÇLÜ SAT": "text-accent-red",
  }[latestSignal.signal];

  const signalBg = {
    "GÜÇLÜ AL": "bg-accent-green/20",
    "AL": "bg-accent-green/10",
    "NÖTR": "bg-white/5",
    "SAT": "bg-accent-red/10",
    "GÜÇLÜ SAT": "bg-accent-red/20",
  }[latestSignal.signal];

  const signalIcon = {
    "GÜÇLÜ AL": <TrendingUp className="w-6 h-6" />,
    "AL": <TrendingUp className="w-5 h-5" />,
    "NÖTR": <Minus className="w-5 h-5" />,
    "SAT": <TrendingDown className="w-5 h-5" />,
    "GÜÇLÜ SAT": <TrendingDown className="w-6 h-6" />,
  }[latestSignal.signal];

  return (
    <div className="fixed left-4 bottom-4 z-50 w-80 md:w-96 bg-bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-left">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-bg-card to-bg">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${signalBg}`}>
            <div className={signalColor}>
              {signalIcon}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-sm">📊 Güncel Sinyal</h3>
            <div className="text-xs opacity-50 font-mono">{symbol} • {interval}</div>
          </div>
        </div>
        <button onClick={onToggle} className="btn p-1 hover:bg-white/10">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Signal Display */}
      <div className="p-4">
        <div className={`flex items-center justify-between p-4 rounded-xl ${signalBg} mb-4`}>
          <div>
            <div className={`text-2xl font-bold ${signalColor}`}>
              {latestSignal.signal}
            </div>
            <div className="text-xs opacity-50 mt-1">
              {formatDate(latestSignal.time)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs opacity-50">Güç</div>
            <div className={`text-3xl font-bold font-mono ${signalColor}`}>
              {latestSignal.strength}%
            </div>
          </div>
        </div>

        {/* Signal Reasons */}
        {latestSignal.reasons.length > 0 && (
          <div>
            <div className="text-xs font-medium opacity-70 mb-2">
              📋 Sinyal Nedenleri ({latestSignal.reasons.length})
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {latestSignal.reasons.map((reason, idx) => (
                <div
                  key={idx}
                  className="text-xs bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors border border-border-light"
                >
                  {reason}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price Info */}
        <div className="mt-4 p-3 bg-white/5 rounded-lg border border-border-light">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xs opacity-50 mb-1">Açılış</div>
              <div className="font-mono text-xs font-medium">
                ${latestSignal.open.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs opacity-50 mb-1">Kapanış</div>
              <div className="font-mono text-xs font-bold text-accent-yellow">
                ${latestSignal.close.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs opacity-50 mb-1">Hacim</div>
              <div className="font-mono text-xs font-medium">
                {latestSignal.volume > 1000000
                  ? `${(latestSignal.volume / 1000000).toFixed(1)}M`
                  : `${(latestSignal.volume / 1000).toFixed(0)}K`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border bg-white/5 text-center text-xs opacity-50">
        Gerçek zamanlı swing trade analizi
      </div>
    </div>
  );
}
