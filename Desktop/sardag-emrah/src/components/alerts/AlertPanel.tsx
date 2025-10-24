"use client";
import { useChartStore } from "@/store/useChartStore";
import { formatDate } from "@/lib/utils/format";
import { TrendingUp, TrendingDown, AlertTriangle, Zap } from "lucide-react";
import { useMemo } from "react";

export default function AlertPanel() {
  const { alerts, clearAlerts, setSymbol } = useChartStore();

  // Benzersiz coin isimlerini çıkar
  const uniqueCoins = useMemo(() => {
    const coins = new Set(alerts.map(a => a.symbol));
    return Array.from(coins).slice(0, 10); // İlk 10 coin
  }, [alerts]);

  if (alerts.length === 0) {
    return (
      <div className="card p-4 mt-4">
        <div className="flex items-center gap-2 text-sm opacity-70 mb-3">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium">Uyarılar</span>
        </div>
        <div className="text-xs opacity-50 text-center py-8">
          Henüz uyarı yok. Patlamaları tespit etmek için hacim taraması yapın.
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm opacity-70">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium">Uyarılar ({alerts.length})</span>
        </div>
        <button className="text-xs text-accent-red hover:underline" onClick={clearAlerts}>
          Tümünü Temizle
        </button>
      </div>

      {/* Aktif Coinler - Otomatik Görünür */}
      {uniqueCoins.length > 0 && (
        <div className="mb-4 pb-4 border-b border-border">
          <div className="text-xs opacity-50 mb-2 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Alarm Olan Coinler ({uniqueCoins.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {uniqueCoins.map((coin) => {
              const coinAlerts = alerts.filter(a => a.symbol === coin);
              const upCount = coinAlerts.filter(a => a.direction === "UP").length;
              const downCount = coinAlerts.filter(a => a.direction === "DOWN").length;

              return (
                <button
                  key={coin}
                  onClick={() => setSymbol(coin)}
                  className="group relative px-3 py-1.5 bg-accent-yellow/20 hover:bg-accent-yellow/30 border border-accent-yellow/40 rounded-lg transition-all hover:scale-105"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-sm text-accent-yellow">{coin}</span>
                    <div className="flex items-center gap-1 text-xs">
                      {upCount > 0 && (
                        <span className="text-accent-green">↑{upCount}</span>
                      )}
                      {downCount > 0 && (
                        <span className="text-accent-red">↓{downCount}</span>
                      )}
                    </div>
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent-red rounded-full text-[10px] flex items-center justify-center font-bold text-white">
                    {coinAlerts.length}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-auto pr-1">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="bg-white/5 rounded-lg p-3 border border-border hover:border-border-light transition-all"
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg ${
                  alert.direction === "UP" ? "bg-accent-green/20 text-accent-green" : "bg-accent-red/20 text-accent-red"
                }`}
              >
                {alert.direction === "UP" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-sm">{alert.symbol}</span>
                  <span className="text-xs opacity-50">•</span>
                  <span className="text-xs opacity-70">{alert.tf}</span>
                  <span className="text-xs opacity-50">•</span>
                  <span className="text-xs opacity-70">{formatDate(alert.time)}</span>
                </div>

                <div className="text-xs opacity-70 mb-2">{alert.message}</div>

                <div className="flex items-center gap-3 text-xs">
                  <div>
                    <span className="opacity-50">Fiyat:</span> <span className="font-mono">{alert.price.toFixed(4)}</span>
                  </div>
                  {alert.zScore !== undefined && (
                    <div>
                      <span className="opacity-50">Z-Skoru:</span> <span className="font-mono">{alert.zScore}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
