import { after } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';
import { recordCheck, recordGradeRun } from '@/cu/cu-store';
import { formatAnalyzeLog } from '@/cu/log';
import { InputError } from '@/cu/engine/normalize';
import { gradePayload } from '@/cu/engine/report';
import { applySecurityHeaders } from '@/cu/headers';
import { clientAddress, takeAnalyzeSlot } from '@/cu/rate-limit';
import { missingTenantResponse } from '@/cu/missing-page';
import { staffCanPreview } from '@/cu/preview-access';
import { loadCuTenant, TENANT_UNAVAILABLE, tenantUnavailable } from '@/cu/tenant-directory';

const MAX_BODY = 20_000;

function json(pathname: string, body: unknown, status: number, extra?: Record<string, string>) {
  const res = NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', ...extra } });
  return applySecurityHeaders(res, pathname);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await ctx.params;
  const pathname = `/api/cu/${slug}/analyze`;
  const tenant = await loadCuTenant(slug);
  if (!tenant) return missingTenantResponse(pathname);
  if (tenantUnavailable(tenant) && !(await staffCanPreview(tenant.id))) {
    return json(pathname, { success: false, error: TENANT_UNAVAILABLE }, 404);
  }
  if (req.method !== 'POST') {
    return applySecurityHeaders(new NextResponse(null, { status: 405, headers: { Allow: 'POST' } }), pathname);
  }

  const limit = takeAnalyzeSlot(clientAddress(req.headers));
  if (!limit.allowed) {
    return json(
      pathname,
      { success: false, error: 'Too many checks. Wait a moment and try again.' },
      429,
      { 'Retry-After': String(limit.retryAfterSec) },
    );
  }

  const started = Date.now();
  const log = (outcome: 'ok' | 'invalid' | 'error', extra?: { grade?: string; flagIds?: string[]; archetype?: string }) => {
    console.log(formatAnalyzeLog({
      ts: new Date().toISOString(),
      tenant: tenant.id,
      route: '/api/cu/analyze',
      schemaVersion: '1',
      templatePack: 'tp-1.0.0',
      fallbackUsed: false,
      latencyMs: Date.now() - started,
      outcome,
      ...extra,
    }));
  };

  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY) {
      log('invalid');
      return json(pathname, { success: false, error: 'Check the numbers and try again.' }, 413);
    }
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      log('invalid');
      return json(pathname, { success: false, error: 'Check the numbers and try again.' }, 400);
    }
    const analysis = gradePayload(body, tenant.name);
    log('ok', {
      grade: analysis.grade,
      flagIds: analysis.itemsToReview.map(item => item.id),
      archetype: analysis.archetype,
    });
    const grade = analysis.grade;
    const sample = req.nextUrl.searchParams.get('sample') === '1';
    const record = async () => {
      if (sample) return;
      try {
        await recordGradeRun(tenant.id);
      } catch {
        /* A failed counter write must not affect the grade. */
      }
      if (grade === 'A' || grade === 'B' || grade === 'C' || grade === 'D' || grade === 'F') {
        try {
          await recordCheck(tenant.id, grade);
        } catch {
          /* The letter total is separate. A failed write stays off the response. */
        }
      }
    };
    try {
      after(() => record());
    } catch {
      void Promise.resolve().then(() => record());
    }
    return json(pathname, { success: true, mode: 'rules', templatePack: 'tp-1.0.0', analysis }, 200);
  } catch (error) {
    if (error instanceof InputError) {
      log('invalid');
      return json(pathname, { success: false, error: error.message }, 400);
    }
    log('error');
    return json(pathname, { success: false, error: 'Check the numbers and try again.' }, 500);
  }
}

export const GET = POST;
export const PUT = POST;
export const PATCH = POST;
export const DELETE = POST;
