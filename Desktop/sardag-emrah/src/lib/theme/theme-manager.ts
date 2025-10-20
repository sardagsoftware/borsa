/**
 * THEME MANAGER
 *
 * Central theme management
 * - Load/save preferences
 * - System theme detection
 * - Auto-switch based on time
 * - Theme transition animations
 *
 * WHITE-HAT:
 * - Respect user preferences
 * - Privacy-first (local storage only)
 * - Accessibility compliant
 */

import type { ThemeMode, ThemePreference, Theme, ThemeConfig } from './types';
import {
  DEFAULT_THEME_CONFIG,
  getThemeByMode,
  getSystemTheme,
  getTimeBasedTheme,
  applyThemeToDocument,
  DARK_THEME,
  LIGHT_THEME,
} from './theme-config';

export class ThemeManager {
  private config: ThemeConfig;
  private currentMode: ThemeMode = 'system';
  private currentTheme: Theme = DARK_THEME;
  private listeners: Set<(theme: Theme, mode: ThemeMode) => void> = new Set();
  private systemThemeQuery?: MediaQueryList;
  private autoSwitchInterval?: NodeJS.Timeout;

  constructor(config: Partial<ThemeConfig> = {}) {
    this.config = { ...DEFAULT_THEME_CONFIG, ...config };
    this.initialize();
  }

  /**
   * Initialize theme manager
   */
  private initialize(): void {
    if (typeof window === 'undefined') return;

    // Load saved preference
    const preference = this.loadPreference();
    this.currentMode = preference?.mode || 'system';

    // Resolve actual theme
    const resolvedMode = this.resolveMode(this.currentMode);
    this.currentTheme = getThemeByMode(resolvedMode);

    // Apply theme
    this.applyTheme(this.currentTheme);

    // Setup system theme listener
    if (this.config.respectSystemPreference) {
      this.setupSystemThemeListener();
    }

    // Setup auto-switch based on time
    if (this.config.autoSwitchTimes) {
      this.setupAutoSwitch();
    }
  }

  /**
   * Resolve mode to actual theme
   */
  private resolveMode(mode: ThemeMode): 'dark' | 'light' {
    if (mode === 'system') {
      return getSystemTheme();
    }
    return mode;
  }

  /**
   * Load preference from storage
   */
  private loadPreference(): ThemePreference | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (!stored) return null;

      const preference: ThemePreference = JSON.parse(stored);
      return preference;
    } catch (error) {
      console.error('[ThemeManager] Failed to load preference:', error);
      return null;
    }
  }

  /**
   * Save preference to storage
   */
  private savePreference(preference: ThemePreference): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.config.storageKey, JSON.stringify(preference));
    } catch (error) {
      console.error('[ThemeManager] Failed to save preference:', error);
    }
  }

  /**
   * Apply theme to document
   */
  private applyTheme(theme: Theme): void {
    if (!this.config.enableTransitions) {
      // Apply immediately
      applyThemeToDocument(theme);
      return;
    }

    // Add transition class
    document.documentElement.classList.add('theme-transitioning');

    // Apply theme
    applyThemeToDocument(theme);

    // Remove transition class after duration
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, this.config.transitionDuration);
  }

  /**
   * Setup system theme listener
   */
  private setupSystemThemeListener(): void {
    if (typeof window === 'undefined') return;

    try {
      this.systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleChange = (e: MediaQueryListEvent) => {
        if (this.currentMode === 'system') {
          const newTheme = getThemeByMode(e.matches ? 'dark' : 'light');
          this.currentTheme = newTheme;
          this.applyTheme(newTheme);
          this.notifyListeners();
        }
      };

      // Modern browsers
      if (this.systemThemeQuery.addEventListener) {
        this.systemThemeQuery.addEventListener('change', handleChange);
      }
      // Legacy browsers
      else if (this.systemThemeQuery.addListener) {
        this.systemThemeQuery.addListener(handleChange);
      }
    } catch (error) {
      console.error('[ThemeManager] Failed to setup system theme listener:', error);
    }
  }

  /**
   * Setup auto-switch based on time
   */
  private setupAutoSwitch(): void {
    if (typeof window === 'undefined') return;

    // Check every minute
    this.autoSwitchInterval = setInterval(() => {
      const preference = this.loadPreference();
      if (!preference?.autoSwitch) return;

      if (this.currentMode === 'system') {
        const timeBasedMode = getTimeBasedTheme(this.config);
        const newTheme = getThemeByMode(timeBasedMode);

        if (newTheme.mode !== this.currentTheme.mode) {
          this.currentTheme = newTheme;
          this.applyTheme(newTheme);
          this.notifyListeners();
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Get current theme
   */
  getTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Get current mode
   */
  getMode(): ThemeMode {
    return this.currentMode;
  }

  /**
   * Set theme mode
   */
  setMode(mode: ThemeMode): void {
    this.currentMode = mode;

    const resolvedMode = this.resolveMode(mode);
    const newTheme = getThemeByMode(resolvedMode);

    this.currentTheme = newTheme;
    this.applyTheme(newTheme);

    // Save preference
    this.savePreference({
      mode,
      lastChanged: Date.now(),
    });

    this.notifyListeners();
  }

  /**
   * Toggle between dark and light
   */
  toggleTheme(): void {
    const resolvedMode = this.resolveMode(this.currentMode);
    const newMode = resolvedMode === 'dark' ? 'light' : 'dark';
    this.setMode(newMode);
  }

  /**
   * Check if using system theme
   */
  isSystemTheme(): boolean {
    return this.currentMode === 'system';
  }

  /**
   * Check if dark theme
   */
  isDark(): boolean {
    return this.currentTheme.mode === 'dark';
  }

  /**
   * Subscribe to theme changes
   */
  subscribe(listener: (theme: Theme, mode: ThemeMode) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentTheme, this.currentMode);
      } catch (error) {
        console.error('[ThemeManager] Listener error:', error);
      }
    });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    // Clear auto-switch interval
    if (this.autoSwitchInterval) {
      clearInterval(this.autoSwitchInterval);
    }

    // Remove system theme listener
    if (this.systemThemeQuery) {
      const handleChange = () => {};
      if (this.systemThemeQuery.removeEventListener) {
        this.systemThemeQuery.removeEventListener('change', handleChange);
      } else if (this.systemThemeQuery.removeListener) {
        this.systemThemeQuery.removeListener(handleChange);
      }
    }

    // Clear listeners
    this.listeners.clear();
  }
}

// Singleton instance
let themeManagerInstance: ThemeManager | null = null;

/**
 * Get theme manager singleton
 */
export function getThemeManager(): ThemeManager {
  if (!themeManagerInstance) {
    themeManagerInstance = new ThemeManager();
  }
  return themeManagerInstance;
}

/**
 * Initialize theme manager with custom config
 */
export function initializeThemeManager(config?: Partial<ThemeConfig>): ThemeManager {
  themeManagerInstance = new ThemeManager(config);
  return themeManagerInstance;
}
