/**
 * Worksheet OCR.
 *
 * TODO: Anthropic zero data retention is required before production.
 * The file is held in memory for this request and is not written to disk,
 * the credit-union store, or the logs. Anthropic still receives the document
 * unless the account has zero data retention.
 */

export const OCR_LOG_KEYS = ['ts', 'tenant', 'route', 'outcome', 'latencyMs'] as const;

export type OcrOutcome = 'ok' | 'invalid' | 'unconfigured' | 'rejected' | 'error';

export interface OcrLog {
  ts: string;
  tenant: string;
  route: '/api/cu/extract';
  outcome: OcrOutcome;
  latencyMs: number;
}

const NUMERIC_FIELDS = [
  'sellingPrice',
  'msrp',
  'rebates',
  'downPayment',
  'docFee',
  'monthlyPayment',
  'apr',
  'moneyFactor',
  'buyRateMoneyFactor',
  'residualPercent',
  'acquisitionFee',
  'amountFinanced',
  'tradeDealerOffer',
  'tradePayoff',
  'extendedWarranty',
  'gapInsurance',
  'tireWheel',
  'paintInterior',
] as const;

export type OcrField = (typeof NUMERIC_FIELDS)[number];

export interface OcrFields {
  dealType?: 'finance' | 'lease';
  fields: Partial<Record<OcrField, string>>;
}

export function formatOcrLog(entry: OcrLog): string {
  const out: Record<string, unknown> = {};
  for (const key of OCR_LOG_KEYS) {
    if (entry[key] !== undefined) out[key] = entry[key];
  }
  return JSON.stringify(out);
}

function numeric(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 500_000) {
    return String(value);
  }
  if (typeof value !== 'string') return undefined;
  const cleaned = value.trim().replace(/[$,]/g, '');
  if (!/^\d+(\.\d+)?$/.test(cleaned) || cleaned.length > 16) return undefined;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0 || n > 500_000) return undefined;
  return String(n);
}

/** Keeps deal type and numbers. Names, VINs, account numbers, and prose are dropped. */
export function pickOcrFields(raw: unknown): OcrFields {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { fields: {} };
  const src = raw as Record<string, unknown>;
  const fields: Partial<Record<OcrField, string>> = {};
  for (const key of NUMERIC_FIELDS) {
    const value = numeric(src[key]);
    if (value !== undefined) fields[key] = value;
  }
  const dealType = src.dealType === 'lease' || src.dealType === 'finance' ? src.dealType : undefined;
  return { dealType, fields };
}

export const OCR_PROMPT = `Extract numbers from this dealer worksheet or contract.
Return only a JSON object. Use null for anything you cannot see.
Allowed keys: dealType, sellingPrice, msrp, rebates, downPayment, docFee, monthlyPayment, apr, moneyFactor, buyRateMoneyFactor, residualPercent, acquisitionFee, amountFinanced, tradeDealerOffer, tradePayoff, extendedWarranty, gapInsurance, tireWheel, paintInterior.
dealType is "finance" or "lease" or null.
Do not include names, addresses, phone numbers, email addresses, account numbers, Social Security numbers, VINs, or any other words.
Numbers only, with no currency symbols.`;
