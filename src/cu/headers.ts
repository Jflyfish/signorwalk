import { NextResponse } from 'next/server';
import { getBranding } from './cu-store';
import { frameAncestorsForPath } from './embed';

/** Origin of one https logo, or null. Never a wildcard. */
export function logoImageOrigin(url: string | null | undefined): string | null {
  if (!url || !url.startsWith('https://')) return null;
  try {
    const parsed = new URL(url);
    if (parsed.username || parsed.password || parsed.origin === 'null') return null;
    if (!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(parsed.origin)) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function tenantIdFromPath(pathname: string): string | null {
  const match = /^\/cu\/([a-z0-9-]+)(?:\/|$)/.exec(pathname.toLowerCase());
  if (!match) return null;
  if (match[1] === 'admin' || match[1] === 'icon' || match[1] === 'apple-icon') return null;
  return match[1];
}

async function tenantLogoOrigin(pathname: string): Promise<string | null> {
  const id = tenantIdFromPath(pathname);
  if (!id) return null;
  try {
    const branding = await getBranding(id);
    return logoImageOrigin(branding?.logoLight);
  } catch {
    return null;
  }
}

/**
 * Response headers for /cu and /credit-unions only.
 * The consumer site keeps the headers it already has on main.
 */
export async function securityHeaderList(pathname: string, ancestors?: string): Promise<{ key: string; value: string }[]> {
  const marketing = pathname === '/credit-unions' || pathname.startsWith('/credit-unions/');
  const script = ["'self'", "'unsafe-inline'"];
  if (process.env.NODE_ENV !== 'production') script.push("'unsafe-eval'");
  const style = ["'self'", "'unsafe-inline'"];
  const font = ["'self'", 'data:'];
  if (marketing) {
    style.push('https://fonts.googleapis.com');
    font.push('https://fonts.gstatic.com');
  }
  const resolved = ancestors ?? await frameAncestorsForPath(pathname);
  const img = ["'self'", 'data:', 'blob:'];
  const logoOrigin = await tenantLogoOrigin(pathname);
  if (logoOrigin) img.push(logoOrigin);
  const csp = [
    "default-src 'self'",
    `script-src ${script.join(' ')}`,
    `style-src ${style.join(' ')}`,
    `font-src ${font.join(' ')}`,
    `img-src ${img.join(' ')}`,
    "connect-src 'self'",
    `frame-ancestors ${resolved}`,
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');

  const headers = [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
    { key: 'Content-Security-Policy', value: csp },
  ];
  if (resolved === "'none'") return headers;
  return headers.filter(header => header.key !== 'X-Frame-Options');
}

export async function applySecurityHeaders(res: NextResponse, pathname = '/cu', ancestors?: string): Promise<NextResponse> {
  for (const header of await securityHeaderList(pathname, ancestors)) res.headers.set(header.key, header.value);
  return res;
}
