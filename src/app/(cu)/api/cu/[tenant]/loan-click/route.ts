import { NextResponse } from 'next/server';
import { recordLoanClick } from '@/cu/cu-store';
import { applySecurityHeaders } from '@/cu/headers';
import { staffCanPreview } from '@/cu/preview-access';
import { sampleCountsExcluded } from '@/cu/sample-grant';
import { loadCuTenant } from '@/cu/tenant-directory';

/** Increments one integer. The response stays successful when the write fails. */
export async function POST(req: Request, ctx: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await ctx.params;
  const pathname = `/api/cu/${slug}/loan-click`;
  const params = new URL(req.url).searchParams;
  try {
    const tenant = await loadCuTenant(slug);
    const sample = tenant ? sampleCountsExcluded(tenant.id, params.get('sample') === '1', params.get('grant')) : false;
    const ownerPreview = params.get('preview') === '1' && tenant ? await staffCanPreview(tenant.id) : false;
    if (tenant && !sample && !ownerPreview) await recordLoanClick(tenant.id);
  } catch {
    /* The member already left for the loan application. */
  }
  const res = NextResponse.json({ ok: true }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  return applySecurityHeaders(res, pathname);
}
