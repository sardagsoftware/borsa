/** @type {import('next').NextConfig} */
const crypto = require('crypto');
const withNextIntl = require('next-intl/plugin')('./i18n.ts');

const nextConfig = withNextIntl({
  // Remove output setting to use Vercel's default hosting
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
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
  // Bundle analyzer support
  env: {
    ANALYZE: process.env.ANALYZE,
  },
  // Performance optimizations
  transpilePackages: ['packages'],
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-slot',
      '@radix-ui/react-tooltip',
      'lucide-react',
      'framer-motion'
    ],
    webpackBuildWorker: true,
    outputFileTracingRoot: process.cwd(),
    serverComponentsExternalPackages: ['@prisma/client'],
    esmExternals: true,
  },
  // Skip static generation errors
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  // Docker geliştirme ortamı için optimizasyonlar
  webpack: (config, { isServer, dev }) => {
    // Add alias for packages directory
    config.resolve.alias = {
      ...config.resolve.alias,
      '@packages': './packages',
    };

    // Hot reload için polling aktif et
    if (!isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all'
          },
          ai: {
            test: /[\\/]node_modules[\\/](@ai-sdk|openai)[\\/]/,
            name: 'ai-chunk',
            priority: 10,
            chunks: 'all'
          },
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
            name: 'ui-chunk',
            priority: 10,
            chunks: 'all'
          }
        }
      };
      
      // Tree shaking optimizations
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config
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
          { key: 'Permissions-Policy', value: 'fullscreen=(self), microphone=(), camera=(), geolocation=(), picture-in-picture=(), display-capture=(), web-share=(self)' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-XSS-Protection', value: '1; mode=block' }
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex' },
          { key: 'Cache-Control', value: 'no-store, must-revalidate' }
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          }
        ]
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  },
})

module.exports = nextConfig
