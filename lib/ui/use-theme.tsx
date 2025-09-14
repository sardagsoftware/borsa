'use client';

import { useEffect } from 'react';
import { initializeTheme } from './theme';
import { telemetry } from './telemetry';

/**
 * Theme Initialization Hook
 * Call this in your root layout to set up A/B testing and theme switching
 */
export function useThemeInitialization() {
  useEffect(() => {
    // Initialize theme system
    const regime = initializeTheme();
    
    // Track A/B exposure
    const variant = document.cookie.match(/(?:^|; )ab-variant=([^;]*)/)?.[1] || 'A';
    telemetry.trackExposure(variant, regime, window.location.pathname);
    
    // Add meta tag for server-side volatility data
    let volatilityMeta = document.querySelector('meta[name="market-volatility"]');
    if (!volatilityMeta) {
      volatilityMeta = document.createElement('meta');
      volatilityMeta.setAttribute('name', 'market-volatility');
      volatilityMeta.setAttribute('content', '0.1'); // Default low volatility
      document.head.appendChild(volatilityMeta);
    }
    
  }, []);
}

/**
 * Theme Provider Component
 * Wrap your app with this to enable A/B theme system
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useThemeInitialization();
  
  return (
    <>
      {children}
    </>
  );
}
