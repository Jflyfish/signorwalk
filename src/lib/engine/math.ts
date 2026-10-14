/** Deterministic deal math. Same formulas the consumer prompt used, without sending them to a model. */

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function moneyFactorToApr(mf: number): number {
  return mf * 2400;
}

export function financePayment(principal: number, aprPercent: number, termMonths: number): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  const r = aprPercent / 100 / 12;
  if (r === 0) return principal / termMonths;
  const pow = (1 + r) ** termMonths;
  return (principal * r * pow) / (pow - 1);
}

export function discountPercent(msrp: number, sellingPrice: number): number {
  if (msrp <= 0) return 0;
  return ((msrp - sellingPrice) / msrp) * 100;
}

export function formatMoney(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(Math.round(n));
  const body = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}$${body}`;
}

export function formatPct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}

export function formatMf(n: number): string {
  return n.toFixed(5);
}
