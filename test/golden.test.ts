import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { evaluateDeal } from '../src/cu/engine/evaluate';
import { buildTenantReport, gradePayload } from '../src/cu/engine/report';
import { cases } from './cases';

interface Expected {
  name: string;
  grade: string;
  recommendation: string;
  archetype: string;
  score: number;
  flags: string[];
}

const expected = JSON.parse(readFileSync(new URL('./expected.json', import.meta.url), 'utf8')) as Expected[];

test('golden set has at least 30 fixtures', () => {
  assert.ok(cases.length >= 30);
  assert.equal(cases.length, expected.length);
});

test('rules engine matches the locked golden set', () => {
  for (const fixture of cases) {
    const want = expected.find(e => e.name === fixture.name);
    assert.ok(want, fixture.name);
    const got = evaluateDeal(fixture.input);
    assert.deepEqual({
      grade: got.grade,
      recommendation: got.recommendation,
      archetype: got.archetype,
      score: got.score,
      flags: got.flags.map(f => f.id),
    }, {
      grade: want!.grade,
      recommendation: want!.recommendation,
      archetype: want!.archetype,
      score: want!.score,
      flags: want!.flags,
    }, fixture.name);
  }
});

test('every golden fixture renders a template report without free text', () => {
  for (const fixture of cases) {
    const report = buildTenantReport(fixture.input, 'Harborlight Credit Union');
    assert.equal(report.templatePackVersion, 'tp-1.0.0');
    assert.equal(report.grade, expected.find(e => e.name === fixture.name)!.grade);
    assert.ok(report.disclaimers.length >= 4);
    assert.match(report.disclaimers.join(' '), /Powered by Sign or Walk/);
    assert.match(report.disclaimers.join(' '), /not an offer of credit/i);
    const blob = JSON.stringify(report);
    assert.doesNotMatch(blob, /credit tier|credit score|sign now|walk away|guaranteed|money back/i);
  }
});

test('free-text fields are dropped and do not appear in the report', () => {
  const report = gradePayload({
    dealType: 'finance',
    sellingPrice: '30000',
    msrp: '32000',
    apr: '6.5',
    loanTerm: '60',
    docFee: '300',
    notes: 'SSN 123-45-6789 email jane@example.com',
    tradeIn: { dealerOffer: '8000', payoffAmount: '2000', knownIssues: 'secret-issue-token' },
    bundledCosts: { otherLabel: 'secret-label-token', otherAmount: '999', gapInsurance: '200' },
  }, 'Harborlight Credit Union');
  const blob = JSON.stringify(report);
  assert.equal(blob.includes('123-45-6789'), false);
  assert.equal(blob.includes('jane@example.com'), false);
  assert.equal(blob.includes('secret-issue-token'), false);
  assert.equal(blob.includes('secret-label-token'), false);
  assert.equal(blob.includes('999'), false);
  assert.equal(report.grade, 'B');
});

test('a state with a trade-in tax credit fills a labeled estimate', () => {
  const report = buildTenantReport({
    dealType: 'finance',
    state: 'TX',
    msrp: 30000,
    sellingPrice: 28000,
    apr: 6.4,
    termMonths: 60,
    tradeDealerOffer: 10000,
    tradePayoff: 4000,
  }, 'Summit Ridge Federal Credit Union');
  assert.match(report.stateTaxNote ?? '', /Texas/);
  assert.match(report.stateTaxNote ?? '', /estimate/i);
  assert.match(report.disclaimers.join(' '), /Summit Ridge Federal Credit Union/);
});

test('a state without a trade-in tax credit does not invent one', () => {
  const report = buildTenantReport({
    dealType: 'finance',
    state: 'CA',
    msrp: 30000,
    sellingPrice: 28000,
    apr: 6.4,
    termMonths: 60,
    tradeDealerOffer: 10000,
    tradePayoff: 4000,
  }, 'Harborlight Credit Union');
  assert.match(report.stateTaxNote ?? '', /California/);
  assert.match(report.stateTaxNote ?? '', /do not reduce/i);
});
