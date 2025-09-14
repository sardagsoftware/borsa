import { variantToRegime, shouldOverrideWithShock, type Variant } from "../ab/assign";

export type Regime = "calm" | "elevated" | "shock";

/**
 * Apply A/B theme based on cookie variant and market conditions
 * This function runs on the client-side to set the data-regime attribute
 */
export function applyABTheme(): Regime {
  // Get variant from cookie
  const cookieMatch = document.cookie.match(/(?:^|; )ab-variant=([^;]*)/);
  const variant = (cookieMatch?.[1] as Variant) || "A";
  
  // Check for market volatility (could come from props or global state)
  const volatilityMeta = document.querySelector('meta[name="market-volatility"]');
  const volatility = volatilityMeta ? parseFloat(volatilityMeta.getAttribute("content") || "0") : 0;
  
  // Determine regime
  let regime: Regime;
  if (shouldOverrideWithShock(volatility)) {
    regime = "shock";
  } else {
    regime = variantToRegime(variant);
  }
  
  // Apply to document
  document.documentElement.setAttribute("data-regime", regime);
  
  // Dispatch custom event for components that need to react to theme changes
  const event = new CustomEvent("theme-change", { 
    detail: { regime, variant, volatility } 
  });
  window.dispatchEvent(event);
  
  return regime;
}

/**
 * Get current theme regime from DOM
 */
export function getCurrentRegime(): Regime {
  const regime = document.documentElement.getAttribute("data-regime") as Regime;
  return regime || "calm";
}

/**
 * Force set theme regime (useful for testing or manual override)
 */
export function setThemeRegime(regime: Regime): void {
  document.documentElement.setAttribute("data-regime", regime);
  
  const event = new CustomEvent("theme-change", { 
    detail: { regime, forced: true } 
  });
  window.dispatchEvent(event);
}

/**
 * Listen for theme changes
 */
export function onThemeChange(callback: (regime: Regime, details: any) => void): () => void {
  const handler = (event: any) => {
    callback(event.detail.regime, event.detail);
  };
  
  window.addEventListener("theme-change", handler);
  
  // Return cleanup function
  return () => window.removeEventListener("theme-change", handler);
}

/**
 * Get theme-specific CSS custom properties for JavaScript usage
 */
export function getThemeTokens(): Record<string, string> {
  const style = getComputedStyle(document.documentElement);
  const tokens: Record<string, string> = {};
  
  // Extract all CSS custom properties that start with --color or --space etc.
  const properties = [
    'color-bg', 'color-panel', 'color-text', 'color-brand1', 'color-accent1',
    'space-gutter', 'radius-xl', 'shadow-glass', 'animation-duration-normal'
  ];
  
  properties.forEach(prop => {
    tokens[prop] = style.getPropertyValue(`--${prop}`).trim();
  });
  
  return tokens;
}

/**
 * Initialize theme system - call this in your root component
 */
export function initializeTheme(): Regime {
  // Apply theme on initial load
  const regime = applyABTheme();
  
  // Re-apply theme when visibility changes (handles page focus/blur)
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      applyABTheme();
    }
  });
  
  return regime;
}

/**
 * Debug utilities for development
 */
export const themeDebug = {
  getCurrentVariant(): Variant | null {
    const match = document.cookie.match(/(?:^|; )ab-variant=([^;]*)/);
    return (match?.[1] as Variant) || null;
  },
  
  setTestVariant(variant: Variant): void {
    document.cookie = `ab-variant=${variant}; path=/; max-age=${60 * 60 * 24 * 30}`;
    applyABTheme();
  },
  
  simulateVolatility(level: number): void {
    const meta = document.querySelector('meta[name="market-volatility"]') || 
                  document.createElement('meta');
    meta.setAttribute('name', 'market-volatility');
    meta.setAttribute('content', level.toString());
    if (!meta.parentNode) {
      document.head.appendChild(meta);
    }
    applyABTheme();
  },
  
  logCurrentState(): void {
    console.log({
      variant: this.getCurrentVariant(),
      regime: getCurrentRegime(),
      tokens: getThemeTokens()
    });
  }
};
