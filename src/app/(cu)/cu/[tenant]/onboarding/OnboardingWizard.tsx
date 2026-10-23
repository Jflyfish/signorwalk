'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MemberPreview } from '../MemberPreview';
import { CopyLink } from '../dashboard/CopyLink';
import { HTTPS_LINK } from '@/cu/form-copy';
import { saveOnboardingBrand, saveOnboardingLoan, saveOnboardingStep } from './actions';

const field = 'cu-ring mt-2 block h-12 w-full rounded-lg border cu-line px-4 text-[16px] font-normal';
const button = 'cu-primary cu-ring inline-flex h-12 w-full items-center justify-center rounded-lg px-4 text-[15px] font-semibold md:w-auto';
const HTTPS = HTTPS_LINK;

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

export function OnboardingWizard({
  tenantId,
  initialStep,
  initialLogo,
  initialColor,
  initialLoan,
  initialRates,
  initialDisclosure,
  shareUrl,
  snippet,
  pageUrl,
  previewUrl,
}: {
  tenantId: string;
  initialStep: 1 | 2 | 3;
  initialLogo: string;
  initialColor: string;
  initialLoan: string;
  initialRates: string;
  initialDisclosure: string;
  shareUrl: string;
  snippet: string;
  pageUrl: string;
  previewUrl: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(initialStep);
  const [logo, setLogo] = useState(initialLogo);
  const [color, setColor] = useState(initialColor);
  const [loan, setLoan] = useState(initialLoan);
  const [rates, setRates] = useState(initialRates);
  const [disclosure, setDisclosure] = useState(initialDisclosure);
  const [logoError, setLogoError] = useState('');
  const [colorError, setColorError] = useState('');
  const [loanError, setLoanError] = useState('');
  const [ratesError, setRatesError] = useState('');
  const [note, setNote] = useState('');
  const [frameSrc, setFrameSrc] = useState(previewUrl);
  const logoRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);
  const loanRef = useRef<HTMLInputElement>(null);
  const ratesRef = useRef<HTMLInputElement>(null);
  const brandFlight = useRef<Promise<'ok' | 'logo' | 'color'> | null>(null);
  const loanFlight = useRef<Promise<'ok' | 'loan' | 'rates'> | null>(null);

  function bumpPreview() {
    setFrameSrc(`${previewUrl}?draft=${Date.now()}`);
  }

  function brandProblems(nextLogo = logo, nextColor = color): { logo: string; color: string } {
    const colorProblem = /^#[0-9a-fA-F]{6}$/.test(nextColor.trim()) ? '' : 'Enter a color like #075985.';
    return { logo: httpsProblem(nextLogo, false), color: colorProblem };
  }

  function persistBrand(): Promise<'ok' | 'logo' | 'color'> {
    if (brandFlight.current) return brandFlight.current;
    const problems = brandProblems();
    if (problems.logo) return Promise.resolve('logo');
    if (problems.color) return Promise.resolve('color');
    const run = (async () => {
      const saved = await saveOnboardingBrand(tenantId, logo, color);
      if (!saved.ok) {
        if (saved.error === HTTPS) {
          setLogoError(saved.error);
          return 'logo' as const;
        }
        setColorError(saved.error);
        return 'color' as const;
      }
      if (saved.primary.toLowerCase() !== color.trim().toLowerCase()) {
        setColor(saved.primary);
        setNote(`Saved as ${saved.primary} so text and buttons meet 4.5:1 on white.`);
      } else {
        setNote('');
      }
      setLogoError('');
      setColorError('');
      bumpPreview();
      return 'ok' as const;
    })();
    brandFlight.current = run;
    void run.finally(() => {
      if (brandFlight.current === run) brandFlight.current = null;
    });
    return run;
  }

  function persistLoan(): Promise<'ok' | 'loan' | 'rates'> {
    if (loanFlight.current) return loanFlight.current;
    const loanProblem = httpsProblem(loan, true);
    const ratesProblem = httpsProblem(rates, false);
    if (loanProblem) return Promise.resolve('loan');
    if (ratesProblem) return Promise.resolve('rates');
    const run = (async () => {
      const saved = await saveOnboardingLoan(tenantId, loan, disclosure, rates);
      if (!saved.ok) {
        if (httpsProblem(rates, false)) {
          setRatesError(saved.error);
          return 'rates' as const;
        }
        setLoanError(saved.error);
        return 'loan' as const;
      }
      setLoanError('');
      setRatesError('');
      bumpPreview();
      return 'ok' as const;
    })();
    loanFlight.current = run;
    void run.finally(() => {
      if (loanFlight.current === run) loanFlight.current = null;
    });
    return run;
  }

  async function go(next: 1 | 2 | 3) {
    if (step === 1 && next > 1) {
      const problems = brandProblems();
      setLogoError(problems.logo);
      setColorError(problems.color);
      if (problems.logo || problems.color) {
        (problems.logo ? logoRef : colorRef).current?.focus();
        return;
      }
      const saved = await persistBrand();
      if (saved !== 'ok') {
        (saved === 'logo' ? logoRef : colorRef).current?.focus();
        return;
      }
    }
    if (step === 2 && next > 2) {
      const loanProblem = httpsProblem(loan, true);
      const ratesProblem = httpsProblem(rates, false);
      setLoanError(loanProblem);
      setRatesError(ratesProblem);
      if (loanProblem || ratesProblem) {
        (loanProblem ? loanRef : ratesRef).current?.focus();
        return;
      }
      const saved = await persistLoan();
      if (saved !== 'ok') {
        (saved === 'rates' ? ratesRef : loanRef).current?.focus();
        return;
      }
    }
    if (next === 3) {
      const saved = await saveOnboardingStep(tenantId, 3, true);
      if (!saved) {
        setStep(2);
        setLoanError(HTTPS);
        loanRef.current?.focus();
        return;
      }
    } else {
      await saveOnboardingStep(tenantId, next, false);
    }
    setStep(next);
  }

  return (
    <div className="grid items-start gap-10 md:grid-cols-[minmax(0,32rem)_390px]">
      <div>
        {step === 1 ? (
          <form
            noValidate
            onSubmit={event => {
              event.preventDefault();
              void go(2);
            }}
          >
            <h1 className="text-[32px] font-bold leading-[38px]">Logo and color</h1>
            <p className="mt-4 text-[15px] leading-[24px] cu-muted">The credit union name is the wordmark until you add a logo.</p>
            <label className="mt-6 block text-[14px] font-semibold leading-[20px]" htmlFor="logo-url">Logo URL (optional)
              <span id="logo-hint" className="mt-2 block font-normal cu-muted">Example: https://www.example.com/logo.png</span>
              <input
                ref={logoRef}
                id="logo-url"
                type="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                value={logo}
                aria-invalid={logoError ? true : undefined}
                aria-describedby={logoError ? 'logo-hint logo-error' : 'logo-hint'}
                onChange={event => setLogo(event.target.value)}
                onBlur={() => { void persistBrand(); }}
                className={field}
              />
            </label>
            {logoError ? <InlineError id="logo-error">{logoError}</InlineError> : null}
            <label className="mt-4 block text-[14px] font-semibold leading-[20px]" htmlFor="brand-color">Brand color
              <span id="color-hint" className="mt-2 block font-normal cu-muted">Example: #075985. A light color is darkened until text and buttons reach 4.5:1 on white.</span>
              <input
                ref={colorRef}
                id="brand-color"
                value={color}
                autoComplete="off"
                spellCheck={false}
                aria-invalid={colorError ? true : undefined}
                aria-describedby={colorError ? 'color-hint color-error' : 'color-hint'}
                onChange={event => setColor(event.target.value)}
                onBlur={() => { void persistBrand(); }}
                className={field}
              />
            </label>
            {colorError ? <InlineError id="color-error">{colorError}</InlineError> : null}
            {note ? <p className="mt-4 text-[14px] leading-[20px]" role="status">{note}</p> : null}
            <button type="submit" className={`${button} mt-6`}>Continue</button>
          </form>
        ) : null}

        {step === 2 ? (
          <form
            noValidate
            onSubmit={event => {
              event.preventDefault();
              void go(3);
            }}
          >
            <h1 className="text-[32px] font-bold leading-[38px]">Loan application</h1>
            <label className="mt-6 block text-[14px] font-semibold leading-[20px]" htmlFor="loan-url">Loan application URL
              <span id="loan-hint" className="mt-2 block font-normal cu-muted">Example: https://www.example.com/auto-loans</span>
              <input
                ref={loanRef}
                id="loan-url"
                type="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                value={loan}
                aria-invalid={loanError ? true : undefined}
                aria-describedby={loanError ? 'loan-hint loan-error' : 'loan-hint'}
                onChange={event => setLoan(event.target.value)}
                onBlur={() => { void persistLoan(); }}
                className={field}
              />
            </label>
            {loanError ? <InlineError id="loan-error">{loanError}</InlineError> : null}
            <label className="mt-4 block text-[14px] font-semibold leading-[20px]" htmlFor="rates-url">Rates URL (optional)
              <span id="rates-hint" className="mt-2 block font-normal cu-muted">Example: https://www.example.com/auto-rates. Leave this blank to hide See auto rates.</span>
              <input
                ref={ratesRef}
                id="rates-url"
                type="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                value={rates}
                aria-invalid={ratesError ? true : undefined}
                aria-describedby={ratesError ? 'rates-hint rates-error' : 'rates-hint'}
                onChange={event => setRates(event.target.value)}
                onBlur={() => { if (loan.trim()) void persistLoan(); }}
                className={field}
              />
            </label>
            {ratesError ? <InlineError id="rates-error">{ratesError}</InlineError> : null}
            <label className="mt-4 block text-[14px] font-semibold leading-[20px]" htmlFor="disclosure">Disclosure line (optional)
              <span id="disclosure-hint" className="mt-2 block font-normal cu-muted">Example: Membership required. Shown under the check.</span>
              <input
                id="disclosure"
                value={disclosure}
                maxLength={180}
                aria-describedby="disclosure-hint"
                onChange={event => setDisclosure(event.target.value)}
                onBlur={() => { if (loan.trim()) void persistLoan(); }}
                className={field}
              />
            </label>
            <div className="mt-6 flex flex-wrap gap-4">
              <button type="button" className="text-[15px] font-semibold underline underline-offset-4" onClick={() => void go(1)}>Back</button>
              <button type="submit" className={button}>Continue</button>
            </div>
          </form>
        ) : null}

        {step === 3 ? (
          <div>
            <h1 className="text-[32px] font-bold leading-[38px]">Share your page</h1>
            <p className="mt-4 break-all text-[15px] leading-[24px]">{shareUrl}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <CopyLink text={shareUrl} label="Copy link" />
              <CopyLink text={snippet} label="Copy embed" />
            </div>
            <p className="mt-2 max-w-[32rem] text-[14px] leading-[20px] cu-muted">The embed loads only on a domain in this credit union&apos;s allowlist.</p>
            <div className="mt-6 flex flex-wrap gap-4">
              <button type="button" className="text-[15px] font-semibold underline underline-offset-4" onClick={() => void go(2)}>Back</button>
              <button
                type="button"
                className={button}
                onClick={() => {
                  void saveOnboardingStep(tenantId, 3, true).then(ok => {
                    if (ok) router.push(`/cu/${tenantId}/dashboard`);
                    else {
                      setStep(2);
                      setLoanError(HTTPS);
                    }
                  });
                }}
              >
                Go to dashboard
              </button>
            </div>
          </div>
        ) : null}
      </div>
      <MemberPreview href={pageUrl} frameSrc={frameSrc} title="Your page" />
    </div>
  );
}
