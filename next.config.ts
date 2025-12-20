import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: '*.pixabay.com',
      },
      {
        protocol: 'https',
        hostname: 'pixabay.com',
      }
    ],
  },
};

export default nextConfig;
