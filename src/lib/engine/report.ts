import { STATE_TAX_DATA } from '@/lib/stateTaxData';
import { US_STATES } from '@/lib/states';
import {
  BREAKDOWN,
  DISCLAIMERS,
  FLAG_COPY,
  GRADE_EXPLANATIONS,
  HEADLINES,
  QUESTIONS,
  RECOMMENDATION_LABELS,
  STRUCTURE_NOTES,
  SUMMARIES,
  TAX,
  TEMPLATE_PACK_VERSION,
  TRADE,
  type Slot,
  type Template,
} from '@/templates/tp-1.0.0/en';
import { renderTemplate } from '@/templates/tp-1.0.0/render';
import { evaluateDeal } from './evaluate';
import { formatMf, formatMoney, formatPct } from './math';
import { normalizeDeal } from './normalize';
import type { EngineInput, EngineResult, FlagId, TenantReport } from './types';

function stateName(code: string | undefined): string | undefined {
  if (!code) return undefined;
  return US_STATES.find(s => s.value === code)?.label;
}

function slotBag(input: EngineInput, result: EngineResult, creditUnionName: string): Partial<Record<Slot, string>> {
  const bag: Partial<Record<Slot, string>> = { creditUnionName };
  const put = (key: Slot, value: string | undefined) => {
    if (value !== undefined) bag[key] = value;
  };
  put('docFee', input.docFee !== undefined ? formatMoney(input.docFee) : undefined);
  put('apr', input.apr !== undefined ? formatPct(input.apr) : undefined);
  put('moneyFactor', input.moneyFactor !== undefined ? formatMf(input.moneyFactor) : undefined);
  put('mfApr', result.calc.mfApr !== undefined ? formatPct(result.calc.mfApr) : undefined);
  put('buyRateMf', input.buyRateMoneyFactor !== undefined ? formatMf(input.buyRateMoneyFactor) : undefined);
  put('buyRateApr', result.calc.buyRateApr !== undefined ? formatPct(result.calc.buyRateApr) : undefined);
  put('termMonths', input.termMonths !== undefined ? String(Math.round(input.termMonths)) : undefined);
  put('monthlyPayment', input.monthlyPayment !== undefined ? formatMoney(input.monthlyPayment) : undefined);
  put('calculatedPayment', result.calc.calculatedPayment !== undefined ? formatMoney(result.calc.calculatedPayment) : undefined);
  put('paymentGap', result.calc.paymentGap !== undefined ? formatMoney(Math.abs(result.calc.paymentGap)) : undefined);
  put('totalInterest', result.calc.totalInterest !== undefined ? formatMoney(result.calc.totalInterest) : undefined);
  put('sellingPrice', input.sellingPrice !== undefined ? formatMoney(input.sellingPrice) : undefined);
  put('msrp', input.msrp !== undefined ? formatMoney(input.msrp) : undefined);
  put('discountPct', result.calc.discountPct !== undefined ? formatPct(Math.abs(result.calc.discountPct)) : undefined);
  put('residualPct', result.calc.residualPercent !== undefined ? formatPct(result.calc.residualPercent) : undefined);
  put('netTrade', result.calc.netTrade !== undefined ? formatMoney(result.calc.netTrade) : undefined);
  put('negativeEquity', result.calc.netTrade !== undefined && result.calc.netTrade < 0 ? formatMoney(Math.abs(result.calc.netTrade)) : undefined);
  put('gapAmount', input.gapInsurance !== undefined ? formatMoney(input.gapInsurance) : undefined);
  put('warrantyAmount', input.extendedWarranty !== undefined ? formatMoney(input.extendedWarranty) : undefined);
  put('tireAmount', input.tireWheel !== undefined ? formatMoney(input.tireWheel) : undefined);
  put('paintAmount', input.paintInterior !== undefined ? formatMoney(input.paintInterior) : undefined);
  put('acquisitionFee', input.acquisitionFee !== undefined ? formatMoney(input.acquisitionFee) : undefined);
  put('downPayment', input.downPayment !== undefined ? formatMoney(input.downPayment) : undefined);
  put('rebates', input.rebates !== undefined ? formatMoney(input.rebates) : undefined);
  put('loanAmount', result.calc.loanAmount !== undefined ? formatMoney(result.calc.loanAmount) : undefined);
  put('dealerOffer', input.tradeDealerOffer !== undefined ? formatMoney(input.tradeDealerOffer) : formatMoney(0));
  put('payoff', input.tradePayoff !== undefined ? formatMoney(input.tradePayoff) : formatMoney(0));
  const name = stateName(input.state);
  if (name) put('stateName', name);
  return bag;
}

function fill(template: Template, values: Partial<Record<Slot, string>>): string {
  return renderTemplate(template, values);
}

function has(result: EngineResult, id: FlagId): boolean {
  return result.flags.some(f => f.id === id);
}

function headline(result: EngineResult): Template {
  if (result.grade === 'F') return HEADLINES.HL_F;
  if (has(result, 'FLAG_NEGATIVE_EQUITY')) return HEADLINES.HL_D_EQUITY;
  if (has(result, 'FLAG_APR_VERY_HIGH') || (has(result, 'FLAG_APR_HIGH') && result.grade === 'D')) {
    return HEADLINES.HL_D_RATE;
  }
  if (has(result, 'FLAG_APR_HIGH') || has(result, 'FLAG_MF_MARKUP') || has(result, 'FLAG_MF_MARKUP_SMALL')) {
    return HEADLINES.HL_C_RATE;
  }
  if (has(result, 'FLAG_LOW_RESIDUAL') || has(result, 'FLAG_RESIDUAL_SOFT')) return HEADLINES.HL_LEASE_RESIDUAL;
  if (has(result, 'FLAG_TERM_VERY_LONG') || has(result, 'FLAG_TERM_LONG')) return HEADLINES.HL_D_TERM;
  if (['LEASE_ADDONS', 'FIN_ADDONS'].includes(result.archetype)) return HEADLINES.HL_ADDONS;
  if (['LEASE_HIGH_FEES', 'FIN_HIGH_FEES'].includes(result.archetype)) return HEADLINES.HL_C_FEES;
  if (result.grade === 'A') return HEADLINES.HL_A;
  if (result.grade === 'B') return HEADLINES.HL_B;
  return HEADLINES.HL_C_MIXED;
}

function summary(result: EngineResult): Template {
  if (result.limitedData && result.flags.length === 0) return SUMMARIES.SUM_LIMITED;
  if (has(result, 'FLAG_NEGATIVE_EQUITY')) return SUMMARIES.SUM_NEG_EQUITY;
  if (has(result, 'FLAG_APR_VERY_HIGH')) return SUMMARIES.SUM_VERY_HIGH_APR;
  if (has(result, 'FLAG_APR_HIGH')) return SUMMARIES.SUM_HIGH_APR;
  if (has(result, 'FLAG_MF_MARKUP') || has(result, 'FLAG_MF_MARKUP_SMALL')) return SUMMARIES.SUM_MF_MARKUP;
  if (has(result, 'FLAG_LOW_RESIDUAL') || has(result, 'FLAG_RESIDUAL_SOFT')) return SUMMARIES.SUM_LOW_RESIDUAL;
  if (has(result, 'FLAG_TERM_VERY_LONG') || has(result, 'FLAG_TERM_LONG')) return SUMMARIES.SUM_LONG_TERM;
  if (result.archetype === 'LEASE_ADDONS' || result.archetype === 'FIN_ADDONS') return SUMMARIES.SUM_ADDONS;
  if (result.archetype === 'LEASE_HIGH_FEES' || result.archetype === 'FIN_HIGH_FEES') return SUMMARIES.SUM_FEES;
  if (result.archetype === 'LEASE_CLEAN' || result.archetype === 'FIN_CLEAN') return SUMMARIES.SUM_CLEAN;
  return SUMMARIES.SUM_STANDARD;
}

function questions(result: EngineResult): Template {
  if (has(result, 'FLAG_NEGATIVE_EQUITY')) return QUESTIONS.SCR_ASK_EQUITY;
  if (has(result, 'FLAG_MF_MARKUP') || has(result, 'FLAG_MF_MARKUP_SMALL')) return QUESTIONS.SCR_ASK_BUY_RATE;
  if (has(result, 'FLAG_APR_HIGH') || has(result, 'FLAG_APR_VERY_HIGH')) return QUESTIONS.SCR_ASK_RATE;
  if (has(result, 'FLAG_LOW_RESIDUAL') || has(result, 'FLAG_RESIDUAL_SOFT')) return QUESTIONS.SCR_ASK_RESIDUAL;
  if (has(result, 'FLAG_TERM_LONG') || has(result, 'FLAG_TERM_VERY_LONG')) return QUESTIONS.SCR_ASK_TERM;
  if (result.archetype === 'LEASE_ADDONS' || result.archetype === 'FIN_ADDONS') return QUESTIONS.SCR_ASK_ADDONS;
  if (has(result, 'FLAG_DOC_FEE_HIGH') || has(result, 'FLAG_DOC_FEE_VERY_HIGH') || has(result, 'FLAG_ACQ_FEE_HIGH') || has(result, 'FLAG_LEASE_CAP_REDUCTION')) {
    return QUESTIONS.SCR_ASK_FEE;
  }
  return QUESTIONS.SCR_GENERAL;
}

function taxNote(input: EngineInput, values: Partial<Record<Slot, string>>): string | null {
  if (!input.state || input.tradeDealerOffer === undefined || input.tradeDealerOffer <= 0) return null;
  const info = STATE_TAX_DATA[input.state];
  if (!info) return null;
  const name = stateName(input.state);
  if (!name) return null;
  if (info.salesTaxRate <= 0) return fill(TAX.noSales, { ...values, stateName: name });
  if (!info.tradeInCredit) return fill(TAX.noCredit, { ...values, stateName: name });
  const estimate = input.tradeDealerOffer * (info.salesTaxRate / 100);
  const stateRate = `${info.salesTaxRate.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}%`;
  return fill(TAX.credit, {
    ...values,
    stateName: name,
    stateRate,
    dealerOffer: formatMoney(input.tradeDealerOffer),
    taxCreditEstimate: formatMoney(estimate),
  });
}

export function buildTenantReport(input: EngineInput, creditUnionName: string): TenantReport {
  const result = evaluateDeal(input);
  const values = slotBag(input, result, creditUnionName);
  const rows: TenantReport['breakdown'] = [];

  const add = (label: string, value: string, status: 'good' | 'warn' | 'bad', template: Template) => {
    rows.push({ label, value, status, explanation: fill(template, values) });
  };

  if (input.sellingPrice !== undefined && input.msrp !== undefined && result.calc.discountPct !== undefined) {
    const d = result.calc.discountPct;
    if (has(result, 'FLAG_PRICE_ABOVE_MSRP')) add('Price versus MSRP', `${values.sellingPrice} (${values.discountPct} over MSRP)`, 'bad', BREAKDOWN.BD_PRICE_ABOVE);
    else if (d >= 6) add('Price versus MSRP', `${values.sellingPrice} (${values.discountPct} under MSRP)`, 'good', BREAKDOWN.BD_PRICE_GOOD);
    else if (d >= 1) add('Price versus MSRP', `${values.sellingPrice} (${values.discountPct} under MSRP)`, 'warn', BREAKDOWN.BD_PRICE_AVG);
    else add('Price versus MSRP', `${values.sellingPrice}`, 'warn', BREAKDOWN.BD_PRICE_WEAK);
  }

  if (input.dealType === 'finance' && input.apr !== undefined) {
    if (input.apr > 10) add('APR', values.apr!, 'bad', BREAKDOWN.BD_APR_VERY_HIGH);
    else if (input.apr > 8) add('APR', values.apr!, 'bad', BREAKDOWN.BD_APR_HIGH);
    else if (input.apr <= 6) add('APR', values.apr!, 'good', BREAKDOWN.BD_APR_STRONG);
    else add('APR', values.apr!, 'warn', BREAKDOWN.BD_APR_TYPICAL);
  }

  if (input.dealType === 'lease' && input.moneyFactor !== undefined && values.mfApr) {
    const shown = `${values.moneyFactor} (${values.mfApr})`;
    if (has(result, 'FLAG_MF_MARKUP') || has(result, 'FLAG_MF_MARKUP_SMALL')) add('Money factor', shown, has(result, 'FLAG_MF_MARKUP') ? 'bad' : 'warn', BREAKDOWN.BD_MF_MARKUP);
    else if (input.buyRateMoneyFactor !== undefined) add('Money factor', shown, 'good', BREAKDOWN.BD_MF_WITH_BUY);
    else add('Money factor', shown, 'warn', BREAKDOWN.BD_MF_UNKNOWN);
  }

  if (input.termMonths !== undefined) {
    const label = `${Math.round(input.termMonths)} months`;
    if (input.dealType === 'lease') add('Term', label, 'warn', BREAKDOWN.BD_TERM_LEASE);
    else if (input.termMonths >= 84) add('Term', label, 'bad', BREAKDOWN.BD_TERM_VERY_LONG);
    else if (input.termMonths >= 72) add('Term', label, 'warn', BREAKDOWN.BD_TERM_LONG);
    else add('Term', label, 'good', BREAKDOWN.BD_TERM_OK);
  }

  if (input.docFee !== undefined) {
    if (input.docFee > 800) add('Documentation fee', values.docFee!, 'bad', BREAKDOWN.BD_DOC_VERY_HIGH);
    else if (input.docFee > 500) add('Documentation fee', values.docFee!, 'warn', BREAKDOWN.BD_DOC_HIGH);
    else add('Documentation fee', values.docFee!, 'good', BREAKDOWN.BD_DOC_OK);
  }

  if (input.monthlyPayment !== undefined) {
    if (result.calc.calculatedPayment !== undefined && has(result, 'FLAG_PAYMENT_MISMATCH')) {
      add('Monthly payment', values.monthlyPayment!, 'warn', BREAKDOWN.BD_PAYMENT_GAP);
    } else if (result.calc.calculatedPayment !== undefined) {
      add('Monthly payment', values.monthlyPayment!, 'good', BREAKDOWN.BD_PAYMENT_OK);
    } else {
      add('Monthly payment', values.monthlyPayment!, 'warn', BREAKDOWN.BD_PAYMENT_QUOTE_ONLY);
    }
  }

  if (result.calc.totalInterest !== undefined && result.calc.loanAmount !== undefined) {
    add('Total interest', values.totalInterest!, has(result, 'FLAG_INTEREST_HIGH') ? 'bad' : 'good', has(result, 'FLAG_INTEREST_HIGH') ? BREAKDOWN.BD_INTEREST_HIGH : BREAKDOWN.BD_INTEREST_OK);
  }

  if (input.dealType === 'lease' && result.calc.residualPercent !== undefined) {
    const pct = result.calc.residualPercent;
    if (pct < 45) add('Residual', values.residualPct!, 'bad', BREAKDOWN.BD_RESIDUAL_LOW);
    else if (pct < 50) add('Residual', values.residualPct!, 'warn', BREAKDOWN.BD_RESIDUAL_SOFT);
    else if (pct >= 55) add('Residual', values.residualPct!, 'good', BREAKDOWN.BD_RESIDUAL_STRONG);
    else add('Residual', values.residualPct!, 'good', BREAKDOWN.BD_RESIDUAL_OK);
  }

  if (input.dealType === 'lease' && input.acquisitionFee !== undefined) {
    add('Acquisition fee', values.acquisitionFee!, input.acquisitionFee > 1000 ? 'warn' : 'good', input.acquisitionFee > 1000 ? BREAKDOWN.BD_ACQ_HIGH : BREAKDOWN.BD_ACQ_OK);
  }

  if (input.dealType === 'lease' && input.downPayment !== undefined && input.downPayment > 0) {
    add('Cap cost reduction', values.downPayment!, 'warn', BREAKDOWN.BD_CAP_REDUCTION);
  }

  if (input.dealType === 'finance' && input.downPayment !== undefined && input.downPayment > 0) {
    add('Cash down payment', values.downPayment!, 'good', BREAKDOWN.BD_DOWN);
  }

  if (input.tradeDealerOffer !== undefined && input.tradePayoff !== undefined) {
    const neg = (result.calc.netTrade ?? 0) < -1;
    add('Trade-in', neg ? values.negativeEquity! : values.netTrade!, neg ? 'bad' : 'good', neg ? BREAKDOWN.BD_TRADE_NEG : BREAKDOWN.BD_TRADE_POS);
  }

  if (input.gapInsurance !== undefined && input.gapInsurance > 400) {
    add('GAP product', values.gapAmount!, 'bad', BREAKDOWN.BD_GAP);
  }
  if (input.extendedWarranty !== undefined && input.extendedWarranty > 2500) {
    add('Service contract', values.warrantyAmount!, 'warn', BREAKDOWN.BD_WARRANTY);
  }
  if (input.tireWheel !== undefined && input.tireWheel > 400) {
    add('Tire and wheel product', values.tireAmount!, 'warn', BREAKDOWN.BD_TIRE);
  }
  if (input.paintInterior !== undefined && input.paintInterior > 0) {
    add('Appearance product', values.paintAmount!, input.paintInterior >= 500 ? 'bad' : 'warn', BREAKDOWN.BD_PAINT);
  }
  if (input.rebates !== undefined && input.rebates > 0) {
    add('Rebates', values.rebates!, 'good', BREAKDOWN.BD_REBATES);
  }

  const tradeIn = input.tradeDealerOffer !== undefined && input.tradePayoff !== undefined
    ? (result.calc.netTrade ?? 0) < -1
      ? { assessment: 'bad' as const, headline: fill(TRADE.negHead, values), details: fill(TRADE.negDetail, values) }
      : { assessment: 'good' as const, headline: fill(TRADE.posHead, values), details: fill(TRADE.posDetail, values) }
    : null;

  return {
    grade: result.grade,
    recommendation: result.recommendation,
    recommendationLabel: fill(RECOMMENDATION_LABELS[result.recommendation], values),
    headline: fill(headline(result), values),
    gradeExplanation: fill(GRADE_EXPLANATIONS[`GE_${result.grade}`], values),
    summary: fill(summary(result), values),
    archetype: result.archetype,
    breakdown: rows,
    itemsToReview: result.flags.map(f => ({
      id: f.id,
      issue: fill(FLAG_COPY[f.id].issue, values),
      action: fill(FLAG_COPY[f.id].action, values),
    })),
    questionsToAsk: fill(questions(result), values),
    tradeIn,
    stateTaxNote: taxNote(input, values),
    structureNote: fill(STRUCTURE_NOTES[input.dealType], values),
    disclaimers: [
      fill(DISCLAIMERS.DISC_EDUCATIONAL, values),
      fill(DISCLAIMERS.DISC_VERIFY, values),
      fill(DISCLAIMERS.DISC_INDEPENDENT, values),
      fill(DISCLAIMERS.DISC_NO_TIER, values),
    ],
    templatePackVersion: TEMPLATE_PACK_VERSION,
    limitedData: result.limitedData,
  };
}

export function gradePayload(body: unknown, creditUnionName: string): TenantReport {
  return buildTenantReport(normalizeDeal(body), creditUnionName);
}
