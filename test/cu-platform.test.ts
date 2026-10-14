import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { ephemeralSecret, checkCredentials, signSession, verifySession } from '../src/cu/auth';
import { capChroma, contrastRatio, deriveBrand, parseHex, rgbToOklch } from '../src/cu/contrast';
import { getAggregates, getBranding, recordCheck, resetCuStore, saveBranding, saveSettings } from '../src/cu/cu-store';
import { readLogoFile } from '../src/cu/logo-file';
import { formatOcrLog, pickOcrFields } from '../src/cu/ocr';
import { sendAggregateSummary, summaryText } from '../src/cu/notify';
import { CHECKOUT_STATUS } from '../src/app/credit-unions/get-started/checkout-stubs';
import { POST } from '../src/app/api/cu/[tenant]/extract/route';

const ENV_KEYS = ['CU_DEMO_EMAIL', 'CU_DEMO_PASSWORD', 'CU_DEMO_TENANT', 'CU_ADMIN_EMAIL', 'CU_ADMIN_PASSWORD', 'CU_SESSION_SECRET', 'ANTHROPIC_API_KEY'] as const;

function rgb(hex: string): [number, number, number] {
  const parsed = parseHex(hex);
  assert.ok(parsed, hex);
  return parsed;
}

test('chroma above 0.25 is capped at 0.18 and brand colors stay readable', () => {
  assert.equal(capChroma(0.25), 0.25);
  assert.equal(capChroma(0.26), 0.18);
  const red = rgbToOklch([255, 0, 0]);
  assert.ok(red[1] > 0.25);
  const logs: string[] = [];
  const brand = deriveBrand('example-cu', {
    name: 'Example Credit Union',
    shortName: 'Example CU',
    primary: '#ff0000',
    logoAspect: 1,
  }, line => logs.push(line));
  assert.equal(brand.fallback, false);
  assert.equal(logs.length, 0);
  assert.ok(rgbToOklch(rgb(brand.primary))[1] <= 0.18 + 0.001);
  const white: [number, number, number] = [255, 255, 255];
  assert.ok(contrastRatio(rgb(brand.brandText), white) >= 4.5);
  assert.ok(contrastRatio(white, rgb(brand.brandFill)) >= 4.5);
  assert.equal(brand.focus, brand.brandText);
  assert.match(brand.tint, /\/ 0\.08\)$/);
});

test('an unusable primary falls back to #111 and logs the tenant only', () => {
  const logs: string[] = [];
  const brand = deriveBrand('example-cu', {
    name: 'Example Credit Union',
    shortName: 'Example Credit Union Name That Is Too Long',
    primary: 'not-a-color',
    logoAspect: 1,
  }, line => logs.push(line));
  assert.equal(brand.fallback, true);
  assert.equal(brand.brandText, '#111111');
  assert.equal(brand.brandFill, '#111111');
  assert.equal(brand.onBrand, '#ffffff');
  assert.ok([...brand.shortName].length <= 24);
  assert.equal(logs.length, 1);
  assert.match(logs[0], /"event":"brand-fallback"/);
  assert.equal(logs[0].includes('not-a-color'), false);
});

test('credit-union storage keeps counts and rejects member data', async () => {
  resetCuStore();
  await recordCheck('harborlight-cu', 'C');
  const agg = await getAggregates('harborlight-cu');
  assert.equal(agg.checks, 1);
  assert.equal(agg.grades.C, 1);
  assert.equal(JSON.stringify(agg).includes('sellingPrice'), false);
  await assert.rejects(() => saveSettings('harborlight-cu', { emailEnabled: true, notifyEmail: '123-45-6789' }));
  const settings = await import('../src/cu/cu-store');
  await assert.rejects(() => settings.saveBranding('harborlight-cu', { primary: '#111111', shortName: 'vin secret' }));
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=', 'base64');
  const logo = readLogoFile(png, 'image/png');
  assert.ok(logo);
  assert.equal(logo.width, 1);
  assert.equal(logo.height, 1);
  assert.equal(logo.aspect, 1);
  await saveBranding('harborlight-cu', { primary: '#075985', shortName: 'Harborlight CU', logoLight: logo.dataUrl, logoAspect: logo.aspect });
  const stored = await getBranding('harborlight-cu');
  assert.equal(stored?.logoLight, logo.dataUrl);
  assert.equal(stored?.logoAspect, 1);
  resetCuStore();
});

test('aggregate email is off until a tenant turns it on', async () => {
  resetCuStore();
  const skipped = await sendAggregateSummary('harborlight-cu');
  assert.deepEqual(skipped, { sent: false, reason: 'disabled' });
  const text = summaryText('Harborlight Credit Union', { checks: 2, uploads: 1, grades: { A: 0, B: 1, C: 0, D: 0, F: 1 } });
  assert.match(text, /Checks: 2/);
  assert.equal(text.includes('@'), false);
  assert.equal(text.includes('sellingPrice'), false);
  resetCuStore();
});

test('ocr keeps numbers, drops identity text, and redacts logs', () => {
  const picked = pickOcrFields({
    dealType: 'finance',
    sellingPrice: '$32,000',
    apr: 11,
    make: 'Honda',
    dealerName: 'Jane Doe',
    email: 'member@example.com',
    vin: '1HGCM82633A004352',
    notes: 'SSN 123-45-6789',
  });
  assert.equal(picked.dealType, 'finance');
  assert.equal(picked.fields.sellingPrice, '32000');
  assert.equal(picked.fields.apr, '11');
  const blob = JSON.stringify(picked);
  assert.equal(blob.includes('Honda'), false);
  assert.equal(blob.includes('Jane'), false);
  assert.equal(blob.includes('member@example.com'), false);
  assert.equal(blob.includes('1HGCM82633A004352'), false);
  const line = formatOcrLog({
    ts: '2026-01-01T00:00:00.000Z',
    tenant: 'harborlight-cu',
    route: '/api/cu/extract',
    outcome: 'ok',
    latencyMs: 3,
    email: 'member@example.com',
    text: 'Jane Doe',
  } as never);
  assert.equal(line.includes('member@example.com'), false);
  assert.equal(line.includes('Jane'), false);
  const src = readFileSync('src/cu/ocr.ts', 'utf8');
  assert.match(src, /TODO: Anthropic zero data retention is required before production/);
  assert.equal(src.includes('writeFile'), false);
});

test('dashboard credentials are not in source', () => {
  const src = readFileSync('src/cu/auth.ts', 'utf8');
  assert.equal(/PASSWORD\s*=\s*['"]/.test(src), false);
  assert.match(src, /CU_DEMO_PASSWORD/);
  assert.match(src, /CU_ADMIN_PASSWORD/);
  assert.match(src, /CU_SESSION_SECRET/);
  const saved = new Map(ENV_KEYS.map(key => [key, process.env[key]]));
  for (const key of ENV_KEYS) delete process.env[key];
  try {
    assert.equal(checkCredentials('harborlight-cu', 'person@example.com', 'pw').status, 'unconfigured');
    const secret = ephemeralSecret();
    process.env.CU_SESSION_SECRET = secret;
    const session = { role: 'admin' as const, tenantId: 'harborlight-cu', exp: Date.now() + 60_000 };
    const token = signSession(session, secret);
    assert.ok(token);
    assert.equal(verifySession(token)?.role, 'admin');
    assert.equal(verifySession(`${token}x`), null);
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('worksheet route does not read or log a file when OCR is not configured', async () => {
  const saved = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  const lines: string[] = [];
  const original = console.log;
  console.log = (...args: unknown[]) => lines.push(args.map(String).join(' '));
  try {
    const marker = 'member-secret-worksheet';
    const body = new FormData();
    body.set('file', new File([Uint8Array.from([1, 2, 3])], `${marker}.png`, { type: 'image/png' }));
    const req = new NextRequest('https://signorwalk.com/api/cu/harborlight-cu/extract', { method: 'POST', body });
    const res = await POST(req, { params: Promise.resolve({ tenant: 'harborlight-cu' }) });
    assert.equal(res.status, 503);
    const payload = await res.text();
    assert.equal(payload.includes(marker), false);
    assert.equal(lines.join('\n').includes(marker), false);
    assert.match(lines.join('\n'), /"outcome":"unconfigured"/);
  } finally {
    console.log = original;
    if (saved === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = saved;
  }
});

test('stripe checkout stays unwired', () => {
  assert.equal(CHECKOUT_STATUS, 'coming-soon');
  const src = readFileSync('src/app/credit-unions/get-started/checkout-stubs.ts', 'utf8');
  assert.match(src, /PAYMENTS ARE NOT BUILT/);
  assert.equal(src.includes('sk_live'), false);
  assert.equal(src.includes('sk_test'), false);
});
