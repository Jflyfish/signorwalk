'use client';

import { useId, useRef, useState } from 'react';
import { track } from '@vercel/analytics';
import { FILE_READ_ERROR, UPLOAD_DISCLOSURE } from '@/cu/copy';
import type { DerivedBrand } from '@/cu/contrast';
import { GRADE_FILL } from '@/cu/grades';
import type { TenantReport } from '@/cu/engine/types';
import type { CuPublic } from '@/cu/tenants';
import { memberLink } from '@/cu/utm';
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
  'w-full h-12 px-4 rounded-lg border cu-line bg-white text-[18px] leading-[28px] cu-ink';

const textLink =
  'cu-link text-[15px] font-semibold hover:underline underline-offset-4';

const embedFile =
  'cu-ring mt-2 block w-full text-[14px] font-normal cu-muted file:mr-3 file:h-12 file:cursor-pointer file:rounded-lg file:border file:border-solid file:border-[#E5E5E5] file:bg-white file:px-4 file:text-[15px] file:font-semibold file:text-[#111] md:file:h-11';

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
      <label htmlFor={id} className="mb-2 block text-[14px] font-semibold leading-[20px]">{label}</label>
      {hint ? <p id={hintId} className="mb-2 text-[14px] leading-[20px] cu-muted">{hint}</p> : null}
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

function gradeTint(hex: string): string {
  const raw = hex.replace('#', '');
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `rgb(${r} ${g} ${b} / 0.1)`;
}

function trackSafe(name: 'analysis_completed' | 'cta_clicked', props: Record<string, string>) {
  try {
    track(name, props);
  } catch {
    /* analytics must never block the result */
  }
}

function Primary({
  children, type = 'button', disabled, onClick, href, wide,
}: {
  children: React.ReactNode;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
  wide?: boolean;
}) {
  const className = wide
    ? 'cu-primary inline-flex items-center justify-center text-center min-h-12 w-full px-4 rounded-lg text-[15px] font-semibold leading-[20px] disabled:opacity-60'
    : 'cu-primary inline-flex items-center justify-center text-center min-h-12 w-full md:h-11 md:min-h-11 md:w-auto px-4 rounded-lg text-[15px] font-semibold leading-[20px] disabled:opacity-60';
  if (href) {
    return <a href={href} className={className} onClick={onClick}>{children}</a>;
  }
  return <button type={type} disabled={disabled} className={className} onClick={onClick}>{children}</button>;
}

export function CheckForm({
  tenant,
  brand,
  onGrade,
  embedded = false,
  numbersOnly = false,
}: {
  tenant: CuPublic;
  brand: DerivedBrand;
  onGrade?: (grade: string) => void;
  embedded?: boolean;
  numbersOnly?: boolean;
}) {
  const formId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [dealType, setDealType] = useState<DealType>('finance');
  const [term, setTerm] = useState('60');
  const [state, setState] = useState('');
  const [fields, setFields] = useState(EMPTY);
  const [showTrade, setShowTrade] = useState(false);
  const [showAddons, setShowAddons] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<TenantReport | null>(null);

  const accent = brand.brandText;
  const [uploadNote, setUploadNote] = useState('');

  async function onUpload(file: File | null) {
    if (!file) return;
    setUploadNote('Reading the worksheet.');
    const body = new FormData();
    body.set('file', file);
    try {
      const res = await fetch(`/api/cu/${tenant.id}/extract`, { method: 'POST', body });
      const data = await res.json();
      if (!res.ok || !data.success || !data.fields || typeof data.fields !== 'object') {
        setUploadNote(typeof data.error === 'string' ? data.error : FILE_READ_ERROR);
        return;
      }
      if (data.dealType === 'lease' || data.dealType === 'finance') switchType(data.dealType);
      const next: Partial<typeof EMPTY> = {};
      for (const key of Object.keys(EMPTY) as FieldKey[]) {
        const value = data.fields[key];
        if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value)) next[key] = value;
      }
      setFields(prev => ({ ...prev, ...next }));
      if (next.tradeDealerOffer || next.tradePayoff) setShowTrade(true);
      if (next.extendedWarranty || next.gapInsurance || next.tireWheel || next.paintInterior) setShowAddons(true);
      setUploadNote('Numbers filled from the worksheet. The file was not stored.');
    } catch {
      setUploadNote(FILE_READ_ERROR);
    }
  }

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
      setShowDetails(false);
      setReport(data.analysis as TenantReport);
      const grade = String(data.analysis.grade);
      const archetype = String(data.analysis.archetype);
      if (/^[ABCDF]$/.test(grade)) onGrade?.(grade);
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
    const shown = report.itemsToReview.slice(0, 3);
    const rest = report.itemsToReview.slice(3);
    const gradeColor = GRADE_FILL[report.grade] ?? '#111111';
    return (
      <div className={embedded
        ? 'mx-auto w-full max-w-[560px] px-4 pt-16 md:pt-24'
        : 'mx-auto w-full max-w-[560px] px-4 pb-[120px] pt-16 md:pb-16 md:pt-24'}>
        <div className="flex flex-col md:flex-row md:items-center md:gap-4">
          <p className="text-[14px] leading-[20px] cu-muted md:hidden">Grade</p>
          <p
            aria-hidden="true"
            className="mt-4 flex h-24 w-24 shrink-0 items-center justify-center rounded-[16px] text-[64px] font-extrabold leading-none md:mt-0"
            style={{ color: gradeColor, backgroundColor: gradeTint(gradeColor) }}
          >
            {report.grade}
          </p>
          <div className="mt-4 md:mt-0">
            <p className="hidden text-[14px] leading-[20px] cu-muted md:block">Grade</p>
            <h1 ref={headingRef} tabIndex={-1} className="text-[18px] leading-[28px] md:mt-4">
              <span className="sr-only">{report.grade}. </span>{report.headline}
            </h1>
          </div>
        </div>

        {shown.length > 0 && (
          <section className="mt-10" aria-labelledby="review-heading">
            <h2 id="review-heading" className="text-[24px] font-bold leading-[30px]">Items to review</h2>
            <ul className="mt-4 list-disc space-y-4 pl-4 text-[18px] leading-[28px]">
              {shown.map(item => <li key={item.id}>{item.issue}</li>)}
            </ul>
          </section>
        )}

        {tenant.preApprovalUrl ? (
          <div className={embedded
            ? 'static mt-10 w-full'
            : 'fixed inset-x-0 bottom-0 border-t cu-line bg-white p-4 md:static md:mt-10 md:border-0 md:bg-transparent md:p-0'}>
            <Primary
              wide={embedded}
              href={memberLink(tenant.preApprovalUrl)}
              onClick={() => trackSafe('cta_clicked', { tenant: tenant.id, target: 'preapproval' })}
            >
              {tenant.preApprovalUrl.includes('/credit-unions/demo/') ? 'Demo only: pre-approval' : (
                <>
                  <span className="md:hidden">Get pre-approved</span>
                  <span className="hidden md:inline">Get pre-approved with {tenant.name}</span>
                </>
              )}
            </Primary>
          </div>
        ) : null}

        <div className="mt-10 border-t cu-line pt-6">
          <button
            type="button"
            className={`${textLink} inline-flex items-center gap-1`}
            aria-expanded={showDetails}
            onClick={() => setShowDetails(open => !open)}
          >
            <span aria-hidden="true">{showDetails ? '▾' : '▸'}</span>
            See details
          </button>
          {showDetails && (
            <div className="mt-6">
              {report.breakdown.length > 0 && (
                <section aria-labelledby="breakdown-heading">
                  <h2 id="breakdown-heading" className="text-[24px] font-bold leading-[30px]">Figures you entered</h2>
                  <ul className="mt-4">
                    {report.breakdown.map(row => (
                      <li key={row.label} className="border-t cu-line py-4">
                        <div className="flex items-baseline justify-between gap-4">
                          <p className="text-[18px] leading-[28px]">{row.label}</p>
                          <p className="text-[18px] font-semibold leading-[28px] tabular-nums">{row.value}</p>
                        </div>
                        <p className="text-[14px] leading-[20px] cu-muted">{statusText(row.status)}</p>
                        <p className="mt-2 text-[14px] leading-[20px] cu-muted">{row.explanation}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {rest.length > 0 && (
                <section className="mt-10" aria-labelledby="more-review-heading">
                  <h2 id="more-review-heading" className="text-[24px] font-bold leading-[30px]">More items</h2>
                  <ul className="mt-4 list-disc space-y-4 pl-4 text-[18px] leading-[28px]">
                    {rest.map(item => (
                      <li key={item.id}>
                        {item.issue}
                        <span className="mt-2 block text-[14px] leading-[20px] cu-muted">{item.action}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="mt-10 border-t cu-line pt-6" aria-labelledby="questions-heading">
                <h2 id="questions-heading" className="text-[24px] font-bold leading-[30px]">Questions you can ask</h2>
                <p className="mt-4 text-[18px] leading-[28px]">{report.questionsToAsk}</p>
                <p className="mt-4 text-[14px] leading-[20px] cu-muted">{report.structureNote}</p>
              </section>

              {report.tradeIn && (
                <section className="mt-10 border-t cu-line pt-6" aria-labelledby="trade-heading">
                  <h2 id="trade-heading" className="text-[24px] font-bold leading-[30px]">{report.tradeIn.headline}</h2>
                  <p className="mt-4 text-[18px] leading-[28px]">{report.tradeIn.details}</p>
                </section>
              )}

              {report.stateTaxNote && (
                <section className="mt-10 border-t cu-line pt-6" aria-labelledby="tax-heading">
                  <h2 id="tax-heading" className="text-[24px] font-bold leading-[30px]">Trade-in and tax</h2>
                  <p className="mt-4 text-[18px] leading-[28px]">{report.stateTaxNote}</p>
                </section>
              )}

              <ul className="mt-10 space-y-4 border-t cu-line pt-6 text-[14px] leading-[20px] cu-muted">
                {report.disclaimers.map(line => <li key={line}>{line}</li>)}
              </ul>

              {tenant.ratesUrl ? (
              <p className="mt-6">
                <a
                  href={memberLink(tenant.ratesUrl)}
                  className={textLink}
                  onClick={() => trackSafe('cta_clicked', { tenant: tenant.id, target: 'rates' })}
                >
                  {tenant.ratesUrl.includes('/credit-unions/demo/') ? 'Demo only: auto rates' : tenant.ratesLabel}
                </a>
              </p>
              ) : null}
            </div>
          )}
          <p className="mt-6">
            <button type="button" className={textLink} onClick={() => { setReport(null); setError(''); }}>
              Check another offer
            </button>
          </p>
        </div>
      </div>
    );
  }

  const terms = dealType === 'lease' ? LEASE_TERMS : FINANCE_TERMS;

  return (
    <div className="mx-auto w-full max-w-[560px] px-4 pb-16 pt-16 md:pb-24 md:pt-24">
      <h1 className="text-[32px] font-extrabold leading-[38px] md:text-[48px] md:leading-[52px]">Check a dealer offer</h1>
      <p className="mt-6 text-[18px] leading-[28px] cu-muted">Enter the numbers from the dealer worksheet.</p>

      <form onSubmit={onSubmit} className="mt-10" aria-describedby={error ? `${formId}-error` : undefined}>
        <div role="status" aria-live="polite" className="sr-only">{busy ? 'Checking the numbers.' : ''}</div>
        {error ? <p id={`${formId}-error`} role="alert" className="mb-6 text-[14px] font-semibold leading-[20px]">{error}</p> : null}

        <div className="mb-6">
          {numbersOnly ? (
            <p className="text-[14px] leading-[20px] cu-muted">Upload is off on this demo.</p>
          ) : (
            <>
              <label htmlFor="worksheet" className={`${textLink} underline decoration-1 underline-offset-4 cu-linkline`}>
                Upload a dealer worksheet
              </label>
              <input
                id="worksheet"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className={embedded ? embedFile : 'mt-2 block w-full text-[14px]'}
                onChange={event => {
                  const file = event.target.files?.[0] ?? null;
                  event.target.value = '';
                  void onUpload(file);
                }}
              />
            </>
          )}
          <p className="mt-2 text-[14px] leading-[20px] cu-muted" role="status">{numbersOnly ? UPLOAD_DISCLOSURE : (uploadNote || UPLOAD_DISCLOSURE)}</p>
          <p className="mt-2 text-[14px] leading-[20px]">
            <a href="/credit-unions/privacy" className={textLink}>Privacy</a>
          </p>
        </div>

        <fieldset>
          <legend className="mb-4 text-[14px] font-semibold leading-[20px]">Offer type</legend>
          <div className="grid grid-cols-2 gap-4">
            {(['finance', 'lease'] as const).map(option => {
              const selected = dealType === option;
              return (
                <label
                  key={option}
                  className="flex h-12 cursor-pointer items-center gap-2 rounded-lg px-4 text-[15px] font-semibold"
                  style={{
                    borderStyle: 'solid',
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? accent : 'var(--cu-line)',
                    backgroundColor: selected ? brand.tint : '#fff',
                  }}
                >
                  <input
                    type="radio"
                    name="dealType"
                    value={option}
                    checked={selected}
                    onChange={() => switchType(option)}
                  />
                  {option === 'finance' ? 'Finance' : 'Lease'}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field id="sellingPrice" label={dealType === 'lease' ? 'Selling price (cap cost)' : 'Selling price'} value={fields.sellingPrice} onChange={v => setField('sellingPrice', v)} />
          <Field id="msrp" label="MSRP" value={fields.msrp} onChange={v => setField('msrp', v)} />
          <Field id="monthlyPayment" label="Quoted monthly payment" value={fields.monthlyPayment} onChange={v => setField('monthlyPayment', v)} />
          <Field id="downPayment" label={dealType === 'lease' ? 'Cap cost reduction' : 'Cash down payment'} value={fields.downPayment} onChange={v => setField('downPayment', v)} />
          <Field id="docFee" label="Documentation fee" value={fields.docFee} onChange={v => setField('docFee', v)} />
          <Field id="rebates" label="Rebates" value={fields.rebates} onChange={v => setField('rebates', v)} />
          <div>
            <label htmlFor="termMonths" className="mb-2 block text-[14px] font-semibold leading-[20px]">Term (months)</label>
            <select id="termMonths" name="termMonths" value={term} onChange={e => setTerm(e.target.value)} className={inputClass}>
              {terms.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="state" className="mb-2 block text-[14px] font-semibold leading-[20px]">State</label>
            <select id="state" name="state" value={state} onChange={e => setState(e.target.value)} className={inputClass}>
              <option value="">Not specified</option>
              {US_STATES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          {dealType === 'finance' ? (
            <>
              <Field id="apr" label="APR" hint="Percent, such as 6.9" value={fields.apr} onChange={v => setField('apr', v)} />
              <Field id="amountFinanced" label="Amount financed" value={fields.amountFinanced} onChange={v => setField('amountFinanced', v)} />
            </>
          ) : (
            <>
              <Field id="moneyFactor" label="Money factor" value={fields.moneyFactor} onChange={v => setField('moneyFactor', v)} />
              <Field id="buyRateMoneyFactor" label="Base money factor" value={fields.buyRateMoneyFactor} onChange={v => setField('buyRateMoneyFactor', v)} />
              <Field id="residualPercent" label="Residual percent of MSRP" value={fields.residualPercent} onChange={v => setField('residualPercent', v)} />
              <Field id="acquisitionFee" label="Acquisition fee" value={fields.acquisitionFee} onChange={v => setField('acquisitionFee', v)} />
            </>
          )}
        </div>

        <div className="mt-6 border-t cu-line pt-6">
          <label className="flex items-center gap-2 text-[15px] font-semibold">
            <input type="checkbox" checked={showTrade} onChange={e => setShowTrade(e.target.checked)} />
            Include a trade-in
          </label>
          {showTrade && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field id="tradeDealerOffer" label="Dealer offer for the trade" value={fields.tradeDealerOffer} onChange={v => setField('tradeDealerOffer', v)} />
              <Field id="tradePayoff" label="Payoff still owed" value={fields.tradePayoff} onChange={v => setField('tradePayoff', v)} />
            </div>
          )}
        </div>

        <div className="mt-6 border-t cu-line pt-6">
          <label className="flex items-center gap-2 text-[15px] font-semibold">
            <input type="checkbox" checked={showAddons} onChange={e => setShowAddons(e.target.checked)} />
            Include optional products
          </label>
          {showAddons && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field id="gapInsurance" label="GAP product" value={fields.gapInsurance} onChange={v => setField('gapInsurance', v)} />
              <Field id="extendedWarranty" label="Service contract" value={fields.extendedWarranty} onChange={v => setField('extendedWarranty', v)} />
              <Field id="tireWheel" label="Tire and wheel product" value={fields.tireWheel} onChange={v => setField('tireWheel', v)} />
              <Field id="paintInterior" label="Appearance product" value={fields.paintInterior} onChange={v => setField('paintInterior', v)} />
            </div>
          )}
        </div>

        <div className="mt-10">
          <Primary type="submit" disabled={busy}>
            {busy ? 'Checking…' : 'Check this offer'}
          </Primary>
        </div>
      </form>
    </div>
  );
}
