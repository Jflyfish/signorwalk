import type { NextConfig } from 'next';

/** Route-group Open Graph files are published with this suffix. /opengraph-image stays the public URL. */
function groupSuffix(parentPath: string): string {
  let hash = 5381;
  for (let i = 0; i < parentPath.length; i++) {
    hash = (hash << 5) + hash + parentPath.charCodeAt(i) & 0xffffffff;
  }
  return (hash >>> 0).toString(36).slice(0, 6);
}

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/opengraph-image',
        destination: `/opengraph-image-${groupSuffix('/(site)')}`,
      },
    ];
  },
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
