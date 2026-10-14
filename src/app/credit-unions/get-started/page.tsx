import Link from 'next/link';
import type { Metadata } from 'next';
import { CHECKOUT_STATUS } from './checkout-stubs';
import { TALK_TO_US_EMAIL } from '../pricing';

const focus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900';

export const metadata: Metadata = {
  title: 'Start a pilot — Sign or Walk',
  description: 'Self-serve checkout is coming. Email team@signorwalk.com to start a pilot today.',
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://signorwalk.com/credit-unions/get-started' },
};

export default function GetStartedPage() {
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <h1 className="text-4xl font-black tracking-tight text-gray-900">Self-serve checkout is coming.</h1>
      <p className="mt-4 text-lg text-gray-700 leading-relaxed">
        {CHECKOUT_STATUS === 'coming-soon' ? (
          <>
            Email{' '}
            <a href={`mailto:${TALK_TO_US_EMAIL}`} className={`underline underline-offset-2 font-semibold text-gray-900 ${focus}`}>
              {TALK_TO_US_EMAIL}
            </a>{' '}
            to start a pilot today.
          </>
        ) : (
          'Online checkout is not available on this site.'
        )}
      </p>
      <p className="mt-8 text-sm">
        <Link href="/credit-unions" className={`underline underline-offset-2 font-semibold text-gray-900 ${focus}`}>
          Pricing
        </Link>
      </p>
    </div>
  );
}
