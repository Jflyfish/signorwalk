import assert from 'node:assert/strict';
import test from 'node:test';
import { buildTenantReport } from '../src/cu/engine/report';
import {
  QUESTIONS_ON_SCREEN,
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

test('offer quality names the offer, and a blank APR does not keep a sign verdict', () => {
  assert.equal(offerQuality('A'), 'Strong');
  assert.equal(offerQuality('B'), 'Fair');
  assert.equal(offerQuality('C'), 'Weak');
  const strong = report('fin-clean-strong');
  assert.equal(strong.grade, 'A');
  assert.equal(strong.recommendation, 'sign');
  const signed = verdictSentence(strong, false);
  assert.ok(wordCount(signed) <= 14);
  assert.equal(verdictSentence(strong, true), 'Add APR for a full recommendation.');
  assert.equal(verdictSentence({ ...strong, notes: [{ id: 'rate-missing', issue: '', action: '' }] }, false), 'Add APR for a full recommendation.');
});

test('readout rows stay within five scored lines and never invent a market comparison', () => {
  const average = report('fin-average');
  assert.equal(average.grade, 'B');
  const averageVerdict = verdictSentence(average, false);
  assert.equal(averageVerdict, 'The price is 4.3% under MSRP.');
  assert.ok(wordCount(averageVerdict) <= 14);
  const rows = readoutRows(average);
  assert.ok(rows.length > 0 && rows.length <= 5);
  assert.equal(rows.some(row => row.label === 'APR'), true);
  const price = rows.find(row => row.label === 'Price');
  assert.equal(price?.versus, 'MSRP');
  assert.equal(price?.figure.includes('('), false);
  for (const row of rows) {
    assert.equal(/\bvs\b/i.test(row.figure), false);
    assert.equal(row.versus === 'market' || row.versus === 'average' || row.versus === 'typical', false);
    assert.equal(/point/i.test(row.figure), false);
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
  assert.ok(QUESTIONS_ON_SCREEN >= 1);
  const verdict = verdictSentence(atMsrp, false);
  assert.ok(wordCount(verdict) <= 14);
  assert.equal(/sign/i.test(verdict), false);
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
