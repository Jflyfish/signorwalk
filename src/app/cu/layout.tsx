import { inter } from '@/cu/inter';
import { ChromeStyle } from './ChromeStyle';
import { DealStorageReset } from './[tenant]/DealStorageReset';

export default function CuRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.className} min-h-screen bg-white cu-ink`}>
      <ChromeStyle />
      <DealStorageReset />
      {children}
    </div>
  );
}
