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
  title: 'AiLydian Trader - Professional AI Trading Platform',
  description: 'Advanced AI-powered cryptocurrency trading platform with real-time analytics and automated strategies.',
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
