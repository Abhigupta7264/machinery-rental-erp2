/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Support image domains or API proxy if needed
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
    ];
  },
};

export default nextConfig;

