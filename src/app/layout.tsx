import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sign or Walk — Know Before You Sign',
  description: 'Free AI-powered car deal grader. Get an honest grade on your lease or finance deal — every red flag, every number, word-for-word negotiation script.',
  openGraph: {
    title: 'Sign or Walk — Know Before You Sign',
    description: 'Free AI-powered car deal grader. Grade your lease or finance deal in seconds.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition">
              <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-1" />
                  <circle cx="7.5" cy="17.5" r="2.5" />
                  <circle cx="17.5" cy="17.5" r="2.5" />
                  <path d="M3 9h18" />
                </svg>
              </div>
              <div>
                <span className="text-white font-bold text-lg tracking-tight">Sign or Walk</span>
                <p className="text-gray-400 text-xs -mt-0.5 hidden sm:block">Know before you sign.</p>
              </div>
            </Link>
            <div className="flex items-center gap-1 sm:gap-2">
              <Link href="/" className="text-gray-400 hover:text-white text-sm font-medium px-3 py-1.5 rounded-lg transition hidden sm:block">
                Home
              </Link>
              <Link href="/analyze" className="text-gray-400 hover:text-white text-sm font-medium px-3 py-1.5 rounded-lg transition">
                Grade My Deal
              </Link>
              <Link href="/about" className="text-gray-400 hover:text-white text-sm font-medium px-3 py-1.5 rounded-lg transition hidden sm:block">
                About
              </Link>
            </div>
          </div>
        </nav>

        <main>{children}</main>

        <footer className="bg-gray-900 border-t border-gray-800 mt-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-white" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-1" />
                      <circle cx="7.5" cy="17.5" r="2.5" />
                      <circle cx="17.5" cy="17.5" r="2.5" />
                    </svg>
                  </div>
                  <span className="text-white font-semibold text-sm">Sign or Walk</span>
                </div>
                <p className="text-gray-500 text-xs">Know before you sign.</p>
              </div>
              <nav className="flex items-center gap-4">
                <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm transition">Home</Link>
                <Link href="/analyze" className="text-gray-500 hover:text-gray-300 text-sm transition">Grade My Deal</Link>
                <Link href="/about" className="text-gray-500 hover:text-gray-300 text-sm transition">About</Link>
              </nav>
            </div>
            <div className="border-t border-gray-800 pt-6 space-y-3">
              <p className="text-gray-600 text-xs leading-relaxed">
                <strong className="text-gray-500">Disclaimer:</strong> Sign or Walk provides AI-generated analysis for informational and educational purposes only. It is not financial, legal, or professional advice. Deal grades, payment calculations, and trade-in assessments are estimates based on the information you provide. Always verify numbers with your dealer, lender, and a qualified financial advisor before signing any contract. Sign or Walk assumes no liability for decisions made based on this analysis.
              </p>
              <p className="text-gray-700 text-xs">© 2025 Sign or Walk. Free. Always.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
