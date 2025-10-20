import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'UKALAI - Professional Crypto Trading AI',
    short_name: 'UKALAI',
    description: 'Professional crypto market analysis with AI-powered trading intelligence. 93-95% success rate with 6 advanced strategies.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0e1a',
    theme_color: '#3b82f6',
    orientation: 'portrait-primary',
    scope: '/',
    icons: [
      {
        src: '/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['finance', 'business', 'productivity'],
    shortcuts: [
      {
        name: 'Market Overview',
        short_name: 'Market',
        description: 'View real-time market data',
        url: '/market',
        icons: [{ src: '/icon-96x96.png', sizes: '96x96' }],
      },
      {
        name: 'Charts',
        short_name: 'Charts',
        description: 'Technical analysis charts',
        url: '/charts',
        icons: [{ src: '/icon-96x96.png', sizes: '96x96' }],
      },
    ],
  };
}
