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
 * On-screen lines next to the grade and the pre-approval button.
 * Draft wording. Counsel for the credit union has not reviewed these sentences.
 */
export const GRADE_DISCLAIMER_NOT_AN_OFFER = 'This is not a loan offer.';
export const GRADE_DISCLAIMER_EDUCATIONAL = 'This grade is educational.';
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

/** One sentence, 14 words or fewer, from the headline or the recommendation label. */
export function verdictSentence(
  report: Pick<TenantReport, 'headline' | 'recommendation' | 'recommendationLabel' | 'grade' | 'notes'>,
  aprBlank: boolean,
): string {
  const provisional = financeGradeIsProvisional(report, aprBlank);
  if (report.recommendation === 'sign' && (aprBlank || provisional)) {
    return sentence(ADD_APR_RECOMMENDATION);
  }
  const headline = sentence(report.headline);
  if (headline && words(headline).length <= 14) return headline;
  if (report.recommendation !== 'sign') {
    const label = sentence(report.recommendationLabel);
    if (label && words(label).length <= 14) return label;
  }
  return sentence(words(report.headline).slice(0, 14).join(' '));
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

/** Flags whose filled action can be asked for this breakdown row. */
const ROW_FLAGS: Record<string, readonly FlagId[]> = {
  'Price versus MSRP': ['FLAG_PRICE_ABOVE_MSRP', 'FLAG_PRICE_AT_MSRP'],
  APR: ['FLAG_APR_VERY_HIGH', 'FLAG_APR_HIGH'],
  'Money factor': ['FLAG_MF_MARKUP', 'FLAG_MF_MARKUP_SMALL'],
  Term: ['FLAG_TERM_VERY_LONG', 'FLAG_TERM_LONG'],
  'Documentation fee': ['FLAG_DOC_FEE_VERY_HIGH', 'FLAG_DOC_FEE_HIGH'],
  'Monthly payment': ['FLAG_PAYMENT_MISMATCH'],
  'Total interest': ['FLAG_INTEREST_HIGH'],
  Residual: ['FLAG_LOW_RESIDUAL', 'FLAG_RESIDUAL_SOFT'],
  'Acquisition fee': ['FLAG_ACQ_FEE_HIGH'],
  'Cap cost reduction': ['FLAG_LEASE_CAP_REDUCTION'],
  'Trade-in': ['FLAG_NEGATIVE_EQUITY'],
  'GAP product': ['FLAG_GAP_VERY_HIGH', 'FLAG_GAP_HIGH'],
  'Service contract': ['FLAG_WARRANTY_HIGH'],
  'Tire and wheel product': ['FLAG_TIRE_HIGH'],
  'Appearance product': ['FLAG_PAINT_HIGH', 'FLAG_PAINT_PRESENT'],
};

/**
 * Used when a hurt row has no flag action.
 * Wording follows the template-pack actions. No market, average, or typical comparison.
 */
const HURT_QUESTION: Record<string, string> = {
  'Price versus MSRP': 'Can you show this price against MSRP and put any change in writing?',
  APR: 'Can you show this APR in writing?',
  'Money factor': 'Is this money factor the base rate, and what does any difference pay for?',
  Term: 'Can you show total interest at this term and at a shorter term?',
  'Documentation fee': 'Can you itemize the documentation fee, and can it be reduced?',
  'Monthly payment': 'Which taxes, fees, or products make up the quoted payment?',
  'Total interest': 'Can you show total interest at this rate and term, and at a shorter term?',
  Residual: 'What is the residual in dollars and as a percent of MSRP, and which mileage limit was used?',
  'Acquisition fee': 'Can you show the acquisition fee as its own line?',
  'Cap cost reduction': 'What would the payment be with a smaller cap cost reduction?',
  'Trade-in': 'Can you show the trade offer, the payoff, and any amount added to the financing on separate lines?',
  'GAP product': 'What would the payment be without the GAP product?',
  'Service contract': 'What does the service contract cover, and what would the payment be without it?',
  'Tire and wheel product': 'What does the tire and wheel product cover, and what would the payment be without it?',
  'Appearance product': 'What does the appearance product cover, and what would the payment be without it?',
};

export interface ReadoutRow {
  label: string;
  figure: string;
  tone: 'helped' | 'hurt';
  /** Concrete reference only, such as MSRP. The screen prints "vs {versus}". */
  versus?: string;
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
    }));
}

export function figuresEntered(report: Pick<TenantReport, 'breakdown'>): number {
  return report.breakdown.filter(row => row.label !== 'Total interest').length;
}

export function dealerQuestions(report: Pick<TenantReport, 'breakdown' | 'itemsToReview'>): string[] {
  const hurts = report.breakdown.filter(row => row.status !== 'good');
  const seen = new Set<string>();
  const questions: string[] = [];
  for (const row of hurts) {
    const flags = ROW_FLAGS[row.label] ?? [];
    const fromFlag = report.itemsToReview.find(item => flags.includes(item.id));
    const text = (fromFlag?.action ?? HURT_QUESTION[row.label] ?? '').trim();
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
