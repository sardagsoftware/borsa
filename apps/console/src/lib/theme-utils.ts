/**
 * 🎨 Theme Utilities
 * Helper functions for theme management
 * 
 * @module lib/theme-utils
 * @white-hat Compliant
 */

/**
 * Get CSS variable value
 */
export function getCSSVariable(name: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Set CSS variable value
 */
export function setCSSVariable(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty(name, value);
}

/**
 * Get current theme from DOM
 */
export function getCurrentTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

/**
 * Check if system prefers dark mode
 */
export function prefersDarkMode(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Check if system prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if system prefers high contrast
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Generate theme-aware color
 */
export function getThemeColor(lightColor: string, darkColor: string): string {
  const theme = getCurrentTheme();
  return theme === 'light' ? lightColor : darkColor;
}

/**
 * Class names helper (conditional classes)
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Theme-aware gradient
 */
export function getGradient(
  type: 'primary' | 'background' | 'surface'
): string {
  const gradients = {
    primary: 'var(--gradient-primary)',
    background: 'var(--gradient-background)',
    surface: 'var(--gradient-surface)',
  };
  return gradients[type];
}

/**
 * Get semantic color
 */
export function getSemanticColor(
  type: 'success' | 'warning' | 'error' | 'info'
): {
  color: string;
  bg: string;
  border: string;
} {
  const colors = {
    success: {
      color: 'var(--color-success)',
      bg: 'var(--color-success-bg)',
      border: 'var(--color-success-border)',
    },
    warning: {
      color: 'var(--color-warning)',
      bg: 'var(--color-warning-bg)',
      border: 'var(--color-warning-border)',
    },
    error: {
      color: 'var(--color-error)',
      bg: 'var(--color-error-bg)',
      border: 'var(--color-error-border)',
    },
    info: {
      color: 'var(--color-info)',
      bg: 'var(--color-info-bg)',
      border: 'var(--color-info-border)',
    },
  };
  return colors[type];
}

/**
 * Get shadow level
 */
export function getShadow(level: 'sm' | 'md' | 'lg' | 'xl' | 'gold'): string {
  const shadows = {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
    xl: 'var(--shadow-xl)',
    gold: 'var(--shadow-gold)',
  };
  return shadows[level];
}

/**
 * Get spacing value
 */
export function getSpacing(size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'): string {
  const spacing = {
    xs: 'var(--spacing-xs)',
    sm: 'var(--spacing-sm)',
    md: 'var(--spacing-md)',
    lg: 'var(--spacing-lg)',
    xl: 'var(--spacing-xl)',
    '2xl': 'var(--spacing-2xl)',
    '3xl': 'var(--spacing-3xl)',
  };
  return spacing[size];
}

/**
 * Get border radius
 */
export function getRadius(size: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'): string {
  const radius = {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
    '2xl': 'var(--radius-2xl)',
    full: 'var(--radius-full)',
  };
  return radius[size];
}

/**
 * Apply glassmorphism effect
 */
export function glassEffect(): {
  background: string;
  backdropFilter: string;
  border: string;
} {
  return {
    background: 'var(--glass-background)',
    backdropFilter: 'var(--glass-backdrop)',
    border: 'var(--glass-border)',
  };
}

/**
 * Hex to RGBA converter
 */
export function hexToRGBA(hex: string, alpha: number = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Calculate contrast ratio (WCAG)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    // Simple luminance calculation (placeholder)
    // In production, use a proper color library
    return 0.5;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color meets WCAG AA standard
 */
export function meetsWCAG_AA(foreground: string, background: string): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= 4.5; // AA standard for normal text
}

/**
 * Check if color meets WCAG AAA standard
 */
export function meetsWCAG_AAA(foreground: string, background: string): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= 7; // AAA standard for normal text
}

console.log('✅ Theme utilities initialized');
