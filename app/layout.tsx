import './globals.css';
import './styles/design.css';
import './styles/type.css';
import './styles/premium.css'; // Premium tema aktif
import './styles/logo.css'; // Logo stilleri
import { Inter, Space_Grotesk } from 'next/font/google';
import type { Metadata } from 'next';
import { COPYRIGHT_NOTICE, getCopyrightBanner } from '@/lib/copyright';

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

export const metadata: Metadata = {
  title: `${COPYRIGHT_NOTICE.project} - ${COPYRIGHT_NOTICE.owner}`,
  description: `© ${COPYRIGHT_NOTICE.year} ${COPYRIGHT_NOTICE.owner} - Gelişmiş AI destekli kripto para trading platformu. Ultra güvenli, Binance API, otomatik bot, teknik analiz ve portföy yönetimi. ${COPYRIGHT_NOTICE.rights}`,
  authors: [{ name: COPYRIGHT_NOTICE.owner, url: COPYRIGHT_NOTICE.contact.website }],
  creator: COPYRIGHT_NOTICE.owner,
  publisher: COPYRIGHT_NOTICE.company,
  keywords: [
    'AILYDIAN', 'AI Lens Pro', 'Crypto Trading', 'Emrah Şardağ', 'Sardag Software',
    'Bitcoin', 'Ethereum', 'Binance', 'Kripto Para', 'Trading Bot', 'AI Trading',
    'Blockchain', 'DeFi', 'NFT', 'Web3', 'Cryptocurrency', 'Portfolio Management',
    'Technical Analysis', 'Automated Trading', 'Güvenli Trading', 'Profesyonel'
  ],
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
    title: `${COPYRIGHT_NOTICE.project} - Ultra Güvenli AI Kripto Trading`,
    description: `© ${COPYRIGHT_NOTICE.year} ${COPYRIGHT_NOTICE.owner} - Profesyonel kripto para trading platformu. Binance API, AI bot, güvenlik ve analiz.`,
    url: 'https://ailydian.com',
    siteName: COPYRIGHT_NOTICE.project,
    images: [
      {
        url: '/images/ailydian-og-image.jpg',
        width: 1200,
        height: 630,
        alt: `${COPYRIGHT_NOTICE.project} - AI Kripto Trading Platform`
      }
    ],
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${COPYRIGHT_NOTICE.project} - AI Crypto Trading`,
    description: `© ${COPYRIGHT_NOTICE.year} ${COPYRIGHT_NOTICE.owner} - Ultra güvenli AI destekli kripto trading platformu`,
    images: ['/images/ailydian-twitter-card.jpg'],
    creator: '@EmrahSardag',
    site: '@AILydianPro'
  },
  verification: {
    google: 'your-google-site-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
    other: {
      me: ['mailto:info@ailydian.com', 'https://ailydian.com']
    }
  },
  alternates: {
    canonical: 'https://ailydian.com',
    languages: {
      'tr': 'https://ailydian.com',
      'en': 'https://ailydian.com/en',
      'ar': 'https://ailydian.com/ar',
      'fa': 'https://ailydian.com/fa',
      'fr': 'https://ailydian.com/fr',
      'de': 'https://ailydian.com/de',
      'nl': 'https://ailydian.com/nl',
    },
  },
  other: {
    'copyright': `© ${COPYRIGHT_NOTICE.year} ${COPYRIGHT_NOTICE.owner}`,
    'license': COPYRIGHT_NOTICE.license,
    'developer': COPYRIGHT_NOTICE.contact.developer
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Console'a telif hakları uyarısı yazdır
  if (typeof window !== 'undefined') {
    console.log(getCopyrightBanner());
    console.warn('⚠️ UYARI: Bu yazılım telif hakları ile korunmaktadır!');
    console.warn('📧 Lisans: licensing@ailydian.com');
  }

  return (
    <html lang="tr" dir="ltr" className="dark" data-theme="premium"> {/* Premium tema aktif */}
      <head>
        <meta name="copyright" content={`© ${COPYRIGHT_NOTICE.year} ${COPYRIGHT_NOTICE.owner}`} />
        <meta name="author" content={COPYRIGHT_NOTICE.owner} />
        <meta name="developer" content={COPYRIGHT_NOTICE.contact.developer} />
        <meta name="license" content={COPYRIGHT_NOTICE.license} />
        {/* Telif koruması için */}
        <meta name="robots" content="noindex, nofollow" />
        <style>{`
          /* Telif hakları footer */
          .copyright-footer::after {
            content: "© ${COPYRIGHT_NOTICE.year} ${COPYRIGHT_NOTICE.owner} - ${COPYRIGHT_NOTICE.rights}";
            position: fixed;
            bottom: 0;
            right: 0;
            font-size: 10px;
            opacity: 0.7;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 2px 8px;
            border-radius: 4px 0 0 0;
            z-index: 9999;
            pointer-events: none;
          }
        `}</style>
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-inter bg-bg text-text antialiased copyright-footer`}>
        {children}
      </body>
    </html>
  );
}
