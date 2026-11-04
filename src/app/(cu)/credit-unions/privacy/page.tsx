import type { Metadata } from 'next';
import Link from 'next/link';
import { PILOT_MARK } from '@/cu/copy';
import { TALK_TO_US_EMAIL } from '../pricing';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'Draft notes for what this check stores. Pending counsel review.',
  robots: { index: false, follow: false },
};

const link = 'underline decoration-1 underline-offset-4 cu-ring';

export default function CreditUnionPrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-[640px] px-4 py-16 text-[#111] md:py-24">
      <p className="text-[14px] font-semibold leading-[20px]">{PILOT_MARK}</p>
      <h1 className="mt-4 text-[32px] font-extrabold leading-[38px]">Privacy</h1>
      <p className="mt-6 text-[16px] leading-[24px] text-[#555]">
        This page is about the Sign or Walk check a credit union offers its members. It is not that credit union’s own privacy notice.
      </p>

      <h2 className="mt-10 text-[20px] font-bold leading-[28px]">What we collect</h2>
      <p className="mt-4 text-[16px] leading-[24px]">
        Vercel hosts the application. Credit-union records sit in a database we run for this product.
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-[16px] leading-[24px]">
        <li>Staff login: the work email and a hash of the password. The password itself is not stored.</li>
        <li>Branding: the short name, colors, and an optional logo.</li>
        <li>Counters: how many grades were run, and how many times the loan button was clicked. Those are numbers only.</li>
      </ul>
      <p className="mt-4 text-[16px] leading-[24px]">
        The credit union’s name and the loan and rates links are kept with that record. When a credit union starts a trial, we email {TALK_TO_US_EMAIL} that the trial started. That note names the credit union, not a member.
      </p>

      <h2 className="mt-10 text-[20px] font-bold leading-[28px]">What we don&apos;t</h2>
      <p className="mt-4 text-[16px] leading-[24px]">
        The check does not ask a member for a name, an email, or an account number. We do not store the worksheet or the numbers from it. We don&apos;t take payments on this site.
      </p>
      <p className="mt-4 text-[16px] leading-[24px]">
        If a member uploads a worksheet, the file is sent to an outside AI service to read the numbers. It may show a name or VIN. We don&apos;t store it.
      </p>

      <h2 className="mt-10 text-[20px] font-bold leading-[28px]">How long we keep a grade</h2>
      <p className="mt-4 text-[16px] leading-[24px]">
        We do not keep the grade. The result is shown for that visit. A counter can go up by one. The offer, and the letter on that offer, are not saved.
      </p>

      <h2 className="mt-10 text-[20px] font-bold leading-[28px]">Contact the credit union</h2>
      <p className="mt-4 text-[16px] leading-[24px]">
        A member reaches the credit union on the credit union’s own site or by phone. Questions about this check can go to <a href={`mailto:${TALK_TO_US_EMAIL}`} className={link}>{TALK_TO_US_EMAIL}</a>.
      </p>

      <p className="mt-10 text-[16px] leading-[24px]">
        <Link href="/credit-unions/terms" className={link}>Terms</Link>
        {' · '}
        <a href="/credit-unions/packet" className={link}>Due-diligence packet</a>
      </p>
      <p className="mt-6 text-[16px] leading-[24px]">
        <Link href="/credit-unions" className={link}>← Back to plans</Link>
      </p>
    </main>
  );
}
