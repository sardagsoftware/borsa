/** @type {import('next').NextConfig} */
const crypto = require('crypto');
const withNextIntl = require('next-intl/plugin')('./i18n.ts');

const nextConfig = withNextIntl({
  output: 'standalone',
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
      },
      {
        protocol: 'https', 
        hostname: 'coin-images.coingecko.com',
      },
    ],
  },
  // Docker geliştirme ortamı için optimizasyonlar
  webpack: (config, { isServer }) => {
    // Hot reload için polling aktif et
    if (!isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config
  },
  // Experimental özellikler
  experimental: {
    // Docker içinde daha iyi performans
    outputFileTracingRoot: process.cwd(),
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // 🛡️ Security Headers
  async headers() {
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://*.vercel-analytics.com https://*.vercel.app;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https://*.binance.com https://*.coingecko.com;
              font-src 'self' data:;
              connect-src 'self' https://*.binance.com https://*.coingecko.com wss://*.binance.com;
              object-src 'none';
              base-uri 'none';
              frame-ancestors 'none';
              upgrade-insecure-requests;
            `.replace(/\s+/g, ' ').trim()
          },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
          { key: 'Permissions-Policy', value: 'fullscreen=(self), microphone=(), camera=(), geolocation=()' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex' },
          { key: 'Cache-Control', value: 'no-store, must-revalidate' }
        ],
      },
    ]
  },
})

module.exports = nextConfig
