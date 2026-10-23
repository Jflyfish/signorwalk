import { evaluateDeal } from '@/cu/engine/evaluate';
import { formatMoney } from '@/cu/engine/math';
import type { FlagId, ReportRow, TenantReport } from '@/cu/engine/types';
import { ADD_APR_RECOMMENDATION, financeGradeIsProvisional } from '@/cu/recommendation-display';

/** Offer quality. These words describe the offer, not the member's credit. */
export const OFFER_QUALITY = {
  A: 'Strong',
  B: 'Fair',
  C: 'Weak',
  D: 'Weak',
  F: 'Weak',
} as const;

export type OfferQuality = (typeof OFFER_QUALITY)[keyof typeof OFFER_QUALITY];

/**
 * Shown once, under the grade and verdict.
 * Draft wording. Counsel for the credit union has not reviewed these sentences.
 */
export const GRADE_DISCLAIMER_NOT_AN_OFFER = 'This is not a loan offer.';
export const GRADE_DISCLAIMER_EDUCATIONAL = 'This grade is educational.';
export const LOAN_CTA_HELPER = 'Not an offer of credit.';
export const PRINT_NOT_ADVICE = 'Not financial advice.';

export function gradeDisclaimerLines(shortName: string): readonly string[] {
  return [
    GRADE_DISCLAIMER_NOT_AN_OFFER,
    `${shortName} does not endorse the dealer.`,
    GRADE_DISCLAIMER_EDUCATIONAL,
  ];
}

export function offerQuality(grade: string): OfferQuality | null {
  if (grade in OFFER_QUALITY) return OFFER_QUALITY[grade as keyof typeof OFFER_QUALITY];
  return null;
}

function words(value: string): string[] {
  return value.trim().replace(/[.]+$/g, '').split(/\s+/).filter(Boolean);
}

function sentence(value: string): string {
  const trimmed = value.trim().replace(/[.]+$/g, '');
  return trimmed ? `${trimmed}.` : '';
}

export interface AprGradeCutoffs {
  /** Highest APR that still receives the stronger score adjustment. */
  strong: number;
  /** Highest APR that is not flagged high. */
  high: number;
  /** Highest APR that is not flagged very high. */
  veryHigh: number;
}

let cachedCutoffs: AprGradeCutoffs | null = null;

function formatCut(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value);
}

/**
 * The engine does not export these cutoffs. They are read by running evaluateDeal.
 * Finance APR is the only input. There is no credit tier on EngineInput.
 */
export function aprGradeCutoffs(): AprGradeCutoffs {
  if (cachedCutoffs) return cachedCutoffs;
  let strong = 0;
  let high = 0;
  let veryHigh = 0;
  for (let cents = 0; cents <= 4000; cents++) {
    const apr = cents / 100;
    const result = evaluateDeal({ dealType: 'finance', apr });
    if (result.adjustments.some(item => item.id === 'APR_STRONG')) strong = apr;
    if (!result.flags.some(item => item.id === 'FLAG_APR_HIGH' || item.id === 'FLAG_APR_VERY_HIGH')) high = apr;
    if (!result.flags.some(item => item.id === 'FLAG_APR_VERY_HIGH')) veryHigh = apr;
  }
  cachedCutoffs = { strong, high, veryHigh };
  return cachedCutoffs;
}

/** Member-facing description of the APR rules. Numbers come from aprGradeCutoffs. */
export function aprGradeExplanation(): string {
  const cuts = aprGradeCutoffs();
  return `A finance APR is scored the same way for every member. This tool does not read a credit tier. An APR at or under ${formatCut(cuts.strong)}% gets the stronger score. An APR above ${formatCut(cuts.high)}% is flagged, and an APR above ${formatCut(cuts.veryHigh)}% is flagged further. These are fixed grading cutoffs, not a market rate and not an offer of credit.`;
}

const SHORT_LABEL: Record<string, string> = {
  'Price versus MSRP': 'Price',
  APR: 'APR',
  'Money factor': 'Money factor',
  Term: 'Term',
  'Documentation fee': 'Doc fee',
  'Monthly payment': 'Monthly payment',
  'Total interest': 'Interest',
  Residual: 'Residual',
  'Acquisition fee': 'Acquisition fee',
  'Cap cost reduction': 'Cap reduction',
  'Cash down payment': 'Down payment',
  'Trade-in': 'Trade-in',
  'GAP product': 'GAP',
  'Service contract': 'Service contract',
  'Tire and wheel product': 'Tire and wheel',
  'Appearance product': 'Appearance product',
  Rebates: 'Rebates',
};

/**
 * Questions a member can read to the dealer.
 * A credit-union rate is included only when the caller passes one.
 */
const HURT_QUESTION: Record<string, string> = {
  'Price versus MSRP': 'Can you put this price against MSRP in writing for me?',
  APR: 'What APR can you offer if I bring my own financing?',
  'Money factor': 'Is this the base money factor, and what does the difference cost me?',
  Term: 'Can you show me total interest at this term and at a shorter term?',
  'Documentation fee': 'Can you itemize this documentation fee and reduce it for me?',
  'Monthly payment': 'Which taxes, fees, or products are in this payment for me?',
  'Total interest': 'Can you show me total interest at this rate and at a shorter term?',
  Residual: 'What residual in dollars and as a percent of MSRP are you using for me?',
  'Acquisition fee': 'Can you show me the acquisition fee as its own line?',
  'Cap cost reduction': 'What would my payment be with a smaller cap cost reduction?',
  'Trade-in': 'Can you show me the trade offer, the payoff, and any amount rolled into the financing?',
  'GAP product': 'What would my payment be without the GAP product?',
  'Service contract': 'What would my payment be without the service contract?',
  'Tire and wheel product': 'What would my payment be without the tire and wheel product?',
  'Appearance product': 'What would my payment be without the appearance product?',
};

export interface ReadoutRow {
  label: string;
  figure: string;
  tone: 'helped' | 'hurt';
  /** Concrete reference only, such as MSRP. */
  versus?: string;
  /** Second line. Numbers come from the row the engine scored, or from aprGradeCutoffs. */
  why: string;
}

function figureOf(value: string): string {
  return value.split(' (')[0].trim();
}

function versusFor(row: ReportRow): string | undefined {
  if (row.label === 'Price versus MSRP') return 'MSRP';
  if (row.label === 'Money factor' && /base money factor entered is/.test(row.explanation)) return 'base money factor';
  if (row.label === 'Trade-in') return 'payoff';
  return undefined;
}

function moneyAmounts(text: string): number[] {
  return [...text.matchAll(/\$[\d,]+(?:\.\d+)?/g)].map(match => Number(match[0].replace(/[$,]/g, '')));
}

function priceWhy(row: ReportRow): string {
  const amounts = moneyAmounts(row.explanation);
  if (amounts.length >= 2) {
    const selling = amounts[0];
    const msrp = amounts[1];
    const gap = Math.abs(selling - msrp);
    if (gap < 1) return 'at MSRP';
    const formatted = formatMoney(gap);
    return selling > msrp ? `${formatted} over MSRP` : `${formatted} under MSRP`;
  }
  return 'compared with MSRP';
}

function aprWhy(row: ReportRow): string {
  const match = row.value.match(/(\d+(?:\.\d+)?)%/);
  const apr = match ? Number(match[1]) : Number.NaN;
  const cuts = aprGradeCutoffs();
  if (row.status === 'good') {
    return `at or under this tool's ${formatCut(cuts.strong)}% grading threshold`;
  }
  const line = Number.isFinite(apr) && apr > cuts.veryHigh
    ? cuts.veryHigh
    : Number.isFinite(apr) && apr > cuts.high
      ? cuts.high
      : cuts.strong;
  return `above this tool's ${formatCut(line)}% grading threshold (not a market rate or an offer)`;
}

function whyFor(row: ReportRow): string {
  switch (row.label) {
    case 'Price versus MSRP':
      return priceWhy(row);
    case 'APR':
      return aprWhy(row);
    case 'Money factor':
      return /base money factor entered is/.test(row.explanation) ? 'compared with the base money factor' : 'money factor entered';
    case 'Term':
      return 'term entered on the worksheet';
    case 'Documentation fee':
      return 'doc fee entered on the worksheet';
    case 'Monthly payment':
      return 'quoted payment on the worksheet';
    case 'Total interest':
      return 'calculated from the figures entered';
    case 'Residual':
      return 'residual share of MSRP';
    case 'Acquisition fee':
      return 'acquisition fee on the worksheet';
    case 'Cap cost reduction':
      return 'cap reduction on this lease';
    case 'Cash down payment':
      return 'cash down on this offer';
    case 'Trade-in':
      return 'compared with the payoff';
    case 'GAP product':
    case 'Service contract':
    case 'Tire and wheel product':
    case 'Appearance product':
      return 'add-on on this offer';
    case 'Rebates':
      return 'rebate entered on the worksheet';
    default:
      return 'figure entered on the worksheet';
  }
}

const TONE_RANK = { bad: 0, warn: 1, good: 2 } as const;

/** At most five rows the report already scored. APR is present only when the engine scored an APR. */
export function readoutRows(report: Pick<TenantReport, 'breakdown'>): ReadoutRow[] {
  return report.breakdown
    .map((row, index) => ({ row, index }))
    .sort((a, b) => TONE_RANK[a.row.status] - TONE_RANK[b.row.status] || a.index - b.index)
    .slice(0, 5)
    .map(({ row }) => ({
      label: SHORT_LABEL[row.label] ?? row.label,
      figure: figureOf(row.value),
      tone: row.status === 'good' ? 'helped' as const : 'hurt' as const,
      versus: versusFor(row),
      why: whyFor(row),
    }));
}

function hurtPhrase(row: ReadoutRow): string {
  if (row.why && !/grading threshold/.test(row.why) && words(row.why).length <= 8) return row.why;
  return `${row.figure} ${row.label}`.trim();
}

/** One sentence, 16 words or fewer, from the scored rows. A blank APR still suppresses sign. */
export function verdictSentence(
  report: Pick<TenantReport, 'headline' | 'recommendation' | 'recommendationLabel' | 'grade' | 'notes' | 'breakdown'>,
  aprBlank: boolean,
): string {
  const provisional = financeGradeIsProvisional(report, aprBlank);
  if (report.recommendation === 'sign' && (aprBlank || provisional)) {
    return sentence(ADD_APR_RECOMMENDATION);
  }
  const quality = offerQuality(report.grade) ?? 'Fair';
  const hurts = readoutRows(report).filter(row => row.tone === 'hurt');
  if (hurts.length === 0) return sentence(`${quality} deal on the figures you entered`);
  if (hurts.length === 1) {
    const named = `${quality} deal overall, but ask about the ${hurtPhrase(hurts[0])}`;
    if (words(named).length <= 16) return sentence(named);
    return sentence(`${quality} deal with 1 thing to ask about`);
  }
  return sentence(`${quality} deal with ${hurts.length} things to ask about`);
}

export function figuresEntered(report: Pick<TenantReport, 'breakdown'>): number {
  return report.breakdown.filter(row => row.label !== 'Total interest').length;
}

export function dealerQuestions(
  report: Pick<TenantReport, 'breakdown'>,
  creditUnionApr?: number,
): string[] {
  const hurts = report.breakdown.filter(row => row.status !== 'good');
  const seen = new Set<string>();
  const questions: string[] = [];
  for (const row of hurts) {
    let text = HURT_QUESTION[row.label] ?? '';
    if (row.label === 'APR' && creditUnionApr !== undefined && Number.isFinite(creditUnionApr)) {
      text = `What APR can you offer if I bring my own financing at ${creditUnionApr}%?`;
    }
    text = text.trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    questions.push(text);
  }
  return questions;
}

export function copySummary(input: {
  grade: string;
  quality: string;
  verdict: string;
  questions: readonly string[];
}): string {
  const lines = [
    `Grade ${input.grade}, ${input.quality}`,
    `This offer looks ${input.quality}`,
    input.verdict,
  ];
  if (input.questions.length > 0) {
    lines.push('', 'What to ask the dealer', ...input.questions);
  }
  return lines.join('\n');
}

export const QUESTIONS_ON_SCREEN = 3;
