/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        browser: false,
        'purecloud-platform-client-v2': require.resolve('purecloud-platform-client-v2')
      };
    }
    return config;
  },
  transpilePackages: ['purecloud-platform-client-v2', 'purecloud-client-app-sdk']
}

module.exports = nextConfig;
