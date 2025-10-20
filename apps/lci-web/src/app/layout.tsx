// LCI Web - Root Layout
// White-hat: Semantic HTML, accessibility, SEO

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'LCI - Lydian Complaint Intelligence',
    template: '%s | LCI',
  },
  description:
    'KVKK/GDPR compliant complaint management platform. Transparent, secure, and user-focused.',
  keywords: [
    'complaint management',
    'KVKK',
    'GDPR',
    'consumer rights',
    'brand resolution',
  ],
  authors: [{ name: 'Lydian AI' }],
  creator: 'Lydian AI',
  publisher: 'Lydian AI',
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
    type: 'website',
    locale: 'tr_TR',
    alternateLocale: ['en_US'],
    url: 'https://lci.lydian.com',
    siteName: 'LCI',
    title: 'LCI - Lydian Complaint Intelligence',
    description: 'KVKK/GDPR compliant complaint management platform',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LCI - Lydian Complaint Intelligence',
    description: 'KVKK/GDPR compliant complaint management platform',
  },
  verification: {
    // White-hat: Add verification codes when ready
    google: '',
    yandex: '',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* White-hat: DNS prefetch for API */}
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL} />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthProvider>
          <div className="relative flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
