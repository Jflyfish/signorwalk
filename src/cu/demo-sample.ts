/**
 * Numbers for the Harborlight landing and embed demos.
 * Copied from golden fixtures. Scoring is not defined here.
 */
export const DEMO_FINANCE_SAMPLE = {
  sellingPrice: '32000',
  msrp: '35000',
  downPayment: '2000',
  docFee: '299',
  monthlyPayment: '584',
  apr: '5.9',
  term: '60',
} as const;

/** Golden fixture fin-at-msrp. */
export const DEMO_GRADE_C = {
  sellingPrice: '30000',
  msrp: '30000',
  apr: '6.5',
  docFee: '350',
  term: '60',
} as const;

/** Golden fixture fin-84-only. */
export const DEMO_GRADE_D = {
  sellingPrice: '28500',
  msrp: '30000',
  apr: '6.5',
  docFee: '300',
  term: '84',
} as const;
