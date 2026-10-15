import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://signorwalk.com'),
};

export default function CreditUnionRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/cu/icon" type="image/png" sizes="32x32" />
      </head>
      <body className="min-h-screen bg-white">
        {children}
      </body>
    </html>
  );
}
