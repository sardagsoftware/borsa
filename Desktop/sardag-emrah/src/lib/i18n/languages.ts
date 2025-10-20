/**
 * LANGUAGE DEFINITIONS
 * Supported languages configuration
 */

export type Language = 'tr' | 'en' | 'de' | 'fr' | 'es';

export interface LanguageConfig {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
}

export const LANGUAGES: Record<Language, LanguageConfig> = {
  tr: {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    flag: '🇹🇷',
    rtl: false,
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    rtl: false,
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    rtl: false,
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    rtl: false,
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    rtl: false,
  },
};

export const DEFAULT_LANGUAGE: Language = 'tr';

export const SUPPORTED_LANGUAGES: Language[] = ['tr', 'en', 'de', 'fr', 'es'];
