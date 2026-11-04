import type { Metadata, Viewport } from 'next';
import { inter } from '@/cu/inter';
import '../globals.css';
import './cu-chrome.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://signorwalk.com'),
  icons: {
    icon: [{ url: '/cu/icon', type: 'image/png', sizes: '32x32' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function CreditUnionRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-white`}>
        {children}
      </body>
    </html>
  );
}
