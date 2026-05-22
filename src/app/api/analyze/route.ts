import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { AnalysisRequest, BundledCosts } from '@/lib/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function fmt(n: number | string) {
  const num = typeof n === 'string' ? parseFloat(n) : n;
  return isNaN(num) ? '0' : num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function fmtDec(n: number) {
  return isNaN(n) ? '0' : n.toFixed(2);
}

function bundledSection(b: BundledCosts | undefined): string {
  if (!b) return '';
  const items: string[] = [];
  const ew = parseFloat(b.extendedWarranty || '0');
  const gap = parseFloat(b.gapInsurance || '0');
  const tw = parseFloat(b.tireWheelProtection || '0');
  const pi = parseFloat(b.paintInteriorProtection || '0');
  const other = parseFloat(b.otherAmount || '0');

  if (ew > 0) items.push(
    `- Extended warranty/service contract: $${fmt(ew)}\n  Market context: Quality 3rd-party coverage runs $800–2,500 for 5-7yr; dealer plans often cost more for similar coverage. Assess if price is in range and explain the value trade-off (covers major mechanical failures, but check deductible and what's excluded).`
  );
  if (gap > 0) items.push(
    `- GAP insurance: $${fmt(gap)}\n  Market context: Dealers charge $400–900; the buyer's own auto insurer typically charges $20–60/yr (about $100–300 total for a 5yr loan). This is almost always a major profit center for dealers — flag it as bad unless the buyer has no other option. Value: covers loan balance if car is totaled and is worth less than what's owed.`
  );
  if (tw > 0) items.push(
    `- Tire & wheel protection: $${fmt(tw)}\n  Market context: Fair range is $150–400; only genuinely useful in pothole-heavy areas or if buyer drives a lot of curbs. Value: limited — assess if price is reasonable.`
  );
  if (pi > 0) items.push(
    `- Paint/interior protection: $${fmt(pi)}\n  Market context: Rarely worth the dealer price ($500–2,000). Consumer products (ceramic spray, fabric protector) cost $30–80 and work just as well. Flag as bad almost always.`
  );
  if (other > 0 && b.otherLabel) items.push(
    `- ${b.otherLabel}: $${fmt(other)}\n  Assess whether this seems like fair value or a profit add-on.`
  );

  if (!items.length) return '';
  return `\nBUNDLED PRODUCTS ROLLED INTO PAYMENT — assess each one:
${items.join('\n')}
Include each bundled item as a breakdown row. Assess fairness vs. market rates and note the real value (or lack of it) the buyer gets. Add to redFlags if any are significantly overpriced.`;
}

function buildPrompt(data: AnalysisRequest): string {
  const { dealType, state } = data;

  // ── Trade-in math ──────────────────────────────────────────────────────────
  const hasTrade = !!data.tradeIn && !!data.tradeIn.dealerOffer;
  const dealerOffer = hasTrade ? parseFloat(data.tradeIn!.dealerOffer || '0') : 0;
  const payoffAmount = hasTrade ? parseFloat(data.tradeIn!.payoffAmount || '0') : 0;
  const netTradeIn = dealerOffer - payoffAmount;
  const isUpsideDown = hasTrade && netTradeIn < 0;

  let vehicleInfo = 'Vehicle not specified';
  let dealDetails = '';

  // ── Lease ──────────────────────────────────────────────────────────────────
  if (dealType === 'lease' && data.lease) {
    const l = data.lease;
    vehicleInfo = [l.vehicleYear, l.vehicleMake, l.vehicleModel, l.vehicleTrim].filter(Boolean).join(' ') || 'Vehicle not fully specified';

    const rebates = parseFloat(l.rebates || '0');
    const mf = parseFloat(l.moneyFactor || '0');
    const mfApr = mf > 0 ? (mf * 2400).toFixed(2) : 'N/A';
    const resPct = parseFloat(l.residualPercent || '0');
    const resDol = parseFloat(l.residualDollar || '0') || (parseFloat(l.msrp || '0') * resPct / 100);
    const docFee = parseFloat(l.docFee || '0');
    const effectiveDriveOff = parseFloat(l.driveOff || '0');
    const capCostReduction = parseFloat(l.capCostReduction || '0');
    const tradeCapReduction = hasTrade ? Math.max(netTradeIn, 0) : 0;
    const totalCapReduction = capCostReduction + tradeCapReduction;
    const mp = parseFloat(l.monthlyPayment || '0');
    const term = parseFloat(l.leaseTerm || '36');
    const acq = parseFloat(l.acquisitionFee || '0');
    const adjCapCost = resDol > 0 ? (parseFloat(l.sellingPrice || '0') + acq + docFee - totalCapReduction) : 0;

    dealDetails = `
MSRP: ${l.msrp ? '$' + fmt(l.msrp) : 'not provided'}
Selling Price (cap cost before adjustments): ${l.sellingPrice ? '$' + fmt(l.sellingPrice) : 'not provided'}
Manufacturer rebates/incentives: ${rebates > 0 ? '$' + fmt(rebates) + ' (applied as cap cost reduction — verify buyer qualifies)' : 'none reported'}
Money Factor: ${l.moneyFactor || 'not provided'}${mf > 0 ? ` → ${mfApr}% APR equivalent` : ''}
Residual: ${resPct > 0 ? resPct + '%' : ''}${resDol > 0 ? ' = $' + fmt(resDol) : resPct === 0 ? 'not provided' : ''}
Term: ${l.leaseTerm || '36'} months
Monthly payment: ${mp > 0 ? '$' + fmt(mp) : 'not provided'}${data.paymentRange ? ` (dealer quoted range: $${data.paymentRange.low}–$${data.paymentRange.high})` : ''}
Cap cost reduction (down payment on lease): ${capCostReduction > 0 ? '$' + fmt(capCostReduction) : 'none'}
Due at signing / drive-off: ${effectiveDriveOff > 0 ? '$' + fmt(effectiveDriveOff) : 'not provided'}${hasTrade && tradeCapReduction > 0 ? ` (trade-in applies $${fmt(tradeCapReduction)} as additional cap reduction)` : ''}
Adjusted cap cost (after reductions): ${adjCapCost > 0 ? '$' + fmt(adjCapCost) : 'cannot calculate — missing inputs'}
Acquisition fee: ${l.acquisitionFee ? '$' + fmt(l.acquisitionFee) : 'not provided'}
Disposition fee: ${l.dispositionFee ? '$' + fmt(l.dispositionFee) : 'not provided'}
Miles/year: ${l.milesPerYear || '12,000 (assumed)'}
Doc fee: ${docFee > 0 ? '$' + fmt(docFee) + (docFee > 500 ? ' ← HIGH (above $500 is mostly dealer profit)' : '') : 'not provided'}
Total lease cost: ${mp > 0 && term > 0 ? '$' + fmt(mp * term + effectiveDriveOff) : 'cannot calculate — payment not provided'}`;
  }

  // ── Finance ────────────────────────────────────────────────────────────────
  if (dealType === 'finance' && data.finance) {
    const f = data.finance;
    vehicleInfo = [f.vehicleYear, f.vehicleMake, f.vehicleModel, f.vehicleTrim].filter(Boolean).join(' ') || 'Vehicle not fully specified';

    const docFee = parseFloat(f.docFee || '0');
    const financeRebates = parseFloat(f.rebates || '0');
    const cashDown = parseFloat(f.downPayment || '0');
    const effectiveDown = cashDown + (hasTrade ? netTradeIn : 0);
    const price = parseFloat(f.negotiatedPrice || '0');
    const msrp = parseFloat(f.msrp || '0');
    const discountPct = price > 0 && msrp > 0 ? ((1 - price / msrp) * 100).toFixed(1) : null;
    const loanAmount = price > 0 ? price - effectiveDown + docFee : 0;
    const apr = parseFloat(f.apr || '0');
    const term = parseFloat(f.loanTerm || '60');
    const r = apr / 100 / 12;
    const calcPayment = loanAmount > 0 && r > 0 && term > 0
      ? (loanAmount * r * Math.pow(1 + r, term)) / (Math.pow(1 + r, term) - 1)
      : loanAmount > 0 && term > 0 ? loanAmount / term : 0;
    const totalInterest = calcPayment > 0 ? Math.max(calcPayment * term - loanAmount, 0) : 0;

    const amtFinancedFromContract = parseFloat(f.amountFinanced || '0');

    dealDetails = `
MSRP: ${f.msrp ? '$' + fmt(f.msrp) : 'not provided'}
Negotiated price: ${price > 0 ? '$' + fmt(price) + (discountPct ? ` (${discountPct}% off MSRP)` : '') : 'not provided'}
Manufacturer rebates/incentives: ${financeRebates > 0 ? '$' + fmt(financeRebates) + ' (applied to reduce purchase price — verify buyer qualifies)' : 'none reported'}
Cash down payment: ${cashDown > 0 ? '$' + fmt(cashDown) : 'not provided'}${hasTrade ? `
Dealer trade-in offer: $${fmt(dealerOffer)}
Trade-in payoff owed: $${fmt(payoffAmount)}
Net trade-in value: $${fmt(netTradeIn)}${isUpsideDown ? ' ← UPSIDE DOWN (negative equity rolls into loan)' : ''}
Effective down payment (cash + net trade-in): $${fmt(effectiveDown)}` : ''}
Doc fee: ${docFee > 0 ? '$' + fmt(docFee) + (docFee > 500 ? ' ← HIGH (above $500 is mostly dealer profit)' : '') : 'not provided'}
Amount financed (from contract): ${amtFinancedFromContract > 0 ? '$' + fmt(amtFinancedFromContract) : 'not provided — calculated as $' + fmt(loanAmount)}
APR: ${f.apr ? f.apr + '%' : 'not provided'}
Loan term: ${f.loanTerm || 'not provided'} months
Quoted monthly payment: ${f.monthlyPayment ? '$' + fmt(f.monthlyPayment) : 'not provided'}${data.paymentRange ? ` (range: $${data.paymentRange.low}–$${data.paymentRange.high})` : ''}
Calculated monthly payment: ${calcPayment > 0 ? '$' + fmtDec(calcPayment) : 'cannot calculate — missing inputs'}
Total interest over loan: ${totalInterest > 0 ? '$' + fmt(totalInterest) : 'cannot calculate'}
Out-the-door price: ${f.outTheDoorPrice ? '$' + fmt(f.outTheDoorPrice) : 'not provided'}
${f.vehicleMileage ? `Vehicle mileage (used vehicle): ${fmt(f.vehicleMileage)} miles` : ''}`;
  }

  // ── Trade-in section ───────────────────────────────────────────────────────
  let tradeInSection = '';
  if (hasTrade && data.tradeIn) {
    const t = data.tradeIn;
    const kbb = parseFloat(t.kbbEstimate || '0');
    const gapVsKbb = kbb > 0 ? kbb - dealerOffer : 0;
    const gapPct = kbb > 0 ? ((gapVsKbb / kbb) * 100).toFixed(0) : '0';
    tradeInSection = `
TRADE-IN:
Vehicle: ${[t.year, t.make, t.model].filter(Boolean).join(' ') || 'not specified'}
Mileage: ${t.mileage ? fmt(t.mileage) + ' miles' : 'not provided'}
Condition: ${t.condition}
Dealer offer: $${fmt(dealerOffer)}
Amount still owed (payoff): $${fmt(payoffAmount)}
Net trade-in value: $${fmt(netTradeIn)}${isUpsideDown ? ` — UPSIDE DOWN by $${fmt(Math.abs(netTradeIn))}` : ''}
KBB estimate: ${kbb > 0 ? '$' + fmt(kbb) : 'not provided'}${kbb > 0 ? `\nGap vs KBB: $${fmt(gapVsKbb)} (${gapPct}% below estimate)` : ''}
Known issues: ${t.knownIssues || 'none reported'}

NOTE: The trade-in TAX CREDIT in most states is applied to the full dealer offer ($${fmt(dealerOffer)}), not the net value. Factor this into state-specific tax savings.`;
  }

  // ── Notes ─────────────────────────────────────────────────────────────────
  const notesSection = data.notes?.trim()
    ? `\nBUYER NOTES (provided by user — factor into your analysis):\n${data.notes.trim()}`
    : '';

  // ── Payment range ──────────────────────────────────────────────────────────
  const paymentRangeNote = data.paymentRange
    ? `\nPAYMENT RANGE: Dealer quoted $${data.paymentRange.low}–$${data.paymentRange.high}. Analyze both ends. A spread over $50/month on a known deal structure is suspicious — flag it if so.`
    : '';

  // ── Payment gap ────────────────────────────────────────────────────────────
  const paymentGapNote = data.paymentGap !== undefined && data.paymentGap !== null
    ? `\nPAYMENT MATH CHECK (pre-calculated client-side):
Gap between quoted payment and mathematical expectation: ${data.paymentGap >= 0 ? '+' : ''}$${fmtDec(data.paymentGap)} (${data.paymentGap > 0 ? 'quoted is HIGHER than math explains' : 'quoted is lower than math — verify inputs'})
Include "paymentGapExplanation" in your JSON: 1-2 plain-English sentences specific to this deal explaining what most likely accounts for this difference (e.g., taxes rolled in, MF markup, bundled add-ons, doc fee, first/last month's payment, etc.). If gap is small or zero, you can omit or set to null.`
    : '';

  return `You are a trusted friend who knows everything about car deals. Give honest, plain-English advice — like explaining it over coffee. Direct, warm, specific. Protect people from being taken advantage of.

DEAL TYPE: ${dealType.toUpperCase()}
VEHICLE: ${vehicleInfo}
STATE: ${state}

DEAL DETAILS:${dealDetails}
${tradeInSection}
${bundledSection(data.bundledCosts)}
${paymentRangeNote}
${paymentGapNote}

${notesSection}
REBATE GUIDANCE: If manufacturer rebates are $500 or more, include a red flag or breakdown note reminding the buyer to confirm they qualify. Common conditions: financing through the manufacturer's captive lender, loyalty (current owner of same brand), conquest (switching from a competitor), military service, recent college graduate, specific trim level, or minimum credit score. If they don't qualify, the rebate disappears and the deal changes significantly.

MISSING DATA GUIDANCE — CRITICAL:
- Missing fields are NOT red flags and must NEVER lower the grade on their own.
- When a field is missing, assume a reasonable market-average value and say so briefly. Examples:
  - Missing APR → assume current average for buyer's likely credit tier (~7% for finance, note assumption)
  - Missing doc fee → assume $300–400 (typical average), do not flag as an issue
  - Missing residual → assume 50% for a 36-month lease on a mainstream vehicle
  - Missing acquisition fee → assume $695 (industry standard), do not flag
  - Missing mileage → assume 12,000/yr standard
  - Missing MSRP → estimate from selling price context
- Only grade and flag what the buyer actually provided. Incomplete data = lower confidence in the analysis, not a worse deal.
- If fewer than 3 fields are provided total, note you need more info but still give a directional grade.
- Never include a red flag for a field that wasn't provided.

OUTPUT RULES:
1. "headline": Max 12 words, punchy, no hedging.
2. "gradeExplanation": One coach-style sentence ("You're leaving money on the table — and the fix is a single conversation.").
3. "summary": 2-3 plain sentences. Lead with the most important thing. Note any missing data affecting confidence.
4. "breakdown": Include deal metrics PLUS one row per bundled product (if any). Max 8 rows total. Each "explanation" = one plain sentence explaining WHY it matters. No jargon without a parenthetical.
5. "redFlags": Max 3. "issue" = one plain sentence. "fix" = one specific actionable sentence starting with "Ask them..." or "Tell the dealer...".
6. "counterOfferScript": 2-3 sentences, calm and specific, word-for-word ready. Start: "Say this at the dealer's desk: '..."
7. "paymentGapExplanation": 1-2 plain sentences if a payment gap was provided and is significant. Null if no gap or negligible.
8. Tone: honest friend, not analyst. Short sentences. Active voice.

GRADING:
A = Great deal, sign now
B = Good deal, minor tweaks possible
C = Mediocre — negotiate before signing
D = Bad deal — push back hard
F = Walk away — you're being taken advantage of

${dealType === 'lease' ? `LEASE BENCHMARKS:
- MF at buy rate = good; markup >0.0003 = bad
- Residual 50%+ (36mo) = great; 45-50% = ok; <45% = poor
- Selling price below MSRP = baseline; below invoice = great
- Acquisition fee $595-895 = normal; >$1,000 = flag
- Doc fee >$500 = high; >$800 = very high` : `FINANCE BENCHMARKS:
- Discount off MSRP: 0% = bad; 3-5% = average; 6%+ = good
- APR 2025: 6-7% = average; >8% = high; >10% = walk
- Loan term: 60mo = standard; 72mo = ok; 84mo = expensive trap
- Doc fee >$500 = high; >$800 = very high
- Total interest >20% of vehicle price = expensive`}

Respond with ONLY a valid JSON object — no markdown, no code blocks:
{
  "grade": "C",
  "headline": "You're paying a marked-up rate and don't have to",
  "gradeExplanation": "This deal is mediocre dressed up as good — one conversation can fix it.",
  "summary": "The car price is fine, but the dealer inflated your interest rate to pocket extra profit. That's the main thing to fix before you sign anything.",
  "recommendation": "negotiate",
  "leaseVsBuy": { "recommendation": "lease", "reasoning": "Specific one-sentence reason." },
  "breakdown": [
    { "label": "Money Factor", "value": "0.00189 (4.54% APR)", "status": "warn", "explanation": "The manufacturer's standard rate is lower — the dealer added markup here, costing you extra every month without telling you." }
  ],
  "tradeIn": ${hasTrade ? '{ "assessment": "warn", "headline": "Dealer is below market value", "details": "Two sentences max." }' : 'null'},
  "stateTaxCredit": { "hasCredit": true, "details": "Plain English on ${state} trade-in tax credit rules with rough dollar estimate." },
  "redFlags": [{ "issue": "Plain sentence.", "fix": "Ask them to do X specifically." }],
  "teaserHint": "One teaser sentence hinting at the biggest issue without revealing it.",
  "counterOfferScript": "Say this at the dealer's desk: 'I've looked at the numbers and...'",
  "paymentGapExplanation": null
}`;
}

export async function POST(req: NextRequest) {
  try {
    const data: AnalysisRequest = await req.json();

    if (!data.dealType || !data.state) {
      return NextResponse.json({ success: false, error: 'Please select your deal type and state.' }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      temperature: 0.3,
      system: 'You are a trusted automotive advisor. Respond with valid JSON only — no markdown, no code blocks. Keep all text fields concise and conversational. Never fabricate numbers not present in the input.',
      messages: [{ role: 'user', content: buildPrompt(data) }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected AI response type');

    let analysis;
    try {
      analysis = JSON.parse(content.text);
    } catch {
      const match = content.text.match(/\{[\s\S]*\}/);
      if (match) analysis = JSON.parse(match[0]);
      else throw new Error('Could not parse AI response');
    }

    if (Array.isArray(analysis.redFlags) && typeof analysis.redFlags[0] === 'string') {
      analysis.redFlags = (analysis.redFlags as string[]).map((s: string) => ({ issue: s, fix: '' }));
    }

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ success: false, error: 'Failed to analyze deal. Please try again.' }, { status: 500 });
  }
}
