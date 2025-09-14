'use client';

import { useState, useEffect } from 'react';

export type MarketRegime = 'bull' | 'bear' | 'sideways' | 'volatile';

export interface RegimeData {
  regime: MarketRegime;
  confidence: number;
  trend: 'up' | 'down' | 'neutral';
  volatility: number;
  lastUpdated: Date;
}

export function useRegime(): RegimeData {
  const [regimeData, setRegimeData] = useState<RegimeData>({
    regime: 'sideways',
    confidence: 0.75,
    trend: 'neutral',
    volatility: 0.15,
    lastUpdated: new Date()
  });

  useEffect(() => {
    // Simulated market regime detection
    // In real implementation, this would connect to your trading algorithm
    const updateRegime = () => {
      const regimes: MarketRegime[] = ['bull', 'bear', 'sideways', 'volatile'];
      const randomRegime = regimes[Math.floor(Math.random() * regimes.length)];
      
      setRegimeData({
        regime: randomRegime,
        confidence: Math.random() * 0.4 + 0.6, // 0.6-1.0
        trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.25 ? 'down' : 'neutral',
        volatility: Math.random() * 0.3 + 0.1, // 0.1-0.4
        lastUpdated: new Date()
      });
    };

    // Update every 30 seconds
    const interval = setInterval(updateRegime, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return regimeData;
}

export function getRegimeColor(regime: MarketRegime): string {
  switch (regime) {
    case 'bull':
      return 'text-green-500';
    case 'bear':
      return 'text-red-500';
    case 'volatile':
      return 'text-yellow-500';
    case 'sideways':
      return 'text-gray-500';
    default:
      return 'text-gray-500';
  }
}

export function getRegimeDescription(regime: MarketRegime): string {
  switch (regime) {
    case 'bull':
      return 'Yükseliş trendi';
    case 'bear':
      return 'Düşüş trendi';
    case 'volatile':
      return 'Yüksek volatilite';
    case 'sideways':
      return 'Yatay hareket';
    default:
      return 'Bilinmeyen';
  }
}