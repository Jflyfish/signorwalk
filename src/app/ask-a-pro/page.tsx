import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ask a Pro — Sign or Walk',
  description: 'A former dealership insider reviews your car deal and tells you exactly what to say to negotiate. Save $250+ or your money back. Unsigned deals only.',
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
        <p className="text-sm text-gray-400 mt-3">Save $250+ or your money back · We reply as quickly as possible · Eastern US based</p>
      </div>

      {/* What you get */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 mb-6">
        <h2 className="text-xl font-black text-gray-900 mb-5">What you get for $19</h2>
        <div className="space-y-4">
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
              desc: 'We reply as quickly as possible. We\'re Eastern US based and take every deal seriously.',
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

      {/* How it works */}
      <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 mb-6">
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
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
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
