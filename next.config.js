/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['i.scdn.co', 'images.ticketmaster.com'],
  },
  // Remove experimental features that might cause issues
  // experimental: {
  //   optimizeCss: true,
  // },
}

module.exports = nextConfig
