import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isPathDisabled } from '@/tenants/disabled-paths';
import { PREVIEW_TENANT_COOKIE, resolveTenant, tenantOverrideAllowed } from '@/tenants/resolve';

function notFound(req: NextRequest): NextResponse {
  const api = req.nextUrl.pathname.startsWith('/api/');
  if (api) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: { 'X-Robots-Tag': 'noindex' } });
  }
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Not found</title></head><body style="font-family:system-ui,sans-serif;padding:2.5rem;color:#1f2937"><h1 style="font-size:1.25rem">This page is not available.</h1></body></html>`;
  return new NextResponse(html, {
    status: 404,
    headers: { 'content-type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex' },
  });
}

export function middleware(req: NextRequest) {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  const resolved = resolveTenant({
    host,
    queryTenant: req.nextUrl.searchParams.get('tenant'),
    cookieTenant: req.cookies.get(PREVIEW_TENANT_COOKIE)?.value ?? null,
    overrideAllowed: tenantOverrideAllowed(),
  });

  if (!resolved.tenant) return notFound(req);
  if (isPathDisabled(resolved.tenant, req.nextUrl.pathname)) return notFound(req);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-tenant', resolved.tenant.id);
  const res = NextResponse.next({ request: { headers: requestHeaders } });

  if (resolved.clearCookie) {
    res.cookies.set(PREVIEW_TENANT_COOKIE, '', { path: '/', maxAge: 0, httpOnly: true, sameSite: 'lax' });
  } else if (resolved.setCookie) {
    res.cookies.set(PREVIEW_TENANT_COOKIE, resolved.setCookie, {
      path: '/',
      maxAge: 60 * 60 * 24,
      httpOnly: true,
      sameSite: 'lax',
      secure: req.nextUrl.protocol === 'https:',
    });
  }

  if (req.nextUrl.protocol === 'https:') {
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  }
  if (!resolved.tenant.indexable) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)'],
};
