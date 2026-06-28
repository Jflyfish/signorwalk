'use client';

import { useEffect, useRef, useState } from 'react';

const FIRST_FACT = "Manufacturer rebates can cut $500–$4,000+ off your deal — but most have strings attached. Always confirm you qualify before counting on that number.";

const FACTS = [
  "Dealers are required to disclose the money factor if you ask directly — most buyers never ask, and that silence costs them thousands.",
  "The finance office is where dealers make most of their profit — not on the car itself. Add-ons like gap insurance and paint protection carry margins over 200%.",
  "Multiply the money factor by 2,400 to get the real APR — a money factor of 0.00200 is actually 4.8% interest.",
  "Never discuss your trade-in until after you've agreed on the new car price — dealers use trade value to offset discounts on both sides simultaneously.",
  "Getting pre-approved at your credit union before visiting the dealer is the single most powerful negotiating move most buyers never make.",
  "The buyer who is genuinely willing to walk away almost always gets the better deal — dealers can sense hesitation and price accordingly.",
  "Gap insurance is built into most manufacturer leases automatically — if a dealer tries to sell you gap insurance on a lease that's a red flag.",
  "The new car smell people love is actually chemicals off-gassing from plastics and adhesives — some of which are toxic. Crack a window.",
  "The average American spends about 6 months of their life sitting at red lights — roughly the same amount of time dealers spend trying to upsell you in the finance office.",
  "Ferrari intentionally limits production below customer demand every year — so you'll never negotiate a Ferrari deal, but you can absolutely negotiate yours.",
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function CarIcon() {
  return (
    <div style={{ animation: 'car-bob 1.8s ease-in-out infinite' }}>
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-1" stroke="#3b82f6" strokeWidth="1.75" />
        <path d="M3 9h18" stroke="#3b82f6" strokeWidth="1.75" />
        <circle cx="7.5" cy="17.5" r="2.5" stroke="#3b82f6" strokeWidth="1.75" fill="none" strokeDasharray="2.6 2.6"
          style={{ animation: 'wheel-spin 0.55s linear infinite', transformOrigin: '7.5px 17.5px' }} />
        <circle cx="17.5" cy="17.5" r="2.5" stroke="#3b82f6" strokeWidth="1.75" fill="none" strokeDasharray="2.6 2.6"
          style={{ animation: 'wheel-spin 0.55s linear infinite', transformOrigin: '17.5px 17.5px' }} />
      </svg>
    </div>
  );
}

interface AnalyzingOverlayProps {
  isReady?: boolean;
  onContinue?: (email?: string) => void;
}

export function AnalyzingOverlay({ isReady = false, onContinue }: AnalyzingOverlayProps) {
  const [factText, setFactText] = useState('');
  const [factVisible, setFactVisible] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const [showGate, setShowGate] = useState(false);
  const [gateEmail, setGateEmail] = useState('');
  const orderRef = useRef<string[]>([]);
  const idxRef = useRef(0);
  const mountedRef = useRef(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    mountedRef.current = true;
    const order = [FIRST_FACT, ...shuffle(FACTS)];
    orderRef.current = order;
    idxRef.current = 0;
    setFactText(order[0]);
    setProgressKey(k => k + 1);

    const initTimer = setTimeout(() => {
      if (mountedRef.current) setFactVisible(true);
    }, 50);

    let fadeOutTimer: ReturnType<typeof setTimeout>;
    let fadeInTimer: ReturnType<typeof setTimeout>;
    let cycleTimer: ReturnType<typeof setTimeout>;

    function rotate() {
      if (!mountedRef.current) return;
      setFactVisible(false);
      fadeOutTimer = setTimeout(() => {
        if (!mountedRef.current) return;
        idxRef.current++;
        if (idxRef.current >= orderRef.current.length) {
          const last = orderRef.current[orderRef.current.length - 1];
          const newOrder = shuffle(FACTS);
          if (newOrder[0] === last && newOrder.length > 1) {
            [newOrder[0], newOrder[newOrder.length - 1]] = [newOrder[newOrder.length - 1], newOrder[0]];
          }
          orderRef.current = newOrder;
          idxRef.current = 0;
        }
        setFactText(orderRef.current[idxRef.current]);
        fadeInTimer = setTimeout(() => {
          if (mountedRef.current) setFactVisible(true);
          cycleTimer = setTimeout(rotate, 6000);
        }, 50);
      }, 300);
    }

    cycleTimer = setTimeout(rotate, 6000);

    return () => {
      mountedRef.current = false;
      clearTimeout(initTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(fadeInTimer);
      clearTimeout(cycleTimer);
    };
  }, []);

  // When report is ready, transition to email gate
  useEffect(() => {
    if (isReady) {
      const t = setTimeout(() => setShowGate(true), 350);
      return () => clearTimeout(t);
    }
  }, [isReady]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onContinue?.(gateEmail || undefined);
  }

  return (
    <div className="min-h-[72vh] flex flex-col items-center justify-center px-4 py-16">

      {/* Loading — fades out when gate appears */}
      <div
        className="flex flex-col items-center w-full transition-opacity duration-400"
        style={{ opacity: showGate ? 0 : 1, pointerEvents: showGate ? 'none' : 'auto', position: showGate ? 'absolute' : 'relative' }}
      >
        <div className="mb-10"><CarIcon /></div>
        <div className="w-full max-w-xs mb-14">
          <div className="h-px bg-gray-100 rounded-full overflow-hidden">
            <div key={progressKey} className="h-full bg-gray-300 rounded-full animate-progress-fill" />
          </div>
        </div>
        <div className="text-center w-full max-w-[480px]">
          <p className="text-[13px] text-gray-400 mb-5 tracking-wide">Analyzing your deal…</p>
          <p
            className="text-base text-gray-900 leading-[1.6] transition-opacity duration-300"
            style={{ opacity: factVisible ? 1 : 0 }}
          >
            {factText}
          </p>
        </div>
      </div>

      {/* Email gate — fades in when report is ready */}
      <div
        className="w-full max-w-sm text-center transition-all duration-500"
        style={{ opacity: showGate ? 1 : 0, transform: showGate ? 'translateY(0)' : 'translateY(12px)', pointerEvents: showGate ? 'auto' : 'none' }}
      >
        <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold px-4 py-2 rounded-full mb-8">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Your free report is ready
        </div>

        <h2 className="text-2xl font-black text-gray-900 mb-2">Enter your email to view it</h2>
        <p className="text-sm text-gray-500 mb-8">We&apos;ll also send you a copy so you have it at the dealership.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={gateEmail}
            onChange={e => setGateEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus={showGate}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          <button
            type="submit"
            className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm transition-all shadow-sm"
          >
            View my report →
          </button>
        </form>

        <button
          type="button"
          onClick={() => onContinue?.()}
          className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition underline underline-offset-2"
        >
          Continue without email
        </button>
      </div>

    </div>
  );
}
