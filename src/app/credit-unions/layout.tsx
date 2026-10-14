import { inter } from '@/cu/inter';

export default function CreditUnionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.className} min-h-screen bg-white text-[#111]`}>
      <style>{'body > nav, body > footer { display: none !important; } body { background: #fff; }'}</style>
      {children}
    </div>
  );
}
