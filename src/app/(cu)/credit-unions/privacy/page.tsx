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
      <p className="mt-4 text-[18px] leading-[28px]">
        Vercel hosts the application. When UPSTASH_REDIS_REST_URL or KV_REST_API_URL is set, with the matching token, these records are written to that Redis/KV store. The client uses the Upstash Redis REST API, which Vercel KV also uses. Outside local development, when that URL and token are unset, signup, onboarding saves, admin writes, and counters are refused. Seeded demo pages still render, and nothing is written. Local development keeps an in-memory copy. Other isolates do not share that copy.
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-[18px] leading-[28px]">
        <li>Tenant profile: credit union name, legal name, tagline, contact name, support and privacy URLs, loan application URL, optional rates URL, labels, embed origins, status, trial end, verification flag, plan, onboarding flags, an optional disclosure line, and a SHA-256 hash of an unused confirmation token. The profile does not store a password or the staff work email.</li>
        <li>Staff login: work email and a scrypt hash of the login. The stored text is not the password. The staff record has no name field.</li>
        <li>Branding: short name, colors, and an optional logo (a data URL or an https URL). Settings: whether the count email is on, and the credit-union inbox address.</li>
        <li>Counters: grades run, and loan-application button clicks. Integers only. Letter aggregate: a count of graded checks, a count of worksheet uploads, and a count of each letter A through F. Not the worksheet and not the numbers from it.</li>
        <li>Directory index, a seed marker, a removal list, and audit lines (time, action, credit-union id, and who). Audit lines do not include an email.</li>
        <li>When the Redis/KV store is configured, signup and demo rate-window counts. The key is a hash prefix, not the address.</li>
      </ul>
      <p className="mt-6 text-[18px] leading-[28px]">
        A sample grade on a seeded demo page is not added to grades run, loan-application clicks, worksheet uploads, or the letter counts. When the session secret is set, that exclusion also requires the grant this server adds to the demo page. A bare sample flag on any other page still counts. An owner preview grade from a signed-in staff session is not added to grades run or loan-application clicks. That preview grade is still added to the letter aggregate when it returns a letter, and a preview worksheet upload is still counted.
      </p>
      <p className="mt-6 text-[18px] leading-[28px] cu-muted">
        The member form does not ask for a name, email, or account number. The grade is rules in this application (template pack tp-1.0.0). A model does not write the sentences a member reads.
      </p>
      <p className="mt-6 text-[18px] leading-[28px] cu-muted">
        When email delivery is configured, Resend sends the trial confirmation to the staff email, a signup notice to the operator address, and an optional summary of aggregate counts. Resend does not receive the worksheet.
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
