/**
 * I18N MANAGER
 * Multi-language support with localStorage persistence
 */

import type { Language } from './languages';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './languages';
import { translations, type TranslationKey } from './translations';

const STORAGE_KEY = 'sardag_language';

/**
 * Get current language
 */
export function getCurrentLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored as Language)) {
      return stored as Language;
    }

    // Try to detect browser language
    const browserLang = navigator.language.split('-')[0] as Language;
    if (SUPPORTED_LANGUAGES.includes(browserLang)) {
      return browserLang;
    }

    return DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

/**
 * Set current language
 */
export function setLanguage(language: Language): void {
  if (typeof window === 'undefined') return;
  if (!SUPPORTED_LANGUAGES.includes(language)) return;

  try {
    localStorage.setItem(STORAGE_KEY, language);

    // Update HTML lang attribute
    document.documentElement.lang = language;

    // Dispatch custom event for React components
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { language } }));

    console.log('[i18n] Language changed to:', language);
  } catch (error) {
    console.error('[i18n] Error setting language:', error);
  }
}

/**
 * Get translation for key
 */
export function t(key: TranslationKey, language?: Language): string {
  const lang = language || getCurrentLanguage();

  const translation = translations[lang]?.[key];

  if (!translation) {
    console.warn(`[i18n] Missing translation for key "${key}" in language "${lang}"`);
    // Fallback to English, then default language
    return translations.en?.[key] || translations[DEFAULT_LANGUAGE]?.[key] || key;
  }

  return translation;
}

/**
 * Get translations object for current language
 */
export function getTranslations(language?: Language): Record<TranslationKey, string> {
  const lang = language || getCurrentLanguage();
  return translations[lang] || translations[DEFAULT_LANGUAGE];
}

/**
 * Format number with locale
 */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  const language = getCurrentLanguage();

  // Map our language codes to locale codes
  const localeMap: Record<Language, string> = {
    tr: 'tr-TR',
    en: 'en-US',
    de: 'de-DE',
    fr: 'fr-FR',
    es: 'es-ES',
  };

  const locale = localeMap[language];

  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch {
    return value.toString();
  }
}

/**
 * Format currency
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  return formatNumber(value, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return formatNumber(value, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format date with locale
 */
export function formatDate(date: Date | number, options?: Intl.DateTimeFormatOptions): string {
  const language = getCurrentLanguage();

  // Map our language codes to locale codes
  const localeMap: Record<Language, string> = {
    tr: 'tr-TR',
    en: 'en-US',
    de: 'de-DE',
    fr: 'fr-FR',
    es: 'es-ES',
  };

  const locale = localeMap[language];
  const dateObj = typeof date === 'number' ? new Date(date) : date;

  try {
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  } catch {
    return dateObj.toLocaleDateString();
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | number): string {
  const language = getCurrentLanguage();
  const now = Date.now();
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  const diff = now - dateObj.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // Map our language codes to locale codes
  const localeMap: Record<Language, string> = {
    tr: 'tr-TR',
    en: 'en-US',
    de: 'de-DE',
    fr: 'fr-FR',
    es: 'es-ES',
  };

  const locale = localeMap[language];

  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (days > 0) return rtf.format(-days, 'day');
    if (hours > 0) return rtf.format(-hours, 'hour');
    if (minutes > 0) return rtf.format(-minutes, 'minute');
    return rtf.format(-seconds, 'second');
  } catch {
    // Fallback
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }
}

/**
 * Detect browser language
 */
export function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  try {
    const browserLang = navigator.language.split('-')[0] as Language;
    if (SUPPORTED_LANGUAGES.includes(browserLang)) {
      return browserLang;
    }
  } catch {
    // Ignore errors
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Initialize i18n
 */
export function initI18n(): void {
  if (typeof window === 'undefined') return;

  const currentLang = getCurrentLanguage();

  // Set HTML lang attribute
  document.documentElement.lang = currentLang;

  console.log('[i18n] Initialized with language:', currentLang);
}
