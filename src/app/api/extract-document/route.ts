import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const EXTRACTION_PROMPT = `You are analyzing a car deal document, dealer worksheet, buyer's order, lease agreement, or vehicle listing photo. Extract every piece of information visible.

Return ONLY a JSON object with these exact fields — use null for anything not found or not visible:

{
  "dealType": "lease" or "finance" or null,
  "year": number or null,
  "make": string or null,
  "model": string or null,
  "trim": string or null,
  "msrp": number or null,
  "sellingPrice": number or null,
  "mileage": number or null,
  "state": string or null,
  "docFee": number or null,
  "salesTax": number or null,
  "titleAndReg": number or null,
  "totalFees": number or null,
  "downPayment": number or null,
  "tradeInValue": number or null,
  "tradeInPayoff": number or null,
  "netTradeIn": number or null,
  "outTheDoor": number or null,
  "amountFinanced": number or null,
  "monthlyPayment": number or null,
  "loanTerm": number or null,
  "apr": number or null,
  "moneyFactor": number or null,
  "residualValue": number or null,
  "residualPercent": number or null,
  "leaseTerm": number or null,
  "annualMiles": number or null,
  "dueAtSigning": number or null,
  "capCostReduction": number or null,
  "acquisitionFee": number or null,
  "gapInsurance": number or null,
  "extendedWarranty": number or null,
  "tireAndWheel": number or null,
  "paintProtection": number or null,
  "addOns": string or null,
  "dealerName": string or null,
  "stockNumber": string or null
}

For dealType: if you see words like "lease", "monthly lease payment", "money factor", "residual" — return "lease". If you see "finance", "APR", "loan", "amount financed" — return "finance".

For state: return the 2-letter state abbreviation if visible (e.g. "CA", "TX", "NY").

Be aggressive about extracting numbers — if a number appears next to a relevant label, extract it even if formatting is unusual. Strip $ signs and commas from numbers.

Return ONLY the JSON object. No explanation.`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided.' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'File is too large. Maximum 10MB.' }, { status: 400 });
    }

    const mimeType = file.type.toLowerCase().split(';')[0].trim();
    const isImage = ALLOWED_IMAGE_TYPES.includes(mimeType);
    const isPdf = mimeType === 'application/pdf';

    if (!isImage && !isPdf) {
      return NextResponse.json({ success: false, error: 'Please upload an image (JPG, PNG, WEBP) or PDF.' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString('base64');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let contentBlock: any;
    if (isImage) {
      const mediaType = (mimeType === 'image/jpg' ? 'image/jpeg' : mimeType) as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
      contentBlock = {
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: base64Data },
      };
    } else {
      contentBlock = {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64Data },
      };
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: 'You are a car deal data extractor. Analyze the document and return only valid JSON. No markdown, no explanation.',
      messages: [{ role: 'user', content: [contentBlock, { type: 'text', text: EXTRACTION_PROMPT }] }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    let extracted: Record<string, unknown>;
    try {
      extracted = JSON.parse(content.text);
    } catch {
      const match = content.text.match(/\{[\s\S]*\}/);
      if (match) extracted = JSON.parse(match[0]);
      else throw new Error('Could not parse extraction result');
    }

    return NextResponse.json({ success: true, data: extracted });
  } catch (error) {
    console.error('Extract document error:', error);
    return NextResponse.json({ success: false, error: 'Failed to read document. Try a clearer photo or enter numbers manually.' }, { status: 500 });
  }
}
