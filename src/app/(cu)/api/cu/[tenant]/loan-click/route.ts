import { NextResponse } from 'next/server';
import { recordLoanClick } from '@/cu/cu-store';
import { applySecurityHeaders } from '@/cu/headers';
import { loadCuTenant } from '@/cu/tenant-directory';

/** Increments one integer. The response stays successful when the write fails. */
export async function POST(_req: Request, ctx: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await ctx.params;
  const pathname = `/api/cu/${slug}/loan-click`;
  try {
    const tenant = await loadCuTenant(slug);
    if (tenant) await recordLoanClick(tenant.id);
  } catch {
    /* The member already left for the loan application. */
  }
  const res = NextResponse.json({ ok: true }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  return applySecurityHeaders(res, pathname);
}
