'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MemberPreview } from '../MemberPreview';
import { CopyLink } from '../dashboard/CopyLink';
import { saveOnboardingBrand, saveOnboardingLoan, saveOnboardingStep } from './actions';

const field = 'cu-ring mt-2 block h-12 w-full rounded-lg border cu-line px-4 text-[16px] font-normal';
const button = 'cu-primary cu-ring inline-flex h-12 w-full items-center justify-center rounded-lg px-4 text-[15px] font-semibold md:w-auto';

function FieldError({ children }: { children: string }) {
  return <p className="mt-2 text-[14px] leading-[20px]" style={{ color: '#B42318' }} role="alert">{children}</p>;
}

export function OnboardingWizard({
  tenantId,
  initialStep,
  initialLogo,
  initialColor,
  initialLoan,
  initialDisclosure,
  shareUrl,
  snippet,
  pageUrl,
}: {
  tenantId: string;
  initialStep: 1 | 2 | 3;
  initialLogo: string;
  initialColor: string;
  initialLoan: string;
  initialDisclosure: string;
  shareUrl: string;
  snippet: string;
  pageUrl: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(initialStep);
  const [logo, setLogo] = useState(initialLogo);
  const [color, setColor] = useState(initialColor);
  const [loan, setLoan] = useState(initialLoan);
  const [disclosure, setDisclosure] = useState(initialDisclosure);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [preview, setPreview] = useState(pageUrl);
  const [busy, setBusy] = useState(false);

  function bumpPreview() {
    setPreview(`${pageUrl}?preview=${Date.now()}`);
  }

  async function persistBrand(): Promise<boolean> {
    setBusy(true);
    setError('');
    const saved = await saveOnboardingBrand(tenantId, logo, color);
    setBusy(false);
    if (!saved.ok) {
      setError(saved.error);
      return false;
    }
    if (saved.primary.toLowerCase() !== color.trim().toLowerCase()) {
      setColor(saved.primary);
      setNote(`Saved as ${saved.primary} so text and buttons meet 4.5:1 on white.`);
    } else {
      setNote('');
    }
    bumpPreview();
    return true;
  }

  async function persistLoan(): Promise<boolean> {
    setBusy(true);
    setError('');
    const saved = await saveOnboardingLoan(tenantId, loan, disclosure);
    setBusy(false);
    if (!saved.ok) {
      setError(saved.error);
      return false;
    }
    bumpPreview();
    return true;
  }

  async function go(next: 1 | 2 | 3) {
    setError('');
    if (step === 1 && next > 1) {
      if (!(await persistBrand())) return;
    }
    if (step === 2 && next > 2) {
      if (!(await persistLoan())) return;
    }
    setStep(next);
    await saveOnboardingStep(tenantId, next, next === 3);
  }

  return (
    <div className="grid items-start gap-10 md:grid-cols-[minmax(0,32rem)_390px]">
      <div>
        {step === 1 ? (
          <form
            onSubmit={event => {
              event.preventDefault();
              void go(2);
            }}
          >
            <h1 className="text-[32px] font-bold leading-[38px]">Logo and color</h1>
            <label className="mt-6 block text-[14px] font-semibold leading-[20px]" htmlFor="logo-url">Logo URL
              <span id="logo-hint" className="mt-2 block font-normal cu-muted">Example: https://www.example.com/logo.png</span>
              <input
                id="logo-url"
                type="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                value={logo}
                aria-describedby="logo-hint"
                onChange={event => setLogo(event.target.value)}
                onBlur={() => { if (logo.trim() && color.trim()) void persistBrand(); }}
                className={field}
              />
            </label>
            <label className="mt-4 block text-[14px] font-semibold leading-[20px]" htmlFor="brand-color">Brand color
              <span id="color-hint" className="mt-2 block font-normal cu-muted">Example: #075985. A light color is darkened until text and buttons reach 4.5:1 on white.</span>
              <input
                id="brand-color"
                value={color}
                autoComplete="off"
                spellCheck={false}
                aria-describedby="color-hint"
                onChange={event => setColor(event.target.value)}
                onBlur={() => { if (logo.trim() && color.trim()) void persistBrand(); }}
                className={field}
              />
            </label>
            {note ? <p className="mt-4 text-[14px] leading-[20px]" role="status">{note}</p> : null}
            {error ? <FieldError>{error}</FieldError> : null}
            <button type="submit" className={`${button} mt-6`} disabled={busy}>Continue</button>
          </form>
        ) : null}

        {step === 2 ? (
          <form
            onSubmit={event => {
              event.preventDefault();
              void go(3);
            }}
          >
            <h1 className="text-[32px] font-bold leading-[38px]">Loan application</h1>
            <label className="mt-6 block text-[14px] font-semibold leading-[20px]" htmlFor="loan-url">Loan application URL
              <span id="loan-hint" className="mt-2 block font-normal cu-muted">Example: https://www.example.com/auto-loans</span>
              <input
                id="loan-url"
                type="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                required
                value={loan}
                aria-describedby="loan-hint"
                onChange={event => setLoan(event.target.value)}
                onBlur={() => { if (loan.trim()) void persistLoan(); }}
                className={field}
              />
            </label>
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
            {error ? <FieldError>{error}</FieldError> : null}
            <div className="mt-6 flex flex-wrap gap-4">
              <button type="button" className="text-[15px] font-semibold underline underline-offset-4" onClick={() => void go(1)}>Back</button>
              <button type="submit" className={button} disabled={busy}>Continue</button>
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
            <div className="mt-6 flex flex-wrap gap-4">
              <button type="button" className="text-[15px] font-semibold underline underline-offset-4" onClick={() => void go(2)}>Back</button>
              <button
                type="button"
                className={button}
                onClick={() => {
                  void saveOnboardingStep(tenantId, 3, true).then(ok => {
                    if (ok) router.push(`/cu/${tenantId}/dashboard`);
                  });
                }}
              >
                Go to dashboard
              </button>
            </div>
          </div>
        ) : null}
      </div>
      <MemberPreview href={preview} title="Your page" />
    </div>
  );
}
