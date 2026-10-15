import type { Metadata } from 'next';
import Link from 'next/link';
import { UPLOAD_DISCLOSURE } from '@/cu/copy';
import { TALK_TO_US_EMAIL } from '../pricing';

export const metadata: Metadata = {
  title: 'Privacy — Sign or Walk',
  description: UPLOAD_DISCLOSURE,
  robots: { index: false, follow: false },
};

export default function CreditUnionPrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-[640px] px-4 py-16 md:py-24">
      <p className="text-[15px] font-semibold leading-[20px]">Sign or Walk</p>
      <h1 className="mt-16 text-[32px] font-extrabold leading-[38px]">Privacy</h1>
      <p className="mt-6 text-[18px] leading-[28px] cu-muted">{UPLOAD_DISCLOSURE} Member quotes are not stored.</p>
      <p className="mt-6">
        <a href={`mailto:${TALK_TO_US_EMAIL}`} className="text-[15px] font-semibold cu-ink underline decoration-1 underline-offset-4 cu-linkline cu-ring">
          {TALK_TO_US_EMAIL}
        </a>
      </p>
      <p className="mt-10">
        <Link href="/credit-unions" className="text-[15px] font-semibold cu-ink underline decoration-1 underline-offset-4 cu-linkline cu-ring">
          ← Back to plans
        </Link>
      </p>
    </main>
  );
}
