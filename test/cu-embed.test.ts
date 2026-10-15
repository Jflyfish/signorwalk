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

function csp(pathname: string): string {
  return securityHeaderList(pathname).find(header => header.key === 'Content-Security-Policy')!.value;
}

function frameOptions(pathname: string): string | undefined {
  return securityHeaderList(pathname).find(header => header.key === 'X-Frame-Options')?.value;
}

test('embed CSP allowlist is per tenant and only on the embed route', () => {
  const member = csp('/cu/harborlight-cu');
  assert.match(member, /frame-ancestors 'none'/);
  assert.equal(frameOptions('/cu/harborlight-cu'), 'DENY');
  assert.equal(member.includes('fonts.googleapis'), false);

  const harbor = csp('/cu/harborlight-cu/embed');
  assert.match(harbor, /frame-ancestors 'self' https:\/\/www\.harborlightcu\.example/);
  assert.equal(harbor.includes('www.summitridgefcu.example'), false);
  assert.equal(harbor.includes('fonts.googleapis'), false);
  assert.match(securityHeaderList('/cu/harborlight-cu/embed').find(h => h.key === 'Permissions-Policy')!.value, /payment=\(\)/);
  assert.equal(frameOptions('/cu/harborlight-cu/embed'), undefined);

  const summit = csp('/cu/summit-ridge-fcu/embed');
  assert.match(summit, /frame-ancestors 'self' https:\/\/www\.summitridgefcu\.example/);
  assert.equal(summit.includes('harborlightcu.example'), false);

  assert.match(csp('/cu/nope/embed'), /frame-ancestors 'none'/);
  assert.equal(frameOptions('/cu/nope/embed'), 'DENY');
  assert.match(csp('/credit-unions/embed-demo'), /frame-ancestors 'none'/);
  assert.equal(frameOptions('/credit-unions/embed-demo'), 'DENY');
  assert.match(csp('/cu/harborlight-cu/dashboard'), /frame-ancestors 'none'/);
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

test('disallowed and unknown parents fail, and targetOrigin is never a wildcard', () => {
  assert.equal(isEmbedOrigin('*'), false);
  assert.equal(isEmbedOrigin('https://*'), false);
  assert.equal(isEmbedOrigin('https://evil.example;frame-ancestors *'), false);
  assert.equal(frameAncestorSources(['https://ok.example', 'https://evil.example;frame-ancestors *']), "'self' https://ok.example");
  assert.equal(embedTenantId('/cu/harborlight-cu'), null);
  assert.equal(embedTenantId('/cu/harborlight-cu/embed'), 'harborlight-cu');
  assert.equal(frameAncestorsForPath('/cu/harborlight-cu'), "'none'");

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
  assert.throws(() => iframeSnippet('../secret'), /tenant/);
});
