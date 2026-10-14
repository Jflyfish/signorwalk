import Link from 'next/link';
import type { Metadata } from 'next';
import { TALK_TO_US_EMAIL, pricedTiers, type PricedTierId } from './pricing';

const PAGE_URL = 'https://signorwalk.com/credit-unions';
const HEADLINE = 'Help your members spot a bad car deal before they sign.';
const VALUE =
  'Members enter a dealer quote, get a grade in 30 seconds, and are sent to your auto loan, all under your brand, with no member data stored.';

const ASSETS: Record<PricedTierId, string> = {
  starter: 'under $250M in assets',
  growth: '$250M–$1B',
  pro: '$1B–$5B',
};

export const metadata: Metadata = {
  title: 'Credit unions — Sign or Walk',
  description: VALUE,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: HEADLINE,
    description: VALUE,
    url: PAGE_URL,
    type: 'website',
    siteName: 'Sign or Walk',
  },
};

const focus =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900';

export default function CreditUnionsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-4">
      <h1 className="max-w-3xl text-4xl sm:text-5xl font-black tracking-tight text-gray-900 leading-[1.05]">
        {HEADLINE}
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-gray-700 leading-relaxed">{VALUE}</p>

      <ul className="mt-12 grid gap-4 md:grid-cols-3">
        {pricedTiers.map(tier => (
          <li key={tier.id} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-bold text-gray-900">{tier.name}</h2>
            <p className="mt-3 text-3xl font-black tracking-tight text-gray-900 tabular-nums">
              ${tier.annualUsd / 1000}K/yr
            </p>
            <p className="mt-1 text-sm text-gray-700">{ASSETS[tier.id]}</p>
            <Link
              href="/credit-unions/get-started"
              className={`mt-6 inline-flex items-center justify-center min-h-11 px-4 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 ${focus}`}
            >
              Start 90-day free pilot
            </Link>
            <p className="mt-2 text-sm text-gray-700">No charge for 90 days. Cancel anytime.</p>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm text-gray-800">
        Over $5B, leagues, and CUSOs:{' '}
        <a href={`mailto:${TALK_TO_US_EMAIL}`} className={`underline underline-offset-2 font-semibold text-gray-900 ${focus}`}>
          {TALK_TO_US_EMAIL}
        </a>
      </p>
      <p className="mt-3 text-sm">
        <a href="/credit-unions/packet" className={`underline underline-offset-2 font-semibold text-gray-900 ${focus}`}>
          Draft due diligence packet
        </a>
      </p>
    </div>
  );
}
