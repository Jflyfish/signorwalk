'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { US_STATES } from '@/lib/states';
import { STATE_TAX_DATA } from '@/lib/stateTaxData';
import {
  AnalysisResult, AnalysisRequest, LeaseFormData, FinanceFormData,
  TradeInData, BundledCosts,
} from '@/lib/types';

const LEASE_TERM_OPTIONS = ['24', '36', '39', '42', '48'];
const LEASE_MILES_OPTIONS = ['8000', '10000', '12000', '15000', '18000', '20000'];
const FINANCE_TERM_OPTIONS = ['24', '36', '48', '60', '72', '84'];

const LEASE_DEFAULTS: LeaseFormData = {
  vehicleYear: '', vehicleMake: '', vehicleModel: '', vehicleTrim: '',
  msrp: '', sellingPrice: '', moneyFactor: '', residualPercent: '',
  residualDollar: '', leaseTerm: '36', monthlyPayment: '', driveOff: '',
  capCostReduction: '', acquisitionFee: '', dispositionFee: '',
  milesPerYear: '12000', docFee: '',
};

const FINANCE_DEFAULTS: FinanceFormData = {
  vehicleYear: '', vehicleMake: '', vehicleModel: '', vehicleTrim: '',
  msrp: '', negotiatedPrice: '', downPayment: '', amountFinanced: '',
  apr: '', loanTerm: '60', monthlyPayment: '', outTheDoorPrice: '',
  docFee: '', vehicleMileage: '',
};

const TRADEIN_DEFAULTS: TradeInData = {
  year: '', make: '', model: '', mileage: '', condition: 'Good',
  dealerOffer: '', payoffAmount: '', kbbEstimate: '', knownIssues: '',
};

const BUNDLED_DEFAULTS: BundledCosts = {
  extendedWarranty: '', gapInsurance: '', tireWheelProtection: '',
  paintInteriorProtection: '', otherLabel: '', otherAmount: '',
};

// ── UI primitives ─────────────────────────────────────────────────────────────

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string; prefix?: string; suffix?: string; hint?: string; isHighlighted?: boolean;
}
function Field({ label, prefix, suffix, hint, className, isHighlighted, ...props }: FieldProps) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">{prefix}</span>}
        <input
          {...props}
          className={`w-full border rounded-lg py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
            ${prefix ? 'pl-7' : 'pl-3'} ${suffix ? 'pr-10' : 'pr-3'}
            ${isHighlighted ? 'border-yellow-400 bg-yellow-50 ring-2 ring-yellow-300' : 'border-gray-200'}`}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">{suffix}</span>}
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function SelectField({ label, hint, children, className, isHighlighted, ...props }: { label: string; hint?: string; children: React.ReactNode; className?: string; isHighlighted?: boolean } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <select {...props} className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none ${isHighlighted ? 'border-yellow-400 bg-yellow-50 ring-2 ring-yellow-300' : 'border-gray-200'}`}>
        {children}
      </select>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-px flex-1 bg-gray-100" />
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">{children}</span>
      <div className="h-px flex-1 bg-gray-100" />
    </div>
  );
}

function gradeColor(grade: string) {
  if (grade === 'A' || grade === 'B') return { bg: 'bg-green-500', ring: 'ring-green-200', text: 'text-green-600', light: 'bg-green-50', border: 'border-green-200' };
  if (grade === 'C') return { bg: 'bg-amber-500', ring: 'ring-amber-200', text: 'text-amber-600', light: 'bg-amber-50', border: 'border-amber-200' };
  return { bg: 'bg-red-500', ring: 'ring-red-200', text: 'text-red-600', light: 'bg-red-50', border: 'border-red-200' };
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

function GradeComparison({ prev, current }: { prev: string; current: string }) {
  const prevC = gradeColor(prev);
  const currC = gradeColor(current);
  const improved = ['A', 'B', 'C', 'D', 'F'].indexOf(current) < ['A', 'B', 'C', 'D', 'F'].indexOf(prev);
  const same = prev === current;
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border mb-4 ${improved ? 'bg-green-50 border-green-200' : same ? 'bg-gray-50 border-gray-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${prevC.bg} flex items-center justify-center ring-4 ${prevC.ring}`}><span className="text-white font-black text-lg">{prev}</span></div>
        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        <div className={`w-10 h-10 rounded-full ${currC.bg} flex items-center justify-center ring-4 ${currC.ring}`}><span className="text-white font-black text-lg">{current}</span></div>
      </div>
      <p className="text-sm font-medium text-gray-700">
        {improved ? `Grade improved from ${prev} to ${current}.` : same ? 'Same grade — try adjusting a specific number.' : `Grade dropped from ${prev} to ${current}.`}
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AnalyzePage() {
  // Form state
  const [dealType, setDealType] = useState<'lease' | 'finance'>('lease');
  const [state, setState] = useState('');
  const [lease, setLease] = useState<LeaseFormData>(LEASE_DEFAULTS);
  const [finance, setFinance] = useState<FinanceFormData>(FINANCE_DEFAULTS);
  const [showTradeIn, setShowTradeIn] = useState(false);
  const [tradeIn, setTradeIn] = useState<TradeInData>(TRADEIN_DEFAULTS);
  const [showBundled, setShowBundled] = useState(false);
  const [bundled, setBundled] = useState<BundledCosts>(BUNDLED_DEFAULTS);
  const [notes, setNotes] = useState('');
  const [residualMode, setResidualMode] = useState<'percent' | 'dollar'>('percent');
  const [usePaymentRange, setUsePaymentRange] = useState(false);
  const [paymentRangeVal, setPaymentRangeVal] = useState({ low: '', high: '' });
  const [showGuidance, setShowGuidance] = useState(false);
  const [additionalFees, setAdditionalFees] = useState({ salesTax: '', titleReg: '', otherAmount: '', otherLabel: '' });
  const [showAdditionalFees, setShowAdditionalFees] = useState(false);

  // Autofill state
  const [isExtractingDoc, setIsExtractingDoc] = useState(false);
  const [docStatus, setDocStatus] = useState<{ type: 'idle' | 'success' | 'error'; msg: string }>({ type: 'idle', msg: '' });
  const [autofillSummary, setAutofillSummary] = useState('');
  const [autofillHighlight, setAutofillHighlight] = useState<Set<string>>(new Set());

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [isAdjustMode, setIsAdjustMode] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [previousGrade, setPreviousGrade] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // ── Derived values ───────────────────────────────────────────────────────────
  const dealerOffer = parseFloat(tradeIn.dealerOffer || '0');
  const payoffAmount = parseFloat(tradeIn.payoffAmount || '0');
  const netTradeIn = showTradeIn && tradeIn.dealerOffer ? dealerOffer - payoffAmount : 0;
  const isUpsideDown = showTradeIn && !!tradeIn.dealerOffer && netTradeIn < 0;
  const hl = (k: string) => autofillHighlight.has(k);

  // Payment math check
  const paymentGap = useMemo<number | undefined>(() => {
    if (dealType === 'lease') {
      const mf = parseFloat(lease.moneyFactor || '0');
      const msrp = parseFloat(lease.msrp || '0');
      const sp = parseFloat(lease.sellingPrice || '0');
      const acq = parseFloat(lease.acquisitionFee || '0');
      const ccr = parseFloat(lease.capCostReduction || '0');
      const resDol = residualMode === 'dollar'
        ? parseFloat(lease.residualDollar || '0')
        : msrp * parseFloat(lease.residualPercent || '0') / 100;
      const term = parseFloat(lease.leaseTerm || '36');
      const quoted = parseFloat(lease.monthlyPayment || '0');
      if (!mf || !sp || !resDol || !term || !quoted) return undefined;
      const adj = sp + acq - ccr - (showTradeIn ? Math.max(netTradeIn, 0) : 0);
      return quoted - ((adj - resDol) / term + (adj + resDol) * mf);
    }
    if (dealType === 'finance') {
      const price = parseFloat(finance.negotiatedPrice || '0');
      const down = parseFloat(finance.downPayment || '0');
      const doc = parseFloat(finance.docFee || '0');
      const apr = parseFloat(finance.apr || '0');
      const term = parseFloat(finance.loanTerm || '60');
      const quoted = parseFloat(finance.monthlyPayment || '0');
      if (!price || !apr || !term || !quoted) return undefined;
      const loan = Math.max(price - down - (showTradeIn ? netTradeIn : 0) + doc, 0);
      const r = apr / 100 / 12;
      const calc = (loan * r * Math.pow(1 + r, term)) / (Math.pow(1 + r, term) - 1);
      return quoted - calc;
    }
    return undefined;
  }, [dealType, lease, finance, residualMode, showTradeIn, netTradeIn]);

  // Calculated summaries for the receipt card
  const taxInfo = state ? STATE_TAX_DATA[state] : null;

  const financeSummary = useMemo(() => {
    if (dealType !== 'finance') return null;
    const price = parseFloat(finance.negotiatedPrice || '0');
    const doc = parseFloat(finance.docFee || '0');
    const down = parseFloat(finance.downPayment || '0');
    const term = parseFloat(finance.loanTerm || '60');
    const payment = parseFloat(finance.monthlyPayment || '0');
    const tradeOffer = showTradeIn && tradeIn.dealerOffer ? dealerOffer : 0;
    const netTrade = showTradeIn && tradeIn.dealerOffer ? netTradeIn : 0;

    const enteredTax = parseFloat(additionalFees.salesTax || '0');
    const enteredTitleReg = parseFloat(additionalFees.titleReg || '0');
    const otherFees = parseFloat(additionalFees.otherAmount || '0');

    const taxableBase = taxInfo?.tradeInCredit ? Math.max(price - tradeOffer, 0) : price;
    const estTax = taxInfo ? taxableBase * (taxInfo.salesTaxRate / 100) : 0;
    const estTitleReg = taxInfo?.avgTitleReg || 0;

    const salesTax = enteredTax || estTax;
    const titleReg = enteredTitleReg || estTitleReg;
    const subtotal = price + doc + salesTax + titleReg + otherFees;
    const calcAmtFinanced = Math.max(subtotal - down - netTrade, 0);
    const amtFinancedFromContract = parseFloat(finance.amountFinanced || '0');

    return {
      price, doc, salesTax, titleReg, otherFees, subtotal,
      down, tradeOffer, netTrade, payoff: payoffAmount,
      amtFinanced: amtFinancedFromContract || calcAmtFinanced,
      term, payment,
      totalMonthly: payment * term,
      totalPaid: payment * term + down,
      isTaxEst: !enteredTax,
      isTitleEst: !enteredTitleReg,
      salesTaxRate: taxInfo?.salesTaxRate || 0,
    };
  }, [dealType, finance, state, showTradeIn, tradeIn, dealerOffer, payoffAmount, netTradeIn, additionalFees, taxInfo]);

  const leaseSummary = useMemo(() => {
    if (dealType !== 'lease') return null;
    const sp = parseFloat(lease.sellingPrice || '0');
    const msrp = parseFloat(lease.msrp || '0');
    const acq = parseFloat(lease.acquisitionFee || '0');
    const doc = parseFloat(lease.docFee || '0');
    const ccr = parseFloat(lease.capCostReduction || '0');
    const driveOff = parseFloat(lease.driveOff || '0');
    const term = parseFloat(lease.leaseTerm || '36');
    const payment = parseFloat(lease.monthlyPayment || '0');
    const resPct = parseFloat(lease.residualPercent || '0');
    const resDol = residualMode === 'dollar'
      ? parseFloat(lease.residualDollar || '0')
      : (msrp * resPct / 100);
    const tradeNetPositive = showTradeIn && tradeIn.dealerOffer ? Math.max(netTradeIn, 0) : 0;

    const capCost = sp > 0 ? sp + acq + doc : 0;
    const adjCapCost = Math.max(capCost - ccr - tradeNetPositive, 0);
    const totalMonthly = payment * term;
    const totalPaid = totalMonthly + driveOff;

    return { sp, msrp, acq, doc, ccr, driveOff, capCost, adjCapCost, tradeNetPositive, term, payment, totalMonthly, totalPaid, resDol };
  }, [dealType, lease, residualMode, showTradeIn, tradeIn, netTradeIn]);

  // ── Autofill ─────────────────────────────────────────────────────────────────
  const applyExtracted = useCallback((raw: Record<string, unknown>) => {
    const str = (v: unknown): string => (v != null && v !== '' && v !== 0) ? String(v) : '';
    const filled = new Set<string>();

    if (raw.dealType === 'lease' || raw.dealType === 'finance') setDealType(raw.dealType as 'lease' | 'finance');

    if (raw.state && typeof raw.state === 'string') {
      const code = raw.state.toUpperCase().trim().slice(0, 2);
      if (STATE_TAX_DATA[code]) { setState(code); filled.add('state'); }
    }

    setLease(p => {
      const n = { ...p };
      const maybeSet = (f: keyof LeaseFormData, v: unknown) => {
        const s = str(v);
        if (s && !p[f]) { (n as Record<string, string>)[f] = s; filled.add(`lease.${f}`); }
      };
      maybeSet('vehicleYear', raw.year);
      maybeSet('vehicleMake', raw.make);
      maybeSet('vehicleModel', raw.model);
      maybeSet('vehicleTrim', raw.trim);
      maybeSet('msrp', raw.msrp);
      maybeSet('sellingPrice', raw.sellingPrice);
      maybeSet('moneyFactor', raw.moneyFactor);
      maybeSet('residualPercent', raw.residualPercent);
      maybeSet('residualDollar', raw.residualValue);
      maybeSet('monthlyPayment', raw.monthlyPayment);
      maybeSet('driveOff', raw.dueAtSigning);
      maybeSet('capCostReduction', raw.capCostReduction ?? raw.downPayment);
      maybeSet('acquisitionFee', raw.acquisitionFee);
      maybeSet('docFee', raw.docFee);
      if (raw.leaseTerm) { const v = str(raw.leaseTerm); if (LEASE_TERM_OPTIONS.includes(v)) { n.leaseTerm = v; filled.add('lease.leaseTerm'); } }
      if (raw.annualMiles) { const v = str(raw.annualMiles); if (LEASE_MILES_OPTIONS.includes(v)) { n.milesPerYear = v; filled.add('lease.milesPerYear'); } }
      return n;
    });

    setFinance(p => {
      const n = { ...p };
      const maybeSet = (f: keyof FinanceFormData, v: unknown) => {
        const s = str(v);
        if (s && !p[f]) { (n as Record<string, string>)[f] = s; filled.add(`finance.${f}`); }
      };
      maybeSet('vehicleYear', raw.year);
      maybeSet('vehicleMake', raw.make);
      maybeSet('vehicleModel', raw.model);
      maybeSet('vehicleTrim', raw.trim);
      maybeSet('msrp', raw.msrp);
      maybeSet('negotiatedPrice', raw.sellingPrice);
      maybeSet('downPayment', raw.downPayment);
      maybeSet('amountFinanced', raw.amountFinanced);
      maybeSet('apr', raw.apr);
      maybeSet('monthlyPayment', raw.monthlyPayment);
      maybeSet('docFee', raw.docFee);
      maybeSet('vehicleMileage', raw.mileage);
      maybeSet('outTheDoorPrice', raw.outTheDoor);
      if (raw.loanTerm) { const v = str(raw.loanTerm); if (FINANCE_TERM_OPTIONS.includes(v)) { n.loanTerm = v; filled.add('finance.loanTerm'); } }
      return n;
    });

    setAdditionalFees(p => {
      const n = { ...p };
      if (raw.salesTax && !p.salesTax) { n.salesTax = str(raw.salesTax); filled.add('salesTax'); }
      if (raw.titleAndReg && !p.titleReg) { n.titleReg = str(raw.titleAndReg); filled.add('titleReg'); }
      return n;
    });

    const hasBundled = raw.gapInsurance || raw.extendedWarranty || raw.tireAndWheel || raw.paintProtection;
    if (hasBundled) {
      setShowBundled(true);
      setBundled(p => {
        const n = { ...p };
        if (raw.gapInsurance && !p.gapInsurance) { n.gapInsurance = str(raw.gapInsurance); filled.add('gapInsurance'); }
        if (raw.extendedWarranty && !p.extendedWarranty) { n.extendedWarranty = str(raw.extendedWarranty); filled.add('extendedWarranty'); }
        if (raw.tireAndWheel && !p.tireWheelProtection) { n.tireWheelProtection = str(raw.tireAndWheel); filled.add('tireWheel'); }
        if (raw.paintProtection && !p.paintInteriorProtection) { n.paintInteriorProtection = str(raw.paintProtection); filled.add('paint'); }
        return n;
      });
    }

    if (raw.tradeInValue || raw.tradeInPayoff) {
      setShowTradeIn(true);
      setTradeIn(p => {
        const n = { ...p };
        if (raw.tradeInValue && !p.dealerOffer) { n.dealerOffer = str(raw.tradeInValue); filled.add('trade.dealerOffer'); }
        if (raw.tradeInPayoff && !p.payoffAmount) { n.payoffAmount = str(raw.tradeInPayoff); filled.add('trade.payoff'); }
        return n;
      });
    }

    // Build summary banner
    const parts: string[] = [];
    if (raw.year || raw.make || raw.model) parts.push([raw.year, raw.make, raw.model].filter(Boolean).join(' '));
    if (raw.dealType) parts.push(String(raw.dealType).charAt(0).toUpperCase() + String(raw.dealType).slice(1));
    if (raw.monthlyPayment) parts.push(`$${Math.round(Number(raw.monthlyPayment))}/mo`);
    if (raw.leaseTerm) parts.push(`${raw.leaseTerm} mo lease`);
    else if (raw.loanTerm) parts.push(`${raw.loanTerm} mo loan`);
    if (raw.msrp) parts.push(`$${Number(raw.msrp).toLocaleString()} MSRP`);
    setAutofillSummary(parts.length > 0 ? `Found: ${parts.join(' · ')}` : 'Fields pre-filled');

    setAutofillHighlight(new Set(filled));
    setTimeout(() => setAutofillHighlight(new Set()), 8000);
  }, []);


  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsExtractingDoc(true);
    setDocStatus({ type: 'idle', msg: '' });
    setAutofillSummary('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/extract-document', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      applyExtracted(data.data);
      setDocStatus({ type: 'success', msg: 'Review all fields — amounts on deal sheets can be formatted differently than expected.' });
    } catch (err) {
      setDocStatus({ type: 'error', msg: err instanceof Error ? err.message : 'Could not read that document.' });
    }
    setIsExtractingDoc(false);
  }

  function handleClear() {
    setDealType('lease'); setState('');
    setLease(LEASE_DEFAULTS); setFinance(FINANCE_DEFAULTS);
    setTradeIn(TRADEIN_DEFAULTS); setShowTradeIn(false);
    setBundled(BUNDLED_DEFAULTS); setShowBundled(false);
    setNotes('');
    setDocStatus({ type: 'idle', msg: '' });
    setAutofillSummary(''); setAutofillHighlight(new Set());
    setResidualMode('percent'); setUsePaymentRange(false);
    setPaymentRangeVal({ low: '', high: '' }); setError('');
    setAdditionalFees({ salesTax: '', titleReg: '', otherAmount: '', otherLabel: '' });
    setShowAdditionalFees(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const updateLease = (f: keyof LeaseFormData, v: string) => setLease(p => ({ ...p, [f]: v }));
  const updateFinance = (f: keyof FinanceFormData, v: string) => setFinance(p => ({ ...p, [f]: v }));
  const updateTradeIn = (f: keyof TradeInData, v: string) => setTradeIn(p => ({ ...p, [f]: v }));
  const updateBundled = (f: keyof BundledCosts, v: string) => setBundled(p => ({ ...p, [f]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsAnalyzing(true);
    if (analysis) setPreviousGrade(analysis.grade);

    // Compute OTD for finance if not explicitly entered
    const computedOtd = financeSummary ? Math.round(financeSummary.subtotal - financeSummary.netTrade).toString() : '';

    const payload: AnalysisRequest = {
      dealType, state,
      ...(dealType === 'lease' ? { lease } : {
        finance: {
          ...finance,
          outTheDoorPrice: finance.outTheDoorPrice || computedOtd,
        },
      }),
      ...(showTradeIn && tradeIn.dealerOffer ? { tradeIn } : {}),
      ...(showBundled ? { bundledCosts: bundled } : {}),
      ...(paymentGap !== undefined ? { paymentGap } : {}),
      ...(usePaymentRange && paymentRangeVal.low && paymentRangeVal.high ? { paymentRange: paymentRangeVal } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Analysis failed');
      setAnalysis(data.analysis);
      setShowForm(false);
      setIsAdjustMode(false);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
    setIsAnalyzing(false);
  }

  function handleAdjust() {
    setIsAdjustMode(true);
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isAnalyzing) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-16 h-16 relative">
          <svg className="animate-spin w-16 h-16 text-gray-200" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /></svg>
          <svg className="animate-spin w-16 h-16 text-blue-500 absolute inset-0" fill="none" viewBox="0 0 24 24" style={{ animationDuration: '0.8s' }}><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        </div>
        <p className="text-xl font-bold text-gray-900">Analyzing your deal…</p>
        <p className="text-gray-500 text-sm">Going through every number</p>
      </div>
    );
  }

  // ── Results ──────────────────────────────────────────────────────────────────
  if (!showForm && analysis) {
    const colors = gradeColor(analysis.grade);
    const rec = recStyle(analysis.recommendation);
    return (
      <div ref={resultsRef} className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-4 print-page">
        {previousGrade && <GradeComparison prev={previousGrade} current={analysis.grade} />}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 print-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <GradeCircle grade={analysis.grade} size="lg" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${rec.cls}`}>{rec.label}</span>
                <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-1 rounded-full">Free Analysis</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-1">{analysis.headline}</h1>
              <p className={`text-sm font-medium ${colors.text} mb-3`}>{analysis.gradeExplanation}</p>
              <p className="text-gray-500 text-sm leading-relaxed">{analysis.summary}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 no-print">
          <button onClick={handleAdjust} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            What if I negotiate?
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Save as PDF
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 print-card">
          <h2 className="font-bold text-gray-900 text-base mb-3">Lease vs. Buy</h2>
          <div className="flex items-start gap-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${analysis.leaseVsBuy.recommendation === 'lease' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
              {analysis.leaseVsBuy.recommendation === 'lease' ? 'Lease' : 'Buy'}
            </span>
            <p className="text-sm text-gray-600 leading-relaxed">{analysis.leaseVsBuy.reasoning}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 print-card">
          <h2 className="font-bold text-gray-900 text-base mb-4">Deal Breakdown</h2>
          <div className="space-y-3">
            {analysis.breakdown.map((row, i) => {
              const s = statusStyle(row.status);
              return (
                <div key={i} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.dot} mt-1.5 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-800">{row.label}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${s.badge}`}>{row.value}</span>
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

        {analysis.tradeIn && (
          <div className={`rounded-2xl border p-6 print-card ${analysis.tradeIn.assessment === 'good' ? 'bg-green-50 border-green-200' : analysis.tradeIn.assessment === 'warn' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
            <h2 className="font-bold text-gray-900 text-base mb-1">Trade-In Verdict</h2>
            <p className={`text-sm font-semibold mb-2 ${analysis.tradeIn.assessment === 'good' ? 'text-green-700' : analysis.tradeIn.assessment === 'warn' ? 'text-amber-700' : 'text-red-700'}`}>{analysis.tradeIn.headline}</p>
            <p className="text-sm text-gray-600 leading-relaxed">{analysis.tradeIn.details}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 print-card">
          <div className="flex items-start gap-3">
            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${analysis.stateTaxCredit.hasCredit ? 'bg-green-500' : 'bg-gray-400'}`} />
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-1">State Trade-In Tax Credit</p>
              <p className="text-sm text-gray-500 leading-relaxed">{analysis.stateTaxCredit.details}</p>
            </div>
          </div>
        </div>

        {analysis.redFlags.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 print-card">
            <h2 className="font-bold text-gray-900 text-base mb-4">Red Flags <span className="text-xs font-normal text-red-500">({analysis.redFlags.length})</span></h2>
            <div className="space-y-3">
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

        <div className="bg-gray-900 rounded-2xl p-6 print-card">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <p className="text-sm font-semibold text-gray-300">Counter-Offer Script</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-gray-100 text-sm leading-relaxed italic">&ldquo;{analysis.counterOfferScript.replace(/^["']|["']$/g, '')}&rdquo;</p>
          </div>
          <p className="text-gray-600 text-xs mt-2">Word for word. Say it calmly. Then stop talking.</p>
        </div>

        <div className="text-xs text-gray-400 leading-relaxed p-4 bg-gray-50 rounded-xl border border-gray-100 print-card">
          <strong className="text-gray-500">Disclaimer:</strong> This analysis is AI-generated for informational purposes only and is not financial or legal advice. All figures are estimates based on the data you entered. Verify all numbers with your dealer and lender before signing any contract.
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  const fmt = (n: number) => n > 0 ? n.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      {!isAdjustMode && (
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-3">Grade My Deal</h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">Enter your numbers and get an honest grade, every red flag, and a word-for-word negotiation script. Free.</p>
        </div>
      )}

      {isAdjustMode && previousGrade && (
        <div ref={formRef} className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <GradeCircle grade={previousGrade} size="sm" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">Adjust your numbers</p>
              <p className="text-gray-500 text-xs">Previous grade: <strong>{previousGrade}</strong>. Change any field and re-run.</p>
            </div>
          </div>
          <button onClick={() => { setShowForm(false); setIsAdjustMode(false); }} className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Autofill tools */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4 overflow-hidden">
        {autofillSummary && (
          <div className="px-5 pt-4">
            <div className="flex items-start gap-2.5 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
              <svg className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div>
                <p className="text-sm font-semibold text-yellow-800">{autofillSummary}</p>
                <p className="text-xs text-yellow-700 mt-0.5">Highlighted fields were auto-filled. Review all values before submitting.</p>
              </div>
            </div>
          </div>
        )}
        <div className="p-5">
          <p className="text-xs text-gray-500 mb-2">Upload a quote screenshot or PDF worksheet:</p>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              {isExtractingDoc ? 'Extracting…' : 'Upload file'}
              <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} disabled={isExtractingDoc} />
            </label>
            <span className="text-xs text-gray-400">JPG, PNG, WEBP, PDF — max 10MB</span>
          </div>
          {docStatus.type !== 'idle' && (
            <p className={`text-xs mt-2 ${docStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{docStatus.msg}</p>
          )}
        </div>
      </div>

      {/* Main form */}
      <div ref={!isAdjustMode ? formRef : undefined} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-6 pb-0">
            <p className="text-xs text-gray-400 mb-5">Enter what you can — the more you fill in, the better the analysis.</p>
            {/* Deal type toggle */}
            <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl w-fit mb-6">
              {(['lease', 'finance'] as const).map(type => (
                <button key={type} type="button" onClick={() => setDealType(type)}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${dealType === type ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {type === 'lease' ? 'Lease' : 'Finance / Buy'}
                </button>
              ))}
            </div>

            {/* Vehicle */}
            <SectionLabel>Vehicle</SectionLabel>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {dealType === 'lease' ? (
                <>
                  <Field label="Year" placeholder="2025" isHighlighted={hl('lease.vehicleYear')} value={lease.vehicleYear} onChange={e => updateLease('vehicleYear', e.target.value)} />
                  <Field label="Make" placeholder="Honda" isHighlighted={hl('lease.vehicleMake')} value={lease.vehicleMake} onChange={e => updateLease('vehicleMake', e.target.value)} />
                  <Field label="Model" placeholder="CR-V" isHighlighted={hl('lease.vehicleModel')} value={lease.vehicleModel} onChange={e => updateLease('vehicleModel', e.target.value)} />
                  <Field label="Trim" placeholder="EX-L (opt.)" isHighlighted={hl('lease.vehicleTrim')} value={lease.vehicleTrim} onChange={e => updateLease('vehicleTrim', e.target.value)} />
                </>
              ) : (
                <>
                  <Field label="Year" placeholder="2025" isHighlighted={hl('finance.vehicleYear')} value={finance.vehicleYear} onChange={e => updateFinance('vehicleYear', e.target.value)} />
                  <Field label="Make" placeholder="Toyota" isHighlighted={hl('finance.vehicleMake')} value={finance.vehicleMake} onChange={e => updateFinance('vehicleMake', e.target.value)} />
                  <Field label="Model" placeholder="Camry" isHighlighted={hl('finance.vehicleModel')} value={finance.vehicleModel} onChange={e => updateFinance('vehicleModel', e.target.value)} />
                  <Field label="Trim" placeholder="XSE (opt.)" isHighlighted={hl('finance.vehicleTrim')} value={finance.vehicleTrim} onChange={e => updateFinance('vehicleTrim', e.target.value)} />
                </>
              )}
            </div>
            {dealType === 'finance' && (
              <div className="mb-6">
                <Field label="Current Mileage (used vehicles only)" placeholder="e.g. 28000" type="number" isHighlighted={hl('finance.vehicleMileage')} hint="Skip for new vehicles" value={finance.vehicleMileage} onChange={e => updateFinance('vehicleMileage', e.target.value)} />
              </div>
            )}
          </div>

          <div className="px-6 pb-6 space-y-5">
            {/* ── DEAL DETAILS — new field order ── */}
            <div>
              <SectionLabel>Deal Details</SectionLabel>
              <div className="space-y-3">

                {/* 1. Selling price — LEAD */}
                {dealType === 'lease' ? (
                  <Field
                    label="Selling price (what they're charging for the car)"
                    prefix="$" placeholder="40,500" type="number"
                    isHighlighted={hl('lease.sellingPrice')}
                    value={lease.sellingPrice} onChange={e => updateLease('sellingPrice', e.target.value)}
                    hint="The negotiated cap cost — this IS negotiable, push below MSRP"
                  />
                ) : (
                  <Field
                    label="Selling price (what they're charging for the car)"
                    prefix="$" placeholder="35,500" type="number"
                    isHighlighted={hl('finance.negotiatedPrice')}
                    value={finance.negotiatedPrice} onChange={e => updateFinance('negotiatedPrice', e.target.value)}
                    hint="The negotiated price — always agree on this before discussing monthly payments"
                  />
                )}

                {/* 2. MSRP */}
                {dealType === 'lease' ? (
                  <Field label="MSRP / sticker price" prefix="$" placeholder="43,000" type="number"
                    isHighlighted={hl('lease.msrp')} value={lease.msrp} onChange={e => updateLease('msrp', e.target.value)} />
                ) : (
                  <Field label="MSRP / sticker price" prefix="$" placeholder="38,000" type="number"
                    isHighlighted={hl('finance.msrp')} value={finance.msrp} onChange={e => updateFinance('msrp', e.target.value)} />
                )}

                {/* 3. Monthly payment */}
                <div>
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Monthly payment quoted</p>
                      <p className="text-xs text-gray-400">Focus on total cost, not the monthly payment</p>
                    </div>
                    <button type="button" onClick={() => setUsePaymentRange(!usePaymentRange)} className="text-xs text-blue-600 hover:text-blue-700 flex-shrink-0 ml-3 mt-0.5">
                      {usePaymentRange ? 'Enter exact amount' : 'Have a range?'}
                    </button>
                  </div>
                  {usePaymentRange ? (
                    <div className="flex items-center gap-2">
                      {['low', 'high'].map((k, i) => (
                        <div key={k} className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                          <input type="number" placeholder={i === 0 ? '380' : '420'}
                            value={paymentRangeVal[k as 'low' | 'high']}
                            onChange={e => setPaymentRangeVal(p => ({ ...p, [k]: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                          {i === 0 && <span className="absolute -right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm z-10">–</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">$</span>
                      {dealType === 'lease'
                        ? <input type="number" placeholder="399" value={lease.monthlyPayment}
                            onChange={e => updateLease('monthlyPayment', e.target.value)}
                            className={`w-full border rounded-lg pl-7 pr-16 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${hl('lease.monthlyPayment') ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'}`} />
                        : <input type="number" placeholder="520" value={finance.monthlyPayment}
                            onChange={e => updateFinance('monthlyPayment', e.target.value)}
                            className={`w-full border rounded-lg pl-7 pr-16 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${hl('finance.monthlyPayment') ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'}`} />
                      }
                      {paymentGap !== undefined && (
                        <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold ${Math.abs(paymentGap) <= 25 ? 'text-green-600' : Math.abs(paymentGap) <= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                          {Math.abs(paymentGap) <= 25 ? '✓ checks out' : `${paymentGap > 0 ? '+' : ''}$${Math.round(paymentGap)} gap`}
                        </span>
                      )}
                    </div>
                  )}
                  {paymentGap !== undefined && Math.abs(paymentGap) > 75 && !usePaymentRange && (
                    <p className="text-xs text-red-600 mt-1">Large gap vs. calculated payment — the AI will explain what&apos;s likely causing this.</p>
                  )}
                </div>

                {/* 4. Deal-type specific fields */}
                {dealType === 'lease' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <Field label="Money factor" placeholder="0.00189" type="number" step="0.00001"
                      isHighlighted={hl('lease.moneyFactor')} value={lease.moneyFactor} onChange={e => updateLease('moneyFactor', e.target.value)}
                      hint="× 2400 = APR equivalent" />

                    {/* Residual toggle */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium text-gray-700">Residual value</label>
                        <div className="flex text-xs rounded-lg overflow-hidden border border-gray-200">
                          <button type="button" onClick={() => setResidualMode('percent')} className={`px-2.5 py-1 font-medium transition ${residualMode === 'percent' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500'}`}>%</button>
                          <button type="button" onClick={() => setResidualMode('dollar')} className={`px-2.5 py-1 font-medium transition ${residualMode === 'dollar' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500'}`}>$</button>
                        </div>
                      </div>
                      {residualMode === 'percent'
                        ? <Field label="" suffix="%" placeholder="52" type="number" isHighlighted={hl('lease.residualPercent')} value={lease.residualPercent} onChange={e => updateLease('residualPercent', e.target.value)} hint="% of MSRP — higher is better" />
                        : <Field label="" prefix="$" placeholder="22360" type="number" isHighlighted={hl('lease.residualDollar')} value={lease.residualDollar} onChange={e => updateLease('residualDollar', e.target.value)} hint="Dollar amount from lease worksheet" />
                      }
                    </div>

                    <SelectField label="Lease term" isHighlighted={hl('lease.leaseTerm')} value={lease.leaseTerm} onChange={e => updateLease('leaseTerm', e.target.value)}>
                      {LEASE_TERM_OPTIONS.map(m => <option key={m} value={m}>{m} months</option>)}
                    </SelectField>
                    <SelectField label="Annual miles" isHighlighted={hl('lease.milesPerYear')} value={lease.milesPerYear} onChange={e => updateLease('milesPerYear', e.target.value)}>
                      {LEASE_MILES_OPTIONS.map(m => <option key={m} value={m}>{parseInt(m).toLocaleString()} mi/yr</option>)}
                    </SelectField>
                    <Field label="Due at signing (total on day 1)" prefix="$" placeholder="3,500" type="number"
                      isHighlighted={hl('lease.driveOff')} value={lease.driveOff} onChange={e => updateLease('driveOff', e.target.value)}
                      hint="Everything paid at signing: first month + taxes + fees + down payment" />
                    <Field label="Acquisition fee" prefix="$" placeholder="650" type="number"
                      isHighlighted={hl('lease.acquisitionFee')} value={lease.acquisitionFee} onChange={e => updateLease('acquisitionFee', e.target.value)}
                      hint="Bank fee — $595–$925 is normal" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <Field label="Amount financed" prefix="$" placeholder="27,000" type="number"
                      isHighlighted={hl('finance.amountFinanced')} value={finance.amountFinanced} onChange={e => updateFinance('amountFinanced', e.target.value)}
                      hint="From the contract — selling price minus down payment plus any rolled-in fees" />
                    <div />
                    <Field label="APR" suffix="%" placeholder="6.9" type="number" step="0.01"
                      isHighlighted={hl('finance.apr')} value={finance.apr} onChange={e => updateFinance('apr', e.target.value)} />
                    <SelectField label="Loan term" isHighlighted={hl('finance.loanTerm')} value={finance.loanTerm} onChange={e => updateFinance('loanTerm', e.target.value)}>
                      {FINANCE_TERM_OPTIONS.map(m => <option key={m} value={m}>{m} months</option>)}
                    </SelectField>
                  </div>
                )}

                {/* 5. Down payment / cap cost reduction */}
                {dealType === 'lease' ? (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <label className="text-sm font-medium text-gray-700">Down payment / cap cost reduction</label>
                      <span className="relative group cursor-help">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="absolute bottom-5 left-0 w-56 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition">
                          Putting money down on a lease rarely makes financial sense — you lose it if the car is totaled. Keep this $0 if possible.
                        </span>
                      </span>
                    </div>
                    <Field label="" prefix="$" placeholder="0" type="number"
                      isHighlighted={hl('lease.capCostReduction')} value={lease.capCostReduction} onChange={e => updateLease('capCostReduction', e.target.value)} />
                  </div>
                ) : (
                  <Field label="Down payment" prefix="$" placeholder="3,000" type="number"
                    isHighlighted={hl('finance.downPayment')} value={finance.downPayment} onChange={e => updateFinance('downPayment', e.target.value)}
                    hint="Cash from your pocket at signing" />
                )}

                {/* 6. Doc fee */}
                {dealType === 'lease' ? (
                  <Field label="Doc fee" prefix="$" placeholder="399" type="number"
                    isHighlighted={hl('lease.docFee')} value={lease.docFee} onChange={e => updateLease('docFee', e.target.value)}
                    hint="Average $150–500. Above $500 is mostly profit — ask them to reduce it." />
                ) : (
                  <Field label="Doc fee" prefix="$" placeholder="399" type="number"
                    isHighlighted={hl('finance.docFee')} value={finance.docFee} onChange={e => updateFinance('docFee', e.target.value)}
                    hint="Average $150–500. Above $500 is mostly profit — ask them to reduce it." />
                )}

                {/* 7. Additional fees (collapsible) */}
                <div>
                  <button type="button" onClick={() => setShowAdditionalFees(!showAdditionalFees)}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition">
                    <svg className={`w-4 h-4 transition-transform ${showAdditionalFees ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    Additional fees <span className="text-gray-400">(optional but helps the calculation)</span>
                  </button>
                  {showAdditionalFees && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <Field label="Sales tax ($)" prefix="$" placeholder="auto-estimated from state" type="number"
                        isHighlighted={hl('salesTax')} value={additionalFees.salesTax}
                        onChange={e => setAdditionalFees(p => ({ ...p, salesTax: e.target.value }))}
                        hint={taxInfo ? `${taxInfo.salesTaxRate}% in ${state} — leave blank to use estimate` : 'Leave blank to estimate from state'} />
                      <Field label="Title & registration ($)" prefix="$" placeholder="auto-estimated from state" type="number"
                        isHighlighted={hl('titleReg')} value={additionalFees.titleReg}
                        onChange={e => setAdditionalFees(p => ({ ...p, titleReg: e.target.value }))}
                        hint={taxInfo ? `~$${taxInfo.avgTitleReg} estimated for ${state}` : 'Leave blank to estimate from state'} />
                      <Field label="Other fees label" placeholder="VIN etching, LoJack…"
                        value={additionalFees.otherLabel} onChange={e => setAdditionalFees(p => ({ ...p, otherLabel: e.target.value }))} />
                      <Field label="Other fees ($)" prefix="$" placeholder="0" type="number"
                        value={additionalFees.otherAmount} onChange={e => setAdditionalFees(p => ({ ...p, otherAmount: e.target.value }))} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── CALCULATED SUMMARY CARD ── */}
            {(financeSummary?.price || leaseSummary?.sp) ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 font-mono text-xs">
                {dealType === 'finance' && financeSummary && financeSummary.price > 0 ? (
                  <>
                    <p className="font-bold text-gray-700 text-xs uppercase tracking-wide mb-3 font-sans">Estimated Out-the-Door</p>
                    <div className="space-y-1.5 text-gray-600">
                      <div className="flex justify-between"><span>Selling price</span><span>${fmt(financeSummary.price)}</span></div>
                      {financeSummary.doc > 0 && <div className="flex justify-between"><span>Doc fee</span><span>${fmt(financeSummary.doc)}</span></div>}
                      <div className="flex justify-between">
                        <span>Sales tax ({financeSummary.salesTaxRate}%){financeSummary.isTaxEst ? <span className="text-gray-400"> *est.</span> : null}</span>
                        <span>${fmt(financeSummary.salesTax)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Title &amp; reg{financeSummary.isTitleEst ? <span className="text-gray-400"> *est.</span> : null}</span>
                        <span>${fmt(financeSummary.titleReg)}</span>
                      </div>
                      {financeSummary.otherFees > 0 && <div className="flex justify-between"><span>Other fees</span><span>${fmt(financeSummary.otherFees)}</span></div>}
                      <div className="flex justify-between font-bold text-gray-800 border-t border-slate-300 pt-1.5 mt-0.5"><span>Subtotal</span><span>${fmt(financeSummary.subtotal)}</span></div>
                      {financeSummary.down > 0 && <div className="flex justify-between text-gray-500"><span>Less down payment</span><span>−${fmt(financeSummary.down)}</span></div>}
                      {financeSummary.netTrade !== 0 && (
                        <div className={`flex justify-between ${financeSummary.netTrade < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          <span>{financeSummary.netTrade < 0 ? 'Plus negative trade equity' : 'Less net trade-in'}</span>
                          <span>{financeSummary.netTrade < 0 ? '+' : '−'}${fmt(Math.abs(financeSummary.netTrade))}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-gray-900 border-t border-slate-300 pt-1.5"><span>Amount financed</span><span>${fmt(financeSummary.amtFinanced)}</span></div>
                    </div>
                    {financeSummary.payment > 0 && financeSummary.term > 0 && (
                      <>
                        <div className="border-t border-slate-300 my-3" />
                        <p className="font-bold text-gray-700 text-xs uppercase tracking-wide mb-2 font-sans">Total Cost of Ownership</p>
                        <div className="space-y-1.5 text-gray-600">
                          <div className="flex justify-between"><span>{finance.loanTerm} payments × ${fmt(financeSummary.payment)}</span><span>${fmt(financeSummary.totalMonthly)}</span></div>
                          {financeSummary.down > 0 && <div className="flex justify-between"><span>+ Down payment</span><span>${fmt(financeSummary.down)}</span></div>}
                          <div className="flex justify-between font-bold text-gray-900 border-t border-slate-300 pt-1.5"><span>Total paid</span><span>${fmt(financeSummary.totalPaid)}</span></div>
                          {financeSummary.amtFinanced > 0 && financeSummary.totalMonthly > 0 && (
                            <div className="flex justify-between text-gray-500"><span>Interest paid</span><span>${fmt(Math.max(financeSummary.totalMonthly - financeSummary.amtFinanced, 0))}</span></div>
                          )}
                        </div>
                      </>
                    )}
                    {(financeSummary.isTaxEst || financeSummary.isTitleEst) && (
                      <p className="text-gray-400 text-xs mt-3 font-sans">* Estimated from {state || 'state'} averages. Enter actual amounts above for precision.</p>
                    )}
                  </>
                ) : dealType === 'lease' && leaseSummary && leaseSummary.sp > 0 ? (
                  <>
                    <p className="font-bold text-gray-700 text-xs uppercase tracking-wide mb-3 font-sans">Lease Cost Summary</p>
                    <div className="space-y-1.5 text-gray-600">
                      <div className="flex justify-between"><span>Selling price (cap cost)</span><span>${fmt(leaseSummary.sp)}</span></div>
                      {leaseSummary.acq > 0 && <div className="flex justify-between"><span>+ Acquisition fee</span><span>${fmt(leaseSummary.acq)}</span></div>}
                      {leaseSummary.doc > 0 && <div className="flex justify-between"><span>+ Doc fee</span><span>${fmt(leaseSummary.doc)}</span></div>}
                      {leaseSummary.capCost > 0 && <div className="flex justify-between font-bold text-gray-800 border-t border-slate-300 pt-1.5 mt-0.5"><span>Cap cost</span><span>${fmt(leaseSummary.capCost)}</span></div>}
                      {leaseSummary.ccr > 0 && <div className="flex justify-between text-gray-500"><span>- Cap cost reduction</span><span>−${fmt(leaseSummary.ccr)}</span></div>}
                      {leaseSummary.tradeNetPositive > 0 && <div className="flex justify-between text-gray-500"><span>- Trade-in (net)</span><span>−${fmt(leaseSummary.tradeNetPositive)}</span></div>}
                      {leaseSummary.adjCapCost > 0 && <div className="flex justify-between font-bold text-gray-900 border-t border-slate-300 pt-1.5"><span>Adjusted cap cost</span><span>${fmt(leaseSummary.adjCapCost)}</span></div>}
                    </div>
                    {leaseSummary.payment > 0 && leaseSummary.term > 0 && (
                      <>
                        <div className="border-t border-slate-300 my-3" />
                        <p className="font-bold text-gray-700 text-xs uppercase tracking-wide mb-2 font-sans">Total Paid to Lease</p>
                        <div className="space-y-1.5 text-gray-600">
                          <div className="flex justify-between"><span>{lease.leaseTerm} payments × ${fmt(leaseSummary.payment)}</span><span>${fmt(leaseSummary.totalMonthly)}</span></div>
                          {leaseSummary.driveOff > 0 && <div className="flex justify-between"><span>+ Due at signing</span><span>${fmt(leaseSummary.driveOff)}</span></div>}
                          <div className="flex justify-between font-bold text-gray-900 border-t border-slate-300 pt-1.5"><span>Total paid to lease</span><span>${fmt(leaseSummary.totalPaid)}</span></div>
                        </div>
                        <p className="text-gray-500 mt-2 font-sans">At end of lease, you own nothing.</p>
                        {leaseSummary.resDol > 0 && (
                          <div className="flex justify-between mt-1 text-gray-600 font-sans">
                            <span>Residual to buy out:</span><span className="font-bold">${fmt(leaseSummary.resDol)}</span>
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : null}
              </div>
            ) : null}

            {/* Location */}
            <div>
              <SectionLabel>Location</SectionLabel>
              <div className="max-w-xs">
                <SelectField label="Your State" isHighlighted={hl('state')} value={state} onChange={e => setState(e.target.value)} required>
                  <option value="">Select state…</option>
                  {US_STATES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </SelectField>
              </div>
            </div>

            {/* Dealer add-ons */}
            <div>
              <button type="button" onClick={() => setShowBundled(!showBundled)} className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition mb-3">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${showBundled ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                  {showBundled && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                Dealer add-ons / bundled products
              </button>
              {showBundled && (
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 space-y-3">
                  <SectionLabel>Bundled Products</SectionLabel>
                  <p className="text-xs text-gray-500 -mt-2">Enter what&apos;s been bundled into your deal. We&apos;ll assess each one for fair value.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Extended warranty" prefix="$" placeholder="1200" type="number" isHighlighted={hl('extendedWarranty')} value={bundled.extendedWarranty} onChange={e => updateBundled('extendedWarranty', e.target.value)} />
                    <Field label="GAP insurance" prefix="$" placeholder="650" type="number" isHighlighted={hl('gapInsurance')} value={bundled.gapInsurance} onChange={e => updateBundled('gapInsurance', e.target.value)} hint="Your insurer offers this for ~$20-60/yr" />
                    <Field label="Tire & wheel protection" prefix="$" placeholder="395" type="number" isHighlighted={hl('tireWheel')} value={bundled.tireWheelProtection} onChange={e => updateBundled('tireWheelProtection', e.target.value)} />
                    <Field label="Paint / interior protection" prefix="$" placeholder="495" type="number" isHighlighted={hl('paint')} value={bundled.paintInteriorProtection} onChange={e => updateBundled('paintInteriorProtection', e.target.value)} />
                    <Field label="Other (label)" placeholder="VIN etching…" value={bundled.otherLabel} onChange={e => updateBundled('otherLabel', e.target.value)} />
                    <Field label="Other (amount)" prefix="$" placeholder="199" type="number" value={bundled.otherAmount} onChange={e => updateBundled('otherAmount', e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            {/* Trade-in */}
            <div>
              <button type="button" onClick={() => setShowTradeIn(!showTradeIn)} className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition mb-3">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${showTradeIn ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                  {showTradeIn && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                I have a trade-in
              </button>
              {showTradeIn && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <SectionLabel>Trade-In Details</SectionLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="Year" placeholder="2019" type="number" value={tradeIn.year} onChange={e => updateTradeIn('year', e.target.value)} />
                    <Field label="Make" placeholder="Ford" value={tradeIn.make} onChange={e => updateTradeIn('make', e.target.value)} />
                    <Field label="Model" placeholder="F-150" value={tradeIn.model} onChange={e => updateTradeIn('model', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Mileage" placeholder="62000" type="number" value={tradeIn.mileage} onChange={e => updateTradeIn('mileage', e.target.value)} />
                    <SelectField label="Condition" value={tradeIn.condition} onChange={e => updateTradeIn('condition', e.target.value)}>
                      {['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'].map(c => <option key={c} value={c}>{c}</option>)}
                    </SelectField>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Dealer offer" prefix="$" placeholder="14000" type="number" isHighlighted={hl('trade.dealerOffer')} value={tradeIn.dealerOffer} onChange={e => updateTradeIn('dealerOffer', e.target.value)} />
                    <Field label="Payoff amount owed" prefix="$" placeholder="3500" type="number" isHighlighted={hl('trade.payoff')} value={tradeIn.payoffAmount} onChange={e => updateTradeIn('payoffAmount', e.target.value)} hint="$0 if paid off" />
                  </div>
                  {tradeIn.dealerOffer && (
                    <div className={`p-3 rounded-lg border text-sm space-y-1.5 ${isUpsideDown ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                      <div className="flex justify-between text-gray-600"><span>Dealer offer</span><span>${dealerOffer.toLocaleString()}</span></div>
                      {tradeIn.payoffAmount && <div className="flex justify-between text-gray-600"><span>Payoff</span><span>−${payoffAmount.toLocaleString()}</span></div>}
                      <div className={`flex justify-between font-bold border-t pt-1.5 ${isUpsideDown ? 'text-red-700 border-red-200' : 'text-gray-900 border-gray-200'}`}>
                        <span>Net trade-in</span><span>${netTradeIn.toLocaleString()}</span>
                      </div>
                      {isUpsideDown && <p className="text-red-600 text-xs font-medium">⚠ Upside down by ${Math.abs(netTradeIn).toLocaleString()} — rolls into loan</p>}
                    </div>
                  )}
                  <Field label="KBB / Carmax estimate" prefix="$" placeholder="16500" type="number" value={tradeIn.kbbEstimate} onChange={e => updateTradeIn('kbbEstimate', e.target.value)} hint="Get this from kbb.com or carmax.com first" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Known issues</label>
                    <textarea rows={2} placeholder="Cracked windshield, high miles, needs tires…" value={tradeIn.knownIssues} onChange={e => updateTradeIn('knownIssues', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none" />
                  </div>
                </div>
              )}
            </div>

            {/* Guidance */}
            <div>
              <button type="button" onClick={() => setShowGuidance(!showGuidance)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition">
                <svg className={`w-4 h-4 transition-transform ${showGuidance ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                How to get this information from your dealer
              </button>
              {showGuidance && (
                <div className="mt-3 p-5 bg-blue-50 rounded-xl border border-blue-100 space-y-4 text-sm text-gray-700">
                  {dealType === 'lease' ? (
                    <>
                      <div><p className="font-semibold text-gray-900 mb-1">Money Factor</p><p>Ask: &ldquo;What is the base money factor?&rdquo; It&apos;s a 5-digit decimal like 0.00189. Multiply by 2,400 to get the APR equivalent. The dealer may mark it up — compare to the manufacturer&apos;s published rate.</p></div>
                      <div><p className="font-semibold text-gray-900 mb-1">Residual Value</p><p>Ask: &ldquo;What is the residual as a percentage of MSRP?&rdquo; This is set by the manufacturer and is not negotiable. Higher is better.</p></div>
                      <div><p className="font-semibold text-gray-900 mb-1">Selling Price / Cap Cost</p><p>This IS negotiable. Push for invoice or below. The selling price before fees is called the &ldquo;gross capitalized cost&rdquo; on the lease worksheet.</p></div>
                    </>
                  ) : (
                    <>
                      <div><p className="font-semibold text-gray-900 mb-1">Negotiated Price</p><p>Agree on this number first, before discussing monthly payment. Get it in writing.</p></div>
                      <div><p className="font-semibold text-gray-900 mb-1">APR</p><p>Check your bank or credit union before going in — you can often beat the dealer&apos;s rate. Use it as leverage.</p></div>
                      <div><p className="font-semibold text-gray-900 mb-1">Out-the-Door Price</p><p>Ask for a full itemized breakdown: vehicle price + tax + title/reg + doc fee + add-ons.</p></div>
                    </>
                  )}
                  <div><p className="font-semibold text-gray-900 mb-1">Trade-In</p><p>Get offers from KBB Instant Cash Offer, Carmax, and Carvana before the dealer. This is your leverage.</p></div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea rows={3} placeholder="Anything the AI should know — e.g. dealer says price is non-negotiable, you need low monthly payment, you plan to buy out at lease end…"
                value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none" />
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button type="submit" className="px-10 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm transition-all shadow-sm">
                {isAdjustMode ? 'Re-run Analysis' : 'Grade My Deal'}
              </button>
              <button type="button" onClick={handleClear} className="px-5 py-3.5 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium rounded-xl text-sm transition">
                Clear Form
              </button>
            </div>

            <p className="text-xs text-gray-400">Analysis is AI-generated for informational purposes only. Not financial advice.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
