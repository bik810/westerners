/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/storage/:path*',
        destination: 'https://firebasestorage.googleapis.com/v0/b/westerners-63a9d.appspot.com/:path*',
      },
    ];
  },
};

export default nextConfig;
