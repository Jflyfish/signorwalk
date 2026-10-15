import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { ConsumerTrackers } from '@/components/ConsumerTrackers';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://signorwalk.com'),
  title: 'Sign or Walk — Know Before You Sign',
  description: 'Free AI-powered car deal grader. Get an honest grade on your lease or finance deal — every red flag, every number, word-for-word negotiation script.',
  openGraph: {
    title: 'Sign or Walk — Know Before You Sign',
    description: 'Free AI-powered car deal grader. Grade your lease or finance deal in seconds.',
    type: 'website',
    url: 'https://signorwalk.com',
    siteName: 'Sign or Walk',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Sign or Walk — Know Before You Sign' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign or Walk — Know Before You Sign',
    description: 'Free AI-powered car deal grader. Grade your lease or finance deal in seconds.',
    images: ['/opengraph-image'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ConsumerTrackers />
      </head>
      <body className="min-h-screen bg-slate-50">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
