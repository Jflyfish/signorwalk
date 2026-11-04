import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import React from 'react';
import nextConfig from '../next.config';
import { siteOpenGraphImages } from '../src/app/(site)/site-open-graph';

/** PNG bytes of /opengraph-image on main. */
const MAIN_OPENGRAPH_SHA256 = '0b952fa3dd3ff0ade2aa6ae829e6e58cbb5d2f97bbd07f412e85867db15261b3';

test('/opengraph-image returns 200 and its hash matches main', async () => {
  const rewrites = await nextConfig.rewrites?.();
  const rules = Array.isArray(rewrites) ? rewrites : rewrites?.beforeFiles ?? [];
  const rule = rules.find((item: { source?: string }) => item.source === '/opengraph-image');
  assert.ok(rule && 'destination' in rule);
  assert.equal(rule.destination, '/opengraph-image-12o0cb');

  const image = siteOpenGraphImages[0];
  assert.equal(typeof image === 'object' && image && 'url' in image ? image.url : '', '/opengraph-image?315799c41c949b91');

  (globalThis as { React?: typeof React }).React = React;
  const mod = await import('../src/app/(site)/opengraph-image');
  const response = await mod.default();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/png');
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(createHash('sha256').update(bytes).digest('hex'), MAIN_OPENGRAPH_SHA256);
});
