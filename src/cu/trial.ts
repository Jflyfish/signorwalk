import { createHash, randomBytes } from 'node:crypto';
import { isEmbedOrigin } from './embed';
import { saveStaffLogin } from './staff-login';
import {
  getTenantProfile,
  loadCuTenant,
  normalizeProfile,
  saveTenantProfile,
  slugFromName,
  uniqueSlug,
  type StoredTenantProfile,
} from './tenant-directory';

export const TRIAL_MS = 90 * 24 * 60 * 60 * 1000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type TrialError = 'name' | 'contact' | 'email' | 'secret' | 'website' | 'taken' | 'honeypot';

export function websiteOrigin(value: string): string[] | null {
  const trimmed = value.trim();
  if (!trimmed) return [];
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const origin = new URL(candidate).origin.toLowerCase();
    if (!isEmbedOrigin(origin)) return null;
    return [origin];
  } catch {
    return null;
  }
}

export function trialEnd(now = Date.now()): string {
  return new Date(now + TRIAL_MS).toISOString();
}

/**
 * Creates a trial credit union and a staff login.
 * The secret is hashed before it is stored and is not returned.
 */
export async function createTrial(input: {
  name: string;
  contactName: string;
  email: string;
  secret: string;
  website: string;
  honeypot: string;
  tier?: 'starter' | 'growth' | 'pro';
  now?: number;
}): Promise<{ ok: true; id: string; confirmToken: string } | { ok: false; error: TrialError }> {
  if (input.honeypot.trim()) return { ok: false, error: 'honeypot' };
  const contact = input.contactName.trim().replace(/\s+/g, ' ');
  if ([...contact].length < 1 || [...contact].length > 80) return { ok: false, error: 'contact' };
  const email = input.email.trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 120) return { ok: false, error: 'email' };
  if (input.secret.length < 12 || input.secret.length > 200) return { ok: false, error: 'secret' };
  const origins = websiteOrigin(input.website);
  if (!origins) return { ok: false, error: 'website' };
  const base = slugFromName(input.name);
  if (!base) return { ok: false, error: 'name' };
  const id = await uniqueSlug(base);
  if (!id || await loadCuTenant(id)) return { ok: false, error: 'taken' };
  const short = input.name.trim().replace(/\s+/g, ' ').slice(0, 24).trim();
  const home = origins[0] ?? 'https://signorwalk.com';
  const profile = normalizeProfile({
    id,
    name: input.name,
    legalName: input.name,
    tagline: 'Check a vehicle offer',
    supportUrl: home,
    privacyUrl: home,
    preApprovalUrl: home,
    ratesUrl: home,
    embedOrigins: origins,
    status: 'active',
    shortName: short,
    contactName: contact,
    trialEndsAt: trialEnd(input.now),
    verified: false,
    tier: input.tier,
    loanLinksSet: false,
    onboardingStep: 1,
    onboardingComplete: false,
  });
  if (!profile) return { ok: false, error: 'name' };
  const confirmToken = randomBytes(32).toString('hex');
  const stored: StoredTenantProfile = {
    ...profile,
    confirmHash: createHash('sha256').update(confirmToken).digest('hex'),
  };
  await saveTenantProfile(stored, { shortName: short, primary: '#111111' });
  await saveStaffLogin(id, email, input.secret);
  return { ok: true, id, confirmToken };
}

/** Replaces the confirm hash. Does not mark the trial verified. */
export async function rotateConfirmToken(id: string): Promise<string | null> {
  const profile = await getTenantProfile(id);
  if (!profile || profile.verified !== false) return null;
  const confirmToken = randomBytes(32).toString('hex');
  profile.confirmHash = createHash('sha256').update(confirmToken).digest('hex');
  await saveTenantProfile(profile);
  return confirmToken;
}
