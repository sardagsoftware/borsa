/**
 * Performance Optimization Configuration
 * Enterprise-grade performance settings for LyDian Platform
 *
 * Based on Google's Web Vitals and industry best practices
 */

export default {
  // Performance budgets (in milliseconds or bytes)
  budgets: {
    // Core Web Vitals thresholds
    coreWebVitals: {
      LCP: 2500,  // Largest Contentful Paint (ms)
      FID: 100,   // First Input Delay (ms)
      CLS: 0.1,   // Cumulative Layout Shift (score)
      FCP: 1800,  // First Contentful Paint (ms)
      TTFB: 600,  // Time to First Byte (ms)
    },

    // Resource budgets
    resources: {
      javascript: 300 * 1024,   // 300 KB
      css: 100 * 1024,          // 100 KB
      images: 1000 * 1024,      // 1 MB total
      fonts: 100 * 1024,        // 100 KB
      total: 2000 * 1024,       // 2 MB total page weight
    },

    // Request counts
    requests: {
      total: 50,
      javascript: 10,
      css: 5,
      images: 20,
      fonts: 5,
    },
  },

  // Image optimization settings
  images: {
    formats: ['webp', 'avif', 'jpg'],
    quality: {
      webp: 85,
      avif: 80,
      jpg: 85,
    },
    sizes: {
      thumbnail: { width: 150, height: 150 },
      small: { width: 320, height: 240 },
      medium: { width: 640, height: 480 },
      large: { width: 1280, height: 960 },
      xlarge: { width: 1920, height: 1440 },
    },
    lazy: true,
    placeholder: 'blur',
  },

  // Cache strategy
  cache: {
    // Browser cache (Cache-Control headers)
    browser: {
      static: {
        maxAge: 31536000,     // 1 year for static assets
        immutable: true,
      },
      dynamic: {
        maxAge: 3600,         // 1 hour for dynamic content
        staleWhileRevalidate: 86400, // 1 day
      },
      api: {
        maxAge: 300,          // 5 minutes for API responses
        staleWhileRevalidate: 600, // 10 minutes
      },
    },

    // Redis cache (server-side)
    redis: {
      ttl: {
        default: 3600,        // 1 hour
        short: 300,           // 5 minutes
        medium: 1800,         // 30 minutes
        long: 86400,          // 1 day
      },
      keyPrefix: 'lydian:',
    },
  },

  // CDN configuration
  cdn: {
    enabled: process.env.NODE_ENV === 'production',
    domains: [
      'cdn.lydian.ai',
      'assets.lydian.ai',
    ],
    fallback: '/public',
  },

  // Bundle optimization
  bundles: {
    splitting: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
    minify: process.env.NODE_ENV === 'production',
    sourceMaps: process.env.NODE_ENV === 'development',
  },

  // Compression
  compression: {
    enabled: true,
    algorithms: ['br', 'gzip'],  // Brotli preferred, gzip fallback
    threshold: 1024,              // Min size to compress (bytes)
    level: 6,                     // Compression level (1-9)
  },

  // Preload/Prefetch hints
  resourceHints: {
    preconnect: [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ],
    dns-prefetch: [
      'https://api.lydian.ai',
    ],
    preload: [
      { href: '/fonts/inter.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
    ],
  },

  // Lazy loading configuration
  lazyLoading: {
    images: {
      enabled: true,
      threshold: '50px',      // Load when 50px from viewport
      placeholder: 'blur',
    },
    components: {
      enabled: true,
      routes: [
        '/chat',
        '/research',
        '/video-ai',
        '/image-generation',
      ],
    },
  },

  // Critical CSS extraction
  criticalCSS: {
    enabled: process.env.NODE_ENV === 'production',
    inline: true,              // Inline critical CSS
    minify: true,
    dimensions: [
      { width: 1920, height: 1080 },  // Desktop
      { width: 375, height: 667 },    // Mobile
    ],
  },

  // Font optimization
  fonts: {
    display: 'swap',           // Use font-display: swap
    preload: true,
    subset: true,              // Subset fonts to required glyphs
    formats: ['woff2', 'woff'],
  },

  // JavaScript optimization
  javascript: {
    treeshake: true,
    deadCodeElimination: true,
    minify: process.env.NODE_ENV === 'production',
    modernBuild: true,         // Separate modern/legacy builds
  },

  // Monitoring thresholds
  monitoring: {
    alerts: {
      LCP: { warning: 2500, critical: 4000 },
      FID: { warning: 100, critical: 300 },
      CLS: { warning: 0.1, critical: 0.25 },
      errorRate: { warning: 0.01, critical: 0.05 },  // 1% / 5%
    },
    sampling: {
      performance: 1.0,        // 100% sampling
      errors: 1.0,
    },
  },
};
