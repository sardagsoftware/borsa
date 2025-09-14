import { COPYRIGHT_NOTICE } from './copyright';

// SEO Keywords for different languages
export const SEO_KEYWORDS = {
  tr: [
    'AILYDIAN AI Lens Pro',
    'kripto para trading',
    'bitcoin alım satım',
    'ethereum trading',
    'binance botu',
    'otomatik trading',
    'AI kripto bot',
    'blockchain analizi',
    'teknik analiz',
    'kripto signals',
    'DeFi trading',
    'NFT marketplace',
    'web3 trading',
    'crypto portfolio',
    'margin trading',
    'futures trading',
    'Emrah Şardağ',
    'Sardag Software',
    'türk kripto',
    'güvenli trading'
  ],
  en: [
    'AILYDIAN AI Lens Pro',
    'crypto trading platform',
    'bitcoin trading bot',
    'ethereum automated trading',
    'binance API trading',
    'AI crypto signals',
    'blockchain analysis',
    'technical analysis',
    'cryptocurrency bot',
    'DeFi trading platform',
    'NFT trading',
    'web3 integration',
    'crypto portfolio management',
    'margin trading bot',
    'futures trading platform',
    'Emrah Sardag',
    'Sardag Software',
    'professional trading',
    'secure crypto trading'
  ],
  ar: [
    'AILYDIAN AI Lens Pro',
    'تداول العملات الرقمية',
    'بوت تداول البيتكوين',
    'تداول الإثيريوم الآلي',
    'منصة تداول بايننس',
    'إشارات الذكاء الاصطناعي',
    'تحليل البلوك تشين',
    'التحليل الفني',
    'بوت العملات المشفرة',
    'منصة تداول DeFi',
    'تداول NFT',
    'تكامل web3',
    'إدارة محفظة العملات',
    'بوت التداول بالهامش',
    'منصة تداول العقود الآجلة'
  ]
};

// Meta descriptions for different pages
export const SEO_META_DESCRIPTIONS = {
  home: {
    tr: `${COPYRIGHT_NOTICE.project} - © ${COPYRIGHT_NOTICE.year} ${COPYRIGHT_NOTICE.owner} tarafından geliştirilen ultra güvenli AI destekli kripto para trading platformu. Binance API, otomatik bot, teknik analiz ve portföy yönetimi.`,
    en: `${COPYRIGHT_NOTICE.project} - © ${COPYRIGHT_NOTICE.year} ${COPYRIGHT_NOTICE.owner} developed ultra-secure AI-powered cryptocurrency trading platform. Binance API, automated bot, technical analysis and portfolio management.`,
    ar: `${COPYRIGHT_NOTICE.project} - © ${COPYRIGHT_NOTICE.year} منصة تداول العملات الرقمية الآمنة المدعومة بالذكاء الاصطناعي من تطوير ${COPYRIGHT_NOTICE.owner}. API بايننس والبوت الآلي والتحليل الفني وإدارة المحفظة.`
  },
  dashboard: {
    tr: 'AI Lens Pro Dashboard - Kripto portföyünüzü yönetin, canlı fiyatları takip edin ve otomatik trading yapın. Güvenli ve profesyonel trading deneyimi.',
    en: 'AI Lens Pro Dashboard - Manage your crypto portfolio, track live prices and automated trading. Secure and professional trading experience.',
    ar: 'لوحة تحكم AI Lens Pro - إدارة محفظة العملات الرقمية، تتبع الأسعار الحية والتداول الآلي. تجربة تداول آمنة ومهنية.'
  },
  trading: {
    tr: 'Gelişmiş Kripto Trading - AILYDIAN AI Lens Pro ile Bitcoin, Ethereum ve altcoin alım satımı. Canlı fiyatlar, teknik analiz ve otomatik emirler.',
    en: 'Advanced Crypto Trading - Bitcoin, Ethereum and altcoin trading with AILYDIAN AI Lens Pro. Live prices, technical analysis and automated orders.',
    ar: 'التداول المتقدم للعملات الرقمية - تداول البيتكوين والإثيريوم والعملات البديلة مع AILYDIAN AI Lens Pro. الأسعار المباشرة والتحليل الفني والأوامر الآلية.'
  }
};

// Structured Data for Rich Snippets
export const generateStructuredData = (page: string, locale: string = 'tr') => {
  const baseData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": COPYRIGHT_NOTICE.project,
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "author": {
      "@type": "Person",
      "name": COPYRIGHT_NOTICE.owner,
      "url": COPYRIGHT_NOTICE.contact.website
    },
    "publisher": {
      "@type": "Organization",
      "name": COPYRIGHT_NOTICE.company,
      "url": COPYRIGHT_NOTICE.contact.website
    },
    "inLanguage": locale,
    "copyrightYear": COPYRIGHT_NOTICE.year,
    "copyrightHolder": {
      "@type": "Person",
      "name": COPYRIGHT_NOTICE.owner
    },
    "applicationSubCategory": [
      "Cryptocurrency Trading",
      "AI Trading Bot",
      "Portfolio Management",
      "Technical Analysis"
    ],
    "featureList": [
      "AI-Powered Trading Signals",
      "Real-time Crypto Prices",
      "Binance API Integration", 
      "Portfolio Management",
      "Technical Analysis Tools",
      "Automated Trading Bots",
      "Multi-language Support",
      "Advanced Security Features"
    ],
    "screenshot": "/images/ailydian-dashboard.jpg",
    "softwareVersion": "1.0.0",
    "datePublished": "2024-01-01",
    "dateModified": new Date().toISOString()
  };

  // Page-specific structured data
  if (page === 'home') {
    return {
      ...baseData,
      "description": SEO_META_DESCRIPTIONS.home[locale as keyof typeof SEO_META_DESCRIPTIONS.home] || SEO_META_DESCRIPTIONS.home.tr,
      "url": "/",
      "mainEntity": {
        "@type": "WebApplication",
        "name": COPYRIGHT_NOTICE.project,
        "url": "/",
        "applicationCategory": "Cryptocurrency Trading Platform"
      }
    };
  }

  if (page === 'dashboard') {
    return {
      ...baseData,
      "description": SEO_META_DESCRIPTIONS.dashboard[locale as keyof typeof SEO_META_DESCRIPTIONS.dashboard] || SEO_META_DESCRIPTIONS.dashboard.tr,
      "url": "/dashboard"
    };
  }

  if (page === 'trading') {
    return {
      ...baseData,
      "description": SEO_META_DESCRIPTIONS.trading[locale as keyof typeof SEO_META_DESCRIPTIONS.trading] || SEO_META_DESCRIPTIONS.trading.tr,
      "url": "/trading"
    };
  }

  return baseData;
};

// OpenGraph Data
export const generateOpenGraphData = (page: string, locale: string = 'tr') => {
  const baseOG = {
    title: `${COPYRIGHT_NOTICE.project} - ${COPYRIGHT_NOTICE.owner}`,
    description: SEO_META_DESCRIPTIONS.home[locale as keyof typeof SEO_META_DESCRIPTIONS.home] || SEO_META_DESCRIPTIONS.home.tr,
    image: '/images/ailydian-og-image.jpg',
    url: '/',
    type: 'website',
    siteName: COPYRIGHT_NOTICE.project,
    locale: locale
  };

  if (page === 'dashboard') {
    return {
      ...baseOG,
      title: `Dashboard - ${COPYRIGHT_NOTICE.project}`,
      description: SEO_META_DESCRIPTIONS.dashboard[locale as keyof typeof SEO_META_DESCRIPTIONS.dashboard] || SEO_META_DESCRIPTIONS.dashboard.tr,
      url: '/dashboard'
    };
  }

  if (page === 'trading') {
    return {
      ...baseOG,
      title: `Trading - ${COPYRIGHT_NOTICE.project}`,
      description: SEO_META_DESCRIPTIONS.trading[locale as keyof typeof SEO_META_DESCRIPTIONS.trading] || SEO_META_DESCRIPTIONS.trading.tr,
      url: '/trading'
    };
  }

  return baseOG;
};

// Twitter Card Data
export const generateTwitterCardData = (page: string, locale: string = 'tr') => {
  return {
    card: 'summary_large_image',
    site: '@AILydianPro',
    creator: '@EmrahSardag',
    title: `${COPYRIGHT_NOTICE.project} - AI Crypto Trading`,
    description: SEO_META_DESCRIPTIONS.home[locale as keyof typeof SEO_META_DESCRIPTIONS.home] || SEO_META_DESCRIPTIONS.home.tr,
    image: '/images/ailydian-twitter-card.jpg'
  };
};

// Canonical URLs
export const generateCanonicalUrl = (page: string, locale: string = 'tr') => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ailydian.com';
  
  if (locale === 'tr') {
    return `${baseUrl}${page === 'home' ? '' : `/${page}`}`;
  }
  
  return `${baseUrl}/${locale}${page === 'home' ? '' : `/${page}`}`;
};

// Hreflang URLs
export const generateHreflangUrls = (page: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ailydian.com';
  const languages = ['tr', 'en', 'ar', 'fa', 'fr', 'de', 'nl'];
  
  return languages.map(lang => {
    let url = baseUrl;
    if (lang !== 'tr') {
      url += `/${lang}`;
    }
    if (page !== 'home') {
      url += `/${page}`;
    }
    
    return {
      hreflang: lang,
      href: url
    };
  });
};

// SEO-friendly URL slugs
export const generateSeoSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9ğüşiöçıĞÜŞİÖÇI\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

// Meta Tags Generator
export const generateMetaTags = (page: string, locale: string = 'tr') => {
  const keywords = SEO_KEYWORDS[locale as keyof typeof SEO_KEYWORDS] || SEO_KEYWORDS.tr;
  const og = generateOpenGraphData(page, locale);
  const twitter = generateTwitterCardData(page, locale);
  const canonical = generateCanonicalUrl(page, locale);
  const hreflang = generateHreflangUrls(page);
  const structuredData = generateStructuredData(page, locale);

  return {
    title: og.title,
    description: og.description,
    keywords: keywords.join(', '),
    canonical,
    openGraph: og,
    twitter,
    hreflang,
    structuredData,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical,
      languages: Object.fromEntries(
        hreflang.map(({ hreflang, href }) => [hreflang, href])
      )
    }
  };
};
