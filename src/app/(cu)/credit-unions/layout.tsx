import type { Metadata } from 'next';
import { inter } from '@/cu/inter';

export const metadata: Metadata = {
  icons: {
    icon: [{ url: '/credit-unions/icon', type: 'image/png', sizes: '32x32' }],
  },
  openGraph: {
    images: [{
      alt: 'Help your members spot a bad car deal before they sign.',
      type: 'image/png',
      url: '/credit-unions/opengraph-image',
      width: 1200,
      height: 630,
    }],
  },
};

export default function CreditUnionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.className} min-h-screen bg-white cu-ink`}>
      {children}
    </div>
  );
}
