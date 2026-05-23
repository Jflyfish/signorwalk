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

      {/* Testimonials */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-2 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { quote: 'Wow this is an incredible tool! Thank you.', attr: 'Reddit user' },
            { quote: 'Super cool tool', attr: 'Reddit user' },
            { quote: 'Great tool!! Very easy to use and I like the grading system and how informative it is.', attr: 'Reddit user' },
          ].map((t, i) => (
            <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5">
              <p className="text-sm text-gray-600 italic leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <p className="text-xs text-gray-400 mt-2">— {t.attr}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Example report */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-14">
        <div className="text-center mb-6">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">See it in action</p>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">What your report looks like</h2>
          <p className="text-gray-500 text-sm mt-2">A real deal graded D — every red flag, spelled out.</p>
        </div>
        <div className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-2xl ring-1 ring-black/5 bg-white">
          <img
            src="/example-report.png"
            alt="Example Sign or Walk deal analysis showing grade, red flags, and negotiation script"
            className="w-full h-auto block"
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
        </div>
        <div className="mt-5 text-center max-w-lg mx-auto">
          <p className="text-sm text-gray-500 leading-relaxed">
            <span className="font-semibold text-gray-700">This is just the top of the report.</span> Scan your deal to unlock the full breakdown — red flags, your negotiation leverage, and more.{' '}
            <span className="font-semibold text-gray-900">Free. Always.</span>
          </p>
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            Grade My Deal — Free
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
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

      {/* Deal Support */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 border border-gray-200 rounded-2xl bg-white">
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900 mb-1">Deal come back a C, D, or F?</p>
            <p className="text-sm text-gray-500 leading-snug">A former dealership insider who's seen thousands of deals reviews your numbers and emails you exactly what to say — within 24 hours. $19.</p>
          </div>
          <a
            href={process.env.NEXT_PUBLIC_STRIPE_DEAL_SUPPORT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-all"
          >
            Get expert help →
          </a>
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
