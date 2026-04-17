import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        // port: '', // можно оставить пустым
        // pathname: '/**', // разрешить все пути на этом домене
      },
    ],
  },
};

export default nextConfig;
