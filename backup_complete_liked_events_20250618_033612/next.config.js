/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Disable experimental features that might cause issues
    appDir: false,
    serverComponentsExternalPackages: []
  }
};

module.exports = nextConfig;
