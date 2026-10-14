'use client';

import { useId, useRef, useState } from 'react';
import { track } from '@vercel/analytics';
import { GRADE_FILL } from '@/cu/grades';
import type { TenantReport } from '@/cu/engine/types';
import type { CuPublic } from '@/cu/tenants';
import { US_STATES } from '@/lib/states';

const FINANCE_TERMS = ['24', '36', '48', '60', '72', '84'];
const LEASE_TERMS = ['24', '36', '39', '42', '48'];

const EMPTY = {
  sellingPrice: '',
  msrp: '',
  rebates: '',
  downPayment: '',
  docFee: '',
  monthlyPayment: '',
  apr: '',
  moneyFactor: '',
  buyRateMoneyFactor: '',
  residualPercent: '',
  acquisitionFee: '',
  amountFinanced: '',
  tradeDealerOffer: '',
  tradePayoff: '',
  extendedWarranty: '',
  gapInsurance: '',
  tireWheel: '',
  paintInterior: '',
};

type FieldKey = keyof typeof EMPTY;
type DealType = 'lease' | 'finance';

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base bg-white text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900';

function Field({
  id, label, hint, value, onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-900 mb-1">{label}</label>
      {hint ? <p id={hintId} className="text-xs text-gray-700 mb-1">{hint}</p> : null}
      <input
        id={id}
        name={id}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        aria-describedby={hintId}
        onChange={e => onChange(e.target.value)}
        className={inputClass}
      />
    </div>
  );
}

function statusText(status: 'good' | 'warn' | 'bad'): string {
  if (status === 'good') return 'Within typical range';
  if (status === 'warn') return 'Review';
  return 'Outside typical range';
}

function trackSafe(name: 'analysis_completed' | 'cta_clicked', props: Record<string, string>) {
  try {
    track(name, props);
  } catch {
    /* analytics must never block the result */
  }
}

export function CheckForm({ tenant }: { tenant: CuPublic }) {
  const formId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [dealType, setDealType] = useState<DealType>('finance');
  const [term, setTerm] = useState('60');
  const [state, setState] = useState('');
  const [fields, setFields] = useState(EMPTY);
  const [showTrade, setShowTrade] = useState(false);
  const [showAddons, setShowAddons] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<TenantReport | null>(null);

  const primary = `rgb(${tenant.colors.primary})`;
  const fg = `rgb(${tenant.colors.primaryFg})`;
  const accent = `rgb(${tenant.colors.accent})`;

  function setField(key: FieldKey, value: string) {
    setFields(prev => ({ ...prev, [key]: value }));
  }

  function switchType(next: DealType) {
    setDealType(next);
    setTerm(next === 'lease' ? '36' : '60');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const skip = new Set<FieldKey>();
    if (!showTrade) {
      skip.add('tradeDealerOffer');
      skip.add('tradePayoff');
    }
    if (!showAddons) {
      skip.add('extendedWarranty');
      skip.add('gapInsurance');
      skip.add('tireWheel');
      skip.add('paintInterior');
    }
    if (dealType === 'finance') {
      skip.add('moneyFactor');
      skip.add('buyRateMoneyFactor');
      skip.add('residualPercent');
      skip.add('acquisitionFee');
    } else {
      skip.add('apr');
      skip.add('amountFinanced');
    }
    const payload: Record<string, string> = { dealType, termMonths: term };
    if (state) payload.state = state;
    let any = false;
    for (const key of Object.keys(fields) as FieldKey[]) {
      if (skip.has(key)) continue;
      const raw = fields[key].trim();
      if (!raw) continue;
      if (!/^\d+(\.\d+)?$/.test(raw.replace(/[$,]/g, ''))) {
        setError('Use numbers only. Leave a line blank if you do not have it.');
        return;
      }
      payload[key] = raw.replace(/[$,]/g, '');
      any = true;
    }
    if (!any) {
      setError('Enter at least one number from the worksheet.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/cu/${tenant.id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success || data.mode !== 'rules') {
        setError(typeof data.error === 'string' ? data.error : 'Check the numbers and try again.');
        return;
      }
      setReport(data.analysis as TenantReport);
      const grade = String(data.analysis.grade);
      const archetype = String(data.analysis.archetype);
      if (['A', 'B', 'C', 'D', 'F'].includes(grade) && /^(LEASE|FIN)_[A-Z_]+$/.test(archetype)) {
        trackSafe('analysis_completed', { tenant: tenant.id, grade, dealType, archetype });
      }
      requestAnimationFrame(() => headingRef.current?.focus());
    } catch {
      setError('Check the numbers and try again.');
    } finally {
      setBusy(false);
    }
  }

  if (report) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-4">
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-black tracking-tight text-gray-900 outline-none">
          Offer comparison
        </h1>
        <section className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6" aria-labelledby="grade-heading">
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-full text-white flex items-center justify-center text-3xl font-black shrink-0"
              style={{ backgroundColor: GRADE_FILL[report.grade] ?? '#111827' }}
              aria-hidden="true"
            >
              {report.grade}
            </div>
            <div>
              <p id="grade-heading" className="text-sm font-semibold text-gray-700">Grade {report.grade}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{report.headline}</p>
              <p className="text-sm text-gray-800 mt-2 leading-relaxed">{report.gradeExplanation}</p>
              <p className="mt-3 inline-block text-sm font-semibold text-gray-900 bg-gray-100 border border-gray-200 rounded-full px-3 py-1">
                {report.recommendationLabel}
              </p>
            </div>
          </div>
          <p className="text-gray-800 mt-4 leading-relaxed">{report.summary}</p>
          {report.limitedData ? (
            <p className="text-sm text-gray-700 mt-2">Some worksheet lines were left blank. Blank lines were not treated as problems.</p>
          ) : null}
        </section>

        {report.breakdown.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6" aria-labelledby="breakdown-heading">
            <h2 id="breakdown-heading" className="text-lg font-bold text-gray-900 mb-1">Figures you entered</h2>
            <ul className="divide-y divide-gray-100">
              {report.breakdown.map(row => (
                <li key={row.label} className="py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-gray-900">{row.label}</p>
                    <p className="text-sm text-gray-900 tabular-nums">{row.value}</p>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-700 mt-1">{statusText(row.status)}</p>
                  <p className="text-sm text-gray-700 mt-1 leading-relaxed">{row.explanation}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {report.itemsToReview.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6" aria-labelledby="review-heading">
            <h2 id="review-heading" className="text-lg font-bold text-gray-900 mb-3">Items to review</h2>
            <ul className="space-y-4">
              {report.itemsToReview.map(item => (
                <li key={item.id}>
                  <p className="text-gray-900">{item.issue}</p>
                  <p className="text-sm text-gray-700 mt-1">{item.action}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6" aria-labelledby="questions-heading">
          <h2 id="questions-heading" className="text-lg font-bold text-gray-900 mb-2">Questions you can ask</h2>
          <p className="text-gray-800 leading-relaxed">{report.questionsToAsk}</p>
          <p className="text-sm text-gray-700 mt-3">{report.structureNote}</p>
        </section>

        {report.tradeIn && (
          <section className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6" aria-labelledby="trade-heading">
            <h2 id="trade-heading" className="text-lg font-bold text-gray-900">{report.tradeIn.headline}</h2>
            <p className="text-gray-800 mt-2 leading-relaxed">{report.tradeIn.details}</p>
          </section>
        )}

        {report.stateTaxNote && (
          <section className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6" aria-labelledby="tax-heading">
            <h2 id="tax-heading" className="text-lg font-bold text-gray-900 mb-2">Trade-in and tax</h2>
            <p className="text-gray-800 leading-relaxed">{report.stateTaxNote}</p>
          </section>
        )}

        <section className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: primary, color: fg }} aria-labelledby="next-heading">
          <h2 id="next-heading" className="text-lg font-bold">Continue with {tenant.name}</h2>
          <p className="text-sm mt-1 mb-4 opacity-90">These links leave this page and open the credit union’s own site. This tool does not take an application.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={tenant.preApprovalUrl}
              className="inline-flex justify-center px-5 py-3 rounded-xl bg-white text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              style={{ color: accent }}
              onClick={() => trackSafe('cta_clicked', { tenant: tenant.id, target: 'preapproval' })}
            >
              {tenant.preApprovalLabel}
            </a>
            <a
              href={tenant.ratesUrl}
              className="inline-flex justify-center px-5 py-3 rounded-xl border border-white/40 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              style={{ color: fg }}
              onClick={() => trackSafe('cta_clicked', { tenant: tenant.id, target: 'rates' })}
            >
              {tenant.ratesLabel}
            </a>
          </div>
        </section>

        <ul className="text-xs text-gray-700 space-y-2 leading-relaxed">
          {report.disclaimers.map(line => <li key={line}>{line}</li>)}
        </ul>

        <button
          type="button"
          className="text-sm font-semibold underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          style={{ color: accent }}
          onClick={() => { setReport(null); setError(''); }}
        >
          Check another offer
        </button>
      </div>
    );
  }

  const terms = dealType === 'lease' ? LEASE_TERMS : FINANCE_TERMS;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">Check a vehicle offer</h1>
      <p className="mt-3 text-lg text-gray-700 leading-relaxed">
        Enter numbers from the worksheet. Leave a line blank if you do not have it. Do not enter your name, address, Social Security number, or account number.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 space-y-6"
        aria-describedby={error ? `${formId}-error` : undefined}
      >
        <div role="status" aria-live="polite" className="sr-only">{busy ? 'Checking the numbers.' : ''}</div>
        {error ? (
          <p id={`${formId}-error`} role="alert" className="text-sm font-medium text-red-900 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        ) : null}

        <fieldset>
          <legend className="text-sm font-semibold text-gray-900 mb-2">Offer type</legend>
          <div className="grid grid-cols-2 gap-2">
            {(['finance', 'lease'] as const).map(option => (
              <label key={option} className={`border rounded-xl px-3 py-3 cursor-pointer ${dealType === option ? 'border-gray-900 bg-gray-50' : 'border-gray-300'}`}>
                <input
                  type="radio"
                  name="dealType"
                  value={option}
                  checked={dealType === option}
                  onChange={() => switchType(option)}
                  className="mr-2"
                />
                <span className="font-medium text-gray-900">{option === 'finance' ? 'Finance' : 'Lease'}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field id="sellingPrice" label={dealType === 'lease' ? 'Selling price (cap cost)' : 'Selling price'} hint="Dollars, before tax." value={fields.sellingPrice} onChange={v => setField('sellingPrice', v)} />
          <Field id="msrp" label="MSRP" value={fields.msrp} onChange={v => setField('msrp', v)} />
          <Field id="monthlyPayment" label="Quoted monthly payment" value={fields.monthlyPayment} onChange={v => setField('monthlyPayment', v)} />
          <Field id="downPayment" label={dealType === 'lease' ? 'Cap cost reduction' : 'Cash down payment'} value={fields.downPayment} onChange={v => setField('downPayment', v)} />
          <Field id="docFee" label="Documentation fee" value={fields.docFee} onChange={v => setField('docFee', v)} />
          <Field id="rebates" label="Rebates" value={fields.rebates} onChange={v => setField('rebates', v)} />
          <div>
            <label htmlFor="termMonths" className="block text-sm font-semibold text-gray-900 mb-1">Term (months)</label>
            <select id="termMonths" name="termMonths" value={term} onChange={e => setTerm(e.target.value)} className={inputClass}>
              {terms.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-semibold text-gray-900 mb-1">State</label>
            <p id="state-hint" className="text-xs text-gray-700 mb-1">Optional. Used only for a general trade-in tax note.</p>
            <select id="state" name="state" value={state} aria-describedby="state-hint" onChange={e => setState(e.target.value)} className={inputClass}>
              <option value="">Not specified</option>
              {US_STATES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          {dealType === 'finance' ? (
            <>
              <Field id="apr" label="APR" hint="Percent, such as 6.9" value={fields.apr} onChange={v => setField('apr', v)} />
              <Field id="amountFinanced" label="Amount financed" hint="Optional. Leave blank to calculate from price, down payment, and trade." value={fields.amountFinanced} onChange={v => setField('amountFinanced', v)} />
            </>
          ) : (
            <>
              <Field id="moneyFactor" label="Money factor" hint="Such as 0.00180" value={fields.moneyFactor} onChange={v => setField('moneyFactor', v)} />
              <Field id="buyRateMoneyFactor" label="Base money factor" hint="Only if the worksheet shows one." value={fields.buyRateMoneyFactor} onChange={v => setField('buyRateMoneyFactor', v)} />
              <Field id="residualPercent" label="Residual percent of MSRP" value={fields.residualPercent} onChange={v => setField('residualPercent', v)} />
              <Field id="acquisitionFee" label="Acquisition fee" value={fields.acquisitionFee} onChange={v => setField('acquisitionFee', v)} />
            </>
          )}
        </div>

        <fieldset className="border border-gray-200 rounded-xl p-4">
          <legend className="px-1 text-sm font-semibold text-gray-900">Trade-in</legend>
          <label className="flex items-center gap-2 text-sm text-gray-900 mt-1">
            <input type="checkbox" checked={showTrade} onChange={e => setShowTrade(e.target.checked)} />
            Include a trade-in
          </label>
          {showTrade && (
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <Field id="tradeDealerOffer" label="Dealer offer for the trade" value={fields.tradeDealerOffer} onChange={v => setField('tradeDealerOffer', v)} />
              <Field id="tradePayoff" label="Payoff still owed" value={fields.tradePayoff} onChange={v => setField('tradePayoff', v)} />
            </div>
          )}
        </fieldset>

        <fieldset className="border border-gray-200 rounded-xl p-4">
          <legend className="px-1 text-sm font-semibold text-gray-900">Optional products</legend>
          <label className="flex items-center gap-2 text-sm text-gray-900 mt-1">
            <input type="checkbox" checked={showAddons} onChange={e => setShowAddons(e.target.checked)} />
            Include optional products
          </label>
          {showAddons && (
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <Field id="gapInsurance" label="GAP product" value={fields.gapInsurance} onChange={v => setField('gapInsurance', v)} />
              <Field id="extendedWarranty" label="Service contract" value={fields.extendedWarranty} onChange={v => setField('extendedWarranty', v)} />
              <Field id="tireWheel" label="Tire and wheel product" value={fields.tireWheel} onChange={v => setField('tireWheel', v)} />
              <Field id="paintInterior" label="Appearance product" value={fields.paintInterior} onChange={v => setField('paintInterior', v)} />
            </div>
          )}
        </fieldset>

        <button
          type="submit"
          disabled={busy}
          className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          style={{ backgroundColor: primary, color: fg }}
        >
          {busy ? 'Checking…' : 'Check this offer'}
        </button>
      </form>
    </div>
  );
}
