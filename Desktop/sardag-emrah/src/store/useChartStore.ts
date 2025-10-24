"use client";
import { create } from "zustand";
import type { Interval } from "@/types/ohlc";
import type { BreakoutAlert } from "@/types/alert";
import type { IndicatorPreset } from "@/types/indicator";
import { notificationManager } from "@/lib/pwa/notifications";

// SADECE FUTURES - Spot kaldırıldı
export type MarketType = "futures";

type State = {
  symbol: string;
  tf: Interval;
  market: MarketType;
  preset: IndicatorPreset;
  dark: boolean;
  alerts: BreakoutAlert[];
  loading: boolean;
  error: string | null;
  setSymbol: (s: string) => void;
  setTF: (tf: Interval) => void;
  setPreset: (preset: IndicatorPreset) => void;
  toggleDark: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  pushAlert: (a: BreakoutAlert) => void;
  clearAlerts: () => void;
};

export const useChartStore = create<State>((set) => ({
  symbol: "BTCUSDT",
  tf: "4h", // Varsayılan 4 saatlik
  market: "futures", // Her zaman futures
  preset: "swing", // 4h için swing trading
  dark: true,
  alerts: [],
  loading: false,
  error: null,
  setSymbol: (s) => set({ symbol: s.toUpperCase(), error: null }),
  setTF: (tf) => set({ tf }),
  // setMarket kaldırıldı - artık değiştirilemez
  setPreset: (preset) => set({ preset }),
  toggleDark: () => set((state) => ({ dark: !state.dark })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  pushAlert: (a) => {
    set((state) => ({ alerts: [a, ...state.alerts].slice(0, 200) }));

    // Send push notification for the alert
    if (typeof window !== 'undefined') {
      const alertTypeLabel = {
        VOL_BREAKOUT: 'Volume Breakout',
        PRICE_SR_BREAK: 'Support/Resistance Break',
        MA_PULLBACK: 'MA Crossover Pullback',
        MULTI_STRATEGY: 'Multi-Strategy Signal',
      }[a.type] || a.type;

      const directionEmoji = a.direction === 'UP' ? '📈' : a.direction === 'DOWN' ? '📉' : '🔔';

      notificationManager.notifySignal({
        symbol: a.symbol,
        type: alertTypeLabel,
        message: a.message,
        strength: typeof a.strength === 'number' ? a.strength :
                 typeof a.strength === 'string' ? parseInt(a.strength) || 7 : 7,
      }).catch((err) => {
        console.error('[Alert] Failed to send notification:', err);
      });
    }
  },
  clearAlerts: () => set({ alerts: [] }),
}));
