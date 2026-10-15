import { inter } from '@/cu/inter';
import { ChromeStyle } from './ChromeStyle';
import { DealStorageReset } from './[tenant]/DealStorageReset';

/**
 * TODO(owner): The consumer header and footer are still in the DOM on these pages.
 * CSS hides them. Taking them out of the DOM means editing src/app/layout.tsx past the
 * one footer link, and that change is blocked until the owner approves it.
 * Do not expand the root layout in this pass.
 */
export default function CuRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.className} min-h-screen bg-white cu-ink`}>
      <ChromeStyle />
      <style>{`
        body > nav, body > footer { display: none !important; }
        body { background: #fff; }
      `}</style>
      <DealStorageReset />
      {children}
    </div>
  );
}
