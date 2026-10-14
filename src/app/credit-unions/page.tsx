import Link from 'next/link';
import type { Metadata } from 'next';
import { formatUsd, TALK_TO_US_EMAIL, pricedTiers, type PricedTierId } from './pricing';

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
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111]';

const solidButton =
  `inline-flex items-center justify-center h-12 w-full md:h-11 px-4 rounded-lg bg-[#111] text-white text-[15px] font-semibold ${focus}`;

const outlineButton =
  `inline-flex items-center justify-center h-12 w-full md:h-11 px-4 rounded-lg border border-[#E5E5E5] bg-white text-[#111] text-[15px] font-semibold ${focus}`;

const textLink =
  `text-[15px] font-semibold text-[#111] underline decoration-[#555] decoration-1 underline-offset-4 hover:decoration-[#111] ${focus}`;

export default function CreditUnionsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[#E5E5E5]">
        <div className="mx-auto flex h-16 w-full max-w-[960px] items-center px-4">
          <p className="text-[15px] font-semibold leading-[20px]">Sign or Walk</p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[960px] px-4 pt-16 md:pt-24">
        <p className="text-[14px] font-semibold leading-[20px] text-[#555]">For credit unions</p>
        <h1 className="mt-4 max-w-[640px] text-[32px] font-extrabold leading-[38px] md:text-[48px] md:leading-[52px]">
          {HEADLINE}
        </h1>
        <p className="mt-6 max-w-[640px] text-[18px] leading-[28px] text-[#555]">{VALUE}</p>
      </div>

      <div className="bg-[#FAFAFA] py-16">
        <div className="mx-auto w-full max-w-[960px] px-4">
          <ul className="grid gap-4 md:grid-cols-3">
            {pricedTiers.map(tier => {
              const recommended = tier.id === 'growth';
              return (
                <li
                  key={tier.id}
                  className={`flex flex-col rounded-[12px] bg-[#FAFAFA] p-6 transition duration-150 hover:border-[#111] hover:shadow-[0_1px_2px_rgb(0_0_0/0.06)] ${recommended ? 'border-2 border-[#111]' : 'border border-[#E5E5E5]'}`}
                >
                  <p className="mb-4 h-6">
                    {recommended ? (
                      <span className="inline-flex items-center rounded-[999px] bg-[#111] px-2 py-1 text-[12px] font-semibold leading-[16px] text-white">Most chosen</span>
                    ) : null}
                  </p>
                  <h2 className="text-[24px] font-bold leading-[30px]">{tier.name}</h2>
                  <p className="mt-4 text-[14px] leading-[20px] text-[#555]">{ASSETS[tier.id]}</p>
                  <p className="mt-4 text-[32px] font-bold leading-[32px] tabular-nums">{formatUsd(tier.annualUsd)}/yr</p>
                  <Link href={`/credit-unions/get-started?tier=${tier.id}`} className={`${recommended ? solidButton : outlineButton} mt-4`}>
                    Start 90-day free pilot
                  </Link>
                  <p className="mt-4 text-[14px] leading-[20px] text-[#555]">Free for 90 days. Cancel anytime.</p>
                </li>
              );
            })}
          </ul>

          <p className="mt-10">
            <a href={`mailto:${TALK_TO_US_EMAIL}`} className={textLink}>Over $5B? Email us.</a>
          </p>
          <p className="mt-4">
            <a href="/credit-unions/packet" className={textLink}>Download due-diligence packet (draft)</a>
          </p>
        </div>
      </div>

      <footer className="mx-auto mt-16 w-full max-w-[960px] px-4 pb-16 md:mt-24 md:pb-24">
        <p className="text-[14px] leading-[20px] text-[#555]">© Sign or Walk</p>
      </footer>
    </div>
  );
}
