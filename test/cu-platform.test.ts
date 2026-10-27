import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { ephemeralSecret, checkCredentials, signSession, verifySession } from '../src/cu/auth';
import { capChroma, contrastRatio, deriveBrand, parseHex, rgbToOklch } from '../src/cu/contrast';
import { getCuTenant } from '../src/cu/tenants';
import { getAggregates, getBranding, getTenantCounters, recordCheck, recordGradeRun, recordLoanClick, resetCuStore, saveBranding, saveSettings } from '../src/cu/cu-store';
import { readLogoFile } from '../src/cu/logo-file';
import { formatOcrLog, pickOcrFields } from '../src/cu/ocr';
import { sendAggregateSummary, summaryText } from '../src/cu/notify';
import { POST } from '../src/app/(cu)/api/cu/[tenant]/extract/route';
import { POST as loanClickPost } from '../src/app/(cu)/api/cu/[tenant]/loan-click/route';
import { sampleGrant } from '../src/cu/sample-grant';

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
  assert.equal(brand.shortName, 'Example Credit Union');
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
  await recordGradeRun('harborlight-cu');
  await recordLoanClick('harborlight-cu');
  await recordLoanClick('harborlight-cu');
  const counters = await getTenantCounters('harborlight-cu');
  assert.deepEqual(counters, { gradesRun: 1, loanClicks: 2 });
  assert.deepEqual(Object.keys(counters).sort(), ['gradesRun', 'loanClicks']);
  resetCuStore();
});

test('aggregate email is off until a tenant turns it on', async () => {
  resetCuStore();
  const skipped = await sendAggregateSummary('harborlight-cu');
  assert.deepEqual(skipped, { sent: false, reason: 'disabled' });
  const text = summaryText('Harborlight Credit Union', { gradesRun: 3, loanClicks: 1 });
  assert.match(text, /Grades run: 3/);
  assert.match(text, /Loan button clicks \(not applications or unique members\): 1/);
  assert.match(text, /Grades describe offers, not members\./);
  assert.equal(text.includes('Checks'), false);
  assert.equal(text.includes('Worksheet'), false);
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
  assert.equal(existsSync('src/app/(cu)/credit-unions/get-started/checkout-stubs.ts'), false);
  const src = readFileSync('src/app/(cu)/credit-unions/get-started/actions.ts', 'utf8');
  assert.match(src, /PAYMENTS ARE NOT BUILT/);
  assert.equal(src.includes('sk_live'), false);
  assert.equal(src.includes('sk_test'), false);
  assert.equal(src.toLowerCase().includes('stripe'), false);
});

test('growth copy and the worksheet route stay on the approved words', () => {
  const page = readFileSync('src/app/(cu)/credit-unions/page.tsx', 'utf8');
  const started = readFileSync('src/app/(cu)/credit-unions/get-started/page.tsx', 'utf8');
  const privacy = readFileSync('src/app/(cu)/credit-unions/privacy/page.tsx', 'utf8');
  const copy = readFileSync('src/cu/copy.ts', 'utf8');
  const dashboard = readFileSync('src/app/(cu)/cu/[tenant]/dashboard/page.tsx', 'utf8');
  const admin = readFileSync('src/app/(cu)/cu/admin/page.tsx', 'utf8');
  const actions = readFileSync('src/app/(cu)/cu/actions.ts', 'utf8');
  const extract = readFileSync('src/app/(cu)/api/cu/[tenant]/extract/route.ts', 'utf8');
  const form = readFileSync('src/app/(cu)/cu/[tenant]/CheckForm.tsx', 'utf8');
  const value = 'Members enter or upload a dealer quote, get a grade in 30 seconds, and are sent to your auto loan, all under your brand.';
  assert.equal(page.includes('Most chosen'), false);
  assert.equal(/\bfees?\b/i.test(page.replaceAll('No setup fee.', '')), false);
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
  assert.match(page, /See a sample grade/);
  assert.equal(page.includes('See it in action'), false);
  assert.equal(page.includes('Open live demo'), false);
  assert.equal(page.includes('<LiveEmbed'), false);
  assert.equal(page.includes('md:hidden'), false);
  assert.match(page, /Free for 90 days\. No card\./);
  assert.equal(page.includes('Cancel anytime'), false);
  assert.equal(page.includes('DemoFrame'), false);
  assert.match(page, /STARTER_IS_LOWEST \? 'From ' : ''/);
  assert.match(page, /\$\{formatUsd\(STARTER\.annualUsd\)\}\/yr\./);
  assert.match(page, /'No setup fee\. '/);
  assert.match(page, /No card to start\./);
  assert.match(page, /text-\[14px\] leading-\[20px\] text-\[#555\]/);
  assert.equal(page.split('Get contract + DD packet').length - 1, 1);
  const iframe = readFileSync('src/app/(cu)/credit-unions/LiveEmbed.tsx', 'utf8');
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
  assert.match(copy, /DUE_DILIGENCE_PACKET_HREF = '\/credit-unions\/packet'/);
  assert.equal(copy.toLowerCase().includes('zero data retention'), false);
  assert.equal(copy.toLowerCase().includes('zdr'), false);
  assert.equal(copy.includes('AI_FACTS.join'), false);
  assert.equal(copy.includes('then discarded'), false);
  assert.match(privacy, /\{PILOT_MARK\}/);
  assert.match(privacy, /Pending counsel review/);
  assert.match(privacy, /Due-diligence packet/);
  assert.match(privacy, /Not the worksheet and not the numbers from it/);
  assert.match(privacy, /AI_FACTS/);
  assert.match(readFileSync('src/app/(cu)/credit-unions/terms/page.tsx', 'utf8'), /Pending counsel review/);
  assert.match(readFileSync('src/app/(cu)/credit-unions/terms/page.tsx', 'utf8'), /\{PILOT_MARK\}/);
  assert.match(readFileSync('src/app/(cu)/credit-unions/[...slug]/page.tsx', 'utf8'), /creditUnionAlias/);
  assert.equal(started.includes('AiDisclosure'), false);
  assert.match(started, /UploadDisclosure/);
  assert.match(started, /href="\/credit-unions\/privacy"/);
  assert.equal(dashboard.includes('Since pilot start'), false);
  assert.match(dashboard, /All time/);
  assert.match(dashboard, /href=\{shareUrl\}/);
  assert.match(dashboard, /memberOrigin/);
  assert.equal(dashboard.includes('https://signorwalk.com/cu/${'), false);
  assert.match(dashboard, /Your member link/);
  const memberAt = dashboard.indexOf('Your member link');
  const loanAt = dashboard.indexOf('<LoanLinksForm');
  const settingsAt = dashboard.indexOf('settings-heading');
  assert.ok(memberAt >= 0 && loanAt > memberAt && settingsAt > loanAt);
  const loanForm = readFileSync('src/app/(cu)/cu/[tenant]/dashboard/LoanLinksForm.tsx', 'utf8');
  assert.match(loanForm, /These fields start empty/);
  assert.match(loanForm, /noValidate/);
  assert.match(loanForm, /aria-invalid/);
  assert.match(loanForm, /HTTPS_LINK/);
  assert.match(loanForm, /LOAN_LINK_REQUIRED/);
  assert.match(loanForm, /Restore default/);
  assert.match(actions, /loanLinksSet = false/);
  assert.match(loanForm, /#B42318/);
  assert.equal(dashboard.includes('defaultValue={tenant.preApprovalUrl}'), false);
  assert.equal(loanForm.includes('defaultValue={tenant.preApprovalUrl}'), false);
  assert.match(dashboard, /Loan button clicks \(not applications or unique members\)/);
  assert.match(dashboard, /text-left/);
  assert.equal(dashboard.includes('text-center'), false);
  assert.match(dashboard, /CopyLink/);
  assert.match(dashboard, /whitespace-pre overflow-x-auto/);
  assert.match(dashboard, /text-\[14px\]/);
  assert.match(dashboard, /md:w-auto/);
  assert.match(readFileSync('src/app/(cu)/cu/[tenant]/dashboard/CopyLink.tsx', 'utf8'), /Copy link/);
  const account = readFileSync('src/app/(cu)/cu/AccountMenu.tsx', 'utf8');
  assert.match(account, />\s*Account\s*</);
  assert.equal(account.includes('md:hidden'), false);
  assert.match(form, /safe-area-inset-bottom/);
  assert.match(form, /Add APR and check again/);
  assert.match(form, /Partial grade — add APR/);
  assert.match(form, /Try a sample deal/);
  assert.match(form, /Checking…/);
  assert.match(form, /cu-err/);
  assert.match(form, /cu-ring/);
  const readout = readFileSync('src/app/(cu)/cu/[tenant]/GradeReadout.tsx', 'utf8');
  assert.match(readout, /pinned \? 'Check your rate'/);
  assert.match(readout, /Check your rate with \$\{shortName\}/);
  assert.match(readout, /md:hidden/);
  assert.match(readout, /See auto rates/);
  assert.match(readout, /inline-flex items-center gap-2/);
  assert.match(readout, /target="_top"/);
  assert.match(readout, /window\.print/);
  assert.match(readout, /aria-live="polite"/);
  assert.match(readout, /Copied/);
  assert.match(readout, /How we grade/);
  assert.match(readout, /aria-label=\{`Grade \$\{report\.grade\}, \$\{quality\}`\}/);
  assert.match(readout, /aria-hidden="true"/);
  assert.equal(form.includes('showRatesWithGrade'), false);
  assert.equal(form.includes('ADD_APR_RECOMMENDATION'), false);
  assert.equal(readout.includes('vs market') || readout.includes('vs average') || readout.includes('vs typical'), false);
  assert.match(dashboard, /Set the loan application URL before you share the member link/);
  assert.match(dashboard, /Grades run/);
  assert.match(dashboard, /Grades describe offers, not members\./);
  assert.match(dashboard, /Trial: \{trialDays\}/);
  assert.match(dashboard, /Email us/);
  assert.match(dashboard, /\/preview/);
  assert.equal(dashboard.includes('No checks yet'), false);
  assert.equal(dashboard.includes('Get contract + DD packet'), false);
  assert.match(admin, /hidden py-3 pr-4 font-semibold md:table-cell">Email/);
  assert.match(admin, /text-right font-semibold">Grades run/);
  assert.match(admin, /Loan button clicks \(not applications or unique members\)/);
  const preview = readFileSync('src/app/(cu)/cu/[tenant]/preview/page.tsx', 'utf8');
  assert.match(preview, /Educational comparison\. Not an offer of credit\./);
  assert.equal(preview.includes('description: `'), false);
  assert.match(preview, /previewRun/);
  const analyze = readFileSync('src/app/(cu)/api/cu/[tenant]/analyze/route.ts', 'utf8');
  assert.match(analyze, /ownerPreview/);
  assert.match(analyze, /if \(!sample && !ownerPreview\)/);
  assert.match(analyze, /if \(!sample && \(grade === 'A'/);
  const loanClick = readFileSync('src/app/(cu)/api/cu/[tenant]/loan-click/route.ts', 'utf8');
  assert.match(loanClick, /!sample && !ownerPreview/);
  assert.match(readout, /previewPage \? '\?preview=1'/);
  const privacyPage = readFileSync('src/app/(cu)/credit-unions/privacy/page.tsx', 'utf8');
  assert.match(privacyPage, /Vercel hosts the application/);
  assert.match(privacyPage, /Redis\/KV store/);
  const packet = readFileSync('src/cu/packet/documents.ts', 'utf8');
  assert.match(packet, /Upstash Redis or Vercel KV/);
  assert.match(admin, /Grades describe offers, not members\./);
  assert.equal(admin.includes('">Checks'), false);
  assert.match(admin, /text-right tabular-nums/);
  const branding = readFileSync('src/app/(cu)/cu/[tenant]/dashboard/BrandingForm.tsx', 'utf8');
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
  const signup = readFileSync('src/app/(cu)/credit-unions/get-started/actions.ts', 'utf8');
  assert.match(signup, /takeSignupSlot/);
  assert.match(signup, /createTrial/);
  assert.equal(signup.includes('console.'), false);
  assert.equal(extract.includes('export const GET'), false);
  assert.match(extract, /export async function POST/);
  assert.match(form, /FILE_READ_ERROR/);
  assert.match(form, /UploadDisclosure/);
  assert.match(readFileSync('src/cu/UploadDisclosure.tsx', 'utf8'), /DUE_DILIGENCE_PACKET_HREF/);
  const rateNote = readFileSync('docs/analyze-rate-limit.md', 'utf8');
  assert.match(rateNote, /section 6\.5/);
  assert.match(rateNote, /12 requests per 60 seconds/);
  assert.match(rateNote, /have not been load-tested/);
  assert.match(rateNote, /Open item: there is no shared limit across instances/);
  assert.equal(rateNote.toLowerCase().includes('firewall rule is configured'), false);
  assert.match(readFileSync('src/app/(cu)/credit-unions/demo/preapproval/page.tsx', 'utf8'), /<DemoPage demo title=\{title\} body=\{body\} \/>/);
  assert.match(readFileSync('src/app/(cu)/credit-unions/demo/rates/page.tsx', 'utf8'), /Your auto rates page goes here/);
  assert.match(readFileSync('src/app/(cu)/credit-unions/demo/help/page.tsx', 'utf8'), /Your help page goes here/);
  assert.match(readFileSync('src/app/(cu)/credit-unions/demo/privacy/page.tsx', 'utf8'), /Your privacy page goes here/);
  assert.match(readFileSync('src/app/(cu)/credit-unions/demo/DemoPage.tsx', 'utf8'), /href="\/cu\/harborlight-cu"/);
  assert.match(form, /Partial grade — add more figures/);
  assert.match(form, /Sample C/);
  assert.match(form, /errorRef/);
  const siteLayout = readFileSync('src/app/(site)/layout.tsx', 'utf8');
  assert.match(siteLayout, /<html lang="en">/);
  assert.match(siteLayout, /impactcdn/);
  assert.match(siteLayout, /application\/ld\+json/);
  const cuLayout = readFileSync('src/app/(cu)/layout.tsx', 'utf8');
  assert.match(cuLayout, /<html lang="en">/);
  assert.match(cuLayout, /url: '\/cu\/icon'/);
  assert.equal(cuLayout.includes('impactcdn'), false);
  assert.equal(existsSync('src/app/layout.tsx'), false);
  assert.equal(readFileSync('src/middleware.ts', 'utf8').includes('x-pathname'), false);
  assert.equal(readFileSync('next.config.ts', 'utf8').includes('htmlLimitedBots'), false);
  assert.equal(existsSync('src/app/favicon.ico'), false);
  assert.match(form, /href="\/credit-unions\/privacy"/);
  assert.equal(form.includes('AI_FACTS'), false);
  assert.match(form, /numbersOnly/);
  assert.match(form, /demoSample/);
  assert.match(form, /Incomplete: add your APR for a full grade\./);
  assert.match(form, /A blank APR stays incomplete and does not show a letter\./);
  assert.equal(form.includes('ADD_APR_RECOMMENDATION'), false);
  assert.match(form, /Partial grade — add APR/);
  assert.equal(form.includes("from '@/cu/engine/evaluate"), false);
  assert.equal(form.includes("from '@/cu/engine/report"), false);
  assert.equal(form.includes('/api/analyze'), false);
  assert.match(dashboard, /border cu-line bg-white/);
  assert.match(loanForm, /Save links/);
  assert.match(dashboard, /Save website/);
  assert.match(readFileSync('src/app/(cu)/credit-unions/embed-demo/EmbedDemo.tsx', 'utf8'), /entry=numbers/);
  const embedPage = readFileSync('src/app/(cu)/cu/[tenant]/embed/page.tsx', 'utf8');
  assert.match(embedPage, /numbersOnlyEmbed/);
  assert.match(embedPage, /demoSample=\{query\.entry === 'numbers'/);
  assert.equal(readFileSync('src/app/(cu)/cu/actions.ts', 'utf8').includes('verified = true'), false);
  assert.match(dashboard, /const sampleSearch = getCuTenant\(tenant\.id\) \? '\?sample=1' : ''/);
  const linkBlock = readout.slice(readout.indexOf('const link = ('), readout.indexOf('if (pinned) return link'));
  assert.equal(linkBlock.includes('data-cta-measure'), false);
  assert.match(readout, /data-cta-measure/);
});

test('an unsigned sample loan click still counts when the grant is required', async () => {
  resetCuStore();
  const saved = process.env.CU_SESSION_SECRET;
  process.env.CU_SESSION_SECRET = 'loan-click-grant-test';
  try {
    const bare = await loanClickPost(
      new Request('https://signorwalk.com/api/cu/harborlight-cu/loan-click?sample=1', { method: 'POST' }),
      { params: Promise.resolve({ tenant: 'harborlight-cu' }) },
    );
    assert.equal(bare.status, 200);
    assert.equal((await getTenantCounters('harborlight-cu')).loanClicks, 1);
    const grant = sampleGrant('harborlight-cu');
    assert.ok(grant);
    const signed = await loanClickPost(
      new Request(`https://signorwalk.com/api/cu/harborlight-cu/loan-click?sample=1&grant=${encodeURIComponent(grant)}`, { method: 'POST' }),
      { params: Promise.resolve({ tenant: 'harborlight-cu' }) },
    );
    assert.equal(signed.status, 200);
    assert.equal((await getTenantCounters('harborlight-cu')).loanClicks, 1);
  } finally {
    if (saved === undefined) delete process.env.CU_SESSION_SECRET;
    else process.env.CU_SESSION_SECRET = saved;
    resetCuStore();
  }
});
