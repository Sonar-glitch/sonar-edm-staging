// /c/sonar/users/sonar-edm-user/next.config.js
const path = require('path');

module.exports = {
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
  experimental: {
    optimizeCss: true,
  },
  images: {
    domains: ['i.scdn.co', 'mosaic.scdn.co', 'platform-lookaside.fbsbx.com', 'image-cdn-fa.spotifycdn.com'],
    minimumCacheTTL: 1800,
  },
};
