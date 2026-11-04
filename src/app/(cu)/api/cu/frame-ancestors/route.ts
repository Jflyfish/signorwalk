import { NextRequest, NextResponse } from 'next/server';
import { FRAME_ANCESTORS_HEADER, embedTenantId, frameAncestorsAuthorized, frameAncestorsForPath } from '@/cu/embed';
import { applySecurityHeaders } from '@/cu/headers';

/** Node route so middleware can read the stored allowlist. Callers must send the internal header. */
export async function GET(req: NextRequest) {
  if (!frameAncestorsAuthorized(req.headers.get(FRAME_ANCESTORS_HEADER))) {
    return NextResponse.json({ ancestors: "'self'" }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
  const pathname = req.nextUrl.searchParams.get('path') ?? '';
  if (!embedTenantId(pathname)) {
    return applySecurityHeaders(NextResponse.json({ ancestors: "'none'" }, { status: 400 }), '/cu');
  }
  const ancestors = await frameAncestorsForPath(pathname);
  const res = NextResponse.json({ ancestors }, { headers: { 'Cache-Control': 'no-store' } });
  return applySecurityHeaders(res, pathname, ancestors);
}
