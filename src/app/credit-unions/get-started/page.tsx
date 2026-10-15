import Link from 'next/link';
import type { Metadata } from 'next';
import { CHECKOUT_STATUS } from './checkout-stubs';
import { getPricedTier, resolveTierParam, TALK_TO_US_EMAIL } from '../pricing';

export const metadata: Metadata = {
  title: '90-day free pilot — Sign or Walk',
  description: "Email us to start your pilot and we'll set it up within 1 business day.",
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://signorwalk.com/credit-unions/get-started' },
};

const PILOT = "Email us to start your pilot and we'll set it up within 1 business day.";

const button =
  'inline-flex items-center justify-center h-12 w-full md:h-11 md:w-auto px-4 rounded-lg cu-solid text-[15px] font-semibold cu-ring';

export default async function GetStartedPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>;
}) {
  const tierId = resolveTierParam((await searchParams).tier);
  const tier = tierId && tierId !== 'custom' ? getPricedTier(tierId) : undefined;
  const heading = tier ? `${tier.name} 90-day free pilot` : '90-day free pilot';

  return (
    <div className="flex min-h-screen items-center px-4">
      <div className="mx-auto w-full max-w-[480px] py-16 md:py-24">
        <h1 className="text-[32px] font-extrabold leading-[38px] md:text-[48px] md:leading-[52px]">{heading}</h1>
        <p className="mt-6 text-[18px] leading-[28px] cu-muted">
          {CHECKOUT_STATUS === 'coming-soon' ? PILOT : 'Online checkout is not available on this site.'}
        </p>
        <a href={`mailto:${TALK_TO_US_EMAIL}`} className={`${button} mt-6`}>
          Email {TALK_TO_US_EMAIL}
        </a>
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
