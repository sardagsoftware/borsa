/**
 * THEME CONFIGURATION
 *
 * Dark and Light theme definitions
 * - WCAG AA compliant colors (4.5:1 contrast ratio)
 * - Professional color palette
 * - Smooth transitions
 *
 * WHITE-HAT:
 * - Accessibility-first (high contrast)
 * - No eye-strain colors
 * - Color-blind friendly
 */

import type { Theme, ThemeConfig } from './types';

/**
 * Dark Theme (Default)
 * Professional dark theme with blue accents
 */
export const DARK_THEME: Theme = {
  mode: 'dark',
  colors: {
    // Background
    bg: '#0a0e1a',
    bgCard: '#1a1f2e',
    bgHover: 'rgba(255, 255, 255, 0.05)',
    bgActive: 'rgba(255, 255, 255, 0.1)',

    // Text
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textTertiary: 'rgba(255, 255, 255, 0.5)',

    // Border
    border: 'rgba(255, 255, 255, 0.1)',
    borderHover: 'rgba(255, 255, 255, 0.2)',

    // Accents
    accentBlue: '#3b82f6',
    accentGreen: '#10b981',
    accentRed: '#ef4444',
    accentYellow: '#f59e0b',
    accentPurple: '#8b5cf6',

    // Status
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',

    // Charts
    chartGreen: '#10b981',
    chartRed: '#ef4444',
    chartBlue: '#3b82f6',
    chartYellow: '#f59e0b',
    chartPurple: '#8b5cf6',
    chartOrange: '#f97316',
  },
  transitions: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
};

/**
 * Light Theme
 * Professional light theme with blue accents
 * WCAG AA compliant (4.5:1+ contrast ratio)
 */
export const LIGHT_THEME: Theme = {
  mode: 'light',
  colors: {
    // Background
    bg: '#ffffff',
    bgCard: '#f8fafc',
    bgHover: 'rgba(0, 0, 0, 0.03)',
    bgActive: 'rgba(0, 0, 0, 0.06)',

    // Text (dark text on light bg for contrast)
    text: '#0f172a',
    textSecondary: 'rgba(15, 23, 42, 0.7)',
    textTertiary: 'rgba(15, 23, 42, 0.5)',

    // Border
    border: 'rgba(0, 0, 0, 0.1)',
    borderHover: 'rgba(0, 0, 0, 0.2)',

    // Accents (slightly darker for better contrast on white)
    accentBlue: '#2563eb',
    accentGreen: '#059669',
    accentRed: '#dc2626',
    accentYellow: '#d97706',
    accentPurple: '#7c3aed',

    // Status
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    info: '#2563eb',

    // Charts (vivid colors for data visualization)
    chartGreen: '#10b981',
    chartRed: '#ef4444',
    chartBlue: '#3b82f6',
    chartYellow: '#f59e0b',
    chartPurple: '#8b5cf6',
    chartOrange: '#f97316',
  },
  transitions: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
};

/**
 * Default theme configuration
 */
export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  storageKey: 'ukalai_theme_preference',
  transitionDuration: 250,
  enableTransitions: true,
  respectSystemPreference: true,
  autoSwitchTimes: {
    darkModeStart: 19, // 7 PM
    lightModeStart: 7, // 7 AM
  },
};

/**
 * Get theme by mode
 */
export function getThemeByMode(mode: 'dark' | 'light'): Theme {
  return mode === 'dark' ? DARK_THEME : LIGHT_THEME;
}

/**
 * Detect system theme preference
 */
export function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

/**
 * Get time-based theme
 * Auto-switch based on time of day
 */
export function getTimeBasedTheme(config: ThemeConfig): 'dark' | 'light' {
  if (!config.autoSwitchTimes) return 'dark';

  const hour = new Date().getHours();
  const { darkModeStart, lightModeStart } = config.autoSwitchTimes;

  // If current time is between dark start and midnight, or between midnight and light start
  if (
    (hour >= darkModeStart && hour < 24) ||
    (hour >= 0 && hour < lightModeStart)
  ) {
    return 'dark';
  }

  return 'light';
}

/**
 * Apply theme to document
 * Sets CSS custom properties
 */
export function applyThemeToDocument(theme: Theme): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Set color scheme
  root.style.colorScheme = theme.mode;

  // Set CSS variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
  });

  // Set transition variables
  root.style.setProperty('--transition-fast', theme.transitions.fast);
  root.style.setProperty('--transition-normal', theme.transitions.normal);
  root.style.setProperty('--transition-slow', theme.transitions.slow);

  // Set shadow variables
  root.style.setProperty('--shadow-sm', theme.shadows.sm);
  root.style.setProperty('--shadow-md', theme.shadows.md);
  root.style.setProperty('--shadow-lg', theme.shadows.lg);
  root.style.setProperty('--shadow-xl', theme.shadows.xl);

  // Set border radius variables
  root.style.setProperty('--radius-sm', theme.borderRadius.sm);
  root.style.setProperty('--radius-md', theme.borderRadius.md);
  root.style.setProperty('--radius-lg', theme.borderRadius.lg);
  root.style.setProperty('--radius-xl', theme.borderRadius.xl);
  root.style.setProperty('--radius-full', theme.borderRadius.full);

  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme.colors.bg);
  }
}
