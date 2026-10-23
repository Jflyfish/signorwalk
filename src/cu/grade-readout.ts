import { evaluateDeal } from '@/cu/engine/evaluate';
import { formatMoney } from '@/cu/engine/math';
import type { ReportRow, TenantReport } from '@/cu/engine/types';
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

/** Height of the pinned pre-approval bar, including its 12px helper line. */
export const PINNED_BAR_HEIGHT = 'calc(12px + 44px + 4px + 16px + 12px + env(safe-area-inset-bottom))';

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

/**
 * Boundaries read by running evaluateDeal. The engine does not export them.
 * Percents are the highest value that still falls on the named side of the comparison.
 */
export interface GradeCutoffs extends AprGradeCutoffs {
  /** Discount percent below which the at-MSRP flag fires. */
  priceAtMsrp: number;
  /** First discount percent that receives a positive price adjustment. */
  priceScored: number;
  /** First discount percent that receives the stronger discount adjustment. */
  priceGood: number;
  /** Highest doc fee that is not flagged. */
  docFee: number;
  /** Highest doc fee that is not flagged further. */
  docFeeSteep: number;
  /** First term, in months, that is flagged long. */
  termLong: number;
  /** First term, in months, that is flagged further. */
  termVeryLong: number;
  /** Interest as a percent of price. Above this, the engine flags the interest. */
  interestPercent: number;
  acqFee: number;
  gap: number;
  gapSteep: number;
  warranty: number;
  tire: number;
  paint: number;
  residualLow: number;
  residualSoft: number;
  residualStrong: number;
  rebate: number;
}

let cachedCutoffs: GradeCutoffs | null = null;

/** One decimal, so a whole-number cutoff reads 6.0 rather than 6. */
export function formatCut(value: number): string {
  return value.toFixed(1);
}

function feeLine(amount: number): string {
  return `above the ${formatMoney(amount)} fee line this tool uses`;
}

/**
 * The engine does not export these cutoffs. They are read by running evaluateDeal.
 * Finance APR is compared on input.apr only. There is no credit tier on EngineInput.
 */
export function gradeCutoffs(): GradeCutoffs {
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

  const msrp = 100000;
  let priceAtMsrp = 0;
  let priceScored = 0;
  let priceGood = 0;
  for (let cents = 0; cents <= 2000; cents++) {
    const discount = cents / 100;
    const selling = Math.round(msrp * (1 - discount / 100) * 100) / 100;
    const result = evaluateDeal({ dealType: 'finance', msrp, sellingPrice: selling });
    const atMsrp = result.flags.some(item => item.id === 'FLAG_PRICE_AT_MSRP');
    if (!atMsrp && priceAtMsrp === 0 && cents > 0) priceAtMsrp = discount;
    const ids = result.adjustments.map(item => item.id);
    if (!priceScored && ids.some(id => id === 'DISCOUNT_AVG' || id === 'DISCOUNT_GOOD' || id === 'DISCOUNT_STRONG')) priceScored = discount;
    if (!priceGood && ids.some(id => id === 'DISCOUNT_GOOD' || id === 'DISCOUNT_STRONG')) priceGood = discount;
  }

  let docFee = 0;
  let docFeeSteep = 0;
  for (let fee = 0; fee <= 2000; fee++) {
    const result = evaluateDeal({ dealType: 'finance', docFee: fee });
    const steep = result.flags.some(item => item.id === 'FLAG_DOC_FEE_VERY_HIGH');
    const flagged = steep || result.flags.some(item => item.id === 'FLAG_DOC_FEE_HIGH');
    if (!flagged) docFee = fee;
    if (!steep) docFeeSteep = fee;
  }

  let termLong = 0;
  let termVeryLong = 0;
  for (let months = 1; months <= 120; months++) {
    const result = evaluateDeal({ dealType: 'finance', termMonths: months });
    if (!termLong && result.flags.some(item => item.id === 'FLAG_TERM_LONG' || item.id === 'FLAG_TERM_VERY_LONG')) termLong = months;
    if (!termVeryLong && result.flags.some(item => item.id === 'FLAG_TERM_VERY_LONG')) termVeryLong = months;
  }

  let interestPercent = 0;
  {
    const price = 10000;
    let lastOk = 0;
    for (let cents = 0; cents <= 4000; cents++) {
      const apr = cents / 100;
      const result = evaluateDeal({ dealType: 'finance', sellingPrice: price, msrp: price, apr, termMonths: 60 });
      const interest = result.calc.totalInterest ?? 0;
      const ratio = interest / price;
      if (result.flags.some(item => item.id === 'FLAG_INTEREST_HIGH')) {
        interestPercent = Math.round(((lastOk + ratio) / 2) * 100);
        break;
      }
      lastOk = ratio;
    }
  }

  const maxClear = (flagId: string, field: 'acquisitionFee' | 'gapInsurance' | 'extendedWarranty' | 'tireWheel', ceiling: number) => {
    let clear = 0;
    for (let amount = 0; amount <= ceiling; amount++) {
      const result = evaluateDeal({ dealType: field === 'acquisitionFee' ? 'lease' : 'finance', [field]: amount });
      if (result.flags.some(item => item.id === flagId)) break;
      clear = amount;
    }
    return clear;
  };

  let paint = 0;
  for (let amount = 0; amount <= 1000; amount++) {
    const result = evaluateDeal({ dealType: 'finance', paintInterior: amount });
    if (result.flags.some(item => item.id === 'FLAG_PAINT_HIGH')) {
      paint = amount;
      break;
    }
  }

  let residualLow = 0;
  let residualSoft = 0;
  let residualStrong = 0;
  for (let pct = 1; pct <= 80; pct++) {
    const result = evaluateDeal({ dealType: 'lease', msrp: 30000, sellingPrice: 28000, residualPercent: pct, termMonths: 36 });
    const low = result.flags.some(item => item.id === 'FLAG_LOW_RESIDUAL');
    const soft = result.flags.some(item => item.id === 'FLAG_RESIDUAL_SOFT');
    if (!low && residualLow === 0) residualLow = pct;
    if (!low && !soft && residualSoft === 0) residualSoft = pct;
    if (!residualStrong && result.adjustments.some(item => item.id === 'RESIDUAL_STRONG')) residualStrong = pct;
  }

  let rebate = 0;
  for (let amount = 0; amount <= 2000; amount++) {
    const result = evaluateDeal({ dealType: 'finance', rebates: amount });
    if (result.adjustments.some(item => item.id === 'REBATES')) {
      rebate = amount;
      break;
    }
  }

  cachedCutoffs = {
    strong,
    high,
    veryHigh,
    priceAtMsrp,
    priceScored,
    priceGood,
    docFee,
    docFeeSteep,
    termLong,
    termVeryLong,
    interestPercent,
    acqFee: maxClear('FLAG_ACQ_FEE_HIGH', 'acquisitionFee', 3000),
    gap: maxClear('FLAG_GAP_HIGH', 'gapInsurance', 2000),
    gapSteep: maxClear('FLAG_GAP_VERY_HIGH', 'gapInsurance', 2000),
    warranty: maxClear('FLAG_WARRANTY_HIGH', 'extendedWarranty', 5000),
    tire: maxClear('FLAG_TIRE_HIGH', 'tireWheel', 2000),
    paint,
    residualLow,
    residualSoft,
    residualStrong,
    rebate,
  };
  return cachedCutoffs;
}

export function aprGradeCutoffs(): AprGradeCutoffs {
  const cuts = gradeCutoffs();
  return { strong: cuts.strong, high: cuts.high, veryHigh: cuts.veryHigh };
}

/**
 * Member-facing description of the APR rules.
 * The band above the strong cutoff and up to the high flag is APR_TYPICAL:
 * a smaller score, not a flag, and not the strong-rate credit.
 */
export function aprGradeExplanation(): string {
  const cuts = aprGradeCutoffs();
  const strong = formatCut(cuts.strong);
  const high = formatCut(cuts.high);
  const veryHigh = formatCut(cuts.veryHigh);
  return `A finance APR is scored the same way for every member. This tool does not read a credit tier. An APR at or under ${strong}% gets the stronger score. An APR above ${strong}% and up to ${high}% gets a smaller score. It does not earn the strong-rate credit, and it is not flagged. An APR above ${high}% is flagged, and an APR above ${veryHigh}% is flagged further. These are fixed grading cutoffs, not a market rate and not an offer of credit.`;
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
 * No tenant stores that rate today. The argument stays for when one does.
 * Term and total interest share one question so the two lines do not repeat.
 */
const INTEREST_QUESTION = 'Can you show me total interest at this term and at a shorter term?';

const HURT_QUESTION: Record<string, string> = {
  'Price versus MSRP': 'Can you show me this price against MSRP in writing?',
  APR: 'What APR can you offer if I bring my own financing?',
  'Money factor': 'Is this the base money factor, and what does the difference cost?',
  Term: INTEREST_QUESTION,
  'Documentation fee': 'Can you itemize this documentation fee and reduce it?',
  'Monthly payment': 'Which taxes, fees, or products are in this payment?',
  'Total interest': INTEREST_QUESTION,
  Residual: 'What residual in dollars and as a percent of MSRP are you using?',
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
  /** Second line. Numbers come from the engine, read at runtime. */
  why: string;
  /** 0 bad, 1 warn, 2 helped. */
  rank: number;
}

interface Classified {
  tone: 'helped' | 'hurt';
  why: string;
  versus?: string;
  rank: number;
}

function figureOf(value: string): string {
  return value.split(' (')[0].trim();
}

function moneyAmounts(text: string): number[] {
  return [...text.matchAll(/\$[\d,]+(?:\.\d+)?/g)].map(match => Number(match[0].replace(/[$,]/g, '')));
}

function firstMoney(text: string): number | null {
  const amounts = moneyAmounts(text);
  return amounts.length > 0 ? amounts[0] : null;
}

function dollarGap(row: ReportRow): string | null {
  const amounts = moneyAmounts(row.explanation);
  if (amounts.length < 2) return null;
  const gap = Math.abs(amounts[0] - amounts[1]);
  if (gap < 1) return null;
  return formatMoney(gap);
}

function hurt(why: string, versus?: string, rank: number = 0): Classified {
  return { tone: 'hurt', why, versus, rank };
}

function helped(why: string, versus?: string): Classified {
  return { tone: 'helped', why, versus, rank: 2 };
}

function classifyPrice(row: ReportRow, cuts: GradeCutoffs): Classified | null {
  const over = row.value.match(/(\d+(?:\.\d+)?)%\s+over MSRP/);
  const under = row.value.match(/(\d+(?:\.\d+)?)%\s+under MSRP/);
  if (over) {
    const gap = dollarGap(row);
    return hurt(gap ? `${gap} over MSRP` : 'above MSRP', 'MSRP', row.status === 'bad' ? 0 : 1);
  }
  if (under) {
    const discount = Number(under[1]);
    if (discount < cuts.priceScored) return null;
    const gap = dollarGap(row);
    return helped(gap ? `${gap} under MSRP` : 'under MSRP', 'MSRP');
  }
  if (row.status === 'good') return null;
  return hurt(`discount under ${formatCut(cuts.priceAtMsrp)}% of MSRP`, 'MSRP', 1);
}

function classifyApr(row: ReportRow, cuts: GradeCutoffs): Classified | null {
  const match = row.value.match(/(\d+(?:\.\d+)?)%/);
  if (!match) return null;
  const apr = Number(match[1]);
  if (apr > cuts.veryHigh) return hurt(`above this tool's ${formatCut(cuts.veryHigh)}% cutoff`, undefined, 0);
  if (apr > cuts.high) return hurt(`above this tool's ${formatCut(cuts.high)}% cutoff`, undefined, 0);
  if (apr > 0 && apr <= cuts.strong) return helped(`at or under this tool's ${formatCut(cuts.strong)}% cutoff`);
  if (apr <= cuts.high) return helped('does not earn the strong-rate credit');
  return null;
}

function classifyFee(amount: number | null, line: number, steep: number | null, status: ReportRow['status']): Classified | null {
  if (amount === null) return null;
  if (steep !== null && amount > steep) return hurt(feeLine(steep), undefined, status === 'bad' ? 0 : 1);
  if (amount > line) return hurt(feeLine(line), undefined, status === 'bad' ? 0 : 1);
  return null;
}

function classify(row: ReportRow): Classified | null {
  const cuts = gradeCutoffs();
  switch (row.label) {
    case 'Price versus MSRP':
      return classifyPrice(row, cuts);
    case 'APR':
      return classifyApr(row, cuts);
    case 'Money factor':
      if (/No base money factor was entered/.test(row.explanation)) return null;
      if (row.status === 'good') return helped('at or below the base money factor', 'base money factor');
      return hurt('above the base money factor', 'base money factor', row.status === 'bad' ? 0 : 1);
    case 'Term':
      if (/does not grade lease term/.test(row.explanation)) return null;
      {
        const months = Number(row.value.match(/(\d+)/)?.[1]);
        if (!Number.isFinite(months)) return null;
        if (months >= cuts.termVeryLong) return hurt(`longer than ${cuts.termVeryLong} months`, undefined, 0);
        if (months >= cuts.termLong) return hurt(`longer than ${cuts.termLong} months`, undefined, 1);
        return null;
      }
    case 'Documentation fee':
      return classifyFee(firstMoney(row.value), cuts.docFee, cuts.docFeeSteep, row.status);
    case 'Monthly payment': {
      if (row.status === 'good') return null;
      const amounts = moneyAmounts(row.explanation);
      if (amounts.length < 2) return null;
      const quoted = amounts[0];
      const calculated = amounts[1];
      const gap = formatMoney(Math.abs(quoted - calculated));
      const direction = quoted >= calculated ? 'more' : 'less';
      return hurt(`${gap} ${direction} than the calculated payment`, undefined, 1);
    }
    case 'Total interest':
      if (row.status !== 'bad') return null;
      return hurt(`more than ${cuts.interestPercent}% of the vehicle price`, undefined, 0);
    case 'Residual': {
      const pct = Number(row.value.match(/(\d+(?:\.\d+)?)/)?.[1]);
      if (!Number.isFinite(pct)) return null;
      if (pct < cuts.residualLow) return hurt(`residual under ${formatCut(cuts.residualLow)}% of MSRP`, undefined, 0);
      if (pct < cuts.residualSoft) return hurt(`residual under ${formatCut(cuts.residualSoft)}% of MSRP`, undefined, 1);
      if (pct >= cuts.residualStrong) return helped(`at or over this tool's ${formatCut(cuts.residualStrong)}% residual line`);
      return helped(`at or over this tool's ${formatCut(cuts.residualSoft)}% residual line`);
    }
    case 'Acquisition fee':
      return classifyFee(firstMoney(row.value), cuts.acqFee, null, row.status);
    case 'Cap cost reduction':
      return hurt('upfront money on this lease', undefined, 1);
    case 'Cash down payment':
      return null;
    case 'Trade-in':
      if (row.status === 'good') return null;
      return hurt('payoff is higher than the offer', 'payoff', row.status === 'bad' ? 0 : 1);
    case 'GAP product':
      return classifyFee(firstMoney(row.value), cuts.gap, cuts.gapSteep, row.status);
    case 'Service contract':
      return classifyFee(firstMoney(row.value), cuts.warranty, null, row.status);
    case 'Tire and wheel product':
      return classifyFee(firstMoney(row.value), cuts.tire, null, row.status);
    case 'Appearance product': {
      const amount = firstMoney(row.value);
      if (amount !== null && amount >= cuts.paint) return hurt(feeLine(cuts.paint), undefined, row.status === 'bad' ? 0 : 1);
      return hurt('appearance product on this offer', undefined, 1);
    }
    case 'Rebates': {
      const amount = firstMoney(row.value);
      if (amount !== null && amount >= cuts.rebate) return helped(`at or over the ${formatMoney(cuts.rebate)} line this tool uses`);
      return null;
    }
    default:
      return null;
  }
}

const BANNED_DETAIL = /\b(typical|average|benchmarks?|assumptions?|market)\b|often[-\s]cited|6\s*[–-]\s*8\s*%/i;

/** Drop engine sentences that talk about a typical band, a cited range, or a benchmark. */
export function filterDetailSentences(text: string): string {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(part => part.trim())
    .filter(part => part.length > 0 && !BANNED_DETAIL.test(part))
    .join(' ');
}

/** What See details shows for one row. APR uses the same line as the readout row. */
export function detailExplanation(row: ReportRow): string {
  if (row.label === 'APR') return classify(row)?.why ?? '';
  return filterDetailSentences(row.explanation);
}

/** Full details copy, on screen and in print. Engine disclaimers are not included. */
export function renderedDetailsText(report: Pick<TenantReport, 'breakdown' | 'tradeIn' | 'stateTaxNote'>): string {
  const lines: string[] = [];
  for (const row of report.breakdown) {
    const explanation = detailExplanation(row);
    lines.push([row.label, row.value, explanation].filter(Boolean).join('\n'));
  }
  if (report.tradeIn) {
    lines.push(report.tradeIn.headline);
    const details = filterDetailSentences(report.tradeIn.details);
    if (details) lines.push(details);
  }
  if (report.stateTaxNote) {
    const note = filterDetailSentences(report.stateTaxNote);
    if (note) lines.push(note);
  }
  return lines.join('\n');
}

/** Printed loan link: absolute, with attribution parameters removed. */
export function loanUrlForPrint(url: string, origin: string): string {
  try {
    const u = new URL(url, origin || 'https://signorwalk.com');
    for (const key of [...u.searchParams.keys()]) {
      if (key.toLowerCase().startsWith('utm_')) u.searchParams.delete(key);
    }
    if (!origin && url.startsWith('/')) return `${u.pathname}${u.search}`;
    return u.toString();
  } catch {
    return url;
  }
}

function toReadout(row: ReportRow, index: number): (ReadoutRow & { index: number }) | null {
  const scored = classify(row);
  if (!scored) return null;
  return {
    label: SHORT_LABEL[row.label] ?? row.label,
    figure: figureOf(row.value),
    tone: scored.tone,
    versus: scored.versus,
    why: scored.why,
    rank: scored.rank,
    index,
  };
}

function scoredRows(report: Pick<TenantReport, 'breakdown'>): ReadoutRow[] {
  return report.breakdown
    .map((row, index) => toReadout(row, index))
    .filter((row): row is ReadoutRow & { index: number } => row !== null)
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ index: _index, ...row }) => row);
}

/** At most five rows the engine actually scored. */
export function readoutRows(report: Pick<TenantReport, 'breakdown'>): ReadoutRow[] {
  return scoredRows(report).slice(0, 5);
}

function hurtPhrase(row: ReadoutRow): string {
  if (row.label === 'Price') return row.why;
  if (row.label === 'APR') return `${row.figure} APR`;
  if (row.figure.startsWith('$')) return `${row.figure} ${row.label}`;
  return row.label;
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
  const hurts = scoredRows(report).filter(row => row.tone === 'hurt');
  if (hurts.length === 0) return sentence(`${quality} deal on the figures you entered`);
  if (hurts.length === 1) {
    const item = hurtPhrase(hurts[0]);
    const line = quality === 'Weak'
      ? `Weak deal: ask about the ${item}`
      : `${quality} deal overall, but ask about the ${item}`;
    if (words(line).length <= 16) return sentence(line);
    return sentence(quality === 'Weak' ? `Weak deal: ask about the ${hurts[0].label}` : `${quality} deal with 1 thing to ask about`);
  }
  const top = hurts[0].label;
  const more = hurts.length - 1;
  const extra = more === 1 ? '1 more thing' : `${more} more things`;
  if (quality === 'Weak') return sentence(`Weak deal: ask about the ${top} and ${extra}`);
  if (more === 1) return sentence(`${quality} deal, but ask about the ${top} and ${extra}`);
  return sentence(`${quality} deal, ask about the ${top} and ${extra}`);
}

export function figuresEntered(report: Pick<TenantReport, 'breakdown'>): number {
  return report.breakdown.filter(row => row.label !== 'Total interest').length;
}

export function dealerQuestions(
  report: Pick<TenantReport, 'breakdown'>,
  creditUnionApr?: number,
): string[] {
  const hurts = report.breakdown.filter(row => classify(row)?.tone === 'hurt');
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
