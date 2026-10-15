import type { Metadata } from 'next';
import Link from 'next/link';
import { PILOT_MARK } from '@/cu/copy';
import { OWNER_OPEN_ITEMS } from '@/cu/owner-open-items';
import { TALK_TO_US_EMAIL } from '../pricing';

export const metadata: Metadata = {
  title: 'Terms — Sign or Walk',
  description: 'Draft notes for a 90-day pilot. Pending counsel review. Not a contract.',
  robots: { index: false, follow: false },
};

const link = 'font-semibold cu-ink underline decoration-1 underline-offset-4 cu-linkline cu-ring';

export default function CreditUnionTermsPage() {
  return (
    <main className="mx-auto w-full max-w-[640px] px-4 py-16 md:py-24">
      <p className="text-[15px] font-semibold leading-[20px]">Sign or Walk</p>
      <p className="mt-10 text-[14px] font-semibold leading-[20px]">{PILOT_MARK}</p>
      <h1 className="mt-4 text-[32px] font-extrabold leading-[38px]">Terms</h1>
      <p className="mt-6 text-[18px] leading-[28px] cu-muted">
        This page is a draft of how the pilot works in this build. It is not a contract, not an offer that can be accepted by email, and not legal advice.
      </p>
      <ul className="mt-6 list-disc space-y-2 pl-5 text-[18px] leading-[28px]">
        <li>A credit union can start a 90-day trial. The form does not ask for a card. Online checkout is not built.</li>
        <li>The trial stays unverified until the email link is opened. Until then the public check, embed, and worksheet read stay off. The dashboard opens. Saves stay off.</li>
        <li>The grade compares numbers with labeled ranges. It is not the credit union’s rate, not an offer of credit, and not a guarantee of savings.</li>
        <li>List prices are on the plans page. What happens after 90 days, and whether the pilot can end early, are open.</li>
      </ul>

      <h2 className="mt-10 text-[24px] font-bold leading-[30px]">The owner still has to supply</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-[18px] leading-[28px]">
        {OWNER_OPEN_ITEMS.map(item => <li key={item}>{item}</li>)}
      </ul>

      <p className="mt-10 text-[18px] leading-[28px]">
        <Link href="/credit-unions/privacy" className={link}>Privacy</Link>
        {' · '}
        <a href="/credit-unions/packet" className={link}>Due-diligence packet</a>
      </p>
      <p className="mt-6">
        <a href={`mailto:${TALK_TO_US_EMAIL}`} className={link}>{TALK_TO_US_EMAIL}</a>
      </p>
      <p className="mt-10">
        <Link href="/credit-unions" className={link}>← Back to plans</Link>
      </p>
    </main>
  );
}
