'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnalyzingOverlay } from '@/components/AnalyzingOverlay';
import { AnalysisResult, AnalysisRequest, DealType, TradeInData } from '@/lib/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseVehicle(s: string): { year: string; make: string; model: string } {
  const parts = s.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { year: '', make: '', model: '' };
  if (/^(19|20)\d{2}$/.test(parts[0])) {
    return { year: parts[0], make: parts[1] || '', model: parts.slice(2).join(' ') };
  }
  return { year: '', make: parts[0] || '', model: parts.slice(1).join(' ') };
}

function gradeColor(grade: string) {
  if (grade === 'A' || grade === 'B') return { bg: 'bg-green-500', ring: 'ring-green-200', text: 'text-green-600' };
  if (grade === 'C') return { bg: 'bg-amber-500', ring: 'ring-amber-200', text: 'text-amber-600' };
  return { bg: 'bg-red-500', ring: 'ring-red-200', text: 'text-red-600' };
}

function recStyle(rec: string) {
  if (rec === 'sign') return { cls: 'bg-green-100 text-green-800 border-green-300', label: 'Sign It' };
  if (rec === 'negotiate') return { cls: 'bg-amber-100 text-amber-800 border-amber-300', label: 'Negotiate First' };
  return { cls: 'bg-red-100 text-red-800 border-red-300', label: 'Walk Away' };
}

function statusStyle(s: string) {
  if (s === 'good') return { dot: 'bg-green-500', badge: 'bg-green-50 text-green-700 border-green-200' };
  if (s === 'warn') return { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200' };
}

function GradeCircle({ grade, size = 'md' }: { grade: string; size?: 'sm' | 'md' | 'lg' }) {
  const c = gradeColor(grade);
  const dims = size === 'sm' ? 'w-14 h-14 text-3xl ring-4' : size === 'lg' ? 'w-28 h-28 text-6xl ring-8' : 'w-20 h-20 text-4xl ring-8';
  return (
    <div className={`${dims} rounded-full ${c.bg} flex items-center justify-center shadow-lg ${c.ring} flex-shrink-0`}>
      <span className="text-white font-black leading-none">{grade}</span>
    </div>
  );
}

function getProUpsellCopy(analysis: AnalysisResult): string {
  const keyTerms = [
    { pattern: /money factor/i, label: 'money factor' },
    { pattern: /\bAPR\b|interest rate/i, label: 'APR' },
    { pattern: /selling price|cap cost/i, label: 'selling price' },
    { pattern: /trade.?in/i, label: 'trade-in offer' },
    { pattern: /doc fee/i, label: 'doc fee' },
    { pattern: /residual/i, label: 'residual value' },
    { pattern: /down payment/i, label: 'down payment' },
  ];
  for (const flag of analysis.redFlags) {
    for (const term of keyTerms) {
      if (term.pattern.test(flag.issue)) {
        return `Your ${term.label} has real room to negotiate. A former dealership insider who's seen thousands of deals will email you exactly what to say. Built to help you save $500–$1,000.`;
      }
    }
  }
  for (const row of analysis.breakdown) {
    if (row.status === 'bad') {
      for (const term of keyTerms) {
        if (term.pattern.test(row.label)) {
          return `Your ${term.label} has real room to negotiate. A former dealership insider who's seen thousands of deals will email you exactly what to say. Built to help you save $500–$1,000.`;
        }
      }
    }
  }
  return "This deal has real room to negotiate. A former dealership insider who's seen thousands of deals will email you exactly what to say. Built to help you save $500–$1,000.";
}

// ── Main component ────────────────────────────────────────────────────────────

type Phase = 'upload' | 'analyzing' | 'needs-fields' | 'results';

export default function AnalyzePage() {
  const router = useRouter();

  // Phase
  const [phase, setPhase] = useState<Phase>('upload');

  // Upload/form state
  const [dealType, setDealType] = useState<DealType>('lease');
  const [vehicleYMM, setVehicleYMM] = useState('');
  const [msrp, setMsrp] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [leaseTerm, setLeaseTerm] = useState('36');
  const [apr, setApr] = useState('');
  const [creditScore, setCreditScore] = useState('');
  const [showTradeIn, setShowTradeIn] = useState(false);
  const [tradeYMM, setTradeYMM] = useState('');
  const [tradeOffer, setTradeOffer] = useState('');
  const [tradeOwed, setTradeOwed] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);

  // Upload/extraction state
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState('');

  // Needs-fields state
  const [needsVehicle, setNeedsVehicle] = useState(false);
  const [needsPrice, setNeedsPrice] = useState(false);

  // Results
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisReady, setAnalysisReady] = useState(false);
  const [capturedEmail, setCapturedEmail] = useState<string | null>(null);
  const [pendingRequest, setPendingRequest] = useState<AnalysisRequest | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // ── Build helpers ────────────────────────────────────────────────────────────

  function buildTradeIn(): TradeInData {
    const t = parseVehicle(tradeYMM);
    return {
      year: t.year, make: t.make, model: t.model,
      mileage: '', condition: 'Good',
      dealerOffer: tradeOffer, payoffAmount: tradeOwed,
      kbbEstimate: '', knownIssues: '',
    };
  }

  function buildRequest(): AnalysisRequest {
    const v = parseVehicle(vehicleYMM);
    const notes = creditScore ? `Buyer credit score range: ${creditScore}` : '';

    if (dealType === 'lease') {
      return {
        dealType: 'lease',
        state: '',
        lease: {
          vehicleYear: v.year, vehicleMake: v.make, vehicleModel: v.model, vehicleTrim: '',
          msrp, sellingPrice, rebates: '', moneyFactor: '', residualPercent: '', residualDollar: '',
          leaseTerm, monthlyPayment, driveOff: '', capCostReduction: downPayment,
          acquisitionFee: '', dispositionFee: '', milesPerYear: '12000', docFee: '',
        },
        ...(showTradeIn && tradeOffer ? { tradeIn: buildTradeIn() } : {}),
        ...(notes ? { notes } : {}),
      };
    } else {
      return {
        dealType: 'finance',
        state: '',
        finance: {
          vehicleYear: v.year, vehicleMake: v.make, vehicleModel: v.model, vehicleTrim: '',
          msrp, negotiatedPrice: sellingPrice, rebates: '', downPayment, amountFinanced: '',
          apr, loanTerm: '60', monthlyPayment, outTheDoorPrice: '', docFee: '', vehicleMileage: '',
        },
        ...(showTradeIn && tradeOffer ? { tradeIn: buildTradeIn() } : {}),
        ...(notes ? { notes } : {}),
      };
    }
  }

  // ── runAnalysis ──────────────────────────────────────────────────────────────

  async function runAnalysis(overrideRequest?: AnalysisRequest) {
    setError('');
    setPhase('analyzing');

    try {
      const payload = overrideRequest ?? buildRequest();
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Analysis failed');
      setAnalysis(data.analysis);

      // Save session for negotiation-support
      // Use overrideRequest fields when available (avoids stale state on auto-analysis from upload)
      const effectiveLease = payload.lease;
      const effectiveFinance = payload.finance;
      const effectiveDealType = payload.dealType;
      const vYear = effectiveLease?.vehicleYear || effectiveFinance?.vehicleYear || parseVehicle(vehicleYMM).year;
      const vMake = effectiveLease?.vehicleMake || effectiveFinance?.vehicleMake || parseVehicle(vehicleYMM).make;
      const vModel = effectiveLease?.vehicleModel || effectiveFinance?.vehicleModel || parseVehicle(vehicleYMM).model;
      const effectiveSellingPrice = effectiveLease?.sellingPrice || effectiveFinance?.negotiatedPrice || sellingPrice;
      const effectiveMonthlyPayment = effectiveLease?.monthlyPayment || effectiveFinance?.monthlyPayment || monthlyPayment;
      const effectiveTradeIn = payload.tradeIn;
      try {
        localStorage.setItem('sow_session', JSON.stringify({
          dealType: effectiveDealType, state: '', grade: data.analysis.grade, headline: data.analysis.headline,
          vehicleYear: vYear, vehicleMake: vMake, vehicleModel: vModel, vehicleTrim: '',
          sellingPrice: effectiveSellingPrice, monthlyPayment: effectiveMonthlyPayment,
          hasTradeIn: !!effectiveTradeIn,
          tradeInVehicle: effectiveTradeIn ? `${effectiveTradeIn.year} ${effectiveTradeIn.make} ${effectiveTradeIn.model}`.trim() : '',
          tradeInOffer: effectiveTradeIn?.dealerOffer || '',
          tradeInPayoff: effectiveTradeIn?.payoffAmount || '',
          hasUploadedQuote: !!vMake,
          lease: effectiveDealType === 'lease' ? effectiveLease : null,
          finance: effectiveDealType === 'finance' ? effectiveFinance : null,
        }));
      } catch { /* ignore */ }

      setPendingRequest(payload);
      setAnalysisReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setPhase('upload');
      setAnalysisReady(false);
      setShowManualForm(true);
    }
  }

  // ── handleFileChange ─────────────────────────────────────────────────────────

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsExtracting(true);
    setError('');

    // Save to localStorage for negotiation-support page
    if (file.size <= 3.5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          localStorage.setItem('sow_quote_b64', JSON.stringify({
            filename: file.name, type: file.type, data: reader.result,
          }));
        } catch { /* ignore */ }
      };
      reader.readAsDataURL(file);
    }

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/extract-document', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const extracted = data.data as Record<string, unknown>;
      const str = (v: unknown) => v != null && v !== '' ? String(v) : '';

      // Apply extracted values to form state
      const extMake = str(extracted.make);
      const extModel = str(extracted.model);
      const extYear = str(extracted.year);
      const extYMM = [extYear, extMake, extModel].filter(Boolean).join(' ');

      if (extYMM) setVehicleYMM(extYMM);
      if (extracted.msrp) setMsrp(str(extracted.msrp));
      if (extracted.sellingPrice) setSellingPrice(str(extracted.sellingPrice));
      if (extracted.monthlyPayment) setMonthlyPayment(str(extracted.monthlyPayment));
      if (extracted.capCostReduction || extracted.downPayment)
        setDownPayment(str(extracted.capCostReduction || extracted.downPayment));
      if (extracted.apr) setApr(str(extracted.apr));
      const extractedDealType: DealType = extracted.dealType === 'finance' ? 'finance' : 'lease';
      setDealType(extractedDealType);
      const termVal = str(extracted.leaseTerm);
      if (['24', '36', '39', '42', '48'].includes(termVal)) setLeaseTerm(termVal);

      // Handle trade-in from extraction
      let extractedTradeOffer = '';
      let extractedTradeOwed = '';
      if (extracted.tradeInValue || extracted.tradeInPayoff) {
        setShowTradeIn(true);
        if (extracted.tradeInValue) {
          extractedTradeOffer = str(extracted.tradeInValue);
          setTradeOffer(extractedTradeOffer);
        }
        if (extracted.tradeInPayoff) {
          extractedTradeOwed = str(extracted.tradeInPayoff);
          setTradeOwed(extractedTradeOwed);
        }
      }

      // Check minimums
      const hasVehicle = !!(extMake && extModel);
      const hasPrice = !!(str(extracted.sellingPrice) || str(extracted.monthlyPayment));

      setNeedsVehicle(!hasVehicle);
      setNeedsPrice(!hasPrice);

      if (hasVehicle && hasPrice) {
        // Build request directly from extracted values to avoid stale state
        const v = parseVehicle(extYMM);
        const notes = '';
        const directRequest: AnalysisRequest = extractedDealType === 'lease' ? {
          dealType: 'lease',
          state: '',
          lease: {
            vehicleYear: v.year, vehicleMake: v.make, vehicleModel: v.model, vehicleTrim: '',
            msrp: str(extracted.msrp), sellingPrice: str(extracted.sellingPrice),
            rebates: '', moneyFactor: '', residualPercent: '', residualDollar: '',
            leaseTerm: termVal && ['24', '36', '39', '42', '48'].includes(termVal) ? termVal : '36',
            monthlyPayment: str(extracted.monthlyPayment), driveOff: '',
            capCostReduction: str(extracted.capCostReduction || extracted.downPayment),
            acquisitionFee: '', dispositionFee: '', milesPerYear: '12000', docFee: '',
          },
          ...(extractedTradeOffer ? {
            tradeIn: {
              year: '', make: '', model: '', mileage: '', condition: 'Good',
              dealerOffer: extractedTradeOffer, payoffAmount: extractedTradeOwed,
              kbbEstimate: '', knownIssues: '',
            },
          } : {}),
          ...(notes ? { notes } : {}),
        } : {
          dealType: 'finance',
          state: '',
          finance: {
            vehicleYear: v.year, vehicleMake: v.make, vehicleModel: v.model, vehicleTrim: '',
            msrp: str(extracted.msrp), negotiatedPrice: str(extracted.sellingPrice),
            rebates: '', downPayment: str(extracted.downPayment), amountFinanced: '',
            apr: str(extracted.apr), loanTerm: '60',
            monthlyPayment: str(extracted.monthlyPayment),
            outTheDoorPrice: '', docFee: '', vehicleMileage: '',
          },
          ...(extractedTradeOffer ? {
            tradeIn: {
              year: '', make: '', model: '', mileage: '', condition: 'Good',
              dealerOffer: extractedTradeOffer, payoffAmount: extractedTradeOwed,
              kbbEstimate: '', knownIssues: '',
            },
          } : {}),
          ...(notes ? { notes } : {}),
        };
        setIsExtracting(false);
        await runAnalysis(directRequest);
      } else {
        setPhase('needs-fields');
        setIsExtracting(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read that document. Try a clearer photo or enter manually.');
      setIsExtracting(false);
    }
  }

  // ── handleNeedsFieldsSubmit ──────────────────────────────────────────────────

  async function handleNeedsFieldsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sellingPrice && !monthlyPayment) {
      setError('Please enter at least a selling price or monthly payment.');
      return;
    }
    await runAnalysis();
  }

  // ── handleCorrectFields ──────────────────────────────────────────────────────

  function handleCorrectFields() {
    const v = parseVehicle(vehicleYMM);
    const t = showTradeIn ? parseVehicle(tradeYMM) : null;
    const prefill = {
      dealType,
      state: '',
      lease: dealType === 'lease' ? {
        vehicleYear: v.year, vehicleMake: v.make, vehicleModel: v.model, vehicleTrim: '',
        msrp, sellingPrice, rebates: '', moneyFactor: '', residualPercent: '', residualDollar: '',
        leaseTerm, monthlyPayment, driveOff: '', capCostReduction: downPayment,
        acquisitionFee: '', dispositionFee: '', milesPerYear: '12000', docFee: '',
      } : null,
      finance: dealType === 'finance' ? {
        vehicleYear: v.year, vehicleMake: v.make, vehicleModel: v.model, vehicleTrim: '',
        msrp, negotiatedPrice: sellingPrice, rebates: '', downPayment, amountFinanced: '',
        apr, loanTerm: '60', monthlyPayment, outTheDoorPrice: '', docFee: '', vehicleMileage: '',
      } : null,
      tradeIn: showTradeIn && t ? {
        year: t.year, make: t.make, model: t.model, mileage: '', condition: 'Good',
        dealerOffer: tradeOffer, payoffAmount: tradeOwed, kbbEstimate: '', knownIssues: '',
      } : null,
    };
    try { sessionStorage.setItem('sow_prefill', JSON.stringify(prefill)); } catch { /* ignore */ }
    router.push('/analyze/advanced');
  }

  // ── handleDealTypeToggle ─────────────────────────────────────────────────────

  function handleDealTypeToggle(newType: DealType) {
    setDealType(newType);
  }

  // ── email gate ───────────────────────────────────────────────────────────────

  function proceedToResults(email?: string) {
    if (email) {
      setCapturedEmail(email);
      const v = pendingRequest?.lease ?? pendingRequest?.finance;
      const vehicle = v ? `${v.vehicleYear} ${v.vehicleMake} ${v.vehicleModel}`.trim() : '';
      fetch('/api/capture-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, grade: analysis?.grade, vehicle, analysis }),
      }).catch(() => { /* ignore */ });
    }
    setPhase('results');
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }

  // ── Phase: analyzing ─────────────────────────────────────────────────────────

  if (phase === 'analyzing') {
    return <AnalyzingOverlay isReady={analysisReady} onContinue={proceedToResults} />;
  }

  // ── Phase: results ───────────────────────────────────────────────────────────

  if (phase === 'results' && analysis) {
    const colors = gradeColor(analysis.grade);
    const rec = recStyle(analysis.recommendation);
    const stripeLink = process.env.NEXT_PUBLIC_STRIPE_DEAL_SUPPORT_LINK ?? '';

    return (
      <div ref={resultsRef} className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-3 print-page overflow-x-hidden">
        {capturedEmail && (
          <div className="no-print flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            We&apos;ll email this report to <span className="font-semibold ml-1">{capturedEmail}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-7 print-card overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <GradeCircle grade={analysis.grade} size="lg" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${rec.cls}`}>{rec.label}</span>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded-full">Free Analysis</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-1">{analysis.headline}</h1>
              <p className={`text-sm font-medium ${colors.text} mb-3`}>{analysis.gradeExplanation}</p>
              <p className="text-gray-500 text-sm leading-relaxed">{analysis.summary}</p>
            </div>
          </div>
        </div>

        {(['B', 'C', 'D', 'F'] as string[]).includes(analysis.grade) && (() => {
          const upsellCopy = getProUpsellCopy(analysis);
          const heading = analysis.grade === 'B' ? 'Decent deal — but is it as good as it looks?' :
            analysis.grade === 'C' ? 'This deal has room to improve.' :
            analysis.grade === 'D' ? 'This deal has real problems.' :
            'Before you walk — get a second opinion.';
          return (
            <div className="no-print rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 sm:p-6">
              <div className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full mb-3">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Save $250+ or your money back
              </div>
              <h2 className="text-lg font-black text-gray-900 mb-1.5">{heading}</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                {analysis.grade === 'B'
                  ? "You've got the AI's read. A real former dealership insider will verify your numbers, catch what the AI can't, and tell you — word for word — if there's still money on the table."
                  : upsellCopy}
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <a
                  href={stripeLink || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
                >
                  Ask a Pro — $19 →
                </a>
                <span className="text-xs text-gray-500">Reply within 4 hours (8 AM–6 PM ET) · <Link href="/ask-a-pro" className="text-blue-600 hover:underline font-medium">How it works</Link></span>
              </div>
            </div>
          );
        })()}

        <div className="flex flex-wrap items-center gap-3 no-print">
          <button
            onClick={handleCorrectFields}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Correct missing or wrong fields
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Save as PDF
          </button>
        </div>

        {!(dealType === 'finance' && parseInt(parseVehicle(vehicleYMM).year || '9999') <= 2023) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 print-card">
            <h2 className="font-bold text-gray-900 text-sm mb-2">Lease vs. Buy</h2>
            <div className="flex items-start gap-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${analysis.leaseVsBuy.recommendation === 'lease' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                {analysis.leaseVsBuy.recommendation === 'lease' ? 'Lease' : 'Buy'}
              </span>
              <p className="text-sm text-gray-600 leading-relaxed">{analysis.leaseVsBuy.reasoning}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 print-card overflow-hidden">
          <h2 className="font-bold text-gray-900 text-sm mb-3">Deal Breakdown</h2>
          <div className="space-y-0">
            {analysis.breakdown.map((row, i) => {
              const s = statusStyle(row.status);
              return (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.dot} mt-1.5 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-800">{row.label}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-lg border self-start break-words max-w-full ${s.badge}`}>{row.value}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{row.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {analysis.paymentGapExplanation && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 print-card">
            <div className="flex items-start gap-2.5">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-1">Payment Math Check</p>
                <p className="text-sm text-amber-700 leading-relaxed">{analysis.paymentGapExplanation}</p>
              </div>
            </div>
          </div>
        )}

        {analysis.redFlags.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 print-card">
            <h2 className="font-bold text-gray-900 text-sm mb-3">Red Flags <span className="text-xs font-normal text-red-500">({analysis.redFlags.length})</span></h2>
            <div className="space-y-2">
              {analysis.redFlags.map((flag, i) => (
                <div key={i} className="rounded-xl border border-red-100 overflow-hidden">
                  <div className="bg-red-50 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      <p className="text-sm text-red-800 font-medium leading-relaxed">{flag.issue}</p>
                    </div>
                  </div>
                  {flag.fix && (
                    <div className="bg-white px-4 py-3 border-t border-red-100">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        <p className="text-sm text-gray-600 leading-relaxed">{flag.fix}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.counterOfferScript && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 print-card">
            <h2 className="font-bold text-gray-900 text-sm mb-3">Counter-Offer Script</h2>
            <p className="text-sm text-gray-700 leading-relaxed italic">{analysis.counterOfferScript}</p>
          </div>
        )}

        {(['B', 'C', 'D', 'F'] as string[]).includes(analysis.grade) && (
          <div className="no-print rounded-2xl bg-gray-900 p-5 sm:p-6">
            <p className="text-xs font-semibold text-blue-300 uppercase tracking-widest mb-2">Optional upgrade · $19</p>
            <h2 className="text-base font-bold text-white mb-1.5">Want a human to pressure-test this before you sign?</h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              The script above is your AI starting point. A former dealership insider will verify it against your exact deal, catch anything it missed, and back it with our $250-or-your-money-back guarantee.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <a
                href={stripeLink || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
              >
                Ask a Pro — $19 →
              </a>
              <span className="text-xs text-gray-500">Reply within 4 hours (8 AM–6 PM ET) · <Link href="/ask-a-pro" className="text-blue-300 hover:underline font-medium">How it works</Link></span>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-400 leading-relaxed p-4 bg-gray-50 rounded-xl border border-gray-100 print-card">
          <strong className="text-gray-500">Disclaimer:</strong> This analysis is AI-generated for informational purposes only and is not financial or legal advice. All figures are estimates based on the data you entered. Verify all numbers with your dealer and lender before signing any contract.
        </div>
      </div>
    );
  }

  // ── Phase: needs-fields ──────────────────────────────────────────────────────

  if (phase === 'needs-fields') {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">We read your quote — just need a couple more details</h1>
          <p className="text-sm text-gray-500 mb-6">Fill in the missing info below and we&apos;ll finish your grade.</p>

          <form onSubmit={handleNeedsFieldsSubmit} className="space-y-4">
            {/* Deal type confirmation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Deal type</label>
              <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl w-fit">
                {(['lease', 'finance'] as const).map(type => (
                  <button key={type} type="button" onClick={() => handleDealTypeToggle(type)}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${dealType === type ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {type === 'lease' ? 'Lease' : 'Finance / Buy'}
                  </button>
                ))}
              </div>
            </div>

            {needsVehicle && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year, Make &amp; Model</label>
                <input
                  type="text"
                  placeholder="e.g. 2025 Honda CR-V"
                  value={vehicleYMM}
                  onChange={e => setVehicleYMM(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            )}

            {needsPrice && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Enter at least one price</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Selling price ($)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input
                        type="number"
                        placeholder="35,500"
                        value={sellingPrice}
                        onChange={e => setSellingPrice(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Monthly payment ($)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input
                        type="number"
                        placeholder="399"
                        value={monthlyPayment}
                        onChange={e => setMonthlyPayment(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

            <button type="submit" className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm transition-all shadow-sm">
              Grade my deal →
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Phase: upload ────────────────────────────────────────────────────────────

  const stripeLink = process.env.NEXT_PUBLIC_STRIPE_DEAL_SUPPORT_LINK ?? '';

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-10 sm:py-14">
      {/* Trust pill */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-xs font-semibold text-blue-700">
          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
          100% Free · No signup · Grade in 30 seconds
        </div>
      </div>

      {/* Heading */}
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-3">Is Your Deal Worth Signing?</h1>
        <p className="text-base text-gray-500">Upload your quote and we grade your deal A through F in 30 seconds and tell you if it&apos;s good enough.</p>
      </div>

      {/* Upload button */}
      <div className="flex flex-col items-center mb-2">
        <label className={`cursor-pointer inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold transition-all shadow-sm ${isExtracting ? 'bg-blue-300 text-white cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
          {isExtracting ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Reading your quote…
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Upload your quote — Free
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={isExtracting}
          />
        </label>
        <p className="text-xs text-gray-400 mt-2">JPG, PNG, HEIC or PDF · No credit card needed</p>
        {error && <p className="text-sm text-red-600 mt-2 text-center max-w-xs">{error}</p>}
      </div>

      {/* Manual entry toggle */}
      <div className="text-center mt-4 mb-6 space-y-2">
        <div>
          <button
            type="button"
            onClick={() => setShowManualForm(v => !v)}
            className="text-sm text-blue-600 hover:text-blue-700 underline underline-offset-2"
          >
            {showManualForm ? 'Hide manual entry' : "Don't have a quote? Enter manually — 6 quick fields →"}
          </button>
        </div>
        <div>
          <Link href="/analyze/advanced" className="text-xs text-gray-400 hover:text-gray-500 transition">
            Need every field? Advanced manual →
          </Link>
        </div>
      </div>

      {/* Streamlined manual form */}
      {showManualForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          {/* Deal type toggle */}
          <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl w-fit mb-5">
            {(['lease', 'finance'] as const).map(type => (
              <button key={type} type="button" onClick={() => handleDealTypeToggle(type)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${dealType === type ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {type === 'lease' ? 'Lease' : 'Finance / Buy'}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {/* Field 1: Year, Make & Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year, Make &amp; Model</label>
              <input
                type="text"
                placeholder="e.g. 2025 Honda CR-V"
                value={vehicleYMM}
                onChange={e => setVehicleYMM(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Field 2: MSRP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">MSRP ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  placeholder="43,000"
                  value={msrp}
                  onChange={e => setMsrp(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            {/* Field 3: Selling price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selling price ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  placeholder={dealType === 'lease' ? '40,500' : '35,500'}
                  value={sellingPrice}
                  onChange={e => setSellingPrice(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Include any rebates or incentives reflected in this price</p>
            </div>

            {dealType === 'lease' ? (
              <>
                {/* Lease Field 4: Monthly payment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly payment ($)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      placeholder="399"
                      value={monthlyPayment}
                      onChange={e => setMonthlyPayment(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>

                {/* Lease Field 5: Down payment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Down payment ($)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={downPayment}
                      onChange={e => setDownPayment(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>

                {/* Lease Field 6: Term */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                  <select
                    value={leaseTerm}
                    onChange={e => setLeaseTerm(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none"
                  >
                    {['24', '36', '39', '42', '48'].map(m => (
                      <option key={m} value={m}>{m} months</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                {/* Finance Field 4: Down payment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Down payment ($)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      placeholder="3,000"
                      value={downPayment}
                      onChange={e => setDownPayment(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>

                {/* Finance Field 5: Monthly payment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly payment ($)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      placeholder="520"
                      value={monthlyPayment}
                      onChange={e => setMonthlyPayment(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>

                {/* Finance Field 6: APR + credit score */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">APR (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="6.9"
                      value={apr}
                      onChange={e => setApr(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                  <div className="mt-2">
                    <label className="block text-xs text-gray-500 mb-1">Credit score range (optional)</label>
                    <select
                      value={creditScore}
                      onChange={e => setCreditScore(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none"
                    >
                      <option value="">Select range…</option>
                      <option value="750+">750+</option>
                      <option value="700–749">700–749</option>
                      <option value="650–699">650–699</option>
                      <option value="Below 650">Below 650</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Trade-in section */}
            <div>
              <button
                type="button"
                onClick={() => setShowTradeIn(v => !v)}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition"
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${showTradeIn ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                  {showTradeIn && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                I have a trade-in
              </button>
              <p className="text-xs text-gray-400 mt-1 ml-7">Optional but recommended — trade-in details significantly improve your grade accuracy</p>

              {showTradeIn && (
                <div className="mt-3 space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year, Make &amp; Model</label>
                    <input
                      type="text"
                      placeholder="e.g. 2019 Ford F-150"
                      value={tradeYMM}
                      onChange={e => setTradeYMM(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dealer offer ($)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input
                        type="number"
                        placeholder="14,000"
                        value={tradeOffer}
                        onChange={e => setTradeOffer(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount owed on trade ($)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={tradeOwed}
                        onChange={e => setTradeOwed(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">$0 if paid off</p>
                  </div>
                </div>
              )}
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

            <button
              type="button"
              onClick={() => runAnalysis()}
              className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm transition-all shadow-sm"
            >
              Grade my deal →
            </button>

            <p className="text-center text-xs text-gray-400">
              Need more fields?{' '}
              <Link href="/analyze/advanced" className="text-blue-600 hover:text-blue-700 underline underline-offset-2">
                Try advanced manual →
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">or</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Bottom Ask a Pro card — always visible */}
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-white to-blue-50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-bold text-blue-800">Save $250+ or your money back — guaranteed</p>
        </div>
        <p className="text-sm font-bold text-gray-900 mb-1">Skip the form — talk to an insider.</p>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          A former dealership pro reviews your deal and emails you exactly what to say. Reply within 4 hours (8 AM–6 PM ET), or next business day.
        </p>
        <a
          href={stripeLink || undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
        >
          Ask a Pro — $19 →
        </a>
        <p className="text-center text-xs text-gray-400 mt-2"><Link href="/ask-a-pro" className="text-blue-500 hover:underline">How it works →</Link></p>
      </div>
    </div>
  );
}
