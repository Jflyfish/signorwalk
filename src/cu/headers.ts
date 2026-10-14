import { NextResponse } from 'next/server';

/**
 * Response headers for /cu and /credit-unions only.
 * The consumer site keeps the headers it already has on main.
 */
export function securityHeaderList(pathname: string): { key: string; value: string }[] {
  const marketing = pathname === '/credit-unions' || pathname.startsWith('/credit-unions/');
  const script = ["'self'", "'unsafe-inline'", 'https://va.vercel-scripts.com'];
  if (process.env.NODE_ENV !== 'production') script.push("'unsafe-eval'");
  const style = ["'self'", "'unsafe-inline'"];
  const font = ["'self'", 'data:'];
  if (marketing) {
    style.push('https://fonts.googleapis.com');
    font.push('https://fonts.gstatic.com');
  }
  const csp = [
    "default-src 'self'",
    `script-src ${script.join(' ')}`,
    `style-src ${style.join(' ')}`,
    `font-src ${font.join(' ')}`,
    "img-src 'self' data: blob:",
    "connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');

  return [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
    { key: 'Content-Security-Policy', value: csp },
  ];
}

export function applySecurityHeaders(res: NextResponse, pathname = '/cu'): NextResponse {
  for (const header of securityHeaderList(pathname)) res.headers.set(header.key, header.value);
  return res;
}
