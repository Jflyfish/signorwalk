import type { Tenant } from './types';

interface Rule {
  enabled: (features: Tenant['features']) => boolean;
  prefixes: string[];
}

/**
 * Routes that stay on for the consumer tenant and return 404 for a credit-union tenant.
 * Marketing pages (about, contact, /credit-unions) are included because they promote
 * Sign or Walk payments and lead capture. The /credit-unions page itself is owned by
 * another change and is not modified here.
 */
const RULES: Rule[] = [
  { enabled: f => f.blog, prefixes: ['/blog'] },
  { enabled: f => f.glossary, prefixes: ['/glossary'] },
  { enabled: f => f.askAPro, prefixes: ['/ask-a-pro'] },
  { enabled: f => f.negotiationSupport, prefixes: ['/negotiation-support', '/api/negotiation-support'] },
  { enabled: f => f.emailCapture, prefixes: ['/api/capture-email'] },
  { enabled: f => f.documentUpload, prefixes: ['/api/extract-document', '/analyze/advanced'] },
  { enabled: f => f.sowMarketing, prefixes: ['/about', '/contact', '/credit-unions'] },
];

function matches(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isPathDisabled(tenant: Tenant, pathname: string): boolean {
  const path = pathname.split('?')[0].replace(/\/+$/, '') || '/';
  for (const rule of RULES) {
    if (rule.enabled(tenant.features)) continue;
    if (rule.prefixes.some(prefix => matches(path, prefix))) return true;
  }
  return false;
}
