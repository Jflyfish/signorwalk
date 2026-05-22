import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const name = (formData.get('name') as string) || '';
    const email = (formData.get('email') as string) || '';
    const year = (formData.get('year') as string) || '';
    const make = (formData.get('make') as string) || '';
    const model = (formData.get('model') as string) || '';
    const trim = (formData.get('trim') as string) || '';
    const dealType = (formData.get('dealType') as string) || '';
    const state = (formData.get('state') as string) || '';
    const sellingPrice = (formData.get('sellingPrice') as string) || '';
    const monthlyPayment = (formData.get('monthlyPayment') as string) || '';
    const dealerResponse = (formData.get('dealerResponse') as string) || '';
    const visitCount = (formData.get('visitCount') as string) || '';
    const timeline = (formData.get('timeline') as string) || '';
    const hasTradeIn = formData.get('hasTradeIn') === 'yes';
    const tradeInVehicle = (formData.get('tradeInVehicle') as string) || '';
    const tradeInOffer = (formData.get('tradeInOffer') as string) || '';
    const tradeInPayoff = (formData.get('tradeInPayoff') as string) || '';
    const additionalNotes = (formData.get('additionalNotes') as string) || '';
    const file = formData.get('file') as File | null;

    const vehicle = [year, make, model, trim].filter(Boolean).join(' ') || 'Unknown vehicle';

    // Parse full calculator data if available
    const dealDataRaw = (formData.get('dealData') as string) || '';
    let dd: Record<string, unknown> = {};
    try { if (dealDataRaw) dd = JSON.parse(dealDataRaw); } catch { /* ignore */ }

    const $ = (v: unknown) => v && String(v).trim() ? `$${String(v).trim()}` : 'Not provided';
    const val = (v: unknown) => v && String(v).trim() ? String(v).trim() : 'Not provided';
    const pct = (v: unknown) => v && String(v).trim() ? `${String(v).trim()}%` : 'Not provided';

    // Build deal details section from full calculator data
    const dealType2 = (dd.dealType as string) || dealType || '';
    const leaseData = dd.lease as Record<string, string> | null;
    const financeData = dd.finance as Record<string, string> | null;
    const tradeInData = dd.tradeIn as Record<string, string> | null;
    const bundledData = dd.bundled as Record<string, string> | null;

    const dealLines: string[] = ['DEAL DETAILS FROM CALCULATOR', '================================'];

    if (dealType2 === 'lease' && leaseData) {
      const mf = leaseData.moneyFactor || '';
      const mfApr = mf && parseFloat(mf) > 0 ? ` → ${(parseFloat(mf) * 2400).toFixed(2)}% APR` : '';
      const resPct = leaseData.residualPercent;
      const resDol = leaseData.residualDollar;
      const residual = resPct ? `${resPct}%${resDol ? ` / $${resDol}` : ''}` : resDol ? `$${resDol}` : 'Not provided';
      dealLines.push(
        `Deal type: Lease`,
        `Vehicle: ${[leaseData.vehicleYear, leaseData.vehicleMake, leaseData.vehicleModel, leaseData.vehicleTrim].filter(Boolean).join(' ') || val(vehicle)}`,
        `State: ${val(dd.state)}`,
        `MSRP: ${$(leaseData.msrp)}`,
        `Selling price (cap cost): ${$(leaseData.sellingPrice)}`,
        `Money factor: ${val(mf)}${mfApr}`,
        `Residual: ${residual}`,
        `Lease term: ${val(leaseData.leaseTerm)} months`,
        `Miles/year: ${val(leaseData.milesPerYear)}`,
        `Monthly payment: ${$(leaseData.monthlyPayment)}`,
        `Cap cost reduction (down): ${$(leaseData.capCostReduction)}`,
        `Drive-off due at signing: ${$(leaseData.driveOff)}`,
        `Acquisition fee: ${$(leaseData.acquisitionFee)}`,
        `Disposition fee: ${$(leaseData.dispositionFee)}`,
        `Doc fee: ${$(leaseData.docFee)}`,
      );
    } else if (dealType2 === 'finance' && financeData) {
      dealLines.push(
        `Deal type: Finance / Buy`,
        `Vehicle: ${[financeData.vehicleYear, financeData.vehicleMake, financeData.vehicleModel, financeData.vehicleTrim].filter(Boolean).join(' ') || val(vehicle)}`,
        `State: ${val(dd.state)}`,
        `MSRP: ${$(financeData.msrp)}`,
        `Negotiated price: ${$(financeData.negotiatedPrice)}`,
        `Down payment: ${$(financeData.downPayment)}`,
        `APR: ${pct(financeData.apr)}`,
        `Loan term: ${val(financeData.loanTerm)} months`,
        `Monthly payment: ${$(financeData.monthlyPayment)}`,
        `Amount financed: ${$(financeData.amountFinanced)}`,
        `Out-the-door price: ${$(financeData.outTheDoorPrice)}`,
        `Doc fee: ${$(financeData.docFee)}`,
        `Vehicle mileage: ${financeData.vehicleMileage ? `${financeData.vehicleMileage} miles` : 'Not provided (new vehicle)'}`,
      );
    } else {
      // Fallback to basic fields
      dealLines.push(
        `Deal type: ${val(dealType)}`,
        `Vehicle: ${vehicle}`,
        `State: ${val(state)}`,
        `Selling price: ${$(sellingPrice)}`,
        `Monthly payment: ${$(monthlyPayment)}`,
      );
    }

    if (dd.paymentRange && typeof dd.paymentRange === 'object') {
      const pr = dd.paymentRange as { low: string; high: string };
      if (pr.low || pr.high) dealLines.push(`Payment range quoted: $${pr.low}–$${pr.high}`);
    }

    if (dd.grade) dealLines.push(`AI grade: ${String(dd.grade)} — "${val(dd.headline)}"`);
    if (dd.notes && String(dd.notes).trim()) dealLines.push(`Buyer notes from calculator: ${String(dd.notes).trim()}`);

    dealLines.push('================================');

    // Trade-in section
    const tradeInLines: string[] = [];
    if (tradeInData || hasTradeIn) {
      tradeInLines.push('TRADE-IN', '================================');
      if (tradeInData) {
        tradeInLines.push(
          `Vehicle: ${[tradeInData.year, tradeInData.make, tradeInData.model].filter(Boolean).join(' ') || tradeInVehicle || 'Not specified'}`,
          `Mileage: ${tradeInData.mileage ? `${tradeInData.mileage} miles` : 'Not provided'}`,
          `Condition: ${val(tradeInData.condition)}`,
          `Dealer offer: ${$(tradeInData.dealerOffer)}`,
          `Amount owed (payoff): ${$(tradeInData.payoffAmount)}`,
          `KBB estimate: ${$(tradeInData.kbbEstimate)}`,
          `Known issues: ${val(tradeInData.knownIssues) || 'None reported'}`,
        );
      } else {
        tradeInLines.push(
          `Vehicle: ${tradeInVehicle || 'Not specified'}`,
          `Dealer offer: ${$(tradeInOffer)}`,
          `Amount owed: ${$(tradeInPayoff)}`,
        );
      }
      tradeInLines.push('================================');
    }

    // Bundled costs section
    const bundledLines: string[] = [];
    if (bundledData && dd.hasBundled) {
      bundledLines.push('BUNDLED / ADD-ON PRODUCTS', '================================');
      if (bundledData.extendedWarranty) bundledLines.push(`Extended warranty: $${bundledData.extendedWarranty}`);
      if (bundledData.gapInsurance) bundledLines.push(`GAP insurance: $${bundledData.gapInsurance}`);
      if (bundledData.tireWheelProtection) bundledLines.push(`Tire & wheel protection: $${bundledData.tireWheelProtection}`);
      if (bundledData.paintInteriorProtection) bundledLines.push(`Paint/interior protection: $${bundledData.paintInteriorProtection}`);
      if (bundledData.otherAmount && bundledData.otherLabel) bundledLines.push(`${bundledData.otherLabel}: $${bundledData.otherAmount}`);
      bundledLines.push('================================');
    }

    const emailText = [
      'NEW DEAL REVIEW REQUEST',
      '================================',
      `Name: ${name}`,
      `Email: ${email}`,
      '================================',
      ...dealLines,
      ...tradeInLines,
      ...bundledLines,
      'NEGOTIATION CONTEXT',
      '================================',
      `Dealer response to negotiation: ${dealerResponse || 'Not provided'}`,
      `Dealership visits: ${visitCount || 'Not provided'}`,
      `Decision timeline: ${timeline || 'Not provided'}`,
      '================================',
      'ADDITIONAL NOTES:',
      additionalNotes || 'None',
      '================================',
    ].join('\n');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const attachments: any[] = [];
    if (file && file.size > 0) {
      const buffer = await file.arrayBuffer();
      attachments.push({
        filename: file.name || 'dealer-quote',
        content: Buffer.from(buffer),
      });
    }

    await resend.emails.send({
      from: 'Sign or Walk <noreply@signorwalk.com>',
      to: process.env.SUPPORT_EMAIL || 'team@signorwalk.com',
      replyTo: email || undefined,
      subject: `Deal Review — ${name} — ${vehicle} — ${state || 'Unknown state'}`,
      text: emailText,
      ...(attachments.length > 0 && { attachments }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Negotiation support error:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit. Please try again.' }, { status: 500 });
  }
}
