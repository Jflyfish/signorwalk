import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign or Walk — Know Before You Sign',
  description: 'Free AI car deal grader. Paste in your numbers and get an honest grade, every red flag, and a word-for-word negotiation script.',
};

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div>
      <span style={{display:'none'}}>Impact-Site-Verification: e7de6a6f-016b-4648-9f9c-158540f33c60</span>
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
          Free · No signup required · Powered by AI
        </div>
        <h1 className="text-5xl sm:text-6xl font-black text-gray-900 tracking-tight mb-5 leading-[1.05]">
          Know before<br className="hidden sm:block" /> you sign.
        </h1>
        <p className="text-xl text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
          Paste in your car deal numbers and get an honest grade, every red flag, and a word-for-word negotiation script — in about 30 seconds.
        </p>
        <Link
          href="/analyze"
          className="inline-flex items-center gap-2.5 px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white text-base font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          Grade My Deal
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
        <p className="text-gray-400 text-sm mt-3">Works for lease and finance deals. Free, always.</p>
      </section>

      {/* What you get */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: (
                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              title: 'Deal grade A–F',
              desc: 'Instant verdict on your deal with a plain-English explanation of why.',
            },
            {
              icon: (
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ),
              title: 'Every red flag',
              desc: 'We find the hidden markups, rolled-in fees, and dealer tricks — with specific fixes.',
            },
            {
              icon: (
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              ),
              title: 'Counter-offer script',
              desc: 'Word-for-word what to say at the dealer\'s desk. Calm, specific, effective.',
            },
          ].map(item => (
            <div key={item.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="mb-3">{item.icon}</div>
              <h3 className="font-bold text-gray-900 mb-1.5">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <h2 className="text-2xl font-black text-gray-900 mb-6 text-center">How it works</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {[
            { step: '1', title: 'Enter your numbers', desc: 'MSRP, selling price, money factor or APR, monthly payment — whatever your dealer gave you. You can also paste a listing URL or upload a quote photo.' },
            { step: '2', title: 'AI grades every detail', desc: 'We check your payment math, flag inflated rates and add-ons, assess your trade-in, and compare everything against real market benchmarks.' },
            { step: '3', title: 'Walk in with confidence', desc: 'You get a grade, a breakdown of every number, specific red flags with fixes, and a counter-offer script — ready to use.' },
          ].map(item => (
            <div key={item.step} className="flex items-start gap-5 p-6">
              <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white font-bold text-sm">{item.step}</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What's included */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-gray-900 rounded-2xl p-8 sm:p-10">
          <h2 className="text-2xl font-black text-white mb-2">Everything is free</h2>
          <p className="text-gray-400 mb-6">No signup. No credit card. No upsell.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              'Deal grade A–F with plain-English explanation',
              'Full breakdown of every number in your deal',
              'All red flags with specific, actionable fixes',
              'Counter-offer script, word for word',
              'Trade-in assessment vs. KBB / Carmax',
              'State sales tax credit analysis',
              'Lease vs. buy recommendation',
              'Photo / document upload to autofill form',
              '"What if I negotiate?" re-grades, unlimited',
              'Save your report as a PDF',
            ].map(item => (
              <div key={item} className="flex items-start gap-2.5">
                <CheckIcon />
                <span className="text-gray-300 text-sm">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition-all text-sm"
            >
              Grade My Deal — Free
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-6 mb-4">
        <p className="text-gray-400 text-xs text-center leading-relaxed">
          Sign or Walk provides AI-generated analysis for informational purposes only. Not financial or legal advice. Always verify numbers with your dealer and a qualified advisor before signing.
        </p>
      </section>
    </div>
  );
}
