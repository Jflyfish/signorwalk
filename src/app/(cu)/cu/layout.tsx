import { DealStorageReset } from './[tenant]/DealStorageReset';

export default function CuRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white cu-ink">
      <DealStorageReset />
      {children}
    </div>
  );
}
