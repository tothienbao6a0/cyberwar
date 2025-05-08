/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // This is to handle the canvas package in development
    if (!config.resolve.fallback) {
      config.resolve.fallback = {};
    }
    config.resolve.fallback.canvas = false;

    return config;
  },
}

module.exports = nextConfig 