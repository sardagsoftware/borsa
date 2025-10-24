/**
 * USE THEME HOOK
 *
 * Easy access to theme functionality
 * - Get current theme
 * - Switch themes
 * - Responsive to system changes
 *
 * WHITE-HAT:
 * - User preference first
 * - Accessibility support
 */

'use client';

import { useThemeContext } from '@/contexts/ThemeContext';
import type { ThemeMode, Theme } from '@/lib/theme/types';

/**
 * Use theme hook
 *
 * @example
 * const { theme, isDark, toggleTheme } = useTheme();
 *
 * <button onClick={toggleTheme}>
 *   {isDark ? '☀️' : '🌙'}
 * </button>
 */
export function useTheme() {
  return useThemeContext();
}

/**
 * Use theme mode hook
 * Returns only the mode (dark, light, system)
 *
 * @example
 * const mode = useThemeMode();
 */
export function useThemeMode(): ThemeMode {
  const { mode } = useThemeContext();
  return mode;
}

/**
 * Use is dark hook
 * Returns boolean if dark mode is active
 *
 * @example
 * const isDark = useIsDark();
 */
export function useIsDark(): boolean {
  const { isDark } = useThemeContext();
  return isDark;
}

/**
 * Use theme colors hook
 * Returns just the colors object
 *
 * @example
 * const colors = useThemeColors();
 * <div style={{ backgroundColor: colors.bg }}>...</div>
 */
export function useThemeColors() {
  const { theme } = useThemeContext();
  return theme.colors;
}

/**
 * Use theme toggle hook
 * Returns just the toggle function
 *
 * @example
 * const toggleTheme = useThemeToggle();
 * <button onClick={toggleTheme}>Toggle</button>
 */
export function useThemeToggle(): () => void {
  const { toggleTheme } = useThemeContext();
  return toggleTheme;
}

/**
 * Use theme setter hook
 * Returns the setMode function
 *
 * @example
 * const setThemeMode = useThemeSetter();
 * <button onClick={() => setThemeMode('dark')}>Dark</button>
 */
export function useThemeSetter(): (mode: ThemeMode) => void {
  const { setMode } = useThemeContext();
  return setMode;
}

/**
 * Use conditional theme hook
 * Returns different values based on current theme
 *
 * @example
 * const backgroundColor = useConditionalTheme('#000', '#fff');
 * const icon = useConditionalTheme('🌙', '☀️');
 */
export function useConditionalTheme<T>(darkValue: T, lightValue: T): T {
  const { isDark } = useThemeContext();
  return isDark ? darkValue : lightValue;
}

export default useTheme;
