/**
 * LANGUAGE SWITCHER COMPONENT
 * Dropdown to switch between languages
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/hooks/useI18n';
import type { Language } from '@/lib/i18n/languages';

interface LanguageSwitcherProps {
  variant?: 'default' | 'minimal';
}

export default function LanguageSwitcher({ variant = 'default' }: LanguageSwitcherProps) {
  const { language, setLanguage, languages } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages[language];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setIsOpen(false);
  };

  if (variant === 'minimal') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          title={`Current language: ${currentLanguage.nativeName}`}
        >
          <span className="text-xl">{currentLanguage.flag}</span>
          <span className="text-sm font-medium">{currentLanguage.code.toUpperCase()}</span>
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
            {Object.values(languages).map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                  language === lang.code
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'hover:bg-white/5 text-white'
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{lang.nativeName}</span>
                  <span className="text-xs text-gray-400">{lang.name}</span>
                </div>
                {language === lang.code && (
                  <svg
                    className="ml-auto w-5 h-5 text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors touch-target"
      >
        <span className="text-2xl">{currentLanguage.flag}</span>
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-white">{currentLanguage.nativeName}</span>
          <span className="text-xs text-gray-400">{currentLanguage.name}</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[240px] bg-gray-900 border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
          {Object.values(languages).map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors touch-target ${
                language === lang.code
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'hover:bg-white/5 text-white'
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <div className="flex-1 flex flex-col items-start">
                <span className="text-sm font-medium">{lang.nativeName}</span>
                <span className="text-xs text-gray-400">{lang.name}</span>
              </div>
              {language === lang.code && (
                <svg
                  className="w-5 h-5 text-blue-400 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
