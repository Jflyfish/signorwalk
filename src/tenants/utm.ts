export type UtmContent = 'preapproval' | 'rates';

/** Aggregate attribution only. The credit union reads these on its own site. */
export function withUtm(url: string, tenantId: string, content: UtmContent): string {
  const u = new URL(url);
  u.searchParams.set('utm_source', 'signorwalk');
  u.searchParams.set('utm_medium', 'referral');
  u.searchParams.set('utm_campaign', tenantId);
  u.searchParams.set('utm_content', content);
  return u.toString();
}
