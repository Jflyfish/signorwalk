import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { readFrameAncestorCache } from '@/cu/cu-store';
import { FRAME_ANCESTORS_HEADER, acceptAncestors, embedTenantId, frameAncestorsToken } from '@/cu/embed';
import { securityHeaderList } from '@/cu/headers';
import { missingTenantResponse } from '@/cu/missing-page';
import { cuPathDisposition } from '@/cu/not-found-path';

/**
 * Runs only for the credit-union marketing page and /cu/[tenant].
 * Consumer routes are not matched, so they stay as they are on main.
 * Node runtime shares the process store with pages. The embed route is still
 * asked for the allowlist, because a separate bundle cannot see that store.
 */
export const runtime = 'nodejs';

async function ancestorsFromNode(req: NextRequest): Promise<string | null> {
  const pathname = req.nextUrl.pathname;
  const id = embedTenantId(pathname);
  if (!id) return null;
  const cached = readFrameAncestorCache(id, Date.now());
  if (cached) return cached;
  try {
    const url = req.nextUrl.clone();
    url.pathname = '/api/cu/frame-ancestors';
    url.search = `?path=${encodeURIComponent(pathname)}`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { [FRAME_ANCESTORS_HEADER]: frameAncestorsToken() },
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return "'none'";
    const data = await res.json() as { ancestors?: unknown };
    return acceptAncestors(data.ancestors) ?? "'none'";
  } catch {
    return "'none'";
  }
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
    ancestorsFromNode(req),
  ]);
  if (blocked) return blocked;
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
  return res;
}

export const config = {
  matcher: ['/cu/:path*', '/credit-unions', '/credit-unions/:path*'],
};
