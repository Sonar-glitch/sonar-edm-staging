/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Disable static optimization for pages that use authentication
  experimental: {
    // other experimental options...
  },
  
  // Configure static generation
  exportPathMap: function() {
    return {
      // Only include pages that don't require authentication
      '/api/prediction': { page: '/api/prediction' },
      // Add other non-authenticated pages here
    };
  }
};

module.exports = nextConfig;
