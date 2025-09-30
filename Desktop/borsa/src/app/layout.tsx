import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "LyDian Trader - AI Destekli Kripto & Borsa Trading Platformu",
  description: "Yapay zeka destekli trading platformu ile kripto para ve hisse senedi piyasalarını takip edin. Quantum Pro AI ile %93+ doğruluk oranında sinyaller alın.",
  keywords: ["kripto", "borsa", "trading", "AI", "yapay zeka", "bitcoin", "ethereum", "hisse senedi", "yatırım"],
  authors: [{ name: "LyDian Trader" }],
  creator: "LyDian Trader",
  publisher: "LyDian Trader",
  metadataBase: new URL('https://borsa-lydian-io4im2qqr-emrahsardag-yandexcoms-projects.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://borsa-lydian-io4im2qqr-emrahsardag-yandexcoms-projects.vercel.app',
    siteName: 'LyDian Trader',
    title: 'LyDian Trader - AI Destekli Trading Platformu',
    description: 'Yapay zeka ile kripto ve borsa takibi. Quantum Pro AI sistemi ile %93+ doğruluk oranında trading sinyalleri.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LyDian Trader - AI Trading Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LyDian Trader - AI Destekli Trading',
    description: 'Yapay zeka ile kripto ve borsa takibi. %93+ doğruluk oranı.',
    images: ['/og-image.png'],
    creator: '@lydiantrader',
  },
  other: {
    'og:image:width': '1200',
    'og:image:height': '630',
    'og:image:type': 'image/png',
    'og:type': 'website',
  },
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
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased flex flex-col min-h-screen">
        <Navigation />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}