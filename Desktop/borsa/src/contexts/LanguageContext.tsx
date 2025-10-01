'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'tr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Comprehensive translations for the entire system
const translations = {
  en: {
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.import': 'Import',

    // Login Page
    'login.email': 'Email',
    'login.password': 'Password',
    'login.login': 'Login',
    'login.forgotPassword': 'Forgot Password',
    'login.ipAddress': 'IP Address',
    'login.location': 'Location',
    'login.device': 'Device',
    'login.os': 'Operating System',
    'login.operator': 'Operator',
    'login.authenticator': '🔐 Using Authenticator',
    'login.loadingLocation': 'Getting location info...',
    'login.privacy': 'Privacy',
    'login.copyright': 'Copyright',
    'login.security': 'Security',

    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.crypto': 'Crypto',
    'nav.stocks': 'Stocks',
    'nav.portfolio': 'Portfolio',
    'nav.watchlist': 'Watchlist',
    'nav.botManagement': 'Bot Management',
    'nav.signals': 'Signals',
    'nav.quantumPro': 'Quantum Pro',
    'nav.backtesting': 'Backtesting',
    'nav.riskManagement': 'Risk Management',
    'nav.marketAnalysis': 'Market Analysis',
    'nav.settings': 'Settings',
    'nav.aiChat': 'AI Chat',
    'nav.logout': 'Logout',

    // Dashboard
    'dashboard.title': 'Trading Dashboard',
    'dashboard.totalValue': 'Total Portfolio Value',
    'dashboard.dailyChange': 'Daily Change',
    'dashboard.weeklyChange': 'Weekly Change',
    'dashboard.monthlyChange': 'Monthly Change',

    // Crypto
    'crypto.title': 'Cryptocurrency Markets',
    'crypto.price': 'Price',
    'crypto.change24h': '24h Change',
    'crypto.volume': 'Volume',
    'crypto.marketCap': 'Market Cap',

    // Stocks
    'stocks.title': 'Stock Markets',
    'stocks.symbol': 'Symbol',
    'stocks.lastPrice': 'Last Price',
    'stocks.change': 'Change',

    // Portfolio
    'portfolio.title': 'My Portfolio',
    'portfolio.holdings': 'Holdings',
    'portfolio.performance': 'Performance',
    'portfolio.allocation': 'Asset Allocation',

    // Bot Management
    'bot.title': 'Trading Bots',
    'bot.active': 'Active',
    'bot.inactive': 'Inactive',
    'bot.performance': 'Performance',
    'bot.start': 'Start Bot',
    'bot.stop': 'Stop Bot',

    // Quantum Pro
    'quantum.title': 'Quantum Pro Trading',
    'quantum.aiPredictions': 'AI Predictions',
    'quantum.marketSentiment': 'Market Sentiment',
    'quantum.advancedAnalytics': 'Advanced Analytics',
  },
  tr: {
    // Common
    'common.loading': 'Yükleniyor...',
    'common.error': 'Hata',
    'common.success': 'Başarılı',
    'common.save': 'Kaydet',
    'common.cancel': 'İptal',
    'common.delete': 'Sil',
    'common.edit': 'Düzenle',
    'common.add': 'Ekle',
    'common.search': 'Ara',
    'common.filter': 'Filtrele',
    'common.export': 'Dışa Aktar',
    'common.import': 'İçe Aktar',

    // Login Page
    'login.email': 'E-posta',
    'login.password': 'Şifre',
    'login.login': 'Giriş',
    'login.forgotPassword': 'Şifremi Unuttum',
    'login.ipAddress': 'IP Adresi',
    'login.location': 'Konum',
    'login.device': 'Cihaz',
    'login.os': 'İşletim Sistemi',
    'login.operator': 'Operatör',
    'login.authenticator': '🔐 Authenticator kullanılmaktadır',
    'login.loadingLocation': 'Konum bilgisi alınıyor...',
    'login.privacy': 'Gizlilik',
    'login.copyright': 'Telif',
    'login.security': 'Güvenlik',

    // Navigation
    'nav.dashboard': 'Kontrol Paneli',
    'nav.crypto': 'Kripto',
    'nav.stocks': 'Hisse Senetleri',
    'nav.portfolio': 'Portföy',
    'nav.watchlist': 'İzleme Listesi',
    'nav.botManagement': 'Bot Yönetimi',
    'nav.signals': 'Sinyaller',
    'nav.quantumPro': 'Quantum Pro',
    'nav.backtesting': 'Geriye Dönük Test',
    'nav.riskManagement': 'Risk Yönetimi',
    'nav.marketAnalysis': 'Piyasa Analizi',
    'nav.settings': 'Ayarlar',
    'nav.aiChat': 'AI Sohbet',
    'nav.logout': 'Çıkış',

    // Dashboard
    'dashboard.title': 'İşlem Paneli',
    'dashboard.totalValue': 'Toplam Portföy Değeri',
    'dashboard.dailyChange': 'Günlük Değişim',
    'dashboard.weeklyChange': 'Haftalık Değişim',
    'dashboard.monthlyChange': 'Aylık Değişim',

    // Crypto
    'crypto.title': 'Kripto Para Piyasaları',
    'crypto.price': 'Fiyat',
    'crypto.change24h': '24s Değişim',
    'crypto.volume': 'Hacim',
    'crypto.marketCap': 'Piyasa Değeri',

    // Stocks
    'stocks.title': 'Hisse Senedi Piyasaları',
    'stocks.symbol': 'Sembol',
    'stocks.lastPrice': 'Son Fiyat',
    'stocks.change': 'Değişim',

    // Portfolio
    'portfolio.title': 'Portföyüm',
    'portfolio.holdings': 'Varlıklar',
    'portfolio.performance': 'Performans',
    'portfolio.allocation': 'Varlık Dağılımı',

    // Bot Management
    'bot.title': 'İşlem Botları',
    'bot.active': 'Aktif',
    'bot.inactive': 'Pasif',
    'bot.performance': 'Performans',
    'bot.start': 'Bot Başlat',
    'bot.stop': 'Bot Durdur',

    // Quantum Pro
    'quantum.title': 'Quantum Pro İşlem',
    'quantum.aiPredictions': 'AI Tahminleri',
    'quantum.marketSentiment': 'Piyasa Duyarlılığı',
    'quantum.advancedAnalytics': 'Gelişmiş Analizler',
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('tr');

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'tr')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  // Save language to localStorage when changed
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  // Translation function
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
