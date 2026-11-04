/** Harborlight is the public marketing demo. Its embed does not accept a worksheet. */
export const MARKETING_DEMO_TENANT = 'harborlight-cu';

export function marketingDemoReferer(referer: string | null, tenantId: string): boolean {
  if (!referer) return false;
  let path = '';
  try {
    path = new URL(referer).pathname.replace(/\/+$/, '') || '/';
  } catch {
    return false;
  }
  if (path === '/credit-unions/embed-demo') return true;
  if (tenantId === MARKETING_DEMO_TENANT && path === '/cu/harborlight-cu/embed') return true;
  return false;
}

export function numbersOnlyEmbed(tenantId: string, entry: string | undefined, referer: string | null): boolean {
  if (tenantId === MARKETING_DEMO_TENANT) return true;
  if (entry === 'numbers') return true;
  return marketingDemoReferer(referer, tenantId);
}
