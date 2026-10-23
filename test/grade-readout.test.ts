import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { evaluateDeal } from '../src/cu/engine/evaluate';
import { buildTenantReport } from '../src/cu/engine/report';
import {
  QUESTIONS_ON_SCREEN,
  aprGradeCutoffs,
  aprGradeExplanation,
  copySummary,
  dealerQuestions,
  figuresEntered,
  gradeDisclaimerLines,
  offerQuality,
  readoutRows,
  verdictSentence,
} from '../src/cu/grade-readout';
import { cases } from './cases';

function report(name: string) {
  const found = cases.find(item => item.name === name);
  assert.ok(found, name);
  return buildTenantReport(found.input, 'Harborlight Credit Union');
}

function wordCount(value: string): number {
  return value.replace(/[.]+$/g, '').split(/\s+/).filter(Boolean).length;
}

function sourceRow(built: ReturnType<typeof report>, label: string) {
  const full = label === 'Price' ? 'Price versus MSRP'
    : label === 'Doc fee' ? 'Documentation fee'
    : label === 'Interest' ? 'Total interest'
    : label === 'Down payment' ? 'Cash down payment'
    : label === 'GAP' ? 'GAP product'
    : label === 'Tire and wheel' ? 'Tire and wheel product'
    : label === 'Cap reduction' ? 'Cap cost reduction'
    : label;
  return built.breakdown.find(row => row.label === full || row.label === label);
}

test('offer quality names the offer, and a blank APR does not keep a sign verdict', () => {
  assert.equal(offerQuality('A'), 'Strong');
  assert.equal(offerQuality('B'), 'Fair');
  assert.equal(offerQuality('C'), 'Weak');
  const strong = report('fin-clean-strong');
  assert.equal(strong.grade, 'A');
  assert.equal(strong.recommendation, 'sign');
  const signed = verdictSentence(strong, false);
  assert.equal(signed, 'Strong deal on the figures you entered.');
  assert.ok(wordCount(signed) <= 16);
  assert.equal(/\b(typical|average|market|sign)\b/i.test(signed), false);
  assert.equal(verdictSentence(strong, true), 'Add APR for a full recommendation.');
  assert.equal(verdictSentence({ ...strong, notes: [{ id: 'rate-missing', issue: '', action: '' }] }, false), 'Add APR for a full recommendation.');
});

test('readout rows stay within five scored lines and never invent a market comparison', () => {
  const average = report('fin-average');
  assert.equal(average.grade, 'B');
  const averageVerdict = verdictSentence(average, false);
  assert.equal(averageVerdict, 'Fair deal with 2 things to ask about.');
  assert.ok(wordCount(averageVerdict) <= 16);
  const rows = readoutRows(average);
  assert.ok(rows.length > 0 && rows.length <= 5);
  const apr = rows.find(row => row.label === 'APR');
  assert.ok(apr);
  assert.match(apr.why, /^above this tool's \d+(\.\d+)?% grading threshold \(not a market rate or an offer\)$/);
  const price = rows.find(row => row.label === 'Price');
  assert.equal(price?.versus, 'MSRP');
  assert.match(price?.why ?? '', /^\$[\d,]+ under MSRP$/);
  assert.equal(price?.figure.includes('('), false);
  for (const row of rows) {
    assert.equal(/\bvs\b/i.test(row.figure), false);
    assert.equal(row.versus === 'market' || row.versus === 'average' || row.versus === 'typical', false);
    assert.equal(/point/i.test(row.figure), false);
    assert.equal(/\btypical\b|\baverage\b/i.test(row.why), false);
  }
  const missingApr = report('fin-missing-apr');
  assert.equal(readoutRows(missingApr).some(row => row.label === 'APR'), false);
  const clean = readoutRows(report('fin-clean-strong'));
  assert.equal(clean.every(row => row.tone === 'helped'), true);
  assert.equal(dealerQuestions(report('fin-clean-strong')).length, 0);
});

test('questions come from hurt rows and the summary is plain text', () => {
  const atMsrp = report('fin-at-msrp');
  assert.equal(atMsrp.grade, 'C');
  const questions = dealerQuestions(atMsrp);
  assert.ok(questions.length > 0);
  assert.ok(questions.length <= atMsrp.breakdown.filter(row => row.status !== 'good').length);
  for (const question of questions) {
    assert.match(question, /\?$/);
    assert.match(question, /\b(I|me|my)\b/);
  }
  assert.equal(questions.some(question => question.startsWith('What APR')), true);
  assert.equal(questions.some(question => /\d/.test(question) && question.startsWith('What APR')), false);
  const withRate = dealerQuestions(atMsrp, 4.9);
  assert.equal(withRate.some(question => question.includes('4.9%')), true);
  assert.ok(QUESTIONS_ON_SCREEN >= 1);
  const verdict = verdictSentence(atMsrp, false);
  assert.equal(verdict, 'Weak deal with 2 things to ask about.');
  assert.ok(wordCount(verdict) <= 16);
  assert.equal(/\bsign\b/i.test(verdict), false);
  const text = copySummary({
    grade: atMsrp.grade,
    quality: 'Weak',
    verdict,
    questions,
  });
  assert.match(text, /^Grade C, Weak/);
  assert.match(text, /What to ask the dealer/);
  assert.equal(text.includes('http'), false);
  assert.ok(figuresEntered(atMsrp) >= 1);
  assert.deepEqual(gradeDisclaimerLines('Harborlight CU'), [
    'This is not a loan offer.',
    'Harborlight CU does not endorse the dealer.',
    'This grade is educational.',
  ]);
});

test('vs and why strings are built from engine fields', () => {
  const cuts = aprGradeCutoffs();
  const engine = readFileSync('src/cu/engine/evaluate.ts', 'utf8');
  const aprAt = engine.indexOf("if (input.dealType === 'finance' && input.apr !== undefined)");
  assert.ok(aprAt > 0);
  const aprBlock = engine.slice(aprAt, aprAt + 500);
  assert.equal(/credit|tier|fico/i.test(aprBlock), false);
  const strong = evaluateDeal({ dealType: 'finance', apr: cuts.strong });
  assert.equal(strong.adjustments.some(item => item.id === 'APR_STRONG'), true);
  const aboveStrong = evaluateDeal({ dealType: 'finance', apr: Math.round((cuts.strong + 0.01) * 100) / 100 });
  assert.equal(aboveStrong.adjustments.some(item => item.id === 'APR_STRONG'), false);
  assert.equal(evaluateDeal({ dealType: 'finance', apr: Math.round((cuts.high + 0.01) * 100) / 100 }).flags.some(item => item.id === 'FLAG_APR_HIGH'), true);
  assert.equal(evaluateDeal({ dealType: 'finance', apr: Math.round((cuts.veryHigh + 0.01) * 100) / 100 }).flags.some(item => item.id === 'FLAG_APR_VERY_HIGH'), true);
  const explanation = aprGradeExplanation();
  assert.match(explanation, new RegExp(`${cuts.strong}%`));
  assert.match(explanation, new RegExp(`${cuts.high}%`));
  assert.match(explanation, new RegExp(`${cuts.veryHigh}%`));
  assert.match(explanation, /does not read a credit tier/);
  assert.equal(/\btypical\b|\baverage\b/i.test(explanation), false);

  const allowed = new Set([cuts.strong, cuts.high, cuts.veryHigh]);
  for (const item of cases) {
    const built = buildTenantReport(item.input, 'Harborlight Credit Union');
    for (const row of readoutRows(built)) {
      const source = sourceRow(built, row.label);
      assert.ok(source, row.label);
      const blob = `${source.value} ${source.explanation}`;
      const amounts = [...blob.matchAll(/\$[\d,]+(?:\.\d+)?/g)].map(match => Number(match[0].replace(/[$,]/g, '')));
      const diffs = new Set<number>();
      for (let i = 0; i < amounts.length; i++) {
        for (let j = i + 1; j < amounts.length; j++) diffs.add(Math.abs(amounts[i] - amounts[j]));
      }
      const spoken = `${row.versus ?? ''} ${row.why}`.replace(/\(not a market rate or an offer\)/g, '');
      assert.equal(/\b(typical|average|market)\b/i.test(spoken), false, spoken);
      assert.equal(row.why.includes('·'), false);
      if (!/grading threshold/.test(row.why)) assert.ok(wordCount(row.why) <= 10, row.why);
      for (const match of spoken.matchAll(/\d[\d,]*(?:\.\d+)?/g)) {
        const number = Number(match[0].replace(/,/g, ''));
        const inBlob = blob.includes(match[0]) || blob.includes(String(number));
        assert.equal(inBlob || allowed.has(number) || diffs.has(number), true, `${row.label} ${match[0]} in ${spoken}`);
      }
    }
  }
});
