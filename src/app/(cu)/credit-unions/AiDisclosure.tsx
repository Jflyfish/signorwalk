import Link from 'next/link';
import { PILOT_MARK } from '@/cu/copy';
import { UploadDisclosure } from '@/cu/UploadDisclosure';

const link = 'font-semibold cu-ink underline decoration-1 underline-offset-4 cu-linkline cu-ring';

export function AiDisclosure() {
  return (
    <div className="mt-10 text-[14px] leading-[20px] cu-muted">
      <p className="font-semibold cu-ink">{PILOT_MARK}</p>
      <p className="mt-2"><UploadDisclosure /> The longer description is on the privacy page.</p>
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
