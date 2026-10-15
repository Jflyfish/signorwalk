import Link from 'next/link';
import type { Metadata } from 'next';
import { AiDisclosure } from './AiDisclosure';
import { DOCUMENT_VERSION_LABEL, formatUsd, TALK_TO_US_EMAIL, pricedTiers, type PricedTierId } from './pricing';

const PAGE_URL = 'https://signorwalk.com/credit-unions';
const HEADLINE = 'Help your members spot a bad car deal before they sign.';
const VALUE_LINE = 'Members enter or upload a dealer quote, get a grade in 30 seconds, and are sent to your auto loan, all under your brand.';

const ASSETS: Record<PricedTierId, string> = {
  starter: 'Under $250M in assets',
  growth: '$250M–$1B in assets',
  pro: '$1B–$5B in assets',
};

export const metadata: Metadata = {
  title: 'Credit unions — Sign or Walk',
  description: VALUE_LINE,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: HEADLINE,
    description: VALUE_LINE,
    url: PAGE_URL,
    type: 'website',
    siteName: 'Sign or Walk',
  },
};

const solidButton =
  'inline-flex items-center justify-center h-12 w-full md:h-11 px-4 rounded-lg cu-solid text-[15px] font-semibold cu-ring';

const outlineButton =
  'inline-flex items-center justify-center h-12 w-full md:h-11 px-4 rounded-lg border cu-line bg-white cu-ink text-[15px] font-semibold cu-ring';

const textLink =
  'text-[15px] font-semibold cu-ink underline decoration-1 underline-offset-4 cu-linkline cu-ring';

export default function CreditUnionsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b cu-line">
        <div className="mx-auto flex h-16 w-full max-w-[960px] items-center px-4">
          <p className="text-[15px] font-semibold leading-[20px]">Sign or Walk</p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[960px] px-4 pt-16 md:pt-24">
        <p className="text-[14px] font-semibold leading-[20px] cu-muted">For credit unions</p>
        <h1 className="mt-4 max-w-[640px] text-[32px] font-extrabold leading-[38px] md:text-[48px] md:leading-[52px]">
          {HEADLINE}
        </h1>
        <p className="mt-6 max-w-[640px] text-[18px] leading-[28px] cu-muted">{VALUE_LINE}</p>
        <p className="mt-6 hidden text-[14px] leading-[20px] cu-muted md:block">
          See it in action.{' '}
          <Link href="/credit-unions/embed-demo" className={textLink}>Open live demo</Link>
        </p>
        <p className="mt-10 max-w-[640px] text-[14px] leading-[20px] cu-muted">
          The trial requires an email confirmation before you can save.
        </p>
      </div>

      <div className="mt-16 cu-band py-16 md:mt-24">
        <div className="mx-auto w-full max-w-[960px] px-4">
          <ul className="grid gap-4 md:grid-cols-3">
            {pricedTiers.map(tier => {
              const marked = tier.id === 'growth';
              return (
                <li
                  key={tier.id}
                  className={`cu-card flex flex-col rounded-[12px] bg-white p-6 ${marked ? 'cu-card-marked' : ''}`}
                >
                  <h2 className="text-[24px] font-bold leading-[30px]">{tier.name}</h2>
                  <p className="mt-4 text-[14px] leading-[20px] cu-muted">{ASSETS[tier.id]}</p>
                  <p className="mt-4 text-[32px] font-bold leading-[32px] tabular-nums">{formatUsd(tier.annualUsd)}/yr</p>
                  <Link href={`/credit-unions/get-started?tier=${tier.id}`} className={`${marked ? solidButton : outlineButton} mt-4`}>
                    Start 90-day free trial
                  </Link>
                  <p className="mt-4 text-[14px] leading-[20px] cu-muted">Free for 90 days. No card.</p>
                </li>
              );
            })}
          </ul>

          <p className="mt-10 text-[14px] leading-[20px] cu-muted md:hidden">
            See it in action.{' '}
            <Link href="/credit-unions/embed-demo" className={textLink}>Open live demo</Link>
          </p>

          <AiDisclosure />
          <p className="mt-4 flex flex-wrap items-baseline gap-x-2 text-[14px] leading-[20px]">
            <a href={`mailto:${TALK_TO_US_EMAIL}`} className={textLink}>Over $5B? Email us.</a>
            <span className="hidden md:inline">{' · '}</span>
            <a href="/credit-unions/packet/download" className={textLink}>Download due-diligence packet ({DOCUMENT_VERSION_LABEL})</a>
          </p>
        </div>
      </div>

      <footer className="mx-auto w-full max-w-[960px] px-4 py-10">
        <p className="flex flex-wrap gap-x-2 text-[14px] leading-[20px] cu-muted">
          <span>© 2026</span>
          <span aria-hidden="true">·</span>
          <Link href="/credit-unions/privacy" className="hover:underline underline-offset-4 cu-ring">Privacy</Link>
          <span aria-hidden="true">·</span>
          <Link href="/credit-unions/terms" className="hover:underline underline-offset-4 cu-ring">Terms</Link>
          <span aria-hidden="true">·</span>
          <a href={`mailto:${TALK_TO_US_EMAIL}`} className="hover:underline underline-offset-4 cu-ring">Contact</a>
        </p>
      </footer>
    </div>
  );
}
