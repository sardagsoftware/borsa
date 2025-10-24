/**
 * THEME CONTEXT
 *
 * React context for theme management
 * - Provides theme to all components
 * - Handles theme changes
 * - Syncs with localStorage
 *
 * WHITE-HAT:
 * - User preferences respected
 * - Accessibility compliant
 * - Privacy-first
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Theme, ThemeMode, ThemeContextValue } from '@/lib/theme/types';
import { getThemeManager } from '@/lib/theme/theme-manager';
import { DARK_THEME } from '@/lib/theme/theme-config';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
}

/**
 * Theme Provider
 * Wraps app and provides theme context
 */
export function ThemeProvider({ children, defaultMode = 'system' }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>(DARK_THEME);
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);

  // Get theme manager
  const themeManager = getThemeManager();

  // Initialize on mount
  useEffect(() => {
    setMounted(true);

    // Get current theme and mode
    const currentTheme = themeManager.getTheme();
    const currentMode = themeManager.getMode();

    setTheme(currentTheme);
    setModeState(currentMode);

    // Subscribe to theme changes
    const unsubscribe = themeManager.subscribe((newTheme, newMode) => {
      setTheme(newTheme);
      setModeState(newMode);
    });

    return () => {
      unsubscribe();
    };
  }, [themeManager]);

  /**
   * Set theme mode
   */
  const setMode = useCallback(
    (newMode: ThemeMode) => {
      themeManager.setMode(newMode);
    },
    [themeManager]
  );

  /**
   * Toggle theme
   */
  const toggleTheme = useCallback(() => {
    themeManager.toggleTheme();
  }, [themeManager]);

  /**
   * Check if using system theme
   */
  const isSystemTheme = themeManager.isSystemTheme();

  /**
   * Check if dark theme
   */
  const isDark = themeManager.isDark();

  const value: ThemeContextValue = {
    theme,
    mode,
    setMode,
    toggleTheme,
    isSystemTheme,
    isDark,
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return <>{children}</>;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Use theme hook
 * Access theme context
 *
 * @example
 * const { theme, mode, setMode, toggleTheme } = useTheme();
 */
export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }

  return context;
}

export default ThemeProvider;
