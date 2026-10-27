import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { canOpenTenant, CU_SESSION_COOKIE, verifySession } from '@/cu/auth';
import { cuServiceConfigured, logCuServiceUnconfigured } from '@/cu/cu-store';
import { FRAME_ANCESTORS_HEADER, embedTenantId, frameAncestorsForPath, frameAncestorsToken } from '@/cu/embed';
import { securityHeaderList } from '@/cu/headers';
import { missingTenantResponse } from '@/cu/missing-page';
import { cuPathDisposition } from '@/cu/not-found-path';
import { loadCuTenant } from '@/cu/tenant-directory';

/**
 * Runs only for the credit-union marketing page and /cu/[tenant].
 * Consumer routes are not matched, so they stay as they are on main.
 * Embed frame-ancestors are read here from the tenant allowlist. A protected
 * Preview rejects an internal HTTP hop, and treating that failure as 'none'
 * blocks same-origin iframes.
 */
export const runtime = 'nodejs';

async function ancestorsForEmbed(pathname: string): Promise<string | null> {
  if (!embedTenantId(pathname)) return null;
  return frameAncestorsForPath(pathname);
}

/** 404 HTML for a missing credit union, or null when the page should render. */
export async function missingCreditUnionResponse(
  pathname: string,
  present: (id: string) => Promise<boolean | null>,
): Promise<NextResponse | null> {
  const disposition = cuPathDisposition(pathname);
  if (disposition.kind === 'missing') return missingTenantResponse(pathname);
  if (disposition.kind === 'lookup') {
    const found = await present(disposition.id);
    if (found === false) return missingTenantResponse(pathname);
  }
  return null;
}

async function tenantIsPresent(req: NextRequest, id: string): Promise<boolean | null> {
  try {
    const url = req.nextUrl.clone();
    url.pathname = '/api/cu/present';
    url.search = `?id=${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { [FRAME_ANCESTORS_HEADER]: frameAncestorsToken() },
      signal: AbortSignal.timeout(1500),
    });
    if (res.status === 204) return true;
    if (res.status === 404) return false;
    return null;
  } catch {
    return null;
  }
}

function statusHtml(status: number, heading: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${heading}</title>
</head>
<body>
<main>
<h1>${heading}</h1>
</main>
</body>
</html>`;
}

async function statusResponse(pathname: string, status: number, heading: string): Promise<NextResponse> {
  const res = new NextResponse(statusHtml(status, heading), {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
  for (const header of await securityHeaderList(pathname)) {
    res.headers.set(header.key, header.value);
  }
  return res;
}

/** Vercel’s preview toolbar injects markup that breaks hydration. CU routes only. */
function skipPreviewToolbar(res: NextResponse): NextResponse {
  res.headers.set('x-vercel-skip-toolbar', '1');
  return res;
}

function serviceClosed(pathname: string): boolean {
  if (cuServiceConfigured()) return false;
  if (pathname === '/credit-unions/get-started' || pathname.startsWith('/credit-unions/get-started/')) return true;
  return pathname === '/cu/admin' || pathname.startsWith('/cu/admin/');
}

/** The seeded preview sample is not a public member page. Staff routes stay open. */
function previewSampleClosed(req: NextRequest): boolean {
  const pathname = req.nextUrl.pathname.replace(/\/$/, '') || '/';
  const member = pathname === '/cu/preview-sample-cu';
  const embed = pathname === '/cu/preview-sample-cu/embed';
  if (!member && !embed) return false;
  return req.nextUrl.searchParams.get('sample') !== '1';
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  if (serviceClosed(pathname)) {
    logCuServiceUnconfigured();
    return skipPreviewToolbar(await statusResponse(pathname, 503, 'Credit union service not configured'));
  }
  if (previewSampleClosed(req)) return skipPreviewToolbar(await missingTenantResponse(pathname));
  const [blocked, stored] = await Promise.all([
    missingCreditUnionResponse(pathname, id => tenantIsPresent(req, id)),
    ancestorsForEmbed(pathname),
  ]);
  if (blocked) return skipPreviewToolbar(blocked);
  const preview = /^\/cu\/([a-z0-9-]+)\/preview\/?$/.exec(pathname);
  if (preview) {
    const tenant = await loadCuTenant(preview[1]);
    if (!tenant) return skipPreviewToolbar(await missingTenantResponse(pathname));
    const session = verifySession(req.cookies.get(CU_SESSION_COOKIE)?.value);
    if (!session) return skipPreviewToolbar(await statusResponse(pathname, 401, 'Sign in to preview this page.'));
    if (!canOpenTenant(session, tenant.id)) return skipPreviewToolbar(await statusResponse(pathname, 403, 'You can’t preview this page.'));
  }
  const res = NextResponse.next();
  for (const header of await securityHeaderList(pathname, stored ?? undefined)) {
    res.headers.set(header.key, header.value);
  }
  if (req.nextUrl.protocol === 'https:') {
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  }
  if (req.nextUrl.pathname.startsWith('/cu/')) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return skipPreviewToolbar(res);
}

export const config = {
  matcher: ['/cu/:path*', '/credit-unions', '/credit-unions/:path*'],
};
