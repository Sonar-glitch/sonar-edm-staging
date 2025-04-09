/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Disable static exports completely
  output: 'standalone',
  
  // Customize the build process
  webpack: (config, { isServer }) => {
    // Add any webpack customizations here
    return config;
  },
  
  // Disable automatic static optimization for authenticated pages
  unstable_runtimeJS: true,
  
  // Specify which pages should not be statically optimized
  unstable_excludeDefaultMomentLocales: true
};

module.exports = nextConfig;
