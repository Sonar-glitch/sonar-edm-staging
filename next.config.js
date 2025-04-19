/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true
});

const withOptimizedImages = require('next-optimized-images');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true, // Use SWC minifier for better performance
  images: {
    domains: ['i.scdn.co', 'mosaic.scdn.co', 'platform-lookaside.fbsbx.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // 24 hours
  },
  experimental: {
    optimizeCss: true, // Enable CSS optimization
    optimizeServerReact: true, // Optimize server-side React rendering
    scrollRestoration: true, // Restore scroll position on navigation
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Remove console logs in production
  },
  webpack: (config, { dev, isServer }) => {
    // Split chunks optimization
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 70000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        automaticNameDelimiter: '~',
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          styles: {
            name: 'styles',
            test: /\.css$/,
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }
    return config;
  },
};

// Apply optimizations in sequence
module.exports = withPWA(withOptimizedImages(nextConfig));
