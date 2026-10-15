import Link from 'next/link';
import type { Metadata } from 'next';
import { UPLOAD_DISCLOSURE } from '@/cu/copy';
import { getPricedTier, resolveTierParam } from '../pricing';
import { startTrialAction } from './actions';

export const metadata: Metadata = {
  title: '90-day free trial — Sign or Walk',
  description: 'Start a 90-day free trial. No credit card.',
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://signorwalk.com/credit-unions/get-started' },
};

const button =
  'inline-flex items-center justify-center h-12 w-full md:h-11 md:w-auto px-4 rounded-lg cu-solid text-[15px] font-semibold cu-ring';

const field = 'cu-ring mt-2 block h-12 w-full rounded-lg border cu-line px-4 text-[16px] font-normal';

const ERRORS: Record<string, string> = {
  name: 'Enter the credit union name.',
  contact: 'Enter a contact name.',
  email: 'Enter a work email.',
  secret: 'At least 12 characters.',
  website: 'Enter a website like https://www.example.com, or leave it blank.',
  taken: 'That name is already in use. Try another.',
  rate: 'Too many signups from this network. Try again later.',
  start: "We couldn't start the trial. Check the form and try again.",
  unconfigured: 'Sign-in is not configured on this server.',
};

export default async function GetStartedPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string; error?: string }>;
}) {
  const query = await searchParams;
  const tierId = resolveTierParam(query.tier);
  const tier = tierId && tierId !== 'custom' ? getPricedTier(tierId) : undefined;
  const heading = tier ? `${tier.name} 90-day free trial` : '90-day free trial';
  const error = ERRORS[query.error ?? ''];

  return (
    <div className="flex min-h-screen items-center px-4">
      <div className="mx-auto w-full max-w-[480px] py-16 md:py-24">
        <h1 className="text-[32px] font-extrabold leading-[38px] md:text-[48px] md:leading-[52px]">{heading}</h1>
        <p className="mt-6 text-[18px] leading-[28px] cu-muted">No credit card. The trial runs for 90 days.</p>
        {error ? <p className="cu-err mt-4" role="alert">{error}</p> : null}
        <form action={startTrialAction} className="mt-6 grid gap-4">
          {tier ? <input type="hidden" name="tier" value={tier.id} /> : null}
          <p className="sr-only" aria-hidden="true">
            <label>Company
              <input name="company" tabIndex={-1} autoComplete="off" />
            </label>
          </p>
          <label className="text-[14px] font-semibold leading-[20px]">Credit union name
            <input name="name" required autoComplete="organization" className={field} />
          </label>
          <label className="text-[14px] font-semibold leading-[20px]">Contact name
            <input name="contact" required autoComplete="name" className={field} />
          </label>
          <label className="text-[14px] font-semibold leading-[20px]">Work email
            <input name="email" type="email" required autoComplete="email" className={field} />
          </label>
          <label className="text-[14px] font-semibold leading-[20px]">Password
            <input name="password" type="password" required minLength={12} autoComplete="new-password" className={field} />
            <span className="mt-2 block text-[14px] font-normal leading-[20px] cu-muted">At least 12 characters.</span>
          </label>
          <label className="text-[14px] font-semibold leading-[20px]">Website
            <input name="website" autoComplete="url" placeholder="https://www.example.com" className={field} />
          </label>
          <p className="text-[14px] leading-[20px] cu-muted">Optional. Used as a website that can show the tool.</p>
          <button type="submit" className={button}>Start 90-day free trial</button>
        </form>
        <p className="mt-4 text-[14px] leading-[20px] cu-muted">Check your email to confirm. Saving stays off until then.</p>
        <p className="mt-4 text-[14px] leading-[20px] cu-muted">
          {UPLOAD_DISCLOSURE}{' '}
          <Link href="/credit-unions/privacy" className="font-semibold cu-ink underline decoration-1 underline-offset-4 cu-linkline cu-ring">Privacy</Link>
        </p>
        <p className="mt-4">
          <Link
            href="/credit-unions"
            className="text-[15px] font-semibold cu-ink underline underline-offset-4 cu-linkline cu-ring"
          >
            ← Back to plans
          </Link>
        </p>
      </div>
    </div>
  );
}
