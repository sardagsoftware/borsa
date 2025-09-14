/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🚀 AILYDIAN BORSA TRADER - Main Layout
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * © 2024-2025 Emrah Şardağ - AILYDIAN Trading Technologies
 * All Rights Reserved. Tüm Hakları Saklıdır.
 * 
 * This file contains the main layout structure for the application
 * with enterprise security headers and copyright protection.
 * 
 * 🔒 SECURITY FEATURES:
 * • GDPR/KVKK Compliant Meta Tags
 * • Content Security Policy Headers  
 * • Copyright Protection Notices
 * • Multi-language Support (7 languages)
 * 
 * ⚖️ LEGAL NOTICE:
 * Unauthorized modification of this file is prohibited and subject
 * to legal action under international copyright law.
 * 
 * 📧 Contact: emrahsardag@yandex.com
 * 🌐 Website: https://ailydian.com
 * ═══════════════════════════════════════════════════════════════════════════
 */

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
import { COPYRIGHT_NOTICE } from '@/lib/copyright';

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
  title: 'AILYDIAN BORSA TRADER - Enterprise AI Trading Platform',
  description: '🚀 Advanced AI-powered cryptocurrency trading platform with enterprise security, real-time analytics, and automated strategies. © 2024-2025 Emrah Şardağ - AILYDIAN Trading Technologies.',
  keywords: ['cryptocurrency', 'trading', 'AI', 'blockchain', 'fintech', 'security', 'GDPR', 'enterprise'],
  authors: [{ name: 'Emrah Şardağ', url: 'https://ailydian.com' }],
  creator: 'Emrah Şardağ - AILYDIAN Trading Technologies',
  publisher: 'AILYDIAN Trading Technologies',
  robots: 'index, follow',
  openGraph: {
    title: 'AILYDIAN BORSA TRADER - Enterprise AI Trading Platform',
    description: 'Advanced AI-powered cryptocurrency trading platform with enterprise security.',
    url: 'https://borsa.ailydian.com',
    siteName: 'AILYDIAN BORSA TRADER',
    type: 'website',
    locale: 'tr_TR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AILYDIAN BORSA TRADER',
    description: 'Enterprise AI Trading Platform',
    creator: '@ailydian',
  },
  other: {
    'copyright': '© 2024-2025 Emrah Şardağ - AILYDIAN Trading Technologies. All Rights Reserved.',
    'author': 'Emrah Şardağ',
    'developer': 'emrahsardag@yandx.com',
    'company': 'AILYDIAN Trading Technologies',
    'security-level': 'ENTERPRISE-GRADE',
    'gdpr-compliant': 'true',
    'data-protection': 'KVKK-GDPR-Compliant'
  }
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
      data-copyright="© 2025 Emrah Şardağ - AILYDIAN Trading Technologies"
      data-security="ENTERPRISE-GRADE"
      data-version="1.0.0"
    >
      <head>
        <meta name="copyright" content="© 2024-2025 Emrah Şardağ - AILYDIAN Trading Technologies. All Rights Reserved." />
        <meta name="author" content="Emrah Şardağ" />
        <meta name="developer" content="emrahsardag@yandex.com" />
        <meta name="company" content="AILYDIAN Trading Technologies" />
        <meta name="security-level" content="ENTERPRISE-GRADE" />
        <meta name="gdpr-compliant" content="true" />
        <meta name="data-protection" content="KVKK-GDPR-Compliant" />
        <meta name="license" content="MIT with Additional Terms" />
        <meta name="build-date" content="2025-09-14" />
        
        {/* Security Headers */}
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:;" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        
        {/* Copyright Notice Comment */}
        {/* 
          ═══════════════════════════════════════════════════════════════════════════
          🚀 AILYDIAN BORSA TRADER v1.0.0 Enterprise
          ═══════════════════════════════════════════════════════════════════════════
          © 2024-2025 Emrah Şardağ - AILYDIAN Trading Technologies
          All Rights Reserved. Tüm Hakları Saklıdır.
          
          🔒 PROPRIETARY SOFTWARE NOTICE:
          This software is protected by international copyright law and proprietary
          licensing agreements. Unauthorized access, modification, or distribution
          is strictly prohibited and subject to criminal and civil penalties.
          
          📧 Contact: emrahsardag@yandex.com
          🌐 Website: https://ailydian.com
          
          ⚖️ LEGAL WARNING:
          Trading involves substantial risk. Consult qualified financial advisors.
          ═══════════════════════════════════════════════════════════════════════════
        */}
      </head>
      <body 
        className={`${inter.variable} ${spaceGrotesk.variable} font-inter bg-bg text-text antialiased`}
        data-app="AILYDIAN-BORSA-TRADER"
        data-version="1.0.0"
        data-build="ENTERPRISE"
      >
        <NextIntlClientProvider messages={messages}>
          <ClientProviders>
            {children}
          </ClientProviders>
        </NextIntlClientProvider>
        
        {/* Copyright Notice Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              console.log(\`${COPYRIGHT_NOTICE.warning}\`);
              if (typeof window !== 'undefined') {
                window.__AILYDIAN_COPYRIGHT__ = ${JSON.stringify(COPYRIGHT_NOTICE)};
              }
            `
          }}
        />
      </body>
    </html>
  );
}
