export type OverlaySeriesPoint = {
  time: number;
  value: number;
};

export type BandPoint = {
  time: number;
  upper: number;
  basis: number;
  lower: number;
};

export type IndicatorRequest =
  | { type: "SMA"; length: number }
  | { type: "EMA"; length: number }
  | { type: "RSI"; length: number }
  | { type: "BB"; length: number; mult: number }
  | { type: "MACD"; fast: number; slow: number; signal: number }
  | { type: "VWAP" };

export type SRConfig = {
  pivot: boolean;
  zigzag?: { deviationPct: number };
};

export type WorkerIn = {
  candles: import("./ohlc").Candle[];
  overlays: IndicatorRequest[];
  sr: SRConfig;
};

export type WorkerOut = {
  overlays: Record<string, OverlaySeriesPoint[]>;
  bands: Record<string, BandPoint[]>;
  sr: {
    pivots?: number[];
    zigzag?: { time: number; value: number }[];
  };
  errors?: string[];
};

export type IndicatorPreset = "scalping" | "daytrading" | "swing" | "bollinger";

export type PresetConfig = {
  name: string;
  description: string;
  indicators: IndicatorRequest[];
};
