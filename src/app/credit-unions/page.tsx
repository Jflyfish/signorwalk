import Link from 'next/link';
import type { Metadata } from 'next';
import {
  DOCUMENT_VERSION_LABEL,
  FREE_MONTHS_ON_ANNUAL,
  PILOT_DAYS,
  TALK_TO_US_EMAIL,
  formatUsd,
  monthlyUsd,
  pricedTiers,
  talkToUsHref,
} from './pricing';
import { documentBytes, dueDiligenceDocs, getDueDiligenceDoc } from './documents';

const PAGE_URL = 'https://signorwalk.com/credit-unions';
const PAGE_TITLE = 'Credit unions — Sign or Walk';
const PAGE_DESCRIPTION =
  'Members grade a dealer quote, see markups, and continue to your credit union pre-approval. No member data stored. No core integration. Plans from $6,000 a year.';
const HEADLINE = 'Win back the auto loans dealers take from your members.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: HEADLINE,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    type: 'website',
    siteName: 'Sign or Walk',
  },
  twitter: {
    card: 'summary_large_image',
    title: HEADLINE,
    description: PAGE_DESCRIPTION,
    images: ['/credit-unions/opengraph-image'],
  },
};

const faqs = [
  {
    question: 'Do you store member data?',
    answer:
      'On the credit-union service, no. A person is not asked for a name, email, account number, or member number. Quote figures are used to show a result and are not saved as a member record. That experience has no email capture.',
  },
  {
    question: 'Do you integrate with our core?',
    answer:
      'No. Sign or Walk does not connect to your core, online banking, or loan origination system. You link to the branded page from your site. Anyone who wants to apply continues to your existing pre-approval and rate pages.',
  },
  {
    question: 'How fast can this go live?',
    answer:
      'The technical setup is your name and mark, your colors, your pre-approval link, your rates link, and a subdomain. There is no core project. A launch still waits on your vendor review and on the wording you approve. This page does not promise a go-live date.',
  },
  {
    question: 'Is this a guarantee of savings or of funded loans?',
    answer:
      'No. Grades and markup flags are educational estimates. They use the numbers a person enters and benchmark ranges that are labeled as assumptions. They are not your rates and not a prediction of savings. Loan decisions and funded volume are yours. Sign or Walk is not a lender and not an offer of credit.',
  },
  {
    question: 'How does billing work?',
    answer:
      'Pay monthly, or pay annually and get two months free. Annual prices are $6,000, $12,000, and $24,000 by asset size. Monthly is that annual price divided by 10: $600, $1,200, and $2,400. Setup is $0, $1,500, or $3,000, once. Every priced tier is the same product. There is no per-member fee. Institutions over $5 billion, credit union leagues, and CUSOs do not have a list price.',
  },
  {
    question: 'What is the 90-day pilot?',
    answer:
      'A 90-day pilot lets your team see the member experience before a longer term. The sample contract (draft v0.9) is where pilot terms will be written. This website does not take pilot payment. The pilot is not a promise of captured loans or of member savings.',
  },
  {
    question: 'What does Talk to us store?',
    answer:
      'Nothing on this website. Talk to us is a mailto link to team@signorwalk.com. It opens your email app. There is no form behind it.',
  },
  {
    question: 'Are the due diligence files gated?',
    answer:
      'No. The draft v0.9 files download directly. There is no email gate. They are placeholders for counsel and vendor risk, not finished attestations or signed contracts.',
  },
  {
    question: 'Does a model write the words members read?',
    answer:
      'The credit-union design keeps member-facing sentences in language your team can approve. If a model is used, it chooses among those approved pieces. It does not draft a new paragraph. Details are in the AI vendor terms (draft v0.9). That file is a placeholder, not the vendor contract and not a certification.',
  },
] as const;

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${PAGE_URL}#webpage`,
      name: PAGE_TITLE,
      url: PAGE_URL,
      description: PAGE_DESCRIPTION,
      inLanguage: 'en-US',
      isPartOf: { '@type': 'WebSite', name: 'Sign or Walk', url: 'https://signorwalk.com' },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: `${PAGE_URL}/opengraph-image`,
      },
    },
    {
      '@type': 'Service',
      name: 'Sign or Walk for credit unions',
      serviceType: 'White-label auto quote education for credit unions',
      url: PAGE_URL,
      description: PAGE_DESCRIPTION,
      provider: {
        '@type': 'Organization',
        name: 'Sign or Walk',
        url: 'https://signorwalk.com',
        email: TALK_TO_US_EMAIL,
      },
      areaServed: 'US',
      audience: { '@type': 'BusinessAudience', name: 'Credit unions' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://signorwalk.com' },
        { '@type': 'ListItem', position: 2, name: 'Credit unions', item: PAGE_URL },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
  ],
};

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700';

const primaryButton = `inline-flex items-center justify-center gap-2 min-h-11 px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold shadow-sm hover:bg-gray-800 transition-colors ${focusRing}`;
const secondaryButton = `inline-flex items-center justify-center gap-2 min-h-11 px-6 py-3 rounded-xl bg-white text-gray-900 text-sm font-bold border border-gray-300 hover:bg-gray-50 transition-colors ${focusRing}`;
const textLink = `font-semibold text-blue-800 underline underline-offset-2 ${focusRing} rounded-sm`;

const proofPoints = [
  {
    title: 'No member data stored',
    body: 'On the credit-union service, quote numbers are used to show a result. They are not saved as a member record. There is no account and no email capture.',
  },
  {
    title: 'No core integration',
    body: 'Nothing connects to your core, online banking, or loan origination system. You place a link. The application stays on your site.',
  },
  {
    title: 'Live fast',
    body: 'Your name, your colors, your pre-approval link, and a subdomain. No core project. A launch still depends on your vendor review.',
  },
] as const;

const steps = [
  {
    title: 'Members grade a dealer quote',
    body: 'Someone enters the figures already on the dealer worksheet. Lease or finance. No account, and no photo of the contract, on the credit-union service.',
  },
  {
    title: 'They see markups',
    body: 'The result shows a grade and flags a rate, fee, or add-on that may sit above the benchmark ranges in the report. Those ranges are labeled assumptions. A flag is not a dollar amount saved and not an instruction to refuse the car.',
  },
  {
    title: 'You get the next step',
    body: 'The page points to your pre-approval, with your rates page beside it. Both links are yours. Sign or Walk does not take the application and does not present another lender.',
  },
] as const;

function formatFileSize(bytes: number): string {
  const kb = bytes / 1024;
  return kb < 10 ? `${kb.toFixed(1)} KB` : `${Math.round(kb)} KB`;
}

function ArrowIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
}

export default function CreditUnionsPage() {
  const diagram = getDueDiligenceDoc('data-flow-diagram');
  const growth = pricedTiers[1];

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
        <nav aria-label="Breadcrumb" className="text-sm text-gray-700">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className={textLink}>
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-gray-500">
              /
            </li>
            <li aria-current="page" className="font-medium text-gray-900">
              Credit unions
            </li>
          </ol>
        </nav>
      </header>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-6" aria-labelledby="hero-heading">
        <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-10 lg:gap-14 items-center">
          <div>
            <p className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              <span className="w-1.5 h-1.5 bg-blue-700 rounded-full" aria-hidden="true" />
              For credit unions
            </p>
            <h1 id="hero-heading" className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-[1.08]">
              {HEADLINE}
            </h1>
            <p className="mt-5 text-lg text-gray-700 leading-relaxed max-w-xl">
              Members grade a dealer quote, see where a markup may be sitting, and go to your pre-approval. Your brand. Your links. No member data stored, and no core integration.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link href="/credit-unions/get-started" className={primaryButton}>
                Get started
                <ArrowIcon />
              </Link>
              <a href={talkToUsHref()} className={secondaryButton}>
                Talk to us
              </a>
            </div>
            <p className="mt-4 text-sm text-gray-700 leading-relaxed max-w-xl">
              Educational tool. Not a lender, not an offer of credit, and not a guarantee of savings or of loan volume. Talk to us opens an email to {TALK_TO_US_EMAIL}. This site does not store it.
            </p>
            <nav aria-label="On this page" className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <a className={textLink} href="#how-it-works">
                How it works
              </a>
              <a className={textLink} href="#pricing">
                Pricing
              </a>
              <a className={textLink} href="#pilot">
                {PILOT_DAYS}-day pilot
              </a>
              <a className={textLink} href="#due-diligence">
                Due diligence
              </a>
            </nav>
          </div>

          <figure className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
            <figcaption className="bg-gray-900 text-gray-100 px-5 py-3 text-sm">
              <span className="font-semibold text-white">Example only.</span> Not a real quote, not your rate, and not a savings estimate.
            </figcaption>
            <div className="p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-800">yourcu.signorwalk.app</p>
              <div className="mt-4 flex items-end justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Example grade: C</p>
                  <p className="mt-1 text-sm text-gray-700 leading-relaxed">
                    Compares this quote with labeled benchmarks. Not a recommendation, and not your annual percentage rate.
                  </p>
                </div>
                <p className="text-5xl font-black text-gray-900 leading-none" aria-hidden="true">
                  C
                </p>
              </div>
              <ul className="mt-4 space-y-3">
                <li className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">Rate markup flagged</p>
                  <p className="mt-1 text-sm text-gray-700 leading-relaxed">
                    The report would compare an entered APR with a labeled benchmark. The benchmark is not your credit union rate.
                  </p>
                </li>
                <li className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">Add-on flagged</p>
                  <p className="mt-1 text-sm text-gray-700 leading-relaxed">
                    An optional product can be called out against a typical price band. The band is an assumption, not a bill from you.
                  </p>
                </li>
              </ul>
              <div className="mt-4 rounded-xl bg-gray-900 text-white px-4 py-3">
                <p className="text-sm font-bold">Next step: your pre-approval</p>
                <p className="mt-1 text-sm text-gray-200">Preview of the link your members would follow. Not clickable.</p>
              </div>
            </div>
          </figure>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8" aria-labelledby="proof-heading">
        <h2 id="proof-heading" className="sr-only">
          Proof points
        </h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {proofPoints.map(point => (
            <li key={point.title} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-900">{point.title}</h3>
              <p className="mt-2 text-sm text-gray-700 leading-relaxed">{point.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="how-it-works" className="max-w-5xl mx-auto px-4 sm:px-6 py-12 scroll-mt-24" aria-labelledby="how-heading">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-800">How it works</p>
        <h2 id="how-heading" className="mt-2 text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
          A quote, the markups, then your pre-approval.
        </h2>
        <p className="mt-3 max-w-2xl text-gray-700 leading-relaxed">
          The branded page uses your name and colors on a subdomain such as yourname.signorwalk.app. A custom hostname, if you need one, is a conversation. It is not a switch on this page.
        </p>
        <ol className="mt-8 grid gap-4 lg:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <p className="text-sm font-bold text-blue-800">Step {index + 1}</p>
              <h3 className="mt-2 text-lg font-bold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-sm text-gray-700 leading-relaxed">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="pricing" className="max-w-5xl mx-auto px-4 sm:px-6 py-12 scroll-mt-24" aria-labelledby="pricing-heading">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-800">Pricing</p>
        <h2 id="pricing-heading" className="mt-2 text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
          One product. A tier by assets.
        </h2>
        <p className="mt-3 max-w-3xl text-gray-700 leading-relaxed">
          Pay monthly, or pay annually and get {FREE_MONTHS_ON_ANNUAL} months free. The annual price is what you pay for the year. Monthly is that annual price divided by 10. There is no per-member fee, because there is no per-member record. Members are not charged.
        </p>
        <p className="mt-3 text-sm text-gray-700 md:hidden">Scroll sideways to see every column.</p>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[46rem] border-collapse text-sm text-left">
            <caption className="sr-only">
              Credit union plans by asset size. Annual billing includes two months free versus paying monthly. Setup is a one-time fee.
            </caption>
            <thead>
              <tr className="bg-gray-900 text-white">
                <th scope="col" className="px-4 py-4 font-semibold">
                  Plan
                </th>
                <th scope="col" className="px-4 py-4 font-semibold">
                  Total assets
                </th>
                <th scope="col" className="px-4 py-4 font-semibold">
                  Monthly
                </th>
                <th scope="col" className="px-4 py-4 font-semibold bg-blue-800">
                  Annual
                  <span className="mt-0.5 block text-xs font-medium text-blue-100">2 months free</span>
                </th>
                <th scope="col" className="px-4 py-4 font-semibold">
                  Setup
                </th>
                <th scope="col" className="px-4 py-4 font-semibold">
                  Next step
                </th>
              </tr>
            </thead>
            <tbody>
              {pricedTiers.map(tier => (
                <tr key={tier.id} className="border-t border-gray-200">
                  <th scope="row" className="px-4 py-4 font-bold text-gray-900 align-top">
                    {tier.name}
                  </th>
                  <td className="px-4 py-4 text-gray-700 align-top">{tier.assets}</td>
                  <td className="px-4 py-4 text-gray-900 font-semibold align-top whitespace-nowrap">
                    {formatUsd(monthlyUsd(tier.annualUsd))}
                    <span className="block text-xs font-normal text-gray-700">per month</span>
                  </td>
                  <td className="px-4 py-4 text-gray-900 font-semibold align-top bg-blue-50 whitespace-nowrap">
                    {formatUsd(tier.annualUsd)}
                    <span className="block text-xs font-normal text-gray-700">
                      per year · {formatUsd(tier.annualUsd / 12)} a month
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-900 font-semibold align-top whitespace-nowrap">
                    {formatUsd(tier.setupUsd)}
                    <span className="block text-xs font-normal text-gray-700">{tier.setupUsd === 0 ? 'No setup fee' : 'One time'}</span>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <Link
                      href={`/credit-unions/get-started?tier=${tier.id}`}
                      className={`inline-flex items-center justify-center min-h-11 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 ${focusRing}`}
                    >
                      Get started
                    </Link>
                  </td>
                </tr>
              ))}
              <tr className="border-t border-gray-200">
                <th scope="row" className="px-4 py-4 font-bold text-gray-900 align-top">
                  Talk to us
                </th>
                <td className="px-4 py-4 text-gray-700 align-top">Over $5 billion, credit union leagues, and CUSOs</td>
                <td className="px-4 py-4 text-gray-700 align-top">Custom pricing</td>
                <td className="px-4 py-4 text-gray-700 align-top bg-blue-50">Custom pricing</td>
                <td className="px-4 py-4 text-gray-700 align-top">Custom pricing</td>
                <td className="px-4 py-4 align-top">
                  <a
                    href={talkToUsHref()}
                    className={`inline-flex items-center justify-center min-h-11 px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm font-bold hover:bg-gray-50 ${focusRing}`}
                  >
                    Talk to us
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-gray-700 leading-relaxed max-w-3xl">
          Worked example, Growth: {formatUsd(monthlyUsd(growth.annualUsd))} a month, or {formatUsd(growth.annualUsd)} for the year. Twelve months at the monthly rate would be {formatUsd(monthlyUsd(growth.annualUsd) * 12)}. Annual billing removes two of those months. At an asset boundary, we will confirm the tier with you. CUSO means a credit union service organization.
        </p>
        <p className="mt-2 text-sm text-gray-700 leading-relaxed max-w-3xl">
          The site footer says the consumer grader is free. That is the consumer site. The prices on this page are what the credit union pays. Checkout is not open yet. Get started explains that. It does not take a card.
        </p>
      </section>

      <section id="pilot" className="max-w-5xl mx-auto px-4 sm:px-6 py-6 scroll-mt-24" aria-labelledby="pilot-heading">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 sm:p-8 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <p className="text-6xl font-black text-gray-900 tracking-tight leading-none" aria-hidden="true">
            {PILOT_DAYS}
          </p>
          <div>
            <h2 id="pilot-heading" className="text-2xl font-black text-gray-900 tracking-tight">
              A {PILOT_DAYS}-day pilot
            </h2>
            <p className="mt-2 text-gray-700 leading-relaxed">
              Start with {PILOT_DAYS} days so lending and compliance can see real use before a longer term. The list prices above are the subscription. This draft does not waive them, and it does not promise funded loans or member savings. Pilot wording lives in the sample contract.
            </p>
            <a className={`inline-flex mt-3 text-sm ${textLink}`} href="/credit-unions/documents/sample-contract">
              Download the sample contract ({DOCUMENT_VERSION_LABEL})
            </a>
          </div>
        </div>
      </section>

      <section id="due-diligence" className="max-w-5xl mx-auto px-4 sm:px-6 py-12 scroll-mt-24" aria-labelledby="diligence-heading">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-800">Due diligence</p>
        <h2 id="diligence-heading" className="mt-2 text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
          The packet, without a gate.
        </h2>
        <p className="mt-3 max-w-3xl text-gray-700 leading-relaxed">
          These files are {DOCUMENT_VERSION_LABEL}. A draft is a placeholder for counsel and your vendor-risk team. It is not a finished policy, not a signed contract, and not an audit. Downloads are direct. No email required.
        </p>

        <figure className="mt-8">
          <figcaption className="text-sm font-semibold text-gray-900 mb-3">
            Data flow, same drawing as the download.
          </figcaption>
          {diagram ? (
            <div
              className={`overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm ${focusRing}`}
              tabIndex={0}
              role="region"
              aria-label="Data-flow diagram. Scroll sideways if the drawing is wider than the screen. A text version follows."
            >
              <div aria-hidden="true" dangerouslySetInnerHTML={{ __html: diagram.body }} />
            </div>
          ) : null}
          <p className="mt-3 text-sm text-gray-700">
            On a small screen, scroll sideways to see the whole drawing. The three steps below are the same information in text.
          </p>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3 text-sm text-gray-700">
            <li className="rounded-xl bg-white border border-gray-200 p-4">
              <span className="block font-bold text-gray-900">1. Browser</span>
              The person enters dealer-quote numbers. No account, no name, and no member number.
            </li>
            <li className="rounded-xl bg-white border border-gray-200 p-4">
              <span className="block font-bold text-gray-900">2. Branded page</span>
              A grade and markup flags come back. The quote is not stored. There is no email capture.
            </li>
            <li className="rounded-xl bg-white border border-gray-200 p-4">
              <span className="block font-bold text-gray-900">3. Your website</span>
              Pre-approval and rates are your URLs. No connection to the core, online banking, or loan origination.
            </li>
          </ol>
        </figure>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {dueDiligenceDocs.map(doc => (
            <li key={doc.slug} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-900 bg-amber-50 border border-amber-200 inline-flex self-start px-2 py-1 rounded-full">
                {DOCUMENT_VERSION_LABEL}
              </p>
              <h3 className="mt-3 text-lg font-bold text-gray-900">{doc.title}</h3>
              <p className="mt-2 text-sm text-gray-700 leading-relaxed flex-1">{doc.description}</p>
              <p className="mt-3 text-xs font-medium text-gray-700">
                {doc.fileKind} · {formatFileSize(documentBytes(doc))}
              </p>
              <a
                href={`/credit-unions/documents/${doc.slug}`}
                className={`mt-4 inline-flex items-center justify-center min-h-11 px-4 py-2 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 hover:bg-gray-50 ${focusRing}`}
              >
                Download {doc.title}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section id="questions" className="max-w-5xl mx-auto px-4 sm:px-6 py-12 scroll-mt-24" aria-labelledby="questions-heading">
        <h2 id="questions-heading" className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
          Common questions
        </h2>
        <div className="mt-6 divide-y divide-gray-200 border-y border-gray-200">
          {faqs.map(faq => (
            <div key={faq.question} className="py-5">
              <h3 className="text-base font-bold text-gray-900">{faq.question}</h3>
              <p className="mt-2 text-sm text-gray-700 leading-relaxed max-w-3xl">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6" aria-labelledby="cta-heading">
        <div className="bg-gray-900 rounded-2xl p-8 sm:p-10">
          <h2 id="cta-heading" className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            See it on your brand.
          </h2>
          <p className="mt-3 text-gray-200 max-w-2xl leading-relaxed">
            Get started opens a page that says checkout is coming soon. It does not take a card. Prefer a conversation? Talk to us. That link opens your email app, and this site stores nothing.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/credit-unions/get-started"
              className={`inline-flex items-center justify-center gap-2 min-h-11 px-6 py-3 rounded-xl bg-white text-gray-900 text-sm font-bold hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
            >
              Get started
              <ArrowIcon />
            </Link>
            <a
              href={talkToUsHref()}
              className="inline-flex items-center justify-center min-h-11 px-6 py-3 rounded-xl border border-gray-500 text-white text-sm font-bold hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Talk to us
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-4" aria-labelledby="notice-heading">
        <h2 id="notice-heading" className="text-sm font-bold text-gray-900">
          Important information
        </h2>
        <p className="mt-2 text-sm text-gray-700 leading-relaxed">
          Sign or Walk is an independent software provider. The credit-union service is an educational look at a dealer quote. It is not a lender, not a credit union, and not an offer of credit. It is not financial, legal, tax, or compliance advice. Grades and markup flags are estimates from the numbers a person enters and from benchmark ranges labeled as assumptions. They are not your rates, not a decision to sign or to refuse a deal, and not a guarantee of savings, approval, or funded loans. Anyone who applies for credit does so on the credit union website. Sign or Walk does not endorse a dealer. Pricing on this page is for the software subscription. Questions:{' '}
          <a className={textLink} href={`mailto:${TALK_TO_US_EMAIL}`}>
            {TALK_TO_US_EMAIL}
          </a>
          .
        </p>
      </section>
    </div>
  );
}
