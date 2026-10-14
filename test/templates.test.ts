import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { FLAG_IDS } from '../src/cu/engine/types';
import { ALL_TEMPLATES, FLAG_COPY, SLOTS, TEMPLATE_PACK_VERSION } from '../src/cu/templates/tp-1.0.0/en';
import { renderTemplate, templatePlaceholders } from '../src/cu/templates/tp-1.0.0/render';

const BANNED = [
  /credit tier/i,
  /credit level/i,
  /credit score/i,
  /your credit(?! union)/i,
  /sign now/i,
  /walk away/i,
  /guaranteed/i,
  /money back/i,
  /\bscam\b/i,
  /ripped/i,
  /pure dealer profit/i,
];

test('template pack v1 covers every flag and every placeholder', () => {
  assert.equal(TEMPLATE_PACK_VERSION, 'tp-1.0.0');
  for (const id of FLAG_IDS) {
    assert.ok(FLAG_COPY[id].issue.id.startsWith(id));
    assert.ok(FLAG_COPY[id].action.text.length > 0);
  }
  const ids = new Set<string>();
  for (const template of ALL_TEMPLATES) {
    assert.equal(ids.has(template.id), false, template.id);
    ids.add(template.id);
    const placeholders = templatePlaceholders(template);
    assert.deepEqual([...placeholders].sort(), [...template.slots].sort(), template.id);
    for (const slot of template.slots) assert.ok((SLOTS as readonly string[]).includes(slot));
    for (const pattern of BANNED) assert.doesNotMatch(template.text, pattern, template.id);
    if (template.text.includes('Sign or Walk')) {
      assert.match(template.text, /Powered by Sign or Walk/);
    }
  }
});

test('templates render only engine-formatted slot values', () => {
  const values = {
    docFee: '$650',
    apr: '9.5%',
    moneyFactor: '0.00210',
    mfApr: '5.0%',
    buyRateMf: '0.00150',
    buyRateApr: '3.6%',
    termMonths: '84',
    monthlyPayment: '$510',
    calculatedPayment: '$430',
    paymentGap: '$80',
    totalInterest: '$4200',
    sellingPrice: '$32000',
    msrp: '$30000',
    discountPct: '6.7%',
    residualPct: '47.0%',
    netTrade: '$2000',
    negativeEquity: '$4000',
    gapAmount: '$700',
    warrantyAmount: '$3200',
    tireAmount: '$600',
    paintAmount: '$200',
    acquisitionFee: '$1295',
    downPayment: '$2000',
    rebates: '$1500',
    loanAmount: '$28000',
    stateName: 'Texas',
    stateRate: '6.25%',
    taxCreditEstimate: '$625',
    creditUnionName: 'Harborlight Credit Union',
    dealerOffer: '$10000',
    payoff: '$14000',
  } as const;
  for (const template of ALL_TEMPLATES) {
    const text = renderTemplate(template, values);
    assert.equal(text.includes('{'), false, template.id);
  }
  assert.throws(() => renderTemplate(FLAG_COPY.FLAG_DOC_FEE_HIGH.issue, { docFee: 'jane@example.com' }));
});

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, name.name);
    if (name.isDirectory()) out.push(...walk(path));
    else if (name.name.endsWith('.tsx')) out.push(path);
  }
  return out;
}

test('credit-union UI says Sign or Walk only in the header line', () => {
  const files = walk('src/app/cu');
  const seen = new Set<string>();
  for (const file of files) {
    if (seen.has(file) || !file.endsWith('.tsx')) continue;
    seen.add(file);
    const text = readFileSync(file, 'utf8');
    const hits = text.match(/Sign or Walk/g) ?? [];
    const withLine = text.match(/with Sign or Walk/g) ?? [];
    const powered = text.match(/Powered by Sign or Walk/g) ?? [];
    const wordmark = file.endsWith('not-found.tsx') ? (text.match(/>Sign or Walk</g) ?? []) : [];
    assert.equal(hits.length, withLine.length + powered.length + wordmark.length, file);
  }
});
