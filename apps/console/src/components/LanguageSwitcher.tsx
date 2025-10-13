/**
 * Language Switcher Component
 * Dropdown for selecting UI language
 *
 * A11y: Keyboard navigation, ARIA labels, focus management
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
import { SUPPORTED_LOCALES, getLocaleInfo } from '@/i18n/config';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLocale = getLocaleInfo(locale);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition"
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-xl" aria-hidden="true">{currentLocale.flag}</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {currentLocale.code.toUpperCase()}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="p-2 space-y-1">
            {SUPPORTED_LOCALES.map((localeOption) => {
              const isActive = localeOption.code === locale;

              return (
                <button
                  key={localeOption.code}
                  onClick={() => {
                    setLocale(localeOption.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded transition ${
                    isActive
                      ? 'bg-lydian-gold/10 text-lydian-gold font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  role="menuitem"
                  aria-label={`Switch to ${localeOption.name}`}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <span className="text-xl" aria-hidden="true">{localeOption.flag}</span>
                  <div className="flex-1 text-left">
                    <div className={`text-sm ${isActive ? 'font-semibold' : ''}`}>
                      {localeOption.name}
                    </div>
                    <div className="text-xs opacity-70">
                      {localeOption.code.toUpperCase()}
                      {localeOption.dir === 'rtl' && ' • RTL'}
                    </div>
                  </div>
                  {isActive && (
                    <svg
                      className="w-5 h-5 text-lydian-gold"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Info Footer */}
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-semibold">8 languages</span> • CLDR formatting
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
