import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  logging: {
    fetches: {
      fullUrl: false,
      hmrRefreshes: false,
    },
  },
  

  async headers() {
    return [
      {

        source: '/:path*',
        headers: [

          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },

          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },

          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },

          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },

          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()'
          },

          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },

          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          }
        ],
      },
      {

        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          }
        ]
      }
    ];
  },

  poweredByHeader: false,
  

  images: {
    domains: [],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
