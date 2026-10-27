'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HTTPS_LINK, LOAN_LINK_REQUIRED } from '@/cu/form-copy';
import { restoreDefaultLoanLinksAction, saveDashboardLoanLinks, saveLoanLinksAction } from '../../actions';

const HTTPS = HTTPS_LINK;
const field = 'cu-ring mt-2 block h-12 w-full rounded-lg border cu-line px-4 text-[16px] font-normal';

function httpsProblem(value: string, required: boolean, defaults: readonly string[]): string {
  const trimmed = value.trim();
  if (!trimmed) return required ? LOAN_LINK_REQUIRED : '';
  if (defaults.includes(trimmed)) return '';
  if (/^http:\/\//i.test(trimmed)) return HTTPS;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:' || url.username || url.password) return HTTPS;
  } catch {
    return HTTPS;
  }
  return '';
}

function InlineError({ id, children }: { id: string; children: string }) {
  return <p id={id} className="mt-2 text-[14px] leading-[20px]" style={{ color: '#B42318' }}>{children}</p>;
}

export function LoanLinksForm({
  tenantId,
  initialLoan,
  initialRates,
  loanIsDefault,
  ratesIsDefault,
  defaultLoan = '',
  defaultRates = '',
  canRestore = false,
  serverRejected,
  serverError = '',
  changeLine = '',
}: {
  tenantId: string;
  initialLoan: string;
  initialRates: string;
  loanIsDefault: boolean;
  ratesIsDefault: boolean;
  defaultLoan?: string;
  defaultRates?: string;
  canRestore?: boolean;
  serverRejected: boolean;
  serverError?: string;
  changeLine?: string;
}) {
  const router = useRouter();
  const defaults = [defaultLoan, defaultRates].filter(Boolean);
  const [loan, setLoan] = useState(initialLoan);
  const [rates, setRates] = useState(initialRates);
  const [loanError, setLoanError] = useState(serverError || (serverRejected ? HTTPS : ''));
  const [ratesError, setRatesError] = useState('');
  const [busy, setBusy] = useState(false);
  const loanRef = useRef<HTMLInputElement>(null);
  const ratesRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoan(initialLoan);
    setRates(initialRates);
  }, [initialLoan, initialRates]);

  useEffect(() => {
    if (serverRejected || serverError) loanRef.current?.focus();
  }, [serverRejected, serverError]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const loanProblem = httpsProblem(loan, true, defaults);
    const ratesProblem = httpsProblem(rates, false, defaults);
    setLoanError(loanProblem);
    setRatesError(ratesProblem);
    if (loanProblem || ratesProblem) {
      (loanProblem ? loanRef : ratesRef).current?.focus();
      return;
    }
    setBusy(true);
    const saved = await saveDashboardLoanLinks(tenantId, loan, rates);
    if (!saved.ok) {
      if (httpsProblem(rates, false, defaults)) {
        setRatesError(saved.error);
        ratesRef.current?.focus();
      } else {
        setLoanError(saved.error);
        loanRef.current?.focus();
      }
      setBusy(false);
      return;
    }
    router.push(`/cu/${tenantId}/dashboard?saved=links`);
    router.refresh();
  }

  return (
    <>
    {canRestore ? (
      <form id="restore-default-links" action={restoreDefaultLoanLinksAction}>
        <input type="hidden" name="tenant" value={tenantId} />
      </form>
    ) : null}
    <form action={saveLoanLinksAction} noValidate onSubmit={onSubmit} className={`grid max-w-[560px] gap-4 ${changeLine ? '' : 'mb-10'}`}>
      <h2 className="text-[24px] font-bold leading-[30px]">Loan application</h2>
      {!loanIsDefault && !ratesIsDefault && !initialLoan && !initialRates ? <p className="text-[14px] leading-[20px] cu-muted">These fields start empty.</p> : null}
      <input type="hidden" name="tenant" value={tenantId} />
      <label className="text-[14px] font-semibold leading-[20px]" htmlFor="loan-url">Loan application URL
        {loanIsDefault ? <span className="font-normal cu-muted"> — Default</span> : null}
        <span id="loan-hint" className="mt-2 block font-normal cu-muted">Example: https://www.example.com/auto-loans</span>
        <input
          ref={loanRef}
          id="loan-url"
          name="preApprovalUrl"
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          value={loan}
          aria-invalid={loanError ? true : undefined}
          aria-describedby={loanError ? 'loan-hint loan-error' : 'loan-hint'}
          onChange={event => setLoan(event.target.value)}
          className={field}
        />
      </label>
      {loanError ? <InlineError id="loan-error">{loanError}</InlineError> : null}
      <label className="text-[14px] font-semibold leading-[20px]" htmlFor="rates-url">Rates URL (optional)
        {ratesIsDefault ? <span className="font-normal cu-muted"> — Default</span> : null}
        <span id="rates-hint" className="mt-2 block font-normal cu-muted">{defaultRates ? 'Example: https://www.example.com/auto-rates. Leave this blank to use the default.' : 'Example: https://www.example.com/auto-rates. Leave this blank to hide See auto rates.'}</span>
        <input
          ref={ratesRef}
          id="rates-url"
          name="ratesUrl"
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          value={rates}
          aria-invalid={ratesError ? true : undefined}
          aria-describedby={ratesError ? 'rates-hint rates-error' : 'rates-hint'}
          onChange={event => setRates(event.target.value)}
          className={field}
        />
      </label>
      {ratesError ? <InlineError id="rates-error">{ratesError}</InlineError> : null}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy} className="cu-primary cu-ring inline-flex h-12 w-full items-center justify-center rounded-lg px-4 text-[15px] font-semibold md:h-11 md:w-auto">Save links</button>
        {canRestore ? (
          <button type="submit" form="restore-default-links" className="cu-ring inline-flex h-12 items-center justify-center rounded-lg border cu-line bg-white px-4 text-[15px] font-semibold cu-ink md:h-11">Restore default</button>
        ) : null}
      </div>
    </form>
    {changeLine ? <p className="mb-10 mt-4 max-w-[560px] text-[14px] leading-[20px] text-[#555]">{changeLine}</p> : null}
    </>
  );
}
