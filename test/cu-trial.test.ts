import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { ephemeralSecret } from '../src/cu/auth';
import { readStoreJson, resetCuStore, storeKey } from '../src/cu/cu-store';
import { resetSignupRateLimit, SIGNUP_LIMIT, takeSignupSlot } from '../src/cu/rate-limit';
import { deleteStaffLogin, staffLoginMatches } from '../src/cu/staff-login';
import { loadCuTenant, removeTenant, tenantUnavailable } from '../src/cu/tenant-directory';
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
  const profile = await readStoreJson<{ confirmHash?: string }>(storeKey(created.id, 'profile'));
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

test('signup is limited to five an hour and an ended trial is unavailable', () => {
  resetSignupRateLimit();
  for (let n = 0; n < SIGNUP_LIMIT; n += 1) assert.equal(takeSignupSlot('203.0.113.10', 1_700_000_000_000).allowed, true);
  assert.equal(takeSignupSlot('203.0.113.10', 1_700_000_000_000).allowed, false);
  assert.equal(takeSignupSlot('203.0.113.11', 1_700_000_000_000).allowed, true);
  resetSignupRateLimit();
  assert.equal(tenantUnavailable({ status: 'active', trialEndsAt: '2026-01-01T00:00:00.000Z' }, Date.parse('2026-10-15T00:00:00.000Z')), true);
  assert.equal(tenantUnavailable({ status: 'active' }), false);
  assert.equal(tenantUnavailable({ status: 'paused' }), true);
  const actions = readFileSync('src/app/cu/actions.ts', 'utf8');
  assert.match(actions, /staffLoginMatches/);
  assert.match(actions, /verified === false/);
  assert.match(actions, /notice=confirm/);
  const middleware = readFileSync('src/middleware.ts', 'utf8');
  assert.equal(middleware.includes(`return "'self'"`), false);
});
