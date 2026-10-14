import Link from 'next/link';
import type { Metadata } from 'next';
import { CHECKOUT_STATUS } from './checkout-stubs';
import { TALK_TO_US_EMAIL, talkToUsHref } from '../pricing';

const focus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900';

export const metadata: Metadata = {
  title: 'Start a 90-day pilot — Sign or Walk',
  description: 'Checkout for the credit-union pilot is not open. This page does not take payment or store a form.',
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://signorwalk.com/credit-unions/get-started' },
};

export default function GetStartedPage() {
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <p className="text-sm font-semibold text-gray-700">90-day pilot</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-900">Checkout is coming soon.</h1>
      <p className="mt-4 text-lg text-gray-700 leading-relaxed">
        {CHECKOUT_STATUS === 'coming-soon'
          ? 'The pilot is not available to start online. List prices stay as published. This page does not take a card and does not store a form.'
          : 'Online checkout is not available on this site. Nothing here is stored.'}
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <a
          href={talkToUsHref()}
          className={`inline-flex items-center justify-center min-h-11 px-5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 ${focus}`}
        >
          Email {TALK_TO_US_EMAIL}
        </a>
        <Link
          href="/credit-unions"
          className={`inline-flex items-center justify-center min-h-11 px-5 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-900 hover:bg-gray-50 ${focus}`}
        >
          Back to pricing
        </Link>
      </div>
    </div>
  );
}
