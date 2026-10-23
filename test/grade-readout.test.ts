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
  detailExplanation,
  figuresEntered,
  formatCut,
  gradeCutoffs,
  gradeDisclaimerLines,
  loanUrlForPrint,
  shortestDisclaimerLine,
  offerQuality,
  readoutRows,
  renderedDetailsText,
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
  assert.equal(averageVerdict, 'Fair deal on the figures you entered.');
  assert.ok(wordCount(averageVerdict) <= 16);
  const rows = readoutRows(average);
  assert.ok(rows.length > 0 && rows.length <= 5);
  const apr = rows.find(row => row.label === 'APR');
  assert.ok(apr);
  assert.equal(apr.tone, 'neutral');
  const cuts = gradeCutoffs();
  assert.equal(apr.why, `between ${formatCut(cuts.strong)}% and ${formatCut(cuts.high)}%: not flagged (not a market rate or an offer)`);
  const price = rows.find(row => row.label === 'Price');
  assert.equal(price?.versus, 'MSRP');
  assert.equal(price?.tone, 'helped');
  assert.match(price?.why ?? '', /^\$[\d,]+ under MSRP$/);
  assert.equal(price?.figure.includes('('), false);
  assert.equal(rows.some(row => row.label === 'Term' || row.label === 'Doc fee'), false);
  for (const row of rows) {
    assert.equal(/\bvs\b/i.test(row.figure), false);
    assert.equal(row.versus === 'market' || row.versus === 'average' || row.versus === 'typical', false);
    assert.equal(/point/i.test(row.figure), false);
    assert.equal(/\b(typical|average|market|worksheet)\b/i.test(row.why.replace(/\(not a market rate or an offer\)/g, '')), false);
  }
  const missingApr = report('fin-missing-apr');
  assert.equal(readoutRows(missingApr).some(row => row.label === 'APR'), false);
  const clean = readoutRows(report('fin-clean-strong'));
  assert.equal(clean.every(row => row.tone === 'helped'), true);
  assert.equal(dealerQuestions(report('fin-clean-strong')).length, 0);
  const term = readoutRows(report('fin-term-84')).find(row => row.label === 'Term');
  assert.equal(term?.why, `${gradeCutoffs().termVeryLong} months or longer`);
  assert.equal(/longer than/.test(term?.why ?? ''), false);
  const atMsrp = readoutRows(report('fin-at-msrp')).find(row => row.label === 'Price');
  assert.equal(atMsrp?.tone, 'hurt');
  assert.equal(atMsrp?.why, 'at MSRP');
});

test('questions come from hurt rows and the summary is plain text', () => {
  const atMsrp = report('fin-at-msrp');
  assert.equal(atMsrp.grade, 'C');
  const questions = dealerQuestions(atMsrp);
  assert.deepEqual(questions, ['Can you show me this price against MSRP in writing?']);
  for (const question of questions) {
    assert.match(question, /\?$/);
    assert.match(question, /\b(I|me|my)\b/);
    assert.equal(/for me\b/i.test(question), false);
  }
  const high = report('fin-high-apr');
  const highQuestions = dealerQuestions(high);
  assert.equal(highQuestions.some(question => question.startsWith('What APR')), true);
  assert.equal(highQuestions.some(question => /\d/.test(question) && question.startsWith('What APR')), false);
  const stacked = dealerQuestions(report('fin-interest-stack'));
  assert.equal(stacked.filter(question => question === 'Can you show me total interest at this term and at a shorter term?').length, 1);
  assert.ok(QUESTIONS_ON_SCREEN >= 1);
  const verdict = verdictSentence(atMsrp, false);
  assert.equal(verdict, 'Weak deal: ask about the price at MSRP.');
  assert.ok(wordCount(verdict) <= 16);
  assert.equal(/\b(overall|but|sign)\b/i.test(verdict), false);
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
  const lines = gradeDisclaimerLines('Harborlight CU');
  assert.equal(lines.length, 4);
  assert.deepEqual(lines, [
    'This grade doesn\'t look at your credit history or score.',
    'Grades never use age, race, sex, ZIP code, or other personal characteristics.',
    'Confirm every figure on the dealer\'s written worksheet before you agree to anything.',
    'This grade is educational. This is not a loan offer.',
  ]);
  assert.equal(lines.some(line => /benchmark|assumption/i.test(line)), false);
  assert.equal(shortestDisclaimerLine('Harborlight CU'), 'This grade is educational. This is not a loan offer.');
  assert.equal(shortestDisclaimerLine('Harborlight CU'), lines.reduce((shortest, line) => (line.length < shortest.length ? line : shortest)));
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
  assert.match(explanation, new RegExp(`${formatCut(cuts.strong)}%`));
  assert.match(explanation, new RegExp(`${formatCut(cuts.high)}%`));
  assert.match(explanation, new RegExp(`${formatCut(cuts.veryHigh)}%`));
  assert.match(explanation, /does not earn the strong-rate credit/);
  assert.match(explanation, /is not flagged/);
  assert.equal(/something to ask about/.test(explanation), false);
  assert.match(explanation, /does not read a credit tier/);
  assert.equal(/\btypical\b|\baverage\b|often cited|6–8/.test(explanation), false);
  const midBand = evaluateDeal({ dealType: 'finance', apr: Math.round((cuts.strong + 0.5) * 100) / 100 });
  assert.equal(midBand.adjustments.some(item => item.id === 'APR_TYPICAL'), true);
  assert.equal(midBand.flags.some(item => item.id === 'FLAG_APR_HIGH' || item.id === 'FLAG_APR_VERY_HIGH'), false);

  const discovered = gradeCutoffs();
  const allowed = new Set(Object.values(discovered));
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
      assert.ok(wordCount(row.why.replace(/\(not a market rate or an offer\)/g, '')) <= 10, row.why);
      assert.equal(/worksheet|figures entered|grading threshold/.test(row.why), false, row.why);
      for (const match of spoken.matchAll(/\d[\d,]*(?:\.\d+)?/g)) {
        const number = Number(match[0].replace(/,/g, ''));
        const inBlob = blob.includes(match[0]) || blob.includes(String(number));
        assert.equal(inBlob || allowed.has(number) || diffs.has(number), true, `${row.label} ${match[0]} in ${spoken}`);
      }
    }
    const details = renderedDetailsText(built);
    const screened = details.replace(/\(not a market rate or an offer\)/g, '');
    assert.equal(/\b(typical|average|benchmarks?|assumptions?|market)\b|often[-\s]cited|6\s*[–-]\s*8\s*%/i.test(screened), false, `${item.name}\n${details}`);
    for (const line of built.disclaimers) assert.equal(details.includes(line), false, item.name);
    const aprRow = built.breakdown.find(row => row.label === 'APR');
    if (aprRow) {
      assert.equal(details.includes(aprRow.explanation), false, item.name);
    }
    for (const row of built.breakdown) {
      const explanation = detailExplanation(row);
      if (!explanation) continue;
      assert.match(explanation, /[.!?]$/, `${item.name} ${row.label}`);
      assert.equal(/,\s+\d[\d,]* months or longer/.test(explanation), false, explanation);
    }
    const verdict = verdictSentence(built, false);
    assert.ok(wordCount(verdict) <= 16, `${item.name} ${verdict}`);
    assert.equal(/\bInterest\b/.test(verdict), false, verdict);
    const hurts = readoutRows(built).filter(row => row.tone === 'hurt');
    const top = hurts[0]?.label.split(/(\s+)/).map(part => (/^[A-Z0-9]{2,}$/.test(part) ? part : part.toLowerCase())).join('');
    if (hurts.length >= 2 && (offerQuality(built.grade) === 'Weak')) {
      assert.match(verdict, new RegExp(`^Weak deal: ask about the ${top} and `));
    }
    if (hurts.length >= 2 && offerQuality(built.grade) === 'Fair') {
      assert.match(verdict, new RegExp(`ask about the ${top} and `));
    }
  }
  assert.equal(loanUrlForPrint('/credit-unions/demo/preapproval?utm_source=signorwalk&utm_medium=referral&keep=1', 'https://signorwalk.com'), 'https://signorwalk.com/credit-unions/demo/preapproval?keep=1');

  const termRow = report('fin-term-72').breakdown.find(row => row.label === 'Term');
  assert.ok(termRow);
  assert.equal(detailExplanation(termRow), `Term is 72 months, at or above this tool's ${discovered.termLong}-month line.`);
  const veryLong = report('fin-term-84').breakdown.find(row => row.label === 'Term');
  assert.ok(veryLong);
  assert.equal(detailExplanation(veryLong), `Term is 84 months, at or above this tool's ${discovered.termVeryLong}-month line.`);
  const over = report('fin-above-msrp').breakdown.find(row => row.label === 'Price versus MSRP');
  assert.ok(over);
  assert.equal(detailExplanation(over), 'Price is $2,000 over the MSRP of $30,000.');
  const under = report('fin-average').breakdown.find(row => row.label === 'Price versus MSRP');
  assert.ok(under);
  assert.equal(detailExplanation(under), 'Price is $1,500 under the MSRP of $35,000.');
  const mid = report('fin-average').breakdown.find(row => row.label === 'APR');
  assert.ok(mid);
  assert.equal(detailExplanation(mid), `APR is 6.9%, between ${formatCut(discovered.strong)}% and ${formatCut(discovered.high)}% and is not flagged (not a market rate or an offer).`);
  const stackedVerdict = verdictSentence(report('fin-apr-and-84'), false);
  assert.match(stackedVerdict, /\bAPR\b/);
  assert.equal(/\bapr\b/.test(stackedVerdict), false);
});
