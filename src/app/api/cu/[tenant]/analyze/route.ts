import { NextRequest, NextResponse } from 'next/server';
import { formatAnalyzeLog } from '@/cu/log';
import { InputError } from '@/cu/engine/normalize';
import { gradePayload } from '@/cu/engine/report';
import { applySecurityHeaders } from '@/cu/headers';
import { clientAddress, takeAnalyzeSlot } from '@/cu/rate-limit';
import { getCuTenant } from '@/cu/tenants';

const MAX_BODY = 20_000;

function json(pathname: string, body: unknown, status: number, extra?: Record<string, string>) {
  const res = NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', ...extra } });
  return applySecurityHeaders(res, pathname);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await ctx.params;
  const pathname = `/api/cu/${slug}/analyze`;
  const tenant = getCuTenant(slug);
  if (!tenant) return json(pathname, { error: 'Not found' }, 404);

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
