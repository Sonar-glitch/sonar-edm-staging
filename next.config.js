/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Disable experimental features that might cause issues
    appDir: false,
    optimizeCss: false,
    serverComponentsExternalPackages: [],
  },
}

module.exports = nextConfig
