export interface StateTaxInfo {
  salesTaxRate: number; // percentage, e.g. 6.5
  tradeInCredit: boolean; // state reduces taxable sale price by trade-in value
  avgTitleReg: number; // rough dollar estimate for title + registration
  notes?: string;
}

export const STATE_TAX_DATA: Record<string, StateTaxInfo> = {
  AL: { salesTaxRate: 4.0,  tradeInCredit: true,  avgTitleReg: 400 },
  AK: { salesTaxRate: 0.0,  tradeInCredit: false, avgTitleReg: 150 },
  AZ: { salesTaxRate: 5.6,  tradeInCredit: true,  avgTitleReg: 350 },
  AR: { salesTaxRate: 6.5,  tradeInCredit: true,  avgTitleReg: 300 },
  CA: { salesTaxRate: 7.25, tradeInCredit: false, avgTitleReg: 500, notes: 'No trade-in tax credit in CA' },
  CO: { salesTaxRate: 2.9,  tradeInCredit: true,  avgTitleReg: 450 },
  CT: { salesTaxRate: 6.35, tradeInCredit: true,  avgTitleReg: 350 },
  DE: { salesTaxRate: 0.0,  tradeInCredit: false, avgTitleReg: 200, notes: 'No sales tax in DE' },
  FL: { salesTaxRate: 6.0,  tradeInCredit: true,  avgTitleReg: 500 },
  GA: { salesTaxRate: 7.0,  tradeInCredit: true,  avgTitleReg: 250, notes: 'GA uses TAVT (title ad valorem tax) instead of sales tax' },
  HI: { salesTaxRate: 4.0,  tradeInCredit: false, avgTitleReg: 250 },
  ID: { salesTaxRate: 6.0,  tradeInCredit: true,  avgTitleReg: 300 },
  IL: { salesTaxRate: 6.25, tradeInCredit: true,  avgTitleReg: 350 },
  IN: { salesTaxRate: 7.0,  tradeInCredit: true,  avgTitleReg: 300 },
  IA: { salesTaxRate: 5.0,  tradeInCredit: true,  avgTitleReg: 350 },
  KS: { salesTaxRate: 6.5,  tradeInCredit: false, avgTitleReg: 300, notes: 'No trade-in credit in KS' },
  KY: { salesTaxRate: 6.0,  tradeInCredit: true,  avgTitleReg: 250 },
  LA: { salesTaxRate: 4.45, tradeInCredit: true,  avgTitleReg: 350 },
  ME: { salesTaxRate: 5.5,  tradeInCredit: true,  avgTitleReg: 300 },
  MD: { salesTaxRate: 6.0,  tradeInCredit: true,  avgTitleReg: 350 },
  MA: { salesTaxRate: 6.25, tradeInCredit: false, avgTitleReg: 400, notes: 'No trade-in credit in MA' },
  MI: { salesTaxRate: 6.0,  tradeInCredit: true,  avgTitleReg: 300 },
  MN: { salesTaxRate: 6.5,  tradeInCredit: false, avgTitleReg: 400, notes: 'No trade-in credit in MN' },
  MS: { salesTaxRate: 5.0,  tradeInCredit: true,  avgTitleReg: 250 },
  MO: { salesTaxRate: 4.225,tradeInCredit: true,  avgTitleReg: 300 },
  MT: { salesTaxRate: 0.0,  tradeInCredit: false, avgTitleReg: 250, notes: 'No sales tax in MT' },
  NE: { salesTaxRate: 5.5,  tradeInCredit: true,  avgTitleReg: 300 },
  NV: { salesTaxRate: 6.85, tradeInCredit: false, avgTitleReg: 400, notes: 'No trade-in credit in NV' },
  NH: { salesTaxRate: 0.0,  tradeInCredit: false, avgTitleReg: 200, notes: 'No sales tax in NH' },
  NJ: { salesTaxRate: 6.625,tradeInCredit: true,  avgTitleReg: 350 },
  NM: { salesTaxRate: 5.0,  tradeInCredit: true,  avgTitleReg: 300 },
  NY: { salesTaxRate: 4.0,  tradeInCredit: true,  avgTitleReg: 500, notes: 'NYC adds local tax — total can reach 8.875%' },
  NC: { salesTaxRate: 3.0,  tradeInCredit: false, avgTitleReg: 300, notes: 'No trade-in credit in NC; capped at $500 highway use tax' },
  ND: { salesTaxRate: 5.0,  tradeInCredit: true,  avgTitleReg: 250 },
  OH: { salesTaxRate: 5.75, tradeInCredit: true,  avgTitleReg: 350 },
  OK: { salesTaxRate: 4.5,  tradeInCredit: true,  avgTitleReg: 300 },
  OR: { salesTaxRate: 0.0,  tradeInCredit: false, avgTitleReg: 250, notes: 'No sales tax in OR' },
  PA: { salesTaxRate: 6.0,  tradeInCredit: true,  avgTitleReg: 350 },
  RI: { salesTaxRate: 7.0,  tradeInCredit: true,  avgTitleReg: 300 },
  SC: { salesTaxRate: 5.0,  tradeInCredit: true,  avgTitleReg: 250, notes: 'SC caps sales tax at $500' },
  SD: { salesTaxRate: 4.0,  tradeInCredit: false, avgTitleReg: 250 },
  TN: { salesTaxRate: 7.0,  tradeInCredit: true,  avgTitleReg: 300 },
  TX: { salesTaxRate: 6.25, tradeInCredit: true,  avgTitleReg: 400 },
  UT: { salesTaxRate: 6.1,  tradeInCredit: true,  avgTitleReg: 350 },
  VT: { salesTaxRate: 6.0,  tradeInCredit: true,  avgTitleReg: 300 },
  VA: { salesTaxRate: 4.15, tradeInCredit: true,  avgTitleReg: 350, notes: 'VA charges 4.15% sales tax + personal property tax' },
  WA: { salesTaxRate: 6.5,  tradeInCredit: false, avgTitleReg: 450, notes: 'No trade-in credit in WA; Seattle area adds local taxes' },
  WV: { salesTaxRate: 6.0,  tradeInCredit: true,  avgTitleReg: 300 },
  WI: { salesTaxRate: 5.0,  tradeInCredit: true,  avgTitleReg: 300 },
  WY: { salesTaxRate: 4.0,  tradeInCredit: true,  avgTitleReg: 250 },
  DC: { salesTaxRate: 6.0,  tradeInCredit: false, avgTitleReg: 350, notes: 'No trade-in credit in DC' },
};

export function calcOtdEstimate(params: {
  negotiatedPrice: number;
  tradeInOffer: number;
  state: string;
  docFee: number;
}) {
  const { negotiatedPrice, tradeInOffer, state, docFee } = params;
  const taxInfo = STATE_TAX_DATA[state];
  if (!taxInfo || negotiatedPrice <= 0) return null;

  const taxableBase = taxInfo.tradeInCredit
    ? Math.max(negotiatedPrice - tradeInOffer, 0)
    : negotiatedPrice;

  const salesTax = taxableBase * (taxInfo.salesTaxRate / 100);
  const titleReg = taxInfo.avgTitleReg;
  const total = negotiatedPrice + salesTax + titleReg + docFee - tradeInOffer;

  return {
    negotiatedPrice,
    taxableBase,
    salesTaxRate: taxInfo.salesTaxRate,
    salesTax,
    titleReg,
    docFee,
    tradeInOffer,
    tradeInCredit: taxInfo.tradeInCredit,
    estimatedTotal: Math.max(total, 0),
    notes: taxInfo.notes,
  };
}
