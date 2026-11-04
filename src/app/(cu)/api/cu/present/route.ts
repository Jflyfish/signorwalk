import { NextRequest, NextResponse } from 'next/server';
import { FRAME_ANCESTORS_HEADER, frameAncestorsAuthorized } from '@/cu/embed';
import { applySecurityHeaders } from '@/cu/headers';
import { loadCuTenant } from '@/cu/tenant-directory';

/** Internal lookup so middleware can return 404 without rendering the page. */
export async function GET(req: NextRequest) {
  if (!frameAncestorsAuthorized(req.headers.get(FRAME_ANCESTORS_HEADER))) {
    return new NextResponse(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
  const id = req.nextUrl.searchParams.get('id') ?? '';
  const tenant = await loadCuTenant(id);
  const res = new NextResponse(null, {
    status: tenant ? 204 : 404,
    headers: { 'Cache-Control': 'no-store' },
  });
  return applySecurityHeaders(res, '/cu');
}
