import type { Viewport } from 'next';
import { inter } from '@/cu/inter';
import { DealStorageReset } from './[tenant]/DealStorageReset';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function CuRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.className} min-h-screen bg-white cu-ink`}>
      <DealStorageReset />
      {children}
    </div>
  );
}
