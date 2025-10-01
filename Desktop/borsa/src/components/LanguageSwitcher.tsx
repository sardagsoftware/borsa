'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'tr' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="text-5xl md:text-6xl hover:scale-110 transition-all active:scale-95 cursor-pointer drop-shadow-2xl"
      title={language === 'en' ? 'Switch to Turkish' : 'Türkçe\'ye geç'}
      aria-label={language === 'en' ? 'Switch to Turkish' : 'Switch to English'}
    >
      {language === 'en' ? '🇬🇧' : '🇹🇷'}
    </button>
  );
}
