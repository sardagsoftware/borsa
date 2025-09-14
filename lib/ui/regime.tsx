'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

export type Regime = 'calm' | 'elevated' | 'shock';

export interface MarketMetrics {
  volatility: number;    // 0-1 normalized
  spread: number;        // 0-1 normalized
  volume: number;        // 0-1 normalized
  liquidity: number;     // 0-1 normalized
  sentiment: number;     // -1 to 1
}

export interface RegimeConfig {
  volatilityThreshold: {
    elevated: number;
    shock: number;
  };
  spreadThreshold: {
    elevated: number;
    shock: number;
  };
  combinedWeight: {
    volatility: number;
    spread: number;
    volume: number;
    sentiment: number;
  };
}

const DEFAULT_CONFIG: RegimeConfig = {
  volatilityThreshold: {
    elevated: 0.33,
    shock: 0.66,
  },
  spreadThreshold: {
    elevated: 0.33,
    shock: 0.66,
  },
  combinedWeight: {
    volatility: 0.4,
    spread: 0.3,
    volume: 0.2,
    sentiment: 0.1,
  },
};

interface RegimeContextValue {
  regime: Regime;
  metrics: MarketMetrics | null;
  config: RegimeConfig;
  setRegime: (regime: Regime) => void;
  updateMetrics: (metrics: MarketMetrics) => void;
  setConfig: (config: Partial<RegimeConfig>) => void;
  isTransitioning: boolean;
  history: Array<{ regime: Regime; timestamp: number; metrics: MarketMetrics }>;
}

const RegimeContext = createContext<RegimeContextValue | null>(null);

interface RegimeProviderProps {
  children: ReactNode;
}

export function RegimeProvider({ children }: RegimeProviderProps) {
  const [regime, setRegime] = useState<Regime>('calm');
  const [metrics, setMetrics] = useState<MarketMetrics | null>(null);
  const [config, setConfig] = useState<RegimeConfig>(DEFAULT_CONFIG);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [history, setHistory] = useState<Array<{ regime: Regime; timestamp: number; metrics: MarketMetrics }>>([]);

  const updateMetrics = useCallback((newMetrics: MarketMetrics) => {
    setMetrics(newMetrics);
    setHistory(prev => [...prev.slice(-49), { regime, timestamp: Date.now(), metrics: newMetrics }]);
  }, [regime]);

  const handleSetConfig = useCallback((newConfig: Partial<RegimeConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  return (
    <RegimeContext.Provider value={{
      regime,
      metrics,
      config,
      setRegime,
      updateMetrics,
      setConfig: handleSetConfig,
      isTransitioning,
      history,
    }}>
      {children}
    </RegimeContext.Provider>
  );
}

export function useRegime() {
  const context = useContext(RegimeContext);
  if (!context) {
    throw new Error('useRegime must be used within a RegimeProvider');
  }
  return context;
}

export { RegimeContext };
