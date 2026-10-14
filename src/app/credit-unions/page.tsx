import Link from 'next/link';
import type { Metadata } from 'next';
import { formatUsd, monthlyUsd, pricedTiers, talkToUsHref } from './pricing';

const PAGE_URL = 'https://signorwalk.com/credit-unions';

export const metadata: Metadata = {
  title: 'Credit unions — Sign or Walk',
  description:
    'Members check a dealer quote and continue to your pre-approval. No member data stored. Plans from $6,000 a year.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Win back the auto loans dealers take from your members.',
    description: 'Members check a dealer quote and continue to your pre-approval. Plans from $6,000 a year.',
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
        Win back the auto loans dealers take from your members.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-gray-700 leading-relaxed">
        Members check a dealer quote against typical benchmarks, then continue to your pre-approval. No member data is stored. Nothing connects to your core.
      </p>

      <h2 className="mt-14 text-sm font-semibold text-gray-900">Plans by total assets</h2>

      <ul className="mt-4 grid gap-3 md:hidden">
        {pricedTiers.map(tier => (
          <li key={tier.id} className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-lg font-bold text-gray-900">{tier.name}</h3>
            <p className="mt-1 text-sm text-gray-700">{tier.assets}</p>
            <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div>
                <dt className="text-gray-700">Monthly</dt>
                <dd className="mt-1 font-semibold text-gray-900 tabular-nums">{formatUsd(monthlyUsd(tier.annualUsd))}</dd>
              </div>
              <div>
                <dt className="text-gray-700">Annual</dt>
                <dd className="mt-1 font-semibold text-gray-900 tabular-nums">{formatUsd(tier.annualUsd)}</dd>
                <dd className="text-xs text-gray-700">2 months free</dd>
              </div>
              <div>
                <dt className="text-gray-700">Setup</dt>
                <dd className="mt-1 font-semibold text-gray-900 tabular-nums">{formatUsd(tier.setupUsd)}</dd>
              </div>
            </dl>
          </li>
        ))}
        <li className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="text-lg font-bold text-gray-900">
            <a href={talkToUsHref()} className={`underline underline-offset-2 ${focus}`}>Talk to us</a>
          </h3>
          <p className="mt-1 text-sm text-gray-700">Over $5 billion, credit union leagues, and CUSOs</p>
          <p className="mt-3 text-sm font-semibold text-gray-900">Custom pricing</p>
        </li>
      </ul>

      <div className="mt-4 hidden md:block overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <table className="w-full border-collapse text-sm text-left">
          <caption className="sr-only">
            Credit union plans by asset size. Annual billing includes two months free versus paying monthly. Setup is a one-time fee.
          </caption>
          <thead>
            <tr className="bg-gray-900 text-white">
              <th scope="col" className="px-4 py-3 font-semibold">Plan</th>
              <th scope="col" className="px-4 py-3 font-semibold">Total assets</th>
              <th scope="col" className="px-4 py-3 font-semibold">Monthly</th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Annual
                <span className="mt-0.5 block text-xs font-medium text-gray-300">2 months free</span>
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">Setup</th>
            </tr>
          </thead>
          <tbody>
            {pricedTiers.map(tier => (
              <tr key={tier.id} className="border-t border-gray-200">
                <th scope="row" className="px-4 py-4 font-bold text-gray-900">{tier.name}</th>
                <td className="px-4 py-4 text-gray-800">{tier.assets}</td>
                <td className="px-4 py-4 font-semibold text-gray-900 tabular-nums whitespace-nowrap">{formatUsd(monthlyUsd(tier.annualUsd))}</td>
                <td className="px-4 py-4 font-semibold text-gray-900 tabular-nums whitespace-nowrap">{formatUsd(tier.annualUsd)}</td>
                <td className="px-4 py-4 font-semibold text-gray-900 tabular-nums whitespace-nowrap">{formatUsd(tier.setupUsd)}</td>
              </tr>
            ))}
            <tr className="border-t border-gray-200">
              <th scope="row" className="px-4 py-4 font-bold text-gray-900">
                <a href={talkToUsHref()} className={`underline underline-offset-2 ${focus}`}>Talk to us</a>
              </th>
              <td className="px-4 py-4 text-gray-800">Over $5 billion, credit union leagues, and CUSOs</td>
              <td className="px-4 py-4 text-gray-800">Custom</td>
              <td className="px-4 py-4 text-gray-800">Custom</td>
              <td className="px-4 py-4 text-gray-800">Custom</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
        <Link
          href="/credit-unions/get-started"
          className={`inline-flex items-center justify-center min-h-11 px-5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 ${focus}`}
        >
          Start 90-day pilot
        </Link>
        <a
          href="/credit-unions/packet"
          className={`inline-flex items-center justify-center min-h-11 px-5 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-900 hover:bg-gray-50 ${focus}`}
        >
          Download the due diligence packet
        </a>
      </div>
      <p className="mt-3 text-sm text-gray-700">
        Checkout is not open. The packet is a draft and downloads with no form.
      </p>
    </div>
  );
}
