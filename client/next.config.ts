import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: {
    root: __dirname,
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/uploads/**',
      },
      { protocol: 'https', hostname: 'ai-wardrobe.ru', pathname: '/uploads/**' },
    ],
  },
};
export default nextConfig;
