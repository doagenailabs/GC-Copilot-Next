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
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' https://sdk-cdn.mypurecloud.com;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              font-src 'self' https://fonts.gstatic.com;
              connect-src 'self' 
                https://*.mypurecloud.* 
                https://*.pure.cloud
                https://*.us-gov-pure.cloud
                wss://*.mypurecloud.* 
                wss://*.pure.cloud
                wss://*.us-gov-pure.cloud
                https://api.openai.com;
              img-src 'self' data: https:;
              frame-ancestors 'self' https://*.salesforce.com https://*.force.com;
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
