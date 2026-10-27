/**
 * Public list prices for the credit-union white-label.
 * Static on purpose: checkout is not wired, and nothing here reads the environment.
 *
 * Annual price is what the credit union pays for 12 months.
 * That annual price equals 10 months of the monthly rate (2 months free).
 */

export const TALK_TO_US_EMAIL = 'team@signorwalk.com';

export const FREE_MONTHS_ON_ANNUAL = 2;
export const MONTHS_IN_YEAR = 12;
export const PILOT_DAYS = 90;
export const DOCUMENT_VERSION_LABEL = 'draft v0.9';

export type PricedTierId = 'starter' | 'growth' | 'pro';
export type TierParam = PricedTierId | 'custom';

export interface PricedTier {
  id: PricedTierId;
  name: string;
  assets: string;
  annualUsd: number;
  setupUsd: number;
}

export const pricedTiers: readonly PricedTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    assets: 'Under $250 million',
    annualUsd: 6_000,
    setupUsd: 0,
  },
  {
    id: 'growth',
    name: 'Growth',
    assets: '$250 million–$1 billion',
    annualUsd: 12_000,
    setupUsd: 0,
  },
  {
    id: 'pro',
    name: 'Pro',
    assets: '$1 billion–$5 billion',
    annualUsd: 24_000,
    setupUsd: 0,
  },
];

const billedMonths = MONTHS_IN_YEAR - FREE_MONTHS_ON_ANNUAL;

export function monthlyUsd(annualUsd: number): number {
  return annualUsd / billedMonths;
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getPricedTier(id: string | undefined): PricedTier | undefined {
  return pricedTiers.find(tier => tier.id === id);
}

export function resolveTierParam(value: string | undefined): TierParam | null {
  if (value === 'starter' || value === 'growth' || value === 'pro' || value === 'custom') {
    return value;
  }
  return null;
}

/** Mailto only. The message stays in the visitor's email app until they send it. */
export function talkToUsHref(): string {
  const subject = 'Sign or Walk for credit unions';
  const body = [
    'Credit union:',
    'Approximate total assets:',
    'Credit union league or CUSO, if that applies:',
    '',
    'Sent from your email app.',
  ].join('\n');

  return `mailto:${TALK_TO_US_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function assertPricingMath(): void {
  for (const tier of pricedTiers) {
    const monthly = monthlyUsd(tier.annualUsd);
    if (!Number.isInteger(monthly) || monthly * billedMonths !== tier.annualUsd) {
      throw new Error(`Annual price for ${tier.id} is not exactly ${billedMonths} monthly payments.`);
    }
  }
}

assertPricingMath();
