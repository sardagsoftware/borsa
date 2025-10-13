/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          // Allow embedding from Lydian main app (development & production)
          // Note: X-Frame-Options ALLOW-FROM is deprecated but kept for legacy browser support
          // Modern browsers use CSP frame-ancestors directive instead
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' http://localhost:3000 https://www.ailydian.com https://ailydian.com"
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Enable camera, microphone, geolocation for WebRTC video calls and location sharing
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(self)' }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
