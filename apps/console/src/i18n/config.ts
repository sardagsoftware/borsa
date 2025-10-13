/**
 * i18n Configuration
 * Supports 8 languages with RTL for Arabic
 *
 * Languages:
 * - TR (Turkish) - Default
 * - EN (English)
 * - AR (Arabic) - RTL
 * - DE (German)
 * - RU (Russian)
 * - NL (Dutch)
 * - BG (Bulgarian)
 * - EL (Greek)
 *
 * White-hat: CLDR formatting, no external dependencies
 */

export const SUPPORTED_LOCALES = [
  { code: 'tr', name: 'Türkçe', dir: 'ltr', flag: '🇹🇷' },
  { code: 'en', name: 'English', dir: 'ltr', flag: '🇬🇧' },
  { code: 'ar', name: 'العربية', dir: 'rtl', flag: '🇸🇦' },
  { code: 'de', name: 'Deutsch', dir: 'ltr', flag: '🇩🇪' },
  { code: 'ru', name: 'Русский', dir: 'ltr', flag: '🇷🇺' },
  { code: 'nl', name: 'Nederlands', dir: 'ltr', flag: '🇳🇱' },
  { code: 'bg', name: 'Български', dir: 'ltr', flag: '🇧🇬' },
  { code: 'el', name: 'Ελληνικά', dir: 'ltr', flag: '🇬🇷' }
] as const;

export type SupportedLocale = typeof SUPPORTED_LOCALES[number]['code'];

export const DEFAULT_LOCALE: SupportedLocale = 'tr';

export const RTL_LOCALES: SupportedLocale[] = ['ar'];

/**
 * Get locale from browser or default
 */
export function getInitialLocale(): SupportedLocale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  // Check localStorage
  const stored = localStorage.getItem('locale');
  if (stored && SUPPORTED_LOCALES.some((l) => l.code === stored)) {
    return stored as SupportedLocale;
  }

  // Check browser language
  const browserLang = navigator.language.split('-')[0];
  if (SUPPORTED_LOCALES.some((l) => l.code === browserLang)) {
    return browserLang as SupportedLocale;
  }

  return DEFAULT_LOCALE;
}

/**
 * Check if locale uses RTL
 */
export function isRTL(locale: SupportedLocale): boolean {
  return RTL_LOCALES.includes(locale);
}

/**
 * Get locale info
 */
export function getLocaleInfo(locale: SupportedLocale) {
  return SUPPORTED_LOCALES.find((l) => l.code === locale) || SUPPORTED_LOCALES[0];
}

/**
 * Format number with CLDR
 */
export function formatNumber(value: number, locale: SupportedLocale, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format date with CLDR
 */
export function formatDate(date: Date | string, locale: SupportedLocale, options?: Intl.DateTimeFormatOptions) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * Format currency with CLDR
 */
export function formatCurrency(value: number, locale: SupportedLocale, currency: string = 'TRY') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(value);
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date | string, locale: SupportedLocale): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffMins < 1) return rtf.format(0, 'minute');
  if (diffMins < 60) return rtf.format(-diffMins, 'minute');
  if (diffHours < 24) return rtf.format(-diffHours, 'hour');
  return rtf.format(-diffDays, 'day');
}
