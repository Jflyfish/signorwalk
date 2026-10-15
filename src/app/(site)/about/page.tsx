import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About — Sign or Walk',
  description: 'Sign or Walk is a free AI car deal grader built to protect everyday buyers from bad lease and finance deals.',
  alternates: { canonical: 'https://signorwalk.com/about' },
};

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
      <div className="mb-10">
        <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">About</span>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mt-2 mb-4">Know before you sign.</h1>
        <p className="text-lg text-gray-500 leading-relaxed">
          Car dealers negotiate thousands of deals a year. You negotiate one. That information gap costs everyday buyers billions of dollars annually — in marked-up interest rates, inflated add-ons, and trade-ins that go nowhere near market value.
        </p>
      </div>

      <div className="space-y-8 text-gray-600 leading-relaxed">
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">What Sign or Walk does</h2>
          <p>
            You paste in your deal numbers — MSRP, money factor, residual, trade-in offer, whatever you have — and our AI grades the deal from A to F. You get a plain-English breakdown of every number, a list of red flags with specific fixes, and a word-for-word script you can use at the dealer&apos;s desk.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Why it&apos;s free</h2>
          <p>
            Because the people who need this most are the ones who can&apos;t afford to get it wrong. Paying $300/month for the next three years on a bad lease is a $3,600 mistake. We built this to level the playing field — no signup, no subscription, no catch.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">How it works</h2>
          <p>
            You enter your deal details. We run them through Claude, Anthropic&apos;s AI, which is trained on how car financing actually works — lease money factors, dealer reserve markups, trade-in appraisal tactics, bundled product pricing. The AI gives you the same analysis a knowledgeable friend would give you, minus the small talk.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">What it isn&apos;t</h2>
          <p>
            Sign or Walk is not a financial advisor, not a lawyer, and not a guarantee. It&apos;s a starting point — a way to walk into that finance office with your eyes open. The numbers it generates are estimates. Always verify with your dealer and, for big purchases, a qualified advisor.
          </p>
        </div>

        <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl">
          <p className="text-blue-900 font-medium text-sm mb-1">Ready to grade your deal?</p>
          <p className="text-blue-700 text-sm mb-3">It takes about two minutes. No account required.</p>
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition"
          >
            Grade My Deal
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
