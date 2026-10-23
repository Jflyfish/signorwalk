import type { Metadata } from 'next';
import '../globals.css';
import './cu-chrome.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://signorwalk.com'),
  icons: {
    icon: [{ url: '/cu/icon', type: 'image/png', sizes: '32x32' }],
  },
};

export default function CreditUnionRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">
        {children}
      </body>
    </html>
  );
}
