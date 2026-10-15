import type { Metadata } from 'next';
import { inter } from '@/cu/inter';
import { ChromeStyle } from '../cu/ChromeStyle';

export const metadata: Metadata = {
  icons: {
    icon: [{ url: '/credit-unions/icon', type: 'image/png', sizes: '32x32' }],
  },
};

export default function CreditUnionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.className} min-h-screen bg-white cu-ink`}>
      <ChromeStyle />
      {children}
    </div>
  );
}
