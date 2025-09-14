'use client';

import { useRouter } from 'next/navigation';

interface LanguageSwitcherProps {
  currentLocale: string;
}

export default function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const router = useRouter();

  const handleLanguageChange = (locale: string) => {
    router.push(`/${locale}/brief`);
  };

  const languages = [
    { code: 'tr', flag: '🇹🇷', label: 'TR' },
    { code: 'en', flag: '🇺🇸', label: 'EN' },
    { code: 'ar', flag: '🇸🇦', label: 'AR' },
    { code: 'fa', flag: '🇮🇷', label: 'FA' }
  ];

  return (
    <div className="hidden md:flex items-center space-x-2">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            currentLocale === lang.code
              ? 'bg-brand-1/20 text-brand-1'
              : 'bg-glass hover:bg-brand-1/20 text-text hover:text-brand-1'
          }`}
        >
          {lang.flag} {lang.label}
        </button>
      ))}
    </div>
  );
}
