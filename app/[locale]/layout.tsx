import '../globals.css';
import '../styles/design.css';
import '../styles/type.css';
import './rtl.css';
import { Inter, Space_Grotesk } from 'next/font/google';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import ClientProviders from '../../components/ClientProviders';
import StructuredData from '../../components/StructuredData';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  preload: true
});

const locales = ['tr', 'en', 'ar', 'fa', 'fr', 'de', 'nl'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NODE_ENV === 'production' ? 'https://borsa.ailydian.com' : 'http://localhost:3000'),
  title: {
    template: '%s | AILYDIAN - AI Kripto Trading',
    default: 'AILYDIAN - Profesyonel AI Kripto Trading Platformu'
  },
  description: 'Gelişmiş AI destekli kripto para trading platformu. Gerçek zamanlı analiz, otomatik stratejiler, güvenli portföy yönetimi. Bitcoin, Ethereum ve 1000+ altcoin desteği.',
  keywords: [
    'AI Trading', 'Kripto Para', 'Bitcoin', 'Ethereum', 'Binance', 'Trading Bot',
    'Blockchain', 'DeFi', 'Portfolio Management', 'Technical Analysis',
    'Cryptocurrency', 'Automated Trading', 'Real-time Data', 'AILYDIAN'
  ],
  authors: [{ name: 'Emrah Şardağ', url: 'https://ailydian.com' }],
  creator: 'AILYDIAN',
  publisher: 'Sardağ Software',
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
  openGraph: {
    title: 'AILYDIAN - AI Destekli Kripto Trading Platformu',
    description: 'Profesyonel kripto para trading deneyimi. AI analiz, gerçek zamanlı veriler, güvenli işlemler.',
    url: 'https://borsa.ailydian.com',
    siteName: 'AILYDIAN',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'AILYDIAN - AI Kripto Trading Platform'
      }
    ],
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AILYDIAN - AI Kripto Trading',
    description: 'Profesyonel AI destekli kripto para trading platformu',
    images: ['/images/twitter-card.jpg'],
  },
};

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client side is the easiest way to get started
  const messages = await getMessages();

  // Determine text direction for RTL languages
  const isRTL = ['ar', 'fa'].includes(locale);

  return (
    <html 
      lang={locale} 
      dir={isRTL ? 'rtl' : 'ltr'} 
      className="dark" 
      data-theme="calm"
    >
      <head>
        <StructuredData type="website" locale={locale} />
        <StructuredData type="organization" locale={locale} />
        <StructuredData type="financial-service" locale={locale} />
        <StructuredData type="software-application" locale={locale} />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-inter bg-bg text-text antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <ClientProviders>
            {children}
          </ClientProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
