/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'https://mranalini.in/api/:path*' },

      { source: '/media/:id', destination: 'https://mranalini.in/api/media/:id' },
    ];
  },
};

module.exports = nextConfig;
