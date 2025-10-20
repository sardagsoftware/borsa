"use client";
import { useChartStore } from "@/store/useChartStore";
import type { Interval } from "@/types/ohlc";
import type { IndicatorPreset } from "@/types/indicator";
import { Moon, Sun, ScanLine, TrendingUp, Activity, BarChart3, Waves } from "lucide-react";
import toast from "react-hot-toast";
import SymbolSearch from "@/components/ui/SymbolSearch";
import { INDICATOR_PRESETS } from "@/lib/constants/indicator-presets";

const INTERVALS: Interval[] = ["1m", "5m", "15m", "1h", "4h", "1d", "1w"];

const PRESET_ICONS: Record<IndicatorPreset, React.ReactNode> = {
  scalping: <Activity className="w-3 h-3" />,
  daytrading: <TrendingUp className="w-3 h-3" />,
  swing: <BarChart3 className="w-3 h-3" />,
  bollinger: <Waves className="w-3 h-3" />,
};

export default function Topbar({ onScan }: { onScan: () => void }) {
  const { symbol, tf, preset, dark, setSymbol, setTF, setPreset, toggleDark } = useChartStore();

  const handleSymbolChange = (newSymbol: string) => {
    if (!newSymbol) return;
    setSymbol(newSymbol);
    toast.success(`${newSymbol} yüklendi`);
  };

  const handlePresetChange = (newPreset: IndicatorPreset) => {
    setPreset(newPreset);
    const config = INDICATOR_PRESETS[newPreset];
    toast.success(`${config.name} stratejisi yüklendi`);
  };

  return (
    <div className="p-3 border-b border-border bg-bg-card">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Search and Controls */}
        <div className="row gap-3">
          <SymbolSearch value={symbol} onChange={handleSymbolChange} />

          <select className="select text-sm" value={tf} onChange={(e) => setTF(e.target.value as Interval)}>
            {INTERVALS.map((interval) => (
              <option key={interval} value={interval}>
                {interval}
              </option>
            ))}
          </select>

          {/* Compact Indicator Presets */}
          <select
            className="select text-sm min-w-[140px]"
            value={preset}
            onChange={(e) => handlePresetChange(e.target.value as IndicatorPreset)}
          >
            {(Object.keys(INDICATOR_PRESETS) as IndicatorPreset[]).map((p) => {
              const config = INDICATOR_PRESETS[p];
              return (
                <option key={p} value={p}>
                  {config.name}
                </option>
              );
            })}
          </select>

          <button className="btn btn-success text-sm" onClick={onScan}>
            <ScanLine className="w-4 h-4" />
            <span className="ml-1.5">Tara</span>
          </button>
        </div>

        {/* Right: Dark mode toggle */}
        <button className="btn" onClick={toggleDark} title="Karanlık/Aydınlık mod">
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
