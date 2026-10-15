import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { ephemeralSecret, checkCredentials, signSession, verifySession } from '../src/cu/auth';
import { capChroma, contrastRatio, deriveBrand, parseHex, rgbToOklch } from '../src/cu/contrast';
import { getCuTenant } from '../src/cu/tenants';
import { getAggregates, getBranding, recordCheck, resetCuStore, saveBranding, saveSettings } from '../src/cu/cu-store';
import { readLogoFile } from '../src/cu/logo-file';
import { formatOcrLog, pickOcrFields } from '../src/cu/ocr';
import { sendAggregateSummary, summaryText } from '../src/cu/notify';
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

test('a pale yellow primary is darkened until text and buttons clear 4.5:1', () => {
  const tenant = getCuTenant('larkspur-cu');
  assert.ok(tenant);
  assert.equal(tenant.brand.primary, '#FDE68A');
  const logs: string[] = [];
  const brand = deriveBrand(tenant.id, tenant.brand, line => logs.push(line));
  assert.equal(brand.fallback, false);
  assert.equal(logs.length, 0);
  const source = parseHex(tenant.brand.primary);
  const text = parseHex(brand.brandText);
  const fill = parseHex(brand.brandFill);
  assert.ok(source && text && fill);
  const white: [number, number, number] = [255, 255, 255];
  assert.ok(rgbToOklch(source)[0] > 0.9);
  assert.ok(rgbToOklch(text)[0] < rgbToOklch(source)[0]);
  assert.ok(rgbToOklch(fill)[0] < rgbToOklch(source)[0]);
  assert.ok(contrastRatio(text, white) >= 4.5);
  assert.ok(contrastRatio(white, fill) >= 4.5);
  assert.equal(brand.onBrand, '#ffffff');
  assert.match(brand.tint, /253 230 138/);
});

test('Larkspur #FDE68A button contrast stays at least 4.5:1', () => {
  const tenant = getCuTenant('larkspur-cu');
  assert.ok(tenant);
  assert.equal(tenant.brand.primary, '#FDE68A');
  const brand = deriveBrand(tenant.id, tenant.brand, () => undefined);
  const fill = parseHex(brand.brandFill);
  const onBrand = parseHex(brand.onBrand);
  assert.ok(fill && onBrand);
  assert.ok(contrastRatio(onBrand, fill) >= 4.5);
  assert.equal(brand.onBrand, '#ffffff');
  assert.equal(brand.fallback, false);
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
    const demoBody = new FormData();
    demoBody.set('file', new File([Uint8Array.from([1, 2, 3])], `${marker}.png`, { type: 'image/png' }));
    const demo = await POST(new NextRequest('https://signorwalk.com/api/cu/harborlight-cu/extract', {
      method: 'POST',
      body: demoBody,
      headers: { referer: 'https://signorwalk.com/credit-unions/embed-demo' },
    }), { params: Promise.resolve({ tenant: 'harborlight-cu' }) });
    assert.equal(demo.status, 403);
    assert.equal((await demo.text()).includes(marker), false);
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
  assert.equal(existsSync('src/app/credit-unions/get-started/checkout-stubs.ts'), false);
  const src = readFileSync('src/app/credit-unions/get-started/actions.ts', 'utf8');
  assert.match(src, /PAYMENTS ARE NOT BUILT/);
  assert.equal(src.includes('sk_live'), false);
  assert.equal(src.includes('sk_test'), false);
  assert.equal(src.toLowerCase().includes('stripe'), false);
});

test('growth copy and the worksheet route stay on the approved words', () => {
  const page = readFileSync('src/app/credit-unions/page.tsx', 'utf8');
  const started = readFileSync('src/app/credit-unions/get-started/page.tsx', 'utf8');
  const privacy = readFileSync('src/app/credit-unions/privacy/page.tsx', 'utf8');
  const copy = readFileSync('src/cu/copy.ts', 'utf8');
  const dashboard = readFileSync('src/app/cu/[tenant]/dashboard/page.tsx', 'utf8');
  const admin = readFileSync('src/app/cu/admin/page.tsx', 'utf8');
  const actions = readFileSync('src/app/cu/actions.ts', 'utf8');
  const extract = readFileSync('src/app/api/cu/[tenant]/extract/route.ts', 'utf8');
  const form = readFileSync('src/app/cu/[tenant]/CheckForm.tsx', 'utf8');
  const value = 'Members enter or upload a dealer quote, get a grade in 30 seconds, and are sent to your auto loan, all under your brand.';
  assert.equal(page.includes('Most chosen'), false);
  assert.equal(/\bfees?\b/i.test(page), false);
  assert.equal(/\bfees?\b/i.test(started), false);
  assert.match(page, /<AiDisclosure \/>/);
  assert.equal(page.includes('Embed the check on your website.'), false);
  assert.equal(page.includes('Branding and usage are on your dashboard.'), false);
  assert.match(page, /The trial requires an email confirmation before you can save\./);
  assert.match(page, /© 2026 Sign or Walk/);
  assert.match(page, /href="\/credit-unions\/terms"/);
  assert.match(page, /\{VALUE_LINE\}/);
  assert.equal(page.includes(value), true);
  assert.match(page, /description: VALUE_LINE/);
  assert.match(page, /flex flex-wrap items-baseline gap-x-2/);
  assert.match(page, /hidden md:inline">\{' · '\}/);
  assert.equal(page.includes("Self-serve checkout isn't on this preview"), false);
  assert.equal(started.includes("Self-serve checkout isn't on this preview"), false);
  assert.match(page, /Start 90-day free trial/);
  assert.match(page, /See it in action/);
  assert.equal(page.split('See it in action').length - 1, 1);
  assert.match(page, /Open live demo/);
  assert.equal(page.includes('md:hidden'), false);
  assert.match(page, /\/credit-unions\/embed-demo/);
  assert.match(page, /Free for 90 days\. No card\./);
  assert.equal(page.includes('Cancel anytime'), false);
  assert.equal(page.includes('DemoFrame'), false);
  assert.match(page, /\/cu\/harborlight-cu\/embed\?entry=numbers/);
  assert.match(page, /<LiveEmbed/);
  const iframe = readFileSync('src/app/credit-unions/LiveEmbed.tsx', 'utf8');
  assert.match(iframe, /<iframe/);
  assert.match(iframe, /EMBED_RESIZE/);
  assert.equal(iframe.includes('h-[720px]'), false);
  assert.equal(iframe.includes('hidden'), false);
  assert.equal(page.includes('Recommended'), false);
  assert.equal(started.includes('Recommended'), false);
  assert.equal(page.includes('Most chosen'), false);
  assert.match(page, /Over \$5B\? Email us\./);
  assert.match(page, /\{' · '\}/);
  assert.match(page, /mailto:\$\{TALK_TO_US_EMAIL\}/);
  assert.equal(page.includes('href="/contact"'), false);
  assert.match(copy, /sent to Anthropic for that request/);
  assert.match(copy, /A worksheet may include a name and VIN/);
  assert.match(copy, /due-diligence packet/);
  assert.equal(copy.toLowerCase().includes('zero data retention'), false);
  assert.equal(copy.toLowerCase().includes('zdr'), false);
  assert.equal(copy.includes('AI_FACTS.join'), false);
  assert.equal(copy.includes('then discarded'), false);
  assert.match(privacy, /\{PILOT_MARK\}/);
  assert.match(privacy, /Pending counsel review/);
  assert.match(privacy, /Due-diligence packet/);
  assert.match(privacy, /Not the worksheet and not the numbers from it/);
  assert.match(privacy, /AI_FACTS/);
  assert.match(readFileSync('src/app/credit-unions/terms/page.tsx', 'utf8'), /Pending counsel review/);
  assert.match(readFileSync('src/app/credit-unions/terms/page.tsx', 'utf8'), /\{PILOT_MARK\}/);
  assert.match(readFileSync('src/app/credit-unions/[...slug]/page.tsx', 'utf8'), /creditUnionAlias/);
  assert.equal(started.includes('AiDisclosure'), false);
  assert.match(started, /UPLOAD_DISCLOSURE/);
  assert.match(started, /href="\/credit-unions\/privacy"/);
  assert.equal(dashboard.includes('Since pilot start'), false);
  assert.match(dashboard, /All time/);
  assert.match(dashboard, /href=\{shareUrl\}/);
  assert.match(dashboard, /memberOrigin/);
  assert.equal(dashboard.includes('https://signorwalk.com/cu/${'), false);
  assert.match(dashboard, /Your member link/);
  const memberAt = dashboard.indexOf('Your member link');
  const loanAt = dashboard.indexOf('name="preApprovalUrl"');
  const settingsAt = dashboard.indexOf('settings-heading');
  assert.ok(memberAt >= 0 && loanAt > memberAt && settingsAt > loanAt);
  assert.match(dashboard, /These fields start empty/);
  assert.equal(dashboard.includes('defaultValue={tenant.preApprovalUrl}'), false);
  assert.match(dashboard, /text-left/);
  assert.equal(dashboard.includes('text-center'), false);
  assert.match(dashboard, /CopyLink/);
  assert.match(dashboard, /whitespace-pre overflow-x-auto/);
  assert.match(dashboard, /text-\[14px\]/);
  assert.match(dashboard, /md:w-auto/);
  assert.match(readFileSync('src/app/cu/[tenant]/dashboard/CopyLink.tsx', 'utf8'), /Copy link/);
  const account = readFileSync('src/app/cu/AccountMenu.tsx', 'utf8');
  assert.match(account, />\s*Account\s*</);
  assert.equal(account.includes('md:hidden'), false);
  assert.match(form, /safe-area-inset-bottom/);
  assert.match(form, /Add APR and check again/);
  assert.match(form, /Partial grade — add APR/);
  assert.match(form, /Try a sample deal/);
  assert.match(form, /Checking…/);
  assert.match(form, /cu-err/);
  assert.match(form, /cu-ring/);
  assert.match(form, /Get pre-approved/);
  assert.match(form, /target="_top"/);
  assert.match(dashboard, /Set the pre-approval URL and the rates URL before you share the member link/);
  assert.match(dashboard, /No checks yet/);
  assert.match(admin, /hidden py-3 pr-4 font-semibold md:table-cell">Email/);
  assert.match(admin, /text-right font-semibold">Checks/);
  assert.match(admin, /text-right tabular-nums/);
  const branding = readFileSync('src/app/cu/[tenant]/dashboard/BrandingForm.tsx', 'utf8');
  assert.match(branding, /h-8 /);
  assert.match(branding, /#111111/);
  assert.match(branding, /file:border-\[#E5E5E5\]/);
  assert.equal(branding.includes('Check the short name and colors.'), false);
  assert.equal(admin.includes('Tenants'), false);
  assert.equal(admin.includes('Accounts'), false);
  assert.match(admin, /Credit unions/);
  assert.match(actions, /session\?\.role === 'admin'/);
  assert.match(actions, /redirect\('\/credit-unions'\)/);
  assert.match(page, /DOCUMENT_VERSION_LABEL/);
  assert.match(started, /Start 90-day free trial/);
  assert.match(started, /name="password"/);
  assert.match(started, /name="company"/);
  assert.match(started, /name="website"/);
  assert.match(started, /No credit card/);
  assert.match(started, /At least 12 characters\./);
  assert.match(started, /cu-ring/);
  assert.equal(started.toLowerCase().includes('stripe'), false);
  assert.equal(started.includes('card number'), false);
  const signup = readFileSync('src/app/credit-unions/get-started/actions.ts', 'utf8');
  assert.match(signup, /takeSignupSlot/);
  assert.match(signup, /createTrial/);
  assert.equal(signup.includes('console.'), false);
  assert.equal(extract.includes('export const GET'), false);
  assert.match(extract, /export async function POST/);
  assert.match(form, /FILE_READ_ERROR/);
  assert.match(form, /UPLOAD_DISCLOSURE/);
  assert.match(form, /href="\/credit-unions\/privacy"/);
  assert.equal(form.includes('AI_FACTS'), false);
  assert.match(form, /numbersOnly/);
  assert.match(form, /demoSample/);
  assert.match(form, /Incomplete: add your APR for a full grade\./);
  assert.match(form, /A blank APR stays incomplete and does not show a letter\./);
  assert.match(form, /ADD_APR_RECOMMENDATION/);
  assert.equal(form.includes("from '@/cu/engine/evaluate"), false);
  assert.equal(form.includes("from '@/cu/engine/report"), false);
  assert.equal(form.includes('/api/analyze'), false);
  assert.match(dashboard, /border cu-line bg-white/);
  assert.match(dashboard, /Save links/);
  assert.match(dashboard, /Save website/);
  assert.match(readFileSync('src/app/credit-unions/embed-demo/EmbedDemo.tsx', 'utf8'), /entry=numbers/);
  const embedPage = readFileSync('src/app/cu/[tenant]/embed/page.tsx', 'utf8');
  assert.match(embedPage, /numbersOnlyEmbed/);
  assert.match(embedPage, /demoSample=\{query\.entry === 'numbers'\}/);
  assert.equal(readFileSync('src/app/cu/actions.ts', 'utf8').includes('verified = true'), false);
});
