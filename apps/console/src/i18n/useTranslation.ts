/**
 * useTranslation Hook
 * Client-side translation hook with dynamic loading
 *
 * Usage:
 * const { t, locale, setLocale, isRTL } = useTranslation();
 * t('common.loading'); // => "Loading..." or "Yükleniyor..."
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SupportedLocale } from './config';
import { getInitialLocale, isRTL as checkRTL } from './config';

type TranslationKeys = Record<string, any>;

export function useTranslation() {
  const [locale, setLocaleState] = useState<SupportedLocale>(getInitialLocale());
  const [translations, setTranslations] = useState<TranslationKeys>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load translations for current locale
  useEffect(() => {
    async function loadTranslations() {
      setIsLoading(true);
      try {
        const common = await import(`./locales/${locale}/common.json`);
        setTranslations({ ...common.default });
      } catch (error) {
        console.error(`Failed to load translations for ${locale}:`, error);
        // Fallback to Turkish
        if (locale !== 'tr') {
          const fallback = await import(`./locales/tr/common.json`);
          setTranslations({ ...fallback.default });
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadTranslations();
  }, [locale]);

  // Update document direction for RTL
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = checkRTL(locale) ? 'rtl' : 'ltr';
      document.documentElement.lang = locale;
    }
  }, [locale]);

  // Translation function with nested key support
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split('.');
      let value: any = translations;

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          console.warn(`Translation key not found: ${key}`);
          return key;
        }
      }

      if (typeof value !== 'string') {
        console.warn(`Translation value is not a string: ${key}`);
        return key;
      }

      // Replace parameters
      if (params) {
        return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
          return params[paramKey]?.toString() || match;
        });
      }

      return value;
    },
    [translations]
  );

  // Set locale and persist to localStorage
  const setLocale = useCallback((newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
  }, []);

  return {
    t,
    locale,
    setLocale,
    isRTL: checkRTL(locale),
    isLoading
  };
}
