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
  initialRegime?: Regime;
  config?: Partial<RegimeConfig>;
  debug?: boolean;
}

export function RegimeProvider({ 
  children, 
  initialRegime = 'calm',
  config: initialConfig = {},
  debug = false 
}: RegimeProviderProps) {
  const [regime, setRegimeState] = useState<Regime>(initialRegime);
  const [metrics, setMetrics] = useState<MarketMetrics | null>(null);
  const [config, setConfigState] = useState<RegimeConfig>({ ...DEFAULT_CONFIG, ...initialConfig });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [history, setHistory] = useState<Array<{ regime: Regime; timestamp: number; metrics: MarketMetrics }>>([]);

  // Calculate regime based on metrics
  const calculateRegime = useCallback((metrics: MarketMetrics): Regime => {
    const { volatility, spread, volume, sentiment } = metrics;
    const { volatilityThreshold, spreadThreshold, combinedWeight } = config;

    // Calculate weighted score
    const score = (
      volatility * combinedWeight.volatility +
      spread * combinedWeight.spread +
      volume * combinedWeight.volume +
      Math.abs(sentiment) * combinedWeight.sentiment
    );

    // Determine regime based on thresholds
    if (score >= Math.max(volatilityThreshold.shock, spreadThreshold.shock)) {
      return 'shock';
    } else if (score >= Math.max(volatilityThreshold.elevated, spreadThreshold.elevated)) {
      return 'elevated';
    } else {
      return 'calm';
    }
  }, [config]);

  // Apply regime to DOM
  const applyRegimeToDom = useCallback((newRegime: Regime) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-regime', newRegime);
      
      if (debug) {
        console.log(`🎨 Regime changed to: ${newRegime}`);
      }
    }
  }, [debug]);

  // Set regime with transition handling
  const setRegime = useCallback((newRegime: Regime) => {
    if (newRegime === regime) return;

    setIsTransitioning(true);
    setRegimeState(newRegime);
    applyRegimeToDom(newRegime);

    // Add to history
    if (metrics) {
      setHistory(prev => [
        ...prev.slice(-9), // Keep last 10 entries
        { regime: newRegime, timestamp: Date.now(), metrics }
      ]);
    }

    // Clear transition state after animation
    setTimeout(() => setIsTransitioning(false), 300);
  }, [regime, metrics, applyRegimeToDom]);

  // Update metrics and recalculate regime
  const updateMetrics = useCallback((newMetrics: MarketMetrics) => {
    setMetrics(newMetrics);
    const calculatedRegime = calculateRegime(newMetrics);
    setRegime(calculatedRegime);
  }, [calculateRegime, setRegime]);

  // Update config
  const setConfig = useCallback((newConfig: Partial<RegimeConfig>) => {
    setConfigState(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Initialize DOM on mount
  useEffect(() => {
    applyRegimeToDom(regime);
  }, [regime, applyRegimeToDom]);

  // Debug mode - expose to window
  useEffect(() => {
    if (debug && typeof window !== 'undefined') {
      (window as any).regimeDebug = {
        regime,
        metrics,
        config,
        history,
        setRegime,
        updateMetrics,
        setConfig,
        logCurrentState: () => {
          console.log('🎨 Current Regime State:', {
            regime,
            metrics,
            config,
            history: history.slice(-3),
          });
        },
        simulateVolatility: (vol: number) => {
          updateMetrics({
            volatility: vol,
            spread: 0.3,
            volume: 0.5,
            liquidity: 0.7,
            sentiment: 0.1,
          });
        },
        forceRegime: setRegime,
      };
    }
  }, [debug, regime, metrics, config, history, setRegime, updateMetrics, setConfig]);

  const contextValue: RegimeContextValue = {
    regime,
    metrics,
    config,
    setRegime,
    updateMetrics,
    setConfig,
    isTransitioning,
    history,
  };

  return (
    <RegimeContext.Provider value={contextValue}>
      {children}
    </RegimeContext.Provider>
  );
}

// Hook to use regime context
export function useRegime() {
  const context = useContext(RegimeContext);
  if (!context) {
    throw new Error('useRegime must be used within a RegimeProvider');
  }
  return context;
}

// Hook for regime-aware styling
export function useRegimeStyles() {
  const { regime, isTransitioning } = useRegime();

  const getRegimeClass = useCallback((baseClass: string = '') => {
    const regimeClass = `regime-${regime}`;
    const transitionClass = isTransitioning ? 'regime-transitioning' : '';
    return [baseClass, regimeClass, transitionClass].filter(Boolean).join(' ');
  }, [regime, isTransitioning]);

  const getRegimeColors = useCallback(() => {
    switch (regime) {
      case 'shock':
        return {
          bg: '#0A0A0D',
          panel: '#0D121B',
          brand1: '#49C6B5',
          accent1: '#FFD166',
        };
      case 'elevated':
        return {
          bg: '#0A0E15',
          panel: '#0E1420',
          brand1: '#58DAC9',
          accent1: '#E6FF63',
        };
      case 'calm':
      default:
        return {
          bg: '#0B1016',
          panel: '#111926',
          brand1: '#68E7D7',
          accent1: '#C7FF5A',
        };
    }
  }, [regime]);

  return {
    regime,
    isTransitioning,
    getRegimeClass,
    getRegimeColors,
  };
}

// Utility functions
export function setRegimeGlobal(regime: Regime) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-regime', regime);
  }
}

export function getRegimeFromMetrics(metrics: MarketMetrics, config = DEFAULT_CONFIG): Regime {
  const { volatility, spread, volume, sentiment } = metrics;
  const { volatilityThreshold, spreadThreshold, combinedWeight } = config;

  const score = (
    volatility * combinedWeight.volatility +
    spread * combinedWeight.spread +
    volume * combinedWeight.volume +
    Math.abs(sentiment) * combinedWeight.sentiment
  );

  if (score >= Math.max(volatilityThreshold.shock, spreadThreshold.shock)) {
    return 'shock';
  } else if (score >= Math.max(volatilityThreshold.elevated, spreadThreshold.elevated)) {
    return 'elevated';
  } else {
    return 'calm';
  }
}

// Component for regime indicator
export function RegimeIndicator({ className = '' }: { className?: string }) {
  const { regime, metrics, isTransitioning } = useRegime();

  const getRegimeInfo = () => {
    switch (regime) {
      case 'shock':
        return { 
          label: 'High Volatility', 
          color: 'text-warn',
          bg: 'bg-warn/20',
          icon: '⚡'
        };
      case 'elevated':
        return { 
          label: 'Elevated Risk', 
          color: 'text-accent1',
          bg: 'bg-accent1/20',
          icon: '📈'
        };
      case 'calm':
      default:
        return { 
          label: 'Normal Conditions', 
          color: 'text-brand1',
          bg: 'bg-brand1/20',
          icon: '🌊'
        };
    }
  };

  const info = getRegimeInfo();

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${info.bg} transition-all duration-300 ${className}`}>
      <span className="text-sm">{info.icon}</span>
      <span className={`text-xs font-medium ${info.color}`}>
        {info.label}
      </span>
      {isTransitioning && (
        <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
      )}
    </div>
  );
}

export { RegimeContext };
