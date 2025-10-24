/**
 * THEME SYSTEM
 *
 * Barrel exports for theme functionality
 */

// Types
export type {
  ThemeMode,
  Theme,
  ThemeColors,
  ThemePreference,
  ThemeContextValue,
  ThemeConfig,
} from './types';

// Theme configuration
export {
  DARK_THEME,
  LIGHT_THEME,
  DEFAULT_THEME_CONFIG,
  getThemeByMode,
  getSystemTheme,
  getTimeBasedTheme,
  applyThemeToDocument,
} from './theme-config';

// Theme manager
export {
  ThemeManager,
  getThemeManager,
  initializeThemeManager,
} from './theme-manager';

// Constants
export { THEME_CSS_VARS } from './types';
