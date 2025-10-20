/**
 * 🎨 Theme Provider & Context
 * Manages application theme (dark/light/auto)
 * 
 * @module context/ThemeContext
 * @white-hat Compliant
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { trackAction } from '../lib/telemetry';

export type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextValue {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'auto',
  storageKey = 'lydian-iq-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('dark');

  // Detect system theme preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Calculate effective theme
  const calculateEffectiveTheme = (currentTheme: Theme): 'light' | 'dark' => {
    if (currentTheme === 'auto') {
      return getSystemTheme();
    }
    return currentTheme;
  };

  // Load theme from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored && (stored === 'light' || stored === 'dark' || stored === 'auto')) {
        setThemeState(stored as Theme);
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    }
  }, [storageKey]);

  // Apply theme to DOM
  useEffect(() => {
    const effective = calculateEffectiveTheme(theme);
    setEffectiveTheme(effective);

    // Apply to document
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', effective);
      
      // Also set class for compatibility
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(effective);
    }
  }, [theme]);

  // Listen to system theme changes (for auto mode)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'auto') {
        const newEffective = e.matches ? 'dark' : 'light';
        setEffectiveTheme(newEffective);
        document.documentElement.setAttribute('data-theme', newEffective);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(newEffective);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Set theme (with localStorage persistence)
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    
    try {
      localStorage.setItem(storageKey, newTheme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }

    // Track telemetry
    trackAction('theme_change', { theme: newTheme });
  };

  // Toggle theme (dark <-> light, auto stays auto)
  const toggleTheme = () => {
    if (theme === 'auto') {
      // If auto, switch to opposite of current effective
      setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
    } else {
      // Toggle between light and dark
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };

  const value: ThemeContextValue = {
    theme,
    effectiveTheme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook to check if dark mode
export function useIsDark() {
  const { effectiveTheme } = useTheme();
  return effectiveTheme === 'dark';
}

// Hook to check if light mode
export function useIsLight() {
  const { effectiveTheme } = useTheme();
  return effectiveTheme === 'light';
}
