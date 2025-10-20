import type { IndicatorPreset, PresetConfig } from "@/types/indicator";

export const INDICATOR_PRESETS: Record<IndicatorPreset, PresetConfig> = {
  scalping: {
    name: "Scalping",
    description: "Fast EMA + RSI for quick trades",
    indicators: [
      { type: "EMA", length: 9 },
      { type: "EMA", length: 21 },
      { type: "RSI", length: 7 },
    ],
  },
  daytrading: {
    name: "Day Trading",
    description: "Classic SMA + momentum",
    indicators: [
      { type: "SMA", length: 20 },
      { type: "SMA", length: 50 },
      { type: "SMA", length: 200 },
      { type: "RSI", length: 14 },
    ],
  },
  swing: {
    name: "Swing Trading",
    description: "Profesyonel swing trade için optimize edilmiş - Golden Cross, MACD, RSI divergence",
    indicators: [
      { type: "EMA", length: 50 },
      { type: "EMA", length: 200 },
      { type: "MACD", fast: 12, slow: 26, signal: 9 },
      { type: "RSI", length: 14 },
      { type: "BB", length: 20, mult: 2 },
      { type: "VWAP" },
    ],
  },
  bollinger: {
    name: "Bollinger",
    description: "Volatility bands + VWAP",
    indicators: [
      { type: "BB", length: 20, mult: 2 },
      { type: "VWAP" },
      { type: "RSI", length: 14 },
    ],
  },
};
