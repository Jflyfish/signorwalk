import type { Metadata } from 'next';
import Link from 'next/link';
import { AI_FACTS, PILOT_MARK } from '@/cu/copy';
import { OwnerOpenList } from '@/cu/OwnerOpenList';
import { TALK_TO_US_EMAIL } from '../pricing';

export const metadata: Metadata = {
  title: 'Privacy — Sign or Walk',
  description: 'Draft description of what this pilot stores and what it sends to Anthropic. Pending counsel review.',
  robots: { index: false, follow: false },
};

const link = 'font-semibold cu-ink underline decoration-1 underline-offset-4 cu-linkline cu-ring';

export default function CreditUnionPrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-[640px] px-4 py-16 md:py-24">
      <p className="text-[15px] font-semibold leading-[20px]">Sign or Walk</p>
      <p className="mt-10 text-[14px] font-semibold leading-[20px]">{PILOT_MARK}</p>
      <h1 className="mt-4 text-[32px] font-extrabold leading-[38px]">Privacy</h1>
      <p className="mt-6 text-[18px] leading-[28px] cu-muted">
        This page describes what the current build does. It is not a privacy policy and not legal advice.
      </p>

      <h2 className="mt-10 text-[24px] font-bold leading-[30px]">What leaves the credit union’s control</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-[18px] leading-[28px]">
        {AI_FACTS.map(line => <li key={line}>{line}</li>)}
      </ul>

      <h2 className="mt-10 text-[24px] font-bold leading-[30px]">What this application stores</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-[18px] leading-[28px]">
        <li>Credit union profile: name, contact name, work email, and optional website.</li>
        <li>Branding, settings, and per-tenant integers only: grades run, loan-application clicks, worksheet uploads, and a count of each letter grade. Not the worksheet and not the numbers from it. A sample grade (?sample=1) is not added to those integers.</li>
        <li>A scrypt hash of the staff login. The stored text is not the password.</li>
        <li>Audit lines: time, action, id, and who. Not a member file.</li>
      </ul>
      <p className="mt-6 text-[18px] leading-[28px] cu-muted">
        The member form does not ask for a name, email, or account number. The grade is rules in this application (template pack tp-1.0.0). A model does not write the sentences a member reads.
      </p>
      <p className="mt-6 text-[18px] leading-[28px] cu-muted">
        When email delivery is configured, Resend sends the trial confirmation to the staff email, a signup notice to the operator address, and an optional summary of aggregate counts. Resend does not receive the worksheet. Completing a grade does not send a Vercel Analytics analysis_completed event. The credit-union layout still loads Vercel Analytics for page views.
      </p>
      <p className="mt-6 text-[18px] leading-[28px] cu-muted">
        There is no connection in this code to a core, online banking, or loan origination system. Online checkout is not built. The trial form does not ask for a card.
      </p>

      <h2 className="mt-10 text-[24px] font-bold leading-[30px]">The owner still has to supply</h2>
      <OwnerOpenList />

      <p className="mt-10 text-[18px] leading-[28px]">
        <Link href="/credit-unions/terms" className={link}>Terms</Link>
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
