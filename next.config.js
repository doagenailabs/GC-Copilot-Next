/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk-cdn.mypurecloud.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk-cdn.mypurecloud.com;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
