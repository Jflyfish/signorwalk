import type { FlagId } from '../../engine/types';

export const TEMPLATE_PACK_VERSION = 'tp-1.0.0' as const;

export const SLOTS = [
  'docFee',
  'apr',
  'moneyFactor',
  'mfApr',
  'buyRateMf',
  'buyRateApr',
  'termMonths',
  'monthlyPayment',
  'calculatedPayment',
  'paymentGap',
  'totalInterest',
  'sellingPrice',
  'msrp',
  'discountPct',
  'residualPct',
  'netTrade',
  'negativeEquity',
  'gapAmount',
  'warrantyAmount',
  'tireAmount',
  'paintAmount',
  'acquisitionFee',
  'downPayment',
  'rebates',
  'loanAmount',
  'stateName',
  'stateRate',
  'taxCreditEstimate',
  'creditUnionName',
  'dealerOffer',
  'payoff',
] as const;

export type Slot = (typeof SLOTS)[number];

export interface Template {
  id: string;
  text: string;
  slots: readonly Slot[];
}

function t(id: string, text: string, slots: readonly Slot[] = []): Template {
  return { id, text, slots };
}

export const HEADLINES = {
  HL_A: t('HL_A', 'These numbers compare favorably with typical benchmarks.'),
  HL_B_NEAR: t('HL_B_NEAR', 'These numbers are near this tool\'s benchmarks.'),
  HL_B: t('HL_B', 'These numbers are close to typical benchmarks, with a few items to review.'),
  HL_C_RATE: t('HL_C_RATE', 'The rate on this offer is above the ranges this tool uses as a benchmark.'),
  HL_C_FEES: t('HL_C_FEES', 'A fee on this offer sits outside the range this tool treats as typical.'),
  HL_C_MIXED: t('HL_C_MIXED', 'A few items on this offer sit outside typical ranges.'),
  HL_D_RATE: t('HL_D_RATE', 'The rate on this offer sits well outside typical benchmark ranges.'),
  HL_D_EQUITY: t('HL_D_EQUITY', 'The trade payoff is higher than the offer for that vehicle.'),
  HL_D_TERM: t('HL_D_TERM', 'The repayment term is longer than the terms this tool treats as typical.'),
  HL_F: t('HL_F', 'Several items on this offer sit well outside typical benchmark ranges.'),
  HL_LEASE_RESIDUAL: t('HL_LEASE_RESIDUAL', 'The residual on this lease is below the ranges often seen for a lease of this length.'),
  HL_ADDONS: t('HL_ADDONS', 'One or more optional products are priced above the ranges this tool treats as typical.'),
} as const;

export const GRADE_EXPLANATIONS = {
  GE_A: t('GE_A', 'An A is this tool\'s top mark. Nothing entered pulled the result down. This is a comparison, not a recommendation to sign and not a credit decision.'),
  GE_B: t('GE_B', 'A B means the result is short of this tool\'s top mark. The items below are what the rules calculated. The grade is not a credit decision.'),
  GE_B_NEAR: t('GE_B_NEAR', 'A B means the result is short of this tool\'s top mark. The grade is a comparison, not a recommendation to sign and not a credit decision.'),
  GE_C: t('GE_C', 'A C means the gaps are wider than on a B. Take the items below to the dealer. The grade is not a credit decision.'),
  GE_D: t('GE_D', 'A D means the gaps are wide. The grade compares the figures you entered. It is not a credit decision and not an instruction.'),
  GE_F: t('GE_F', 'An F is this tool\'s lowest mark. You may want to ask for a revised written offer. The grade is not a credit decision.'),
} as const;

/** Why a grade stopped short of A when no flag fired. Thresholds match the rules engine. */
export const HOLDBACKS = {
  HB_APR_HEAD: t('HB_APR_HEAD', 'The APR entered is {apr}, above the 6% level this tool treats as strong.', ['apr']),
  HB_APR_ISSUE: t('HB_APR_ISSUE', 'The APR entered is {apr}. This tool adds the most when the rate is at or below 6%.', ['apr']),
  HB_APR_ACTION: t('HB_APR_ACTION', 'You can ask the dealer to show the rate in writing and compare it with the rate on your credit union\'s published rate page.'),
  HB_DISCOUNT_HEAD: t('HB_DISCOUNT_HEAD', 'The price is {discountPct} under MSRP, short of the 8% this tool treats as a strong discount.', ['discountPct']),
  HB_DISCOUNT_ISSUE: t('HB_DISCOUNT_ISSUE', 'The selling price is {discountPct} under MSRP.', ['discountPct']),
  HB_DISCOUNT_ACTION: t('HB_DISCOUNT_ACTION', 'This tool treats a discount of 8% or more as strong. You can ask the dealer to put a lower selling price in writing.'),
  HB_RATE_MISSING_HEAD: t('HB_RATE_MISSING_HEAD', 'No APR was entered, so the rate could not move this to the top mark.'),
  HB_RATE_MISSING_ISSUE: t('HB_RATE_MISSING_ISSUE', 'APR was left blank.'),
  HB_RATE_MISSING_ACTION: t('HB_RATE_MISSING_ACTION', 'You can add the APR from the worksheet and check the offer again.'),
  HB_PRICE_MISSING_HEAD: t('HB_PRICE_MISSING_HEAD', 'Selling price or MSRP was left blank, so the price comparison could not raise this grade.'),
  HB_PRICE_MISSING_ISSUE: t('HB_PRICE_MISSING_ISSUE', 'Selling price or MSRP was left blank.'),
  HB_PRICE_MISSING_ACTION: t('HB_PRICE_MISSING_ACTION', 'You can add both numbers from the worksheet and check the offer again.'),
  HB_LIMITED_HEAD: t('HB_LIMITED_HEAD', 'Only a few figures were entered, so this stays short of the top mark.'),
  HB_LIMITED_ISSUE: t('HB_LIMITED_ISSUE', 'Fewer than three figures were entered.'),
  HB_LIMITED_ACTION: t('HB_LIMITED_ACTION', 'Adding the price, rate, and term from the worksheet makes the comparison closer.'),
  HB_RESIDUAL_HEAD: t('HB_RESIDUAL_HEAD', 'The residual is {residualPct} of MSRP, short of the 55% this tool treats as strong.', ['residualPct']),
  HB_RESIDUAL_ISSUE: t('HB_RESIDUAL_ISSUE', 'The residual is {residualPct} of MSRP.', ['residualPct']),
  HB_RESIDUAL_ACTION: t('HB_RESIDUAL_ACTION', 'This tool treats a residual of 55% or more as strong. You can ask how the mileage limit changes that percent.'),
  HB_SHORT_HEAD: t('HB_SHORT_HEAD', 'These figures stay short of this tool\'s top mark.'),
  HB_SHORT_ISSUE: t('HB_SHORT_ISSUE', 'The figures entered did not reach this tool\'s top mark.'),
  HB_SHORT_ACTION: t('HB_SHORT_ACTION', 'You can add any blank price, rate, or term from the worksheet and check again.'),
} as const;

export const SUMMARIES = {
  SUM_CLEAN: t('SUM_CLEAN', 'Based on the figures entered, the price, rate, and fees that were provided fall within or better than the benchmark ranges this tool uses. Benchmarks are labeled assumptions, not a quote from a lender.'),
  SUM_LIMITED: t('SUM_LIMITED', 'Only a few figures were entered, so this comparison is directional. Items that were left blank are not treated as problems. Adding the missing numbers from the worksheet makes the comparison closer.'),
  SUM_HIGH_APR: t('SUM_HIGH_APR', 'The APR entered is {apr}. That is above the rough range of 6–8% often cited for new-auto loans, and it is at or below 10%. The 6–8% range is a labeled assumption. It varies by lender, term, and amount financed, and it is not a statement about credit standing.', ['apr']),
  SUM_VERY_HIGH_APR: t('SUM_VERY_HIGH_APR', 'The APR entered is {apr}, which is above 10%. Figures above that level sit well outside the rough 6–8% range often cited for new-auto loans. That range is a labeled assumption, not a lender quote, and it is not a statement about credit standing.', ['apr']),
  SUM_LONG_TERM: t('SUM_LONG_TERM', 'The term entered is {termMonths} months. A longer term lowers the monthly amount and usually increases total interest compared with a shorter term on the same amount financed.', ['termMonths']),
  SUM_NEG_EQUITY: t('SUM_NEG_EQUITY', 'Using the trade offer ({dealerOffer}) and payoff ({payoff}) you entered, the payoff is {negativeEquity} higher. A blank offer or payoff is treated as zero here, so confirm both numbers on the worksheet. The difference is often added to the amount financed.', ['dealerOffer', 'payoff', 'negativeEquity']),
  SUM_MF_MARKUP: t('SUM_MF_MARKUP', 'The money factor entered is {moneyFactor} (about {mfApr} when multiplied by 2,400). The base money factor entered is {buyRateMf} (about {buyRateApr}). This tool flags a money factor above the base figure you supplied. The conversion is arithmetic, not a separate rate quote, and it is not a statement about credit standing.', ['moneyFactor', 'mfApr', 'buyRateMf', 'buyRateApr']),
  SUM_LOW_RESIDUAL: t('SUM_LOW_RESIDUAL', 'The residual entered is {residualPct} of MSRP. Residuals under 50% sit below the ranges this tool treats as common for a typical 36-month lease. Mileage limits change the residual, so confirm the mileage that produced this figure.', ['residualPct']),
  SUM_ADDONS: t('SUM_ADDONS', 'One or more optional products are priced above the ranges this tool treats as typical. Those products can usually be declined. The ranges are assumptions about common pricing, not a statement that a product has no use.'),
  SUM_FEES: t('SUM_FEES', 'A documentation fee or acquisition fee on this offer sits outside the range this tool treats as typical. The thresholds used here are a documentation fee above $500 and an acquisition fee above $1,000.'),
  SUM_STANDARD: t('SUM_STANDARD', 'Some of the numbers entered fall inside typical ranges and some fall outside. Each line below is calculated from what you entered. Benchmarks are labeled assumptions.'),
} as const;

export const RECOMMENDATION_LABELS = {
  sign: t('REC_SIGN', 'Compares favorably with typical benchmarks'),
  negotiate: t('REC_NEGOTIATE', 'Worth reviewing a few items with the dealer'),
  walk: t('REC_WALK', 'Compares unfavorably with typical benchmarks'),
} as const;

export const QUESTIONS = {
  SCR_ASK_RATE: t('SCR_ASK_RATE', 'You can ask the dealer to show the rate in writing and to explain how it was set. You can also compare it with the rate on your credit union\'s published rate page.'),
  SCR_ASK_BUY_RATE: t('SCR_ASK_BUY_RATE', 'You can ask whether the money factor is the base rate and, if it is higher than the base figure you were given, what the difference pays for.'),
  SCR_ASK_FEE: t('SCR_ASK_FEE', 'You can ask for the documentation fee to be itemized and whether the dealer will reduce it.'),
  SCR_ASK_TERM: t('SCR_ASK_TERM', 'You can ask to see total interest at this term and at a shorter term, using the same amount financed.'),
  SCR_ASK_EQUITY: t('SCR_ASK_EQUITY', 'You can ask for the trade offer, the payoff, and any amount added to the new financing to be shown on separate lines.'),
  SCR_ASK_ADDONS: t('SCR_ASK_ADDONS', 'You can ask which optional products can be declined, what each one costs, and what the payment would be without them.'),
  SCR_ASK_RESIDUAL: t('SCR_ASK_RESIDUAL', 'You can ask for the residual in dollars and as a percent of MSRP, and how the mileage limit changes it.'),
  SCR_GENERAL: t('SCR_GENERAL', 'You can ask the dealer to review each item listed below and to put any revised figures in writing.'),
} as const;

export const DISCLAIMERS = {
  DISC_EDUCATIONAL: t('DISC_EDUCATIONAL', 'This is an educational estimate of how the numbers you entered compare with typical auto-financing benchmarks. It is not an offer of credit and it is not financial, legal, or tax advice.'),
  DISC_VERIFY: t('DISC_VERIFY', 'Confirm every figure on the dealer\'s written worksheet before you agree to anything. Benchmarks are labeled assumptions and can differ from a lender\'s actual pricing.'),
  DISC_INDEPENDENT: t('DISC_INDEPENDENT', 'Powered by Sign or Walk, an independent provider. {creditUnionName} does not endorse any dealer. This tool does not approve credit and does not set a rate.', ['creditUnionName']),
  DISC_NO_TIER: t('DISC_NO_TIER', 'The grade does not estimate credit standing, does not use demographic information, and does not predict whether an application will be approved.'),
} as const;

export const STRUCTURE_NOTES = {
  finance: t('LVB_FINANCE', 'This comparison covers only the finance offer you entered. It is not a recommendation to finance or to lease.'),
  lease: t('LVB_LEASE', 'This comparison covers only the lease offer you entered. It is not a recommendation to lease or to finance.'),
} as const;

export const TRADE = {
  negHead: t('TR_NEG_HEAD', 'Trade payoff is higher than the offer'),
  negDetail: t('TR_NEG_DETAIL', 'The offer entered is {dealerOffer} and the payoff entered is {payoff}. The difference of {negativeEquity} is often added to the amount financed.', ['dealerOffer', 'payoff', 'negativeEquity']),
  posHead: t('TR_POS_HEAD', 'Trade offer covers the payoff'),
  posDetail: t('TR_POS_DETAIL', 'The offer entered is {dealerOffer} and the payoff entered is {payoff}. The difference is {netTrade}. This comparison does not add that difference to the amount financed.', ['dealerOffer', 'payoff', 'netTrade']),
} as const;

export const TAX = {
  credit: t('TAX_CREDIT', 'In {stateName}, a trade-in may reduce the amount that is taxed. Using the state base rate of {stateRate} and the trade offer of {dealerOffer}, a rough estimate of that reduction is {taxCreditEstimate}. Local taxes can differ. Ask the dealer to show the tax line on the worksheet. This is an estimate, not a tax determination.', ['stateName', 'stateRate', 'dealerOffer', 'taxCreditEstimate']),
  noCredit: t('TAX_NO_CREDIT', 'In {stateName}, the state base rules used here do not reduce the taxable amount by the trade-in offer. Ask the dealer to show how tax was calculated on the worksheet.', ['stateName']),
  noSales: t('TAX_NO_SALES', '{stateName} has no state sales tax in the table this tool uses. Ask the dealer which taxes and fees apply.', ['stateName']),
} as const;

export const BREAKDOWN = {
  BD_PRICE_GOOD: t('BD_PRICE_GOOD', 'The price entered is {sellingPrice}, which is {discountPct} under the MSRP of {msrp}. A discount of 6% or more is the favorable band this tool uses.', ['sellingPrice', 'discountPct', 'msrp']),
  BD_PRICE_AVG: t('BD_PRICE_AVG', 'The price entered is {sellingPrice}, which is {discountPct} under the MSRP of {msrp}. Discounts under 6% are the middle band this tool uses.', ['sellingPrice', 'discountPct', 'msrp']),
  BD_PRICE_WEAK: t('BD_PRICE_WEAK', 'The price entered is {sellingPrice}, close to the MSRP of {msrp}. This tool treats a discount under 1% as little or no reduction from MSRP.', ['sellingPrice', 'msrp']),
  BD_PRICE_ABOVE: t('BD_PRICE_ABOVE', 'The price entered is {sellingPrice}, which is above the MSRP of {msrp} ({discountPct} over). Prices above MSRP sit outside the band this tool treats as typical.', ['sellingPrice', 'msrp', 'discountPct']),
  BD_APR_STRONG: t('BD_APR_STRONG', 'The APR entered is {apr}. That is at or below 6%, which this tool treats as a favorable comparison with the rough 6–8% assumption for new-auto loans. It is not a lender quote.', ['apr']),
  BD_APR_TYPICAL: t('BD_APR_TYPICAL', 'The APR entered is {apr}. That falls in the rough 6–8% range often cited for new-auto loans. The range is a labeled assumption, not a lender quote and not a statement about credit standing.', ['apr']),
  BD_APR_HIGH: t('BD_APR_HIGH', 'The APR entered is {apr}. That is above 8% and at or below 10%, outside the rough 6–8% assumption this tool uses. It is not a statement about credit standing.', ['apr']),
  BD_APR_VERY_HIGH: t('BD_APR_VERY_HIGH', 'The APR entered is {apr}, above 10%. That sits well outside the rough 6–8% assumption this tool uses. It is not a statement about credit standing.', ['apr']),
  BD_MF_WITH_BUY: t('BD_MF_WITH_BUY', 'The money factor entered is {moneyFactor} (about {mfApr} when multiplied by 2,400), at or below the base money factor of {buyRateMf}.', ['moneyFactor', 'mfApr', 'buyRateMf']),
  BD_MF_MARKUP: t('BD_MF_MARKUP', 'The money factor entered is {moneyFactor} (about {mfApr}). The base money factor entered is {buyRateMf} (about {buyRateApr}). This tool treats a money factor above that base figure as a markup to review.', ['moneyFactor', 'mfApr', 'buyRateMf', 'buyRateApr']),
  BD_MF_UNKNOWN: t('BD_MF_UNKNOWN', 'The money factor entered is {moneyFactor} (about {mfApr} when multiplied by 2,400). No base money factor was entered, so this tool does not treat it as marked up. You can ask the dealer for the base figure.', ['moneyFactor', 'mfApr']),
  BD_TERM_OK: t('BD_TERM_OK', 'The term entered is {termMonths} months. Terms of 60 months or less are the shorter band this tool uses for a finance offer.', ['termMonths']),
  BD_TERM_LONG: t('BD_TERM_LONG', 'The term entered is {termMonths} months. Terms of 72 or 75 months are longer than 60 months and usually add interest compared with a shorter term.', ['termMonths']),
  BD_TERM_VERY_LONG: t('BD_TERM_VERY_LONG', 'The term entered is {termMonths} months. Terms of 84 months or more are the long band this tool uses. A longer term usually increases total interest.', ['termMonths']),
  BD_TERM_LEASE: t('BD_TERM_LEASE', 'The lease term entered is {termMonths} months. This tool does not grade lease term length by itself.', ['termMonths']),
  BD_DOC_OK: t('BD_DOC_OK', 'The documentation fee entered is {docFee}. This tool treats $500 or less as the typical band.', ['docFee']),
  BD_DOC_HIGH: t('BD_DOC_HIGH', 'The documentation fee entered is {docFee}. Fees above $500 and at or below $800 sit outside the typical band this tool uses.', ['docFee']),
  BD_DOC_VERY_HIGH: t('BD_DOC_VERY_HIGH', 'The documentation fee entered is {docFee}. Fees above $800 sit further outside the typical band this tool uses.', ['docFee']),
  BD_PAYMENT_OK: t('BD_PAYMENT_OK', 'The quoted payment is {monthlyPayment}. The payment calculated from the price, rate, term, and down payment entered is {calculatedPayment}. The two are within $50.', ['monthlyPayment', 'calculatedPayment']),
  BD_PAYMENT_GAP: t('BD_PAYMENT_GAP', 'The quoted payment is {monthlyPayment}. The payment calculated from the other figures entered is {calculatedPayment}. The difference is {paymentGap}. Taxes or products not entered can explain a difference.', ['monthlyPayment', 'calculatedPayment', 'paymentGap']),
  BD_PAYMENT_QUOTE_ONLY: t('BD_PAYMENT_QUOTE_ONLY', 'The quoted payment is {monthlyPayment}. A comparison payment was not calculated because the price, rate, or term was missing.', ['monthlyPayment']),
  BD_INTEREST_OK: t('BD_INTEREST_OK', 'Total interest calculated from the figures entered is {totalInterest} on an amount financed of {loanAmount}. That is 20% or less of the vehicle price entered.', ['totalInterest', 'loanAmount']),
  BD_INTEREST_HIGH: t('BD_INTEREST_HIGH', 'Total interest calculated from the figures entered is {totalInterest} on an amount financed of {loanAmount}. That is more than 20% of the vehicle price entered.', ['totalInterest', 'loanAmount']),
  BD_RESIDUAL_STRONG: t('BD_RESIDUAL_STRONG', 'The residual is {residualPct} of MSRP. This tool treats 55% or more as the favorable band for the comparison.', ['residualPct']),
  BD_RESIDUAL_OK: t('BD_RESIDUAL_OK', 'The residual is {residualPct} of MSRP. This tool treats 50–55% as a common band.', ['residualPct']),
  BD_RESIDUAL_SOFT: t('BD_RESIDUAL_SOFT', 'The residual is {residualPct} of MSRP. This tool treats 45–50% as a softer band. Mileage limits change this figure.', ['residualPct']),
  BD_RESIDUAL_LOW: t('BD_RESIDUAL_LOW', 'The residual is {residualPct} of MSRP. This tool treats under 45% as below the common band. Mileage limits change this figure.', ['residualPct']),
  BD_ACQ_OK: t('BD_ACQ_OK', 'The acquisition fee entered is {acquisitionFee}. This tool treats $1,000 or less as the typical band.', ['acquisitionFee']),
  BD_ACQ_HIGH: t('BD_ACQ_HIGH', 'The acquisition fee entered is {acquisitionFee}. Fees above $1,000 sit outside the typical band this tool uses.', ['acquisitionFee']),
  BD_CAP_REDUCTION: t('BD_CAP_REDUCTION', 'The cap cost reduction entered is {downPayment}. Amounts paid up front on a lease are at risk if the vehicle is stolen or totaled. This is an item to review, not a rule that forbids it.', ['downPayment']),
  BD_TRADE_POS: t('BD_TRADE_POS', 'The trade offer of {dealerOffer} minus the payoff of {payoff} is {netTrade}.', ['dealerOffer', 'payoff', 'netTrade']),
  BD_TRADE_NEG: t('BD_TRADE_NEG', 'The trade offer of {dealerOffer} is {negativeEquity} below the payoff of {payoff}. That difference is often added to the amount financed.', ['dealerOffer', 'payoff', 'negativeEquity']),
  BD_GAP: t('BD_GAP', 'The GAP product entered is {gapAmount}. This tool treats amounts above $400 as outside the band for a dealer-sold GAP product. A buyer\'s own auto policy is often priced differently. This is not a statement that the product has no use.', ['gapAmount']),
  BD_WARRANTY: t('BD_WARRANTY', 'The service contract entered is {warrantyAmount}. This tool treats amounts above $2,500 as outside the band it uses for a service contract. Coverage terms differ, so compare the contract itself.', ['warrantyAmount']),
  BD_TIRE: t('BD_TIRE', 'The tire and wheel product entered is {tireAmount}. This tool treats amounts above $400 as outside its typical band.', ['tireAmount']),
  BD_PAINT: t('BD_PAINT', 'The appearance product entered is {paintAmount}. This tool treats dealer appearance products as an item to review, and amounts of $500 or more as further outside its typical band.', ['paintAmount']),
  BD_REBATES: t('BD_REBATES', 'Rebates entered are {rebates}. Confirm that the offer you were shown is one you qualify for under the program\'s own terms.', ['rebates']),
  BD_DOWN: t('BD_DOWN', 'The cash down payment entered is {downPayment}. It reduces the amount financed in this comparison.', ['downPayment']),
} as const;

const issue = {
  FLAG_DOC_FEE_HIGH: t('FLAG_DOC_FEE_HIGH_ISSUE', 'The documentation fee entered is {docFee}. Fees above $500 sit outside the range this tool treats as typical.', ['docFee']),
  FLAG_DOC_FEE_VERY_HIGH: t('FLAG_DOC_FEE_VERY_HIGH_ISSUE', 'The documentation fee entered is {docFee}. Fees above $800 sit further outside the range this tool treats as typical.', ['docFee']),
  FLAG_APR_HIGH: t('FLAG_APR_HIGH_ISSUE', 'The APR entered is {apr}. That is above the rough 6–8% range this tool uses as a labeled assumption, and it is at or below 10%. This is not a statement about credit standing.', ['apr']),
  FLAG_APR_VERY_HIGH: t('FLAG_APR_VERY_HIGH_ISSUE', 'The APR entered is {apr}, which is above 10%. That sits well outside the rough 6–8% range this tool uses as a labeled assumption. This is not a statement about credit standing.', ['apr']),
  FLAG_TERM_LONG: t('FLAG_TERM_LONG_ISSUE', 'The term entered is {termMonths} months. Terms of 72 months or more usually increase total interest compared with a shorter term.', ['termMonths']),
  FLAG_TERM_VERY_LONG: t('FLAG_TERM_VERY_LONG_ISSUE', 'The term entered is {termMonths} months. Terms of 84 months or more are the long band this tool uses and usually increase total interest.', ['termMonths']),
  FLAG_NEGATIVE_EQUITY: t('FLAG_NEGATIVE_EQUITY_ISSUE', 'The trade payoff is {negativeEquity} higher than the trade offer, using {dealerOffer} and {payoff}. A blank figure is treated as zero. The difference is often added to the amount financed.', ['negativeEquity', 'dealerOffer', 'payoff']),
  FLAG_MF_MARKUP: t('FLAG_MF_MARKUP_ISSUE', 'The money factor {moneyFactor} (about {mfApr}) is more than 0.00030 above the base money factor {buyRateMf} (about {buyRateApr}) you entered. This tool treats that gap as a markup. It is not a statement about credit standing.', ['moneyFactor', 'mfApr', 'buyRateMf', 'buyRateApr']),
  FLAG_MF_MARKUP_SMALL: t('FLAG_MF_MARKUP_SMALL_ISSUE', 'The money factor {moneyFactor} (about {mfApr}) is slightly above the base money factor {buyRateMf} (about {buyRateApr}) you entered. This tool flags the difference for review. It is not a statement about credit standing.', ['moneyFactor', 'mfApr', 'buyRateMf', 'buyRateApr']),
  FLAG_ACQ_FEE_HIGH: t('FLAG_ACQ_FEE_HIGH_ISSUE', 'The acquisition fee entered is {acquisitionFee}. Fees above $1,000 sit outside the range this tool treats as typical.', ['acquisitionFee']),
  FLAG_LOW_RESIDUAL: t('FLAG_LOW_RESIDUAL_ISSUE', 'The residual is {residualPct} of MSRP, which is under 45%. That is below the band this tool treats as common. Confirm the mileage limit, which changes the residual.', ['residualPct']),
  FLAG_RESIDUAL_SOFT: t('FLAG_RESIDUAL_SOFT_ISSUE', 'The residual is {residualPct} of MSRP, between 45% and 50%. That is the softer band this tool uses. Confirm the mileage limit, which changes the residual.', ['residualPct']),
  FLAG_LEASE_CAP_REDUCTION: t('FLAG_LEASE_CAP_REDUCTION_ISSUE', 'The cap cost reduction entered is {downPayment}. Money paid up front on a lease is at risk if the vehicle is stolen or totaled before the end of the lease.', ['downPayment']),
  FLAG_PRICE_ABOVE_MSRP: t('FLAG_PRICE_ABOVE_MSRP_ISSUE', 'The price entered is {sellingPrice}, which is above the MSRP of {msrp}.', ['sellingPrice', 'msrp']),
  FLAG_PRICE_AT_MSRP: t('FLAG_PRICE_AT_MSRP_ISSUE', 'The price entered is {sellingPrice}, within 1% of the MSRP of {msrp}. This tool treats that as little or no reduction from MSRP.', ['sellingPrice', 'msrp']),
  FLAG_GAP_HIGH: t('FLAG_GAP_HIGH_ISSUE', 'The GAP product entered is {gapAmount}. This tool treats dealer GAP prices above $400 and at or below $900 as outside its typical band.', ['gapAmount']),
  FLAG_GAP_VERY_HIGH: t('FLAG_GAP_VERY_HIGH_ISSUE', 'The GAP product entered is {gapAmount}. This tool treats dealer GAP prices above $900 as further outside its typical band.', ['gapAmount']),
  FLAG_WARRANTY_HIGH: t('FLAG_WARRANTY_HIGH_ISSUE', 'The service contract entered is {warrantyAmount}. This tool treats amounts above $2,500 as outside the band it uses for that product.', ['warrantyAmount']),
  FLAG_TIRE_HIGH: t('FLAG_TIRE_HIGH_ISSUE', 'The tire and wheel product entered is {tireAmount}. This tool treats amounts above $400 as outside its typical band.', ['tireAmount']),
  FLAG_PAINT_PRESENT: t('FLAG_PAINT_PRESENT_ISSUE', 'An appearance product of {paintAmount} was entered. This tool treats dealer appearance products as an item to review.', ['paintAmount']),
  FLAG_PAINT_HIGH: t('FLAG_PAINT_HIGH_ISSUE', 'The appearance product entered is {paintAmount}. Amounts of $500 or more sit further outside the band this tool uses.', ['paintAmount']),
  FLAG_INTEREST_HIGH: t('FLAG_INTEREST_HIGH_ISSUE', 'Total interest calculated from the figures entered is {totalInterest}, which is more than 20% of the vehicle price of {sellingPrice}.', ['totalInterest', 'sellingPrice']),
  FLAG_PAYMENT_MISMATCH: t('FLAG_PAYMENT_MISMATCH_ISSUE', 'The quoted payment of {monthlyPayment} differs from the calculated payment of {calculatedPayment} by {paymentGap}. Taxes or products that were not entered can explain a difference.', ['monthlyPayment', 'calculatedPayment', 'paymentGap']),
} as const satisfies Record<FlagId, Template>;

const action = {
  FLAG_DOC_FEE_HIGH: t('FLAG_DOC_FEE_HIGH_ACTION', 'You can ask for the documentation fee to be itemized and whether it can be reduced.'),
  FLAG_DOC_FEE_VERY_HIGH: t('FLAG_DOC_FEE_VERY_HIGH_ACTION', 'You can ask for the documentation fee to be itemized and whether it can be reduced.'),
  FLAG_APR_HIGH: t('FLAG_APR_HIGH_ACTION', 'You can ask the dealer to show this rate in writing. You can also compare it with your credit union\'s published rate.'),
  FLAG_APR_VERY_HIGH: t('FLAG_APR_VERY_HIGH_ACTION', 'You can ask the dealer to show this rate in writing. You can also compare it with your credit union\'s published rate.'),
  FLAG_TERM_LONG: t('FLAG_TERM_LONG_ACTION', 'You can ask to see total interest at this term and at a shorter term on the same amount financed.'),
  FLAG_TERM_VERY_LONG: t('FLAG_TERM_VERY_LONG_ACTION', 'You can ask to see total interest at this term and at a shorter term on the same amount financed.'),
  FLAG_NEGATIVE_EQUITY: t('FLAG_NEGATIVE_EQUITY_ACTION', 'You can ask for the trade offer, the payoff, and any amount added to the new financing to be shown on separate lines.'),
  FLAG_MF_MARKUP: t('FLAG_MF_MARKUP_ACTION', 'You can ask whether the money factor is the base rate and what the difference from the base figure pays for.'),
  FLAG_MF_MARKUP_SMALL: t('FLAG_MF_MARKUP_SMALL_ACTION', 'You can ask whether the money factor is the base rate and what the difference from the base figure pays for.'),
  FLAG_ACQ_FEE_HIGH: t('FLAG_ACQ_FEE_HIGH_ACTION', 'You can ask for the acquisition fee to be shown as its own line and how it affects the amount due.'),
  FLAG_LOW_RESIDUAL: t('FLAG_LOW_RESIDUAL_ACTION', 'You can ask for the residual in dollars and as a percent of MSRP, and which mileage limit was used.'),
  FLAG_RESIDUAL_SOFT: t('FLAG_RESIDUAL_SOFT_ACTION', 'You can ask for the residual in dollars and as a percent of MSRP, and which mileage limit was used.'),
  FLAG_LEASE_CAP_REDUCTION: t('FLAG_LEASE_CAP_REDUCTION_ACTION', 'You can ask what the payment would be with a smaller cap cost reduction, and whether the up-front amount is refundable.'),
  FLAG_PRICE_ABOVE_MSRP: t('FLAG_PRICE_ABOVE_MSRP_ACTION', 'You can ask the dealer to review the selling price against MSRP and to put any change in writing.'),
  FLAG_PRICE_AT_MSRP: t('FLAG_PRICE_AT_MSRP_ACTION', 'You can ask the dealer whether there is room between this price and MSRP, and to put any change in writing.'),
  FLAG_GAP_HIGH: t('FLAG_GAP_HIGH_ACTION', 'You can ask what the payment would be without this product, and whether your auto policy offers a similar option.'),
  FLAG_GAP_VERY_HIGH: t('FLAG_GAP_VERY_HIGH_ACTION', 'You can ask what the payment would be without this product, and whether your auto policy offers a similar option.'),
  FLAG_WARRANTY_HIGH: t('FLAG_WARRANTY_HIGH_ACTION', 'You can ask what the contract covers, what it excludes, and what the payment would be without it.'),
  FLAG_TIRE_HIGH: t('FLAG_TIRE_HIGH_ACTION', 'You can ask what the product covers and what the payment would be without it.'),
  FLAG_PAINT_PRESENT: t('FLAG_PAINT_PRESENT_ACTION', 'You can ask what the product covers and what the payment would be without it.'),
  FLAG_PAINT_HIGH: t('FLAG_PAINT_HIGH_ACTION', 'You can ask what the product covers and what the payment would be without it.'),
  FLAG_INTEREST_HIGH: t('FLAG_INTEREST_HIGH_ACTION', 'You can ask to see total interest at this rate and term, and at a shorter term.'),
  FLAG_PAYMENT_MISMATCH: t('FLAG_PAYMENT_MISMATCH_ACTION', 'You can ask the dealer which taxes, fees, or products make up the difference between the quoted payment and the figures on the worksheet.'),
} as const satisfies Record<FlagId, Template>;

export const FLAG_COPY: Record<FlagId, { issue: Template; action: Template }> = {
  FLAG_DOC_FEE_HIGH: { issue: issue.FLAG_DOC_FEE_HIGH, action: action.FLAG_DOC_FEE_HIGH },
  FLAG_DOC_FEE_VERY_HIGH: { issue: issue.FLAG_DOC_FEE_VERY_HIGH, action: action.FLAG_DOC_FEE_VERY_HIGH },
  FLAG_APR_HIGH: { issue: issue.FLAG_APR_HIGH, action: action.FLAG_APR_HIGH },
  FLAG_APR_VERY_HIGH: { issue: issue.FLAG_APR_VERY_HIGH, action: action.FLAG_APR_VERY_HIGH },
  FLAG_TERM_LONG: { issue: issue.FLAG_TERM_LONG, action: action.FLAG_TERM_LONG },
  FLAG_TERM_VERY_LONG: { issue: issue.FLAG_TERM_VERY_LONG, action: action.FLAG_TERM_VERY_LONG },
  FLAG_NEGATIVE_EQUITY: { issue: issue.FLAG_NEGATIVE_EQUITY, action: action.FLAG_NEGATIVE_EQUITY },
  FLAG_MF_MARKUP: { issue: issue.FLAG_MF_MARKUP, action: action.FLAG_MF_MARKUP },
  FLAG_MF_MARKUP_SMALL: { issue: issue.FLAG_MF_MARKUP_SMALL, action: action.FLAG_MF_MARKUP_SMALL },
  FLAG_ACQ_FEE_HIGH: { issue: issue.FLAG_ACQ_FEE_HIGH, action: action.FLAG_ACQ_FEE_HIGH },
  FLAG_LOW_RESIDUAL: { issue: issue.FLAG_LOW_RESIDUAL, action: action.FLAG_LOW_RESIDUAL },
  FLAG_RESIDUAL_SOFT: { issue: issue.FLAG_RESIDUAL_SOFT, action: action.FLAG_RESIDUAL_SOFT },
  FLAG_LEASE_CAP_REDUCTION: { issue: issue.FLAG_LEASE_CAP_REDUCTION, action: action.FLAG_LEASE_CAP_REDUCTION },
  FLAG_PRICE_ABOVE_MSRP: { issue: issue.FLAG_PRICE_ABOVE_MSRP, action: action.FLAG_PRICE_ABOVE_MSRP },
  FLAG_PRICE_AT_MSRP: { issue: issue.FLAG_PRICE_AT_MSRP, action: action.FLAG_PRICE_AT_MSRP },
  FLAG_GAP_HIGH: { issue: issue.FLAG_GAP_HIGH, action: action.FLAG_GAP_HIGH },
  FLAG_GAP_VERY_HIGH: { issue: issue.FLAG_GAP_VERY_HIGH, action: action.FLAG_GAP_VERY_HIGH },
  FLAG_WARRANTY_HIGH: { issue: issue.FLAG_WARRANTY_HIGH, action: action.FLAG_WARRANTY_HIGH },
  FLAG_TIRE_HIGH: { issue: issue.FLAG_TIRE_HIGH, action: action.FLAG_TIRE_HIGH },
  FLAG_PAINT_PRESENT: { issue: issue.FLAG_PAINT_PRESENT, action: action.FLAG_PAINT_PRESENT },
  FLAG_PAINT_HIGH: { issue: issue.FLAG_PAINT_HIGH, action: action.FLAG_PAINT_HIGH },
  FLAG_INTEREST_HIGH: { issue: issue.FLAG_INTEREST_HIGH, action: action.FLAG_INTEREST_HIGH },
  FLAG_PAYMENT_MISMATCH: { issue: issue.FLAG_PAYMENT_MISMATCH, action: action.FLAG_PAYMENT_MISMATCH },
};

export const ALL_TEMPLATES: Template[] = [
  ...Object.values(HEADLINES),
  ...Object.values(GRADE_EXPLANATIONS),
  ...Object.values(HOLDBACKS),
  ...Object.values(SUMMARIES),
  ...Object.values(RECOMMENDATION_LABELS),
  ...Object.values(QUESTIONS),
  ...Object.values(DISCLAIMERS),
  ...Object.values(STRUCTURE_NOTES),
  ...Object.values(TRADE),
  ...Object.values(TAX),
  ...Object.values(BREAKDOWN),
  ...Object.values(FLAG_COPY).flatMap(pair => [pair.issue, pair.action]),
];
