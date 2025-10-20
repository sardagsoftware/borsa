"use client";
import { create } from "zustand";
import type { PriceAlert, PriceAlertInput } from "@/types/price-alert";
import { nanoid } from "nanoid";

type State = {
  alerts: PriceAlert[];
  addAlert: (input: PriceAlertInput) => void;
  removeAlert: (id: string) => void;
  triggerAlert: (id: string) => void;
  clearAll: () => void;
  checkAlerts: (symbol: string, currentPrice: number) => PriceAlert[];
};

export const usePriceAlertStore = create<State>((set, get) => ({
  alerts: (() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("price-alerts");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  })(),

  addAlert: (input) => {
    const alert: PriceAlert = {
      ...input,
      id: nanoid(),
      createdAt: Date.now(),
      triggered: false,
    };

    set((state) => {
      const newAlerts = [...state.alerts, alert];
      if (typeof window !== "undefined") {
        localStorage.setItem("price-alerts", JSON.stringify(newAlerts));
      }
      return { alerts: newAlerts };
    });
  },

  removeAlert: (id) => {
    set((state) => {
      const newAlerts = state.alerts.filter((a) => a.id !== id);
      if (typeof window !== "undefined") {
        localStorage.setItem("price-alerts", JSON.stringify(newAlerts));
      }
      return { alerts: newAlerts };
    });
  },

  triggerAlert: (id) => {
    set((state) => {
      const newAlerts = state.alerts.map((a) =>
        a.id === id ? { ...a, triggered: true } : a
      );
      if (typeof window !== "undefined") {
        localStorage.setItem("price-alerts", JSON.stringify(newAlerts));
      }
      return { alerts: newAlerts };
    });
  },

  clearAll: () => {
    set({ alerts: [] });
    if (typeof window !== "undefined") {
      localStorage.removeItem("price-alerts");
    }
  },

  checkAlerts: (symbol, currentPrice) => {
    const { alerts, triggerAlert } = get();
    const triggered: PriceAlert[] = [];

    alerts
      .filter((a) => a.symbol === symbol && !a.triggered)
      .forEach((alert) => {
        let shouldTrigger = false;

        switch (alert.condition) {
          case "above":
            shouldTrigger = currentPrice > alert.targetPrice;
            break;
          case "below":
            shouldTrigger = currentPrice < alert.targetPrice;
            break;
          case "crosses_above":
            // For simplicity, treating as "above" for now
            shouldTrigger = currentPrice > alert.targetPrice;
            break;
          case "crosses_below":
            // For simplicity, treating as "below" for now
            shouldTrigger = currentPrice < alert.targetPrice;
            break;
        }

        if (shouldTrigger) {
          triggerAlert(alert.id);
          triggered.push(alert);
        }
      });

    return triggered;
  },
}));
