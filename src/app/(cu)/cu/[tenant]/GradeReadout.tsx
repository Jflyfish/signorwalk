'use client';

import { useEffect, useRef, useState } from 'react';
import { GRADE_FILL } from '@/cu/grades';
import {
  LOAN_CTA_HELPER,
  PRINT_NOT_ADVICE,
  QUESTIONS_ON_SCREEN,
  aprGradeExplanation,
  copySummary,
  dealerQuestions,
  figuresEntered,
  gradeDisclaimerLines,
  offerQuality,
  readoutRows,
  verdictSentence,
} from '@/cu/grade-readout';
import type { TenantReport } from '@/cu/engine/types';
import { memberLink } from '@/cu/utm';
import { BrandLockup } from '../BrandLockup';

const textLink =
  'cu-link cu-ring text-[15px] font-semibold hover:underline underline-offset-4';

function gradeTint(hex: string): string {
  const raw = hex.replace('#', '');
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `rgb(${r} ${g} ${b} / 0.1)`;
}

function DisclaimerList({ lines }: { lines: readonly string[] }) {
  return (
    <ul className="mt-4 space-y-1 text-[13px] leading-[18px] cu-muted">
      {lines.map(line => <li key={line}>{line}</li>)}
    </ul>
  );
}

function focusableIn(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter(node => !node.hasAttribute('disabled'));
}

export function GradeReadout({
  report,
  shortName,
  creditUnionName,
  logoMark,
  logoLight,
  logoAspect,
  logoColor,
  preApprovalUrl,
  ratesUrl,
  embedded,
  aprBlank,
  limitedPill,
  onCta,
  onCheckAnother,
}: {
  report: TenantReport;
  shortName: string;
  creditUnionName: string;
  logoMark?: 'harborlight' | 'summit' | 'larkspur';
  logoLight?: string;
  logoAspect?: number;
  logoColor: string;
  preApprovalUrl: string;
  ratesUrl: string;
  embedded: boolean;
  aprBlank: boolean;
  limitedPill: string | null;
  onCta: (target: 'preapproval' | 'rates') => void;
  onCheckAnother: () => void;
}) {
  const heroRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const inlineCtaRef = useRef<HTMLDivElement>(null);
  const howButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [moreQuestions, setMoreQuestions] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pinCta, setPinCta] = useState(false);
  const quality = offerQuality(report.grade) ?? 'Fair';
  const verdict = verdictSentence(report, aprBlank);
  const rows = readoutRows(report);
  const questions = dealerQuestions(report);
  const shownQuestions = questions.slice(0, QUESTIONS_ON_SCREEN);
  const restQuestions = questions.slice(QUESTIONS_ON_SCREEN);
  const entered = figuresEntered(report);
  const disclaimers = gradeDisclaimerLines(shortName);
  const gradeColor = GRADE_FILL[report.grade] ?? '#111111';
  const demoPreapproval = preApprovalUrl.includes('/credit-unions/demo/');
  const demoRates = ratesUrl.includes('/credit-unions/demo/');
  const showPreapproval = Boolean(preApprovalUrl);
  const showRates = Boolean(ratesUrl);
  const summary = copySummary({ grade: report.grade, quality, verdict, questions });
  const grading = aprGradeExplanation();

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    hero.focus({ preventScroll: true });
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    hero.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  }, [report]);

  useEffect(() => {
    const node = inlineCtaRef.current;
    if (!node || embedded) return;
    const observer = new IntersectionObserver(([entry]) => {
      setPinCta(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [embedded, report]);

  function closeHow() {
    setHowOpen(false);
    howButtonRef.current?.focus();
  }

  useEffect(() => {
    if (!howOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setHowOpen(false);
        howButtonRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const items = focusableIn(dialog);
      if (items.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey) {
        if (active === first || active === dialog || !dialog.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !dialog.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [howOpen]);

  function openDetails() {
    setShowDetails(true);
    requestAnimationFrame(() => detailsRef.current?.scrollIntoView({ block: 'start' }));
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      return;
    } catch {
      // The async clipboard API is denied in some browsers. The selection path still copies plain text.
    }
    const area = document.createElement('textarea');
    area.value = summary;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    setCopied(ok);
  }

  const loanButton = (pinned: boolean) => (
    <a
      href={memberLink(preApprovalUrl)}
      target="_top"
      className={`cu-primary cu-ring flex h-11 w-full items-center justify-center gap-2 rounded-lg px-3 text-[15px] font-semibold leading-[20px] ${pinned ? '' : 'md:w-auto'}`}
      onClick={() => onCta('preapproval')}
    >
      <span className="truncate">Get pre-approved with {shortName}</span>
      {demoPreapproval ? (
        <span className="inline-flex shrink-0 items-center rounded-full border border-white/40 px-2 py-0.5 text-[12px] font-semibold leading-[16px]">Demo</span>
      ) : null}
    </a>
  );

  return (
    <div className={embedded
      ? 'mx-auto w-full max-w-[560px] px-4 pt-16 md:pt-24'
      : `mx-auto w-full max-w-[560px] px-4 ${showPreapproval ? 'pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-16' : 'pb-16'} pt-16 md:pt-24`}>
      <div className="cu-print-only mb-6">
        <BrandLockup
          name={creditUnionName}
          shortName={shortName}
          color={logoColor}
          mark={logoMark}
          logoLight={logoLight}
          logoAspect={logoAspect}
          beside={false}
        />
        <p className="mt-2 text-[14px] leading-[20px]" suppressHydrationWarning>
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        <p className="mt-1 text-[14px] font-semibold leading-[20px]">{PRINT_NOT_ADVICE}</p>
        {preApprovalUrl ? <p className="mt-2 break-all text-[14px] leading-[20px]">{preApprovalUrl}</p> : null}
      </div>

      <div
        ref={heroRef}
        tabIndex={-1}
        className="cu-hero cu-ring flex h-24 w-24 items-center justify-center rounded-[16px] outline-none"
        role="img"
        aria-label={`Grade ${report.grade}, ${quality}`}
        style={{ backgroundColor: gradeTint(gradeColor), scrollMarginTop: 'calc(4rem + 24px)' }}
      >
        <p aria-hidden="true" className="text-[64px] font-extrabold leading-none" style={{ color: gradeColor }}>
          {report.grade}
        </p>
      </div>
      <p className="mt-4 text-[14px] font-semibold leading-[20px]">This offer looks {quality}</p>
      <p className="mt-2 text-[14px] leading-[20px] cu-muted">Graded by {shortName} · with Sign or Walk</p>
      {limitedPill ? (
        <p className="mt-4 inline-flex rounded-full border cu-line px-3 py-1 text-[13px] font-semibold leading-[18px]">{limitedPill}</p>
      ) : null}

      <h1 className="mt-6 text-[24px] font-bold leading-[30px] outline-none">
        {verdict}
      </h1>
      <DisclaimerList lines={disclaimers} />

      {entered > 0 ? (
        <p className="mt-4">
          <button type="button" className={textLink} onClick={openDetails}>
            Based on {entered} {entered === 1 ? 'figure' : 'figures'} you entered
          </button>
        </p>
      ) : null}

      {rows.length > 0 ? (
        <ul className="mt-8" aria-label="What helped and what hurt">
          {rows.map(row => (
            <li key={row.label} className="border-t cu-line py-4">
              <div className="flex items-baseline gap-3">
                <span aria-hidden="true" className="w-4 shrink-0 text-[16px] font-semibold" style={{ color: row.tone === 'helped' ? '#14532d' : '#92400e' }}>
                  {row.tone === 'helped' ? '✓' : '!'}
                </span>
                <span className="sr-only">{row.tone === 'helped' ? 'Helped. ' : 'Ask about this. '}</span>
                <span className="min-w-0 flex-1 text-[16px] leading-[24px]">{row.label}</span>
                <span className="shrink-0 text-[16px] font-semibold leading-[24px] tabular-nums">{row.figure}</span>
              </div>
              <p className="mt-1 pl-7 text-[14px] leading-[20px] text-[#555]">{row.why}</p>
            </li>
          ))}
        </ul>
      ) : null}

      {questions.length > 0 ? (
        <section className="mt-10" aria-labelledby="ask-heading">
          <h2 id="ask-heading" className="text-[24px] font-bold leading-[30px]">What to ask the dealer</h2>
          <ol className="mt-4 list-decimal space-y-4 pl-5 text-[16px] leading-[24px]">
            {shownQuestions.map(question => <li key={question}>{question}</li>)}
          </ol>
          {restQuestions.length > 0 ? (
            <>
              <button
                type="button"
                className={`${textLink} cu-no-print mt-4`}
                aria-expanded={moreQuestions}
                onClick={() => setMoreQuestions(open => !open)}
              >
                More questions
              </button>
              <ol
                start={QUESTIONS_ON_SCREEN + 1}
                className={`mt-4 list-decimal space-y-4 pl-5 text-[16px] leading-[24px] ${moreQuestions ? '' : 'cu-more-collapsed'}`}
              >
                {restQuestions.map(question => <li key={question}>{question}</li>)}
              </ol>
            </>
          ) : null}
        </section>
      ) : null}

      {showRates ? (
        <p className="mt-8">
          <a
            href={memberLink(ratesUrl)}
            target="_top"
            className={`${textLink} inline-flex items-center gap-2`}
            onClick={() => onCta('rates')}
          >
            <span>See auto rates</span>
            {demoRates ? (
              <span className="inline-flex items-center rounded-full border cu-line px-2 py-0.5 text-[12px] font-semibold leading-[16px]">Demo</span>
            ) : null}
          </a>
        </p>
      ) : null}

      {showPreapproval ? (
        <div ref={inlineCtaRef} className="cu-no-print mt-4">
          {loanButton(false)}
          <p className="mt-2 flex items-center gap-2 text-[13px] leading-[18px] cu-muted">
            <span>{LOAN_CTA_HELPER}</span>
            {demoPreapproval ? (
              <span className="inline-flex items-center rounded-full border cu-line px-2 py-0.5 text-[12px] font-semibold leading-[16px]">Demo</span>
            ) : null}
          </p>
        </div>
      ) : null}

      <div className="cu-no-print mt-8 flex flex-col items-start gap-3">
        <button type="button" className={textLink} onClick={() => window.print()}>Print or save as PDF</button>
        <button type="button" className={textLink} onClick={() => void onCopy()}>Copy summary</button>
        <p aria-live="polite" className="sr-only">{copied ? 'Copied' : ''}</p>
      </div>

      <div className="mt-10 border-t cu-line pt-6">
        <button
          type="button"
          className={`${textLink} cu-no-print inline-flex items-center gap-1`}
          aria-expanded={showDetails}
          onClick={() => setShowDetails(open => !open)}
        >
          <span aria-hidden="true">{showDetails ? '▾' : '▸'}</span>
          See details
        </button>
        <div ref={detailsRef} className={showDetails ? 'mt-6' : 'cu-details-collapsed'}>
          {report.breakdown.length > 0 ? (
            <section aria-labelledby="breakdown-heading">
              <h2 id="breakdown-heading" className="text-[24px] font-bold leading-[30px]">Figures you entered</h2>
              <ul className="mt-4">
                {report.breakdown.map(row => (
                  <li key={row.label} className="border-t cu-line py-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="text-[18px] leading-[28px]">{row.label}</p>
                      <p className="text-[18px] font-semibold leading-[28px] tabular-nums">{row.value}</p>
                    </div>
                    <p className="mt-2 text-[14px] leading-[20px] cu-muted">{row.explanation}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {report.tradeIn ? (
            <section className="mt-10 border-t cu-line pt-6" aria-labelledby="trade-heading">
              <h2 id="trade-heading" className="text-[24px] font-bold leading-[30px]">{report.tradeIn.headline}</h2>
              <p className="mt-4 text-[18px] leading-[28px]">{report.tradeIn.details}</p>
            </section>
          ) : null}

          {report.stateTaxNote ? (
            <section className="mt-10 border-t cu-line pt-6" aria-labelledby="tax-heading">
              <h2 id="tax-heading" className="text-[24px] font-bold leading-[30px]">Trade-in and tax</h2>
              <p className="mt-4 text-[18px] leading-[28px]">{report.stateTaxNote}</p>
            </section>
          ) : null}

          <ul className="mt-10 space-y-4 border-t cu-line pt-6 text-[14px] leading-[20px] cu-muted">
            {report.disclaimers.map(line => <li key={line}>{line}</li>)}
          </ul>

          <p className="cu-no-print mt-6">
            <button ref={howButtonRef} type="button" className={textLink} onClick={() => setHowOpen(true)}>How we grade</button>
          </p>
        </div>
        <p className="cu-no-print mt-6">
          <button type="button" className={textLink} onClick={onCheckAnother}>
            Check another offer
          </button>
        </p>
      </div>

      {showPreapproval && pinCta && !embedded ? (
        <div
          className="cu-pinned cu-no-print fixed inset-x-0 bottom-0 z-10 flex items-center border-t bg-white px-3 md:hidden"
          style={{
            borderColor: '#E5E5E5',
            height: 'calc(64px + env(safe-area-inset-bottom))',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {loanButton(true)}
        </div>
      ) : null}

      {howOpen ? (
        <div className="cu-no-print fixed inset-0 z-30 flex items-end justify-center bg-black/40 px-4 py-6 sm:items-center" role="presentation" onClick={closeHow}>
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="how-heading"
            tabIndex={-1}
            className="w-full max-w-[480px] rounded-lg bg-white p-6"
            onClick={event => event.stopPropagation()}
          >
            <h2 id="how-heading" className="text-[24px] font-bold leading-[30px]">How we grade</h2>
            <p className="mt-4 text-[16px] leading-[24px]">
              The letter compares this offer with the numbers you entered. Strong, Fair, and Weak describe the offer. They do not describe your credit.
            </p>
            <p className="mt-4 text-[16px] leading-[24px]">{grading}</p>
            <p className="mt-4 text-[16px] leading-[24px]">This grade is educational. It is not a loan offer.</p>
            <p className="mt-6">
              <button type="button" className={textLink} onClick={closeHow}>Close</button>
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
