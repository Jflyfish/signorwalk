export type UtmContent = 'preapproval' | 'rates';

/** Aggregate attribution only. A path that starts with / stays on the current host. */
export function withUtm(url: string, tenantId: string, content: UtmContent): string {
  const relative = url.startsWith('/');
  const u = new URL(url, 'https://preview.local');
  u.searchParams.set('utm_source', 'signorwalk');
  u.searchParams.set('utm_medium', 'referral');
  u.searchParams.set('utm_campaign', tenantId);
  u.searchParams.set('utm_content', content);
  if (relative) return `${u.pathname}${u.search}`;
  return u.toString();
}

/** Demo pages stay on whatever host served the check. Never force a production origin. */
export function memberLink(url: string): string {
  if (url.startsWith('/')) return url;
  try {
    const u = new URL(url);
    if (u.pathname.startsWith('/credit-unions/demo/')) return `${u.pathname}${u.search}`;
  } catch {
    return url;
  }
  return url;
}
