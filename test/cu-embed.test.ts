import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EMBED_COMPLETED,
  EMBED_RESIZE,
  allowEmbed,
  completedMessage,
  deepLink,
  embedTenantId,
  frameAncestorSources,
  frameAncestorsForPath,
  iframeSnippet,
  isEmbedOrigin,
  resizeMessage,
} from '../src/cu/embed';
import { securityHeaderList } from '../src/cu/headers';
import { GET as framePolicy } from '../src/app/api/cu/frame-ancestors/route';
import { resetCuStore } from '../src/cu/cu-store';
import { NextRequest } from 'next/server';
import { normalizeProfile, removeTenant, replaceEmbedOrigins, saveTenantProfile } from '../src/cu/tenant-directory';

async function csp(pathname: string): Promise<string> {
  const list = await securityHeaderList(pathname);
  return list.find(header => header.key === 'Content-Security-Policy')!.value;
}

async function frameOptions(pathname: string): Promise<string | undefined> {
  const list = await securityHeaderList(pathname);
  return list.find(header => header.key === 'X-Frame-Options')?.value;
}

test('embed CSP allowlist is per tenant and only on the embed route', async () => {
  resetCuStore();
  const member = await csp('/cu/harborlight-cu');
  assert.match(member, /frame-ancestors 'none'/);
  assert.equal(await frameOptions('/cu/harborlight-cu'), 'DENY');
  assert.equal(member.includes('fonts.googleapis'), false);

  const harbor = await csp('/cu/harborlight-cu/embed');
  assert.match(harbor, /frame-ancestors 'self' https:\/\/www\.harborlightcu\.example/);
  assert.equal(harbor.includes('www.summitridgefcu.example'), false);
  assert.equal(harbor.includes('fonts.googleapis'), false);
  assert.match((await securityHeaderList('/cu/harborlight-cu/embed')).find(h => h.key === 'Permissions-Policy')!.value, /payment=\(\)/);
  assert.equal(await frameOptions('/cu/harborlight-cu/embed'), undefined);

  const summit = await csp('/cu/summit-ridge-fcu/embed');
  assert.match(summit, /frame-ancestors 'self' https:\/\/www\.summitridgefcu\.example/);
  assert.equal(summit.includes('harborlightcu.example'), false);

  assert.match(await csp('/cu/nope/embed'), /frame-ancestors 'none'/);
  assert.equal(await frameOptions('/cu/nope/embed'), 'DENY');
  assert.match(await csp('/credit-unions/embed-demo'), /frame-ancestors 'none'/);
  assert.equal(await frameOptions('/credit-unions/embed-demo'), 'DENY');
  assert.match(await csp('/cu/harborlight-cu/dashboard'), /frame-ancestors 'none'/);
});

test('embed messages are namespaced and carry only height or a grade letter', () => {
  assert.equal(EMBED_RESIZE, 'signorwalk.cu.resize');
  assert.equal(EMBED_COMPLETED, 'signorwalk.cu.completed');
  const resize = resizeMessage(640.2);
  assert.deepEqual(resize, { type: EMBED_RESIZE, height: 641 });
  assert.deepEqual(Object.keys(resize).sort(), ['height', 'type']);
  const done = completedMessage('A');
  assert.deepEqual(done, { type: EMBED_COMPLETED, grade: 'A' });
  assert.deepEqual(Object.keys(done).sort(), ['grade', 'type']);
  assert.equal(JSON.stringify(done).includes('sellingPrice'), false);
  for (const grade of ['A', 'B', 'C', 'D', 'F']) assert.equal(completedMessage(grade).grade, grade);
  for (const bad of ['', 'E', 'a', 'A+', 'AB', 'pass']) {
    assert.throws(() => completedMessage(bad), /grade/);
  }
  for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, 20001]) {
    assert.throws(() => resizeMessage(bad), /height/);
  }
});

test('disallowed and unknown parents fail, and targetOrigin is never a wildcard', async () => {
  assert.equal(isEmbedOrigin('*'), false);
  assert.equal(isEmbedOrigin('https://*'), false);
  assert.equal(isEmbedOrigin('https://evil.example;frame-ancestors *'), false);
  assert.equal(frameAncestorSources(['https://ok.example', 'https://evil.example;frame-ancestors *']), "'self' https://ok.example");
  assert.equal(embedTenantId('/cu/harborlight-cu'), null);
  assert.equal(embedTenantId('/cu/harborlight-cu/embed'), 'harborlight-cu');
  assert.equal(await frameAncestorsForPath('/cu/harborlight-cu'), "'none'");

  assert.deepEqual(allowEmbed({
    tenantId: 'nope',
    referer: 'https://www.harborlightcu.example/',
    secFetchDest: 'iframe',
    requestOrigin: 'https://signorwalk.com',
  }), { ok: false });

  assert.deepEqual(allowEmbed({
    tenantId: 'harborlight-cu',
    referer: 'https://evil.example/frame',
    secFetchDest: 'iframe',
    requestOrigin: 'https://signorwalk.com',
  }), { ok: false });

  assert.deepEqual(allowEmbed({
    tenantId: 'harborlight-cu',
    referer: null,
    secFetchDest: 'iframe',
    requestOrigin: 'https://signorwalk.com',
  }), { ok: false });

  assert.deepEqual(allowEmbed({
    tenantId: 'harborlight-cu',
    referer: 'https://www.harborlightcu.example/auto',
    secFetchDest: 'iframe',
    requestOrigin: 'https://signorwalk.com',
  }), { ok: true, targetOrigin: 'https://www.harborlightcu.example' });

  assert.deepEqual(allowEmbed({
    tenantId: 'harborlight-cu',
    referer: 'http://127.0.0.1:3456/credit-unions/embed-demo',
    secFetchDest: 'iframe',
    requestOrigin: 'http://127.0.0.1:3456',
  }), { ok: true, targetOrigin: 'http://127.0.0.1:3456' });

  assert.deepEqual(allowEmbed({
    tenantId: 'harborlight-cu',
    referer: null,
    secFetchDest: 'document',
    requestOrigin: 'https://signorwalk.com',
  }), { ok: true, targetOrigin: null });

  const snippet = iframeSnippet('harborlight-cu');
  assert.match(snippet, new RegExp(EMBED_RESIZE.replace(/\./g, '\\.')));
  assert.match(snippet, /event\.origin !== 'https:\/\/signorwalk\.com'/);
  assert.equal(snippet.includes(deepLink('harborlight-cu')), true);
  assert.equal(snippet.includes('*'), false);
  assert.equal(snippet.includes('grade'), false);
  const local = iframeSnippet('harborlight-cu', 'http://127.0.0.1:3456');
  assert.match(local, /event\.origin !== 'http:\/\/127\.0\.0\.1:3456'/);
  assert.equal(local.includes(deepLink('harborlight-cu', 'http://127.0.0.1:3456')), true);
  assert.equal(local.includes('https://signorwalk.com'), false);
  assert.throws(() => iframeSnippet('../secret'), /tenant/);
});

test('a console-added tenant and an origin edit change the embed header', async () => {
  resetCuStore();
  const profile = normalizeProfile({
    id: 'north-pier-cu',
    name: 'North Pier Credit Union',
    preApprovalUrl: 'https://www.northpiercu.example/auto',
    ratesUrl: 'https://www.northpiercu.example/rates',
    embedOrigins: ['https://www.northpiercu.example'],
    status: 'active',
    shortName: 'North Pier CU',
  });
  assert.ok(profile);
  await saveTenantProfile(profile, { shortName: 'North Pier CU', primary: '#075985' });
  const added = await csp('/cu/north-pier-cu/embed');
  assert.match(added, /frame-ancestors 'self' https:\/\/www\.northpiercu\.example/);
  assert.equal(await frameOptions('/cu/north-pier-cu/embed'), undefined);

  const before = await framePolicy(new NextRequest('https://signorwalk.com/api/cu/frame-ancestors?path=/cu/harborlight-cu/embed'));
  assert.match(before.headers.get('content-security-policy') ?? '', /www\.harborlightcu\.example/);

  await replaceEmbedOrigins('harborlight-cu', ['https://members.harborlightcu.example']);
  const edited = await framePolicy(new NextRequest('https://signorwalk.com/api/cu/frame-ancestors?path=/cu/harborlight-cu/embed'));
  const policy = edited.headers.get('content-security-policy') ?? '';
  assert.match(policy, /members\.harborlightcu\.example/);
  assert.equal(policy.includes('www.harborlightcu.example'), false);

  await replaceEmbedOrigins('harborlight-cu', []);
  const cleared = await framePolicy(new NextRequest('https://signorwalk.com/api/cu/frame-ancestors?path=/cu/harborlight-cu/embed'));
  const empty = cleared.headers.get('content-security-policy') ?? '';
  assert.match(empty, /frame-ancestors 'self'/);
  assert.equal(empty.includes('harborlightcu.example'), false);

  await removeTenant('harborlight-cu');
  assert.match(await csp('/cu/harborlight-cu/embed'), /frame-ancestors 'none'/);
  assert.equal(await frameOptions('/cu/harborlight-cu/embed'), 'DENY');
  resetCuStore();
});
