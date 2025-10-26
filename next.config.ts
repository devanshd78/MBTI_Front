/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://localhost:4000/:path*' },

      { source: '/media/:id', destination: 'http://localhost:4000/media/:id' },
    ];
  },
};

module.exports = nextConfig;
