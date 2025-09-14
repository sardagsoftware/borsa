import type { MetadataRoute } from 'next';
import { COPYRIGHT_NOTICE } from '@/lib/copyright';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ailydian.com';
const languages = ['tr', 'en', 'ar', 'fa', 'fr', 'de', 'nl'];

// Ana sayfalar
const mainPages = [
  '',          // home
  'dashboard',
  'trading',
  'portfolio',
  'security',
  'settings',
  'wallet',
  'auth/signin',
  'auth/register'
];

// Blog/içerik sayfaları (gelecekte eklenecek)
const contentPages = [
  'blog',
  'about',
  'contact',
  'privacy',
  'terms',
  'help',
  'api-docs'
];

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date();
  const sitemapEntries: MetadataRoute.Sitemap = [];
  
  // Ana sayfa için tüm dillerde URL'ler
  languages.forEach(lang => {
    const isDefault = lang === 'tr';
    const langPath = isDefault ? '' : `/${lang}`;
    
    sitemapEntries.push({
      url: `${baseUrl}${langPath}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    });
  });

  // Diğer sayfalar için URL'ler
  mainPages.slice(1).forEach(page => {
    languages.forEach(lang => {
      const isDefault = lang === 'tr';
      const langPath = isDefault ? '' : `/${lang}`;
      
      let priority = 0.8;
      let changeFrequency: 'hourly' | 'daily' | 'weekly' = 'daily';
      
      // Sayfa önemine göre priority ayarla
      if (page === 'dashboard' || page === 'trading') {
        priority = 0.9;
        changeFrequency = 'hourly';
      } else if (page === 'auth/signin' || page === 'auth/register') {
        priority = 0.7;
        changeFrequency = 'weekly';
      }
      
      sitemapEntries.push({
        url: `${baseUrl}${langPath}/${page}`,
        lastModified: currentDate,
        changeFrequency,
        priority,
      });
    });
  });

  // İçerik sayfaları
  contentPages.forEach(page => {
    languages.forEach(lang => {
      const isDefault = lang === 'tr';
      const langPath = isDefault ? '' : `/${lang}`;
      
      sitemapEntries.push({
        url: `${baseUrl}${langPath}/${page}`,
        lastModified: currentDate,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    });
  });

  // Kripto coin sayfaları (dinamik SEO için)
  const topCryptos = [
    'bitcoin-btc', 'ethereum-eth', 'binance-coin-bnb', 'solana-sol',
    'cardano-ada', 'polkadot-dot', 'chainlink-link', 'polygon-matic',
    'avalanche-avax', 'terra-luna', 'cosmos-atom', 'algorand-algo'
  ];

  topCryptos.forEach(crypto => {
    languages.forEach(lang => {
      const isDefault = lang === 'tr';
      const langPath = isDefault ? '' : `/${lang}`;
      
      sitemapEntries.push({
        url: `${baseUrl}${langPath}/crypto/${crypto}`,
        lastModified: currentDate,
        changeFrequency: 'hourly',
        priority: 0.7,
      });
    });
  });

  return sitemapEntries;
}
