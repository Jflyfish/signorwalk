import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { POST as analyze } from '../src/app/api/cu/[tenant]/analyze/route';
import { POST as extract } from '../src/app/api/cu/[tenant]/extract/route';
import { appendAudit, formatAuditLine, readAudit, readFrameAncestorCache, resetCuStore, writeFrameAncestorCache } from '../src/cu/cu-store';
import { getCuTenant } from '../src/cu/tenants';
import {
  listCuTenants,
  loadCuTenant,
  normalizeProfile,
  parseEmbedOrigins,
  removalConfirmed,
  removalIdMatches,
  removeTenant,
  saveTenantProfile,
  setTenantStatus,
  tenantBrandOk,
} from '../src/cu/tenant-directory';

test('demo tenants seed the store and stay in config', async () => {
  resetCuStore();
  const rows = await listCuTenants();
  assert.deepEqual(rows.map(row => row.id), ['harborlight-cu', 'summit-ridge-fcu', 'larkspur-cu']);
  assert.equal(rows.every(row => row.status === 'active'), true);
  assert.equal(getCuTenant('harborlight-cu')?.name, 'Harborlight Credit Union');
  const profile = normalizeProfile({
    id: 'harborlight-cu',
    name: 'Harbor Light Credit Union',
    preApprovalUrl: 'https://www.harborlightcu.example/borrow',
    ratesUrl: 'https://www.harborlightcu.example/rates',
    embedOrigins: ['https://www.harborlightcu.example'],
    status: 'active',
    shortName: 'Harbor Light',
  });
  assert.ok(profile);
  await saveTenantProfile(profile);
  assert.equal((await loadCuTenant('harborlight-cu'))?.name, 'Harbor Light Credit Union');
  assert.equal(getCuTenant('harborlight-cu')?.name, 'Harborlight Credit Union');
  resetCuStore();
});

test('the owner can add and remove a credit union without dropping the seeds', async () => {
  resetCuStore();
  const profile = normalizeProfile({
    id: 'north-pier-cu',
    name: 'North Pier Credit Union',
    preApprovalUrl: 'https://www.northpiercu.example/auto',
    ratesUrl: 'https://www.northpiercu.example/rates',
    embedOrigins: [],
    status: 'active',
    shortName: 'North Pier CU',
  });
  assert.ok(profile);
  assert.equal(tenantBrandOk(profile.id, 'North Pier CU', '#075985'), true);
  assert.equal(tenantBrandOk(profile.id, 'North Pier CU', '#ffff'), false);
  await saveTenantProfile(profile, { shortName: 'North Pier CU', primary: '#075985' });
  assert.equal((await loadCuTenant('north-pier-cu'))?.brand.shortName, 'North Pier CU');
  await removeTenant('north-pier-cu');
  assert.equal(await loadCuTenant('north-pier-cu'), undefined);
  assert.equal((await loadCuTenant('summit-ridge-fcu'))?.status, 'active');
  assert.equal(removalConfirmed('remove'), true);
  assert.equal(removalConfirmed('yes'), false);
  assert.equal(removalIdMatches('north-pier-cu', 'north-pier-cu'), true);
  assert.equal(removalIdMatches('north-pier', 'north-pier-cu'), false);
  await appendAudit('create', 'north-pier-cu', 'owner');
  await appendAudit('remove', 'north-pier-cu', 'tenant');
  const audit = await readAudit();
  assert.deepEqual(audit.map(line => line.action), ['create', 'remove']);
  assert.deepEqual(audit.map(line => line.who), ['owner', 'tenant']);
  assert.equal(audit.every(line => line.id === 'north-pier-cu' && !line.t.includes('@')), true);
  assert.equal(JSON.stringify(audit).includes('example'), false);
  assert.equal(
    formatAuditLine({ t: '2026-10-15T14:30:00.000Z', action: 'pause', who: 'owner' }, 'Larkspur CU'),
    'Oct 15, 14:30 · Paused Larkspur CU · by owner',
  );
  assert.equal(
    formatAuditLine({ t: '2026-10-15T14:50:00.000Z', action: 'branding', who: 'tenant' }, 'Larkspur CU'),
    'Oct 15, 14:50 · Branded Larkspur CU · by tenant',
  );
  assert.deepEqual(parseEmbedOrigins('https://www.northpiercu.example\n'), ['https://www.northpiercu.example']);
  assert.equal(parseEmbedOrigins('*'), null);
  assert.equal(parseEmbedOrigins('https://evil.example/path'), null);
  await assert.rejects(() => saveTenantProfile({
    ...profile,
    id: 'north-pier-cu',
    name: '123-45-6789',
  }));
  resetCuStore();
});

test('a paused credit union is unavailable on the page and returns 404 from the APIs', async () => {
  resetCuStore();
  writeFrameAncestorCache('larkspur-cu', "'self' https://www.larkspurcu.example", Date.now() + 30_000);
  await setTenantStatus('larkspur-cu', 'paused');
  assert.equal(readFrameAncestorCache('larkspur-cu', Date.now()), undefined);
  assert.equal((await loadCuTenant('larkspur-cu'))?.status, 'paused');
  const analyzeRes = await analyze(new NextRequest('https://signorwalk.com/api/cu/larkspur-cu/analyze', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ dealType: 'finance', sellingPrice: '30000' }),
  }), { params: Promise.resolve({ tenant: 'larkspur-cu' }) });
  assert.equal(analyzeRes.status, 404);
  const analyzeBody = await analyzeRes.json() as { success: boolean; error: string };
  assert.equal(analyzeBody.success, false);
  assert.equal(analyzeBody.error, 'This check is unavailable.');
  assert.equal(JSON.stringify(analyzeBody).includes('sellingPrice'), false);
  const extractRes = await extract(new NextRequest('https://signorwalk.com/api/cu/larkspur-cu/extract', { method: 'POST' }), {
    params: Promise.resolve({ tenant: 'larkspur-cu' }),
  });
  assert.equal(extractRes.status, 404);
  const page = readFileSync('src/app/cu/[tenant]/page.tsx', 'utf8');
  const embed = readFileSync('src/app/cu/[tenant]/embed/page.tsx', 'utf8');
  const editor = readFileSync('src/app/cu/admin/OwnerEditor.tsx', 'utf8');
  const admin = readFileSync('src/app/cu/admin/page.tsx', 'utf8');
  assert.match(page, /tenantUnavailable/);
  assert.match(embed, /tenantUnavailable/);
  assert.match(editor, /BrandingForm/);
  assert.match(editor, /confirm=remove/);
  assert.match(editor, /confirm=pause/);
  assert.match(editor, /confirmId/);
  assert.match(editor, /cu-danger/);
  assert.match(editor, /'Pause'/);
  assert.match(editor, /Add at least one website that can show the tool\./);
  assert.match(editor, /Add website/);
  assert.match(editor, /Staff who start a trial sign in with the email and password from signup\./);
  assert.match(readFileSync('src/app/cu/actions.ts', 'utf8'), /need=site#embed-allowlist/);
  assert.equal(admin.includes('font-mono'), false);
  assert.match(readFileSync('src/cu/tenant-directory.ts', 'utf8'), /Paused\. Members see an unavailable page\./);
  assert.match(admin, /STATUS_PAUSED/);
  assert.match(admin, /'Paused'/);
  assert.match(admin, /'Active'/);
  assert.match(admin, /formatAuditLine/);
  assert.match(readFileSync('src/app/cu/actions.ts', 'utf8'), /appendAudit\('branding', tenant, owner \? 'owner' : 'tenant'\)/);
  assert.match(admin, /Add credit union/);
  assert.match(admin, /section=usage/);
  assert.equal(admin.includes('Tenants'), false);
  assert.equal(admin.includes('Accounts'), false);
  resetCuStore();
});
