import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ultra-fast optimization settings
  reactStrictMode: true,

  // Turbopack for development speed
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
      resolveAlias: {
        '@tensorflow/tfjs-node': '@tensorflow/tfjs',
      },
    },
    serverComponentsExternalPackages: ['@tensorflow/tfjs-node', '@mapbox/node-pre-gyp'],
  },

  // Production optimizations - Ultra code obfuscation & security
  compiler: {
    // Remove ALL console logs in production (including error/warn for stealth)
    removeConsole: process.env.NODE_ENV === 'production' ? true : false,
    // Minify and obfuscate in production
    styledComponents: true,
    // Remove all React DevTools hints
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },

  // Disable source maps in production for code protection
  productionBrowserSourceMaps: false,

  // Hide build info
  generateBuildId: async () => {
    // Use random hash instead of git commit
    return require('crypto').randomBytes(16).toString('hex');
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
  },

  // Compression
  compress: true,

  // Headers for speed and security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Webpack optimizations for 0.20ms TPS target
  webpack: (config, { dev, isServer }) => {
    // Externalize native node modules to prevent Turbopack errors
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@tensorflow/tfjs-node': 'commonjs @tensorflow/tfjs-node',
        '@mapbox/node-pre-gyp': 'commonjs @mapbox/node-pre-gyp',
      });
    }

    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            lib: {
              test(module: any) {
                return module.size() > 160000 && /node_modules[/\\]/.test(module.identifier());
              },
              name(module: any) {
                const hash = require('crypto').createHash('sha1');
                hash.update(module.identifier());
                return hash.digest('hex').substring(0, 8);
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
            },
            shared: {
              name(module: any, chunks: any) {
                return (
                  require('crypto')
                    .createHash('sha1')
                    .update(chunks.reduce((acc: string, chunk: any) => acc + chunk.name, ''))
                    .digest('hex') + (process.env.NODE_ENV === 'production' ? '_prod' : '_dev')
                );
              },
              priority: 10,
              minChunks: 2,
              reuseExistingChunk: true,
            },
          },
          maxInitialRequests: 25,
          minSize: 20000,
        },
      };
    }

    // SVG support
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },

  // Output standalone for maximum performance
  output: 'standalone',

  // Disable powered by header
  poweredByHeader: false,

  // Generate ETags
  generateEtags: true,

  // HTTP keep-alive
  httpAgentOptions: {
    keepAlive: true,
  },
};

export default nextConfig;