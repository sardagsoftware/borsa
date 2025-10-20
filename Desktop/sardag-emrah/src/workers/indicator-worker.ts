import type { WorkerIn, WorkerOut } from "@/types/indicator";
import { SMA, EMA, RSI, Bollinger, VWAP } from "@/lib/core/ta";
import { pivotsClassic, zigzag } from "@/lib/core/sr";

self.onmessage = (e: MessageEvent<WorkerIn>) => {
  try {
    const { candles, overlays, sr } = e.data;
    const closes = candles.map((c) => c.close);
    const out: WorkerOut = { overlays: {}, bands: {}, sr: {} };

    for (const ind of overlays) {
      if (ind.type === "SMA") {
        const values = SMA(closes, ind.length);
        out.overlays[`SMA(${ind.length})`] = values.map((value, i) => ({
          time: candles[i].time,
          value,
        }));
      }
      if (ind.type === "EMA") {
        const values = EMA(closes, ind.length);
        out.overlays[`EMA(${ind.length})`] = values.map((value, i) => ({
          time: candles[i].time,
          value,
        }));
      }
      if (ind.type === "RSI") {
        const values = RSI(closes, ind.length);
        out.overlays[`RSI(${ind.length})`] = values.map((value, i) => ({
          time: candles[i].time,
          value,
        }));
      }
      if (ind.type === "VWAP") {
        const values = VWAP(candles);
        out.overlays["VWAP"] = values.map((value, i) => ({
          time: candles[i].time,
          value,
        }));
      }
      if (ind.type === "BB") {
        const bb = Bollinger(closes, ind.length, ind.mult);
        out.bands[`BB(${ind.length},${ind.mult})`] = bb.map((b, i) => ({
          time: candles[i].time,
          upper: b.upper,
          basis: b.basis,
          lower: b.lower,
        }));
      }
    }

    if (sr?.pivot) {
      out.sr.pivots = pivotsClassic(candles);
    }
    if (sr?.zigzag) {
      out.sr.zigzag = zigzag(candles, sr.zigzag.deviationPct);
    }

    // @ts-ignore
    postMessage(out);
  } catch (err) {
    // @ts-ignore
    postMessage({
      overlays: {},
      bands: {},
      sr: {},
      errors: [err instanceof Error ? err.message : String(err)],
    });
  }
};

export {};
