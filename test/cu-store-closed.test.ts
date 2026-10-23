import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import test from 'node:test';

test('production without KV refuses writes, serves seeds, and signs sample grants', () => {
  const script = `
    delete process.env.NODE_TEST_CONTEXT;
    process.env.NODE_ENV = 'production';
    void (async () => {
    for (const key of ['KV_REST_API_URL','KV_REST_API_TOKEN','KV_URL','REDIS_URL','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN']) {
      delete process.env[key];
    }
    const store = await import('/workspace/src/cu/cu-store.ts');
    const dir = await import('/workspace/src/cu/tenant-directory.ts');
    const sample = await import('/workspace/src/cu/sample-grant.ts');
    const logs = [];
    console.error = (line) => { logs.push(String(line)); };
    let threw = false;
    try {
      await store.writeStoreJson('cu:profile:not-a-seed', { id: 'not-a-seed' });
    } catch (error) {
      threw = error instanceof store.CuStoreUnconfigured;
    }
    const again = await store.readStoreJson('cu:profile:not-a-seed');
    const seed = await dir.loadCuTenant('harborlight-cu');
    await store.recordGradeRun('harborlight-cu');
    await store.recordGradeRun('harborlight-cu');
    const counters = await store.getTenantCounters('harborlight-cu');
    let checkThrew = false;
    try { await store.recordCheck('harborlight-cu', 'C'); } catch { checkThrew = true; }
    const agg = await store.getAggregates('harborlight-cu');
    process.env.CU_SESSION_SECRET = 'closed-test-secret';
    const grant = sample.sampleGrant('harborlight-cu');
    const withGrant = sample.sampleCountsExcluded('harborlight-cu', true, grant);
    const bare = sample.sampleCountsExcluded('harborlight-cu', true, null);
    const other = sample.sampleCountsExcluded('not-a-real-cu', true, grant);
    delete process.env.CU_SESSION_SECRET;
    const openSeed = sample.sampleCountsExcluded('harborlight-cu', true, null);
    const openOther = sample.sampleCountsExcluded('not-a-real-cu', true, null);
    console.log(JSON.stringify({
      threw,
      again,
      seed: seed && seed.name,
      grades: counters.gradesRun,
      checks: agg.checks,
      logs,
      checkThrew,
      configured: store.cuServiceConfigured(),
      withGrant,
      bare,
      other,
      openSeed,
      openOther,
    }));
    })().catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  `;
  writeFileSync('/tmp/cu-store-closed-child.ts', script);
  const env = { ...process.env, NODE_ENV: 'production' };
  delete env.NODE_TEST_CONTEXT;
  for (const key of ['KV_REST_API_URL', 'KV_REST_API_TOKEN', 'KV_URL', 'REDIS_URL', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']) {
    delete env[key];
  }
  const result = spawnSync('npx', ['--yes', 'tsx', '/tmp/cu-store-closed-child.ts'], {
    cwd: '/workspace',
    encoding: 'utf8',
    env,
  });
  assert.equal(result.status, 0, result.stderr);
  const line = result.stdout.trim().split('\n').filter(Boolean).at(-1) ?? '';
  const report = JSON.parse(line) as {
    threw: boolean;
    again: unknown;
    seed: string;
    grades: number;
    checks: number;
    logs: string[];
    checkThrew: boolean;
    configured: boolean;
    withGrant: boolean;
    bare: boolean;
    other: boolean;
    openSeed: boolean;
    openOther: boolean;
  };
  assert.equal(report.threw, true);
  assert.equal(report.again, null);
  assert.equal(report.seed, 'Harborlight Credit Union');
  assert.equal(report.grades, 0);
  assert.equal(report.checks, 0);
  assert.equal(report.checkThrew, true);
  assert.equal(report.configured, false);
  assert.deepEqual(report.logs, ['Credit union service not configured']);
  assert.equal(report.withGrant, true);
  assert.equal(report.bare, false);
  assert.equal(report.other, false);
  assert.equal(report.openSeed, true);
  assert.equal(report.openOther, false);
});
