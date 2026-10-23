'use client';

import { useEffect, useRef, useState } from 'react';
import { GRADE_FILL } from '@/cu/grades';
import {
  PRINT_NOT_ADVICE,
  QUESTIONS_ON_SCREEN,
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
  const headingRef = useRef<HTMLHeadingElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [moreQuestions, setMoreQuestions] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const [copied, setCopied] = useState(false);
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
  const showCta = showPreapproval || showRates;
  const summary = copySummary({ grade: report.grade, quality, verdict, questions });

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

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

  return (
    <div className={embedded
      ? 'mx-auto w-full max-w-[560px] px-4 pt-16 md:pt-24'
      : `mx-auto w-full max-w-[560px] px-4 ${showCta ? 'pb-[calc(240px+env(safe-area-inset-bottom))] md:pb-16' : 'pb-16'} pt-16 md:pt-24`}>
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
      </div>

      <div className="flex h-24 w-24 items-center justify-center rounded-[16px]" role="img" aria-label={`Grade ${report.grade}, ${quality}`} style={{ backgroundColor: gradeTint(gradeColor) }}>
        <p aria-hidden="true" className="text-[64px] font-extrabold leading-none" style={{ color: gradeColor }}>
          {report.grade}
        </p>
      </div>
      <p className="mt-4 text-[14px] font-semibold leading-[20px]">This offer looks {quality}</p>
      <p className="mt-2 text-[14px] leading-[20px] cu-muted">Graded by {shortName} · with Sign or Walk</p>
      {limitedPill ? (
        <p className="mt-4 inline-flex rounded-full border cu-line px-3 py-1 text-[13px] font-semibold leading-[18px]">{limitedPill}</p>
      ) : null}
      <DisclaimerList lines={disclaimers} />

      <h1 ref={headingRef} tabIndex={-1} className="mt-6 text-[24px] font-bold leading-[30px] outline-none">
        {verdict}
      </h1>

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
            <li key={row.label} className="flex items-baseline gap-3 border-t cu-line py-4">
              <span aria-hidden="true" className="w-4 shrink-0 text-[16px] font-semibold" style={{ color: row.tone === 'helped' ? '#14532d' : '#92400e' }}>
                {row.tone === 'helped' ? '✓' : '!'}
              </span>
              <span className="sr-only">{row.tone === 'helped' ? 'Helped. ' : 'Ask about this. '}</span>
              <span className="min-w-0 flex-1">
                <span className="text-[16px] leading-[24px]">{row.label}</span>
                {row.versus ? <span className="mt-1 block text-[13px] leading-[18px] cu-muted">vs {row.versus}</span> : null}
              </span>
              <span className="shrink-0 text-[16px] font-semibold leading-[24px] tabular-nums">{row.figure}</span>
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

      {showCta ? (
        <div className={embedded
          ? 'static mt-10 w-full'
          : 'cu-pinned fixed inset-x-0 bottom-0 z-10 border-t cu-line bg-white px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:static md:mt-10 md:border-0 md:bg-transparent md:p-0'}>
          <div className="mx-auto flex w-full max-w-[560px] flex-col items-start gap-3">
            {showPreapproval ? (
              <a
                href={memberLink(preApprovalUrl)}
                target="_top"
                className="cu-primary cu-ring inline-flex items-center justify-center gap-2 text-center min-h-12 w-full px-4 rounded-lg text-[15px] font-semibold leading-[20px] md:w-auto"
                onClick={() => onCta('preapproval')}
              >
                <span>Get pre-approved with {shortName}</span>
                {demoPreapproval ? (
                  <span className="inline-flex items-center rounded-full border border-white/40 px-2 py-0.5 text-[12px] font-semibold leading-[16px]">Demo</span>
                ) : null}
              </a>
            ) : null}
            {showRates ? (
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
            ) : null}
            <DisclaimerList lines={disclaimers} />
          </div>
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

          <p className="mt-6">
            <button type="button" className={textLink} onClick={() => setHowOpen(true)}>How we grade</button>
          </p>
        </div>
        <p className="cu-no-print mt-6">
          <button type="button" className={textLink} onClick={onCheckAnother}>
            Check another offer
          </button>
        </p>
      </div>

      {howOpen ? (
        <div className="cu-no-print fixed inset-0 z-20 flex items-end justify-center bg-black/40 px-4 py-6 sm:items-center" role="presentation" onClick={() => setHowOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="how-heading"
            className="w-full max-w-[480px] rounded-lg bg-white p-6"
            onClick={event => event.stopPropagation()}
          >
            <h2 id="how-heading" className="text-[24px] font-bold leading-[30px]">How we grade</h2>
            <p className="mt-4 text-[16px] leading-[24px]">
              The letter compares this offer with the numbers you entered. Strong, Fair, and Weak describe the offer. They do not describe your credit.
            </p>
            <p className="mt-4 text-[16px] leading-[24px]">This grade is educational. It is not a loan offer.</p>
            <p className="mt-6">
              <button type="button" className={textLink} onClick={() => setHowOpen(false)}>Close</button>
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
