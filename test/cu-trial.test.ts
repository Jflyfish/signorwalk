import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { ephemeralSecret } from '../src/cu/auth';
import { NextRequest } from 'next/server';
import { incrementWindow, readStoreJson, resetCuStore, storeKey } from '../src/cu/cu-store';
import { FRAME_ANCESTORS_HEADER, frameAncestorsToken } from '../src/cu/embed';
import { missingCreditUnionResponse } from '../src/middleware';
import { resetSignupRateLimit, SIGNUP_LIMIT, takeSignupSlot } from '../src/cu/rate-limit';
import { deleteStaffLogin, staffLoginMatches } from '../src/cu/staff-login';
import { loadCuTenant, removeTenant, tenantUnavailable } from '../src/cu/tenant-directory';
import { signupNotifyAddress } from '../src/cu/notify';
import { createTrial, TRIAL_MS } from '../src/cu/trial';

test('a trial creates a hashed staff login and a 90-day end', async () => {
  resetCuStore();
  const secret = ephemeralSecret();
  const email = `trial-${randomBytes(4).toString('hex')}@example.com`;
  const now = Date.parse('2026-10-15T16:00:00.000Z');
  const created = await createTrial({
    name: 'Riverbend Credit Union',
    contactName: 'Avery Chen',
    email,
    secret,
    website: 'www.riverbend.example',
    honeypot: '',
    tier: 'growth',
    now,
  });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  assert.equal(created.id, 'riverbend-credit-union');
  const tenant = await loadCuTenant(created.id);
  assert.equal(tenant?.verified, false);
  assert.equal(tenant?.contactName, 'Avery Chen');
  assert.equal(tenant?.trialEndsAt, new Date(now + TRIAL_MS).toISOString());
  assert.equal(tenant?.brand.shortName, 'Riverbend Credit Union');
  assert.equal(tenant?.brand.primary, '#111111');
  assert.deepEqual(tenant?.embedOrigins, ['https://www.riverbend.example']);
  const staff = await readStoreJson<{ email: string; hash: string }>(storeKey(created.id, 'staff'));
  const stored = JSON.stringify(staff);
  assert.equal(stored.includes(secret), false);
  assert.equal(/password/i.test(stored), false);
  assert.equal(staff?.email, email);
  assert.match(staff?.hash ?? '', /^scrypt:/);
  assert.equal(await staffLoginMatches(created.id, email, secret), true);
  assert.equal(await staffLoginMatches(created.id, email, ephemeralSecret()), false);
  const profile = await readStoreJson<{ confirmHash?: string; tier?: string; loanLinksSet?: boolean }>(storeKey(created.id, 'profile'));
  assert.equal(profile?.tier, 'growth');
  assert.equal(profile?.loanLinksSet, false);
  assert.equal(profile?.confirmHash, createHash('sha256').update(created.confirmToken).digest('hex'));
  assert.equal(JSON.stringify(profile).includes(secret), false);
  const again = await createTrial({
    name: 'Riverbend Credit Union',
    contactName: 'Avery Chen',
    email,
    secret: ephemeralSecret(),
    website: '',
    honeypot: '',
    now,
  });
  assert.equal(again.ok, true);
  if (again.ok) {
    assert.equal(again.id, 'riverbend-credit-union-2');
    assert.deepEqual((await loadCuTenant(again.id))?.embedOrigins, []);
  }
  const trapped = await createTrial({
    name: 'Riverbend Credit Union',
    contactName: 'Avery Chen',
    email,
    secret,
    website: '',
    honeypot: 'filled',
  });
  assert.deepEqual(trapped, { ok: false, error: 'honeypot' });
  assert.equal(await loadCuTenant('admin'), undefined);
  const reserved = await createTrial({
    name: 'Admin',
    contactName: 'Avery Chen',
    email,
    secret,
    website: '',
    honeypot: '',
  });
  assert.deepEqual(reserved, { ok: false, error: 'name' });
  await removeTenant(created.id);
  assert.equal(await staffLoginMatches(created.id, email, secret), false);
  await deleteStaffLogin('riverbend-credit-union-2');
  resetCuStore();
});

function withoutStoreEnv(): () => void {
  const saved = {
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  };
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  return () => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
}

test('signup is limited to five an hour and an ended trial is unavailable', async () => {
  const restore = withoutStoreEnv();
  try {
    resetSignupRateLimit();
    for (let n = 0; n < SIGNUP_LIMIT; n += 1) {
      assert.equal((await takeSignupSlot('203.0.113.10', 1_700_000_000_000)).allowed, true);
    }
    assert.equal((await takeSignupSlot('203.0.113.10', 1_700_000_000_000)).allowed, false);
    assert.equal((await takeSignupSlot('203.0.113.11', 1_700_000_000_000)).allowed, true);
    resetSignupRateLimit();
    assert.equal(await incrementWindow(`cu:rate:signup:${'a'.repeat(24)}`, 3600), null);
  } finally {
    restore();
  }
  assert.equal(tenantUnavailable({ status: 'active', trialEndsAt: '2026-01-01T00:00:00.000Z' }, Date.parse('2026-10-15T00:00:00.000Z')), true);
  assert.equal(tenantUnavailable({ status: 'active' }), false);
  assert.equal(tenantUnavailable({ status: 'paused' }), true);
  assert.equal(tenantUnavailable({ status: 'active', verified: false }), true);
  const actions = readFileSync('src/app/cu/actions.ts', 'utf8');
  assert.match(actions, /staffLoginMatches/);
  assert.match(actions, /verified === false/);
  assert.match(actions, /notice=confirm/);
  assert.equal(actions.includes('verified = true'), false);
  assert.match(actions, /resendConfirmAction/);
  assert.match(readFileSync('src/app/cu/[tenant]/confirm/route.ts', 'utf8'), /profile\.verified = true/);
  assert.match(readFileSync('src/app/cu/[tenant]/dashboard/page.tsx', 'utf8'), /Check your email to confirm/);
  const rate = readFileSync('src/cu/rate-limit.ts', 'utf8');
  assert.match(rate, /incrementWindow/);
  assert.match(rate, /Do not add a production Firewall rule for signup yet/);
  assert.match(readFileSync('src/app/credit-unions/get-started/actions.ts', 'utf8'), /await takeSignupSlot/);
  const signup = readFileSync('src/app/credit-unions/get-started/actions.ts', 'utf8');
  assert.match(signup, /appendAudit\('create', result\.id, 'tenant'\)/);
  assert.match(signup, /sendSignupNotice\(/);
  assert.match(readFileSync('src/cu/notify.ts', 'utf8'), /CU_SIGNUP_NOTIFY_EMAIL/);
  const savedNotify = process.env.CU_SIGNUP_NOTIFY_EMAIL;
  delete process.env.CU_SIGNUP_NOTIFY_EMAIL;
  assert.equal(signupNotifyAddress(), 'team@signorwalk.com');
  process.env.CU_SIGNUP_NOTIFY_EMAIL = 'ops@example.com';
  assert.equal(signupNotifyAddress(), 'ops@example.com');
  process.env.CU_SIGNUP_NOTIFY_EMAIL = 'not-an-email';
  assert.equal(signupNotifyAddress(), 'team@signorwalk.com');
  if (savedNotify === undefined) delete process.env.CU_SIGNUP_NOTIFY_EMAIL;
  else process.env.CU_SIGNUP_NOTIFY_EMAIL = savedNotify;
  const middleware = readFileSync('src/middleware.ts', 'utf8');
  assert.equal(middleware.includes(`return "'self'"`), false);
  assert.match(middleware, /missingCreditUnionResponse/);
});

test('two isolates share the signup counter when the store is used', async () => {
  const counts = new Map<string, number>();
  const shared: typeof incrementWindow = async (key) => {
    assert.equal(key.includes('203.0.113.10'), false);
    assert.match(key, /^cu:rate:signup:[a-f0-9]{24}$/);
    const count = (counts.get(key) ?? 0) + 1;
    counts.set(key, count);
    return { count, ttl: 3600 };
  };
  resetSignupRateLimit();
  for (let n = 0; n < SIGNUP_LIMIT; n += 1) {
    assert.equal((await takeSignupSlot('203.0.113.10', 1_700_000_000_000, shared)).allowed, true);
  }
  resetSignupRateLimit();
  const blocked = await takeSignupSlot('203.0.113.10', 1_700_000_000_000, shared);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSec, 3600);
  assert.equal(counts.size, 1);
  const calls: string[][] = [];
  let count = 0;
  const opened = await incrementWindow(`cu:rate:signup:${'ab'.repeat(12)}`, 3600, async parts => {
    calls.push(parts);
    if (parts[0] === 'INCR') {
      count += 1;
      return count;
    }
    if (parts[0] === 'TTL') return -1;
    if (parts[0] === 'EXPIRE') return 1;
    return null;
  });
  assert.equal(opened?.count, 1);
  assert.equal(opened?.ttl, 3600);
  assert.deepEqual(calls[0], ['INCR', `cu:rate:signup:${'ab'.repeat(12)}`]);
  assert.equal(calls.some(parts => parts[0] === 'EXPIRE'), true);
  assert.equal(await incrementWindow('cu:rate:signup:not-a-hash', 3600, async () => 1), null);
});

test('missing and removed credit unions answer 404', async () => {
  const nope = await missingCreditUnionResponse('/cu/nope', async () => false);
  assert.equal(nope?.status, 404);
  const nopeHtml = await nope!.text();
  assert.match(nopeHtml, /This credit union page does not exist/);
  assert.equal(nopeHtml.includes('<nav'), false);
  const unknown = await missingCreditUnionResponse('/cu/harborlight-cu/not-a-page', async () => true);
  assert.equal(unknown?.status, 404);
  const removed = await missingCreditUnionResponse('/cu/river-cu/dashboard', async () => false);
  assert.equal(removed?.status, 404);
  const index = await missingCreditUnionResponse('/cu', async () => true);
  assert.equal(index?.status, 404);
  const adminExtra = await missingCreditUnionResponse('/cu/admin/tools', async () => true);
  assert.equal(adminExtra?.status, 404);
  assert.equal(await missingCreditUnionResponse('/cu/harborlight-cu', async () => true), null);
  assert.equal(await missingCreditUnionResponse('/cu/admin', async () => false), null);
  assert.equal(await missingCreditUnionResponse('/credit-unions', async () => false), null);

  resetCuStore();
  const { GET } = await import('../src/app/api/cu/present/route');
  const headers = { [FRAME_ANCESTORS_HEADER]: frameAncestorsToken() };
  const secret = ephemeralSecret();
  const email = `gone-${randomBytes(4).toString('hex')}@example.com`;
  const created = await createTrial({
    name: 'Northwind Credit Union',
    contactName: 'Avery Chen',
    email,
    secret,
    website: '',
    honeypot: '',
  });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const live = await GET(new NextRequest(`http://127.0.0.1/api/cu/present?id=${created.id}`, { headers }));
  assert.equal(live.status, 204);
  await removeTenant(created.id);
  const gone = await GET(new NextRequest(`http://127.0.0.1/api/cu/present?id=${created.id}`, { headers }));
  assert.equal(gone.status, 404);
  const unknownId = await GET(new NextRequest('http://127.0.0.1/api/cu/present?id=nope', { headers }));
  assert.equal(unknownId.status, 404);
  const seeded = await GET(new NextRequest('http://127.0.0.1/api/cu/present?id=harborlight-cu', { headers }));
  assert.equal(seeded.status, 204);
  const denied = await GET(new NextRequest('http://127.0.0.1/api/cu/present?id=harborlight-cu'));
  assert.equal(denied.status, 404);
  resetCuStore();
});
