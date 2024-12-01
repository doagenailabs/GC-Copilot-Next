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
    return config;
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
                https://*.mypurecloud.com 
                https://*.pure.cloud 
                wss://*.mypurecloud.com 
                wss://*.pure.cloud
                https://api.openai.com;
              img-src 'self' data: https:;
              frame-ancestors 'self' https://*.salesforce.com https://*.force.com;
            `.replace(/\s+/g, ' ').trim(),
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig;
