import { NextRequest, NextResponse } from 'next/server';
import { embedTenantId, frameAncestorsForPath } from '@/cu/embed';
import { applySecurityHeaders } from '@/cu/headers';

/** Node route so the embed CSP can follow the stored allowlist when middleware cannot. */
export async function GET(req: NextRequest) {
  const pathname = req.nextUrl.searchParams.get('path') ?? '';
  if (!embedTenantId(pathname)) {
    return applySecurityHeaders(NextResponse.json({ ancestors: "'none'" }, { status: 400 }), '/cu');
  }
  const ancestors = await frameAncestorsForPath(pathname);
  const res = NextResponse.json({ ancestors }, { headers: { 'Cache-Control': 'no-store' } });
  return applySecurityHeaders(res, pathname);
}
