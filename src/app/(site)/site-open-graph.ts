import type { Metadata } from 'next';

/**
 * The image file lives in this route group, so Next publishes it at
 * /opengraph-image-12o0cb. These tags stay on /opengraph-image, which is
 * rewritten to that file. The query is the image content hash from main.
 * Key order is the order Next emits the meta tags.
 */
export const siteOpenGraphImages = [
  {
    alt: 'Sign or Walk — Know Before You Sign',
    type: 'image/png',
    url: '/opengraph-image?315799c41c949b91',
    width: 1200,
    height: 630,
  },
] satisfies NonNullable<Metadata['openGraph']>['images'];

export const siteOpenGraph = {
  title: 'Sign or Walk — Know Before You Sign',
  description: 'Free AI-powered car deal grader. Grade your lease or finance deal in seconds.',
  url: 'https://signorwalk.com',
  siteName: 'Sign or Walk',
  type: 'website',
  images: siteOpenGraphImages,
} satisfies Metadata['openGraph'];
