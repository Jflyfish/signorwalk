'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { FILE_READ_ERROR } from '@/cu/copy';
import { UploadDisclosure } from '@/cu/UploadDisclosure';
import type { DerivedBrand } from '@/cu/contrast';
import { DEMO_FINANCE_SAMPLE, DEMO_GRADE_C, DEMO_GRADE_D } from '@/cu/demo-sample';
import { shortestDisclaimerLine } from '@/cu/grade-readout';
import type { TenantReport } from '@/cu/engine/types';
import type { CuPublic } from '@/cu/tenants';
import { US_STATES } from '@/lib/states';
import { GradeReadout } from './GradeReadout';

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

function sampleFields(sample: typeof DEMO_FINANCE_SAMPLE | typeof DEMO_GRADE_C | typeof DEMO_GRADE_D): typeof EMPTY {
  return {
    ...EMPTY,
    sellingPrice: sample.sellingPrice,
    msrp: sample.msrp,
    apr: sample.apr,
    docFee: sample.docFee,
    ...('downPayment' in sample ? { downPayment: sample.downPayment, monthlyPayment: sample.monthlyPayment } : {}),
  };
}

const inputClass =
  'cu-ring w-full h-12 px-4 rounded-lg border cu-line bg-white text-[18px] leading-[28px] cu-ink';

const textLink =
  'cu-link cu-ring text-[15px] font-semibold hover:underline underline-offset-4';

const embedFile =
  'cu-ring mt-2 block w-full text-[14px] font-normal cu-muted file:mr-3 file:h-12 file:cursor-pointer file:rounded-lg file:border file:border-solid file:border-[#E5E5E5] file:bg-white file:px-4 file:text-[15px] file:font-semibold file:text-[#111] md:file:h-11';

function Field({
  id, label, hint, error, value, onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
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
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        onChange={e => onChange(e.target.value)}
        className={inputClass}
      />
      {error ? <p id={errorId} className="mt-2 text-[14px] leading-[20px]" style={{ color: '#B42318' }}>{error}</p> : null}
    </div>
  );
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
    ? 'cu-primary cu-ring inline-flex items-center justify-center gap-2 text-center min-h-12 w-full px-4 rounded-lg text-[15px] font-semibold leading-[20px] disabled:opacity-60'
    : 'cu-primary cu-ring inline-flex items-center justify-center gap-2 text-center min-h-12 w-full md:h-11 md:min-h-11 md:w-auto px-4 rounded-lg text-[15px] font-semibold leading-[20px] disabled:opacity-60';
  if (href) {
    return <a href={href} target="_top" className={className} onClick={onClick}>{children}</a>;
  }
  return <button type={type} disabled={disabled} className={className} onClick={onClick}>{children}</button>;
}

export function CheckForm({
  tenant,
  brand,
  onGrade,
  embedded = false,
  numbersOnly = false,
  demoSample = false,
  autoGrade = false,
  disclosure,
  sampleRun = false,
  sampleGrant = null,
  previewRun = false,
  demoPage = false,
}: {
  tenant: CuPublic;
  brand: DerivedBrand;
  onGrade?: (grade: string) => void;
  embedded?: boolean;
  numbersOnly?: boolean;
  /** Landing and embed demos only. Member checks stay empty. */
  demoSample?: boolean;
  /** One-click sample from the credit-union landing page. Grades once. */
  autoGrade?: boolean;
  disclosure?: string;
  /** ?sample=1. Those runs are left out of every total. */
  sampleRun?: boolean;
  /** Server-minted grant. Required to skip counts when the session secret is set. */
  sampleGrant?: string | null;
  /** Owner /preview. Skips grades run and loan clicks only. */
  previewRun?: boolean;
  /** Seeded demo tenant or the sample grade. Real tenants stay unmarked. */
  demoPage?: boolean;
}) {
  const formId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const returnToApr = useRef(false);
  const [dealType, setDealType] = useState<DealType>('finance');
  const [term, setTerm] = useState('60');
  const [state, setState] = useState('');
  const [fields, setFields] = useState(() => (demoSample ? sampleFields(DEMO_FINANCE_SAMPLE) : EMPTY));
  const [showTrade, setShowTrade] = useState(false);
  const [showAddons, setShowAddons] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [busy, setBusy] = useState(autoGrade);
  const gradedSample = useRef(false);
  const focusField = useRef<FieldKey | null>(null);
  const [report, setReport] = useState<TenantReport | null>(null);
  const [needsApr, setNeedsApr] = useState(false);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  useEffect(() => {
    const id = focusField.current;
    if (!id) return;
    focusField.current = null;
    document.getElementById(id)?.focus();
  }, [fieldErrors]);

  useEffect(() => {
    if (needsApr) {
      headingRef.current?.focus();
      return;
    }
    if (returnToApr.current) {
      returnToApr.current = false;
      document.getElementById('apr')?.focus();
    }
  }, [needsApr]);

  const accent = brand.brandText;
  const [uploadNote, setUploadNote] = useState('');
  const [uploadError, setUploadError] = useState(false);

  async function onUpload(file: File | null) {
    if (!file) return;
    setUploadError(false);
    setUploadNote('Reading the worksheet.');
    const body = new FormData();
    body.set('file', file);
    try {
      const res = await fetch(`/api/cu/${tenant.id}/extract`, { method: 'POST', body });
      const data = await res.json();
      if (!res.ok || !data.success || !data.fields || typeof data.fields !== 'object') {
        setUploadError(true);
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
      setUploadError(false);
      setUploadNote('Numbers filled from the worksheet. The file was not stored.');
    } catch {
      setUploadError(true);
      setUploadNote(FILE_READ_ERROR);
    }
  }

  function setField(key: FieldKey, value: string) {
    setFields(prev => ({ ...prev, [key]: value }));
  }

  function applySample(kind: 'a' | 'c' | 'd') {
    const sample = kind === 'c' ? DEMO_GRADE_C : kind === 'd' ? DEMO_GRADE_D : DEMO_FINANCE_SAMPLE;
    setDealType('finance');
    setTerm(sample.term);
    setShowTrade(false);
    setShowAddons(false);
    const next = sampleFields(sample);
    setFields(next);
    setNeedsApr(false);
    setReport(null);
    if (kind !== 'a') {
      void gradeSnapshot({ fields: next, term: sample.term, dealType: 'finance', showTrade: false, showAddons: false });
    }
  }

  async function gradeSnapshot(snapshot: {
    fields: typeof EMPTY;
    term: string;
    dealType: DealType;
    showTrade: boolean;
    showAddons: boolean;
  }) {
    setError('');
    const skip = new Set<FieldKey>();
    if (!snapshot.showTrade) {
      skip.add('tradeDealerOffer');
      skip.add('tradePayoff');
    }
    if (!snapshot.showAddons) {
      skip.add('extendedWarranty');
      skip.add('gapInsurance');
      skip.add('tireWheel');
      skip.add('paintInterior');
    }
    if (snapshot.dealType === 'finance') {
      skip.add('moneyFactor');
      skip.add('buyRateMoneyFactor');
      skip.add('residualPercent');
      skip.add('acquisitionFee');
    } else {
      skip.add('apr');
      skip.add('amountFinanced');
    }
    const payload: Record<string, string> = { dealType: snapshot.dealType, termMonths: snapshot.term };
    if (state) payload.state = state;
    const invalid: Partial<Record<FieldKey, string>> = {};
    let firstInvalid: FieldKey | null = null;
    let any = false;
    for (const key of Object.keys(EMPTY) as FieldKey[]) {
      if (skip.has(key)) continue;
      const raw = snapshot.fields[key].trim();
      if (!raw) continue;
      if (!/^\d+(\.\d+)?$/.test(raw.replace(/[$,]/g, ''))) {
        invalid[key] = 'Use a number, or leave this blank.';
        if (!firstInvalid) firstInvalid = key;
        continue;
      }
      payload[key] = raw.replace(/[$,]/g, '');
      any = true;
    }
    setFieldErrors(invalid);
    if (firstInvalid) {
      focusField.current = firstInvalid;
      setError('');
      return;
    }
    if (snapshot.dealType === 'finance' && !payload.apr) {
      if (!any) {
        setError('Enter at least one number from the worksheet.');
        return;
      }
      setReport(null);
      setNeedsApr(true);
      return;
    }
    if (!any) {
      setError('Enter at least one number from the worksheet.');
      return;
    }
    setNeedsApr(false);
    setBusy(true);
    try {
      const res = await fetch(`/api/cu/${tenant.id}/analyze${sampleRun ? `?sample=1${sampleGrant ? `&grant=${encodeURIComponent(sampleGrant)}` : ''}` : previewRun ? '?preview=1' : ''}`, {
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
      if (/^[ABCDF]$/.test(grade)) onGrade?.(grade);
    } catch {
      setError('Check the numbers and try again.');
    } finally {
      setBusy(false);
    }
  }

  function switchType(next: DealType) {
    setDealType(next);
    setTerm(next === 'lease' ? '36' : '60');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await gradeSnapshot({ fields, term, dealType, showTrade, showAddons });
  }

  useEffect(() => {
    if (!autoGrade || gradedSample.current) return;
    gradedSample.current = true;
    const next = sampleFields(DEMO_FINANCE_SAMPLE);
    setDealType('finance');
    setTerm(DEMO_FINANCE_SAMPLE.term);
    setFields(next);
    void gradeSnapshot({
      fields: next,
      term: DEMO_FINANCE_SAMPLE.term,
      dealType: 'finance',
      showTrade: false,
      showAddons: false,
    });
  }, [autoGrade]);

  if (needsApr) {
    return (
      <div className={embedded
        ? 'mx-auto w-full max-w-[560px] px-4 pt-16 md:pt-24'
        : 'mx-auto w-full max-w-[560px] px-4 pb-16 pt-16 md:pt-24'}>
        <h1 ref={headingRef} tabIndex={-1} className="text-[24px] font-bold leading-[30px] outline-none">
          Incomplete: add your APR for a full grade.
        </h1>
        <p className="mt-4 text-[18px] leading-[28px]">
          This finance offer has no APR from the worksheet, so there is no grade yet. A grade from this tool is a comparison, not a credit decision.
        </p>
        <p className="mt-4 text-[13px] leading-[18px] cu-muted">{shortestDisclaimerLine(brand.shortName)}</p>
        <p className="mt-10">
          <button
            type="button"
            className={textLink}
            onClick={() => {
              returnToApr.current = true;
              setNeedsApr(false);
            }}
          >
            Add APR and check again
          </button>
        </p>
      </div>
    );
  }

  if (report) {
    const aprBlank = dealType === 'finance' && !(Number(fields.apr.replace(/[$,]/g, '')) > 0);
    const limitedPill = aprBlank
      ? 'Partial grade — add APR'
      : report.limitedData
        ? 'Partial grade — add more figures'
        : null;
    return (
      <GradeReadout
        report={report}
        shortName={brand.shortName}
        creditUnionName={tenant.name}
        logoMark={tenant.logo}
        logoLight={brand.logoLight}
        logoAspect={brand.logoAspect}
        logoColor={brand.brandText}
        tenantId={tenant.id}
        preApprovalUrl={tenant.preApprovalUrl}
        ratesUrl={tenant.ratesUrl}
        embedded={embedded}
        aprBlank={aprBlank}
        limitedPill={limitedPill}
        disclosure={disclosure}
        samplePage={sampleRun}
        sampleGrant={sampleGrant}
        previewPage={previewRun}
        demoPage={demoPage}
        onCheckAnother={() => { setReport(null); setError(''); }}
      />
    );
  }

  const terms = dealType === 'lease' ? LEASE_TERMS : FINANCE_TERMS;

  return (
    <div className="mx-auto w-full max-w-[560px] px-4 pb-[max(4rem,env(safe-area-inset-bottom))] pt-16 md:pb-24 md:pt-24">
      <h1 className="text-[32px] font-extrabold leading-[38px] md:text-[48px] md:leading-[52px]">Check a dealer offer</h1>
      <p className="mt-6 text-[18px] leading-[28px] cu-muted">Enter the numbers from the dealer worksheet.</p>
      {disclosure ? <p className="mt-4 text-[14px] leading-[20px] cu-muted">{disclosure}</p> : null}
      {demoSample ? (
        <>
          <p className="mt-4 text-[15px] leading-[24px]">
            {`Sample finance offer for this demo, with a ${DEMO_FINANCE_SAMPLE.apr}% APR. Replace any number with the worksheet.`}
          </p>
          <div className="cu-no-print mt-4 flex flex-wrap items-center gap-3">
            <button type="button" className={`${textLink} cu-ring`} onClick={() => applySample('a')}>Try a sample deal</button>
            <button type="button" className="cu-ring inline-flex h-8 items-center rounded-full border cu-line px-3 text-[14px] font-semibold" onClick={() => applySample('c')}>Sample C</button>
            <button type="button" className="cu-ring inline-flex h-8 items-center rounded-full border cu-line px-3 text-[14px] font-semibold" onClick={() => applySample('d')}>Sample D</button>
          </div>
        </>
      ) : null}

      <form onSubmit={onSubmit} className="mt-10" aria-describedby={error ? `${formId}-error` : undefined}>
        <div role="status" aria-live="polite" className="sr-only">{busy ? 'Checking the numbers.' : ''}</div>
        {error ? <p ref={errorRef} tabIndex={-1} id={`${formId}-error`} role="alert" className="cu-err mb-6 outline-none">{error}</p> : null}

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
                className={embedded ? embedFile : 'cu-ring mt-2 block w-full text-[14px]'}
                onChange={event => {
                  const file = event.target.files?.[0] ?? null;
                  event.target.value = '';
                  void onUpload(file);
                }}
              />
            </>
          )}
          <p className={uploadError ? 'cu-err mt-2' : 'mt-2 text-[14px] leading-[20px] cu-muted'} role={uploadError ? 'alert' : 'status'}>{numbersOnly || !uploadNote ? <UploadDisclosure /> : uploadNote}</p>
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
                    className="cu-ring"
                    onChange={() => switchType(option)}
                  />
                  {option === 'finance' ? 'Finance' : 'Lease'}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field id="sellingPrice" label={dealType === 'lease' ? 'Selling price (cap cost) (optional)' : 'Selling price (optional)'} hint="Example: 32000" error={fieldErrors.sellingPrice} value={fields.sellingPrice} onChange={v => setField('sellingPrice', v)} />
          <Field id="msrp" label="MSRP (optional)" hint="Example: 35000" error={fieldErrors.msrp} value={fields.msrp} onChange={v => setField('msrp', v)} />
          <Field id="monthlyPayment" label="Quoted monthly payment (optional)" hint="Example: 584" error={fieldErrors.monthlyPayment} value={fields.monthlyPayment} onChange={v => setField('monthlyPayment', v)} />
          <Field id="downPayment" label={dealType === 'lease' ? 'Cap cost reduction (optional)' : 'Cash down payment (optional)'} hint="Example: 2000" error={fieldErrors.downPayment} value={fields.downPayment} onChange={v => setField('downPayment', v)} />
          <Field id="docFee" label="Documentation fee (optional)" hint="Example: 299" error={fieldErrors.docFee} value={fields.docFee} onChange={v => setField('docFee', v)} />
          <Field id="rebates" label="Rebates (optional)" hint="Example: 500" error={fieldErrors.rebates} value={fields.rebates} onChange={v => setField('rebates', v)} />
          <div>
            <label htmlFor="termMonths" className="mb-2 block text-[14px] font-semibold leading-[20px]">Term (months)</label>
            <select id="termMonths" name="termMonths" value={term} onChange={e => setTerm(e.target.value)} className={inputClass}>
              {terms.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="state" className="mb-2 block text-[14px] font-semibold leading-[20px]">State (optional)</label>
            <p id="state-hint" className="mb-2 text-[14px] leading-[20px] cu-muted">Example: CA</p>
            <select id="state" name="state" value={state} aria-describedby="state-hint" onChange={e => setState(e.target.value)} className={inputClass}>
              <option value="">Not specified</option>
              {US_STATES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          {dealType === 'finance' ? (
            <>
              <p className="text-[15px] font-semibold leading-[24px] sm:col-span-2">
                {embedded || numbersOnly
                  ? 'Add the APR for a full grade.'
                  : 'Add the APR for a full grade. A blank APR stays incomplete and does not show a letter.'}
              </p>
              <Field id="apr" label="APR (needed for a grade)" hint="Example: 5.9" error={fieldErrors.apr} value={fields.apr} onChange={v => setField('apr', v)} />
              <Field id="amountFinanced" label="Amount financed (optional)" hint="Example: 28000" error={fieldErrors.amountFinanced} value={fields.amountFinanced} onChange={v => setField('amountFinanced', v)} />
            </>
          ) : (
            <>
              <Field id="moneyFactor" label="Money factor (optional)" hint="Example: 0.002" error={fieldErrors.moneyFactor} value={fields.moneyFactor} onChange={v => setField('moneyFactor', v)} />
              <Field id="buyRateMoneyFactor" label="Base money factor (optional)" hint="Example: 0.0018" error={fieldErrors.buyRateMoneyFactor} value={fields.buyRateMoneyFactor} onChange={v => setField('buyRateMoneyFactor', v)} />
              <Field id="residualPercent" label="Residual percent of MSRP (optional)" hint="Example: 55" error={fieldErrors.residualPercent} value={fields.residualPercent} onChange={v => setField('residualPercent', v)} />
              <Field id="acquisitionFee" label="Acquisition fee (optional)" hint="Example: 695" error={fieldErrors.acquisitionFee} value={fields.acquisitionFee} onChange={v => setField('acquisitionFee', v)} />
            </>
          )}
        </div>

        <div className="cu-no-print mt-6 border-t cu-line pt-6">
          <label className="flex items-center gap-2 text-[15px] font-semibold">
            <input type="checkbox" checked={showTrade} onChange={e => setShowTrade(e.target.checked)} />
            Include a trade-in
          </label>
          {showTrade && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field id="tradeDealerOffer" label="Dealer offer for the trade (optional)" hint="Example: 8000" error={fieldErrors.tradeDealerOffer} value={fields.tradeDealerOffer} onChange={v => setField('tradeDealerOffer', v)} />
              <Field id="tradePayoff" label="Payoff still owed (optional)" hint="Example: 5000" error={fieldErrors.tradePayoff} value={fields.tradePayoff} onChange={v => setField('tradePayoff', v)} />
            </div>
          )}
        </div>

        <div className="cu-no-print mt-6 border-t cu-line pt-6">
          <label className="flex items-center gap-2 text-[15px] font-semibold">
            <input type="checkbox" checked={showAddons} onChange={e => setShowAddons(e.target.checked)} />
            Include optional products
          </label>
          {showAddons && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field id="gapInsurance" label="GAP product (optional)" hint="Example: 895" error={fieldErrors.gapInsurance} value={fields.gapInsurance} onChange={v => setField('gapInsurance', v)} />
              <Field id="extendedWarranty" label="Service contract (optional)" hint="Example: 1500" error={fieldErrors.extendedWarranty} value={fields.extendedWarranty} onChange={v => setField('extendedWarranty', v)} />
              <Field id="tireWheel" label="Tire and wheel product (optional)" hint="Example: 599" error={fieldErrors.tireWheel} value={fields.tireWheel} onChange={v => setField('tireWheel', v)} />
              <Field id="paintInterior" label="Appearance product (optional)" hint="Example: 499" error={fieldErrors.paintInterior} value={fields.paintInterior} onChange={v => setField('paintInterior', v)} />
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
