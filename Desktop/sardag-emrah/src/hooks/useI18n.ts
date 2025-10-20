/**
 * I18N REACT HOOKS
 * React hooks for multi-language support
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Language } from '@/lib/i18n/languages';
import { LANGUAGES, SUPPORTED_LANGUAGES } from '@/lib/i18n/languages';
import type { TranslationKey } from '@/lib/i18n/translations';
import {
  getCurrentLanguage,
  setLanguage as setLanguageManager,
  t as translate,
  formatNumber as formatNumberManager,
  formatCurrency as formatCurrencyManager,
  formatPercentage as formatPercentageManager,
  formatDate as formatDateManager,
  formatRelativeTime as formatRelativeTimeManager,
} from '@/lib/i18n/i18n-manager';

/**
 * Hook for i18n functionality
 */
export function useI18n() {
  const [language, setLanguageState] = useState<Language>(getCurrentLanguage());

  useEffect(() => {
    // Listen for language changes
    const handleLanguageChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ language: Language }>;
      setLanguageState(customEvent.detail.language);
    };

    window.addEventListener('languagechange', handleLanguageChange);

    return () => {
      window.removeEventListener('languagechange', handleLanguageChange);
    };
  }, []);

  const setLanguage = useCallback((newLanguage: Language) => {
    if (!SUPPORTED_LANGUAGES.includes(newLanguage)) {
      console.error('[useI18n] Unsupported language:', newLanguage);
      return;
    }

    setLanguageManager(newLanguage);
    setLanguageState(newLanguage);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => {
      return translate(key, language);
    },
    [language]
  );

  return {
    language,
    setLanguage,
    t,
    languages: LANGUAGES,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
}

/**
 * Hook for number formatting
 */
export function useNumberFormat() {
  const { language } = useI18n();

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => {
      return formatNumberManager(value, options);
    },
    [language]
  );

  const formatCurrency = useCallback(
    (value: number, currency: string = 'USD') => {
      return formatCurrencyManager(value, currency);
    },
    [language]
  );

  const formatPercentage = useCallback(
    (value: number, decimals: number = 2) => {
      return formatPercentageManager(value, decimals);
    },
    [language]
  );

  return {
    formatNumber,
    formatCurrency,
    formatPercentage,
  };
}

/**
 * Hook for date formatting
 */
export function useDateFormat() {
  const { language } = useI18n();

  const formatDate = useCallback(
    (date: Date | number, options?: Intl.DateTimeFormatOptions) => {
      return formatDateManager(date, options);
    },
    [language]
  );

  const formatRelativeTime = useCallback(
    (date: Date | number) => {
      return formatRelativeTimeManager(date);
    },
    [language]
  );

  return {
    formatDate,
    formatRelativeTime,
  };
}

/**
 * Hook to get single translation
 */
export function useTranslation(key: TranslationKey): string {
  const { t } = useI18n();
  return t(key);
}
