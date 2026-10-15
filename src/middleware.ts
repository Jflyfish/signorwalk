import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { FRAME_ANCESTORS_HEADER, embedTenantId, frameAncestorsForPath, frameAncestorsToken } from '@/cu/embed';
import { securityHeaderList } from '@/cu/headers';
import { missingTenantResponse } from '@/cu/missing-page';
import { cuPathDisposition } from '@/cu/not-found-path';

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

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const [blocked, stored] = await Promise.all([
    missingCreditUnionResponse(pathname, id => tenantIsPresent(req, id)),
    ancestorsForEmbed(pathname),
  ]);
  if (blocked) return blocked;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  for (const header of await securityHeaderList(pathname, stored ?? undefined)) {
    res.headers.set(header.key, header.value);
  }
  if (req.nextUrl.protocol === 'https:') {
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  }
  if (req.nextUrl.pathname.startsWith('/cu/')) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return res;
}

export const config = {
  matcher: ['/cu/:path*', '/credit-unions', '/credit-unions/:path*'],
};
