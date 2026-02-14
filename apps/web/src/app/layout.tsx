import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.ailydian.com'),
  title: {
    default: 'Ailydian - Enterprise AI Platform | Kurumsal Yapay Zeka Platformu',
    template: '%s | Ailydian AI',
  },
  description:
    'Ailydian: Enterprise-grade multi-model AI platform supporting 41+ languages. Advanced AI solutions for healthcare, travel, finance, agriculture, legal, and more. KVKK & GDPR compliant.',
  keywords: [
    // Core Brand
    'ailydian', 'ailydian ai', 'ailydian yapay zeka',
    // Turkish AI Keywords (Primary)
    'yapay zeka', 'coklu yapay zeka', 'yapay zeka platformu', 'kurumsal yapay zeka',
    'yapay zeka turkiye', 'turk yapay zeka', 'yerli yapay zeka', 'milli yapay zeka',
    'yapay zeka asistani', 'yapay zeka sohbet', 'yapay zeka chat',
    'cok modelli yapay zeka', 'yapay zeka cozumleri', 'ai platformu turkiye',
    'ucretsiz yapay zeka', 'en iyi yapay zeka', 'yapay zeka karsilastirma',
    // Turkish AI Use Cases
    'yapay zeka kodlama', 'yapay zeka yazilim', 'yapay zeka analiz',
    'yapay zeka ceviri', 'yapay zeka saglik', 'yapay zeka hukuk',
    'yapay zeka finans', 'yapay zeka tarim', 'yapay zeka egitim',
    'yapay zeka mimarlik', 'yapay zeka oyun', 'yapay zeka ses',
    'yapay zeka goruntu', 'yapay zeka otomasyon', 'yapay zeka musteri hizmetleri',
    'yapay zeka danismanlik', 'yapay zeka entegrasyonu', 'yapay zeka api',
    // Turkish Technical
    'dogal dil isleme', 'makine ogrenmesi', 'derin ogrenme', 'buyuk dil modeli',
    'dijital asistan', 'sanal asistan', 'akilli asistan', 'coklu ai motoru',
    'turkce yapay zeka', 'turkce dil modeli', 'turkce chatbot',
    'veri analizi yapay zeka', 'bulut yapay zeka', 'yapay zeka saas',
    '41 dilde yapay zeka', 'kvkk uyumlu yapay zeka',
    // Turkish Business
    'sirketler icin yapay zeka', 'kurumsal ai cozumleri', 'is zekasi yapay zeka',
    'yapay zeka startup turkiye', 'yapay zeka teknoloji', 'yeni teknoloji',
    'yazilim ai', 'yazilim teknolojileri',
    // English AI Keywords (Primary)
    'multi ai platform', 'multi-model ai', 'enterprise ai platform',
    'ai assistant', 'ai chat', 'ai chatbot', 'ai for business',
    'free ai', 'best ai platform', 'ai aggregator', 'multi-engine ai',
    'ai solutions turkey', 'turkish ai platform', 'artificial intelligence turkey',
    // English AI Use Cases
    'ai coding assistant', 'ai code generation', 'ai analysis',
    'ai automation', 'ai workflow', 'ai agent', 'autonomous ai',
    'ai orchestration', 'enterprise ai solutions', 'ai customer service',
    'healthcare ai', 'travel ai', 'finance ai', 'agriculture ai', 'legal ai',
    'voice ai', 'ai speech synthesis', 'ai image generation',
    // English Technical
    'enterprise chatbot', 'multilingual ai platform', 'real-time ai',
    'ai data analytics', 'business intelligence ai', 'cognitive computing',
    'deep learning platform', 'neural network platform', 'ai saas', 'ai paas',
    'ai api', 'on-premise ai', 'gdpr compliant ai', 'turkish language ai',
    // Russian AI Keywords
    'искусственный интеллект', 'платформа ИИ', 'многоязычный ИИ',
    'ИИ ассистент', 'турецкий ИИ', 'бесплатный ИИ',
    // Spanish AI Keywords
    'inteligencia artificial', 'plataforma ia', 'asistente ia',
    'ia empresarial', 'ia multilingue',
    // Chinese AI Keywords
    '人工智能平台', '多模型AI', '企业AI', 'AI助手',
  ],
  authors: [{ name: 'Ailydian', url: 'https://www.ailydian.com' }],
  creator: 'Ailydian',
  publisher: 'Ailydian',
  category: 'Technology',
  alternates: {
    canonical: 'https://www.ailydian.com',
    languages: {
      'tr': 'https://www.ailydian.com',
      'en': 'https://www.ailydian.com/en',
      'de': 'https://www.ailydian.com/de',
      'fr': 'https://www.ailydian.com/fr',
      'ar': 'https://www.ailydian.com/ar',
      'ru': 'https://www.ailydian.com/ru',
      'es': 'https://www.ailydian.com/es',
      'zh': 'https://www.ailydian.com/zh',
      'x-default': 'https://www.ailydian.com',
    },
  },
  openGraph: {
    title: 'Ailydian - Enterprise AI Platform | 41+ Languages',
    description:
      'Enterprise-grade multi-model AI platform. Healthcare, travel, finance, agriculture, legal AI solutions. KVKK & GDPR compliant. 41+ language support.',
    url: 'https://www.ailydian.com',
    siteName: 'Ailydian',
    locale: 'tr_TR',
    alternateLocale: ['en_US', 'de_DE', 'fr_FR', 'ar_SA', 'ru_RU', 'es_ES', 'zh_CN'],
    type: 'website',
    images: [
      {
        url: 'https://www.ailydian.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Ailydian Enterprise AI Platform',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ailydian - Enterprise AI Platform',
    description:
      'Multi-model AI platform supporting 41+ languages. Advanced enterprise AI solutions.',
    images: ['https://www.ailydian.com/og-image.png'],
    creator: '@ailydian',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code',
    yandex: 'yandex-verification-code',
    other: {
      'msvalidate.01': 'bing-verification-code',
    },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://www.ailydian.com/#organization',
      name: 'Ailydian',
      url: 'https://www.ailydian.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.ailydian.com/logo.png',
        width: 512,
        height: 512,
      },
      sameAs: [
        'https://twitter.com/ailydian',
        'https://linkedin.com/company/ailydian',
        'https://github.com/ailydian',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['Turkish', 'English', 'German', 'French', 'Arabic', 'Russian', 'Spanish', 'Chinese'],
      },
      knowsAbout: [
        'Artificial Intelligence', 'Machine Learning', 'Natural Language Processing',
        'Deep Learning', 'Multi-model AI', 'Enterprise AI Solutions',
        'Yapay Zeka', 'Coklu Yapay Zeka', 'Dogal Dil Isleme',
      ],
      areaServed: {
        '@type': 'GeoCircle',
        geoMidpoint: { '@type': 'GeoCoordinates', latitude: 39.9334, longitude: 32.8597 },
        geoRadius: '20000',
        description: 'Global service with headquarters in Turkey',
      },
      foundingDate: '2024',
      numberOfEmployees: { '@type': 'QuantitativeValue', minValue: 10, maxValue: 50 },
      slogan: 'Enterprise AI Platform - Coklu Yapay Zeka Platformu',
    },
    {
      '@type': 'WebSite',
      '@id': 'https://www.ailydian.com/#website',
      url: 'https://www.ailydian.com',
      name: 'Ailydian',
      description: 'Turkiye\'nin lider coklu yapay zeka platformu. 41+ dil destegi, KVKK ve GDPR uyumlu kurumsal AI cozumleri.',
      publisher: { '@id': 'https://www.ailydian.com/#organization' },
      inLanguage: ['tr', 'en', 'de', 'fr', 'ar', 'ru', 'es', 'zh'],
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://www.ailydian.com/search?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://www.ailydian.com/#software',
      name: 'Ailydian AI Platform',
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'Artificial Intelligence',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free tier available',
        availability: 'https://schema.org/InStock',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '1250',
        bestRating: '5',
      },
      featureList: [
        'Multi-model AI', '41+ Language Support', 'KVKK & GDPR Compliant',
        'Enterprise Security', 'Real-time Analytics', 'Voice Synthesis',
        'Code Generation', 'Image Generation', 'Document Analysis',
        'Multi-agent Orchestration', 'API Integration',
      ],
    },
    {
      '@type': 'WebApplication',
      '@id': 'https://www.ailydian.com/#webapp',
      name: 'Ailydian Coklu Yapay Zeka',
      url: 'https://www.ailydian.com',
      applicationCategory: 'UtilitiesApplication',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      operatingSystem: 'All',
      availableLanguage: ['tr', 'en', 'de', 'fr', 'ar', 'ru', 'es', 'zh'],
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'TRY',
      },
      screenshot: 'https://www.ailydian.com/og-image.png',
      softwareVersion: '2.0',
      creator: { '@id': 'https://www.ailydian.com/#organization' },
    },
    {
      '@type': 'Product',
      '@id': 'https://www.ailydian.com/#product',
      name: 'Ailydian Enterprise AI',
      description: 'Kurumsal yapay zeka platformu. Saglik, finans, hukuk, tarim, egitim ve daha fazla sektor icin ozellestirilmis AI cozumleri.',
      brand: { '@type': 'Brand', name: 'Ailydian' },
      category: 'Software > Artificial Intelligence',
      offers: [
        {
          '@type': 'Offer',
          name: 'Free Plan',
          price: '0',
          priceCurrency: 'USD',
          description: 'Ucretsiz baslangic plani',
          availability: 'https://schema.org/InStock',
        },
        {
          '@type': 'Offer',
          name: 'Enterprise Plan',
          price: '0',
          priceCurrency: 'USD',
          description: 'Kurumsal ozel cozumler - iletisime gecin',
          availability: 'https://schema.org/InStock',
        },
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '1250',
        bestRating: '5',
      },
    },
    {
      '@type': 'HowTo',
      '@id': 'https://www.ailydian.com/#howto',
      name: 'Ailydian Yapay Zeka Platformunu Nasil Kullanirsiniz',
      description: 'Ailydian coklu yapay zeka platformunu kullanmaya baslamanin adim adim rehberi.',
      totalTime: 'PT5M',
      step: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: 'Hesap Olusturun',
          text: 'www.ailydian.com adresine gidin ve ucretsiz hesabinizi olusturun. Email veya Google ile kayit olabilirsiniz.',
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: 'AI Modunu Secin',
          text: 'Ihtiyaciniza uygun yapay zeka modunu secin: genel sohbet, kod yazma, analiz, ceviri veya ozel sektorel cozumler.',
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Sorunuzu Sorun',
          text: 'Turkce, Ingilizce veya 41+ dilden birinde sorunuzu yazin. Ailydian en uygun AI motorunu otomatik secer.',
        },
        {
          '@type': 'HowToStep',
          position: 4,
          name: 'Sonuclari Alin',
          text: 'Aninda yuksek kaliteli yanitlar alin. Sonuclari kaydedin, paylasin veya disa aktarin.',
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      '@id': 'https://www.ailydian.com/#breadcrumb',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Ana Sayfa',
          item: 'https://www.ailydian.com',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://www.ailydian.com/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Ailydian nedir?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ailydian, 41+ dil destekli kurumsal yapay zeka platformudur. Saglik, seyahat, finans, tarim, hukuk ve daha fazla sektorde gelismis AI cozumleri sunar.',
          },
        },
        {
          '@type': 'Question',
          name: 'Coklu yapay zeka ne demek?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Coklu yapay zeka, birden fazla AI motorunun ayni platformda bir arada calismasidir. Ailydian, her sorgu icin en uygun AI motorunu otomatik olarak secer ve en iyi sonucu saglar.',
          },
        },
        {
          '@type': 'Question',
          name: 'Ailydian ucretsiz mi?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Evet, Ailydian ucretsiz baslangic plani sunar. Temel yapay zeka ozellikleri ucretsiz kullanilabilir. Kurumsal cozumler icin ozel planlar mevcuttur.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is Ailydian?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ailydian is an enterprise-grade multi-model AI platform supporting 41+ languages. It provides advanced AI solutions for healthcare, travel, finance, agriculture, legal, and more.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is Ailydian GDPR and KVKK compliant?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, Ailydian is fully compliant with both GDPR (EU) and KVKK (Turkey) data protection regulations, ensuring enterprise-grade data privacy and security.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is multi-AI platform?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A multi-AI platform like Ailydian combines multiple AI engines into one interface, automatically selecting the best model for each query to deliver optimal results across coding, analysis, translation, and more.',
          },
        },
        {
          '@type': 'Question',
          name: 'Ailydian kac dil destekliyor?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ailydian 41+ dili destekler. Turkce, Ingilizce, Almanca, Fransizca, Arapca, Rusca, Ispanyolca, Cince ve daha bircok dilde tam destek sunar.',
          },
        },
        {
          '@type': 'Question',
          name: 'Turkiye\'de en iyi yapay zeka platformu hangisi?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ailydian, Turkiye\'nin lider coklu yapay zeka platformudur. KVKK uyumlu, Turkce dil destekli ve 41+ dilde hizmet veren kurumsal AI cozumu sunar.',
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
