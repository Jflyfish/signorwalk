import { inter } from '@/cu/inter';
import { ChromeStyle } from '../cu/ChromeStyle';

export default function CreditUnionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.className} min-h-screen bg-white cu-ink`}>
      <ChromeStyle />
      <style>{'body > nav, body > footer { display: none !important; } body { background: #fff; }'}</style>
      {children}
    </div>
  );
}
