import { createHmac, timingSafeEqual } from 'node:crypto';
import { getCuTenant } from './tenants';

/** Session secret already used to sign staff cookies. Not a new environment variable. */
export function sampleSecret(): string | undefined {
  const secret = process.env.CU_SESSION_SECRET;
  return secret && secret.length > 0 ? secret : undefined;
}

/** Grant for a seeded demo page. Null when the session secret is unset. */
export function sampleGrant(tenantId: string): string | null {
  const secret = sampleSecret();
  if (!secret || !getCuTenant(tenantId)) return null;
  return createHmac('sha256', secret).update(`cu-sample:${tenantId}`).digest('base64url');
}

export function sampleGrantValid(tenantId: string, grant: string | null | undefined): boolean {
  const expected = sampleGrant(tenantId);
  if (!expected || !grant) return false;
  const left = Buffer.from(grant);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Sample grades skip counters only for a seeded demo tenant.
 * When CU_SESSION_SECRET is set, sample=1 also needs the grant this server mints.
 * A bare sample flag still counts. When the secret is unset, sample=1 excludes
 * seeded demo tenants only. Any other tenant always counts.
 */
export function sampleCountsExcluded(tenantId: string, sample: boolean, grant: string | null | undefined): boolean {
  if (!sample || !getCuTenant(tenantId)) return false;
  if (!sampleSecret()) return true;
  return sampleGrantValid(tenantId, grant);
}
