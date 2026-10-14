import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { securityHeaderList } from '@/cu/headers';

/**
 * Runs only for the credit-union marketing page and /cu/[tenant].
 * Consumer routes are not matched, so they stay as they are on main.
 */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  for (const header of securityHeaderList(req.nextUrl.pathname)) {
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
