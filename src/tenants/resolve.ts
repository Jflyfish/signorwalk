import { getTenantById, SOW_TENANT, TENANTS } from './registry';
import type { Tenant } from './types';

export const PREVIEW_TENANT_COOKIE = 'sow_preview_tenant';

const HOST_MAP = new Map<string, Tenant>();
for (const tenant of TENANTS) {
  for (const host of tenant.hosts) HOST_MAP.set(host, tenant);
}

/** Preview override is on for local dev and Vercel Preview. Production deployments ignore it. */
export function tenantOverrideAllowed(env?: { VERCEL_ENV?: string }): boolean {
  const value = env === undefined ? process.env.VERCEL_ENV : env.VERCEL_ENV;
  return value !== 'production';
}

export function normalizeHost(host: string | null | undefined): string {
  if (!host) return '';
  let h = host.trim().toLowerCase();
  if (h.startsWith('[')) {
    const end = h.indexOf(']');
    return end === -1 ? h : h.slice(1, end);
  }
  const colon = h.lastIndexOf(':');
  if (colon > -1 && /^\d+$/.test(h.slice(colon + 1))) h = h.slice(0, colon);
  if (h.endsWith('.')) h = h.slice(0, -1);
  return h;
}

/** null means an unknown *.signorwalk.app host, which should 404 rather than fall through to sow. */
export function tenantForHost(host: string | null | undefined): Tenant | null {
  const h = normalizeHost(host);
  if (!h) return SOW_TENANT;
  const exact = HOST_MAP.get(h);
  if (exact) return exact;
  if (h === 'localhost' || h === '127.0.0.1' || h === '::1') return SOW_TENANT;
  if (h === 'signorwalk.app' || h.endsWith('.signorwalk.app')) return null;
  return SOW_TENANT;
}

export interface ResolveInput {
  host: string | null;
  queryTenant?: string | null;
  cookieTenant?: string | null;
  overrideAllowed: boolean;
}

export interface ResolveResult {
  tenant: Tenant | null;
  setCookie: string | null;
  clearCookie: boolean;
}

export function resolveTenant(input: ResolveInput): ResolveResult {
  const hostTenant = tenantForHost(input.host);
  if (!input.overrideAllowed) {
    return { tenant: hostTenant, setCookie: null, clearCookie: false };
  }

  const query = input.queryTenant?.trim().toLowerCase() ?? '';
  if (query === 'sow' || query === 'off') {
    return { tenant: hostTenant, setCookie: null, clearCookie: true };
  }
  if (query) {
    const chosen = getTenantById(query);
    if (chosen) return { tenant: chosen, setCookie: chosen.id, clearCookie: false };
  }

  if (input.cookieTenant) {
    const chosen = getTenantById(input.cookieTenant.trim().toLowerCase());
    if (chosen && chosen.id !== 'sow') {
      return { tenant: chosen, setCookie: null, clearCookie: false };
    }
  }

  return { tenant: hostTenant, setCookie: null, clearCookie: false };
}
