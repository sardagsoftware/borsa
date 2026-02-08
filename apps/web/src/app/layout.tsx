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
    'ailydian', 'yapay zeka platformu', 'enterprise ai platform', 'kurumsal yapay zeka',
    'multi-model ai', 'turkish ai platform', 'ai solutions turkey', 'kvkk uyumlu yapay zeka',
    'gdpr compliant ai', 'ai chatbot', 'yapay zeka asistan', 'ai for business',
    'healthcare ai', 'travel ai', 'finance ai', 'agriculture ai', 'legal ai',
    'voice ai', 'autonomous driving ai', 'ai analytics', 'enterprise ai solutions',
    'yapay zeka cozumleri', 'cok modelli yapay zeka', 'ai platformu turkiye',
    'artificial intelligence turkey', 'makine ogrenmesi', 'dogal dil isleme',
    'ai entegrasyonu', 'bulut yapay zeka', 'on-premise ai', 'ai api',
    'yapay zeka danismanlik', '41 dilde yapay zeka', 'multilingual ai platform',
    'ai speech synthesis', 'ai image generation', 'ai code generation',
    'real-time ai', 'enterprise chatbot', 'ai automation', 'business intelligence ai',
    'yapay zeka otomasyon', 'veri analizi yapay zeka', 'ai data analytics',
    'turkish language ai', 'turkce yapay zeka', 'ai customer service',
    'yapay zeka musteri hizmetleri', 'cognitive computing', 'deep learning platform',
    'neural network platform', 'ai saas', 'ai paas',
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
    alternateLocale: ['en_US', 'de_DE', 'fr_FR', 'ar_SA'],
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
        availableLanguage: ['Turkish', 'English', 'German', 'French', 'Arabic'],
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://www.ailydian.com/#website',
      url: 'https://www.ailydian.com',
      name: 'Ailydian',
      publisher: { '@id': 'https://www.ailydian.com/#organization' },
      inLanguage: ['tr', 'en', 'de', 'fr', 'ar'],
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
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free tier available',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '1250',
        bestRating: '5',
      },
      featureList: [
        'Multi-model AI',
        '41+ Language Support',
        'KVKK & GDPR Compliant',
        'Enterprise Security',
        'Real-time Analytics',
        'Voice Synthesis',
        'Code Generation',
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
