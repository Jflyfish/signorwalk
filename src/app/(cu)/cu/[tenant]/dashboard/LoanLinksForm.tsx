'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HTTPS_LINK } from '@/cu/form-copy';
import { saveDashboardLoanLinks, saveLoanLinksAction } from '../../actions';

const HTTPS = HTTPS_LINK;
const field = 'cu-ring mt-2 block h-12 w-full rounded-lg border cu-line px-4 text-[16px] font-normal';

function httpsProblem(value: string, required: boolean): string {
  const trimmed = value.trim();
  if (!trimmed) return required ? HTTPS : '';
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
  serverRejected,
}: {
  tenantId: string;
  initialLoan: string;
  initialRates: string;
  serverRejected: boolean;
}) {
  const router = useRouter();
  const [loan, setLoan] = useState(initialLoan);
  const [rates, setRates] = useState(initialRates);
  const [loanError, setLoanError] = useState(serverRejected ? HTTPS : '');
  const [ratesError, setRatesError] = useState('');
  const [busy, setBusy] = useState(false);
  const loanRef = useRef<HTMLInputElement>(null);
  const ratesRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (serverRejected) loanRef.current?.focus();
  }, [serverRejected]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const loanProblem = httpsProblem(loan, true);
    const ratesProblem = httpsProblem(rates, false);
    setLoanError(loanProblem);
    setRatesError(ratesProblem);
    if (loanProblem || ratesProblem) {
      (loanProblem ? loanRef : ratesRef).current?.focus();
      return;
    }
    setBusy(true);
    const saved = await saveDashboardLoanLinks(tenantId, loan, rates);
    if (!saved.ok) {
      if (httpsProblem(rates, false)) {
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
    <form action={saveLoanLinksAction} noValidate onSubmit={onSubmit} className="mb-10 grid max-w-[560px] gap-4">
      <h2 className="text-[24px] font-bold leading-[30px]">Loan application</h2>
      {!initialLoan && !initialRates ? <p className="text-[14px] leading-[20px] cu-muted">These fields start empty.</p> : null}
      <input type="hidden" name="tenant" value={tenantId} />
      <label className="text-[14px] font-semibold leading-[20px]" htmlFor="loan-url">Loan application URL
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
        <span id="rates-hint" className="mt-2 block font-normal cu-muted">Example: https://www.example.com/auto-rates. Leave this blank to hide See auto rates.</span>
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
      <button type="submit" disabled={busy} className="cu-primary cu-ring inline-flex h-12 w-full items-center justify-center rounded-lg px-4 text-[15px] font-semibold md:h-11 md:w-auto">Save links</button>
    </form>
  );
}
