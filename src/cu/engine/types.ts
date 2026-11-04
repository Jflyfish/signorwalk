export const GRADES = ['A', 'B', 'C', 'D', 'F'] as const;
export type Grade = (typeof GRADES)[number];

export const RECOMMENDATIONS = ['sign', 'negotiate', 'walk'] as const;
export type Recommendation = (typeof RECOMMENDATIONS)[number];

export const ARCHETYPES = [
  'LEASE_CLEAN',
  'LEASE_STANDARD',
  'LEASE_MF_MARKUP',
  'LEASE_LOW_RESIDUAL',
  'LEASE_HIGH_FEES',
  'LEASE_ADDONS',
  'LEASE_NEG_EQUITY',
  'FIN_CLEAN',
  'FIN_STANDARD',
  'FIN_HIGH_APR',
  'FIN_LONG_TERM',
  'FIN_NEG_EQUITY',
  'FIN_ADDONS',
  'FIN_HIGH_FEES',
] as const;
export type Archetype = (typeof ARCHETYPES)[number];

export const FLAG_IDS = [
  'FLAG_DOC_FEE_HIGH',
  'FLAG_DOC_FEE_VERY_HIGH',
  'FLAG_APR_HIGH',
  'FLAG_APR_VERY_HIGH',
  'FLAG_TERM_LONG',
  'FLAG_TERM_VERY_LONG',
  'FLAG_NEGATIVE_EQUITY',
  'FLAG_MF_MARKUP',
  'FLAG_MF_MARKUP_SMALL',
  'FLAG_ACQ_FEE_HIGH',
  'FLAG_LOW_RESIDUAL',
  'FLAG_RESIDUAL_SOFT',
  'FLAG_LEASE_CAP_REDUCTION',
  'FLAG_PRICE_ABOVE_MSRP',
  'FLAG_PRICE_AT_MSRP',
  'FLAG_GAP_HIGH',
  'FLAG_GAP_VERY_HIGH',
  'FLAG_WARRANTY_HIGH',
  'FLAG_TIRE_HIGH',
  'FLAG_PAINT_PRESENT',
  'FLAG_PAINT_HIGH',
  'FLAG_INTEREST_HIGH',
  'FLAG_PAYMENT_MISMATCH',
] as const;
export type FlagId = (typeof FLAG_IDS)[number];

export type Severity = 'warn' | 'bad';

export interface Flag {
  id: FlagId;
  severity: Severity;
}

export interface EngineInput {
  dealType: 'lease' | 'finance';
  state?: string;
  msrp?: number;
  sellingPrice?: number;
  rebates?: number;
  moneyFactor?: number;
  buyRateMoneyFactor?: number;
  residualPercent?: number;
  residualDollar?: number;
  termMonths?: number;
  monthlyPayment?: number;
  downPayment?: number;
  acquisitionFee?: number;
  docFee?: number;
  apr?: number;
  amountFinanced?: number;
  tradeDealerOffer?: number;
  tradePayoff?: number;
  extendedWarranty?: number;
  gapInsurance?: number;
  tireWheel?: number;
  paintInterior?: number;
}

export interface EngineCalcs {
  discountPct?: number;
  mfApr?: number;
  buyRateApr?: number;
  residualPercent?: number;
  netTrade?: number;
  loanAmount?: number;
  calculatedPayment?: number;
  totalInterest?: number;
  paymentGap?: number;
}

export interface EngineResult {
  grade: Grade;
  score: number;
  recommendation: Recommendation;
  archetype: Archetype;
  flags: Flag[];
  limitedData: boolean;
  calc: EngineCalcs;
  adjustments: { id: string; delta: number }[];
}

export interface ReportRow {
  label: string;
  value: string;
  status: 'good' | 'warn' | 'bad';
  explanation: string;
}

export interface TenantReport {
  grade: Grade;
  recommendation: Recommendation;
  recommendationLabel: string;
  headline: string;
  gradeExplanation: string;
  summary: string;
  archetype: Archetype;
  breakdown: ReportRow[];
  itemsToReview: { id: FlagId; issue: string; action: string }[];
  /** Shown when no flag fired but the grade is still short of A. Not logged as flags. */
  notes: { id: string; issue: string; action: string }[];
  questionsToAsk: string;
  tradeIn: { assessment: 'good' | 'warn' | 'bad'; headline: string; details: string } | null;
  stateTaxNote: string | null;
  structureNote: string;
  disclaimers: string[];
  templatePackVersion: 'tp-1.0.0';
  limitedData: boolean;
}
