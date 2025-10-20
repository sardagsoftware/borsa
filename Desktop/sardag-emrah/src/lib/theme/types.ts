/**
 * THEME SYSTEM TYPES
 *
 * Type-safe theme definitions
 * - Theme modes (dark, light, system)
 * - Color schemes
 * - Theme preferences
 *
 * WHITE-HAT:
 * - Accessibility-first design (WCAG AA contrast)
 * - User preference respect
 * - System theme detection
 */

export type ThemeMode = 'dark' | 'light' | 'system';

export interface ThemeColors {
  // Background colors
  bg: string;
  bgCard: string;
  bgHover: string;
  bgActive: string;

  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;

  // Border colors
  border: string;
  borderHover: string;

  // Accent colors
  accentBlue: string;
  accentGreen: string;
  accentRed: string;
  accentYellow: string;
  accentPurple: string;

  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Chart colors
  chartGreen: string;
  chartRed: string;
  chartBlue: string;
  chartYellow: string;
  chartPurple: string;
  chartOrange: string;
}

export interface Theme {
  mode: 'dark' | 'light';
  colors: ThemeColors;
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
}

export interface ThemePreference {
  mode: ThemeMode;
  lastChanged: number;
  autoSwitch?: boolean; // Auto switch based on time of day
  customColors?: Partial<ThemeColors>;
}

export interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isSystemTheme: boolean;
  isDark: boolean;
}

export interface ThemeConfig {
  storageKey: string;
  transitionDuration: number; // ms
  enableTransitions: boolean;
  respectSystemPreference: boolean;
  autoSwitchTimes?: {
    darkModeStart: number; // 0-23 (hour)
    lightModeStart: number; // 0-23 (hour)
  };
}

// CSS variable names for theme
export const THEME_CSS_VARS = {
  bg: '--color-bg',
  bgCard: '--color-bg-card',
  bgHover: '--color-bg-hover',
  bgActive: '--color-bg-active',
  text: '--color-text',
  textSecondary: '--color-text-secondary',
  textTertiary: '--color-text-tertiary',
  border: '--color-border',
  borderHover: '--color-border-hover',
  accentBlue: '--color-accent-blue',
  accentGreen: '--color-accent-green',
  accentRed: '--color-accent-red',
  accentYellow: '--color-accent-yellow',
  accentPurple: '--color-accent-purple',
} as const;
