/**
 * AILYDIAN BORSA - Root Layout
 * Next.js 15 App Router Layout
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AILYDIAN BORSA - AI Trading Platform',
  description: 'Production-grade AI-powered crypto trading platform with real-time signals',
  keywords: 'AI trading, crypto, bitcoin, signals, technical analysis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
