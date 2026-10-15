import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { acceptAncestors, embedTenantId } from '@/cu/embed';
import { securityHeaderList } from '@/cu/headers';

/**
 * Runs only for the credit-union marketing page and /cu/[tenant].
 * Consumer routes are not matched, so they stay as they are on main.
 * Node runtime shares the process store with pages. The embed route is still
 * asked for the allowlist, because a separate bundle cannot see that store.
 */
export const runtime = 'nodejs';

async function ancestorsFromNode(req: NextRequest): Promise<string | null> {
  const pathname = req.nextUrl.pathname;
  if (!embedTenantId(pathname)) return null;
  try {
    const url = req.nextUrl.clone();
    url.pathname = '/api/cu/frame-ancestors';
    url.search = `?path=${encodeURIComponent(pathname)}`;
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(1500) });
    if (!res.ok) return null;
    const data = await res.json() as { ancestors?: unknown };
    return acceptAncestors(data.ancestors);
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const stored = await ancestorsFromNode(req);
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
