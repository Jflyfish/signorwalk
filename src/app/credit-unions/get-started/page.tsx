import Link from 'next/link';
import type { Metadata } from 'next';
import { CHECKOUT_STATUS } from './checkout-stubs';
import {
  TALK_TO_US_EMAIL,
  formatUsd,
  getPricedTier,
  monthlyUsd,
  resolveTierParam,
  talkToUsHref,
} from '../pricing';

const PAGE_URL = 'https://signorwalk.com/credit-unions/get-started';

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700';
const textLink = `font-semibold text-blue-800 underline underline-offset-2 ${focusRing} rounded-sm`;

const intakeFields = [
  'Credit union name',
  'NCUA charter number',
  'Tier',
  'Brand color',
  'Logo',
  'Pre-approval URL',
  'Rates URL',
  'Subdomain',
] as const;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>;
}): Promise<Metadata> {
  const { tier: tierParam } = await searchParams;
  const tier = resolveTierParam(tierParam);
  const priced = tier ? getPricedTier(tier) : undefined;
  const title = priced
    ? `${priced.name} — checkout coming soon — Sign or Walk`
    : 'Get started — Sign or Walk for credit unions';

  return {
    title,
    description:
      'Checkout for Sign or Walk credit-union plans is coming soon. This page does not take payment or store a form. Talk to us by email.',
    alternates: { canonical: PAGE_URL },
    robots: { index: false, follow: true },
    openGraph: {
      title,
      description: 'Checkout is coming soon. No payment is collected on this page.',
      url: PAGE_URL,
      siteName: 'Sign or Walk',
    },
  };
}

export default async function GetStartedPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>;
}) {
  const { tier: tierParam } = await searchParams;
  const tier = resolveTierParam(tierParam);
  const priced = tier ? getPricedTier(tier) : undefined;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
      <nav aria-label="Breadcrumb" className="text-sm text-gray-700 mb-8">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className={textLink}>
              Home
            </Link>
          </li>
          <li aria-hidden="true" className="text-gray-500">
            /
          </li>
          <li>
            <Link href="/credit-unions" className={textLink}>
              Credit unions
            </Link>
          </li>
          <li aria-hidden="true" className="text-gray-500">
            /
          </li>
          <li aria-current="page" className="font-medium text-gray-900">
            Get started
          </li>
        </ol>
      </nav>

      <p className="inline-flex items-center bg-amber-50 border border-amber-200 text-amber-950 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
        Coming soon
      </p>
      <h1 className="mt-4 text-4xl font-black text-gray-900 tracking-tight">Checkout is coming soon.</h1>
      <p className="mt-4 text-lg text-gray-700 leading-relaxed">
        {CHECKOUT_STATUS === 'coming-soon'
          ? 'Online checkout is not open. This page does not take a card, and it does not save what you selected.'
          : 'Online checkout is not available on this site yet. Nothing here is stored.'}
      </p>

      {priced ? (
        <section className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-6" aria-labelledby="selected-tier">
          <h2 id="selected-tier" className="text-lg font-bold text-gray-900">
            You selected {priced.name}
          </h2>
          <p className="mt-2 text-sm text-gray-700 leading-relaxed">
            {priced.assets} in assets. Annual billing is {formatUsd(priced.annualUsd)}, which includes two months free. Monthly billing is {formatUsd(monthlyUsd(priced.annualUsd))}. Setup is {formatUsd(priced.setupUsd)}, once.
          </p>
        </section>
      ) : null}

      {tier === 'custom' ? (
        <section className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-6" aria-labelledby="custom-tier">
          <h2 id="custom-tier" className="text-lg font-bold text-gray-900">
            This tier has no online checkout
          </h2>
          <p className="mt-2 text-sm text-gray-700 leading-relaxed">
            Credit unions over $5 billion, credit union leagues, and CUSOs use Talk to us. There is no list price and no card form.
          </p>
        </section>
      ) : null}

      <section className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-6" aria-labelledby="later-fields">
        <h2 id="later-fields" className="text-lg font-bold text-gray-900">
          What intake will ask for
        </h2>
        <p className="mt-2 text-sm text-gray-700 leading-relaxed">
          Not a form. Nothing in this list can be submitted.
        </p>
        <ul className="mt-4 grid sm:grid-cols-2 gap-2 text-sm text-gray-800">
          {intakeFields.map(field => (
            <li key={field} className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
              {field}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <a
          href={talkToUsHref()}
          className={`inline-flex items-center justify-center min-h-11 px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 ${focusRing}`}
        >
          Talk to us
        </a>
        <Link
          href="/credit-unions#pricing"
          className={`inline-flex items-center justify-center min-h-11 px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm font-bold hover:bg-gray-50 ${focusRing}`}
        >
          Back to pricing
        </Link>
      </div>
      <p className="mt-4 text-sm text-gray-700 leading-relaxed">
        Talk to us emails{' '}
        <a className={textLink} href={`mailto:${TALK_TO_US_EMAIL}`}>
          {TALK_TO_US_EMAIL}
        </a>
        . The message stays in your email app until you send it.
      </p>
    </div>
  );
}
