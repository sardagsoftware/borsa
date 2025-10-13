'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Import translation files
import trTranslations from '../../locales/tr.json';
import enTranslations from '../../locales/en.json';

export type Language = 'tr' | 'en';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  tr: trTranslations,
  en: enTranslations
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  // Default to Turkish
  const [language, setLanguageState] = useState<Language>('tr');
  const [isClient, setIsClient] = useState(false);

  // Load language from localStorage on mount
  useEffect(() => {
    setIsClient(true);
    const savedLanguage = localStorage.getItem('ailydian-language') as Language;
    if (savedLanguage && (savedLanguage === 'tr' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage);
    } else {
      // Default to Turkish
      localStorage.setItem('ailydian-language', 'tr');
      setLanguageState('tr');
    }
  }, []);

  // Save language to localStorage when it changes
  const setLanguage = (lang: Language) => {
    localStorage.setItem('ailydian-language', lang);
    setLanguageState(lang);
    console.log(`[i18n] Language changed to: ${lang}`);
  };

  // Translation function
  const t = (key: string, params?: Record<string, string>): string => {
    try {
      // Navigate through nested keys (e.g., "settings.notifications.title")
      const keys = key.split('.');
      let value: any = translations[language];

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          console.warn(`[i18n] Translation key not found: ${key}`);
          return key; // Return key if translation not found
        }
      }

      // Replace parameters if provided (e.g., {time} in "Last seen: {time}")
      if (typeof value === 'string' && params) {
        return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
          return params[paramKey] || match;
        });
      }

      return typeof value === 'string' ? value : key;
    } catch (error) {
      console.error(`[i18n] Translation error for key: ${key}`, error);
      return key;
    }
  };

  const contextValue: LanguageContextType = {
    language,
    setLanguage,
    t
  };

  // Don't render children until client-side
  if (!isClient) {
    return null;
  }

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook to use translation
export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}

// Helper hook to get language name
export function useLanguageName() {
  const { language } = useTranslation();
  return language === 'tr' ? 'Türkçe' : 'English';
}

// Export language options for selectors
export const languageOptions = [
  { code: 'tr' as Language, name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en' as Language, name: 'English', flag: '🇬🇧' }
];
