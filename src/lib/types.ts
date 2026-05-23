export type DealType = 'lease' | 'finance';

export interface LeaseFormData {
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleTrim: string;
  msrp: string;
  sellingPrice: string;
  rebates: string;
  moneyFactor: string;
  residualPercent: string;
  residualDollar: string;
  leaseTerm: string;
  monthlyPayment: string;
  driveOff: string;
  capCostReduction: string;
  acquisitionFee: string;
  dispositionFee: string;
  milesPerYear: string;
  docFee: string;
}

export interface FinanceFormData {
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleTrim: string;
  msrp: string;
  negotiatedPrice: string;
  rebates: string;
  downPayment: string;
  amountFinanced: string;
  apr: string;
  loanTerm: string;
  monthlyPayment: string;
  outTheDoorPrice: string;
  docFee: string;
  vehicleMileage: string;
}

export interface TradeInData {
  year: string;
  make: string;
  model: string;
  mileage: string;
  condition: string;
  dealerOffer: string;
  payoffAmount: string;
  kbbEstimate: string;
  knownIssues: string;
}

export interface BundledCosts {
  extendedWarranty: string;
  gapInsurance: string;
  tireWheelProtection: string;
  paintInteriorProtection: string;
  otherLabel: string;
  otherAmount: string;
}

export interface AnalysisRequest {
  dealType: DealType;
  state?: string;
  lease?: LeaseFormData;
  finance?: FinanceFormData;
  tradeIn?: TradeInData;
  bundledCosts?: BundledCosts;
  paymentGap?: number;
  paymentRange?: { low: string; high: string };
  notes?: string;
}

export interface BreakdownRow {
  label: string;
  value: string;
  status: 'good' | 'warn' | 'bad';
  explanation: string;
}

export interface RedFlag {
  issue: string;
  fix: string;
}

export interface AnalysisResult {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  headline: string;
  gradeExplanation: string;
  summary: string;
  recommendation: 'sign' | 'negotiate' | 'walk';
  leaseVsBuy: {
    recommendation: 'lease' | 'buy';
    reasoning: string;
  };
  breakdown: BreakdownRow[];
  tradeIn: {
    assessment: 'good' | 'warn' | 'bad';
    headline: string;
    details: string;
  } | null;
  stateTaxCredit: {
    hasCredit: boolean;
    details: string;
  };
  redFlags: RedFlag[];
  teaserHint: string;
  counterOfferScript: string;
  paymentGapExplanation?: string;
}
