"use client";
import { useMemo } from "react";
import type { Candle } from "@/types/ohlc";
import { formatPrice, formatVolume, formatPercent } from "@/lib/utils/format";
import { calculatePriceChange, calculateHigh24h, calculateLow24h } from "@/lib/core/ohlc";
import { TrendingUp, TrendingDown } from "lucide-react";

type Props = {
  candles: Candle[];
  symbol: string;
  interval: string;
};

export default function StatsPanel({ candles, symbol, interval }: Props) {
  const stats = useMemo(() => {
    if (candles.length === 0) {
      return { lastPrice: 0, change: 0, changePercent: 0, high24h: 0, low24h: 0, volume24h: 0 };
    }
    const lastCandle = candles[candles.length - 1];
    const { change, changePercent } = calculatePriceChange(candles);
    const high24h = calculateHigh24h(candles);
    const low24h = calculateLow24h(candles);
    const volume24h = candles.reduce((sum, c) => sum + c.volume, 0);
    return { lastPrice: lastCandle.close, change, changePercent, high24h, low24h, volume24h };
  }, [candles]);

  const isPositive = stats.change >= 0;

  if (candles.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-lg opacity-50 mb-2">Yükleniyor...</div>
            <div className="text-sm opacity-30">Binance'ten canlı veri çekiliyor</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold font-mono">{symbol}</h2>
            <span className="text-sm opacity-40 bg-white/5 px-2 py-1 rounded">{interval}</span>
          </div>
          <div className="grid grid-cols-3 gap-6 mt-4 text-sm">
            <div>
              <div className="text-xs opacity-40 mb-1">24s Yüksek</div>
              <div className="font-mono font-medium text-accent-green">{formatPrice(stats.high24h)}</div>
            </div>
            <div>
              <div className="text-xs opacity-40 mb-1">24s Düşük</div>
              <div className="font-mono font-medium text-accent-red">{formatPrice(stats.low24h)}</div>
            </div>
            <div>
              <div className="text-xs opacity-40 mb-1">Hacim</div>
              <div className="font-mono font-medium opacity-70">{formatVolume(stats.volume24h)}</div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-5xl font-mono font-bold mb-2">${formatPrice(stats.lastPrice)}</div>
          <div className={`text-xl font-medium flex items-center gap-2 justify-end ${isPositive ? "text-accent-green" : "text-accent-red"}`}>
            {isPositive ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
            <span>
              {formatPercent(stats.changePercent)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
