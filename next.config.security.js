// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable edge runtime for specific routes
  experimental: {
    serverComponentsExternalPackages: ['prisma', '@prisma/client'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Ownership',
            value: 'AILYDIAN-AI-LENS-TRADER-Emrah-Sardag-2024'
          }
        ],
      },
    ];
  },

  // Webpack configuration for edge compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },

  // CRON job support
  async redirects() {
    return [
      {
        source: '/sec/cron/:path*',
        destination: '/api/sec/cron/:path*',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
