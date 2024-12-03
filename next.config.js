/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false
      };
    }
    return config;
  },
  // Ensure the SDK is transpiled
  transpilePackages: ['purecloud-platform-client-v2', 'purecloud-client-app-sdk']
}

module.exports = nextConfig;
