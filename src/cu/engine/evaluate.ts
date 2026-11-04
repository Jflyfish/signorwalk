import { discountPercent, financePayment, moneyFactorToApr, round2 } from './math';
import type { Archetype, EngineCalcs, EngineInput, EngineResult, Flag, FlagId, Grade, Recommendation, Severity } from './types';

const BASE_SCORE = 82;

const FLAG_DELTA: Record<FlagId, number> = {
  FLAG_DOC_FEE_HIGH: -6,
  FLAG_DOC_FEE_VERY_HIGH: -14,
  FLAG_APR_HIGH: -14,
  FLAG_APR_VERY_HIGH: -34,
  FLAG_TERM_LONG: -8,
  FLAG_TERM_VERY_LONG: -18,
  FLAG_NEGATIVE_EQUITY: -24,
  FLAG_MF_MARKUP: -20,
  FLAG_MF_MARKUP_SMALL: -6,
  FLAG_ACQ_FEE_HIGH: -6,
  FLAG_LOW_RESIDUAL: -16,
  FLAG_RESIDUAL_SOFT: -6,
  FLAG_LEASE_CAP_REDUCTION: -6,
  FLAG_PRICE_ABOVE_MSRP: -16,
  FLAG_PRICE_AT_MSRP: -6,
  FLAG_GAP_HIGH: -12,
  FLAG_GAP_VERY_HIGH: -18,
  FLAG_WARRANTY_HIGH: -8,
  FLAG_TIRE_HIGH: -6,
  FLAG_PAINT_PRESENT: -4,
  FLAG_PAINT_HIGH: -12,
  FLAG_INTEREST_HIGH: -12,
  FLAG_PAYMENT_MISMATCH: -6,
};

const FLAG_SEVERITY: Record<FlagId, Severity> = {
  FLAG_DOC_FEE_HIGH: 'warn',
  FLAG_DOC_FEE_VERY_HIGH: 'bad',
  FLAG_APR_HIGH: 'bad',
  FLAG_APR_VERY_HIGH: 'bad',
  FLAG_TERM_LONG: 'warn',
  FLAG_TERM_VERY_LONG: 'bad',
  FLAG_NEGATIVE_EQUITY: 'bad',
  FLAG_MF_MARKUP: 'bad',
  FLAG_MF_MARKUP_SMALL: 'warn',
  FLAG_ACQ_FEE_HIGH: 'warn',
  FLAG_LOW_RESIDUAL: 'bad',
  FLAG_RESIDUAL_SOFT: 'warn',
  FLAG_LEASE_CAP_REDUCTION: 'warn',
  FLAG_PRICE_ABOVE_MSRP: 'bad',
  FLAG_PRICE_AT_MSRP: 'warn',
  FLAG_GAP_HIGH: 'bad',
  FLAG_GAP_VERY_HIGH: 'bad',
  FLAG_WARRANTY_HIGH: 'warn',
  FLAG_TIRE_HIGH: 'warn',
  FLAG_PAINT_PRESENT: 'warn',
  FLAG_PAINT_HIGH: 'bad',
  FLAG_INTEREST_HIGH: 'bad',
  FLAG_PAYMENT_MISMATCH: 'warn',
};

function flag(id: FlagId): Flag {
  return { id, severity: FLAG_SEVERITY[id] };
}

function has(flags: Flag[], id: FlagId): boolean {
  return flags.some(f => f.id === id);
}

function gradeFromScore(score: number): Grade {
  if (score >= 96) return 'A';
  if (score >= 80) return 'B';
  if (score >= 64) return 'C';
  if (score >= 46) return 'D';
  return 'F';
}

function capGrade(grade: Grade, badCount: number, flagCount: number, limitedData: boolean): Grade {
  const order: Grade[] = ['A', 'B', 'C', 'D', 'F'];
  let cap: Grade = 'A';
  if (badCount >= 3) cap = 'D';
  else if (badCount >= 2) cap = 'C';
  else if (badCount >= 1 || flagCount >= 1) cap = 'B';
  if (limitedData && order.indexOf(cap) < order.indexOf('B')) cap = 'B';
  const gi = order.indexOf(grade);
  const ci = order.indexOf(cap);
  return gi < ci ? cap : grade;
}

function recommendationFor(grade: Grade, flags: Flag[]): Recommendation {
  if (grade === 'F') return 'walk';
  if (grade === 'A') return 'sign';
  if (grade === 'B' && flags.length === 0) return 'sign';
  return 'negotiate';
}

function archetypeFor(input: EngineInput, flags: Flag[]): Archetype {
  const lease = input.dealType === 'lease';
  if (has(flags, 'FLAG_NEGATIVE_EQUITY')) return lease ? 'LEASE_NEG_EQUITY' : 'FIN_NEG_EQUITY';
  if (has(flags, 'FLAG_APR_VERY_HIGH') || has(flags, 'FLAG_APR_HIGH')) return 'FIN_HIGH_APR';
  if (has(flags, 'FLAG_TERM_VERY_LONG') || has(flags, 'FLAG_TERM_LONG')) return 'FIN_LONG_TERM';
  if (has(flags, 'FLAG_MF_MARKUP') || has(flags, 'FLAG_MF_MARKUP_SMALL')) return 'LEASE_MF_MARKUP';
  if (has(flags, 'FLAG_LOW_RESIDUAL') || has(flags, 'FLAG_RESIDUAL_SOFT')) return 'LEASE_LOW_RESIDUAL';
  const addon = ['FLAG_GAP_HIGH', 'FLAG_GAP_VERY_HIGH', 'FLAG_WARRANTY_HIGH', 'FLAG_TIRE_HIGH', 'FLAG_PAINT_PRESENT', 'FLAG_PAINT_HIGH'] as const;
  if (addon.some(id => has(flags, id))) return lease ? 'LEASE_ADDONS' : 'FIN_ADDONS';
  if (has(flags, 'FLAG_DOC_FEE_HIGH') || has(flags, 'FLAG_DOC_FEE_VERY_HIGH') || has(flags, 'FLAG_ACQ_FEE_HIGH')) {
    return lease ? 'LEASE_HIGH_FEES' : 'FIN_HIGH_FEES';
  }
  if (flags.length === 0) return lease ? 'LEASE_CLEAN' : 'FIN_CLEAN';
  return lease ? 'LEASE_STANDARD' : 'FIN_STANDARD';
}

function countSignals(input: EngineInput): number {
  const present = [
    input.sellingPrice,
    input.msrp,
    input.apr,
    input.moneyFactor,
    input.termMonths,
    input.monthlyPayment,
    input.docFee,
    input.downPayment,
    input.residualPercent,
    input.amountFinanced,
  ];
  return present.filter(v => v !== undefined && v > 0).length;
}

export function evaluateDeal(input: EngineInput): EngineResult {
  const flags: Flag[] = [];
  const adjustments: { id: string; delta: number }[] = [];
  const calc: EngineCalcs = {};

  const price = input.sellingPrice;
  const msrp = input.msrp;
  if (price !== undefined && msrp !== undefined && msrp > 0) {
    const discount = discountPercent(msrp, price);
    calc.discountPct = round2(discount);
    if (price > msrp * 1.005) flags.push(flag('FLAG_PRICE_ABOVE_MSRP'));
    else if (discount < 1) flags.push(flag('FLAG_PRICE_AT_MSRP'));
    else if (discount >= 8) adjustments.push({ id: 'DISCOUNT_STRONG', delta: 12 });
    else if (discount >= 6) adjustments.push({ id: 'DISCOUNT_GOOD', delta: 8 });
    else if (discount >= 3) adjustments.push({ id: 'DISCOUNT_AVG', delta: 4 });
  }

  if (input.dealType === 'finance' && input.apr !== undefined) {
    if (input.apr > 10) flags.push(flag('FLAG_APR_VERY_HIGH'));
    else if (input.apr > 8) flags.push(flag('FLAG_APR_HIGH'));
    else if (input.apr > 0 && input.apr <= 6) adjustments.push({ id: 'APR_STRONG', delta: 10 });
    else if (input.apr <= 8) adjustments.push({ id: 'APR_TYPICAL', delta: 3 });
  }

  if (input.dealType === 'finance' && input.termMonths !== undefined) {
    if (input.termMonths >= 84) flags.push(flag('FLAG_TERM_VERY_LONG'));
    else if (input.termMonths >= 72) flags.push(flag('FLAG_TERM_LONG'));
  }

  if (input.dealType === 'lease' && input.moneyFactor !== undefined && input.moneyFactor > 0) {
    calc.mfApr = round2(moneyFactorToApr(input.moneyFactor));
    if (input.buyRateMoneyFactor !== undefined && input.buyRateMoneyFactor > 0) {
      calc.buyRateApr = round2(moneyFactorToApr(input.buyRateMoneyFactor));
      const diff = input.moneyFactor - input.buyRateMoneyFactor;
      if (diff > 0.0003) flags.push(flag('FLAG_MF_MARKUP'));
      else if (diff > 0.0001) flags.push(flag('FLAG_MF_MARKUP_SMALL'));
      else adjustments.push({ id: 'MF_AT_OR_BELOW_BUY', delta: 4 });
    }
  }

  let residualPct = input.residualPercent;
  if ((residualPct === undefined || residualPct === 0) && input.residualDollar && msrp && msrp > 0) {
    residualPct = (input.residualDollar / msrp) * 100;
  }
  if (input.dealType === 'lease' && residualPct !== undefined && residualPct > 0) {
    calc.residualPercent = round2(residualPct);
    if (residualPct < 45) flags.push(flag('FLAG_LOW_RESIDUAL'));
    else if (residualPct < 50) flags.push(flag('FLAG_RESIDUAL_SOFT'));
    else if (residualPct >= 55) adjustments.push({ id: 'RESIDUAL_STRONG', delta: 10 });
    else adjustments.push({ id: 'RESIDUAL_GOOD', delta: 4 });
  }

  if (input.docFee !== undefined) {
    if (input.docFee > 800) flags.push(flag('FLAG_DOC_FEE_VERY_HIGH'));
    else if (input.docFee > 500) flags.push(flag('FLAG_DOC_FEE_HIGH'));
  }

  if (input.dealType === 'lease' && input.acquisitionFee !== undefined && input.acquisitionFee > 1000) {
    flags.push(flag('FLAG_ACQ_FEE_HIGH'));
  }

  if (input.dealType === 'lease' && input.downPayment !== undefined && input.downPayment > 0) {
    flags.push(flag('FLAG_LEASE_CAP_REDUCTION'));
  }

  if (input.tradeDealerOffer !== undefined || input.tradePayoff !== undefined) {
    const net = (input.tradeDealerOffer ?? 0) - (input.tradePayoff ?? 0);
    calc.netTrade = round2(net);
    if (net < -1) flags.push(flag('FLAG_NEGATIVE_EQUITY'));
  }

  if (input.gapInsurance !== undefined && input.gapInsurance > 0) {
    if (input.gapInsurance > 900) flags.push(flag('FLAG_GAP_VERY_HIGH'));
    else if (input.gapInsurance > 400) flags.push(flag('FLAG_GAP_HIGH'));
  }
  if (input.extendedWarranty !== undefined && input.extendedWarranty > 2500) flags.push(flag('FLAG_WARRANTY_HIGH'));
  if (input.tireWheel !== undefined && input.tireWheel > 400) flags.push(flag('FLAG_TIRE_HIGH'));
  if (input.paintInterior !== undefined && input.paintInterior > 0) {
    flags.push(flag(input.paintInterior >= 500 ? 'FLAG_PAINT_HIGH' : 'FLAG_PAINT_PRESENT'));
  }

  if (input.rebates !== undefined && input.rebates >= 500) adjustments.push({ id: 'REBATES', delta: 2 });

  if (input.dealType === 'finance' && price !== undefined && price > 0 && input.apr !== undefined && input.termMonths !== undefined && input.termMonths > 0) {
    const netTrade = calc.netTrade ?? 0;
    const down = input.downPayment ?? 0;
    const doc = input.docFee ?? 0;
    const loan = input.amountFinanced && input.amountFinanced > 0
      ? input.amountFinanced
      : Math.max(price - down - netTrade + doc, 0);
    calc.loanAmount = round2(loan);
    const payment = financePayment(loan, input.apr, input.termMonths);
    calc.calculatedPayment = round2(payment);
    const interest = Math.max(payment * input.termMonths - loan, 0);
    calc.totalInterest = round2(interest);
    if (interest > price * 0.2) flags.push(flag('FLAG_INTEREST_HIGH'));
    if (input.monthlyPayment !== undefined && input.monthlyPayment > 0 && Math.abs(input.monthlyPayment - payment) > 50) {
      calc.paymentGap = round2(input.monthlyPayment - payment);
      flags.push(flag('FLAG_PAYMENT_MISMATCH'));
    }
  }

  const severityRank: Record<Severity, number> = { bad: 0, warn: 1 };
  flags.sort((a, b) => severityRank[a.severity] - severityRank[b.severity] || a.id.localeCompare(b.id));

  for (const f of flags) adjustments.push({ id: f.id, delta: FLAG_DELTA[f.id] });

  const limitedData = countSignals(input) < 3;
  const raw = BASE_SCORE + adjustments.reduce((sum, a) => sum + a.delta, 0);
  const score = Math.max(0, Math.min(100, raw));
  const badCount = flags.filter(f => f.severity === 'bad').length;
  const grade = capGrade(gradeFromScore(score), badCount, flags.length, limitedData);

  return {
    grade,
    score,
    recommendation: recommendationFor(grade, flags),
    archetype: archetypeFor(input, flags),
    flags,
    limitedData,
    calc,
    adjustments,
  };
}
