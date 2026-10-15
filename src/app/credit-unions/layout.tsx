import { inter } from '@/cu/inter';
import { ChromeStyle } from '../cu/ChromeStyle';

export default function CreditUnionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.className} min-h-screen bg-white cu-ink`}>
      <ChromeStyle />
      {children}
    </div>
  );
}
