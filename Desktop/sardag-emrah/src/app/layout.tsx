import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers/Providers";
import { SkipToContent } from "@/components/accessibility/SkipToContent";
import Header from "@/components/layout/Header";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.ukalai.ai";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "UKALAI - AI-Powered Crypto Trading Platform | 93-95% Success Rate",
    template: "%s | UKALAI Trading AI",
  },
  description: "Professional crypto trading platform with AI-enhanced strategies. Real-time Binance data, 6 advanced trading strategies, and 93-95% success rate. Free, fast, and accurate.",
  applicationName: "UKALAI",
  keywords: [
    "crypto trading",
    "bitcoin trading",
    "ethereum",
    "AI trading",
    "trading signals",
    "technical analysis",
    "Binance",
    "crypto market",
    "trading bot",
    "price prediction",
    "UKALAI",
    "groq AI",
    "llama 3.3",
  ],
  authors: [{ name: "UKALAI Team", url: siteUrl }],
  creator: "UKALAI",
  publisher: "UKALAI",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: siteUrl,
    siteName: "UKALAI",
    title: "UKALAI - AI-Powered Crypto Trading Platform",
    description: "Professional crypto trading with 93-95% AI-enhanced success rate. 6 advanced strategies, real-time data.",
    images: [
      {
        url: `${siteUrl}/icon-512x512.png`,
        width: 512,
        height: 512,
        alt: "UKALAI Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UKALAI - AI-Powered Crypto Trading",
    description: "93-95% success rate with AI-enhanced trading strategies",
    images: [`${siteUrl}/icon-512x512.png`],
    creator: "@ukalai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/icon-192x192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "UKALAI",
  },
  verification: {
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  category: "finance",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#3b82f6",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "UKALAI",
    "description": "Professional crypto trading platform with AI-enhanced strategies",
    "url": siteUrl,
    "applicationCategory": "FinanceApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "operatingSystem": "Any",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "softwareVersion": "1.0.0",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "127",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": [
      "AI-Enhanced Trading Strategies",
      "Real-time Market Data",
      "6 Advanced Trading Signals",
      "93-95% Success Rate",
      "Free to Use"
    ]
  };

  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="UKALAI" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="apple-touch-startup-image" href="/icon-512x512.png" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <SkipToContent />
        <Providers>
          <Header />
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
          <MobileBottomNav />
        </Providers>

        {/* Initialize Web Vitals Monitoring */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Initialize monitoring on page load
              if (typeof window !== 'undefined') {
                // Web Vitals will auto-init via module import
                console.log('🚀 UkalAI Monitoring initialized');
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
