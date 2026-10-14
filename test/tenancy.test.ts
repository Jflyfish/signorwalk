import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { ANALYZE_LOG_KEYS, formatAnalyzeLog } from '../src/lib/analyze-log';
import { SECURITY_HEADERS } from '../src/lib/security-headers';
import { middleware } from '../src/middleware';
import { contrastRatio, parseRgbChannels } from '../src/tenants/contrast';
import { isPathDisabled } from '../src/tenants/disabled-paths';
import { toPublicTenant } from '../src/tenants/public';
import { getTenantById, SOW_TENANT, TENANTS } from '../src/tenants/registry';
import { normalizeHost, resolveTenant, tenantForHost, tenantOverrideAllowed } from '../src/tenants/resolve';

test('host normalization strips ports and case', () => {
  assert.equal(normalizeHost('SignOrWalk.com:443'), 'signorwalk.com');
  assert.equal(normalizeHost('[::1]:3000'), '::1');
  assert.equal(tenantForHost('signorwalk.com')?.id, 'sow');
  assert.equal(tenantForHost('www.signorwalk.com')?.id, 'sow');
  assert.equal(tenantForHost('localhost:3000')?.id, 'sow');
  assert.equal(tenantForHost('my-preview.vercel.app')?.id, 'sow');
  assert.equal(tenantForHost('harborlight.signorwalk.app')?.id, 'harborlight-cu');
  assert.equal(tenantForHost('summitridge.signorwalk.app')?.id, 'summit-ridge-fcu');
  assert.equal(tenantForHost('unknown.signorwalk.app'), null);
  assert.equal(tenantForHost('signorwalk.app'), null);
});

test('preview tenant override is ignored in production', () => {
  assert.equal(tenantOverrideAllowed({}), true);
  assert.equal(tenantOverrideAllowed({ VERCEL_ENV: 'preview' }), true);
  assert.equal(tenantOverrideAllowed({ VERCEL_ENV: 'production' }), false);

  const preview = resolveTenant({
    host: 'my-app.vercel.app',
    queryTenant: 'harborlight-cu',
    overrideAllowed: true,
  });
  assert.equal(preview.tenant?.id, 'harborlight-cu');
  assert.equal(preview.setCookie, 'harborlight-cu');

  const stuck = resolveTenant({
    host: 'my-app.vercel.app',
    cookieTenant: 'summit-ridge-fcu',
    overrideAllowed: true,
  });
  assert.equal(stuck.tenant?.id, 'summit-ridge-fcu');

  const reset = resolveTenant({
    host: 'my-app.vercel.app',
    queryTenant: 'sow',
    cookieTenant: 'harborlight-cu',
    overrideAllowed: true,
  });
  assert.equal(reset.tenant?.id, 'sow');
  assert.equal(reset.clearCookie, true);

  const production = resolveTenant({
    host: 'signorwalk.com',
    queryTenant: 'harborlight-cu',
    cookieTenant: 'harborlight-cu',
    overrideAllowed: false,
  });
  assert.equal(production.tenant?.id, 'sow');
  assert.equal(production.setCookie, null);

  const productionHost = resolveTenant({
    host: 'harborlight.signorwalk.app',
    queryTenant: 'summit-ridge-fcu',
    overrideAllowed: false,
  });
  assert.equal(productionHost.tenant?.id, 'harborlight-cu');
});

test('disabled credit-union routes 404 and the consumer tenant does not', () => {
  const cu = getTenantById('harborlight-cu')!;
  for (const path of [
    '/blog',
    '/blog/some-post',
    '/glossary',
    '/ask-a-pro',
    '/negotiation-support',
    '/api/negotiation-support',
    '/api/capture-email',
    '/api/extract-document',
    '/analyze/advanced',
    '/about',
    '/contact',
    '/credit-unions',
  ]) {
    assert.equal(isPathDisabled(cu, path), true, path);
    assert.equal(isPathDisabled(SOW_TENANT, path), false, path);
  }
  assert.equal(isPathDisabled(cu, '/analyze'), false);
  assert.equal(isPathDisabled(cu, '/api/analyze'), false);
  assert.equal(isPathDisabled(cu, '/'), false);
});

function callMiddleware(url: string, env?: string) {
  const prev = process.env.VERCEL_ENV;
  if (env === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = env;
  try {
    return middleware(new NextRequest(url, { headers: { host: new URL(url).host } }));
  } finally {
    if (prev === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = prev;
  }
}

test('middleware returns 404 for disabled routes and unknown app hosts', async () => {
  const blog = await callMiddleware('https://preview.vercel.app/blog?tenant=harborlight-cu', 'preview');
  assert.equal(blog.status, 404);

  const analyze = await callMiddleware('https://preview.vercel.app/analyze?tenant=summit-ridge-fcu', 'preview');
  assert.equal(analyze.status, 200);
  assert.equal(analyze.headers.get('x-middleware-request-x-tenant'), 'summit-ridge-fcu');
  assert.equal(analyze.headers.get('x-robots-tag'), 'noindex, nofollow');

  const consumer = await callMiddleware('https://signorwalk.com/blog');
  assert.equal(consumer.status, 200);
  assert.equal(consumer.headers.get('x-robots-tag'), null);

  const unknown = await callMiddleware('https://nope.signorwalk.app/');
  assert.equal(unknown.status, 404);

  const ignored = await callMiddleware('https://signorwalk.com/analyze?tenant=harborlight-cu', 'production');
  assert.equal(ignored.status, 200);
  assert.equal(ignored.headers.get('x-middleware-request-x-tenant'), 'sow');

  const api = await callMiddleware('https://harborlight.signorwalk.app/api/capture-email', 'production');
  assert.equal(api.status, 404);
});

test('credit-union colors meet WCAG AA contrast for text', () => {
  const white: [number, number, number] = [255, 255, 255];
  for (const tenant of TENANTS) {
    if (tenant.id === 'sow') continue;
    const primary = parseRgbChannels(tenant.brand.colors.primary);
    const fg = parseRgbChannels(tenant.brand.colors.primaryFg);
    const accent = parseRgbChannels(tenant.brand.colors.accent);
    assert.ok(contrastRatio(primary, fg) >= 4.5, `${tenant.id} primary`);
    assert.ok(contrastRatio(accent, white) >= 4.5, `${tenant.id} accent on white`);
  }
});

test('public tenant links carry aggregate UTM parameters', () => {
  const pub = toPublicTenant(getTenantById('harborlight-cu')!);
  const pre = new URL(pub.cta.preApprovalUrl);
  assert.equal(pre.searchParams.get('utm_source'), 'signorwalk');
  assert.equal(pre.searchParams.get('utm_medium'), 'referral');
  assert.equal(pre.searchParams.get('utm_campaign'), 'harborlight-cu');
  assert.equal(pre.searchParams.get('utm_content'), 'preapproval');
  const rates = new URL(pub.cta.ratesUrl);
  assert.equal(rates.searchParams.get('utm_content'), 'rates');
  assert.equal(rates.searchParams.get('utm_campaign'), 'harborlight-cu');
  assert.throws(() => toPublicTenant(SOW_TENANT));
});

test('analyze logs cannot carry fields outside the allowlist', () => {
  const line = formatAnalyzeLog({
    ts: '2026-01-01T00:00:00.000Z',
    tenant: 'harborlight-cu',
    route: '/api/analyze',
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

test('security headers include clickjacking, nosniff, and a locked-down policy', () => {
  const keys = SECURITY_HEADERS.map(h => h.key);
  for (const key of ['X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy', 'Content-Security-Policy']) {
    assert.ok(keys.includes(key), key);
  }
  const csp = SECURITY_HEADERS.find(h => h.key === 'Content-Security-Policy')!.value;
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(SECURITY_HEADERS.find(h => h.key === 'Permissions-Policy')!.value, /payment=\(\)/);
});
