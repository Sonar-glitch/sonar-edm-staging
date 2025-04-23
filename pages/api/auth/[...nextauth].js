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
    domains: ['i.scdn.co'], // Allow Spotify image domains
  },
};