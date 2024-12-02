const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    // Add path alias configuration
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname),
      '@/components': path.join(__dirname, 'components'),
      '@/lib': path.join(__dirname, 'lib'),
      '@/app': path.join(__dirname, 'app'),
    };
    return config;
  },
  
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: [],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src * 'unsafe-inline' 'unsafe-eval' data: blob: filesystem:;
              script-src * 'unsafe-inline' 'unsafe-eval' data: blob: filesystem:;
              style-src * 'unsafe-inline' data: blob: filesystem:;
              font-src * data: blob: filesystem:;
              connect-src * data: blob: filesystem:;
              img-src * data: blob: filesystem:;
              frame-src * data: blob: filesystem:;
              frame-ancestors * data: blob: filesystem:;
              worker-src * data: blob: filesystem:;
              media-src * data: blob: filesystem:;
            `.replace(/\s+/g, ' ').trim(),
          },
        ],
      },
    ];
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
}

module.exports = nextConfig;
