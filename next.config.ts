import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
