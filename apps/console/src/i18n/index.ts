/**
 * < i18n System - Full Internationalization Support
 *
 * Supports: TR (default), EN, AR, DE, RU, NL, BG, EL
 * Features:
 * - Auto-detect from accept-language header
 * - localStorage persistence
 * - RTL support for AR
 * - CLDR formatting (dates, numbers, currency)
 * - Lazy loading of locale bundles
 *
 * @module i18n
 */

'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export type SupportedLocale = 'tr' | 'en' | 'ar' | 'de' | 'ru' | 'nl' | 'bg' | 'el';

export type RTLLocale = 'ar';

export interface LocaleMessages {
  [key: string]: string | LocaleMessages;
}

interface I18nContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_LOCALE: SupportedLocale = 'tr';

const RTL_LOCALES: RTLLocale[] = ['ar'];

const SUPPORTED_LOCALES: SupportedLocale[] = [
  'tr',
  'en',
  'ar',
  'de',
  'ru',
  'nl',
  'bg',
  'el',
];

// ============================================================================
// Locale Storage
// ============================================================================

function getStoredLocale(): SupportedLocale | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem('lydian-locale');
    if (stored && SUPPORTED_LOCALES.includes(stored as SupportedLocale)) {
      return stored as SupportedLocale;
    }
  } catch (error) {
    console.warn('[i18n] Failed to read locale from localStorage:', error);
  }

  return null;
}

function setStoredLocale(locale: SupportedLocale): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('lydian-locale', locale);
  } catch (error) {
    console.warn('[i18n] Failed to save locale to localStorage:', error);
  }
}

// ============================================================================
// Auto-detect Locale
// ============================================================================

function detectLocale(): SupportedLocale {
  // 1. Try localStorage
  const stored = getStoredLocale();
  if (stored) return stored;

  // 2. Try browser language
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language.split('-')[0].toLowerCase();
    if (SUPPORTED_LOCALES.includes(browserLang as SupportedLocale)) {
      return browserLang as SupportedLocale;
    }
  }

  // 3. Default to TR
  return DEFAULT_LOCALE;
}

// ============================================================================
// Locale Loader (Dynamic Imports)
// ============================================================================

const localeCache: Map<SupportedLocale, LocaleMessages> = new Map();

async function loadLocale(locale: SupportedLocale): Promise<LocaleMessages> {
  // Check cache
  if (localeCache.has(locale)) {
    return localeCache.get(locale)!;
  }

  try {
    // Dynamic import
    const messages = await import(`./locales/${locale}.json`);
    localeCache.set(locale, messages.default || messages);
    return messages.default || messages;
  } catch (error) {
    console.error(`[i18n] Failed to load locale: ${locale}`, error);

    // Fallback to default locale
    if (locale !== DEFAULT_LOCALE) {
      return loadLocale(DEFAULT_LOCALE);
    }

    // Last resort: empty object
    return {};
  }
}

// ============================================================================
// Translation Function
// ============================================================================

function translate(
  messages: LocaleMessages,
  key: string,
  params?: Record<string, string | number>
): string {
  // Navigate nested keys
  const keys = key.split('.');
  let value: any = messages;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Key not found - return key itself
      return key;
    }
  }

  // Ensure we have a string
  if (typeof value !== 'string') {
    return key;
  }

  // Replace params (e.g., "Hello {{name}}" ’ "Hello John")
  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
      return params[paramKey] !== undefined
        ? String(params[paramKey])
        : `{{${paramKey}}}`;
    });
  }

  return value;
}

// ============================================================================
// Context
// ============================================================================

const I18nContext = createContext<I18nContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: SupportedLocale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<SupportedLocale>(
    initialLocale || detectLocale()
  );
  const [messages, setMessages] = useState<LocaleMessages>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load messages on locale change
  useEffect(() => {
    setIsLoading(true);
    loadLocale(locale).then((msgs) => {
      setMessages(msgs);
      setIsLoading(false);
    });
  }, [locale]);

  // Update document attributes for RTL
  useEffect(() => {
    const isRTL = RTL_LOCALES.includes(locale as RTLLocale);
    document.documentElement.setAttribute('lang', locale);
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
  }, [locale]);

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    setStoredLocale(newLocale);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    return translate(messages, key, params);
  };

  const isRTL = RTL_LOCALES.includes(locale as RTLLocale);

  const value: I18nContextValue = {
    locale,
    setLocale,
    t,
    isRTL,
  };

  if (isLoading) {
    return <div className="i18n-loading">Loading...</div>;
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }

  return context;
}

// ============================================================================
// Format Helpers (CLDR-compatible)
// ============================================================================

export function formatDate(date: Date, locale: SupportedLocale): string {
  return new Intl.DateTimeFormat(locale).format(date);
}

export function formatNumber(num: number, locale: SupportedLocale): string {
  return new Intl.NumberFormat(locale).format(num);
}

export function formatCurrency(
  amount: number,
  currency: string,
  locale: SupportedLocale
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatRelativeTime(
  timestamp: number,
  locale: SupportedLocale
): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (days > 0) {
    return rtf.format(-days, 'day');
  } else if (hours > 0) {
    return rtf.format(-hours, 'hour');
  } else if (minutes > 0) {
    return rtf.format(-minutes, 'minute');
  } else {
    return rtf.format(-seconds, 'second');
  }
}

console.log(' i18n system loaded (TR/EN/AR/DE/RU/NL/BG/EL + RTL support)');
