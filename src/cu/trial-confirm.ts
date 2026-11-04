import { createHash, timingSafeEqual } from 'node:crypto';
import { getTenantProfile, saveTenantProfile } from '@/cu/tenant-directory';

export function tokensMatch(token: string, hash: string): boolean {
  if (!/^[a-f0-9]{64}$/.test(token) || !/^[a-f0-9]{64}$/.test(hash)) return false;
  const got = createHash('sha256').update(token).digest();
  const expected = Buffer.from(hash, 'hex');
  return got.length === expected.length && timingSafeEqual(got, expected);
}

/** Sets verified only when called. A page read must not call this. */
export async function confirmTrialToken(tenantId: string, token: string): Promise<boolean> {
  const profile = await getTenantProfile(tenantId);
  if (!profile?.confirmHash || !tokensMatch(token, profile.confirmHash)) return false;
  profile.verified = true;
  delete profile.confirmHash;
  await saveTenantProfile(profile);
  return true;
}
