import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The root layout reads a pathname header, so pages render dynamically.
  // Blocking metadata keeps title, icons, and social tags inside <head>.
  htmlLimitedBots: /.*/,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/',
        headers: [
          {
            key: 'Impact-Site-Verification',
            value: 'e7de6a6f-016b-4648-9f9c-158540f33c60',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
