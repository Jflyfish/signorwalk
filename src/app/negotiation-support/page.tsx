'use client';

import { useState, useEffect, useRef } from 'react';
import { US_STATES } from '@/lib/states';

interface SessionData {
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleTrim?: string;
  dealType?: string;
  state?: string;
  sellingPrice?: string;
  monthlyPayment?: string;
  hasTradeIn?: boolean;
  tradeInVehicle?: string;
  tradeInOffer?: string;
  tradeInPayoff?: string;
  hasUploadedQuote?: boolean;
}

function Field({ label, hint, ...props }: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input {...props} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function NegotiationSupportPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [trim, setTrim] = useState('');
  const [dealType, setDealType] = useState('');
  const [state, setState] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [dealerResponse, setDealerResponse] = useState('');
  const [visitCount, setVisitCount] = useState('');
  const [timeline, setTimeline] = useState('');
  const [hasTradeIn, setHasTradeIn] = useState(false);
  const [tradeInVehicle, setTradeInVehicle] = useState('');
  const [tradeInOffer, setTradeInOffer] = useState('');
  const [tradeInPayoff, setTradeInPayoff] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [hasExistingQuote, setHasExistingQuote] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Break out of Stripe iframe on payment redirect
  useEffect(() => {
    if (typeof window !== 'undefined' && window !== window.parent) {
      window.parent.location.href = window.location.href;
    }
  }, []);

  // Pre-fill from Sign or Walk session
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('sow_session');
      if (raw) {
        const data: SessionData = JSON.parse(raw);
        if (data.vehicleYear) setYear(data.vehicleYear);
        if (data.vehicleMake) setMake(data.vehicleMake);
        if (data.vehicleModel) setModel(data.vehicleModel);
        if (data.vehicleTrim) setTrim(data.vehicleTrim);
        if (data.dealType) setDealType(data.dealType);
        if (data.state) setState(data.state);
        if (data.sellingPrice) setSellingPrice(data.sellingPrice);
        if (data.monthlyPayment) setMonthlyPayment(data.monthlyPayment);
        if (data.hasTradeIn) setHasTradeIn(data.hasTradeIn);
        if (data.tradeInVehicle) setTradeInVehicle(data.tradeInVehicle);
        if (data.tradeInOffer) setTradeInOffer(data.tradeInOffer);
        if (data.tradeInPayoff) setTradeInPayoff(data.tradeInPayoff);
      }

      // Restore uploaded quote file from analyze step
      const stored = sessionStorage.getItem('sow_quote_b64');
      if (stored) {
        const { filename, type, data: dataUrl } = JSON.parse(stored);
        const base64 = dataUrl.split(',')[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type });
        setFile(new File([blob], filename, { type }));
        setHasExistingQuote(true);
      }
    } catch {
      // session data unavailable
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const fd = new FormData();
    fd.append('name', name);
    fd.append('email', email);
    fd.append('year', year);
    fd.append('make', make);
    fd.append('model', model);
    fd.append('trim', trim);
    fd.append('dealType', dealType);
    fd.append('state', state);
    fd.append('sellingPrice', sellingPrice);
    fd.append('monthlyPayment', monthlyPayment);
    fd.append('dealerResponse', dealerResponse);
    fd.append('visitCount', visitCount);
    fd.append('timeline', timeline);
    fd.append('hasTradeIn', hasTradeIn ? 'yes' : 'no');
    if (hasTradeIn) {
      fd.append('tradeInVehicle', tradeInVehicle);
      fd.append('tradeInOffer', tradeInOffer);
      fd.append('tradeInPayoff', tradeInPayoff);
    }
    fd.append('additionalNotes', additionalNotes);
    if (file) fd.append('file', file);

    // Attach full calculator data from session
    try {
      const raw = sessionStorage.getItem('sow_session');
      if (raw) fd.append('dealData', raw);
    } catch { /* sessionStorage unavailable */ }

    try {
      const res = await fetch('/api/negotiation-support', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
    setIsSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Got it — you&apos;ll hear from us within 24 hours.</h1>
        <p className="text-gray-500 mb-4">Check your inbox at <strong>{email}</strong>. After your dealership visit reply to that email with your one follow up question.</p>
        <p className="text-xs text-gray-400">Check your spam folder just in case.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-2">You&apos;re in — let&apos;s get you a better deal.</h1>
        <p className="text-gray-500">Fill this out and a former car industry professional will email your personalized negotiation strategy within 24 hours.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Contact */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <Field label="Full name" placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)} required />
          <Field label="Email address" type="email" placeholder="jane@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>

        {/* Vehicle */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <p className="text-sm font-semibold text-gray-700">Vehicle</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Year" placeholder="2025" value={year} onChange={e => setYear(e.target.value)} />
            <Field label="Make" placeholder="Honda" value={make} onChange={e => setMake(e.target.value)} />
            <Field label="Model" placeholder="CR-V" value={model} onChange={e => setModel(e.target.value)} />
            <Field label="Trim" placeholder="EX-L (optional)" value={trim} onChange={e => setTrim(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deal type</label>
            <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl w-fit">
              {(['lease', 'finance'] as const).map(t => (
                <button key={t} type="button" onClick={() => setDealType(t)}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${dealType === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {t === 'lease' ? 'Lease' : 'Finance / Buy'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <select value={state} onChange={e => setState(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none">
              <option value="">Select state…</option>
              {US_STATES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Selling price" placeholder="$38,000" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} />
            <Field label="Monthly payment quoted" placeholder="$499" value={monthlyPayment} onChange={e => setMonthlyPayment(e.target.value)} />
          </div>
        </div>

        {/* Negotiation context */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <p className="text-sm font-semibold text-gray-700">Negotiation context</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What did the dealer say when you tried to negotiate? <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea rows={3} value={dealerResponse} onChange={e => setDealerResponse(e.target.value)}
              placeholder="e.g. 'This is our best price' or 'My manager won't go lower'"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">How many times have you visited?</label>
            <select value={visitCount} onChange={e => setVisitCount(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none">
              <option value="">Select…</option>
              <option value="First visit">First visit</option>
              <option value="Second visit">Second visit</option>
              <option value="3 or more times">3 or more times</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">How soon do you need to decide?</label>
            <select value={timeline} onChange={e => setTimeline(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none">
              <option value="">Select…</option>
              <option value="Today">Today</option>
              <option value="2-3 days">2–3 days</option>
              <option value="This week">This week</option>
              <option value="No rush">No rush</option>
            </select>
          </div>
        </div>

        {/* Trade-in */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Trade-in vehicle</p>
            <button type="button" onClick={() => setHasTradeIn(!hasTradeIn)}
              className={`relative w-10 h-6 rounded-full transition-colors ${hasTradeIn ? 'bg-blue-500' : 'bg-gray-200'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${hasTradeIn ? 'left-5' : 'left-1'}`} />
            </button>
          </div>
          {hasTradeIn && (
            <div className="space-y-3">
              <Field label="Trade-in vehicle" placeholder="2020 Toyota Camry" value={tradeInVehicle} onChange={e => setTradeInVehicle(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Dealer offer ($)" placeholder="14,000" value={tradeInOffer} onChange={e => setTradeInOffer(e.target.value)} />
                <Field label="Amount owed on trade ($)" placeholder="3,500" hint="$0 if paid off" value={tradeInPayoff} onChange={e => setTradeInPayoff(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        {/* Quote upload */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
          <p className="text-sm font-semibold text-gray-700">Upload your dealer quote <span className="text-gray-400 font-normal">(optional)</span></p>
          {hasExistingQuote && file && (
            <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">Your quote from the analysis is attached — upload a new one only if it&apos;s different</p>
          )}
          <p className="text-xs text-gray-400">Photo or PDF of your dealer quote helps us give you a more accurate strategy</p>
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            {file ? file.name : 'Choose file'}
            <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden"
              onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </label>
          {file && <p className="text-xs text-gray-400">JPG, PNG, HEIC or PDF — max 10MB</p>}
        </div>

        {/* Additional notes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Anything else we should know, or any additional questions <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea rows={3} value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)}
            placeholder="Dealer pressure tactics, verbal promises, anything that felt off"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none" />
        </div>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        <button type="submit" disabled={isSubmitting}
          className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white font-bold rounded-xl text-sm transition-all shadow-sm">
          {isSubmitting ? 'Sending…' : 'Send my deal →'}
        </button>
      </form>
    </div>
  );
}
