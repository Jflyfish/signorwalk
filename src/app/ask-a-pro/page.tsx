import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ask a Pro — Sign or Walk',
  description: 'A former dealership insider reviews your car deal and tells you exactly what to say to negotiate. Save $250+ or your money back. Unsigned deals only.',
  alternates: { canonical: 'https://signorwalk.com/ask-a-pro' },
};

function CheckIcon() {
  return (
    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
      <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

export default function AskAProPage() {
  const stripeLink = process.env.NEXT_PUBLIC_STRIPE_DEAL_SUPPORT_LINK;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

      {/* Guarantee banner */}
      <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 mb-10 flex items-start gap-3">
        <div className="w-9 h-9 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-green-900">Save $250+ or your money back.</p>
          <p className="text-xs text-green-700 mt-0.5 leading-relaxed">
            If our expert review doesn&apos;t help you save at least $250 on your deal, we&apos;ll refund you in full — no questions asked.
          </p>
        </div>
      </div>

      {/* Hero */}
      <div className="mb-10">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">Ask a Pro — $19</p>
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-4 leading-[1.05]">
          Get a dealership insider<br className="hidden sm:block" /> in your corner.
        </h1>
        <p className="text-lg text-gray-500 leading-relaxed max-w-xl">
          A former dealership professional who&apos;s seen thousands of deals reviews your numbers and emails you exactly what to say — word for word.
        </p>
        <div className="mt-6 inline-flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-green-700">$4,000</span>
            <span className="text-sm font-semibold text-green-700">saved</span>
          </div>
          <div className="w-px h-8 bg-green-200" />
          <p className="text-sm text-green-800 leading-snug">Real result on a recent <span className="font-semibold">BMW X5</span> deal — see the exact script below.</p>
        </div>
      </div>

      {/* Top CTA */}
      <div className="mb-12">
        <a
          href={stripeLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white text-base font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          Get Expert Help — $19
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
        <p className="text-sm text-gray-400 mt-3">Save $250+ or your money back · Reply within 4 hours (8 AM–6 PM ET), or next business day</p>
      </div>

      {/* What you get */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 mb-12">
        <h2 className="text-xl font-black text-gray-900 mb-5">What you get for $19</h2>
        <div className="space-y-5">
          {[
            {
              title: 'A line-by-line review of your deal',
              desc: 'Every number looked at through the eyes of someone who\'s been on the dealer\'s side of the desk.',
            },
            {
              title: 'A word-for-word negotiation script',
              desc: 'Exactly what to say, how to say it, and what to push back on — written specifically for your deal.',
            },
            {
              title: 'Specific dollar targets',
              desc: 'Not vague advice. Real numbers: what\'s padded, what\'s fair, and what you should counter with.',
            },
            {
              title: 'Delivered by email, fast',
              desc: 'Reply within 4 hours during business hours (8 AM–6 PM ET), or by the next business day. We\'re US based and take every deal seriously.',
            },
          ].map(item => (
            <div key={item.title} className="flex items-start gap-3">
              <CheckIcon />
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sample script */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">Real example</span>
          <span className="text-xs text-gray-400">· BMW X5 · $4,000 saved</span>
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Here&apos;s what you actually get</h2>
        <p className="text-sm text-gray-500 mb-5 leading-relaxed max-w-xl">
          Not vague tips — a hyper-specific breakdown of your exact deal and the word-for-word script to use at the desk. This is a real review we sent on a 2025 BMW X5 lease.
        </p>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Email header */}
          <div className="border-b border-gray-100 px-5 sm:px-6 py-4 bg-gray-50">
            <p className="text-sm font-bold text-gray-900">Your BMW X5 lease — here&apos;s exactly what to say</p>
            <p className="text-xs text-gray-400 mt-0.5">From: Sign or Walk · Ask a Pro</p>
          </div>

          <div className="px-5 sm:px-7 py-7 space-y-7 text-[15px] leading-relaxed">
            {/* The deal */}
            <div>
              <p className="font-bold text-gray-900 mb-3">The deal as quoted</p>
              <ul className="space-y-1.5 text-gray-600">
                <li>2025 BMW X5 xDrive40i — MSRP <span className="font-medium text-gray-900">$69,800</span></li>
                <li>Selling price <span className="font-medium text-gray-900">$68,500</span> (only $1,300 off — ~1.9%)</li>
                <li>Money factor <span className="font-medium text-gray-900">0.00210</span> (≈5.0% APR) · Residual 58% · 36 mo / 10k</li>
                <li>Monthly: <span className="font-medium text-gray-900">$1,007 + tax</span></li>
              </ul>
            </div>

            {/* Findings */}
            <div>
              <p className="font-bold text-gray-900 mb-3">What&apos;s wrong with it</p>
              <div className="space-y-4">
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center">1</span>
                  <p className="text-gray-600">
                    <span className="font-semibold text-gray-900">Your money factor is marked up.</span> BMW&apos;s base rate this month is <span className="font-medium">0.00165</span>. They&apos;ve padded it to 0.00210 — that&apos;s pure dealer profit, costing you about <span className="font-medium">$49/mo</span>. Tell them to &ldquo;buy it down to base rate.&rdquo;
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center">2</span>
                  <p className="text-gray-600">
                    <span className="font-semibold text-gray-900">Your discount is thin.</span> $1,300 off a $69,800 X5 is weak — this trim is sitting on lots right now. <span className="font-medium">7% off ($64,900)</span> is realistic and what we&apos;d push for.
                  </p>
                </div>
                {/* Redacted */}
                <div className="relative">
                  <div className="blur-[5px] select-none pointer-events-none space-y-2" aria-hidden="true">
                    <div className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-red-100" />
                      <p className="text-gray-600">Your acquisition fee of $925 is above BMW&apos;s standard — here&apos;s the line to push it down to and how to phrase it without losing the rate.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-red-100" />
                      <p className="text-gray-600">The drive-off is rolled to hide a markup on the first payment — restructure it like this to save another several hundred dollars over the term.</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-white/80 px-3 py-1.5 rounded-full border border-gray-200">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      + 3 more red flags unlocked with your review
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Script */}
            <div>
              <p className="font-bold text-gray-900 mb-3">Say this — word for word</p>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-gray-700 italic leading-relaxed">
                &ldquo;I&apos;ve got financing lined up through my credit union, so let&apos;s keep this simple. I need the money factor at BMW&apos;s base rate of 0.00165 — no markup. And I&apos;m seeing X5s discounted 7% elsewhere, so I need the selling price at $64,900. Hit those two numbers and I&apos;ll sign today.&rdquo;
              </div>
            </div>

            {/* Outcome */}
            <div className="flex items-start gap-2.5 pt-1">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              <p className="text-gray-700">
                <span className="font-semibold text-gray-900">Target outcome:</span> about <span className="font-semibold">$150/mo lower</span> — roughly <span className="font-semibold">$5,000+</span> over the 36-month lease.
              </p>
            </div>
          </div>

          {/* CTA footer */}
          <div className="border-t border-gray-100 px-5 sm:px-6 py-4 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm font-semibold text-gray-700">Get this for your exact deal.</p>
            <a
              href={stripeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all"
            >
              Ask a Pro — $19 →
            </a>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 mb-12">
        <h2 className="text-xl font-black text-white mb-6">How it works</h2>
        <div className="space-y-6">
          {[
            {
              step: '1',
              title: 'Grade your deal first — free',
              desc: 'Run your numbers through our free AI grader. If you get a B, C, D, or F, there may be room to negotiate.',
            },
            {
              step: '2',
              title: 'Purchase your expert review',
              desc: 'Pay $19 and submit your deal. Your quote or document is attached automatically from your free grade.',
            },
            {
              step: '3',
              title: 'Get your strategy by email',
              desc: 'A dealership insider reviews your deal personally and sends you a custom negotiation script.',
            },
          ].map(item => (
            <div key={item.step} className="flex items-start gap-4">
              <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">{item.step}</div>
              <div>
                <p className="text-sm font-bold text-white">{item.title}</p>
                <p className="text-sm text-gray-400 mt-1 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-all"
          >
            Grade my deal first — free →
          </Link>
        </div>
      </div>

      {/* Guarantee detail */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-12">
        <h2 className="text-lg font-black text-green-900 mb-2">The $250+ guarantee, in plain English</h2>
        <p className="text-sm text-green-800 leading-relaxed">
          Follow our negotiation strategy and save at least $250 off your deal — on the price, rate, fees, or monthly payment. If you don&apos;t, just forward us the final numbers and we&apos;ll refund your $19. Simple.
        </p>
        <div className="mt-4 pt-4 border-t border-green-200">
          <p className="text-xs text-green-800 font-semibold">Important: Unsigned deals only.</p>
          <p className="text-xs text-green-700 mt-1 leading-relaxed">
            Ask a Pro is designed for deals you haven&apos;t signed yet. If you have already signed your contract, this offer is not available for your deal. There is nothing we can do to change a completed purchase — please do not purchase if you have already signed.
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center py-4">
        <a
          href={stripeLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white text-base font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          Get Expert Help — $19
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
        <p className="text-sm text-gray-400 mt-3">Save $250+ or your money back · Unsigned deals only</p>
        <p className="text-sm text-gray-400 mt-2">
          Don&apos;t have a grade yet?{' '}
          <Link href="/analyze" className="text-blue-600 hover:underline font-medium">
            Grade your deal free →
          </Link>
        </p>
      </div>
    </div>
  );
}
