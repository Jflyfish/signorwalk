import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { ANALYZE_LOG_KEYS, formatAnalyzeLog } from '../src/cu/log';
import { GRADE_FILL } from '../src/cu/grades';
import { securityHeaderList } from '../src/cu/headers';
import { dueDiligenceDocs } from '../src/cu/packet/documents';
import { pricedTiers } from '../src/app/(cu)/credit-unions/pricing';
import { buildZip } from '../src/cu/packet/zip';
import { ANALYZE_LIMIT, resetAnalyzeRateLimit, takeAnalyzeSlot } from '../src/cu/rate-limit';
import { clearDealStorage, DEAL_STORAGE_KEYS } from '../src/cu/storage';
import { contrastRatio, parseRgbChannels } from '../src/cu/contrast';
import { creditUnionAlias } from '../src/app/(cu)/credit-unions/aliases';
import { getCuTenant, toCuPublic } from '../src/cu/tenants';
import { memberLink } from '../src/cu/utm';
import { config } from '../src/middleware';
import { POST } from '../src/app/(cu)/api/cu/[tenant]/analyze/route';
import { DEMO_FINANCE_SAMPLE, DEMO_GRADE_C, DEMO_GRADE_D } from '../src/cu/demo-sample';
import { gradePayload } from '../src/cu/engine/report';
import { ADD_APR_RECOMMENDATION, financeGradeIsProvisional, memberRecommendationLine } from '../src/cu/recommendation-display';

test('middleware matches only credit-union paths', () => {
  assert.deepEqual(config.matcher, ['/cu/:path*', '/credit-unions', '/credit-unions/:path*']);
  const joined = config.matcher.join(' ');
  assert.equal(joined.includes('/analyze'), false);
  assert.equal(joined.includes('/api/analyze'), false);
  assert.equal(joined.includes('tenant='), false);
});

test('slug resolves the demo tenants and nothing else', () => {
  assert.equal(getCuTenant('harborlight-cu')?.name, 'Harborlight Credit Union');
  assert.equal(getCuTenant('SUMMIT-RIDGE-FCU')?.id, 'summit-ridge-fcu');
  assert.equal(getCuTenant('larkspur-cu')?.name, 'Larkspur Credit Union');
  assert.equal(getCuTenant('sow'), undefined);
  assert.equal(getCuTenant('harborlight.signorwalk.app'), undefined);
  assert.equal(getCuTenant('../harborlight-cu'), undefined);
});

test('public links carry aggregate UTM parameters', () => {
  const harbor = getCuTenant('harborlight-cu')!;
  assert.equal(harbor.preApprovalUrl, '/credit-unions/demo/preapproval');
  assert.equal(harbor.ratesUrl, '/credit-unions/demo/rates');
  assert.equal(harbor.supportUrl, '/credit-unions/demo/help');
  assert.equal(harbor.privacyUrl, '/credit-unions/demo/privacy');
  assert.equal(harbor.preApprovalUrl.includes('signorwalk.com'), false);
  const pub = toCuPublic(harbor);
  const pre = new URL(pub.preApprovalUrl, 'http://preview.local');
  assert.equal(pre.searchParams.get('utm_source'), 'signorwalk');
  assert.equal(pre.searchParams.get('utm_medium'), 'referral');
  assert.equal(pre.searchParams.get('utm_campaign'), 'harborlight-cu');
  assert.equal(pre.searchParams.get('utm_content'), 'preapproval');
  const rates = new URL(pub.ratesUrl, 'http://preview.local');
  assert.equal(rates.searchParams.get('utm_content'), 'rates');
  assert.equal(rates.searchParams.get('utm_campaign'), 'harborlight-cu');
  assert.equal(pub.preApprovalUrl.startsWith('/credit-unions/demo/preapproval?'), true);
  assert.equal(pub.preApprovalUrl.includes('signorwalk.com'), false);
  assert.equal(memberLink(pub.preApprovalUrl), pub.preApprovalUrl);
  assert.equal(
    memberLink('https://signorwalk.com/credit-unions/demo/preapproval?utm_content=preapproval'),
    '/credit-unions/demo/preapproval?utm_content=preapproval',
  );
  const summit = toCuPublic(getCuTenant('summit-ridge-fcu')!);
  assert.equal(summit.preApprovalUrl.startsWith('/credit-unions/demo/preapproval?'), true);
  assert.equal(new URL(summit.preApprovalUrl, 'http://preview.local').searchParams.get('utm_campaign'), 'summit-ridge-fcu');
  assert.equal(memberLink(summit.preApprovalUrl), summit.preApprovalUrl);
});

test('brand and grade colors meet WCAG AA for text', () => {
  const white: [number, number, number] = [255, 255, 255];
  for (const id of ['harborlight-cu', 'summit-ridge-fcu'] as const) {
    const tenant = getCuTenant(id)!;
    assert.ok(contrastRatio(parseRgbChannels(tenant.colors.primary), parseRgbChannels(tenant.colors.primaryFg)) >= 4.5);
    assert.ok(contrastRatio(parseRgbChannels(tenant.colors.accent), white) >= 4.5);
  }
  for (const hex of Object.values(GRADE_FILL)) {
    const n = parseInt(hex.slice(1), 16);
    const rgb: [number, number, number] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    assert.ok(contrastRatio(rgb, white) >= 4.5, hex);
  }
});

test('analyze logs cannot carry fields outside the allowlist', () => {
  const line = formatAnalyzeLog({
    ts: '2026-01-01T00:00:00.000Z',
    tenant: 'harborlight-cu',
    route: '/api/cu/analyze',
    schemaVersion: '1',
    templatePack: 'tp-1.0.0',
    grade: 'B',
    flagIds: ['FLAG_DOC_FEE_HIGH'],
    archetype: 'FIN_HIGH_FEES',
    fallbackUsed: false,
    latencyMs: 4,
    outcome: 'ok',
    email: 'person@example.com',
    vehicle: '2024 Honda',
    notes: 'secret',
  } as never);
  const parsed = JSON.parse(line) as Record<string, unknown>;
  for (const key of Object.keys(parsed)) assert.ok(ANALYZE_LOG_KEYS.includes(key as never), key);
  assert.equal(JSON.stringify(parsed).includes('person@example.com'), false);
  assert.equal(JSON.stringify(parsed).includes('Honda'), false);
});

test('deal storage clear removes only the consumer deal keys', () => {
  const removed: string[] = [];
  clearDealStorage({ removeItem: key => removed.push(key) });
  assert.deepEqual(removed, [...DEAL_STORAGE_KEYS]);
  assert.equal(DEAL_STORAGE_KEYS.includes('sow_session' as never), true);
});

test('in-memory analyze limit does not store the address and resets', () => {
  resetAnalyzeRateLimit();
  for (let i = 0; i < ANALYZE_LIMIT; i++) {
    assert.equal(takeAnalyzeSlot('203.0.113.10', 1_000_000).allowed, true);
  }
  const blocked = takeAnalyzeSlot('203.0.113.10', 1_000_000);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSec >= 1);
  assert.equal(takeAnalyzeSlot('203.0.113.11', 1_000_000).allowed, true);
  assert.equal(takeAnalyzeSlot('203.0.113.10', 1_000_000 + 60_000).allowed, true);
  resetAnalyzeRateLimit();
});

test('due diligence packet is one zip containing every draft', () => {
  const zip = buildZip(dueDiligenceDocs.map(doc => ({ name: doc.filename, data: Buffer.from(doc.body) })));
  assert.equal(zip.subarray(0, 2).toString(), 'PK');
  const names = dueDiligenceDocs.map(doc => doc.filename);
  for (const name of names) assert.ok(zip.includes(Buffer.from(name)), name);
  const first = dueDiligenceDocs[0];
  const name = Buffer.from(first.filename);
  const local = zip.indexOf(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  const compressedSize = zip.readUInt32LE(local + 18);
  const nameLen = zip.readUInt16LE(local + 26);
  assert.equal(zip.subarray(local + 30, local + 30 + nameLen).equals(name), true);
  const inflated = inflateRawSync(zip.subarray(local + 30 + nameLen, local + 30 + nameLen + compressedSize));
  assert.equal(inflated.equals(Buffer.from(first.body)), true);
  for (const tier of pricedTiers) assert.equal(tier.setupUsd, 0, tier.id);
  const packet = dueDiligenceDocs.map(doc => `${doc.title}\n${doc.description}\n${doc.body}`).join('\n');
  assert.match(packet, /Every upload sends the full worksheet image, which may include a name or VIN, to Anthropic\./);
  assert.match(packet, /uploaded worksheet images or PDFs, sent to the AI vendor and not stored by us/);
  const fees = packet.match(/\bfees?\b/gi) ?? [];
  assert.deepEqual(fees, ['fee', 'fee']);
  assert.equal(packet.split('There is no setup fee.').length - 1, 2);
  assert.equal(packet.includes('$6,000'), false);
  assert.equal(packet.includes('$12,000'), false);
  assert.equal(packet.includes('$24,000'), false);
  assert.match(packet, /subdomain only/);
  assert.match(packet, /source of truth/);
  assert.match(packet, /owner approval before merge/);
  assert.match(packet, /PILOT-ONLY, PENDING COUNSEL REVIEW/);
  assert.match(packet, /TO BE PROVIDED BY OWNER\/COUNSEL/);
  assert.match(packet, /No shared firewall rule is configured/);
  assert.match(packet, /12 requests per 60 seconds/);
  assert.equal(packet.toLowerCase().includes('zero data retention'), false);
  assert.equal(packet.toLowerCase().includes('zdr'), false);
  assert.match(packet, /## 11\. Owner must supply/);
  assert.match(packet, /\[To be completed — owner\]/);
  assert.equal(packet.includes('Sign or Walk [legal entity'), false);
  assert.equal(packet.toLowerCase().includes('cancel anytime'), false);
  assert.equal(packet.toLowerCase().includes('zero-retention'), false);
});

test('guessed packet, privacy, and terms paths alias to real pages', () => {
  assert.equal(creditUnionAlias(['packet.pdf']), '/credit-unions/packet');
  assert.equal(creditUnionAlias(['dd']), '/credit-unions/packet');
  assert.equal(creditUnionAlias(['due-diligence']), '/credit-unions/packet');
  assert.equal(creditUnionAlias(['due_diligence']), '/credit-unions/packet');
  assert.equal(creditUnionAlias(['terms.pdf']), '/credit-unions/terms');
  assert.equal(creditUnionAlias(['terms-of-service']), '/credit-unions/terms');
  assert.equal(creditUnionAlias(['privacy']), '/credit-unions/privacy');
  assert.equal(creditUnionAlias(['privacy.pdf']), '/credit-unions/privacy');
  assert.equal(creditUnionAlias(['nope']), null);
  assert.equal(creditUnionAlias(['..', 'packet']), null);
});

test('credit-union headers deny framing and payment, and member pages skip third-party fonts', async () => {
  const cu = await securityHeaderList('/cu/harborlight-cu');
  const csp = cu.find(h => h.key === 'Content-Security-Policy')!.value;
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.equal(csp.includes('impactcdn'), false);
  assert.equal(csp.includes('fonts.googleapis'), false);
  assert.match(cu.find(h => h.key === 'Permissions-Policy')!.value, /payment=\(\)/);
  assert.equal(cu.find(h => h.key === 'X-Frame-Options')!.value, 'DENY');
  assert.match((await securityHeaderList('/credit-unions')).find(h => h.key === 'Content-Security-Policy')!.value, /fonts.googleapis.com/);
});

test('analyze route is rules-only, drops free text, and rate limits without logging it', async () => {
  resetAnalyzeRateLimit();
  const logs: string[] = [];
  const original = console.log;
  console.log = (...args: unknown[]) => { logs.push(args.map(String).join(' ')); };
  try {
    const req = new NextRequest('https://signorwalk.com/api/cu/harborlight-cu/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-real-ip': '198.51.100.20' },
      body: JSON.stringify({
        dealType: 'finance',
        sellingPrice: '30000',
        msrp: '32000',
        apr: '6.5',
        termMonths: '60',
        docFee: '300',
        notes: 'SSN 123-45-6789 jane@example.com',
        vehicle: 'secret-vin',
      }),
    });
    const res = await POST(req, { params: Promise.resolve({ tenant: 'harborlight-cu' }) });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.mode, 'rules');
    assert.equal(data.templatePack, 'tp-1.0.0');
    const blob = JSON.stringify(data);
    assert.equal(blob.includes('123-45-6789'), false);
    assert.equal(blob.includes('jane@example.com'), false);
    assert.equal(blob.includes('secret-vin'), false);
    assert.equal(logs.some(line => line.includes('198.51.100.20') || line.includes('jane@example.com')), false);
    assert.match(res.headers.get('x-content-type-options') ?? '', /nosniff/);

    const missing = await POST(req, { params: Promise.resolve({ tenant: 'not-a-cu' }) });
    assert.equal(missing.status, 404);
    const missingHtml = await missing.text();
    assert.match(missingHtml, /Page not found/);
    assert.match(missingHtml, />Sign or Walk</);
    assert.match(missingHtml, /Go to signorwalk.com/);
    assert.equal(missingHtml.includes('Grade My Deal'), false);
    assert.equal(missingHtml.includes('Harborlight'), false);

    resetAnalyzeRateLimit();
    for (let i = 0; i < ANALYZE_LIMIT; i++) takeAnalyzeSlot('198.51.100.21');
    const limited = new NextRequest('https://signorwalk.com/api/cu/harborlight-cu/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-real-ip': '198.51.100.21' },
      body: JSON.stringify({ dealType: 'finance', sellingPrice: '1' }),
    });
    const blocked = await POST(limited, { params: Promise.resolve({ tenant: 'harborlight-cu' }) });
    assert.equal(blocked.status, 429);
    assert.ok(Number(blocked.headers.get('retry-after')) >= 1);
  } finally {
    console.log = original;
    resetAnalyzeRateLimit();
  }
});

test('demo sample includes an APR and grades; a blank APR is still a B from the engine', () => {
  assert.equal(DEMO_FINANCE_SAMPLE.apr, '5.9');
  const graded = gradePayload({
    dealType: 'finance',
    termMonths: '60',
    ...DEMO_FINANCE_SAMPLE,
  }, 'Harborlight Credit Union');
  assert.equal(graded.grade, 'A');
  assert.equal(graded.notes.some(note => note.id === 'rate-missing'), false);

  const { apr: _apr, ...withoutApr } = DEMO_FINANCE_SAMPLE;
  const blank = gradePayload({
    dealType: 'finance',
    termMonths: '60',
    ...withoutApr,
  }, 'Harborlight Credit Union');
  assert.equal(blank.grade, 'B');
  assert.equal(blank.notes.some(note => note.id === 'rate-missing'), true);
  assert.equal(blank.recommendation, 'sign');
  const line = memberRecommendationLine({
    recommendation: blank.recommendation,
    recommendationLabel: blank.recommendationLabel,
    grade: blank.grade,
    aprBlank: true,
    provisional: financeGradeIsProvisional(blank, true),
  });
  assert.equal(line, ADD_APR_RECOMMENDATION);
  assert.equal(line.includes('Compares favorably'), false);
  const fullLine = memberRecommendationLine({
    recommendation: graded.recommendation,
    recommendationLabel: graded.recommendationLabel,
    grade: graded.grade,
    aprBlank: false,
    provisional: financeGradeIsProvisional(graded, false),
  });
  assert.equal(fullLine, '');
  assert.match(graded.recommendationLabel, /Compares favorably/);
  assert.match(graded.headline, /compare favorably/);
  assert.equal(readFileSync('src/cu/engine/evaluate.ts', 'utf8').includes('function recommendationFor'), true);

  const gradeC = gradePayload({ dealType: 'finance', ...DEMO_GRADE_C, termMonths: DEMO_GRADE_C.term }, 'Harborlight Credit Union');
  assert.equal(gradeC.grade, 'C');
  const gradeD = gradePayload({ dealType: 'finance', ...DEMO_GRADE_D, termMonths: DEMO_GRADE_D.term }, 'Harborlight Credit Union');
  assert.equal(gradeD.grade, 'D');
});
