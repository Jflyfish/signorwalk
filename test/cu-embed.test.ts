import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  EMBED_COMPLETED,
  EMBED_RESIZE,
  FRAME_ANCESTORS_HEADER,
  allowEmbed,
  completedMessage,
  deepLink,
  embedTenantId,
  memberOrigin,
  frameAncestorSources,
  frameAncestorsForPath,
  frameAncestorsToken,
  iframeSnippet,
  isEmbedOrigin,
  resizeMessage,
  resolveFrameAncestors,
} from '../src/cu/embed';
import { securityHeaderList } from '../src/cu/headers';
import { GET as framePolicy } from '../src/app/api/cu/frame-ancestors/route';
import { markCuStoreUnavailable, resetCuStore } from '../src/cu/cu-store';
import { NextRequest } from 'next/server';
import { normalizeProfile, removeTenant, replaceEmbedOrigins, saveTenantProfile } from '../src/cu/tenant-directory';

function policyRequest(path: string, header?: string | null): NextRequest {
  const headers = new Headers();
  if (header !== null) headers.set(FRAME_ANCESTORS_HEADER, header ?? frameAncestorsToken());
  return new NextRequest(`https://signorwalk.com/api/cu/frame-ancestors?path=${encodeURIComponent(path)}`, { headers });
}

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

test('member links use the request host, then VERCEL_URL', () => {
  const preview = memberOrigin(() => null, 'signorwalk-git-example.vercel.app');
  assert.equal(preview, 'https://signorwalk-git-example.vercel.app');
  const fromHost = memberOrigin(name => {
    if (name === 'x-forwarded-host') return 'signorwalk-git-example.vercel.app';
    if (name === 'x-forwarded-proto') return 'https';
    return null;
  }, 'other.vercel.app');
  assert.equal(fromHost, 'https://signorwalk-git-example.vercel.app');
  assert.equal(memberOrigin(() => null, ''), 'https://signorwalk.com');
  assert.equal(memberOrigin(() => null, 'not a host'), 'https://signorwalk.com');
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

  const before = await framePolicy(policyRequest('/cu/harborlight-cu/embed'));
  assert.match(before.headers.get('content-security-policy') ?? '', /www\.harborlightcu\.example/);

  await replaceEmbedOrigins('harborlight-cu', ['https://members.harborlightcu.example']);
  const edited = await framePolicy(policyRequest('/cu/harborlight-cu/embed'));
  const policy = edited.headers.get('content-security-policy') ?? '';
  assert.match(policy, /members\.harborlightcu\.example/);
  assert.equal(policy.includes('www.harborlightcu.example'), false);

  await replaceEmbedOrigins('harborlight-cu', []);
  const cleared = await framePolicy(policyRequest('/cu/harborlight-cu/embed'));
  const empty = cleared.headers.get('content-security-policy') ?? '';
  assert.match(empty, /frame-ancestors 'self'/);
  assert.equal(empty.includes('harborlightcu.example'), false);

  await removeTenant('harborlight-cu');
  assert.match(await csp('/cu/harborlight-cu/embed'), /frame-ancestors 'none'/);
  assert.equal(await frameOptions('/cu/harborlight-cu/embed'), 'DENY');
  resetCuStore();
});

test('embed CSP fails closed and does not fall back to the config seeds', async () => {
  resetCuStore();
  const embedSrc = readFileSync('src/cu/embed.ts', 'utf8');
  const lookup = embedSrc.slice(embedSrc.indexOf('export async function frameAncestorsForPath'), embedSrc.indexOf('export function allowEmbed'));
  assert.equal(lookup.includes('getCuTenant'), false);
  assert.match(lookup, /cuStoreUnavailable/);
  const middleware = readFileSync('src/middleware.ts', 'utf8');
  assert.match(middleware, /AbortSignal\.timeout\(1500\)/);
  assert.match(middleware, /FRAME_ANCESTORS_HEADER/);
  assert.equal(FRAME_ANCESTORS_HEADER, 'x-cu-frame-ancestors');
  assert.match(middleware, /frameAncestorsForPath/);
  assert.equal(middleware.includes('/api/cu/frame-ancestors'), false);
  assert.equal(middleware.includes(`return "'none'"`), false);
  assert.equal(middleware.includes(`return "'self'"`), false);

  resetCuStore();
  const permitted = await frameAncestorsForPath('/cu/harborlight-cu/embed');
  assert.notEqual(permitted, "'none'");
  assert.match(permitted, /'self'/);
  assert.match(permitted, /https:\/\/www\.harborlightcu\.example/);
  const framed = await securityHeaderList('/cu/harborlight-cu/embed', permitted);
  const framedCsp = framed.find(header => header.key === 'Content-Security-Policy')!.value;
  assert.equal(framedCsp.includes("frame-ancestors 'none'"), false);
  assert.equal(framed.find(header => header.key === 'X-Frame-Options'), undefined);

  resetCuStore();
  const path = '/cu/harborlight-cu/embed';
  const thrown = await resolveFrameAncestors(path, async () => {
    throw new Error('lookup-failed');
  }, 1_700_000_000_000, 50);
  assert.equal(thrown, "'self'");
  assert.equal(thrown.includes('harborlightcu.example'), false);

  const slow = await resolveFrameAncestors(path, () => new Promise(() => {}), Date.now(), 20);
  assert.equal(slow, "'self'");
  assert.equal(slow.includes('harborlightcu.example'), false);

  markCuStoreUnavailable();
  const kv = await frameAncestorsForPath(path);
  assert.equal(kv, "'none'");
  assert.equal(kv.includes('harborlightcu.example'), false);

  const savedUrl = process.env.KV_REST_API_URL;
  const savedToken = process.env.KV_REST_API_TOKEN;
  process.env.KV_REST_API_URL = 'http://127.0.0.1:9';
  process.env.KV_REST_API_TOKEN = 'test-token-not-a-secret';
  resetCuStore();
  try {
    const down = await frameAncestorsForPath(path);
    assert.equal(down, "'none'");
    assert.equal(down.includes('harborlightcu.example'), false);
  } finally {
    if (savedUrl === undefined) delete process.env.KV_REST_API_URL;
    else process.env.KV_REST_API_URL = savedUrl;
    if (savedToken === undefined) delete process.env.KV_REST_API_TOKEN;
    else process.env.KV_REST_API_TOKEN = savedToken;
    resetCuStore();
  }
});

test('embed ancestor lookups are cached for about 30s and the route requires the internal header', async () => {
  resetCuStore();
  const path = '/cu/harborlight-cu/embed';
  const now = 1_700_000_000_000;
  let calls = 0;
  const load = async () => {
    calls += 1;
    return { embedOrigins: ['https://www.harborlightcu.example'] };
  };
  const first = await resolveFrameAncestors(path, load, now, 50);
  const second = await resolveFrameAncestors(path, load, now + 29_000, 50);
  assert.equal(first, second);
  assert.equal(calls, 1);
  await resolveFrameAncestors(path, load, now + 30_000, 50);
  assert.equal(calls, 2);

  resetCuStore();
  let failures = 0;
  const fail = async () => {
    failures += 1;
    throw new Error('lookup-failed');
  };
  assert.equal(await resolveFrameAncestors(path, fail, now, 50), "'self'");
  assert.equal(await resolveFrameAncestors(path, fail, now + 1_000, 50), "'self'");
  assert.equal(failures, 2);

  resetCuStore();
  let storeCalls = 0;
  const storeDown = async () => {
    storeCalls += 1;
    if (storeCalls === 1) throw new Error('store-unavailable');
    return { embedOrigins: ['https://www.harborlightcu.example'] };
  };
  assert.equal(await resolveFrameAncestors(path, storeDown, now, 50), "'none'");
  const recovered = await resolveFrameAncestors(path, storeDown, now + 1_000, 50);
  assert.match(recovered, /https:\/\/www\.harborlightcu\.example/);
  assert.equal(storeCalls, 2);

  resetCuStore();
  let misses = 0;
  const missing = async () => {
    misses += 1;
    return null;
  };
  assert.equal(await resolveFrameAncestors(path, missing, now, 50), "'none'");
  assert.equal(await resolveFrameAncestors(path, missing, now + 1_000, 50), "'none'");
  assert.equal(misses, 1);

  const denied = await framePolicy(policyRequest(path, null));
  assert.equal(denied.status, 404);
  const deniedBody = await denied.json() as { ancestors: string };
  assert.equal(deniedBody.ancestors, "'self'");
  assert.equal(JSON.stringify(deniedBody).includes('harborlight'), false);

  const wrong = await framePolicy(policyRequest(path, 'not-the-token'));
  assert.equal(wrong.status, 404);
  const wrongBody = await wrong.json() as { ancestors: string };
  assert.equal(wrongBody.ancestors, "'self'");
  assert.equal(JSON.stringify(wrongBody).includes('harborlight'), false);

  resetCuStore();
  const allowed = await framePolicy(policyRequest(path));
  assert.equal(allowed.status, 200);
  const allowedBody = await allowed.json() as { ancestors: string };
  assert.match(allowedBody.ancestors, /https:\/\/www\.harborlightcu\.example/);
  resetCuStore();
});
