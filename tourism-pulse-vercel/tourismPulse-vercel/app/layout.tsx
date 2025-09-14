import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Providers } from '@/components/providers'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6'
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://travel.ailaydian.com'),
  title: {
    default: 'TourismPulse AI - Intelligent Travel Platform',
    template: '%s | TourismPulse AI'
  },
  description: 'AI-powered travel planning platform with smart recommendations, real-time booking, and personalized experiences.',
  keywords: [
    'travel',
    'tourism',
    'AI',
    'artificial intelligence',
    'booking',
    'hotels',
    'flights',
    'restaurants',
    'activities',
    'travel planning',
    'vacation',
    'trip',
    'ailaydian'
  ],
  authors: [
    {
      name: 'TourismPulse AI Team',
      url: 'https://travel.ailaydian.com'
    }
  ],
  creator: 'TourismPulse AI',
  publisher: 'Ailaydian',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://travel.ailaydian.com',
    siteName: 'TourismPulse AI',
    title: 'TourismPulse AI - Intelligent Travel Platform',
    description: 'AI-powered travel planning with smart recommendations and real-time booking',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'TourismPulse AI - Intelligent Travel Platform'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TourismPulse AI - Intelligent Travel Platform',
    description: 'AI-powered travel planning with smart recommendations',
    creator: '@ailaydian',
    images: ['/og-image.jpg']
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  verification: {
    google: 'your-google-site-verification',
    yandex: 'your-yandex-verification',
    yahoo: 'your-yahoo-verification',
  },
  alternates: {
    canonical: 'https://travel.ailaydian.com',
    languages: {
      'tr-TR': 'https://travel.ailaydian.com/tr',
      'en-US': 'https://travel.ailaydian.com/en',
      'de-DE': 'https://travel.ailaydian.com/de',
    }
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" className={inter.variable} suppressHydrationWarning>
      <head />
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
