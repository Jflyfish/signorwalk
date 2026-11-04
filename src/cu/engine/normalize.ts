import { US_STATES } from '../../lib/states';
import type { EngineInput } from './types';

const STATE_CODES = new Set(US_STATES.map(s => s.value));

/** Fixed message. Never includes the submitted value. */
export class InputError extends Error {
  constructor() {
    super('Check the numbers and try again.');
    this.name = 'InputError';
  }
}

const MAX_BODY_KEYS = 40;

function readNumber(value: unknown, max: number): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') throw new InputError();
  let n: number;
  if (typeof value === 'number') {
    n = value;
  } else if (typeof value === 'string') {
    const s = value.trim().replace(/[$,]/g, '');
    if (!s) return undefined;
    if (s.length > 16 || !/^\d+(\.\d+)?$/.test(s)) throw new InputError();
    n = Number(s);
  } else {
    throw new InputError();
  }
  if (!Number.isFinite(n) || n < 0 || n > max) throw new InputError();
  return n;
}

function readState(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') throw new InputError();
  const code = value.trim().toUpperCase();
  if (!STATE_CODES.has(code)) throw new InputError();
  return code;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'object' || Array.isArray(value)) throw new InputError();
  return value as Record<string, unknown>;
}

function pick(source: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== '') return source[key];
  }
  return undefined;
}

/**
 * Accepts the credit-union flat payload or the existing nested deal payload.
 * Free-text fields are dropped and never returned.
 */
export function normalizeDeal(body: unknown): EngineInput {
  const root = asRecord(body);
  if (!root) throw new InputError();
  if (Object.keys(root).length > MAX_BODY_KEYS) throw new InputError();

  const dealType = root.dealType;
  if (dealType !== 'lease' && dealType !== 'finance') throw new InputError();

  const lease = asRecord(root.lease);
  const finance = asRecord(root.finance);
  const trade = asRecord(root.tradeIn);
  const bundled = asRecord(root.bundledCosts);
  const src: Record<string, unknown> = { ...root, ...(lease ?? {}), ...(finance ?? {}) };

  const sellingPrice = readNumber(
    pick(src, dealType === 'finance' ? ['sellingPrice', 'negotiatedPrice'] : ['sellingPrice', 'negotiatedPrice']),
    500_000,
  );
  const downPayment = readNumber(
    pick(src, dealType === 'lease' ? ['capCostReduction', 'downPayment'] : ['downPayment', 'capCostReduction']),
    500_000,
  );

  const input: EngineInput = {
    dealType,
    state: readState(root.state ?? src.state),
    msrp: readNumber(pick(src, ['msrp']), 500_000),
    sellingPrice,
    rebates: readNumber(pick(src, ['rebates']), 100_000),
    moneyFactor: readNumber(pick(src, ['moneyFactor']), 0.02),
    buyRateMoneyFactor: readNumber(pick(src, ['buyRateMoneyFactor']), 0.02),
    residualPercent: readNumber(pick(src, ['residualPercent']), 100),
    residualDollar: readNumber(pick(src, ['residualDollar']), 500_000),
    termMonths: readNumber(pick(src, ['termMonths', 'leaseTerm', 'loanTerm']), 96),
    monthlyPayment: readNumber(pick(src, ['monthlyPayment']), 20_000),
    downPayment,
    acquisitionFee: readNumber(pick(src, ['acquisitionFee']), 20_000),
    docFee: readNumber(pick(src, ['docFee']), 20_000),
    apr: readNumber(pick(src, ['apr']), 40),
    amountFinanced: readNumber(pick(src, ['amountFinanced']), 500_000),
    tradeDealerOffer: readNumber(pick(trade ?? src, ['tradeDealerOffer', 'dealerOffer']), 500_000),
    tradePayoff: readNumber(pick(trade ?? src, ['tradePayoff', 'payoffAmount']), 500_000),
    extendedWarranty: readNumber(pick(bundled ?? src, ['extendedWarranty']), 50_000),
    gapInsurance: readNumber(pick(bundled ?? src, ['gapInsurance']), 50_000),
    tireWheel: readNumber(pick(bundled ?? src, ['tireWheel', 'tireWheelProtection']), 50_000),
    paintInterior: readNumber(pick(bundled ?? src, ['paintInterior', 'paintInteriorProtection']), 50_000),
  };

  const defined = Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined));
  return defined as unknown as EngineInput;
}
