import Link from 'next/link';
import { AI_FACTS, PILOT_MARK } from '@/cu/copy';

const link = 'font-semibold cu-ink underline decoration-1 underline-offset-4 cu-linkline cu-ring';

export function AiDisclosure() {
  return (
    <div className="mt-10 text-[14px] leading-[20px] cu-muted">
      <p className="font-semibold cu-ink">{PILOT_MARK}</p>
      {AI_FACTS.map(line => (
        <p key={line} className="mt-2">{line}</p>
      ))}
      <p className="mt-4">
        <Link href="/credit-unions/privacy" className={link}>Privacy</Link>
        {' · '}
        <Link href="/credit-unions/terms" className={link}>Terms</Link>
        {' · '}
        <a href="/credit-unions/packet" className={link}>Due-diligence packet</a>
      </p>
    </div>
  );
}
