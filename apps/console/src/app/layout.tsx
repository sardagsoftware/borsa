/**
 * Root Layout
 * Main layout wrapper for all pages
 *
 * Features:
 * - Global styles (Tailwind CSS)
 * - Language switcher
 * - Dark mode support
 * - RTL support for Arabic
 */

import type { Metadata } from 'next';
import './globals.css';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export const metadata: Metadata = {
  title: 'Ailydian Console - Echo of Sardis',
  description: 'Game management console for Echo of Sardis',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#D8B56A',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" dir="ltr" className="dark">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* Header with Language Switcher */}
        <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur">
          <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-lydian-gold">
                Ailydian Console
              </h1>
              <nav className="hidden md:flex gap-4 text-sm">
                <a
                  href="/story"
                  className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Story
                </a>
                <a
                  href="/liveops/s2"
                  className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  LiveOps S2
                </a>
                <a
                  href="/kpis"
                  className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  KPIs
                </a>
              </nav>
            </div>

            <LanguageSwitcher />
          </div>
        </header>

        {/* Main Content */}
        <main className="min-h-[calc(100vh-73px)]">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="container max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              Echo of Sardis - Game Management Console
            </p>
            <p className="mt-1 text-xs">
              KVKK/GDPR/PDPL Compliant • White-hat Only • WCAG 2.1 AA
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
