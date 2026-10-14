import { headers } from 'next/headers';
import { getTenantById, SOW_TENANT } from './registry';
import type { Tenant } from './types';

export function tenantFromHeader(id: string | null | undefined): Tenant {
  return getTenantById(id) ?? SOW_TENANT;
}

/** Tenant chosen by middleware. Defaults to the consumer site when the header is absent. */
export async function getRequestTenant(): Promise<Tenant> {
  try {
    const h = await headers();
    return getTenantById(h.get('x-tenant')) ?? SOW_TENANT;
  } catch {
    return SOW_TENANT;
  }
}
